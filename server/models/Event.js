const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  // Ticket tiers for dynamic pricing
  ticketTiers: [{
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    capacity: {
      type: Number,
      required: true,
      min: 0
    },
    availableSpots: {
      type: Number,
      required: true,
      min: 0
    },
    benefits: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  // Use ticket tiers if enabled, otherwise use base price
  useTieredPricing: {
    type: Boolean,
    default: false
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  availableSpots: {
    type: Number,
    required: true
  },
  instructor: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all levels'],
    default: 'all levels'
  },
  imageUrl: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Recurrence settings
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none'
  },
  recurrenceDays: {
    type: [String],
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    default: []
  },
  recurrenceEndDate: {
    type: Date
  },
  parentEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', eventSchema);
