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

          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${booking._id}</p>
            <p style="margin: 5px 0;"><strong>Event:</strong> ${booking.event.title}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(booking.event.date).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Amount Paid:</strong> $${booking.totalAmount}</p>
          </div>

          <p style="color: #666; font-size: 0.9em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            Keep this email for your records. See you soon!
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

module.exports = {
  sendWelcomeEmail,
  sendBookingConfirmation,
  sendPaymentConfirmation
};
