const mongoose = require('mongoose');

const emailListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['static', 'dynamic'],
    default: 'static',
    required: true
  },
  // For static lists - manually added emails
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailSubscriber'
  }],
  // For dynamic lists - auto-populate based on criteria
  dynamicCriteria: {
    membershipTiers: [{
      type: String,
      enum: ['fever-starter', 'outbreak', 'epidemic']
    }],
    bookingStatus: {
      type: String,
      enum: ['never_booked', 'has_booked', 'recent_booking', 'inactive']
    },
    inactiveDays: Number, // For inactive users
    minBookings: Number,
    maxBookings: Number,
    hasActiveMembership: Boolean,
    expiringCredits: Boolean, // Credits expiring in next 30 days
    expiringMembership: Boolean, // Membership expiring in next 7 days
    birthdayMonth: Number // 1-12 for birthday campaigns
  },
  subscriberCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
emailListSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to get subscribers for dynamic lists
emailListSchema.methods.getDynamicSubscribers = async function() {
  if (this.type !== 'dynamic') {
    return [];
  }

  const EmailSubscriber = mongoose.model('EmailSubscriber');
  const User = mongoose.model('User');
  const Booking = mongoose.model('Booking');
  const UserMembership = mongoose.model('UserMembership');

  let query = { isSubscribed: true };
  const criteria = this.dynamicCriteria;

  // Get all user emails that match criteria
  let matchingEmails = [];

  if (criteria.membershipTiers && criteria.membershipTiers.length > 0) {
    const memberships = await UserMembership.find({
      membershipTier: { $in: criteria.membershipTiers },
      status: 'active'
    }).populate('user', 'email');
    matchingEmails.push(...memberships.map(m => m.user.email));
  }

  if (criteria.bookingStatus) {
    if (criteria.bookingStatus === 'has_booked') {
      const bookings = await Booking.find({ paymentStatus: 'completed' }).distinct('email');
      matchingEmails.push(...bookings);
    } else if (criteria.bookingStatus === 'recent_booking') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const bookings = await Booking.find({
        createdAt: { $gte: thirtyDaysAgo },
        paymentStatus: 'completed'
      }).distinct('email');
      matchingEmails.push(...bookings);
    } else if (criteria.bookingStatus === 'inactive' && criteria.inactiveDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - criteria.inactiveDays);
      const recentBookings = await Booking.find({
        createdAt: { $gte: cutoffDate }
      }).distinct('email');
      const allBookings = await Booking.find().distinct('email');
      matchingEmails.push(...allBookings.filter(email => !recentBookings.includes(email)));
    }
  }

  if (criteria.birthdayMonth) {
    const users = await User.find({
      'birthday.month': criteria.birthdayMonth
    });
    matchingEmails.push(...users.map(u => u.email));
  }

  // Remove duplicates
  matchingEmails = [...new Set(matchingEmails)];

  // Get subscribers for these emails
  const subscribers = await EmailSubscriber.find({
    email: { $in: matchingEmails },
    isSubscribed: true
  });

  return subscribers;
};

// Method to update subscriber count
emailListSchema.methods.updateSubscriberCount = async function() {
  if (this.type === 'static') {
    this.subscriberCount = this.subscribers.length;
  } else {
    const subscribers = await this.getDynamicSubscribers();
    this.subscriberCount = subscribers.length;
  }
  await this.save();
};

module.exports = mongoose.model('EmailList', emailListSchema);
