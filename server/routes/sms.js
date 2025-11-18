const express = require('express');
const router = express.Router();
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const { sendSMS, sendBulkSMS, formatPhoneNumber } = require('../services/smsService');
const { getAvailableVariables } = require('../utils/smsTemplates');
const Settings = require('../models/Settings');
const User = require('../models/User');

// Get SMS statistics
router.get('/stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const settings = await Settings.findById('site_settings');

    if (!settings || !settings.smsStats) {
      return res.json({
        totalSent: 0,
        totalFailed: 0,
        totalCost: 0,
        todaySent: 0,
        lastResetDate: new Date()
      });
    }

    res.json({
      totalSent: settings.smsStats.totalSent || 0,
      totalFailed: settings.smsStats.totalFailed || 0,
      totalCost: settings.smsStats.totalCost || 0,
      todaySent: settings.smsStats.todaySent || 0,
      lastResetDate: settings.smsStats.lastResetDate || new Date(),
      successRate: settings.smsStats.totalSent > 0
        ? ((settings.smsStats.totalSent / (settings.smsStats.totalSent + settings.smsStats.totalFailed)) * 100).toFixed(1)
        : 100
    });
  } catch (error) {
    console.error('Error fetching SMS statistics:', error);
    res.status(500).json({ error: 'Failed to fetch SMS statistics' });
  }
});

// Send test SMS
// Bypasses global SMS disable check for admin testing
router.post('/test', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        error: 'Phone number is required',
        errorType: 'MISSING_PHONE'
      });
    }

    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        errorType: 'MISSING_MESSAGE'
      });
    }

    // Validate phone number format
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return res.status(400).json({
        error: 'Invalid phone number format',
        errorType: 'INVALID_PHONE',
        details: 'Use E.164 format: +1234567890 or (123) 456-7890'
      });
    }

    // Send the test SMS with global check bypassed
    // This allows admins to test Twilio configuration even if SMS is globally disabled
    const result = await sendSMS(formattedPhone, message, { bypassGlobalCheck: true });

    if (result.success) {
      res.json({
        success: true,
        message: 'Test SMS sent successfully',
        sid: result.sid,
        phone: formattedPhone
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send test SMS',
        errorType: result.errorType || 'UNKNOWN_ERROR',
        details: result.details || 'Check server logs for more information'
      });
    }
  } catch (error) {
    console.error('Error sending test SMS:', error);
    res.status(500).json({
      error: 'Failed to send test SMS',
      errorType: 'SERVER_ERROR',
      details: error.message
    });
  }
});

// Get available template variables
router.get('/variables', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const variables = getAvailableVariables();
    res.json(variables);
  } catch (error) {
    console.error('Error fetching template variables:', error);
    res.status(500).json({ error: 'Failed to fetch template variables' });
  }
});

// Check Twilio configuration status
router.get('/config-status', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const hasTwilioSid = !!process.env.TWILIO_ACCOUNT_SID;
    const hasTwilioToken = !!process.env.TWILIO_AUTH_TOKEN;
    const hasTwilioPhone = !!process.env.TWILIO_PHONE_NUMBER;

    const configured = hasTwilioSid && hasTwilioToken && hasTwilioPhone;

    res.json({
      configured,
      hasTwilioSid,
      hasTwilioToken,
      hasTwilioPhone,
      phoneNumber: configured ? process.env.TWILIO_PHONE_NUMBER : null
    });
  } catch (error) {
    console.error('Error checking Twilio configuration:', error);
    res.status(500).json({ error: 'Failed to check configuration' });
  }
});

// Reset daily SMS counter (typically called by cron job)
router.post('/reset-daily', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const settings = await Settings.findById('site_settings');

    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    settings.smsStats.todaySent = 0;
    settings.smsStats.lastResetDate = new Date();
    await settings.save();

    res.json({
      success: true,
      message: 'Daily SMS counter reset successfully',
      lastResetDate: settings.smsStats.lastResetDate
    });
  } catch (error) {
    console.error('Error resetting daily SMS counter:', error);
    res.status(500).json({ error: 'Failed to reset daily counter' });
  }
});

// Send bulk SMS to multiple recipients
router.post('/bulk', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { recipientFilter, message, testMode } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build query based on filter
    let query = {};

    if (recipientFilter.type === 'all') {
      query = {}; // All users
    } else if (recipientFilter.type === 'members') {
      query = { 'membership.isActive': true };
    } else if (recipientFilter.type === 'tier') {
      query = { 'membership.membershipTier': recipientFilter.tierName };
    } else if (recipientFilter.type === 'custom') {
      // Custom phone number list
      if (!recipientFilter.phoneNumbers || recipientFilter.phoneNumbers.length === 0) {
        return res.status(400).json({ error: 'Phone numbers are required for custom list' });
      }
    }

    let recipients;

    if (recipientFilter.type === 'custom') {
      // Use provided phone numbers
      recipients = recipientFilter.phoneNumbers.map(phone => ({
        phone,
        name: 'Custom recipient'
      }));
    } else {
      // Query users from database
      recipients = await User.find(query).select('phone name smsPreferences');

      // Filter out users who opted out of SMS
      recipients = recipients.filter(user => {
        return user.phone && user.smsPreferences?.enabled !== false;
      });
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No eligible recipients found' });
    }

    // Test mode: just return count and cost estimate
    if (testMode) {
      return res.json({
        testMode: true,
        recipientCount: recipients.length,
        estimatedCost: (recipients.length * 0.0075).toFixed(2),
        recipients: recipients.slice(0, 5).map(r => ({ phone: r.phone, name: r.name })) // Show first 5
      });
    }

    // Send bulk SMS
    const phoneNumbers = recipients.map(r => r.phone);
    const result = await sendBulkSMS(phoneNumbers, message);

    res.json({
      success: true,
      totalRecipients: recipients.length,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors
    });
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    res.status(500).json({ error: 'Failed to send bulk SMS' });
  }
});

module.exports = router;
