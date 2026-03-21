const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Note = require('../models/Note');
const KuppiSession = require('../models/KuppiSession');

// Get payment history for a user
router.get('/history', auth, async (req, res) => {
  try {
    // Notes purchases
    const notes = await Note.find({ 'purchases.buyer': req.userId })
      .populate('seller', 'fullName')
      .select('title price purchases');

    const notePurchases = notes.map(note => {
      const purchase = note.purchases.find(p => p.buyer.toString() === req.userId.toString());
      return {
        type: 'note',
        itemTitle: note.title,
        amount: note.price,
        seller: note.seller?.fullName,
        date: purchase.purchaseDate,
        verified: purchase.verified,
        receiptUrl: purchase.receiptUrl
      };
    });

    // Session enrollments
    const sessions = await KuppiSession.find({ 'enrollments.student': req.userId })
      .populate('host', 'fullName')
      .select('title price enrollments');

    const sessionPayments = sessions.map(session => {
      const enrollment = session.enrollments.find(e => e.student.toString() === req.userId.toString());
      return {
        type: 'session',
        itemTitle: session.title,
        amount: session.price,
        seller: session.host?.fullName,
        date: enrollment.enrolledAt,
        verified: enrollment.verified,
        receiptUrl: enrollment.receiptUrl
      };
    });

    const allPayments = [...notePurchases, ...sessionPayments]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(allPayments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payment history', error: error.message });
  }
});

module.exports = router;
