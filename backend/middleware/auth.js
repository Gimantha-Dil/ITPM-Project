const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Middleware to check if user has bank details (for selling)
const requireBankDetails = async (req, res, next) => {
  if (!req.user.hasBankDetails()) {
    return res.status(403).json({ 
      message: 'Bank details are required before selling. Please update your bank details in Profile.',
      requireBankDetails: true
    });
  }
  next();
};

module.exports = { auth, requireBankDetails };

