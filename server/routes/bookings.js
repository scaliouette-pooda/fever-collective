const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const { validateRequestBody, sanitizeInput } = require('../middleware/validation');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendBookingConfirmation, sendPaymentConfirmation } = require('../services/emailService');

router.post('/',
  sanitizeInput,
  [
    body('eventId').notEmpty().withMessage('Event ID is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('spots').isInt({ min: 1 }).withMessage('At least 1 spot required'),
    body('paymentMethod').isIn(['paypal', 'venmo', 'stripe']).withMessage('Valid payment method required')
  ],
  validateRequestBody(),
  async (req, res) => {
    try {
      const { eventId, name, email, phone, spots, paymentMethod } = req.body;

      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (event.availableSpots < spots) {
        return res.status(400).json({ error: 'Not enough spots available' });
      }

      const totalAmount = event.price * spots;

      // Handle Venmo payments
      if (paymentMethod === 'venmo') {
        const booking = new Booking({
          event: eventId,
          name,
          email,
          phone,
          spots,
          totalAmount,
          paymentIntentId: 'venmo_' + Date.now(),
          paymentStatus: 'pending',
          status: 'pending'
        });

        await booking.save();

        // Don't reduce spots yet - wait for payment confirmation

        const venmoUsername = process.env.VENMO_USERNAME || 'YourVenmoUsername';
        const venmoUrl = `https://venmo.com/${venmoUsername}?txn=pay&amount=${totalAmount}&note=${encodeURIComponent(`${event.title} - ${spots} spot(s) - ID:${booking._id.toString().substring(0, 8)}`)}&audience=private`;
        const returnUrl = `${process.env.CLIENT_URL}/payment-confirmation/${booking._id}`;

        return res.status(201).json({
          booking,
          paymentMethod: 'venmo',
          paymentUrl: venmoUrl,
          returnUrl: returnUrl
        });
      }

      // Handle PayPal payments
      if (paymentMethod === 'paypal') {
        const booking = new Booking({
          event: eventId,
          name,
          email,
          phone,
          spots,
          totalAmount,
          paymentIntentId: 'paypal_' + Date.now(),
          paymentStatus: 'pending',
          status: 'pending'
        });

        await booking.save();

        // Don't reduce spots yet - wait for payment confirmation

        // PayPal.me link or you can integrate PayPal SDK later
        const paypalEmail = process.env.PAYPAL_EMAIL || 'your-email@example.com';
        const paypalUrl = `https://www.paypal.com/paypalme/${paypalEmail.split('@')[0]}/${totalAmount}`;
        const returnUrl = `${process.env.CLIENT_URL}/payment-confirmation/${booking._id}`;

        return res.status(201).json({
          booking,
          paymentMethod: 'paypal',
          paymentUrl: paypalUrl,
          returnUrl: returnUrl,
          instructions: `Please pay $${totalAmount} via PayPal to complete your booking. Include booking ID: ${booking._id.toString().substring(0, 8)}`
        });
      }

      // Handle Stripe payments (if configured)
      if (paymentMethod === 'stripe' && process.env.STRIPE_SECRET_KEY) {
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

        return res.status(201).json({
          booking,
          clientSecret: paymentIntent.client_secret,
          paymentUrl: `${process.env.CLIENT_URL}/payment/${booking._id}`
        });
      }

      // Fallback if no valid payment method
      return res.status(400).json({
        error: 'Payment method not available',
        message: 'Selected payment method is not configured'
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
);

router.get('/', authenticateUser, requireAdmin, async (req, res) => {
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

// Delete booking (admin only)
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('event');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // If payment was completed, return the spots to the event
    if (booking.paymentStatus === 'completed') {
      const event = await Event.findById(booking.event._id);
      if (event) {
        event.availableSpots += booking.spots;
        await event.save();
      }
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// User confirms they completed payment (no auth required - public endpoint)
router.post('/:id/confirm-payment', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('event');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.paymentStatus === 'completed') {
      return res.json({ message: 'Payment already confirmed', booking });
    }

    // Update to "pending review" status
    booking.paymentStatus = 'pending';
    booking.status = 'pending';
    await booking.save();

    // Send notification email to user
    sendPaymentConfirmation(booking).catch(err =>
      console.error('Payment confirmation email failed:', err)
    );

    res.json({
      message: 'Payment confirmation received. Your booking will be reviewed shortly.',
      booking
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Update booking status (admin only)
router.patch('/:id/status', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    const booking = await Booking.findById(req.params.id).populate('event');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const wasPaymentPending = booking.paymentStatus === 'pending';

    if (status) {
      booking.status = status;
    }
    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    }

    await booking.save();

    // Reduce available spots ONLY when payment is confirmed for the first time
    if (wasPaymentPending && paymentStatus === 'completed') {
      const event = await Event.findById(booking.event._id);
      if (event) {
        event.availableSpots -= booking.spots;
        await event.save();
      }
    }

    // Send email if payment was just confirmed
    if (paymentStatus === 'completed' && booking.paymentStatus === 'completed') {
      sendPaymentConfirmation(booking).catch(err => console.error('Payment email failed:', err));
    }

    // Send email if booking was just confirmed
    if (status === 'confirmed' && booking.status === 'confirmed') {
      sendBookingConfirmation(booking).catch(err => console.error('Booking email failed:', err));
    }

    res.json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
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
