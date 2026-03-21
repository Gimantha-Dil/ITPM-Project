const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const { auth, requireBankDetails } = require('../middleware/auth');
const { uploadNote, uploadPaymentSlip } = require('../middleware/upload');

// IMPORTANT: /user/* and /bulk-* routes MUST come BEFORE /:id routes
// Otherwise Express treats "user" as an :id parameter

// My notes, purchases, bookmarks (must be first!)
router.get('/user/my-notes', auth, noteController.getMyNotes);
router.get('/user/my-purchases', auth, noteController.getMyPurchases);
router.get('/user/bookmarks', auth, noteController.getBookmarks);

// Bulk verify
router.post('/bulk-verify', auth, noteController.bulkVerifyPayments);

// Public routes
router.get('/', noteController.getNotes);

// Create note
router.post('/', auth, requireBankDetails, uploadNote.single('file'), noteController.createNote);

// Single note routes (/:id MUST come AFTER /user/*)
router.get('/:id', noteController.getNoteById);
router.put('/:id', auth, noteController.updateNote);
router.delete('/:id', auth, noteController.deleteNote);

// Purchase & Download
router.post('/:id/purchase', auth, uploadPaymentSlip.single('paymentSlip'), noteController.purchaseNote);
router.get('/:id/download', auth, noteController.downloadNote);

// Verify
router.put('/:noteId/verify/:purchaseId', auth, noteController.verifyPayment);

// Feedback
router.post('/:id/feedback', auth, noteController.addFeedback);

// Bookmarks toggle
router.post('/:id/bookmark', auth, noteController.toggleBookmark);

module.exports = router;
