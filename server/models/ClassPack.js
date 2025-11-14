const mongoose = require('mongoose');

const classPackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  credits: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  regularPrice: {
    type: Number,
    required: true
  },
  savings: {
    type: Number,
    required: true
  },
  validityDays: {
    type: Number,
    default: 180 // 6 months default
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  features: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ClassPack', classPackSchema);
