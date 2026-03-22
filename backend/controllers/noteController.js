const Note = require('../models/Note');
const User = require('../models/User');
const File = require('../models/File');
const Notification = require('../models/Notification');
const { sendPurchaseNotificationEmail, sendPaymentVerifiedEmail } = require('../utils/email');
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

// Create note
exports.createNote = async (req, res) => {
  try {
    const { title, description, category, subject, price, tags } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    // Save file to MongoDB
    const savedFile = await saveFileToDb(req.file, req.userId, 'note');

    const note = new Note({
      title,
      description,
      category,
      subject,
      price: parseFloat(price),
      seller: req.userId,
      fileUrl: `/api/files/${savedFile._id}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    });

    await note.save();
    await note.populate('seller', 'fullName email');

    res.status(201).json({ message: 'Note uploaded successfully!', note });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create note', error: error.message });
  }
};

// Get all notes (with filters & search)
exports.getNotes = async (req, res) => {
  try {
    const { search, category, subject, minPrice, maxPrice, sortBy, page = 1, limit = 12 } = req.query;
    
    let query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }
    if (category) query.category = category;
    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sortBy === 'price_low') sortOption = { price: 1 };
    else if (sortBy === 'price_high') sortOption = { price: -1 };
    else if (sortBy === 'popular') sortOption = { views: -1 };
    else if (sortBy === 'rating') sortOption = { 'feedback.rating': -1 };

    const total = await Note.countDocuments(query);
    const notesRaw = await Note.find(query)
      .populate('seller', 'fullName email bankName bankAccountNumber bankBranch accountHolderName')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Filter out notes where seller account was deleted
    const notes = notesRaw.filter(n => n.seller !== null);

    res.json({
      notes,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notes', error: error.message });
  }
};

// Get single note
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('seller', 'fullName email bankName bankAccountNumber bankBranch accountHolderName')
      .populate('feedback.user', 'fullName')
      .populate('purchases.buyer', 'fullName email');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Increment views
    note.views += 1;
    await note.save();

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch note', error: error.message });
  }
};

// Purchase note (upload payment slip)
exports.purchaseNote = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Payment slip is required' });
    }

    const note = await Note.findById(req.params.id).populate('seller', 'fullName email');
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const existingPurchase = note.purchases.find(
      p => p.buyer.toString() === req.userId.toString()
    );
    if (existingPurchase) {
      return res.status(400).json({ message: 'You have already purchased this note' });
    }

    if (note.seller._id.toString() === req.userId.toString()) {
      return res.status(400).json({ message: 'You cannot purchase your own note' });
    }

    // Save payment slip to MongoDB
    const savedSlip = await saveFileToDb(req.file, req.userId, 'payment-slip');

    note.purchases.push({
      buyer: req.userId,
      paymentSlip: `/api/files/${savedSlip._id}`,
      amount: note.price
    });

    await note.save();

    // Notify seller
    await Notification.create({
      recipient: note.seller._id,
      type: 'payment_received',
      title: 'New Purchase!',
      message: `${req.user.fullName} purchased "${note.title}". Please verify the payment.`,
      relatedNote: note._id,
      link: `/my-notes`
    });

    await sendPurchaseNotificationEmail(
      note.seller.email,
      note.seller.fullName,
      req.user.fullName,
      note.title
    );

    res.json({ message: 'Purchase submitted! Waiting for seller verification.' });
  } catch (error) {
    res.status(500).json({ message: 'Purchase failed', error: error.message });
  }
};

// Verify payment (seller action)
exports.verifyPayment = async (req, res) => {
  try {
    const { noteId, purchaseId } = req.params;

    const note = await Note.findById(noteId).populate('seller', 'fullName email');
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.seller._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Only the seller can verify payments' });
    }

    const purchase = note.purchases.id(purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    if (purchase.verified) {
      return res.status(400).json({ message: 'Payment already verified' });
    }

    purchase.verified = true;
    purchase.verifiedAt = new Date();

    const buyer = await User.findById(purchase.buyer);
    try {
      // Generate PDF receipt as buffer and save to DB
      const { buffer, filename } = await generateReceiptBuffer({
        buyerName: buyer.fullName,
        buyerEmail: buyer.email,
        itemTitle: note.title,
        itemType: 'note',
        amount: note.price,
        sellerName: note.seller.fullName,
        transactionId: purchaseId,
        date: purchase.purchaseDate
      });

      const receiptFile = new File({
        filename,
        originalName: `receipt-${purchaseId}.pdf`,
        contentType: 'application/pdf',
        data: buffer,
        size: buffer.length,
        uploadedBy: req.userId,
        category: 'receipt'
      });
      await receiptFile.save();

      purchase.receiptUrl = `/api/files/${receiptFile._id}`;

      // Send email with buffer attachment
      await sendPaymentVerifiedEmail(
        buyer.email,
        buyer.fullName,
        note.title,
        'note',
        buffer
      );
    } catch (emailErr) {
      console.error('Receipt/Email error:', emailErr);
    }

    await note.save();

    await Notification.create({
      recipient: purchase.buyer,
      type: 'payment_verified',
      title: 'Payment Verified! ✅',
      message: `Your payment for "${note.title}" has been verified. You can now download it.`,
      relatedNote: note._id,
      link: `/my-purchases`
    });

    res.json({ message: 'Payment verified successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};

// Bulk verify payments
exports.bulkVerifyPayments = async (req, res) => {
  try {
    const { noteId, purchaseIds } = req.body;
    
    const note = await Note.findById(noteId).populate('seller', 'fullName email');
    if (!note || note.seller._id.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    let verifiedCount = 0;
    for (const purchaseId of purchaseIds) {
      const purchase = note.purchases.id(purchaseId);
      if (purchase && !purchase.verified) {
        purchase.verified = true;
        purchase.verifiedAt = new Date();
        verifiedCount++;

        const buyer = await User.findById(purchase.buyer);
        if (buyer) {
          try {
            const { buffer, filename } = await generateReceiptBuffer({
              buyerName: buyer.fullName,
              buyerEmail: buyer.email,
              itemTitle: note.title,
              itemType: 'note',
              amount: note.price,
              sellerName: note.seller.fullName,
              transactionId: purchaseId,
              date: purchase.purchaseDate
            });

            const receiptFile = new File({
              filename,
              originalName: `receipt-${purchaseId}.pdf`,
              contentType: 'application/pdf',
              data: buffer,
              size: buffer.length,
              uploadedBy: req.userId,
              category: 'receipt'
            });
            await receiptFile.save();
            purchase.receiptUrl = `/api/files/${receiptFile._id}`;

            await sendPaymentVerifiedEmail(buyer.email, buyer.fullName, note.title, 'note', buffer);
          } catch (err) {
            console.error('Bulk verify email error:', err);
          }

          await Notification.create({
            recipient: purchase.buyer,
            type: 'payment_verified',
            title: 'Payment Verified! ✅',
            message: `Your payment for "${note.title}" has been verified.`,
            relatedNote: note._id,
            link: `/my-purchases`
          });
        }
      }
    }

    await note.save();
    res.json({ message: `${verifiedCount} payments verified successfully!` });
  } catch (error) {
    res.status(500).json({ message: 'Bulk verification failed', error: error.message });
  }
};

// Download note (only verified buyers)
exports.downloadNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const isSeller = note.seller.toString() === req.userId.toString();
    const purchase = note.purchases.find(
      p => p.buyer.toString() === req.userId.toString() && p.verified
    );

    if (note.price === 0 || isSeller || purchase) {
      note.downloads += 1;
      await note.save();

      // Extract file ID from URL: /api/files/<id>
      const fileId = note.fileUrl.split('/').pop();
      const file = await File.findById(fileId);

      if (!file) {
        return res.status(404).json({ message: 'File not found in database' });
      }

      res.set({
        'Content-Type': file.contentType,
        'Content-Length': file.size,
        'Content-Disposition': `attachment; filename="${file.originalName}"`
      });

      return res.send(file.data);
    }

    res.status(403).json({ message: 'You must purchase and have payment verified to download this note' });
  } catch (error) {
    res.status(500).json({ message: 'Download failed', error: error.message });
  }
};

// Get my notes (seller)
exports.getMyNotes = async (req, res) => {
  try {
    const notes = await Note.find({ seller: req.userId })
      .populate('purchases.buyer', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notes', error: error.message });
  }
};

// Get my purchases (buyer)
exports.getMyPurchases = async (req, res) => {
  try {
    const notes = await Note.find({ 'purchases.buyer': req.userId })
      .populate('seller', 'fullName email')
      .sort({ 'purchases.purchaseDate': -1 });

    const purchases = notes.map(note => {
      const myPurchase = note.purchases.find(
        p => p.buyer.toString() === req.userId.toString()
      );
      return {
        note: {
          _id: note._id,
          title: note.title,
          category: note.category,
          subject: note.subject,
          price: note.price,
          seller: note.seller,
          fileName: note.fileName
        },
        purchase: myPurchase
      };
    });

    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch purchases', error: error.message });
  }
};

// Add feedback
exports.addFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const existingFeedback = note.feedback.find(
      f => f.user.toString() === req.userId.toString()
    );
    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already given feedback' });
    }

    const purchase = note.purchases.find(
      p => p.buyer.toString() === req.userId.toString() && p.verified
    );
    if (!purchase && note.price > 0) {
      return res.status(403).json({ message: 'You must purchase this note before giving feedback' });
    }

    note.feedback.push({
      user: req.userId,
      rating: parseInt(rating),
      comment
    });

    await note.save();

    await Notification.create({
      recipient: note.seller,
      type: 'new_feedback',
      title: 'New Feedback',
      message: `${req.user.fullName} left a ${rating}-star review on "${note.title}"`,
      relatedNote: note._id
    });

    res.json({ message: 'Feedback added successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add feedback', error: error.message });
  }
};

// Toggle bookmark
exports.toggleBookmark = async (req, res) => {
  try {
    const noteId = req.params.id;
    const user = await User.findById(req.userId);
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const bookmarkIndex = user.bookmarks.indexOf(noteId);
    const noteBookmarkIndex = note.bookmarkedBy.indexOf(req.userId);

    if (bookmarkIndex > -1) {
      user.bookmarks.splice(bookmarkIndex, 1);
      if (noteBookmarkIndex > -1) note.bookmarkedBy.splice(noteBookmarkIndex, 1);
      await user.save();
      await note.save();
      res.json({ message: 'Bookmark removed', bookmarked: false });
    } else {
      user.bookmarks.push(noteId);
      note.bookmarkedBy.push(req.userId);
      await user.save();
      await note.save();
      res.json({ message: 'Note bookmarked!', bookmarked: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Bookmark failed', error: error.message });
  }
};

// Get bookmarked notes
exports.getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: 'bookmarks',
      populate: { path: 'seller', select: 'fullName' }
    });
    res.json(user.bookmarks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookmarks', error: error.message });
  }
};

// Update note
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note || note.seller.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { title, description, category, subject, price, tags } = req.body;
    if (title) note.title = title;
    if (description) note.description = description;
    if (category) note.category = category;
    if (subject) note.subject = subject;
    if (price !== undefined) note.price = parseFloat(price);
    if (tags) note.tags = tags.split(',').map(t => t.trim());

    await note.save();
    res.json({ message: 'Note updated', note });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};

// Delete note
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note || note.seller.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    note.isActive = false;
    await note.save();
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};