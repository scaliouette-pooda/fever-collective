const mongoose = require('mongoose');

const emailSubscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  name: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isSubscribed: {
    type: Boolean,
    default: true
  },
  // Email preferences
  preferences: {
    marketing: { type: Boolean, default: true },
    transactional: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true },
    classReminders: { type: Boolean, default: true },
    newsletters: { type: Boolean, default: true }
  },
  // Unsubscribe tracking
  unsubscribedAt: {
    type: Date
  },
  unsubscribeReason: {
    type: String
  },
  // Email engagement tracking
  totalEmailsSent: {
    type: Number,
    default: 0
  },
  totalEmailsOpened: {
    type: Number,
    default: 0
  },
  totalLinksClicked: {
    type: Number,
    default: 0
  },
  lastEmailSentAt: {
    type: Date
  },
  lastEmailOpenedAt: {
    type: Date
  },
  // Bounce and complaint tracking
  bounceCount: {
    type: Number,
    default: 0
  },
  lastBouncedAt: {
    type: Date
  },
  bounceType: {
    type: String,
    enum: ['', 'hard', 'soft', 'complaint'],
    default: ''
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: {
    type: String
  },
  // Source tracking
  source: {
    type: String,
    enum: ['registration', 'booking', 'manual_import', 'api', 'landing_page'],
    default: 'manual_import'
  },
  lists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailList'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  customFields: {
    type: Map,
    of: String
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

// Indexes for performance
emailSubscriberSchema.index({ email: 1 });
emailSubscriberSchema.index({ isSubscribed: 1 });
emailSubscriberSchema.index({ lists: 1 });
emailSubscriberSchema.index({ tags: 1 });
emailSubscriberSchema.index({ isBlocked: 1 });

// Update timestamp before saving
emailSubscriberSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to unsubscribe
emailSubscriberSchema.methods.unsubscribe = function(reason) {
  this.isSubscribed = false;
  this.unsubscribedAt = new Date();
  if (reason) {
    this.unsubscribeReason = reason;
  }
  return this.save();
};

// Method to resubscribe
emailSubscriberSchema.methods.resubscribe = function() {
  this.isSubscribed = true;
  this.unsubscribedAt = null;
  this.unsubscribeReason = null;
  return this.save();
};

// Method to record email sent
emailSubscriberSchema.methods.recordEmailSent = function() {
  this.totalEmailsSent += 1;
  this.lastEmailSentAt = new Date();
  return this.save();
};

// Method to record email opened
emailSubscriberSchema.methods.recordEmailOpened = function() {
  this.totalEmailsOpened += 1;
  this.lastEmailOpenedAt = new Date();
  return this.save();
};

// Method to record link clicked
emailSubscriberSchema.methods.recordLinkClicked = function() {
  this.totalLinksClicked += 1;
  return this.save();
};

// Method to record bounce
emailSubscriberSchema.methods.recordBounce = function(type) {
  this.bounceCount += 1;
  this.lastBouncedAt = new Date();
  this.bounceType = type || 'soft';

  // Block after 3 hard bounces or 5 soft bounces
  if ((type === 'hard' && this.bounceCount >= 3) ||
      (type === 'soft' && this.bounceCount >= 5)) {
    this.isBlocked = true;
    this.blockReason = `Too many ${type} bounces`;
  }

  return this.save();
};

// Static method to find or create subscriber
emailSubscriberSchema.statics.findOrCreate = async function(email, data = {}) {
  let subscriber = await this.findOne({ email: email.toLowerCase() });

  if (!subscriber) {
    subscriber = new this({
      email: email.toLowerCase(),
      ...data
    });
    await subscriber.save();
  }

  return subscriber;
};

// Static method to bulk import
emailSubscriberSchema.statics.bulkImport = async function(subscribers, source = 'manual_import') {
  const results = {
    imported: 0,
    updated: 0,
    failed: 0,
    errors: []
  };

  for (const subscriberData of subscribers) {
    try {
      const email = subscriberData.email.toLowerCase().trim();

      if (!email.match(/^\S+@\S+\.\S+$/)) {
        results.failed++;
        results.errors.push({ email, error: 'Invalid email format' });
        continue;
      }

      const existing = await this.findOne({ email });

      if (existing) {
        // Update existing
        Object.assign(existing, subscriberData);
        await existing.save();
        results.updated++;
      } else {
        // Create new
        const newSubscriber = new this({
          ...subscriberData,
          email,
          source
        });
        await newSubscriber.save();
        results.imported++;
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: subscriberData.email,
        error: error.message
      });
    }
  }

  return results;
};

module.exports = mongoose.model('EmailSubscriber', emailSubscriberSchema);
