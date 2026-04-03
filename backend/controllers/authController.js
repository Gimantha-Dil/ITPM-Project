const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sriLankanBanks = require('../utils/banks');
const { sendOtpEmail } = require('../utils/resendEmail');
const bcrypt = require('bcryptjs');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register — send OTP
exports.register = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password } = req.body;

    if (!email.endsWith('@my.sliit.lk')) {
      return res.status(400).json({ message: 'Only SLIIT email addresses (@my.sliit.lk) are allowed' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    if (existingUser && !existingUser.isEmailVerified) {
      // Update existing unverified user
      existingUser.fullName = fullName;
      existingUser.phoneNumber = phoneNumber;
      existingUser.password = password;
      existingUser.emailOtp = { code: otp, expiresAt };
      await existingUser.save();
    } else {
      const user = new User({
        fullName, email, phoneNumber, password,
        isEmailVerified: false,
        emailOtp: { code: otp, expiresAt }
      });
      await user.save();
    }

    await sendOtpEmail(email, fullName, otp, 'verify');

    res.status(201).json({ message: 'OTP sent to your email. Please verify.', email });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Verify OTP — complete registration
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isEmailVerified) return res.status(400).json({ message: 'Email already verified' });
    if (!user.emailOtp?.code) return res.status(400).json({ message: 'No OTP found. Please register again.' });
    if (new Date() > user.emailOtp.expiresAt) return res.status(400).json({ message: 'OTP expired. Please register again.' });
    if (user.emailOtp.code !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    user.isEmailVerified = true;
    user.emailOtp = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.json({ message: 'Email verified! Welcome!', token, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};

// Resend OTP
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isEmailVerified) return res.status(400).json({ message: 'Email already verified' });

    const otp = generateOtp();
    user.emailOtp = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save();

    await sendOtpEmail(email, user.fullName, otp, 'verify');
    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Resend failed', error: error.message });
  }
};

// Forgot Password — send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    const otp = generateOtp();
    user.resetPasswordOtp = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save();

    await sendOtpEmail(email, user.fullName, otp, 'reset');
    res.json({ message: 'Password reset OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

// Reset Password — verify OTP + set new password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.resetPasswordOtp?.code) return res.status(400).json({ message: 'No reset OTP found' });
    if (new Date() > user.resetPasswordOtp.expiresAt) return res.status(400).json({ message: 'OTP expired' });
    if (user.resetPasswordOtp.code !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    await user.save();

    res.json({ message: 'Password reset successful! You can now login.' });
  } catch (error) {
    res.status(500).json({ message: 'Reset failed', error: error.message });
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

// Send OTP for account deletion
exports.sendDeleteOtp = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOtp();
    user.resetPasswordOtp = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    await user.save();

    await sendOtpEmail(user.email, user.fullName, otp, 'reset');
    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

// Delete account with OTP verification
exports.deleteAccount = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.resetPasswordOtp?.code) return res.status(400).json({ message: 'No OTP found. Please request again.' });
    if (new Date() > user.resetPasswordOtp.expiresAt) return res.status(400).json({ message: 'OTP expired' });
    if (user.resetPasswordOtp.code !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message });
  }
};