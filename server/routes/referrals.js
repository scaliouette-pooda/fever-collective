const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const Membership = require('../models/Membership');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// Get or create user's referral code
router.get('/my-code', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has Epidemic membership
    const membership = await Membership.findOne({
      user: req.user.userId,
      status: 'active'
    });

    if (!membership || membership.membershipTier !== 'epidemic') {
      return res.status(403).json({
        error: 'Referral program is only available for Epidemic members',
        requiredTier: 'epidemic'
      });
    }

    // Generate referral code if doesn't exist
    if (!user.referralCode) {
      let code = user.generateReferralCode();
      let attempts = 0;

      // Ensure uniqueness
      while (attempts < 10) {
        const existing = await User.findOne({ referralCode: code });
        if (!existing) break;
        code = user.generateReferralCode();
        attempts++;
      }

      user.referralCode = code;
      await user.save();
    }

    res.json({
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
      referralCredits: user.referralCredits || 0,
      referralUrl: `${process.env.CLIENT_URL}/register?ref=${user.referralCode}`
    });
  } catch (error) {
    console.error('Error getting referral code:', error);
    res.status(500).json({ error: 'Failed to get referral code' });
  }
});

// Validate referral code
router.get('/validate/:code', async (req, res) => {
  try {
    const user = await User.findOne({ referralCode: req.params.code.toUpperCase() });

    if (!user) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    res.json({
      valid: true,
      referrerName: user.name,
      discount: 10 // 10% discount for using referral code
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(500).json({ error: 'Failed to validate referral code' });
  }
});

// Get user's referral stats
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    // Check if user has Epidemic membership
    const membership = await Membership.findOne({
      user: req.user.userId,
      status: 'active'
    });

    if (!membership || membership.membershipTier !== 'epidemic') {
      return res.status(403).json({
        error: 'Referral program is only available for Epidemic members',
        requiredTier: 'epidemic'
      });
    }

    // Get referred users
    const referredUsers = await User.find({ referredBy: req.user.userId })
      .select('name email createdAt')
      .sort({ createdAt: -1 });

    // Get bookings from referred users
    const referredBookings = await Booking.find({ referredBy: req.user.userId })
      .populate('event', 'title date')
      .sort({ createdAt: -1 });

    const totalRevenue = referredBookings
      .filter(b => b.paymentStatus === 'completed')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    res.json({
      referralCode: user.referralCode || null,
      referralCount: user.referralCount || 0,
      referralCredits: user.referralCredits || 0,
      referredUsers: referredUsers.length,
      referredUsersList: referredUsers,
      completedReferralBookings: referredBookings.filter(b => b.paymentStatus === 'completed').length,
      totalReferralRevenue: totalRevenue,
      recentReferrals: referredUsers.slice(0, 5)
    });
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({ error: 'Failed to get referral stats' });
  }
});

// Get referral leaderboard (admin only)
router.get('/leaderboard', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const topReferrers = await User.find({ referralCount: { $gt: 0 } })
      .select('name email referralCode referralCount referralCredits')
      .sort({ referralCount: -1 })
      .limit(20);

    res.json(topReferrers);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

module.exports = router;
