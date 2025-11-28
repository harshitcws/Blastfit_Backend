// models/Photo.js
const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  type: { type: String, required: true }, // 'frontBefore', 'frontAfter', etc
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Ensure unique by userId+date+type
PhotoSchema.index({ userId: 1, date: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Photo', PhotoSchema);