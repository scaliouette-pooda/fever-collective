const express = require('express');
const router = express.Router();
const EmailList = require('../models/EmailList');
const EmailSubscriber = require('../models/EmailSubscriber');
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all email lists (admin only)
router.get('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const lists = await EmailList.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Update subscriber counts for dynamic lists
    for (const list of lists) {
      if (list.type === 'dynamic') {
        await list.updateSubscriberCount();
      }
    }

    res.json(lists);
  } catch (error) {
    console.error('Error fetching email lists:', error);
    res.status(500).json({ error: 'Failed to fetch email lists' });
  }
});

// Get single email list (admin only)
router.get('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const list = await EmailList.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('subscribers');

    if (!list) {
      return res.status(404).json({ error: 'Email list not found' });
    }

    // For dynamic lists, get current subscribers
    if (list.type === 'dynamic') {
      const subscribers = await list.getDynamicSubscribers();
      return res.json({ ...list.toObject(), dynamicSubscribers: subscribers });
    }

    res.json(list);
  } catch (error) {
    console.error('Error fetching email list:', error);
    res.status(500).json({ error: 'Failed to fetch email list' });
  }
});

// Create email list (admin only)
router.post('/',
  authenticateUser,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('List name is required'),
    body('type').isIn(['static', 'dynamic']).withMessage('Invalid list type')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        description,
        type,
        dynamicCriteria
      } = req.body;

      const list = new EmailList({
        name,
        description,
        type,
        dynamicCriteria: type === 'dynamic' ? dynamicCriteria : undefined,
        createdBy: req.user.userId
      });

      await list.save();

      if (type === 'dynamic') {
        await list.updateSubscriberCount();
      }

      res.status(201).json({
        message: 'Email list created successfully',
        list
      });
    } catch (error) {
      console.error('Error creating email list:', error);
      res.status(500).json({ error: 'Failed to create email list' });
    }
  }
);

// Update email list (admin only)
router.put('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { name, description, dynamicCriteria, isActive } = req.body;

    const list = await EmailList.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ error: 'Email list not found' });
    }

    if (name) list.name = name;
    if (description !== undefined) list.description = description;
    if (isActive !== undefined) list.isActive = isActive;

    if (list.type === 'dynamic' && dynamicCriteria) {
      list.dynamicCriteria = dynamicCriteria;
    }

    await list.save();

    if (list.type === 'dynamic') {
      await list.updateSubscriberCount();
    }

    res.json({
      message: 'Email list updated successfully',
      list
    });
  } catch (error) {
    console.error('Error updating email list:', error);
    res.status(500).json({ error: 'Failed to update email list' });
  }
});

// Delete email list (admin only)
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const list = await EmailList.findByIdAndDelete(req.params.id);

    if (!list) {
      return res.status(404).json({ error: 'Email list not found' });
    }

    res.json({ message: 'Email list deleted successfully' });
  } catch (error) {
    console.error('Error deleting email list:', error);
    res.status(500).json({ error: 'Failed to delete email list' });
  }
});

// Add subscriber to list (admin only)
router.post('/:id/subscribers',
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

      const list = await EmailList.findById(req.params.id);

      if (!list) {
        return res.status(404).json({ error: 'Email list not found' });
      }

      if (list.type !== 'static') {
        return res.status(400).json({ error: 'Can only add subscribers to static lists' });
      }

      const { email, name } = req.body;

      // Find or create subscriber
      const subscriber = await EmailSubscriber.findOrCreate(email, { name });

      // Add to list if not already there
      if (!list.subscribers.includes(subscriber._id)) {
        list.subscribers.push(subscriber._id);
        await list.updateSubscriberCount();
      }

      // Add list to subscriber's lists
      if (!subscriber.lists.includes(list._id)) {
        subscriber.lists.push(list._id);
        await subscriber.save();
      }

      res.json({
        message: 'Subscriber added successfully',
        list,
        subscriber
      });
    } catch (error) {
      console.error('Error adding subscriber:', error);
      res.status(500).json({ error: 'Failed to add subscriber' });
    }
  }
);

// Remove subscriber from list (admin only)
router.delete('/:id/subscribers/:subscriberId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const list = await EmailList.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ error: 'Email list not found' });
    }

    if (list.type !== 'static') {
      return res.status(400).json({ error: 'Can only remove subscribers from static lists' });
    }

    const subscriberId = req.params.subscriberId;

    // Remove from list
    list.subscribers = list.subscribers.filter(id => id.toString() !== subscriberId);
    await list.updateSubscriberCount();

    // Remove list from subscriber
    const subscriber = await EmailSubscriber.findById(subscriberId);
    if (subscriber) {
      subscriber.lists = subscriber.lists.filter(id => id.toString() !== list._id.toString());
      await subscriber.save();
    }

    res.json({ message: 'Subscriber removed successfully', list });
  } catch (error) {
    console.error('Error removing subscriber:', error);
    res.status(500).json({ error: 'Failed to remove subscriber' });
  }
});

// Bulk import subscribers (admin only)
router.post('/:id/import',
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const list = await EmailList.findById(req.params.id);

      if (!list) {
        return res.status(404).json({ error: 'Email list not found' });
      }

      if (list.type !== 'static') {
        return res.status(400).json({ error: 'Can only import to static lists' });
      }

      const { subscribers } = req.body;

      if (!Array.isArray(subscribers) || subscribers.length === 0) {
        return res.status(400).json({ error: 'Subscribers array is required' });
      }

      const results = await EmailSubscriber.bulkImport(subscribers, 'manual_import');

      // Add imported subscribers to list
      const importedEmails = subscribers.map(s => s.email.toLowerCase());
      const importedSubscribers = await EmailSubscriber.find({
        email: { $in: importedEmails }
      });

      for (const subscriber of importedSubscribers) {
        if (!list.subscribers.includes(subscriber._id)) {
          list.subscribers.push(subscriber._id);
        }
        if (!subscriber.lists.includes(list._id)) {
          subscriber.lists.push(list._id);
          await subscriber.save();
        }
      }

      await list.updateSubscriberCount();

      res.json({
        message: 'Import completed',
        results,
        list
      });
    } catch (error) {
      console.error('Error importing subscribers:', error);
      res.status(500).json({ error: 'Failed to import subscribers' });
    }
  }
);

// Export subscribers (admin only)
router.get('/:id/export', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const list = await EmailList.findById(req.params.id);

    if (!list) {
      return res.status(404).json({ error: 'Email list not found' });
    }

    let subscribers;

    if (list.type === 'static') {
      subscribers = await EmailSubscriber.find({
        _id: { $in: list.subscribers }
      });
    } else {
      subscribers = await list.getDynamicSubscribers();
    }

    // Format for CSV export
    const csvData = subscribers.map(sub => ({
      email: sub.email,
      name: sub.name || '',
      isSubscribed: sub.isSubscribed,
      totalEmailsSent: sub.totalEmailsSent,
      totalEmailsOpened: sub.totalEmailsOpened,
      createdAt: sub.createdAt
    }));

    res.json({
      listName: list.name,
      count: csvData.length,
      subscribers: csvData
    });
  } catch (error) {
    console.error('Error exporting subscribers:', error);
    res.status(500).json({ error: 'Failed to export subscribers' });
  }
});

module.exports = router;
