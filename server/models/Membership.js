const mongoose = require('mongoose');

const membershipTierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['fever-starter', 'outbreak', 'epidemic']
  },
  displayName: {
    type: String,
    required: true
  },
  pricingTier: {
    type: String,
    required: true,
    enum: ['founders-1', 'founders-2', 'general']
  },
  price: {
    type: Number,
    required: true
  },
  pricePerClass: {
    type: Number // For display purposes
  },
  classesPerMonth: {
    type: Number, // null for unlimited
    default: null
  },
  isUnlimited: {
    type: Boolean,
    default: false
  },
  advanceBookingHours: {
    type: Number,
    default: 48 // hours in advance they can book
  },
  specialtyClassCredits: {
    type: Number,
    default: 2 // How many credits specialty classes cost
  },
  creditExpiration: {
    type: Number, // months
    default: 2
  },
  benefits: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  founderSlotsTotal: {
    type: Number, // null for non-founder tiers
    default: null
  },
  founderSlotsUsed: {
    type: Number,
    default: 0
  },
  releaseDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userMembershipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  membershipTier: {
    type: String,
    required: true,
    enum: ['fever-starter', 'outbreak', 'epidemic', 'drop-in']
  },
  pricingTier: {
    type: String,
    required: true,
    enum: ['founders-1', 'founders-2', 'general']
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'pending-cancellation', 'pending-payment', 'expired', 'paused'],
    default: 'pending-payment' // Start as pending until payment confirmed
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  nextBillingDate: {
    type: Date
  },
  cancellationDate: {
    type: Date // 30 days from cancellation request
  },
  cancellationRequestDate: {
    type: Date
  },

  // Credits
  creditsTotal: {
    type: Number, // Total credits for the current period
    default: 0
  },
  creditsRemaining: {
    type: Number,
    default: 0
  },
  creditsExpireDate: {
    type: Date
  },

  // Billing
  monthlyPrice: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['manual', 'stripe', 'cash', 'other'],
    default: 'manual'
  },
  stripeSubscriptionId: {
    type: String
  },
  stripeCustomerId: {
    type: String
  },

  // Tracking
  totalClassesAttended: {
    type: Number,
    default: 0
  },
  lastRewardMilestone: {
    type: Number,
    default: 0
  },

  // Discounts
  hasFirstMonthDiscount: {
    type: Boolean,
    default: false
  },
  firstMonthDiscountPercent: {
    type: Number,
    default: 0
  },
  hasUpgradeDiscount: {
    type: Boolean,
    default: false
  },
  upgradeDiscountPercent: {
    type: Number,
    default: 0
  },
  upgradeDiscountExpires: {
    type: Date
  },

  notes: {
    type: String
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

// Update timestamp on save
userMembershipSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
userMembershipSchema.methods.deductCredits = function(amount) {
  if (this.membershipTier === 'epidemic') {
    return true; // Unlimited - no deduction needed
  }

  if (this.creditsRemaining >= amount) {
    this.creditsRemaining -= amount;
    return true;
  }
  return false;
};

userMembershipSchema.methods.resetMonthlyCredits = function(tierInfo) {
  if (this.membershipTier !== 'epidemic') {
    this.creditsTotal = tierInfo.classesPerMonth;
    this.creditsRemaining = tierInfo.classesPerMonth;

    // Set expiration date
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + tierInfo.creditExpiration);
    this.creditsExpireDate = expirationDate;
  }
};

userMembershipSchema.methods.incrementClassCount = function() {
  this.totalClassesAttended += 1;
  return this.totalClassesAttended;
};

userMembershipSchema.methods.checkMilestoneReward = function() {
  const milestones = [50, 100, 150, 200, 250];
  const rewards = {
    50: 'Sweat towel',
    100: 'Tote bag',
    150: 'Water Bottle',
    200: 'Hat',
    250: 'Hoodie'
  };

  for (const milestone of milestones) {
    if (this.totalClassesAttended >= milestone && this.lastRewardMilestone < milestone) {
      this.lastRewardMilestone = milestone;
      return {
        milestone,
        reward: rewards[milestone]
      };
    }
  }
  return null;
};

const MembershipTier = mongoose.model('MembershipTier', membershipTierSchema);
const UserMembership = mongoose.model('UserMembership', userMembershipSchema);

module.exports = { MembershipTier, UserMembership };
