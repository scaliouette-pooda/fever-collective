const { sendBookingConfirmation } = require('./emailService');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Event = require('../models/Event');
const nodemailer = require('nodemailer');

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

// 1. Post-Event Follow-Up (24 hours after event)
const sendPostEventFollowUp = async (booking) => {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured - skipping post-event follow-up');
    return;
  }

  try {
    const transporter = createTransporter();
    const event = booking.event;

    // Find upcoming events
    const upcomingEvents = await Event.find({
      date: { $gte: new Date() },
      isActive: true
    }).limit(3).sort({ date: 1 });

    const eventsHTML = upcomingEvents.map(e => `
      <div style="border: 1px solid rgba(201, 168, 106, 0.3); padding: 15px; margin: 10px 0;">
        <h4 style="color: #c9a86a; margin: 0 0 10px 0;">${e.title}</h4>
        <p style="margin: 5px 0; font-size: 0.9rem;">
          📅 ${new Date(e.date).toLocaleDateString()} at ${e.time}<br/>
          📍 ${e.location}<br/>
          💰 $${e.price}
        </p>
        <a href="${process.env.CLIENT_URL}/booking/${e._id}"
           style="display: inline-block; margin-top: 10px; padding: 8px 20px; background-color: #c9a86a;
                  color: #1a1a1a; text-decoration: none; font-weight: 600; text-transform: uppercase;">
          Book Now (20% Off!)
        </a>
      </div>
    `).join('');

    const mailOptions = {
      from: `"The Fever Collective" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject: `How was ${event.title}? Get 20% off your next booking!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a; border-bottom: 2px solid #c9a86a; padding-bottom: 10px;">
            Thanks for joining us! 🙏
          </h1>

          <p>Hi ${booking.name},</p>

          <p>We hope you enjoyed <strong>${event.title}</strong>! Your energy and presence made it special.</p>

          <div style="background-color: #fff3cd; padding: 20px; margin: 20px 0; border: 2px solid #ffc107; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #856404; text-align: center;">⭐ Special Offer Just for You!</h3>
            <p style="text-align: center; font-size: 18px; font-weight: bold; color: #1a1a1a; margin: 10px 0;">
              Get 20% OFF your next booking
            </p>
            <p style="text-align: center; font-size: 14px; color: #856404; margin: 5px 0;">
              Use code: <strong style="font-size: 20px; letter-spacing: 2px;">COMEBACK20</strong>
            </p>
            <p style="text-align: center; font-size: 12px; color: #666; margin: 10px 0;">
              Valid for 48 hours only!
            </p>
          </div>

          <h3 style="color: #c9a86a;">✍️ Share Your Experience</h3>
          <p>Your feedback helps us improve and inspires others to join our community.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.CLIENT_URL}/events"
               style="background-color: #c9a86a; color: #1a1a1a; padding: 12px 30px;
                      text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
              Leave a Review
            </a>
          </div>

          <h3 style="color: #c9a86a;">🔥 Upcoming Events</h3>
          ${eventsHTML}

          <p style="color: #666; font-size: 0.9em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            See you on the mat soon!<br>
            The Fever Collective Team
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Post-event follow-up sent to:', booking.email);
  } catch (error) {
    console.error('Error sending post-event follow-up:', error);
  }
};

