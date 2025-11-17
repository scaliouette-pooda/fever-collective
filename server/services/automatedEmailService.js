const { AutomatedCampaign, AutomatedEmailLog } = require('../models/AutomatedCampaign');
const User = require('../models/User');
const UserMembership = require('../models/Membership');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Trigger automated campaign for new user registration
 */
async function triggerNewRegistration(userId, userEmail, userName) {
  try {
    console.log(`Triggering new registration campaigns for user ${userId}`);

    const campaigns = await AutomatedCampaign.find({
      triggerType: 'new_registration',
      isActive: true
    });

    for (const campaign of campaigns) {
      // Get user's membership tier to check targeting
      const membership = await UserMembership.findOne({
        userId: userId,
        status: { $in: ['active', 'pending-cancellation'] }
      }).populate('membershipTier');

      if (membership && campaign.shouldTriggerForUser(userId, membership.membershipTier?.name)) {
        await campaign.scheduleForUser(userId, userEmail, {
          userName: userName,
          registrationDate: new Date()
        });
        console.log(`Scheduled campaign "${campaign.name}" for user ${userId}`);
      }
    }
  } catch (error) {
    console.error('Error triggering new registration campaigns:', error);
  }
}

/**
 * Trigger class reminder campaigns
 * Should be called by scheduler to check upcoming classes
 */
