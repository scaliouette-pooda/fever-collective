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
      default: 'info@thefevercollective.com'
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
      default: 'The Fever Collective'
    },
    fromEmail: {
      type: String,
      default: 'info@thefevercollective.com'
    },
    replyTo: {
      type: String,
      default: 'info@thefevercollective.com'
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
    }
  },

  // Site Information
  siteInfo: {
    siteName: {
      type: String,
      default: 'The Fever Collective'
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
