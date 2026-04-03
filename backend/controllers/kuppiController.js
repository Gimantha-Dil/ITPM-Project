const KuppiSession = require('../models/KuppiSession');
const User = require('../models/User');
const File = require('../models/File');
const Notification = require('../models/Notification');
const { sendPurchaseNotificationEmail, sendPaymentVerifiedEmail, sendPaymentRejectedEmail } = require('../utils/email');
const { generateReceiptBuffer } = require('../utils/pdfGenerator');

// Helper: Save uploaded file to MongoDB
const saveFileToDb = async (reqFile, userId, category) => {
  const file = new File({
    filename: `${category}-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
    originalName: reqFile.originalname,
    contentType: reqFile.mimetype,
    data: reqFile.buffer,
    size: reqFile.size,
    uploadedBy: userId,
    category
  });
  await file.save();
  return file;
};

// Create session
exports.createSession = async (req, res) => {
  try {
    const { title, description, sessionType, category, subject, price, msTeamsLink, date, startTime, duration, maxParticipants } = req.body;

    const session = new KuppiSession({
      title,
      description,
      sessionType,
      category,
      subject,
      price: parseFloat(price) || 0,
      host: req.userId,
      msTeamsLink,
      date,
      startTime,
      duration: parseInt(duration) || 60,
      maxParticipants: parseInt(maxParticipants) || 50
    });

    await session.save();
    await session.populate('host', 'fullName email');

    res.status(201).json({ message: 'Session created successfully!', session });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create session', error: error.message });
  }
};

// Get all sessions
exports.getSessions = async (req, res) => {
  try {
    const { search, category, sessionType, status, sortBy, page = 1, limit = 12 } = req.query;
    
    let query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }
    if (category) query.category = category;
    if (sessionType) query.sessionType = sessionType;
    if (status) query.status = status;

    let sortOption = { date: 1 };
    if (sortBy === 'price_low') sortOption = { price: 1 };
    else if (sortBy === 'price_high') sortOption = { price: -1 };
    else if (sortBy === 'newest') sortOption = { createdAt: -1 };

    const total = await KuppiSession.countDocuments(query);
    const sessionsRaw = await KuppiSession.find(query)
      .populate('host', 'fullName email bankName bankAccountNumber bankBranch accountHolderName')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Filter out sessions where host account was deleted
    const sessions = sessionsRaw.filter(s => s.host !== null);

    res.json({
      sessions,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sessions', error: error.message });
  }
};

// Get single session
exports.getSessionById = async (req, res) => {
  try {
    const session = await KuppiSession.findById(req.params.id)
      .populate('host', 'fullName email bankName bankAccountNumber bankBranch accountHolderName')
      .populate('feedback.user', 'fullName')
      .populate('enrollments.student', 'fullName email');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch session', error: error.message });
  }
};

// Enroll in session
exports.enrollSession = async (req, res) => {
  try {
    const session = await KuppiSession.findById(req.params.id).populate('host', 'fullName email');
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const existing = session.enrollments.find(
      e => e.student.toString() === req.userId.toString()
    );
    if (existing) {
      return res.status(400).json({ message: 'Already enrolled' });
    }

    if (session.host._id.toString() === req.userId.toString()) {
      return res.status(400).json({ message: 'Cannot enroll in your own session' });
    }

    if (session.enrollments.length >= session.maxParticipants) {
      return res.status(400).json({ message: 'Session is full' });
    }

    // Free sessions - auto verify
    if (session.price === 0) {
      session.enrollments.push({
        student: req.userId,
        paymentSlip: 'free',
        verified: true,
        verifiedAt: new Date(),
        amount: 0
      });
      await session.save();
      return res.json({ message: 'Enrolled successfully! (Free session)' });
    }

    // Paid session - need payment slip
    if (!req.file) {
      return res.status(400).json({ message: 'Payment slip is required for paid sessions' });
    }

    // Save payment slip to MongoDB
    const savedSlip = await saveFileToDb(req.file, req.userId, 'payment-slip');

    session.enrollments.push({
      student: req.userId,
      paymentSlip: `/api/files/${savedSlip._id}`,
      amount: session.price
    });

    await session.save();

    await Notification.create({
      recipient: session.host._id,
      type: 'enrollment',
      title: 'New Enrollment!',
      message: `${req.user.fullName} enrolled in "${session.title}". Please verify payment.`,
      relatedSession: session._id
    });

    await sendPurchaseNotificationEmail(
      session.host.email,
      session.host.fullName,
      req.user.fullName,
      session.title
    );

    res.json({ message: 'Enrollment submitted! Waiting for host verification.' });
  } catch (error) {
    res.status(500).json({ message: 'Enrollment failed', error: error.message });
  }
};

// Verify enrollment payment
exports.verifyEnrollment = async (req, res) => {
  try {
    const { sessionId, enrollmentId } = req.params;

    const session = await KuppiSession.findById(sessionId).populate('host', 'fullName email');
    if (!session || session.host._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const enrollment = session.enrollments.id(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (enrollment.verified) {
      return res.status(400).json({ message: 'Already verified' });
    }

    enrollment.verified = true;
    enrollment.verifiedAt = new Date();

    const student = await User.findById(enrollment.student);
    if (student) {
      try {
        const { buffer, filename } = await generateReceiptBuffer({
          buyerName: student.fullName,
          buyerEmail: student.email,
          itemTitle: session.title,
          itemType: 'session',
          amount: session.price,
          sellerName: session.host.fullName,
          transactionId: enrollmentId,
          date: enrollment.enrolledAt
        });

        const receiptFile = new File({
          filename,
          originalName: `receipt-${enrollmentId}.pdf`,
          contentType: 'application/pdf',
          data: buffer,
          size: buffer.length,
          uploadedBy: req.userId,
          category: 'receipt'
        });
        await receiptFile.save();
        enrollment.receiptUrl = `/api/files/${receiptFile._id}`;

        await sendPaymentVerifiedEmail(student.email, student.fullName, session.title, 'session', buffer);
      } catch (err) {
        console.error('Receipt/Email error:', err);
      }

      await Notification.create({
        recipient: enrollment.student,
        type: 'payment_verified',
        title: 'Enrollment Verified! ',
        message: `Your enrollment for "${session.title}" has been verified.`,
        relatedSession: session._id
      });
    }

    await session.save();
    res.json({ message: 'Enrollment verified!' });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};

// Reject enrollment slip (host action)
exports.rejectEnrollment = async (req, res) => {
  try {
    const { sessionId, enrollmentId } = req.params;

    const session = await KuppiSession.findById(sessionId).populate('host', 'fullName email');
    if (!session || session.host._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const enrollment = session.enrollments.id(enrollmentId);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    enrollment.verified = false;
    enrollment.rejected = true;
    enrollment.rejectedAt = new Date();
    enrollment.verifiedAt = undefined;
    enrollment.receiptUrl = undefined;

    await session.save();

    // Send rejection email to student
    try {
      const student = await User.findById(enrollment.student);
      if (student) {
        await sendPaymentRejectedEmail(
          student.email,
          student.fullName,
          session.title,
          'session',
          session._id
        );
      }
    } catch (emailErr) {
      console.error('Rejection email error:', emailErr);
    }

    await Notification.create({
      recipient: enrollment.student,
      type: 'payment_unverified',
      title: 'Payment Slip Rejected ❌',
      message: `Your payment slip for "${session.title}" was rejected. Please re-upload a valid slip.`,
      relatedSession: session._id,
      link: `/kuppi-sessions/${session._id}`
    });

    res.json({ message: 'Enrollment rejected. Student notified.' });
  } catch (error) {
    res.status(500).json({ message: 'Reject failed', error: error.message });
  }
};

// Re-upload enrollment slip (student action)
exports.reuploadEnrollmentSlip = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Payment slip is required' });

    const session = await KuppiSession.findById(req.params.id).populate('host', 'fullName email');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const enrollment = session.enrollments.find(
      e => e.student.toString() === req.userId.toString()
    );

    if (!enrollment) return res.status(404).json({ message: 'No enrollment found' });
    if (enrollment.verified) return res.status(400).json({ message: 'Already verified' });

    const savedSlip = await saveFileToDb(req.file, req.userId, 'payment-slip');
    enrollment.paymentSlip = `/api/files/${savedSlip._id}`;
    enrollment.rejected = false;
    enrollment.rejectedAt = undefined;

    await session.save();

    await Notification.create({
      recipient: session.host._id,
      type: 'payment_received',
      title: 'Payment Slip Re-submitted',
      message: `${req.user.fullName} has re-uploaded a payment slip for "${session.title}". Please verify.`,
      relatedSession: session._id,
      link: '/my-sessions'
    });

    res.json({ message: 'Payment slip re-submitted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Re-upload failed', error: error.message });
  }
};

// Get my sessions (host)
exports.getMySessions = async (req, res) => {
  try {
    const sessions = await KuppiSession.find({ host: req.userId, isActive: true })
      .populate('enrollments.student', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sessions', error: error.message });
  }
};

// Get my enrollments
exports.getMyEnrollments = async (req, res) => {
  try {
    const sessions = await KuppiSession.find({ 'enrollments.student': req.userId })
      .populate('host', 'fullName email')
      .sort({ date: -1 });

    const enrollments = sessions.map(session => {
      const myEnrollment = session.enrollments.find(
        e => e.student.toString() === req.userId.toString()
      );
      return {
        session: {
          _id: session._id,
          title: session.title,
          category: session.category,
          subject: session.subject,
          price: session.price,
          host: session.host,
          date: session.date,
          startTime: session.startTime,
          msTeamsLink: session.msTeamsLink,
          status: session.status
        },
        enrollment: myEnrollment
      };
    });

    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch enrollments', error: error.message });
  }
};

// Add feedback
exports.addFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const session = await KuppiSession.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const existingFeedback = session.feedback.find(
      f => f.user.toString() === req.userId.toString()
    );
    if (existingFeedback) {
      return res.status(400).json({ message: 'Already gave feedback' });
    }

    session.feedback.push({
      user: req.userId,
      rating: parseInt(rating),
      comment
    });

    await session.save();

    await Notification.create({
      recipient: session.host,
      type: 'new_feedback',
      title: 'New Feedback',
      message: `${req.user.fullName} left a ${rating}-star review on "${session.title}"`,
      relatedSession: session._id
    });

    res.json({ message: 'Feedback added!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add feedback', error: error.message });
  }
};

// Update session
exports.updateSession = async (req, res) => {
  try {
    const session = await KuppiSession.findById(req.params.id);
    if (!session || session.host.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) session[key] = updates[key];
    });

    await session.save();
    res.json({ message: 'Session updated', session });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// Delete session
exports.deleteSession = async (req, res) => {
  try {
    const session = await KuppiSession.findById(req.params.id);
    if (!session || session.host.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    session.isActive = false;
    session.status = 'cancelled';
    await session.save();
    res.json({ message: 'Session cancelled' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};