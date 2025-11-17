const express = require('express');
const router = express.Router();
const EmailSubscriber = require('../models/EmailSubscriber');
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all subscribers (admin only)
router.get('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      isSubscribed,
      isBlocked
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    if (isSubscribed !== undefined) {
      query.isSubscribed = isSubscribed === 'true';
    }

    if (isBlocked !== undefined) {
      query.isBlocked = isBlocked === 'true';
    }

    const total = await EmailSubscriber.countDocuments(query);
    const subscribers = await EmailSubscriber.find(query)
      .populate('lists', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    res.json({
      subscribers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// Get single subscriber (admin only)
router.get('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const subscriber = await EmailSubscriber.findById(req.params.id)
      .populate('lists', 'name description')
      .populate('userId', 'name email');

    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    res.json(subscriber);
  } catch (error) {
    console.error('Error fetching subscriber:', error);
    res.status(500).json({ error: 'Failed to fetch subscriber' });
  }
});

// Create subscriber (admin only)
router.post('/',
  authenticateUser,
  requireAdmin,
  [
    body('email').isEmail().withMessage('Valid email is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, name, tags, preferences } = req.body;

      const subscriber = await EmailSubscriber.findOrCreate(email, {
        name,
        tags,
        preferences,
        source: 'manual_import'
      });

      res.status(201).json({
        message: 'Subscriber created successfully',
        subscriber
      });
    } catch (error) {
      console.error('Error creating subscriber:', error);
      res.status(500).json({ error: 'Failed to create subscriber' });
    }
  }
);

// Update subscriber (admin only)
router.put('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { name, tags, preferences, isSubscribed, isBlocked } = req.body;

    const subscriber = await EmailSubscriber.findById(req.params.id);

    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    if (name !== undefined) subscriber.name = name;
    if (tags !== undefined) subscriber.tags = tags;
    if (preferences !== undefined) subscriber.preferences = { ...subscriber.preferences, ...preferences };
    if (isSubscribed !== undefined) {
      if (isSubscribed && !subscriber.isSubscribed) {
        await subscriber.resubscribe();
      } else if (!isSubscribed && subscriber.isSubscribed) {
        await subscriber.unsubscribe('Admin action');
      }
    }
    if (isBlocked !== undefined) subscriber.isBlocked = isBlocked;

    await subscriber.save();

    res.json({
      message: 'Subscriber updated successfully',
      subscriber
    });
  } catch (error) {
    console.error('Error updating subscriber:', error);
    res.status(500).json({ error: 'Failed to update subscriber' });
  }
});

// Delete subscriber (admin only)
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const subscriber = await EmailSubscriber.findByIdAndDelete(req.params.id);

    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }

    res.json({ message: 'Subscriber deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    res.status(500).json({ error: 'Failed to delete subscriber' });
  }
});

// Unsubscribe (public endpoint - no auth required)
router.post('/unsubscribe',
  [
    body('email').isEmail().withMessage('Valid email is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, reason } = req.body;

      const subscriber = await EmailSubscriber.findOne({ email: email.toLowerCase() });

      if (!subscriber) {
        return res.status(404).json({ error: 'Email not found in our system' });
      }

      if (!subscriber.isSubscribed) {
        return res.json({ message: 'You are already unsubscribed' });
      }

      await subscriber.unsubscribe(reason);

      res.json({ message: 'You have been successfully unsubscribed' });
    } catch (error) {
      console.error('Error unsubscribing:', error);
      res.status(500).json({ error: 'Failed to unsubscribe' });
    }
  }
);

// Resubscribe (public endpoint - no auth required)
router.post('/resubscribe',
  [
    body('email').isEmail().withMessage('Valid email is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      const subscriber = await EmailSubscriber.findOne({ email: email.toLowerCase() });

      if (!subscriber) {
        return res.status(404).json({ error: 'Email not found in our system' });
      }

      if (subscriber.isSubscribed) {
        return res.json({ message: 'You are already subscribed' });
      }

      await subscriber.resubscribe();

      res.json({ message: 'You have been successfully resubscribed' });
    } catch (error) {
      console.error('Error resubscribing:', error);
      res.status(500).json({ error: 'Failed to resubscribe' });
    }
  }
);

// Update preferences (public endpoint - no auth required)
router.post('/preferences',
  [
    body('email').isEmail().withMessage('Valid email is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, preferences } = req.body;

      const subscriber = await EmailSubscriber.findOne({ email: email.toLowerCase() });

      if (!subscriber) {
        return res.status(404).json({ error: 'Email not found in our system' });
      }

      subscriber.preferences = { ...subscriber.preferences, ...preferences };
      await subscriber.save();

      res.json({
        message: 'Preferences updated successfully',
        preferences: subscriber.preferences
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }
);

// Get subscriber by email (public endpoint for preference center)
router.get('/by-email/:email', async (req, res) => {
  try {
    const subscriber = await EmailSubscriber.findOne({
      email: req.params.email.toLowerCase()
    });

    if (!subscriber) {
      return res.status(404).json({ error: 'Email not found in our system' });
    }

    // Return limited public info
    res.json({
      email: subscriber.email,
      name: subscriber.name,
      isSubscribed: subscriber.isSubscribed,
      preferences: subscriber.preferences
    });
  } catch (error) {
    console.error('Error fetching subscriber:', error);
    res.status(500).json({ error: 'Failed to fetch subscriber' });
  }
});

// Bulk operations (admin only)
router.post('/bulk-action', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { action, subscriberIds } = req.body;

    if (!action || !subscriberIds || !Array.isArray(subscriberIds)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    let result;

    switch (action) {
      case 'unsubscribe':
        result = await EmailSubscriber.updateMany(
          { _id: { $in: subscriberIds } },
          {
            isSubscribed: false,
            unsubscribedAt: new Date(),
            unsubscribeReason: 'Bulk admin action'
          }
        );
        break;

      case 'resubscribe':
        result = await EmailSubscriber.updateMany(
          { _id: { $in: subscriberIds } },
          {
            isSubscribed: true,
            unsubscribedAt: null,
            unsubscribeReason: null
          }
        );
        break;

      case 'block':
        result = await EmailSubscriber.updateMany(
          { _id: { $in: subscriberIds } },
          {
            isBlocked: true,
            blockReason: 'Admin action'
          }
        );
        break;

      case 'unblock':
        result = await EmailSubscriber.updateMany(
          { _id: { $in: subscriberIds } },
          { isBlocked: false, blockReason: null }
        );
        break;

      case 'delete':
        result = await EmailSubscriber.deleteMany({
          _id: { $in: subscriberIds }
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({
      message: `Bulk ${action} completed`,
      modifiedCount: result.modifiedCount || result.deletedCount
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ error: 'Failed to perform bulk action' });
  }
});

module.exports = router;
