const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sriLankanBanks = require('../utils/banks');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register
exports.register = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password } = req.body;

    // Validate SLIIT email
    if (!email.endsWith('@my.sliit.lk')) {
      return res.status(400).json({ message: 'Only SLIIT email addresses (@my.sliit.lk) are allowed' });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user (NO bank details required)
    const user = new User({ fullName, email, phoneNumber, password });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful!',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Get profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get profile', error: error.message });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, bankName, bankAccountNumber, bankBranch, accountHolderName } = req.body;
    
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
    if (bankBranch !== undefined) updateData.bankBranch = bankBranch;
    if (accountHolderName !== undefined) updateData.accountHolderName = accountHolderName;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Profile update failed', error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Password change failed', error: error.message });
  }
};

// Get bank list
exports.getBanks = (req, res) => {
  res.json(sriLankanBanks);
};

// Check bank details status
exports.checkBankDetails = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({
      hasBankDetails: user.hasBankDetails(),
      bankName: user.bankName || '',
      bankBranch: user.bankBranch || ''
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to check bank details', error: error.message });
  }
};
