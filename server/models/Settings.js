const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // There should only be one settings document
  _id: {
    type: String,
    default: 'site_settings'
  },

  // Social Media
  socialMedia: {
    instagram: {
      type: String,
      default: ''
    },
    facebook: {
      type: String,
      default: ''
    },
    twitter: {
      type: String,
      default: ''
    }
  },

  // Contact Information
  contact: {
    email: {
      type: String,
      default: 'info@thefeverstudio.com'
    },
    phone: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    }
  },

  // Email Configuration
  emailConfig: {
    fromName: {
      type: String,
      default: 'The Fever Studio'
    },
    fromEmail: {
      type: String,
      default: 'info@thefeverstudio.com'
    },
    replyTo: {
      type: String,
      default: 'info@thefeverstudio.com'
    }
  },

  // Payment Settings
  payment: {
    venmoUsername: {
      type: String,
      default: ''
    },
    paypalEmail: {
      type: String,
      default: ''
    },
    acceptVenmo: {
      type: Boolean,
      default: true
    },
    acceptPayPal: {
      type: Boolean,
      default: true
    },
    acceptCash: {
      type: Boolean,
      default: true
    },
    // Payment Gateway Configuration
    paymentGateway: {
      type: String,
      enum: ['manual', 'stripe', 'paypal', 'square'],
      default: 'manual'
    },
    stripeEnabled: {
      type: Boolean,
      default: false
    },
    stripePublishableKey: {
      type: String,
      default: ''
    },
    stripeSecretKey: {
      type: String,
      default: ''
    },
    // Membership Settings
    membershipPaymentMode: {
      type: String,
      enum: ['manual', 'automated'],
      default: 'manual'
    },
    requireWaiverForMembership: {
      type: Boolean,
      default: true
    },
    allowDropIns: {
      type: Boolean,
      default: true
    },
    dropInRate: {
      type: Number,
      default: 30
    },
    sameDaySignupDiscount: {
      type: Number,
      default: 15 // percentage
    },
    upgradeDiscount: {
      type: Number,
      default: 15 // percentage
    }
  },

  // Site Information
  siteInfo: {
    siteName: {
      type: String,
      default: 'The Fever Studio'
    },
    tagline: {
      type: String,
      default: 'Exclusive Pilates Popup Events'
    },
    description: {
      type: String,
      default: 'Join us for unique pilates experiences in stunning locations'
    }
  },

  // Home Page Images
  homeImages: {
    aboutImage: {
      type: String,
      default: ''
    },
    missionImage: {
      type: String,
      default: ''
    }
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Update timestamp before saving
settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Settings', settingsSchema);