// 2. Win-Back Campaign (30 days inactive)
const sendWinBackEmail = async (user) => {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured - skipping win-back email');
    return;
  }

  try {
    const transporter = createTransporter();

    const upcomingEvents = await Event.find({
      date: { $gte: new Date() },
      isActive: true
    }).limit(3).sort({ date: 1 });

    const eventsHTML = upcomingEvents.map(e => `
      <div style="border: 1px solid rgba(201, 168, 106, 0.3); padding: 15px; margin: 10px 0;">
        <h4 style="color: #c9a86a; margin: 0 0 10px 0;">${e.title}</h4>
        <p style="margin: 5px 0; font-size: 0.9rem;">
          📅 ${new Date(e.date).toLocaleDateString()} at ${e.time}<br/>
          📍 ${e.location}<br/>
          💰 $${e.price}
        </p>
        <a href="${process.env.CLIENT_URL}/booking/${e._id}"
           style="display: inline-block; margin-top: 10px; padding: 8px 20px; background-color: #c9a86a;
                  color: #1a1a1a; text-decoration: none; font-weight: 600; text-transform: uppercase;">
          Book Now
        </a>
      </div>
    `).join('');

    const mailOptions = {
      from: `"The Fever Collective" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `We miss you! Come back with 30% off 💫`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a; border-bottom: 2px solid #c9a86a; padding-bottom: 10px;">
            We Miss You! 💙
          </h1>

          <p>Hi ${user.name},</p>

          <p>It's been a while since we've seen you on the mat. The Fever Collective community isn't the same without you!</p>

          <div style="background-color: rgba(201, 168, 106, 0.1); padding: 25px; margin: 25px 0; border: 2px solid #c9a86a; text-align: center;">
            <h2 style="color: #c9a86a; margin: 0 0 15px 0;">🎉 Welcome Back Offer!</h2>
            <p style="font-size: 32px; font-weight: bold; color: #c9a86a; margin: 10px 0;">
              30% OFF
            </p>
            <p style="font-size: 14px; color: rgba(232, 232, 232, 0.8); margin: 5px 0;">
              your next booking
            </p>
            <p style="font-size: 20px; font-weight: bold; color: #1a1a1a; margin: 15px 0; letter-spacing: 2px;">
              WELCOME30
            </p>
            <p style="font-size: 12px; color: #666;">
              Valid for 7 days
            </p>
          </div>

          <h3 style="color: #c9a86a;">✨ What's New</h3>
          <ul style="line-height: 1.8; color: rgba(232, 232, 232, 0.8);">
            <li>New popup locations across the city</li>
            <li>Class pack bundles to save even more</li>
            <li>Enhanced referral program with tiered rewards</li>
          </ul>

          <h3 style="color: #c9a86a;">📅 Upcoming Events</h3>
          ${eventsHTML}

          <p style="color: #666; font-size: 0.9em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            Hope to see you soon!<br>
            The Fever Collective Team
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Win-back email sent to:', user.email);
  } catch (error) {
    console.error('Error sending win-back email:', error);
  }
};

// 3. Birthday Special
const sendBirthdayEmail = async (user) => {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured - skipping birthday email');
    return;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"The Fever Collective" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `🎂 Happy Birthday ${user.name.split(' ')[0]}! Your gift awaits...`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a; border-bottom: 2px solid #c9a86a; padding-bottom: 10px;">
            🎉 Happy Birthday! 🎂
          </h1>

          <p style="font-size: 18px;">Hi ${user.name},</p>

          <p style="font-size: 16px;">Wishing you the most amazing birthday filled with joy, movement, and connection! 🎈</p>

          <div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding: 30px; margin: 25px 0; text-align: center; border-radius: 10px;">
            <h2 style="color: #1a1a1a; margin: 0 0 15px 0;">🎁 Your Birthday Gift!</h2>
            <p style="font-size: 28px; font-weight: bold; color: #1a1a1a; margin: 10px 0;">
              FREE CLASS
            </p>
            <p style="font-size: 14px; color: #1a1a1a; margin: 5px 0;">
              or 50% off any event
            </p>
            <p style="font-size: 22px; font-weight: bold; color: #1a1a1a; margin: 15px 0; letter-spacing: 3px;">
              BDAY${user.name.substring(0, 4).toUpperCase()}
            </p>
            <p style="font-size: 12px; color: #1a1a1a;">
              Valid during your birthday month
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/events"
               style="background-color: #c9a86a; color: #1a1a1a; padding: 15px 40px;
                      text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;
                      font-size: 16px; text-transform: uppercase;">
              Claim Your Gift
            </a>
          </div>

          <p style="text-align: center; font-size: 16px; color: #c9a86a;">
            Celebrate your special day with movement! 🌟
          </p>

          <p style="color: #666; font-size: 0.9em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
            With love,<br>
            The Fever Collective Team 💛
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Birthday email sent to:', user.email);
  } catch (error) {
    console.error('Error sending birthday email:', error);
  }
};

// 4. Abandoned Booking Reminder
const sendAbandonedBookingReminder = async (userEmail, event) => {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured - skipping abandoned booking reminder');
    return;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"The Fever Collective" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Don't forget! ${event.title} is waiting for you...`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a; border-bottom: 2px solid #c9a86a; padding-bottom: 10px;">
            You left something behind... 👀
          </h1>

          <p>Hi there,</p>

          <p>We noticed you started booking <strong>${event.title}</strong> but didn't complete your reservation.</p>

          <div style="border: 1px solid rgba(201, 168, 106, 0.3); padding: 20px; margin: 20px 0;">
            <h3 style="color: #c9a86a; margin-top: 0;">${event.title}</h3>
            <p style="margin: 5px 0;">
              📅 ${new Date(event.date).toLocaleDateString()} at ${event.time}<br/>
              📍 ${event.location}<br/>
              💰 $${event.price}
            </p>
            <p style="color: #ff4444; font-weight: 600; margin: 10px 0;">
              ⚡ Only ${event.availableSpots} spots left!
            </p>
          </div>

          <div style="background-color: rgba(201, 168, 106, 0.1); padding: 20px; margin: 20px 0; text-align: center;">
            <p style="font-size: 16px; font-weight: bold; color: #c9a86a; margin: 0 0 10px 0;">
              Complete your booking now and get 10% off!
            </p>
            <p style="font-size: 20px; font-weight: bold; color: #1a1a1a; margin: 10px 0; letter-spacing: 2px;">
              COMPLETE10
            </p>
            <p style="font-size: 12px; color: #666;">
              Valid for 24 hours only
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/booking/${event._id}"
               style="background-color: #c9a86a; color: #1a1a1a; padding: 12px 30px;
                      text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
              Complete Your Booking
            </a>
          </div>

          <p style="color: #666; font-size: 0.9em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            Questions? Reply to this email and we'll be happy to help!
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Abandoned booking reminder sent to:', userEmail);
  } catch (error) {
    console.error('Error sending abandoned booking reminder:', error);
  }
};

module.exports = {
  sendPostEventFollowUp,
  sendWinBackEmail,
  sendBirthdayEmail,
  sendAbandonedBookingReminder
};