async function triggerClassReminders() {
  try {
    console.log('Checking for upcoming classes to send reminders...');

    const campaigns = await AutomatedCampaign.find({
      triggerType: 'class_reminder',
      isActive: true
    });

    if (campaigns.length === 0) return;

    const now = new Date();

    for (const campaign of campaigns) {
      const { daysBeforeEvent = 1, hoursBeforeEvent = 0 } = campaign.triggerConfig || {};

      // Calculate reminder window
      const reminderTime = new Date(now);
      reminderTime.setDate(reminderTime.getDate() + daysBeforeEvent);
      reminderTime.setHours(reminderTime.getHours() + hoursBeforeEvent);

      // Find events happening around the reminder time (within 30 minutes)
      const windowStart = new Date(reminderTime);
      windowStart.setMinutes(windowStart.getMinutes() - 15);
      const windowEnd = new Date(reminderTime);
      windowEnd.setMinutes(windowEnd.getMinutes() + 15);

      const upcomingEvents = await Event.find({
        date: { $gte: windowStart, $lte: windowEnd }
      });

      for (const event of upcomingEvents) {
        // Find all bookings for this event
        const bookings = await Booking.find({
          event: event._id,
          paymentStatus: 'completed',
          checkedIn: false
        }).populate('userId');

        for (const booking of bookings) {
          const user = booking.userId;
          if (!user || !user.email) continue;

          // Get user's membership for targeting
          const membership = await UserMembership.findOne({
            userId: user._id,
            status: { $in: ['active', 'pending-cancellation'] }
          }).populate('membershipTier');

          if (membership && campaign.shouldTriggerForUser(user._id, membership.membershipTier?.name)) {
            await campaign.scheduleForUser(user._id, user.email, {
              userName: user.name,
              eventTitle: event.title,
              eventDate: event.date,
              eventTime: event.time,
              eventLocation: event.location
            });
            console.log(`Scheduled class reminder for ${user.email} - Event: ${event.title}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error triggering class reminders:', error);
  }
}

/**
 * Trigger inactive user campaigns
 * Should be called by scheduler daily
 */
async function triggerInactiveUserCampaigns() {
  try {
    console.log('Checking for inactive users...');

    const campaigns = await AutomatedCampaign.find({
      triggerType: 'inactive_user',
      isActive: true
    });

    if (campaigns.length === 0) return;

    const now = new Date();

    for (const campaign of campaigns) {
      const { inactiveDays = 30 } = campaign.triggerConfig || {};

      // Find users who haven't checked in for X days
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

      // Get all active memberships
      const memberships = await UserMembership.find({
        status: { $in: ['active', 'pending-cancellation'] },
        lastClassDate: { $lt: cutoffDate }
      }).populate('userId membershipTier');

      for (const membership of memberships) {
        const user = membership.userId;
        if (!user || !user.email) continue;

        if (campaign.shouldTriggerForUser(user._id, membership.membershipTier?.name)) {
          await campaign.scheduleForUser(user._id, user.email, {
            userName: user.name,
            lastClassDate: membership.lastClassDate,
            inactiveDays: inactiveDays,
            creditsRemaining: membership.creditsRemaining
          });
          console.log(`Scheduled inactive user campaign for ${user.email}`);
        }
      }
    }
  } catch (error) {
    console.error('Error triggering inactive user campaigns:', error);
  }
}

/**
 * Trigger post-class follow-up campaigns
 */
async function triggerPostClassCampaign(userId, userEmail, eventData) {
  try {
    console.log(`Triggering post-class campaigns for user ${userId}`);

    const campaigns = await AutomatedCampaign.find({
      triggerType: 'post_class',
      isActive: true
    });

    for (const campaign of campaigns) {
      const membership = await UserMembership.findOne({
        userId: userId,
        status: { $in: ['active', 'pending-cancellation'] }
      }).populate('membershipTier');

      if (membership && campaign.shouldTriggerForUser(userId, membership.membershipTier?.name)) {
        await campaign.scheduleForUser(userId, userEmail, {
          userName: eventData.userName,
          eventTitle: eventData.eventTitle,
          eventDate: eventData.eventDate,
          classesAttended: membership.classesAttended
        });
        console.log(`Scheduled post-class campaign for user ${userId}`);
      }
    }
  } catch (error) {
    console.error('Error triggering post-class campaigns:', error);
  }
}

/**
 * Trigger milestone achievement campaigns
 */
async function triggerMilestoneAchieved(userId, userEmail, milestone, reward) {
  try {
    console.log(`Triggering milestone campaigns for user ${userId} - ${milestone} classes`);

    const campaigns = await AutomatedCampaign.find({
      triggerType: 'milestone_achieved',
      isActive: true
    });

    for (const campaign of campaigns) {
      const membership = await UserMembership.findOne({
        userId: userId,
        status: { $in: ['active', 'pending-cancellation'] }
      }).populate('membershipTier');

      if (membership && campaign.shouldTriggerForUser(userId, membership.membershipTier?.name)) {
        const user = await User.findById(userId);
        await campaign.scheduleForUser(userId, userEmail, {
          userName: user?.name,
          milestone: milestone,
          reward: reward,
          totalClasses: membership.classesAttended
        });
        console.log(`Scheduled milestone campaign for user ${userId}`);
      }
    }
  } catch (error) {
    console.error('Error triggering milestone campaigns:', error);
  }
}

/**
 * Trigger credit expiring campaigns
 * Should be called by scheduler daily
 */
async function triggerCreditExpiringCampaigns() {
  try {
    console.log('Checking for expiring credits...');

    const campaigns = await AutomatedCampaign.find({
      triggerType: 'credit_expiring',
      isActive: true
    });

    if (campaigns.length === 0) return;

    const now = new Date();

    for (const campaign of campaigns) {
      const { daysBeforeExpiry = 7 } = campaign.triggerConfig || {};

      // Calculate expiry threshold
      const expiryThreshold = new Date(now);
      expiryThreshold.setDate(expiryThreshold.getDate() + daysBeforeExpiry);

      // Find memberships with credits expiring soon
      const memberships = await UserMembership.find({
        status: { $in: ['active', 'pending-cancellation'] },
        creditsRemaining: { $gt: 0 },
        'creditExpiry.expiryDate': {
          $lte: expiryThreshold,
          $gte: now
        }
      }).populate('userId membershipTier');

      for (const membership of memberships) {
        const user = membership.userId;
        if (!user || !user.email) continue;

        if (campaign.shouldTriggerForUser(user._id, membership.membershipTier?.name)) {
          await campaign.scheduleForUser(user._id, user.email, {
            userName: user.name,
            creditsRemaining: membership.creditsRemaining,
            expiryDate: membership.creditExpiry?.expiryDate
          });
          console.log(`Scheduled credit expiring campaign for ${user.email}`);
        }
      }
    }
  } catch (error) {
    console.error('Error triggering credit expiring campaigns:', error);
  }
}

/**
 * Send scheduled automated emails
 * Should be called by scheduler every hour
 */
async function sendScheduledEmails() {
  try {
    console.log('Checking for scheduled automated emails to send...');

    const now = new Date();
    const scheduledEmails = await AutomatedEmailLog.find({
      status: 'scheduled',
      scheduledFor: { $lte: now }
    }).populate('campaign recipient');

    console.log(`Found ${scheduledEmails.length} emails to send`);

    for (const emailLog of scheduledEmails) {
      try {
        const campaign = emailLog.campaign;
        const user = emailLog.recipient;

        if (!campaign || !user) {
          emailLog.status = 'failed';
          emailLog.error = 'Campaign or user not found';
          await emailLog.save();
          continue;
        }

        // Get the specific email step
        const step = campaign.emailSequence.find(s => s.stepNumber === emailLog.sequenceStep);
        if (!step) {
          emailLog.status = 'failed';
          emailLog.error = 'Email sequence step not found';
          await emailLog.save();
          continue;
        }

        // Replace placeholders in subject and message
        let subject = step.subject;
        let message = step.message;

        // Replace common placeholders
        const replacements = {
          '{{userName}}': emailLog.triggerData?.userName || user.name || 'Member',
          '{{eventTitle}}': emailLog.triggerData?.eventTitle || '',
          '{{eventDate}}': emailLog.triggerData?.eventDate ? new Date(emailLog.triggerData.eventDate).toLocaleDateString() : '',
          '{{eventTime}}': emailLog.triggerData?.eventTime || '',
          '{{eventLocation}}': emailLog.triggerData?.eventLocation || '',
          '{{creditsRemaining}}': emailLog.triggerData?.creditsRemaining || '',
          '{{expiryDate}}': emailLog.triggerData?.expiryDate ? new Date(emailLog.triggerData.expiryDate).toLocaleDateString() : '',
          '{{milestone}}': emailLog.triggerData?.milestone || '',
          '{{reward}}': emailLog.triggerData?.reward || '',
          '{{inactiveDays}}': emailLog.triggerData?.inactiveDays || '',
          '{{lastClassDate}}': emailLog.triggerData?.lastClassDate ? new Date(emailLog.triggerData.lastClassDate).toLocaleDateString() : ''
        };

        for (const [placeholder, value] of Object.entries(replacements)) {
          subject = subject.replace(new RegExp(placeholder, 'g'), value);
          message = message.replace(new RegExp(placeholder, 'g'), value);
        }

        // Send email
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: emailLog.recipientEmail,
          subject: subject,
          html: message
        });

        // Update log
        emailLog.status = 'sent';
        emailLog.sentAt = new Date();
        await emailLog.save();

        // Update campaign stats
        campaign.stats.totalSent += 1;
        await campaign.save();

        console.log(`Sent automated email to ${emailLog.recipientEmail} - Campaign: ${campaign.name}`);

      } catch (error) {
        console.error(`Error sending email to ${emailLog.recipientEmail}:`, error);
        emailLog.status = 'failed';
        emailLog.error = error.message;
        await emailLog.save();

        // Update campaign stats
        if (emailLog.campaign) {
          emailLog.campaign.stats.totalFailed += 1;
          await emailLog.campaign.save();
        }
      }
    }

    console.log(`Finished processing ${scheduledEmails.length} scheduled emails`);
  } catch (error) {
    console.error('Error in sendScheduledEmails:', error);
  }
}

module.exports = {
  triggerNewRegistration,
  triggerClassReminders,
  triggerInactiveUserCampaigns,
  triggerPostClassCampaign,
  triggerMilestoneAchieved,
  triggerCreditExpiringCampaigns,
  sendScheduledEmails
};
