const express = require('express');
const router = express.Router();
const { MembershipTier, UserMembership } = require('../models/Membership');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// Get all available membership tiers
router.get('/tiers', async (req, res) => {
  try {
    const tiers = await MembershipTier.find({ isActive: true })
      .sort({ pricingTier: 1, price: 1 });

    // Group by pricing tier
    const grouped = {
      'founders-1': [],
      'founders-2': [],
      'general': []
    };

    tiers.forEach(tier => {
      grouped[tier.pricingTier].push(tier);
    });

    res.json(grouped);
  } catch (error) {
    console.error('Error fetching membership tiers:', error);
    res.status(500).json({ error: 'Failed to fetch membership tiers' });
  }
});

// Get user's current membership
router.get('/my-membership', authenticateUser, async (req, res) => {
  try {
    const membership = await UserMembership.findOne({
      userId: req.user.userId,
      status: { $in: ['active', 'pending-cancellation'] }
    });

    if (!membership) {
      return res.json({ hasMembership: false });
    }

    res.json({
      hasMembership: true,
      membership
    });
  } catch (error) {
    console.error('Error fetching user membership:', error);
    res.status(500).json({ error: 'Failed to fetch membership' });
  }
});

// Admin: Create/Update membership tiers
router.post('/admin/tiers', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      displayName,
      pricingTier,
      price,
      pricePerClass,
      classesPerMonth,
      isUnlimited,
      advanceBookingHours,
      specialtyClassCredits,
      creditExpiration,
      benefits,
      founderSlotsTotal,
      releaseDate
    } = req.body;

    const tier = new MembershipTier({
      name,
      displayName,
      pricingTier,
      price,
      pricePerClass,
      classesPerMonth,
      isUnlimited,
      advanceBookingHours,
      specialtyClassCredits,
      creditExpiration,
      benefits,
      founderSlotsTotal,
      releaseDate
    });

    await tier.save();

    console.log('✅ Membership tier created:', tier.displayName);

    res.status(201).json({
      message: 'Membership tier created successfully',
      tier
    });
  } catch (error) {
    console.error('Error creating membership tier:', error);
    res.status(500).json({ error: 'Failed to create membership tier' });
  }
});

// Admin: Assign membership to user
router.post('/admin/assign', authenticateUser, requireAdmin, async (req, res) => {
  try {
    console.log('=== MEMBERSHIP ASSIGNMENT REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const {
      userId,
      membershipTier,
      pricingTier,
      monthlyPrice,
      paymentMethod,
      creditsTotal,
      hasFirstMonthDiscount,
      firstMonthDiscountPercent,
      notes
    } = req.body;

    console.log('Extracted values:', {
      userId,
      membershipTier,
      pricingTier,
      monthlyPrice,
      paymentMethod,
      creditsTotal
    });

    // Check if user already has active membership
    const existing = await UserMembership.findOne({
      userId,
      status: 'active'
    });

    console.log('Existing membership?', existing ? 'YES' : 'NO');

    if (existing) {
      console.log('❌ User already has active membership:', existing);
      return res.status(400).json({
        error: 'User already has an active membership',
        message: 'User already has an active membership. Please cancel the existing membership first.'
      });
    }

    // Check founder slots if applicable
    if (pricingTier.startsWith('founders')) {
      const tierInfo = await MembershipTier.findOne({
        name: membershipTier,
        pricingTier,
        isActive: true
      });

      if (tierInfo && tierInfo.founderSlotsTotal) {
        if (tierInfo.founderSlotsUsed >= tierInfo.founderSlotsTotal) {
          return res.status(400).json({ error: 'Founder slots are full for this tier' });
        }

        // Increment founder slots used
        tierInfo.founderSlotsUsed += 1;
        await tierInfo.save();
      }
    }

    // Calculate next billing date (1 month from now)
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    // Calculate credits expiration
    const creditsExpireDate = new Date();
    creditsExpireDate.setMonth(creditsExpireDate.getMonth() + 2);

    const membership = new UserMembership({
      userId,
      membershipTier,
      pricingTier,
      monthlyPrice,
      paymentMethod: paymentMethod || 'manual',
      creditsTotal: creditsTotal || 0,
      creditsRemaining: creditsTotal || 0,
      creditsExpireDate: membershipTier !== 'epidemic' ? creditsExpireDate : null,
      nextBillingDate,
      hasFirstMonthDiscount: hasFirstMonthDiscount || false,
      firstMonthDiscountPercent: firstMonthDiscountPercent || 0,
      notes
    });

    await membership.save();

    console.log('✅ Membership assigned to user:', userId);

    res.status(201).json({
      message: 'Membership assigned successfully',
      membership
    });
  } catch (error) {
    console.error('=== MEMBERSHIP ASSIGNMENT ERROR ===');
    console.error('Error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    res.status(500).json({
      error: 'Failed to assign membership',
      message: error.message,
      details: error.errors
    });
  }
});

// Admin: Update membership
router.patch('/admin/:membershipId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { membershipId } = req.params;
    const updates = req.body;

    const membership = await UserMembership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        membership[key] = updates[key];
      }
    });

    await membership.save();

    console.log('✅ Membership updated:', membershipId);

    res.json({
      message: 'Membership updated successfully',
      membership
    });
  } catch (error) {
    console.error('Error updating membership:', error);
    res.status(500).json({ error: 'Failed to update membership' });
  }
});

