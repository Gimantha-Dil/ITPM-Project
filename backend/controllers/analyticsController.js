const Note = require('../models/Note');
const KuppiSession = require('../models/KuppiSession');
const User = require('../models/User');
const { generateSalesReportBuffer } = require('../utils/excel');

// Get seller analytics
exports.getSellerAnalytics = async (req, res) => {
  try {
    const notes = await Note.find({ seller: req.userId, isActive: true });
    const sessions = await KuppiSession.find({ host: req.userId, isActive: true });

    const totalNotes = notes.length;
    const totalSessions = sessions.length;
    
    let totalNoteSales = 0;
    let totalNoteRevenue = 0;
    let pendingNotePayments = 0;
    let totalViews = 0;
    let totalDownloads = 0;

    notes.forEach(note => {
      const verified = note.purchases.filter(p => p.verified).length;
      const pending = note.purchases.filter(p => !p.verified).length;
      totalNoteSales += verified;
      pendingNotePayments += pending;
      totalNoteRevenue += verified * note.price;
      totalViews += note.views || 0;
      totalDownloads += note.downloads || 0;
    });

    let totalSessionEnrollments = 0;
    let totalSessionRevenue = 0;
    let pendingSessionPayments = 0;

    sessions.forEach(session => {
      const verified = session.enrollments.filter(e => e.verified).length;
      const pending = session.enrollments.filter(e => !e.verified).length;
      totalSessionEnrollments += verified;
      pendingSessionPayments += pending;
      totalSessionRevenue += verified * session.price;
    });

    const noteRatings = notes.flatMap(n => n.feedback.map(f => f.rating));
    const sessionRatings = sessions.flatMap(s => s.feedback.map(f => f.rating));
    const allRatings = [...noteRatings, ...sessionRatings];
    const avgRating = allRatings.length > 0
      ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
      : 0;

    res.json({
      stats: {
        totalNotes,
        totalSessions,
        totalNoteSales,
        totalSessionEnrollments,
        totalNoteRevenue,
        totalSessionRevenue,
        totalRevenue: totalNoteRevenue + totalSessionRevenue,
        pendingPayments: pendingNotePayments + pendingSessionPayments,
        totalViews,
        totalDownloads,
        averageRating: parseFloat(avgRating),
        totalFeedback: allRatings.length
      },
      recentNotes: notes.slice(0, 5),
      recentSessions: sessions.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get analytics', error: error.message });
  }
};

// Export Excel report (buffer, no file system)
exports.exportReport = async (req, res) => {
  try {
    const notes = await Note.find({ seller: req.userId });
    const sessions = await KuppiSession.find({ host: req.userId });
    const user = await User.findById(req.userId);

    const buffer = await generateSalesReportBuffer(notes, sessions, user.fullName);
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=sales-report-${Date.now()}.xlsx`,
      'Content-Length': buffer.length
    });

    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
};

// Get buyer analytics
exports.getBuyerAnalytics = async (req, res) => {
  try {
    const purchasedNotes = await Note.find({ 'purchases.buyer': req.userId });
    const enrolledSessions = await KuppiSession.find({ 'enrollments.student': req.userId });

    let totalSpent = 0;
    let verifiedPurchases = 0;
    let pendingPurchases = 0;

    purchasedNotes.forEach(note => {
      const myPurchase = note.purchases.find(p => p.buyer.toString() === req.userId.toString());
      if (myPurchase) {
        if (myPurchase.verified) {
          verifiedPurchases++;
          totalSpent += note.price;
        } else {
          pendingPurchases++;
        }
      }
    });

    enrolledSessions.forEach(session => {
      const myEnrollment = session.enrollments.find(e => e.student.toString() === req.userId.toString());
      if (myEnrollment && myEnrollment.verified) {
        totalSpent += session.price;
      }
    });

    res.json({
      totalPurchasedNotes: purchasedNotes.length,
      totalEnrolledSessions: enrolledSessions.length,
      totalSpent,
      verifiedPurchases,
      pendingPurchases
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get analytics', error: error.message });
  }
};
