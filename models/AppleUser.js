const mongoose = require('mongoose');

const appleUserSchema = mongoose.Schema({
  appleUserId: { type: String, required: true, unique: true }, // stable ID from Apple
  identityToken: { type: String }, // latest token (optional)
  email: { type: String }, // only available first-time
  fullName: {
    givenName: String,
    familyName: String,
  },
  isVerified: { type: Boolean, default: false }, // backend verification status
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AppleUser', appleUserSchema);
