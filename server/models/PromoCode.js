const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscount: {
    type: Number,
    default: null // For percentage discounts, cap the max discount amount
  },
  minPurchase: {
    type: Number,
    default: 0 // Minimum purchase amount required
  },
  usageLimit: {
    type: Number,
    default: null // null = unlimited uses
  },
  usageCount: {
    type: Number,
    default: 0
  },
  perUserLimit: {
    type: Number,
    default: 1 // How many times one user can use this code
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: null // null = never expires
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableEvents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }], // Empty array = applies to all events
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
promoCodeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if promo code is valid
promoCodeSchema.methods.isValid = function() {
  if (!this.isActive) return false;

  // Check if expired
  if (this.expiryDate && this.expiryDate < new Date()) return false;

  // Check if not yet started
  if (this.startDate && this.startDate > new Date()) return false;

  // Check usage limit
  if (this.usageLimit && this.usageCount >= this.usageLimit) return false;

  return true;
};

// Method to calculate discount
promoCodeSchema.methods.calculateDiscount = function(amount) {
  if (!this.isValid()) return 0;

  // Check minimum purchase
  if (amount < this.minPurchase) return 0;

  let discount = 0;

  if (this.discountType === 'percentage') {
    discount = (amount * this.discountValue) / 100;
    // Apply max discount cap if set
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else if (this.discountType === 'fixed') {
    discount = this.discountValue;
    // Don't exceed the total amount
    if (discount > amount) {
      discount = amount;
    }
  }

  return Math.round(discount * 100) / 100; // Round to 2 decimals
};

module.exports = mongoose.model('PromoCode', promoCodeSchema);
