const express = require('express');
const router = express.Router();
const EmailCampaign = require('../models/EmailCampaign');
const EmailList = require('../models/EmailList');
const EmailSubscriber = require('../models/EmailSubscriber');
const User = require('../models/User');
const Booking = require('../models/Booking');
const PromoCode = require('../models/PromoCode');
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

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
    const { recipients, customEmails, emailLists } = req.body;

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
    } else if (recipients === 'email_list' && emailLists && emailLists.length > 0) {
      // Get subscribers from selected email lists
      for (const listId of emailLists) {
        const list = await EmailList.findById(listId);
        if (list) {
          if (list.type === 'static') {
            const subscribers = await EmailSubscriber.find({
              _id: { $in: list.subscribers },
              isSubscribed: true,
              isBlocked: false
            });
            emails.push(...subscribers.map(s => s.email));
          } else {
            const subscribers = await list.getDynamicSubscribers();
            emails.push(...subscribers.filter(s => !s.isBlocked).map(s => s.email));
          }
        }
      }
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
        emailLists,
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
        emailLists: emailLists || [],
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

// Test send email (admin only) - Send to specific test email addresses
router.post('/test-send', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { subject, message, testEmails, promoCode } = req.body;

    if (!testEmails || testEmails.length === 0) {
      return res.status(400).json({ error: 'At least one test email is required' });
    }

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    // Check email configuration
    const useSendGrid = !!process.env.SENDGRID_API_KEY;
    const useSMTP = !!process.env.EMAIL_USER;

    if (!useSendGrid && !useSMTP) {
      return res.status(500).json({ error: 'Email not configured on server. Please set SENDGRID_API_KEY or EMAIL_USER.' });
    }

    // Get unsubscribe URL
    const unsubscribeUrl = `${process.env.CLIENT_URL}/unsubscribe`;

    // Build email HTML
    let emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
          <strong style="color: #c9a86a;">TEST EMAIL</strong> - This is a test send. No campaign has been created.
        </div>

        <h1 style="color: #1a1a1a; border-bottom: 2px solid #c9a86a; padding-bottom: 10px;">
          The Fever Studio
        </h1>

        <div style="padding: 20px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>

        ${promoCode ? `
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
            <h2 style="margin: 0 0 10px 0; font-size: 18px;">Special Offer</h2>
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; display: inline-block;">
              <div style="font-size: 14px; margin-bottom: 5px;">Use Code:</div>
              <div style="font-size: 28px; font-weight: bold; letter-spacing: 2px;">${promoCode}</div>
            </div>
          </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
          <p>The Fever Studio | Your Fitness Journey</p>
          <p><a href="${unsubscribeUrl}" style="color: #c9a86a;">Unsubscribe</a></p>
        </div>
      </div>
    `;

    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    // Send to each test email
    for (const email of testEmails) {
      try {
        if (useSendGrid) {
          await sgMail.send({
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL || 'noreply@feverstudio.com',
            subject: `[TEST] ${subject}`,
            html: emailHtml
          });
        } else {
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD
            }
          });

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: `[TEST] ${subject}`,
            html: emailHtml
          });
        }
        successCount++;
      } catch (error) {
        console.error(`Failed to send test email to ${email}:`, error);
        failureCount++;
        errors.push({ email, error: error.message });
      }
    }

    res.json({
      message: `Test email sent to ${successCount} recipient(s)`,
      successCount,
      failureCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

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

    // Check email configuration
    const useSendGrid = !!process.env.SENDGRID_API_KEY;
    const useSMTP = !!process.env.EMAIL_USER;

    if (!useSendGrid && !useSMTP) {
      return res.status(500).json({ error: 'Email not configured on server. Please set SENDGRID_API_KEY or EMAIL_USER.' });
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
    } else if (campaign.recipients === 'email_list') {
      // Get subscribers from email lists
      for (const listId of campaign.emailLists) {
        const list = await EmailList.findById(listId);
        if (list) {
          if (list.type === 'static') {
            const subscribers = await EmailSubscriber.find({
              _id: { $in: list.subscribers },
              isSubscribed: true,
              isBlocked: false
            });
            emails.push(...subscribers.map(s => s.email));
          } else {
            const subscribers = await list.getDynamicSubscribers();
            emails.push(...subscribers.filter(s => !s.isBlocked).map(s => s.email));
          }
        }
      }
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
    const useSendGrid = !!process.env.SENDGRID_API_KEY;
    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    // Get unsubscribe URL
    const unsubscribeUrl = `${process.env.CLIENT_URL}/unsubscribe`;

    // Build email HTML
    let emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a; border-bottom: 2px solid #c9a86a; padding-bottom: 10px;">
          The Fever Studio
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

        <p style="color: #999; font-size: 0.75em; text-align: center; margin-top: 20px;">
          <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a> |
          <a href="${process.env.CLIENT_URL}/email-preferences" style="color: #999;">Manage Preferences</a>
        </p>
      </div>
    `;

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER || 'noreply@feverstudio.com';

    // Send emails
    if (useSendGrid) {
      // Use SendGrid for sending
      for (const email of emails) {
        try {
          await sgMail.send({
            to: email,
            from: {
              email: fromEmail,
              name: 'The Fever Studio'
            },
            subject: campaign.subject,
            html: emailHtml,
            trackingSettings: {
              clickTracking: { enable: true },
              openTracking: { enable: true }
            }
          });

          // Update subscriber stats
          const subscriber = await EmailSubscriber.findOne({ email: email.toLowerCase() });
          if (subscriber) {
            await subscriber.recordEmailSent();
          }

          successCount++;
          console.log(`Email sent via SendGrid to: ${email}`);
        } catch (error) {
          failureCount++;
          errors.push({
            email,
            error: error.message,
            timestamp: new Date()
          });
          console.error(`Failed to send to ${email}:`, error.message);

          // Record bounce if applicable
          if (error.code === 550) {
            const subscriber = await EmailSubscriber.findOne({ email: email.toLowerCase() });
            if (subscriber) {
              await subscriber.recordBounce('hard');
            }
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } else {
      // Fallback to SMTP (nodemailer) - keeping for backward compatibility
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      for (const email of emails) {
        try {
          await transporter.sendMail({
            from: `"The Fever Studio" <${fromEmail}>`,
            to: email,
            subject: campaign.subject,
            html: emailHtml
          });

          const subscriber = await EmailSubscriber.findOne({ email: email.toLowerCase() });
          if (subscriber) {
            await subscriber.recordEmailSent();
          }

          successCount++;
          console.log(`Email sent via SMTP to: ${email}`);
        } catch (error) {
          failureCount++;
          errors.push({
            email,
            error: error.message,
            timestamp: new Date()
          });
          console.error(`Failed to send to ${email}:`, error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }
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
