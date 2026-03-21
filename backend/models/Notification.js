const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'purchase', 'payment_verified', 'new_feedback',
      'new_message', 'session_reminder', 'system',
      'payment_received', 'enrollment'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  relatedNote: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note'
  },
  relatedSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KuppiSession'
  },
  read: {
    type: Boolean,
    default: false
  },
  link: String
}, {
  timestamps: true
});

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
