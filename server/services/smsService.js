// SMS Service using Twilio
// Install: npm install twilio

let twilioClient = null;

// Initialize Twilio client
const initializeTwilio = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log('Twilio not configured - SMS functionality will be disabled');
    return null;
  }

  try {
    const twilio = require('twilio');
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ Twilio SMS service initialized');
    return twilioClient;
  } catch (error) {
    console.error('Failed to initialize Twilio:', error.message);
    return null;
  }
};

// Get or create client
const getClient = () => {
  if (!twilioClient) {
    twilioClient = initializeTwilio();
  }
  return twilioClient;
};

// Format phone number to E.164 format (+1234567890)
const formatPhoneNumber = (phone) => {
  if (!phone) return null;

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Validate minimum length
  if (cleaned.length < 10) {
    console.error(`Invalid phone number: ${phone} (too short after cleaning: ${cleaned})`);
    return null;
  }

  // If it's a US number without country code, add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  // If it already has country code but no +, add it
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }

  // If it has + already and is valid length, return as is
  if (phone.startsWith('+') && cleaned.length >= 10) {
    return phone.replace(/\D/g, '').replace(/^/, '+');
  }

  // Default: assume it needs +1 if it's 10+ digits
  if (cleaned.length >= 10) {
    return `+1${cleaned}`;
  }

  console.error(`Invalid phone number format: ${phone}`);
  return null;
};

// Send a generic SMS
const sendSMS = async (to, message) => {
  const client = getClient();
  if (!client) {
    console.log('SMS not configured - skipping SMS send');
    return { success: false, error: 'SMS not configured' };
  }

  if (!process.env.TWILIO_PHONE_NUMBER) {
    console.log('TWILIO_PHONE_NUMBER not set - skipping SMS send');
    return { success: false, error: 'Twilio phone number not configured' };
  }

  try {
    const formattedPhone = formatPhoneNumber(to);

    if (!formattedPhone) {
      console.error('SMS not sent: Invalid phone number format');
      return { success: false, error: 'Invalid phone number format' };
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log(`✅ SMS sent to ${formattedPhone}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    return { success: false, error: error.message };
  }
};

// Send welcome SMS
const sendWelcomeSMS = async (user) => {
  if (!user.phone) {
    return { success: false, error: 'No phone number provided' };
  }

  const message = `Welcome to The Fever Studio, ${user.name}! 🧘‍♀️\n\nThank you for joining our community. Book your first class today!\n\nThe Fever Studio`;

  return await sendSMS(user.phone, message);
};

// Send booking confirmation SMS
const sendBookingConfirmationSMS = async (booking, event) => {
  if (!booking.phone) {
    return { success: false, error: 'No phone number provided' };
  }

  const eventDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const message = `🎉 Booking Confirmed!\n\n${event.title}\n${eventDate} at ${event.time}\n${event.location}\n\nSpots: ${booking.spots}\nTotal: $${booking.totalAmount}\n\nSee you there!\n- The Fever Studio`;

  return await sendSMS(booking.phone, message);
};

// Send class reminder SMS (24 hours before)
const sendClassReminderSMS = async (booking, event) => {
  if (!booking.phone) {
    return { success: false, error: 'No phone number provided' };
  }

  const eventDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const message = `⏰ Reminder: ${event.title}\n\nTomorrow at ${event.time}\n${event.location}\n\nWe're excited to see you!\n- The Fever Studio`;

  return await sendSMS(booking.phone, message);
};

// Send waitlist notification SMS
const sendWaitlistNotificationSMS = async (waitlistEntry, event) => {
  if (!waitlistEntry.phone) {
    return { success: false, error: 'No phone number provided' };
  }

  const message = `🎉 A spot opened up!\n\n${event.title}\n${new Date(event.date).toLocaleDateString()} at ${event.time}\n\nBook now before it's gone!\n\nReply BOOK or visit our site.\n- The Fever Studio`;

  return await sendSMS(waitlistEntry.phone, message);
};

// Send membership confirmation SMS
const sendMembershipConfirmationSMS = async (membership, user) => {
  if (!user.phone) {
    return { success: false, error: 'No phone number provided' };
  }

  const message = `🎊 Welcome to ${membership.membershipTier}!\n\nMembership #: ${membership.membershipNumber}\nCredits: ${membership.availableCredits}\n\nStart booking your classes today!\n- The Fever Studio`;

  return await sendSMS(user.phone, message);
};

// Send credits low notification SMS
const sendCreditsLowSMS = async (membership, user) => {
  if (!user.phone) {
    return { success: false, error: 'No phone number provided' };
  }

  const message = `⚠️ Credits Running Low\n\nYou have ${membership.availableCredits} credits remaining.\n\nRenew your membership to keep enjoying classes!\n- The Fever Studio`;

  return await sendSMS(user.phone, message);
};

// Bulk SMS sending (for campaigns)
const sendBulkSMS = async (phoneNumbers, message) => {
  const client = getClient();
  if (!client) {
    console.log('SMS not configured - skipping bulk SMS send');
    return { success: false, error: 'SMS not configured' };
  }

  const results = {
    sent: 0,
    failed: 0,
    errors: []
  };

  for (const phone of phoneNumbers) {
    const result = await sendSMS(phone, message);
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push({ phone, error: result.error });
    }

    // Add delay to avoid rate limiting (adjust based on your Twilio plan)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
};

module.exports = {
  initializeTwilio,
  sendSMS,
  sendWelcomeSMS,
  sendBookingConfirmationSMS,
  sendClassReminderSMS,
  sendWaitlistNotificationSMS,
  sendMembershipConfirmationSMS,
  sendCreditsLowSMS,
  sendBulkSMS,
  formatPhoneNumber
};
