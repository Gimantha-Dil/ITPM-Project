const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');

router.get('/seller', auth, analyticsController.getSellerAnalytics);
router.get('/buyer', auth, analyticsController.getBuyerAnalytics);
router.get('/export', auth, analyticsController.exportReport);

module.exports = router;
