const express = require('express');
const router = express.Router();
const kuppiController = require('../controllers/kuppiController');
const { auth, requireBankDetails } = require('../middleware/auth');
const { uploadPaymentSlip } = require('../middleware/upload');

// IMPORTANT: /user/* routes MUST be before /:id

// My sessions & enrollments
router.get('/user/my-sessions', auth, kuppiController.getMySessions);
router.get('/user/my-enrollments', auth, kuppiController.getMyEnrollments);

// Public
router.get('/', kuppiController.getSessions);

// Create session
router.post('/', auth, requireBankDetails, kuppiController.createSession);

// Single session routes (/:id MUST come AFTER /user/*)
router.get('/:id', kuppiController.getSessionById);
router.put('/:id', auth, kuppiController.updateSession);
router.delete('/:id', auth, kuppiController.deleteSession);

// Enroll
router.post('/:id/enroll', auth, uploadPaymentSlip.single('paymentSlip'), kuppiController.enrollSession);

// Verify
router.put('/:sessionId/verify/:enrollmentId', auth, kuppiController.verifyEnrollment);

// Feedback
router.post('/:id/feedback', auth, kuppiController.addFeedback);

module.exports = router;
