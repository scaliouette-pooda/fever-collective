const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { AutomatedCampaign, AutomatedEmailLog } = require('../models/AutomatedCampaign');
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const { validateRequestBody, sanitizeInput } = require('../middleware/validation');

// Get all automated campaigns
router.get('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const campaigns = await AutomatedCampaign.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching automated campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch automated campaigns' });
  }
});

// Get single automated campaign
router.get('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const campaign = await AutomatedCampaign.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create automated campaign
router.post('/',
  authenticateUser,
  requireAdmin,
  sanitizeInput,
  [
    body('name').trim().notEmpty().withMessage('Campaign name is required'),
    body('triggerType').isIn([
      'new_registration',
      'class_reminder',
      'inactive_user',
      'credit_expiring',
      'milestone_achieved',
      'membership_expiring',
      'post_class',
      'abandoned_booking'
    ]).withMessage('Valid trigger type is required'),
    body('emailSequence').isArray({ min: 1 }).withMessage('At least one email in sequence is required'),
    body('emailSequence.*.subject').trim().notEmpty().withMessage('Email subject is required'),
    body('emailSequence.*.message').trim().notEmpty().withMessage('Email message is required')
  ],
  validateRequestBody(),
  async (req, res) => {
    try {
      const {
        name,
        description,
        triggerType,
        triggerConfig,
        emailSequence,
        targetAudience,
        isActive
      } = req.body;

      // Validate email sequence step numbers
      const sequenceWithStepNumbers = emailSequence.map((step, index) => ({
        ...step,
        stepNumber: index + 1
      }));

      const campaign = new AutomatedCampaign({
        name,
        description,
        triggerType,
        triggerConfig: triggerConfig || {},
        emailSequence: sequenceWithStepNumbers,
        targetAudience: targetAudience || { includeAll: true, membershipTiers: [] },
        isActive: isActive || false,
        createdBy: req.user.userId
      });

      await campaign.save();

      res.status(201).json({
        message: 'Automated campaign created successfully',
        campaign
      });
    } catch (error) {
      console.error('Error creating automated campaign:', error);
      if (error.code === 11000) {
        return res.status(400).json({ error: 'A campaign with this name already exists' });
      }
      res.status(500).json({ error: 'Failed to create automated campaign' });
    }
  }
);

// Update automated campaign
router.patch('/:id',
  authenticateUser,
  requireAdmin,
  sanitizeInput,
  [
    body('name').optional().trim().notEmpty().withMessage('Campaign name cannot be empty'),
    body('triggerType').optional().isIn([
      'new_registration',
      'class_reminder',
      'inactive_user',
      'credit_expiring',
      'milestone_achieved',
      'membership_expiring',
      'post_class',
      'abandoned_booking'
    ]).withMessage('Valid trigger type is required')
  ],
  validateRequestBody(),
  async (req, res) => {
    try {
      const campaign = await AutomatedCampaign.findById(req.params.id);

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const {
        name,
        description,
        triggerType,
        triggerConfig,
        emailSequence,
        targetAudience,
        isActive
      } = req.body;

      if (name) campaign.name = name;
      if (description !== undefined) campaign.description = description;
      if (triggerType) campaign.triggerType = triggerType;
      if (triggerConfig) campaign.triggerConfig = triggerConfig;
      if (targetAudience) campaign.targetAudience = targetAudience;
      if (isActive !== undefined) campaign.isActive = isActive;

      if (emailSequence) {
        // Update email sequence with proper step numbers
        campaign.emailSequence = emailSequence.map((step, index) => ({
          ...step,
          stepNumber: index + 1
        }));
      }

      await campaign.save();

      res.json({
        message: 'Campaign updated successfully',
        campaign
      });
    } catch (error) {
      console.error('Error updating campaign:', error);
      if (error.code === 11000) {
        return res.status(400).json({ error: 'A campaign with this name already exists' });
      }
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  }
);

// Toggle campaign active status
router.patch('/:id/toggle',
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const campaign = await AutomatedCampaign.findById(req.params.id);

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      campaign.isActive = !campaign.isActive;
      await campaign.save();

      res.json({
        message: `Campaign ${campaign.isActive ? 'activated' : 'deactivated'} successfully`,
        campaign
      });
    } catch (error) {
      console.error('Error toggling campaign:', error);
      res.status(500).json({ error: 'Failed to toggle campaign status' });
    }
  }
);

// Delete automated campaign
router.delete('/:id',
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const campaign = await AutomatedCampaign.findById(req.params.id);

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Delete associated email logs
      await AutomatedEmailLog.deleteMany({ campaign: campaign._id });

      await campaign.deleteOne();

      res.json({
        message: 'Campaign deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  }
);

// Get campaign statistics
router.get('/:id/stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const campaign = await AutomatedCampaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get email log stats
    const scheduled = await AutomatedEmailLog.countDocuments({
      campaign: campaign._id,
      status: 'scheduled'
    });

    const sent = await AutomatedEmailLog.countDocuments({
      campaign: campaign._id,
      status: 'sent'
    });

    const failed = await AutomatedEmailLog.countDocuments({
      campaign: campaign._id,
      status: 'failed'
    });

    // Get recent emails
    const recentEmails = await AutomatedEmailLog.find({
      campaign: campaign._id
    })
      .sort({ sentAt: -1 })
      .limit(10)
      .populate('recipient', 'name email');

    res.json({
      campaign: {
        id: campaign._id,
        name: campaign.name,
        isActive: campaign.isActive
      },
      stats: {
        totalTriggered: campaign.stats.totalTriggered,
        totalSent: campaign.stats.totalSent,
        totalFailed: campaign.stats.totalFailed,
        scheduled,
        sent,
        failed,
        lastTriggeredAt: campaign.stats.lastTriggeredAt
      },
      recentEmails
    });
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({ error: 'Failed to fetch campaign statistics' });
  }
});

// Get all scheduled emails for a campaign
router.get('/:id/scheduled', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const campaign = await AutomatedCampaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const scheduledEmails = await AutomatedEmailLog.find({
      campaign: campaign._id,
      status: 'scheduled'
    })
      .sort({ scheduledFor: 1 })
      .skip(skip)
      .limit(limit)
      .populate('recipient', 'name email');

    const total = await AutomatedEmailLog.countDocuments({
      campaign: campaign._id,
      status: 'scheduled'
    });

    res.json({
      scheduledEmails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching scheduled emails:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled emails' });
  }
});

// Cancel scheduled email
router.delete('/scheduled/:emailLogId',
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const emailLog = await AutomatedEmailLog.findById(req.params.emailLogId);

      if (!emailLog) {
        return res.status(404).json({ error: 'Scheduled email not found' });
      }

      if (emailLog.status !== 'scheduled') {
        return res.status(400).json({ error: 'Can only cancel scheduled emails' });
      }

      emailLog.status = 'cancelled';
      await emailLog.save();

      res.json({
        message: 'Scheduled email cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling scheduled email:', error);
      res.status(500).json({ error: 'Failed to cancel scheduled email' });
    }
  }
);

module.exports = router;