// Admin: Cancel membership
router.post('/admin/:membershipId/cancel', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { membershipId } = req.params;
    const { immediate } = req.body; // true for immediate cancellation

    const membership = await UserMembership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    if (immediate) {
      membership.status = 'cancelled';
      membership.cancellationDate = new Date();
    } else {
      // 30-day notice
      membership.status = 'pending-cancellation';
      membership.cancellationRequestDate = new Date();
      const cancellationDate = new Date();
      cancellationDate.setDate(cancellationDate.getDate() + 30);
      membership.cancellationDate = cancellationDate;
    }

    await membership.save();

    console.log('✅ Membership cancellation processed:', membershipId);

    res.json({
      message: immediate ? 'Membership cancelled immediately' : 'Membership will be cancelled in 30 days',
      membership
    });
  } catch (error) {
    console.error('Error cancelling membership:', error);
    res.status(500).json({ error: 'Failed to cancel membership' });
  }
});

// Admin: Add credits to membership
router.post('/admin/:membershipId/add-credits', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { membershipId } = req.params;
    const { credits, reason } = req.body;

    const membership = await UserMembership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({ error: 'Membership not found' });
    }

    membership.creditsRemaining += credits;
    membership.creditsTotal += credits;

    if (reason) {
      membership.notes = (membership.notes || '') + `\n[${new Date().toISOString()}] Added ${credits} credits: ${reason}`;
    }

    await membership.save();

    console.log('✅ Credits added to membership:', membershipId, credits);

    res.json({
      message: 'Credits added successfully',
      membership
    });
  } catch (error) {
    console.error('Error adding credits:', error);
    res.status(500).json({ error: 'Failed to add credits' });
  }
});

// Admin: Get all memberships
router.get('/admin/all', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { status, tier, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (tier) query.membershipTier = tier;

    const memberships = await UserMembership.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Fetch tier details for each membership
    const membershipTierNames = [...new Set(memberships.map(m => m.membershipTier))];
    const tiers = await MembershipTier.find({ name: { $in: membershipTierNames } });
    const tierMap = {};
    tiers.forEach(tier => {
      tierMap[tier.name] = tier;
    });

    // Attach tier details to each membership
    const membershipsWithTiers = memberships.map(membership => {
      const membershipObj = membership.toObject();
      const tierDetails = tierMap[membership.membershipTier];
      return {
        ...membershipObj,
        membershipTier: tierDetails || membership.membershipTier,
        // Keep user data from userId population
        user: membershipObj.userId
      };
    });

    const count = await UserMembership.countDocuments(query);

    res.json({
      memberships: membershipsWithTiers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching memberships:', error);
    res.status(500).json({ error: 'Failed to fetch memberships' });
  }
});

// Admin: Get membership statistics
router.get('/admin/stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const totalActive = await UserMembership.countDocuments({ status: 'active' });
    const totalCancelled = await UserMembership.countDocuments({ status: 'cancelled' });
    const pendingCancellation = await UserMembership.countDocuments({ status: 'pending-cancellation' });

    const starterCount = await UserMembership.countDocuments({
      status: 'active',
      membershipTier: 'fever-starter'
    });

    const outbreakCount = await UserMembership.countDocuments({
      status: 'active',
      membershipTier: 'outbreak'
    });

    const epidemicCount = await UserMembership.countDocuments({
      status: 'active',
      membershipTier: 'epidemic'
    });

    // Monthly recurring revenue
    const activeMemberships = await UserMembership.find({ status: 'active' });
    const mrr = activeMemberships.reduce((sum, m) => sum + m.monthlyPrice, 0);

    res.json({
      totalActive,
      totalCancelled,
      pendingCancellation,
      byTier: {
        starter: starterCount,
        outbreak: outbreakCount,
        epidemic: epidemicCount
      },
      monthlyRecurringRevenue: mrr
    });
  } catch (error) {
    console.error('Error fetching membership stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Deduct credits when booking (internal use)
router.post('/deduct-credits', authenticateUser, async (req, res) => {
  try {
    const { amount, isSpecialtyClass } = req.body;

    const membership = await UserMembership.findOne({
      userId: req.user.userId,
      status: 'active'
    });

    if (!membership) {
      return res.status(404).json({ error: 'No active membership found' });
    }

    const creditsToDeduct = isSpecialtyClass ? (membership.specialtyClassCredits || 2) : amount;

    if (!membership.deductCredits(creditsToDeduct)) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    await membership.save();

    res.json({
      message: 'Credits deducted successfully',
      creditsRemaining: membership.creditsRemaining
    });
  } catch (error) {
    console.error('Error deducting credits:', error);
    res.status(500).json({ error: 'Failed to deduct credits' });
  }
});

// Record class attendance and check for milestone rewards
router.post('/record-attendance', authenticateUser, async (req, res) => {
  try {
    const membership = await UserMembership.findOne({
      userId: req.user.userId,
      status: 'active'
    });

    if (!membership) {
      return res.status(404).json({ error: 'No active membership found' });
    }

    membership.incrementClassCount();
    const reward = membership.checkMilestoneReward();

    await membership.save();

    res.json({
      message: 'Attendance recorded',
      totalClasses: membership.totalClassesAttended,
      reward: reward || null
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

module.exports = router;
