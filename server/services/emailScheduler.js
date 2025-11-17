const cron = require('node-cron');
const {
  sendPostEventFollowUp,
  sendWinBackEmail,
  sendBirthdayEmail
} = require('./emailAutomation');
const {
  sendScheduledEmails,
  triggerClassReminders,
  triggerInactiveUserCampaigns,
  triggerCreditExpiringCampaigns
} = require('./automatedEmailService');
const Booking = require('../models/Booking');
const User = require('../models/User');

// Run post-event follow-ups every hour
const schedulePostEventFollowUps = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running post-event follow-up job...');

    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
      const twentyFiveHoursAgo = new Date(now - 25 * 60 * 60 * 1000);

      // Find bookings where event ended 24 hours ago and payment was completed
      const bookings = await Booking.find({
        paymentStatus: 'completed',
        createdAt: {
          $gte: twentyFiveHoursAgo,
          $lte: twentyFourHoursAgo
        }
      }).populate('event');

      for (let booking of bookings) {
        const eventDate = new Date(booking.event.date);
        const eventEndTime = new Date(eventDate);
        eventEndTime.setHours(eventEndTime.getHours() + 1); // Assume 1 hour class

        // Check if event ended ~24 hours ago
        const timeSinceEvent = now - eventEndTime;
        const oneDayInMs = 24 * 60 * 60 * 1000;

        if (timeSinceEvent >= oneDayInMs && timeSinceEvent <= oneDayInMs + 3600000) {
          await sendPostEventFollowUp(booking);
          console.log(`Sent post-event follow-up to ${booking.email}`);
        }
      }
    } catch (error) {
      console.error('Error in post-event follow-up job:', error);
    }
  });
};

// Run win-back campaign daily
const scheduleWinBackCampaign = () => {
  // Run daily at 10 AM
  cron.schedule('0 10 * * *', async () => {
    console.log('Running win-back campaign job...');

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Find users who haven't booked in 30-60 days
      const inactiveUsers = await User.find({
        createdAt: { $lte: thirtyDaysAgo }
      });

      for (let user of inactiveUsers) {
        // Check if they have any recent bookings
        const recentBooking = await Booking.findOne({
          email: user.email,
          createdAt: { $gte: thirtyDaysAgo }
        });

        // Check if they've already received a win-back email recently
        const oldBooking = await Booking.findOne({
          email: user.email,
          createdAt: { $lte: sixtyDaysAgo, $gte: thirtyDaysAgo }
        });

        if (!recentBooking && oldBooking) {
          await sendWinBackEmail(user);
          console.log(`Sent win-back email to ${user.email}`);
        }
      }
    } catch (error) {
      console.error('Error in win-back campaign job:', error);
    }
  });
};

// Run birthday emails daily
const scheduleBirthdayEmails = () => {
  // Run daily at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running birthday email job...');

    try {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentDay = today.getDate();

      // Find users with birthday today (if birthDate field exists)
      const users = await User.find({});

      for (let user of users) {
        if (user.birthDate) {
          const birthDate = new Date(user.birthDate);
          if (birthDate.getMonth() === currentMonth && birthDate.getDate() === currentDay) {
            await sendBirthdayEmail(user);
            console.log(`Sent birthday email to ${user.email}`);
          }
        }
      }
    } catch (error) {
      console.error('Error in birthday email job:', error);
    }
  });
};

// Send scheduled automated campaign emails every hour
const scheduleAutomatedEmails = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('Running: Send scheduled automated emails (hourly)');
    try {
      await sendScheduledEmails();
    } catch (error) {
      console.error('Error in sendScheduledEmails cron:', error);
    }
  });
};

// Check for class reminders every 30 minutes
const scheduleClassReminders = () => {
  cron.schedule('*/30 * * * *', async () => {
    console.log('Running: Check class reminders (every 30 minutes)');
    try {
      await triggerClassReminders();
    } catch (error) {
      console.error('Error in triggerClassReminders cron:', error);
    }
  });
};

// Check for inactive users once daily at 9:30 AM
const scheduleInactiveUserChecks = () => {
  cron.schedule('30 9 * * *', async () => {
    console.log('Running: Check inactive users (daily at 9:30 AM)');
    try {
      await triggerInactiveUserCampaigns();
    } catch (error) {
      console.error('Error in triggerInactiveUserCampaigns cron:', error);
    }
  });
};

// Check for expiring credits once daily at 10:30 AM
const scheduleCreditExpiryChecks = () => {
  cron.schedule('30 10 * * *', async () => {
    console.log('Running: Check expiring credits (daily at 10:30 AM)');
    try {
      await triggerCreditExpiringCampaigns();
    } catch (error) {
      console.error('Error in triggerCreditExpiringCampaigns cron:', error);
    }
  });
};

// Initialize all scheduled jobs
const initializeEmailScheduler = () => {
  console.log('Initializing email scheduler...');
  schedulePostEventFollowUps();
  scheduleWinBackCampaign();
  scheduleBirthdayEmails();
  scheduleAutomatedEmails();
  scheduleClassReminders();
  scheduleInactiveUserChecks();
  scheduleCreditExpiryChecks();
  console.log('Email scheduler initialized successfully');
  console.log('- Automated campaign emails: Every hour');
  console.log('- Class reminders: Every 30 minutes');
  console.log('- Inactive users: Daily at 9:30 AM');
  console.log('- Expiring credits: Daily at 10:30 AM');
};

module.exports = { initializeEmailScheduler };
