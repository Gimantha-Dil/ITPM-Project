const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const KuppiSession = require('../models/KuppiSession');

// Get payment history — no auth required for Live Viewer admin use
router.get('/history', async (req, res) => {
  try {
    let userId = null;

    // Try to get userId from token if provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        userId = decoded.userId || decoded.id;
      } catch(e) {
        // Token invalid — continue without userId
      }
    }

    let notePurchases = [], sessionPayments = [];

    if (userId) {
      // Notes purchases for this user
      const notes = await Note.find({ 'purchases.buyer': userId })
        .populate('seller', 'fullName')
        .populate('purchases.buyer', 'fullName email')
        .select('title price purchases seller');

      notePurchases = notes.map(note => {
        const purchase = note.purchases.find(p => p.buyer?._id?.toString() === userId.toString());
        return {
          type: 'note',
          itemTitle: note.title,
          amount: note.price,
          seller: note.seller?.fullName,
          buyerName: purchase?.buyer?.fullName,
          buyerEmail: purchase?.buyer?.email,
          date: purchase?.purchaseDate,
          verified: purchase?.verified,
          receiptUrl: purchase?.receiptUrl
        };
      });

      // Session enrollments for this user
      const sessions = await KuppiSession.find({ 'enrollments.student': userId })
        .populate('host', 'fullName')
        .populate('enrollments.student', 'fullName email')
        .select('title price enrollments host');

      sessionPayments = sessions.map(session => {
        const enrollment = session.enrollments.find(e => e.student?._id?.toString() === userId.toString());
        return {
          type: 'session',
          itemTitle: session.title,
          amount: session.price,
          seller: session.host?.fullName,
          buyerName: enrollment?.student?.fullName,
          buyerEmail: enrollment?.student?.email,
          date: enrollment?.enrolledAt,
          verified: enrollment?.verified,
          receiptUrl: enrollment?.receiptUrl
        };
      });
    } else {
      // No valid token — return ALL payments for Live Viewer admin use
      const allNotes = await Note.find({ 'purchases.0': { $exists: true } })
        .populate('seller', 'fullName')
        .populate('purchases.buyer', 'fullName email')
        .select('title price purchases seller');

      allNotes.forEach(note => {
        note.purchases.forEach(purchase => {
          notePurchases.push({
            type: 'note',
            itemTitle: note.title,
            amount: note.price,
            seller: note.seller?.fullName,
            buyerName: purchase?.buyer?.fullName || 'Unknown',
            buyerEmail: purchase?.buyer?.email || '-',
            date: purchase?.purchaseDate,
            verified: purchase?.verified
          });
        });
      });

      const allSessions = await KuppiSession.find({ 'enrollments.0': { $exists: true } })
        .populate('host', 'fullName')
        .populate('enrollments.student', 'fullName email')
        .select('title price enrollments host');

      allSessions.forEach(session => {
        session.enrollments.forEach(enrollment => {
          sessionPayments.push({
            type: 'session',
            itemTitle: session.title,
            amount: session.price,
            seller: session.host?.fullName,
            buyerName: enrollment?.student?.fullName || 'Unknown',
            buyerEmail: enrollment?.student?.email || '-',
            date: enrollment?.enrolledAt,
            verified: enrollment?.verified
          });
        });
      });
    }

    const allPayments = [...notePurchases, ...sessionPayments]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(allPayments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payment history', error: error.message });
  }
});

module.exports = router;