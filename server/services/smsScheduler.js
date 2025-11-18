// SMS Scheduler Service
// Processes scheduled SMS messages from automated campaigns

const { AutomatedEmailLog } = require('../models/AutomatedCampaign');
const { sendSMS } = require('./smsService');
const { replaceVariables } = require('../utils/smsTemplates');
const Settings = require('../models/Settings');

/**
 * Process scheduled SMS messages
 * Called by cron job every 5 minutes
 */
const processScheduledSMS = async () => {
  try {
    // Check if SMS is globally enabled
    const settings = await Settings.findById('site_settings');
    if (!settings || !settings.smsConfig?.enabled) {
      console.log('SMS globally disabled - skipping scheduled SMS processing');
      return;
    }

    const now = new Date();

    // Find email logs that:
    // 1. Are scheduled for now or earlier
    // 2. Have SMS pending (smsStatus = 'not_sent')
    // 3. Belong to a campaign with SMS enabled in at least one step
    const pendingLogs = await AutomatedEmailLog.find({
      scheduledFor: { $lte: now },
      smsStatus: 'not_sent'
    })
      .populate('campaign')
      .populate('recipient')
      .limit(50); // Process max 50 at a time to avoid rate limiting

    if (pendingLogs.length === 0) {
      return; // No pending SMS to send
    }

    console.log(`📱 Processing ${pendingLogs.length} scheduled SMS messages`);

    let sent = 0;
    let failed = 0;

    for (const log of pendingLogs) {
      try {
        // Skip if campaign not found
        if (!log.campaign) {
          console.log(`Campaign not found for log ${log._id}`);
          log.smsStatus = 'skipped';
          await log.save();
          continue;
        }

        // Find the specific email step in the campaign
        const step = log.campaign.emailSequence.find(
          s => s.stepNumber === log.sequenceStep
        );

        // Skip if step not found or SMS not enabled for this step
        if (!step || !step.sendSMS || !step.smsMessage) {
          log.smsStatus = 'skipped';
          await log.save();
          continue;
        }

        // Skip if recipient doesn't have phone number
        if (!log.recipient.phone) {
          console.log(`No phone number for user ${log.recipient.email}`);
          log.smsStatus = 'skipped';
          log.smsError = 'No phone number';
          await log.save();
          continue;
        }

        // Check if user has SMS preferences enabled
        if (log.recipient.smsPreferences && log.recipient.smsPreferences.enabled === false) {
          console.log(`User ${log.recipient.email} has opted out of SMS`);
          log.smsStatus = 'skipped';
          log.smsError = 'User opted out';
          await log.save();
          continue;
        }

        // Replace variables in SMS message
        const smsMessage = replaceVariables(step.smsMessage, {
          name: log.recipient.name,
          userName: log.recipient.name,
          email: log.recipient.email,
          ...log.triggerData // Include event-specific data
        });

        // Send SMS
        const result = await sendSMS(log.recipient.phone, smsMessage);

        // Update log based on result
        if (result.success) {
          log.smsSent = true;
          log.smsSentAt = new Date();
          log.smsStatus = 'sent';
          sent++;
          console.log(`✅ SMS sent to ${log.recipient.phone} (${log.recipient.email})`);
        } else {
          log.smsStatus = 'failed';
          log.smsError = result.error || 'Unknown error';
          failed++;
          console.error(`❌ SMS failed for ${log.recipient.email}: ${result.error}`);
        }

        await log.save();

        // Add delay between sends to avoid rate limiting (adjust based on Twilio plan)
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      } catch (error) {
        console.error(`Error processing SMS for log ${log._id}:`, error);
        log.smsStatus = 'failed';
        log.smsError = error.message;
        await log.save();
        failed++;
      }
    }

    if (sent > 0 || failed > 0) {
      console.log(`📊 SMS Processing Complete: ${sent} sent, ${failed} failed`);
    }
  } catch (error) {
    console.error('Error in processScheduledSMS:', error);
  }
};

/**
 * Initialize SMS scheduler with cron job
 * Runs every 5 minutes
 */
const initializeSMSScheduler = () => {
  // Run immediately on startup
  processScheduledSMS();

  // Then run every 5 minutes
  const interval = setInterval(processScheduledSMS, 5 * 60 * 1000); // 5 minutes

  console.log('✅ SMS Scheduler initialized (runs every 5 minutes)');

  return interval; // Return interval ID in case we need to clear it later
};

/**
 * Reset daily SMS counter
 * Should be called once per day by a cron job
 */
const resetDailySMSCounter = async () => {
  try {
    const settings = await Settings.findById('site_settings');
    if (settings) {
      settings.smsStats.todaySent = 0;
      settings.smsStats.lastResetDate = new Date();
      await settings.save();
      console.log('✅ Daily SMS counter reset');
    }
  } catch (error) {
    console.error('Error resetting daily SMS counter:', error);
  }
};

/**
 * Initialize daily reset cron
 * Resets counter at midnight
 */
const initializeDailyReset = () => {
  // Calculate milliseconds until next midnight
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  const msUntilMidnight = tomorrow - now;

  // Reset at midnight
  setTimeout(() => {
    resetDailySMSCounter();

    // Then reset every 24 hours
    setInterval(resetDailySMSCounter, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  console.log('✅ Daily SMS counter reset scheduled for midnight');
};

module.exports = {
  initializeSMSScheduler,
  processScheduledSMS,
  resetDailySMSCounter,
  initializeDailyReset
};
