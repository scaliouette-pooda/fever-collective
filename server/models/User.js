const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referralCount: {
    type: Number,
    default: 0
  },
  referralCredits: {
    type: Number,
    default: 0
  },
  // Enhanced referral tracking
  referralTier: {
    type: String,
    enum: ['starter', 'ambassador', 'elite'],
    default: 'starter'
  },
  totalReferralEarnings: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate unique referral code
userSchema.methods.generateReferralCode = function() {
  const base = this.name.replace(/\s+/g, '').toUpperCase().substring(0, 4);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${random}`;
};

// Calculate referral tier based on count
userSchema.methods.updateReferralTier = function() {
  if (this.referralCount >= 10) {
    this.referralTier = 'elite';
  } else if (this.referralCount >= 4) {
    this.referralTier = 'ambassador';
  } else {
    this.referralTier = 'starter';
  }
  return this.referralTier;
};

// Get referral reward amount based on tier
userSchema.methods.getReferralReward = function() {
  const rewards = {
    'starter': 10,      // 1-3 referrals: $10 each
    'ambassador': 15,   // 4-9 referrals: $15 each
    'elite': 20         // 10+ referrals: $20 each
  };
  return rewards[this.referralTier] || 10;
};

module.exports = mongoose.model('User', userSchema);
