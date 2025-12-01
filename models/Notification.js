const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  type: { 
    type: String, 
    required: true,
    enum: ['plan_request', 'progress_update', 'plan_accepted', 'plan_rejected']
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: {
    planId: String,
    type: String,
    shareType: String,
    senderId: String,
    senderName: String
  },
  read: { type: Boolean, default: false },
  readAt: { type: Date }
}, {
  timestamps: true
});

// Index for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
