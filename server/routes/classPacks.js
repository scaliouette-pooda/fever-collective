const express = require('express');
const router = express.Router();
const ClassPack = require('../models/ClassPack');
const UserCredit = require('../models/UserCredit');
const User = require('../models/User');
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Get all active class packs (public)
router.get('/', async (req, res) => {
  try {
    const packs = await ClassPack.find({ isActive: true }).sort({ credits: 1 });
    res.json(packs);
  } catch (error) {
    console.error('Error fetching class packs:', error);
    res.status(500).json({ error: 'Failed to fetch class packs' });
  }
});

// Get all class packs (admin)
router.get('/admin/all', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const packs = await ClassPack.find().sort({ createdAt: -1 });
    res.json(packs);
  } catch (error) {
    console.error('Error fetching class packs:', error);
    res.status(500).json({ error: 'Failed to fetch class packs' });
  }
});

// Create class pack (admin)
router.post('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { name, description, credits, price, regularPrice, validityDays, features, isPopular } = req.body;

    const savings = regularPrice - price;

    const pack = new ClassPack({
      name,
      description,
      credits,
      price,
      regularPrice,
      savings,
      validityDays,
      features: features || [],
      isPopular: isPopular || false
    });

    await pack.save();
    res.status(201).json(pack);
  } catch (error) {
    console.error('Error creating class pack:', error);
    res.status(500).json({ error: 'Failed to create class pack' });
  }
});

// Update class pack (admin)
router.put('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { name, description, credits, price, regularPrice, validityDays, features, isActive, isPopular } = req.body;

    const savings = regularPrice - price;

    const pack = await ClassPack.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        credits,
        price,
        regularPrice,
        savings,
        validityDays,
        features,
        isActive,
        isPopular
      },
      { new: true }
    );

    if (!pack) {
      return res.status(404).json({ error: 'Class pack not found' });
    }

    res.json(pack);
  } catch (error) {
    console.error('Error updating class pack:', error);
    res.status(500).json({ error: 'Failed to update class pack' });
  }
});

// Delete class pack (admin)
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    await ClassPack.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class pack deleted successfully' });
  } catch (error) {
    console.error('Error deleting class pack:', error);
    res.status(500).json({ error: 'Failed to delete class pack' });
  }
});

// Purchase class pack
router.post('/:id/purchase', authenticateUser, async (req, res) => {
  try {
    const pack = await ClassPack.findById(req.params.id);

    if (!pack || !pack.isActive) {
      return res.status(404).json({ error: 'Class pack not found or inactive' });
    }

    const user = await User.findById(req.user.userId);

    // Create Stripe payment intent if Stripe is configured
    if (process.env.STRIPE_SECRET_KEY) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(pack.price * 100),
        currency: 'usd',
        metadata: {
          userId: user._id.toString(),
          userName: user.name,
          userEmail: user.email,
          classPackId: pack._id.toString(),
          classPackName: pack.name,
          credits: pack.credits.toString()
        }
      });

      // Create user credit record in pending state
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + pack.validityDays);

      const userCredit = new UserCredit({
        user: user._id,
        classPack: pack._id,
        creditsRemaining: pack.credits,
        creditsOriginal: pack.credits,
        expiryDate,
        amountPaid: pack.price,
        paymentIntentId: paymentIntent.id,
        status: 'active' // Will be activated via webhook
      });

      await userCredit.save();

      // Update user's available credits immediately
      user.availableCredits += pack.credits;
      await user.save();

      return res.json({
        clientSecret: paymentIntent.client_secret,
        userCredit,
        pack
      });
    }

    // Fallback if no Stripe (for testing)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + pack.validityDays);

    const userCredit = new UserCredit({
      user: user._id,
      classPack: pack._id,
      creditsRemaining: pack.credits,
      creditsOriginal: pack.credits,
      expiryDate,
      amountPaid: pack.price,
      status: 'active'
    });

    await userCredit.save();

    user.availableCredits += pack.credits;
    await user.save();

    res.json({
      userCredit,
      pack,
      message: 'Class pack purchased successfully'
    });
  } catch (error) {
    console.error('Error purchasing class pack:', error);
    res.status(500).json({ error: 'Failed to purchase class pack' });
  }
});

// Get user's credits
router.get('/my-credits', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const credits = await UserCredit.find({
      user: req.user.userId,
      status: 'active',
      isExpired: false
    }).populate('classPack').sort({ expiryDate: 1 });

    // Check and update expired credits
    for (let credit of credits) {
      if (!credit.isValid()) {
        await credit.save();
      }
    }

    const activeCredits = credits.filter(c => c.isValid());

    res.json({
      totalCredits: user.availableCredits,
      creditDetails: activeCredits
    });
  } catch (error) {
    console.error('Error fetching user credits:', error);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

module.exports = router;
