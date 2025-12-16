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
      default: 'Fever'
    },
    tagline: {
      type: String,
      default: 'Get Hot. Get Strong. Get Fever.'
    },
    secondaryTagline: {
      type: String,
      default: 'Heat That Heals. Movement That Empowers.'
    },
    description: {
      type: String,
      default: 'Fever is a boutique heated mat Pilates studio in Berkeley designed to elevate strength, flexibility, and community. With a music-driven, energizing environment, members experience a high-intensity Pilates workout in a warm, welcoming studio.'
    },
    concept: {
      type: String,
      default: 'A fever is your body\'s natural response to burn out what doesn\'t serve you — it raises your temperature to heal and reset. Likewise, Fever the studio represents using heat, movement, and intensity to transform your body and renew your energy.'
    },
    offeringTypes: {
      type: [String],
      default: ['Heated Mat Pilates', 'Non-Heated Pilates', 'Yoga Sculpt']
    }
  },

  // Home Page Content
  homePageContent: {
    // Hero Section
    heroTitle: {
      type: String,
      default: 'The Fever Studio'
    },
    heroTagline: {
      type: String,
      default: 'Heat That Heals. Movement That Empowers.'
    },
    heroSecondaryTagline: {
      type: String,
      default: 'sculpt · strength · sweat · stretch'
    },

    // About Section
    aboutTitle: {
      type: String,
      default: 'Pop-Up Pilates Experiences'
    },
    aboutParagraph1: {
      type: String,
      default: 'We bring transformative pilates experiences to unique locations. Each class is carefully curated to create an intentional space for movement, connection, and wellness.'
    },
    aboutParagraph2: {
      type: String,
      default: 'Join our community and discover a new approach to fitness that transcends the traditional studio experience.'
    },
    aboutImage: {
      type: String,
      default: ''
    },

    // Mission Section
    missionTitle: {
      type: String,
      default: 'Our Mission'
    },
    missionParagraph1: {
      type: String,
      default: 'The Fever Studio is more than a workout—it\'s a holistic wellness experience that transcends traditional fitness. We curate transformative pilates popup events in unique locations, creating intentional spaces for movement, connection, and community.'
    },
    missionParagraph2: {
      type: String,
      default: 'Each class is carefully designed to blend premium instruction with extraordinary atmospheres, offering an experience that nourishes both body and spirit.'
    },
    missionImage: {
      type: String,
      default: ''
    },

    // Values Section
    valuesTitle: {
      type: String,
      default: 'What We Believe'
    },
    value1Title: {
      type: String,
      default: 'You Belong Here'
    },
    value1Description: {
      type: String,
      default: 'We create inclusive spaces where everyone feels welcome, regardless of experience level or fitness background.'
    },
    value2Title: {
      type: String,
      default: 'Community First'
    },
    value2Description: {
      type: String,
      default: 'Movement is better together. We foster genuine connections that extend beyond the mat.'
    },
    value3Title: {
      type: String,
      default: 'Holistic Wellness'
    },
    value3Description: {
      type: String,
      default: 'True wellness encompasses mind, body, and spirit. Our approach integrates all three dimensions.'
    },
    value4Title: {
      type: String,
      default: 'Intentional Experiences'
    },
    value4Description: {
      type: String,
      default: 'Every detail matters. From location selection to music curation, we craft memorable moments.'
    },

    // Approach Section
    approachTitle: {
      type: String,
      default: 'Our Approach'
    },
    approach1Title: {
      type: String,
      default: 'Popup Locations'
    },
    approach1Description: {
      type: String,
      default: 'We partner with unique venues—rooftops, galleries, gardens, and hidden gems—transforming spaces into wellness sanctuaries.'
    },
    approach2Title: {
      type: String,
      default: 'Expert Instruction'
    },
    approach2Description: {
      type: String,
      default: 'Our certified instructors bring years of experience and a passion for holistic movement practices.'
    },
    approach3Title: {
      type: String,
      default: 'All Levels Welcome'
    },
    approach3Description: {
      type: String,
      default: 'Whether you\'re brand new to pilates or a seasoned practitioner, we offer modifications and challenges for every body.'
    },
    approach4Title: {
      type: String,
      default: 'Premium Equipment'
    },
    approach4Description: {
      type: String,
      default: 'We provide everything you need—mats, props, towels—so you can focus on your practice.'
    },

    // CTA Section
    ctaTitle: {
      type: String,
      default: 'Join The Collective'
    },
    ctaSubtitle: {
      type: String,
      default: 'Experience wellness that\'s out of this world'
    }
  },

  // Legacy homeImages for backward compatibility
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

  // ClassPass Integration
  classPassIntegration: {
    enabled: {
      type: Boolean,
      default: false
    },
    autoTagUsers: {
      type: Boolean,
      default: true
    },
    conversionGoalDays: {
      type: Number,
      default: 30
    },
    defaultPayoutRate: {
      type: Number,
      default: 22 // Average payout for analytics
    },
    trackConversions: {
      type: Boolean,
      default: true
    }
  },

  // SMS Configuration
  smsConfig: {
    enabled: {
      type: Boolean,
      default: false
    },
    fromName: {
      type: String,
      default: 'Fever Studio'
    },
    twilioConfigured: {
      type: Boolean,
      default: false
    },
    sendBookingConfirmations: {
      type: Boolean,
      default: true
    },
    sendPaymentConfirmations: {
      type: Boolean,
      default: true
    },
    sendReminders: {
      type: Boolean,
      default: true
    },
    reminderHoursBefore: {
      type: Number,
      default: 24
    },
    sendWaitlistNotifications: {
      type: Boolean,
      default: true
    },
    sendMembershipConfirmations: {
      type: Boolean,
      default: true
    },
    sendCreditsLowWarning: {
      type: Boolean,
      default: true
    },
    creditsLowThreshold: {
      type: Number,
      default: 3
    },
    allowPromotionalSMS: {
      type: Boolean,
      default: false
    },
    dailyLimit: {
      type: Number,
      default: 1000 // Prevent runaway costs
    },
    costPerMessage: {
      type: Number,
      default: 0.0075 // USD per SMS for tracking
    }
  },

  // SMS Statistics
  smsStats: {
    totalSent: {
      type: Number,
      default: 0
    },
    totalFailed: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    },
    todaySent: {
      type: Number,
      default: 0
    }
  },

  // Custom CSS for site-wide styling
  customCSS: {
    type: String,
    default: ''
  },

  // Visual Style Customizer
  styleCustomizer: {
    // Site-wide
    primaryColor: { type: String, default: '#c9a86a' },
    backgroundColor: { type: String, default: '#1a1a1a' },
    textColor: { type: String, default: '#e8e8e8' },
    headingColor: { type: String, default: '#ffffff' },
    fontFamily: { type: String, default: 'Arial, sans-serif' },
    fontSize: { type: String, default: '16px' },
    headingWeight: { type: String, default: '600' },
    sectionPadding: { type: String, default: '4rem' },
    buttonRadius: { type: String, default: '0' },
    maxWidth: { type: String, default: '1400px' },

    // Additional Colors
    linkColor: { type: String, default: '#c9a86a' },
    linkHoverColor: { type: String, default: '#d4b97a' },
    buttonHoverColor: { type: String, default: '#d4b97a' },
    mutedTextColor: { type: String, default: 'rgba(232, 232, 232, 0.7)' },
    secondaryBackground: { type: String, default: '#2a2a2a' },
    borderColor: { type: String, default: 'rgba(255, 255, 255, 0.1)' },
    successColor: { type: String, default: '#4caf50' },
    warningColor: { type: String, default: '#ff9800' },
    errorColor: { type: String, default: '#f44336' },

    // Typography - Body
    bodyFontWeight: { type: String, default: '400' },

    // Typography - Headings
    h1FontFamily: { type: String, default: 'inherit' },
    h1FontSize: { type: String, default: '4rem' },
    h1FontWeight: { type: String, default: '200' },
    h2FontSize: { type: String, default: '2rem' },
    h2FontWeight: { type: String, default: '300' },
    h3FontSize: { type: String, default: '1.5rem' },
    h3FontWeight: { type: String, default: '300' },

    // Navigation
    navBackgroundColor: { type: String, default: '#000000' },
    navTextColor: { type: String, default: '#e8e8e8' },
    navHeight: { type: String, default: '5rem' },

    // Events
    eventCardBackground: { type: String, default: '#1a1a1a' },
    eventCardBorder: { type: String, default: '#c9a86a' },
    eventCardRadius: { type: String, default: '0' },

    // Forms
    inputBackground: { type: String, default: '#2a2a2a' },
    inputBorder: { type: String, default: '#c9a86a' },
    inputTextColor: { type: String, default: '#e8e8e8' },

    // Visibility
    showSocialLinks: { type: Boolean, default: true },
    showFooter: { type: Boolean, default: true }
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
