const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paymentSlip: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  amount: Number,
  receiptUrl: String
});

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['IT', 'SE', 'CS', 'DS', 'Business', 'Engineering', 'Other']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: {
    type: String,
    required: [true, 'File is required']
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: Number,
  fileType: String,
  thumbnail: String,
  downloads: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  purchases: [purchaseSchema],
  feedback: [feedbackSchema],
  bookmarkedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String]
}, {
  timestamps: true
});

// Average rating virtual
noteSchema.virtual('averageRating').get(function() {
  if (!this.feedback || this.feedback.length === 0) return 0;
  const sum = this.feedback.reduce((acc, f) => acc + f.rating, 0);
  return (sum / this.feedback.length).toFixed(1);
});

noteSchema.virtual('totalPurchases').get(function() {
  return this.purchases ? this.purchases.length : 0;
});

noteSchema.set('toJSON', { virtuals: true });
noteSchema.set('toObject', { virtuals: true });

// Text index for search
noteSchema.index({ title: 'text', description: 'text', subject: 'text', tags: 'text' });

module.exports = mongoose.model('Note', noteSchema);