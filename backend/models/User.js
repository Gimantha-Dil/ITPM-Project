const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[a-zA-Z0-9._%+-]+@my\.sliit\.lk$/.test(v);
      },
      message: 'Only SLIIT email addresses (@my.sliit.lk) are allowed'
    }
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bankName: {
    type: String,
    default: ''
  },
  bankAccountNumber: {
    type: String,
    default: ''
  },
  bankBranch: {
    type: String,
    default: ''
  },
  accountHolderName: {
    type: String,
    default: ''
  },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note'
  }],
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailOtp: {
    code: String,
    expiresAt: Date
  },
  resetPasswordOtp: {
    code: String,
    expiresAt: Date
  }
}, {
  timestamps: true
});

// Hash password before save — no next(), use Promise style
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if bank details are filled
userSchema.methods.hasBankDetails = function() {
  return !!(this.bankName && this.bankAccountNumber && this.bankBranch && this.accountHolderName);
};

// Remove password from JSON output
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);