 const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
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
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  amount: Number,
  receiptUrl: String
});

const sessionFeedbackSchema = new mongoose.Schema({
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

const kuppiSessionSchema = new mongoose.Schema({
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
  sessionType: {
    type: String,
    required: [true, 'Session type is required'],
    enum: ['A', 'B', 'C', 'D'],
    // A = Free, B = Paid Individual, C = Paid Group, D = Premium
  },
  category: {
    type: String,
    required: true,
    enum: ['IT', 'SE', 'CS', 'DS', 'Business', 'Engineering', 'Other']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  msTeamsLink: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Session date is required']
  },
  startTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    default: 60
  },
  maxParticipants: {
    type: Number,
    default: 50
  },
  enrollments: [enrollmentSchema],
  feedback: [sessionFeedbackSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'cancelled'],
    default: 'upcoming'
  }
}, {
  timestamps: true
});

kuppiSessionSchema.virtual('averageRating').get(function() {
  if (!this.feedback || this.feedback.length === 0) return 0;
  const sum = this.feedback.reduce((acc, f) => acc + f.rating, 0);
  return (sum / this.feedback.length).toFixed(1);
});

kuppiSessionSchema.virtual('totalEnrollments').get(function() {
  return this.enrollments ? this.enrollments.length : 0;
});

kuppiSessionSchema.set('toJSON', { virtuals: true });
kuppiSessionSchema.set('toObject', { virtuals: true });

kuppiSessionSchema.index({ title: 'text', description: 'text', subject: 'text' });

module.exports = mongoose.model('KuppiSession', kuppiSessionSchema);