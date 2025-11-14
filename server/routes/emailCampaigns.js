const express = require('express');
const router = express.Router();
const EmailCampaign = require('../models/EmailCampaign');
const User = require('../models/User');
const Booking = require('../models/Booking');
const PromoCode = require('../models/PromoCode');
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Get all email campaigns (admin only)
router.get('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const campaigns = await EmailCampaign.find()
      .populate('createdBy', 'name email')
      .populate('includedPromoCode', 'code description')
      .sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch email campaigns' });
  }
});

// Get campaign by ID (admin only)
router.get('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('includedPromoCode');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Get recipient count preview (admin only)
router.post('/preview-recipients', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { recipients, customEmails } = req.body;

    let emails = [];

    if (recipients === 'all') {
      // All users who have ever booked
      const bookings = await Booking.find().distinct('email');
      emails = bookings;
    } else if (recipients === 'past_customers') {
      // Users with completed bookings
      const bookings = await Booking.find({ paymentStatus: 'completed' }).distinct('email');
      emails = bookings;
    } else if (recipients === 'recent') {
      // Users who booked in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const bookings = await Booking.find({ createdAt: { $gte: thirtyDaysAgo } }).distinct('email');
      emails = bookings;
    } else if (recipients === 'custom' && customEmails) {
      emails = customEmails.filter(email => email.trim() !== '');
    }

    // Remove duplicates
    emails = [...new Set(emails)];

    res.json({
      count: emails.length,
      emails: emails.slice(0, 10) // Return first 10 as preview
    });
  } catch (error) {
    console.error('Error previewing recipients:', error);
    res.status(500).json({ error: 'Failed to preview recipients' });
  }
});

// Create email campaign (admin only)
router.post('/',
  authenticateUser,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Campaign name is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('recipients').isIn(['all', 'past_customers', 'recent', 'custom']).withMessage('Invalid recipients')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        name,
        subject,
        message,
        templateType,
        recipients,
        customEmails,
        includedPromoCode,
        scheduledFor
      } = req.body;

      const campaign = new EmailCampaign({
        name,
        subject,
        message,
        templateType: templateType || 'custom',
        recipients,
        customEmails: customEmails || [],
        includedPromoCode: includedPromoCode || null,
        scheduledFor: scheduledFor || null,
        status: 'draft',
        createdBy: req.user.userId
      });

      await campaign.save();

      res.status(201).json({
        message: 'Campaign created successfully',
        campaign
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }
);

// Send email campaign (admin only)
router.post('/:id/send', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id)
      .populate('includedPromoCode');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === 'sent') {
      return res.status(400).json({ error: 'Campaign already sent' });
    }

    if (!process.env.EMAIL_USER) {
      return res.status(500).json({ error: 'Email not configured on server' });
    }

    // Get recipient emails
    let emails = [];

    if (campaign.recipients === 'all') {
      const bookings = await Booking.find().distinct('email');
      emails = bookings;
    } else if (campaign.recipients === 'past_customers') {
      const bookings = await Booking.find({ paymentStatus: 'completed' }).distinct('email');
      emails = bookings;
    } else if (campaign.recipients === 'recent') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const bookings = await Booking.find({ createdAt: { $gte: thirtyDaysAgo } }).distinct('email');
      emails = bookings;
    } else if (campaign.recipients === 'custom') {
      emails = campaign.customEmails;
    }

    // Remove duplicates
    emails = [...new Set(emails)];

    campaign.totalRecipients = emails.length;
    campaign.status = 'sending';
    await campaign.save();

    // Send emails asynchronously
    sendCampaignEmails(campaign, emails);

    res.json({
      message: 'Campaign is being sent',
      campaign,
      recipientCount: emails.length
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({ error: 'Failed to send campaign' });
  }
});

// Function to send emails (runs in background)
async function sendCampaignEmails(campaign, emails) {
  try {
    const transporter = createTransporter();
    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    // Build email HTML
    let emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a; border-bottom: 2px solid #c9a86a; padding-bottom: 10px;">
          The Fever Collective
        </h1>

        <div style="padding: 20px 0;">
          ${campaign.message.replace(/\n/g, '<br>')}
        </div>

        ${campaign.includedPromoCode ? `
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #c9a86a;">
            <h3 style="margin-top: 0; color: #c9a86a;">Special Offer!</h3>
            <p style="font-size: 1.2rem; margin: 10px 0;">
              Use code <strong style="font-size: 1.5rem; color: #1a1a1a;">${campaign.includedPromoCode.code}</strong>
            </p>
            <p style="color: #666;">${campaign.includedPromoCode.description}</p>
          </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/events"
             style="background-color: #1a1a1a; color: #e8e8e8; padding: 12px 30px;
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            View Events
          </a>
        </div>

        <p style="color: #666; font-size: 0.9em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          Questions? Reply to this email and we'll be happy to help!
        </p>
      </div>
    `;

    // Send to each recipient
    for (const email of emails) {
      try {
        await transporter.sendMail({
          from: `"The Fever Collective" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: campaign.subject,
          html: emailHtml
        });
        successCount++;
        console.log(`Email sent to: ${email}`);
      } catch (error) {
        failureCount++;
        errors.push({
          email,
          error: error.message,
          timestamp: new Date()
        });
        console.error(`Failed to send to ${email}:`, error.message);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update campaign status
    campaign.status = 'sent';
    campaign.sentAt = new Date();
    campaign.successCount = successCount;
    campaign.failureCount = failureCount;
    campaign.errors = errors;
    await campaign.save();

    console.log(`Campaign "${campaign.name}" sent: ${successCount} success, ${failureCount} failed`);
  } catch (error) {
    console.error('Error in sendCampaignEmails:', error);
    campaign.status = 'failed';
    await campaign.save();
  }
}

// Delete campaign (admin only)
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findByIdAndDelete(req.params.id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

module.exports = router;
