const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  contentType: { type: String, required: true },
  data: { type: Buffer, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  category: { type: String, enum: ['note', 'payment-slip', 'thumbnail', 'receipt', 'report'], default: 'note' }
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
