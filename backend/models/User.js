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
  // Bank details - NOT required at registration, required for selling
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
  }
}, {
  timestamps: true
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if bank details are filled
userSchema.methods.hasBankDetails = function() {
  return !!(this.bankName && this.bankAccountNumber && this.bankBranch && this.accountHolderName);
};

// Remove password from JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
