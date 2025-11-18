const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * Twilio webhook for incoming SMS messages
 * Handles STOP/UNSUBSCRIBE and START keywords for opt-out automation
 *
 * To configure:
 * 1. Go to Twilio Console → Phone Numbers
 * 2. Select your phone number
 * 3. Set "A MESSAGE COMES IN" webhook to: https://yourapp.com/api/sms/webhook/incoming
 * 4. Method: POST
 */
router.post('/incoming', async (req, res) => {
  try {
    const { From, Body } = req.body;
    const message = (Body || '').trim().toUpperCase();

    console.log(`📱 Received SMS from ${From}: ${message}`);

    // Handle STOP/UNSUBSCRIBE keywords
    if (message === 'STOP' || message === 'UNSUBSCRIBE' || message === 'CANCEL' || message === 'END' || message === 'QUIT') {
      const user = await User.findOne({ phone: From });

      if (user) {
        // Disable SMS for this user
        user.smsPreferences = {
          ...user.smsPreferences,
          enabled: false,
          bookingConfirmations: false,
          reminders: false,
          promotional: false
        };
        await user.save();

        console.log(`✅ User ${user.email} (${user.name}) opted out of SMS`);

        // Twilio expects TwiML response
        res.type('text/xml');
        return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>You have been unsubscribed from The Fever Studio SMS notifications. You will not receive any more messages. Reply START to re-subscribe.</Message>
</Response>`);
      } else {
        console.log(`⚠️ No user found with phone ${From}`);
        res.type('text/xml');
        return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>You have been unsubscribed from The Fever Studio SMS notifications.</Message>
</Response>`);
      }
    }

    // Handle START/SUBSCRIBE keywords
    if (message === 'START' || message === 'SUBSCRIBE' || message === 'UNSTOP' || message === 'YES') {
      const user = await User.findOne({ phone: From });

      if (user) {
        // Re-enable SMS for this user
        user.smsPreferences = {
          enabled: true,
          bookingConfirmations: true,
          reminders: true,
          promotional: false  // Don't automatically re-enable promotional
        };
        await user.save();

        console.log(`✅ User ${user.email} (${user.name}) opted back into SMS`);

        res.type('text/xml');
        return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Welcome back! You have been re-subscribed to The Fever Studio SMS notifications. You can manage your preferences in your profile. Reply STOP to unsubscribe.</Message>
</Response>`);
      } else {
        console.log(`⚠️ No user found with phone ${From}`);
        res.type('text/xml');
        return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>You have been subscribed to The Fever Studio SMS notifications. Reply STOP to unsubscribe.</Message>
</Response>`);
      }
    }

    // Handle HELP keyword
    if (message === 'HELP' || message === 'INFO') {
      res.type('text/xml');
      return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>The Fever Studio - Pilates Classes

Reply STOP to unsubscribe
Reply START to subscribe

For assistance: (408) 805-5814
Visit: thefeverstudio.com</Message>
</Response>`);
    }

    // For any other message, send a generic response
    console.log(`ℹ️ Unhandled message from ${From}: ${message}`);
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for your message. For booking and inquiries, please visit thefeverstudio.com or call (408) 805-5814. Reply STOP to unsubscribe.</Message>
</Response>`);

  } catch (error) {
    console.error('Error handling incoming SMS:', error);
    // Still send valid TwiML even on error
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`);
  }
});

/**
 * Twilio delivery status callback
 * Called when SMS delivery status changes
 * Optional: Use this to track delivery issues
 */
router.post('/status', async (req, res) => {
  try {
    const { MessageSid, MessageStatus, To, ErrorCode } = req.body;

    console.log(`📊 SMS Status Update:`, {
      sid: MessageSid,
      status: MessageStatus,
      to: To,
      errorCode: ErrorCode
    });

    // You could log this to database or send alerts for failed deliveries
    if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
      console.error(`❌ SMS delivery failed: ${MessageSid} to ${To}. Error: ${ErrorCode}`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling SMS status callback:', error);
    res.sendStatus(200); // Always return 200 to Twilio
  }
});

module.exports = router;
