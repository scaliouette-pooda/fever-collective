const mongoose = require('mongoose');

const waiverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  waiverType: {
    type: String,
    enum: ['general', 'event-specific', 'minor'],
    default: 'general'
  },
  waiverText: {
    type: String,
    required: true
  },
  signature: {
    type: String, // Base64 encoded signature image or typed name
    required: true
  },
  signatureType: {
    type: String,
    enum: ['drawn', 'typed'],
    default: 'typed'
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  },
  agreedToTerms: {
    type: Boolean,
    required: true,
    default: false
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  // For minors - parent/guardian information
  guardianName: {
    type: String
  },
  guardianRelationship: {
    type: String
  },
  dateOfBirth: {
    type: Date
  },
  isMinor: {
    type: Boolean,
    default: false
  },
  signedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  }
});

// Index for quick lookups
waiverSchema.index({ userId: 1, waiverType: 1 });
waiverSchema.index({ email: 1 });
waiverSchema.index({ signedAt: -1 });

// Check if waiver is still valid
waiverSchema.methods.isValid = function() {
  if (!this.expiresAt) return true;
  return new Date() < this.expiresAt;
};

module.exports = mongoose.model('Waiver', waiverSchema);
