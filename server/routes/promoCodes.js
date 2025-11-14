const express = require('express');
const router = express.Router();
const PromoCode = require('../models/PromoCode');
const Booking = require('../models/Booking');
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all promo codes (admin only)
router.get('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const promoCodes = await PromoCode.find()
      .populate('createdBy', 'name email')
      .populate('applicableEvents', 'title date')
      .sort({ createdAt: -1 });

    res.json(promoCodes);
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
});

// Validate promo code (public - used during booking)
router.post('/validate', async (req, res) => {
  try {
    const { code, eventId, amount, userId } = req.body;

    if (!code || !amount) {
      return res.status(400).json({ error: 'Code and amount are required' });
    }

    const promoCode = await PromoCode.findOne({
      code: code.toUpperCase()
    });

    if (!promoCode) {
      return res.status(404).json({ error: 'Invalid promo code' });
    }

    if (!promoCode.isValid()) {
      let reason = 'Promo code is not valid';
      if (!promoCode.isActive) reason = 'Promo code is inactive';
      else if (promoCode.expiryDate && promoCode.expiryDate < new Date()) reason = 'Promo code has expired';
      else if (promoCode.startDate && promoCode.startDate > new Date()) reason = 'Promo code is not yet active';
      else if (promoCode.usageLimit && promoCode.usageCount >= promoCode.usageLimit) reason = 'Promo code usage limit reached';

      return res.status(400).json({ error: reason });
    }

    // Check if code applies to this event
    if (promoCode.applicableEvents.length > 0 && eventId) {
      const appliesToEvent = promoCode.applicableEvents.some(
        id => id.toString() === eventId.toString()
      );
      if (!appliesToEvent) {
        return res.status(400).json({ error: 'Promo code does not apply to this event' });
      }
    }

    // Check per-user limit if userId provided
    if (userId && promoCode.perUserLimit) {
      const userUsageCount = await Booking.countDocuments({
        user: userId,
        promoCode: promoCode._id
      });

      if (userUsageCount >= promoCode.perUserLimit) {
        return res.status(400).json({
          error: `You have already used this promo code ${promoCode.perUserLimit} time(s)`
        });
      }
    }

    // Calculate discount
    const discount = promoCode.calculateDiscount(amount);
    const finalAmount = amount - discount;

    res.json({
      valid: true,
      promoCode: {
        id: promoCode._id,
        code: promoCode.code,
        description: promoCode.description,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue
      },
      discount,
      finalAmount: Math.max(0, finalAmount)
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ error: 'Failed to validate promo code' });
  }
});

// Create promo code (admin only)
router.post('/',
  authenticateUser,
  requireAdmin,
  [
    body('code').trim().notEmpty().withMessage('Code is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('discountType').isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
    body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be positive')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        code,
        description,
        discountType,
        discountValue,
        maxDiscount,
        minPurchase,
        usageLimit,
        perUserLimit,
        startDate,
        expiryDate,
        applicableEvents,
        isActive
      } = req.body;

      // Validate percentage discount
      if (discountType === 'percentage' && discountValue > 100) {
        return res.status(400).json({ error: 'Percentage discount cannot exceed 100%' });
      }

      // Check if code already exists
      const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
      if (existingCode) {
        return res.status(400).json({ error: 'Promo code already exists' });
      }

      const promoCode = new PromoCode({
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        maxDiscount,
        minPurchase: minPurchase || 0,
        usageLimit,
        perUserLimit: perUserLimit || 1,
        startDate: startDate || Date.now(),
        expiryDate,
        applicableEvents: applicableEvents || [],
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user.userId
      });

      await promoCode.save();

      res.status(201).json({
        message: 'Promo code created successfully',
        promoCode
      });
    } catch (error) {
      console.error('Error creating promo code:', error);
      res.status(500).json({ error: 'Failed to create promo code' });
    }
  }
);

// Update promo code (admin only)
router.put('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow changing the code itself (creates confusion)
    delete updates.code;
    delete updates.createdBy;
    delete updates.usageCount; // Usage count should only be updated by the system

    // Validate percentage discount if being updated
    if (updates.discountType === 'percentage' && updates.discountValue > 100) {
      return res.status(400).json({ error: 'Percentage discount cannot exceed 100%' });
    }

    const promoCode = await PromoCode.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    res.json({
      message: 'Promo code updated successfully',
      promoCode
    });
  } catch (error) {
    console.error('Error updating promo code:', error);
    res.status(500).json({ error: 'Failed to update promo code' });
  }
});

// Delete promo code (admin only)
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findByIdAndDelete(id);

    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    res.json({ message: 'Promo code deleted successfully' });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    res.status(500).json({ error: 'Failed to delete promo code' });
  }
});

// Toggle promo code active status (admin only)
router.patch('/:id/toggle', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findById(id);

    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    promoCode.isActive = !promoCode.isActive;
    promoCode.updatedAt = Date.now();
    await promoCode.save();

    res.json({
      message: `Promo code ${promoCode.isActive ? 'activated' : 'deactivated'}`,
      promoCode
    });
  } catch (error) {
    console.error('Error toggling promo code:', error);
    res.status(500).json({ error: 'Failed to toggle promo code' });
  }
});

// Get promo code statistics (admin only)
router.get('/:id/stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findById(id);
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    // Get bookings that used this promo code
    const bookings = await Booking.find({ promoCode: id })
      .populate('event', 'title date')
      .populate('user', 'name email');

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalDiscount = bookings.reduce((sum, b) => sum + (b.discountAmount || 0), 0);

    res.json({
      promoCode: {
        code: promoCode.code,
        description: promoCode.description
      },
      stats: {
        totalUses: promoCode.usageCount,
        usageLimit: promoCode.usageLimit || 'Unlimited',
        totalRevenue,
        totalDiscount,
        bookings: bookings.map(b => ({
          id: b._id,
          customerName: b.name,
          event: b.event?.title,
          eventDate: b.event?.date,
          amount: b.totalAmount,
          discount: b.discountAmount,
          date: b.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching promo code stats:', error);
    res.status(500).json({ error: 'Failed to fetch promo code statistics' });
  }
});

module.exports = router;
