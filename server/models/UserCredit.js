const mongoose = require('mongoose');

const userCreditSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  classPack: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassPack',
    required: true
  },
  creditsRemaining: {
    type: Number,
    required: true,
    min: 0
  },
  creditsOriginal: {
    type: Number,
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  amountPaid: {
    type: Number,
    required: true
  },
  paymentIntentId: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'fully_used'],
    default: 'active'
  }
});

// Method to use credits
userCreditSchema.methods.useCredits = function(amount) {
  if (this.creditsRemaining >= amount) {
    this.creditsRemaining -= amount;
    if (this.creditsRemaining === 0) {
      this.status = 'fully_used';
    }
    return true;
  }
  return false;
};

// Method to check if credits are valid
userCreditSchema.methods.isValid = function() {
  if (this.isExpired || this.status !== 'active') {
    return false;
  }
  if (new Date() > this.expiryDate) {
    this.isExpired = true;
    this.status = 'expired';
    return false;
  }
  return this.creditsRemaining > 0;
};

module.exports = mongoose.model('UserCredit', userCreditSchema);
