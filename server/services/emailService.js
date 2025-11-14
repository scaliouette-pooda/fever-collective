const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  // For Gmail (most common)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Use App Password, not regular password
      }
    });
  }

  // For custom SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send welcome email after registration
const sendWelcomeEmail = async (user) => {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured - skipping welcome email');
    return;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"The Fever Collective" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Welcome to The Fever Collective! 🧘‍♀️',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a; border-bottom: 2px solid #c9a86a; padding-bottom: 10px;">
            Welcome to The Fever Collective
          </h1>

          <p>Hi ${user.name},</p>

          <p>Thank you for joining The Fever Collective! We're excited to have you as part of our community.</p>

          <p>Your account has been successfully created with the email: <strong>${user.email}</strong></p>

          <h3 style="color: #c9a86a;">What's Next?</h3>
          <ul>
            <li>Browse our upcoming popup events</li>
            <li>Book your spot at exclusive pilates sessions</li>
            <li>Update your profile with your preferences</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/events"
               style="background-color: #1a1a1a; color: #e8e8e8; padding: 12px 30px;
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Browse Events
            </a>
          </div>

          <p style="color: #666; font-size: 0.9em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            Questions? Reply to this email and we'll be happy to help!
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', user.email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error - registration should succeed even if email fails
  }
};

// Send booking confirmation email
const sendBookingConfirmation = async (booking) => {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured - skipping booking confirmation');
    return;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"The Fever Collective" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject: `Booking Confirmation - ${booking.event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a; border-bottom: 2px solid #c9a86a; padding-bottom: 10px;">
            Booking Confirmed! 🎉
          </h1>

          <p>Hi ${booking.name},</p>

          <p>Your booking has been confirmed for:</p>

          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #c9a86a;">
            <h2 style="margin-top: 0; color: #1a1a1a;">${booking.event.title}</h2>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(booking.event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.event.time}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${booking.event.location}</p>
            <p style="margin: 5px 0;"><strong>Address:</strong> ${booking.event.address}</p>
            <p style="margin: 5px 0;"><strong>Instructor:</strong> ${booking.event.instructor}</p>
            <p style="margin: 5px 0;"><strong>Spots:</strong> ${booking.spots}</p>
            <p style="margin: 5px 0;"><strong>Total:</strong> $${booking.totalAmount}</p>
          </div>

          <p><strong>Booking ID:</strong> ${booking._id}</p>
          <p><strong>Status:</strong> ${booking.status}</p>

          <p style="color: #666; font-size: 0.9em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            We're looking forward to seeing you! If you need to make any changes, please contact us.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Booking confirmation sent to:', booking.email);
  } catch (error) {
    console.error('Error sending booking confirmation:', error);
  }
};

// Send payment confirmation email
const sendPaymentConfirmation = async (booking) => {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured - skipping payment confirmation');
    return;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"The Fever Collective" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject: `Payment Confirmed - ${booking.event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a; border-bottom: 2px solid #c9a86a; padding-bottom: 10px;">
            Payment Confirmed! ✅
          </h1>

          <p>Hi ${booking.name},</p>

          <p>We've received your payment of <strong>$${booking.totalAmount}</strong> for ${booking.event.title}.</p>

          <p>Your spot is confirmed! We can't wait to see you at the event.</p>

          <div style="background-color: #e8f5e9; padding: 20px; margin: 20px 0; border: 2px solid #4caf50; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #2e7d32; text-align: center;">Confirmation Number</h3>
            <p style="text-align: center; font-size: 24px; font-weight: bold; color: #1b5e20; margin: 10px 0; letter-spacing: 2px;">
              ${booking.confirmationNumber || 'Pending'}
            </p>
            <p style="text-align: center; font-size: 12px; color: #666; margin: 5px 0;">
              Please save this number for your records
            </p>
          </div>

          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Receipt Details</h3>
            <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${booking._id}</p>
            <p style="margin: 5px 0;"><strong>Event:</strong> ${booking.event.title}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(booking.event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.event.time}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${booking.event.location}</p>
            <p style="margin: 5px 0;"><strong>Spots:</strong> ${booking.spots}</p>
            <p style="margin: 5px 0;"><strong>Amount Paid:</strong> $${booking.totalAmount}</p>
            <p style="margin: 5px 0;"><strong>Payment Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div style="background-color: #fff3cd; padding: 20px; margin: 20px 0; border: 2px solid #ffc107; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #856404; text-align: center;">📱 Check-In QR Code</h3>
            <p style="text-align: center; font-size: 14px; color: #666; margin: 10px 0;">
              View your QR code for easy check-in at the event
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.CLIENT_URL}/confirmation/${booking._id}"
                 style="background-color: #c9a86a; color: #1a1a1a; padding: 12px 30px;
                        text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                View QR Code & Details
              </a>
            </div>
            <p style="text-align: center; font-size: 12px; color: #666; margin: 5px 0;">
              Save this link or show your QR code on your phone at the event
            </p>
          </div>

          <p style="color: #666; font-size: 0.9em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            Keep this email for your records. Arrive 10-15 minutes early for check-in. See you soon!
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Payment confirmation sent to:', booking.email);
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
  }
};

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured - skipping password reset email');
    return;
  }

  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"The Fever Collective" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a; border-bottom: 2px solid #c9a86a; padding-bottom: 10px;">
            Password Reset Request
          </h1>

          <p>Hi ${user.name},</p>

          <p>We received a request to reset your password for your The Fever Collective account.</p>

          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #1a1a1a; color: #e8e8e8; padding: 12px 30px;
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="color: #666; font-size: 0.9em;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #c9a86a;">${resetUrl}</a>
          </p>

          <p style="color: #d32f2f; font-size: 0.9em; margin-top: 30px;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>

          <p style="color: #666; font-size: 0.9em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            Questions? Reply to this email and we'll be happy to help!
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', user.email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendWelcomeEmail,
  sendBookingConfirmation,
  sendPaymentConfirmation,
  sendPasswordResetEmail
};
