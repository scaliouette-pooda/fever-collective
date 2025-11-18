const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  spots: {
    type: Number,
    required: true,
    min: 1
  },
  // Ticket tier information
  ticketTierId: {
    type: mongoose.Schema.Types.ObjectId
  },
  ticketTierName: {
    type: String
  },
  ticketTierPrice: {
    type: Number
  },
  totalAmount: {
    type: Number,
    required: true
  },
  originalAmount: {
    type: Number
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  promoCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PromoCode'
  },
  promoCodeUsed: {
    type: String
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referralCodeUsed: {
    type: String
  },
  referralDiscount: {
    type: Number,
    default: 0
  },
  // Booking Source Tracking
  bookingSource: {
    type: String,
    enum: ['direct', 'classpass', 'membership', 'referral'],
    default: 'direct'
  },
  classPassBookingId: {
    type: String,
    sparse: true  // Only index when present
  },
  classPassPayout: {
    type: Number  // Track actual payout received from ClassPass
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: {
    type: Date
  },
  sendSMS: {
    type: Boolean,
    default: true  // Default to true since phone is already required
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String
  },
  confirmationNumber: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'pending'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate confirmation number before saving
bookingSchema.pre('save', function(next) {
  if (!this.confirmationNumber) {
    // Format: FC + first 6 chars of ID + last 4 digits of timestamp
    this.confirmationNumber = `FC${this._id.toString().substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
