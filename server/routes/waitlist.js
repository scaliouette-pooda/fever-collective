const express = require('express');
const router = express.Router();
const Waitlist = require('../models/Waitlist');
const Event = require('../models/Event');
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

// Create email transporter
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

// Join waitlist
router.post('/',
  [
    body('eventId').notEmpty().withMessage('Event ID is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { eventId, name, email, phone } = req.body;

      // Check if event exists
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Check if already on waitlist
      const existing = await Waitlist.findOne({ event: eventId, email });
      if (existing) {
        return res.status(400).json({ error: 'You are already on the waitlist for this event' });
      }

      // Get current position (count + 1)
      const count = await Waitlist.countDocuments({ event: eventId, status: 'waiting' });
      const position = count + 1;

      // Create waitlist entry
      const waitlistEntry = new Waitlist({
        event: eventId,
        user: req.user?.userId || null,
        name,
        email,
        phone,
        position
      });

      await waitlistEntry.save();

      // Send confirmation email
      if (process.env.EMAIL_USER) {
        try {
          const transporter = createTransporter();
          await transporter.sendMail({
            from: `"The Fever Collective" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Waitlist Confirmation - ${event.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1a1a1a; border-bottom: 2px solid #c9a86a; padding-bottom: 10px;">
                  You're on the Waitlist!
                </h1>
                <p>Hi ${name},</p>
                <p>You've been added to the waitlist for <strong>${event.title}</strong>.</p>
                <p><strong>Your position:</strong> #${position}</p>
                <p><strong>Event Date:</strong> ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p>We'll notify you immediately if a spot becomes available.</p>
                <p style="color: #666; font-size: 0.9em; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  Questions? Reply to this email and we'll be happy to help!
                </p>
              </div>
            `
          });
        } catch (error) {
          console.error('Error sending waitlist confirmation email:', error);
        }
      }

      res.status(201).json({
        message: 'Added to waitlist successfully',
        position,
        waitlistEntry
      });
    } catch (error) {
      console.error('Error joining waitlist:', error);
      res.status(500).json({ error: 'Failed to join waitlist' });
    }
  }
);

// Get waitlist for an event (admin only)
router.get('/event/:eventId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const waitlist = await Waitlist.find({ event: req.params.eventId })
      .populate('user', 'name email')
      .sort({ position: 1 });

    res.json(waitlist);
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
});

// Get user's waitlist entries
router.get('/my-waitlist', authenticateUser, async (req, res) => {
  try {
    const waitlist = await Waitlist.find({
      $or: [
        { user: req.user.userId },
        { email: req.user.email }
      ],
      status: 'waiting'
    })
      .populate('event')
      .sort({ createdAt: -1 });

    res.json(waitlist);
  } catch (error) {
    console.error('Error fetching user waitlist:', error);
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
});

// Notify next person on waitlist (admin only)
router.post('/notify/:eventId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get next person on waitlist
    const nextPerson = await Waitlist.findOne({
      event: req.params.eventId,
      status: 'waiting'
    }).sort({ position: 1 });

    if (!nextPerson) {
      return res.status(404).json({ error: 'No one on waitlist' });
    }

    // Send notification email
    if (process.env.EMAIL_USER) {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"The Fever Collective" <${process.env.EMAIL_USER}>`,
        to: nextPerson.email,
        subject: `Spot Available - ${event.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #c9a86a; border-bottom: 2px solid #c9a86a; padding-bottom: 10px;">
              A Spot is Available!
            </h1>
            <p>Hi ${nextPerson.name},</p>
            <p>Great news! A spot has opened up for <strong>${event.title}</strong>.</p>
            <p><strong>Event Date:</strong> ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p><strong>Time:</strong> ${event.time}</p>
            <p><strong>Location:</strong> ${event.location}</p>
            <p><strong>Price:</strong> $${event.price}</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/booking/${event._id}"
                 style="background-color: #c9a86a; color: #1a1a1a; padding: 12px 30px;
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Book Now
              </a>
            </div>
            <p style="color: #999; font-size: 0.9em;">
              This spot is first-come, first-served. Book quickly before it's taken!
            </p>
          </div>
        `
      });
    }

    // Update status
    nextPerson.status = 'notified';
    nextPerson.notifiedAt = new Date();
    await nextPerson.save();

    res.json({
      message: 'Notification sent',
      notified: nextPerson
    });
  } catch (error) {
    console.error('Error notifying waitlist:', error);
    res.status(500).json({ error: 'Failed to notify waitlist' });
  }
});

// Remove from waitlist
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const waitlistEntry = await Waitlist.findById(req.params.id);

    if (!waitlistEntry) {
      return res.status(404).json({ error: 'Waitlist entry not found' });
    }

    // Check authorization
    const user = req.user;
    if (user.role !== 'admin' && waitlistEntry.email !== user.email) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Waitlist.findByIdAndDelete(req.params.id);

    res.json({ message: 'Removed from waitlist' });
  } catch (error) {
    console.error('Error removing from waitlist:', error);
    res.status(500).json({ error: 'Failed to remove from waitlist' });
  }
});

module.exports = router;
