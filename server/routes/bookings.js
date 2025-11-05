const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { authenticateUser } = require('../middleware/auth');
const { validateRequestBody, sanitizeInput } = require('../middleware/validation');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/',
  sanitizeInput,
  [
    body('eventId').notEmpty().withMessage('Event ID is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('spots').isInt({ min: 1 }).withMessage('At least 1 spot required')
  ],
  validateRequestBody(),
  async (req, res) => {
    try {
      const { eventId, name, email, phone, spots } = req.body;

      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (event.availableSpots < spots) {
        return res.status(400).json({ error: 'Not enough spots available' });
      }

      const totalAmount = event.price * spots;

      // Check if Stripe is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        // Demo mode - create booking without payment
        const booking = new Booking({
          event: eventId,
          name,
          email,
          phone,
          spots,
          totalAmount,
          paymentIntentId: 'demo_' + Date.now(),
          paymentStatus: 'demo',
          status: 'confirmed'
        });

        await booking.save();

        event.availableSpots -= spots;
        await event.save();

        return res.status(201).json({
          booking,
          message: 'Demo booking created (payment processing not configured)',
          paymentUrl: `${process.env.CLIENT_URL}/confirmation/${booking._id}`
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: 'usd',
        metadata: {
          eventId: event._id.toString(),
          eventTitle: event.title,
          customerName: name,
          customerEmail: email,
          spots: spots.toString()
        }
      });

      const booking = new Booking({
        event: eventId,
        name,
        email,
        phone,
        spots,
        totalAmount,
        paymentIntentId: paymentIntent.id
      });

      await booking.save();

      event.availableSpots -= spots;
      await event.save();

      res.status(201).json({
        booking,
        clientSecret: paymentIntent.client_secret,
        paymentUrl: `${process.env.CLIENT_URL}/payment/${booking._id}`
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
);

router.get('/', authenticateUser, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('event')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('event');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;

    const booking = await Booking.findOne({ paymentIntentId: paymentIntent.id });
    if (booking) {
      booking.paymentStatus = 'completed';
      booking.status = 'confirmed';
      await booking.save();
    }
  }

  res.json({ received: true });
});

module.exports = router;
