const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const PromoCode = require('../models/PromoCode');
const { UserMembership } = require('../models/Membership');
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const { validateRequestBody, sanitizeInput } = require('../middleware/validation');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendBookingConfirmation, sendPaymentConfirmation } = require('../services/emailService');
const { triggerPostClassCampaign, triggerMilestoneAchieved } = require('../services/automatedEmailService');
const EmailSubscriber = require('../models/EmailSubscriber');
const User = require('../models/User');

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
      const { eventId, name, email, phone, spots, paymentMethod, promoCodeId, promoCode: promoCodeString, subscribeToEmails, bookingSource, classPassBookingId, classPassPayout } = req.body;

      // Handle email subscription if user opted in
      if (subscribeToEmails) {
        try {
          const tags = ['customer'];
          if (bookingSource === 'classpass') {
            tags.push('classpass');
          }

          await EmailSubscriber.findOrCreate(email, {
            name,
            source: bookingSource === 'classpass' ? 'classpass' : 'booking',
            tags
          });
        } catch (subscribeError) {
          console.error('Error creating email subscriber:', subscribeError);
          // Don't fail the booking if subscription fails
        }
      }

      // Track ClassPass users if this is a ClassPass booking
      if (bookingSource === 'classpass' && userId) {
        try {
          const user = await User.findById(userId);
          if (user) {
            // Set acquisition source if this is their first booking
            if (!user.acquisitionSource || user.acquisitionSource === 'direct') {
              user.acquisitionSource = 'classpass';
            }

            // Track first ClassPass booking
            if (!user.firstClassPassBooking) {
              user.firstClassPassBooking = new Date();
            }

            // Increment ClassPass booking count
            user.classPassBookingCount = (user.classPassBookingCount || 0) + 1;

            await user.save();
          }
        } catch (userError) {
          console.error('Error tracking ClassPass user:', userError);
          // Don't fail the booking if user tracking fails
        }
      }

      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (event.availableSpots < spots) {
        return res.status(400).json({ error: 'Not enough spots available' });
      }

      // Check if user has an active membership (if authenticated)
      let membership = null;
      let userId = null;

      // Try to get userId from JWT token if present
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;
        } catch (err) {
          // Token invalid or expired, continue without user
        }
      }

      if (userId) {
        membership = await UserMembership.findOne({
          user: userId,
          status: 'active'
        }).populate('membershipTier');
      }

      // If user has active membership, use credits instead of payment
      if (membership) {
        const creditsNeeded = spots; // 1 credit per spot

        // Check if user has enough credits (or unlimited)
        if (!membership.membershipTier.isUnlimited && membership.creditsRemaining < creditsNeeded) {
          return res.status(400).json({
            error: 'Insufficient membership credits',
            message: `You need ${creditsNeeded} credits but only have ${membership.creditsRemaining} remaining.`
          });
        }

        // Deduct credits (if not unlimited)
        if (!membership.membershipTier.isUnlimited) {
          await membership.deductCredits(creditsNeeded);
        }

        // Record attendance for milestone tracking
        await membership.recordAttendance();

        // Create booking with membership payment
        const booking = new Booking({
          event: eventId,
          user: userId,
          name,
          email,
          phone,
          spots,
          totalAmount: 0,
          originalAmount: event.price * spots,
          discountAmount: event.price * spots,
          paymentIntentId: `membership_${membership._id}_${Date.now()}`,
          paymentStatus: 'completed',
          paymentMethod: 'membership',
          status: 'confirmed',
          bookingSource: bookingSource || 'membership',
          classPassBookingId,
          classPassPayout
        });

        await booking.save();

        // Reduce available spots immediately
        event.availableSpots -= spots;
        await event.save();

        // Send confirmation email
        try {
          await sendBookingConfirmation({
            to: email,
            name,
            eventTitle: event.title,
            eventDate: event.date,
            eventTime: event.time,
            eventLocation: event.location,
            spots,
            totalAmount: 0,
            bookingId: booking._id,
            qrCode: booking.qrCode,
            paymentMethod: 'Membership Credits'
          });
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }

        return res.status(201).json({
          booking,
          paymentMethod: 'membership',
          membershipCreditsUsed: creditsNeeded,
          creditsRemaining: membership.membershipTier.isUnlimited ? 'unlimited' : membership.creditsRemaining,
          message: 'Booking confirmed with membership credits!'
        });
      }

      let originalAmount = event.price * spots;
      let totalAmount = originalAmount;
      let discountAmount = 0;
      let promoCodeDoc = null;

      // Apply promo code if provided
      if (promoCodeId) {
        promoCodeDoc = await PromoCode.findById(promoCodeId);
        if (promoCodeDoc && promoCodeDoc.isValid()) {
          discountAmount = promoCodeDoc.calculateDiscount(originalAmount);
          totalAmount = originalAmount - discountAmount;

          // Increment usage count
          promoCodeDoc.usageCount += 1;
          await promoCodeDoc.save();
        }
      }

      // Handle Venmo payments
      if (paymentMethod === 'venmo') {
        const booking = new Booking({
          event: eventId,
          name,
          email,
          phone,
          spots,
          totalAmount,
          originalAmount,
          discountAmount,
          promoCode: promoCodeId || null,
          promoCodeUsed: promoCodeString || null,
          paymentIntentId: 'venmo_' + Date.now(),
          paymentStatus: 'pending',
          status: 'pending',
          bookingSource: bookingSource || 'direct',
          classPassBookingId,
          classPassPayout
        });

        await booking.save();

        // Don't reduce spots yet - wait for payment confirmation

        const venmoUsername = process.env.VENMO_USERNAME || 'YourVenmoUsername';
        const venmoUrl = `https://venmo.com/${venmoUsername}?txn=pay&amount=${totalAmount}&note=${encodeURIComponent(`${event.title} - ${spots} spot(s) - ID:${booking._id.toString().substring(0, 8)}`)}&audience=private`;

        return res.status(201).json({
          booking,
          paymentMethod: 'venmo',
          paymentUrl: venmoUrl
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
          originalAmount,
          discountAmount,
          promoCode: promoCodeId || null,
          promoCodeUsed: promoCodeString || null,
          paymentIntentId: 'paypal_' + Date.now(),
          paymentStatus: 'pending',
          status: 'pending',
          bookingSource: bookingSource || 'direct',
          classPassBookingId,
          classPassPayout
        });

        await booking.save();

        // Don't reduce spots yet - wait for payment confirmation

        // PayPal.me link or you can integrate PayPal SDK later
        const paypalEmail = process.env.PAYPAL_EMAIL || 'your-email@example.com';
        const paypalUrl = `https://www.paypal.com/paypalme/${paypalEmail.split('@')[0]}/${totalAmount}`;

        return res.status(201).json({
          booking,
          paymentMethod: 'paypal',
          paymentUrl: paypalUrl
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
          paymentIntentId: paymentIntent.id,
          bookingSource: bookingSource || 'direct',
          classPassBookingId,
          classPassPayout
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

    // Return spots to event ONLY if payment was completed
    // Logic: Spots are reduced when paymentStatus becomes 'completed'
    // So we only return spots if paymentStatus is currently 'completed'
    // Pending bookings never had spots reduced, so nothing to return
    if (booking.paymentStatus === 'completed') {
      const event = await Event.findById(booking.event._id);
      if (event) {
        event.availableSpots += booking.spots;
        await event.save();
        console.log(`Returned ${booking.spots} spots to event ${event.title} (deleted booking ${booking._id})`);
      }
    } else {
      console.log(`No spots returned for pending booking ${booking._id}`);
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Booking deleted successfully',
      spotsReturned: booking.paymentStatus === 'completed' ? booking.spots : 0
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Update booking details (admin only)
router.put('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, spots } = req.body;

    const booking = await Booking.findById(req.params.id).populate('event');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const oldSpots = booking.spots;
    const newSpots = spots || oldSpots;
    const spotsDifference = newSpots - oldSpots;

    // If spots changed and payment is completed, adjust event availability
    if (spotsDifference !== 0 && booking.paymentStatus === 'completed') {
      const event = await Event.findById(booking.event._id);
      if (!event) {
        return res.status(404).json({ error: 'Associated event not found' });
      }

      // If increasing spots, check availability
      if (spotsDifference > 0) {
        if (event.availableSpots < spotsDifference) {
          return res.status(400).json({
            error: `Not enough spots available. Only ${event.availableSpots} spots remaining.`
          });
        }
        event.availableSpots -= spotsDifference;
      } else {
        // Decreasing spots, return them to event
        event.availableSpots += Math.abs(spotsDifference);
      }

      await event.save();
      console.log(`Adjusted ${spotsDifference} spots for event ${event.title} (booking ${booking._id})`);
    }

    // Update booking fields
    if (name) booking.name = name;
    if (email) booking.email = email;
    if (phone) booking.phone = phone;
    if (spots) {
      booking.spots = spots;
      booking.totalAmount = spots * (booking.event?.price || 0);
    }

    await booking.save();

    res.json({
      message: 'Booking updated successfully',
      booking,
      spotsAdjusted: spotsDifference
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
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
      booking,
      confirmationNumber: booking.confirmationNumber
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

    const oldPaymentStatus = booking.paymentStatus;

    if (status) {
      booking.status = status;
    }
    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    }

    await booking.save();

    // Handle spot management based on payment status transitions
    const event = await Event.findById(booking.event._id);
    if (event) {
      // Reduce available spots ONLY when payment is confirmed for the first time
      if (oldPaymentStatus === 'pending' && paymentStatus === 'completed') {
        event.availableSpots -= booking.spots;
        await event.save();
        console.log(`Reduced ${booking.spots} spots for event ${event.title} (booking ${booking._id} payment confirmed)`);
      }

      // Return spots when refunding a completed payment
      if (oldPaymentStatus === 'completed' && paymentStatus === 'refunded') {
        event.availableSpots += booking.spots;
        await event.save();
        console.log(`Returned ${booking.spots} spots to event ${event.title} (booking ${booking._id} refunded)`);
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

    res.json({
      message: 'Booking updated successfully',
      booking,
      spotsReturned: (oldPaymentStatus === 'completed' && paymentStatus === 'refunded') ? booking.spots : 0
    });
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

// Check-in booking (admin only)
router.post('/:id/check-in', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('event');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.paymentStatus !== 'completed') {
      return res.status(400).json({ error: 'Only completed bookings can be checked in' });
    }

    if (booking.checkedIn) {
      return res.status(400).json({
        error: 'Already checked in',
        checkedInAt: booking.checkedInAt
      });
    }

    booking.checkedIn = true;
    booking.checkedInAt = new Date();
    await booking.save();

    res.json({
      message: 'Check-in successful',
      booking: {
        id: booking._id,
        name: booking.name,
        email: booking.email,
        spots: booking.spots,
        event: booking.event.title,
        checkedInAt: booking.checkedInAt
      }
    });
  } catch (error) {
    console.error('Error checking in booking:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

// Scan QR code for check-in (admin only)
router.post('/check-in/scan', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ error: 'QR data is required' });
    }

    // QR data format: "BOOKING:bookingId"
    const [prefix, bookingId] = qrData.split(':');

    if (prefix !== 'BOOKING') {
      return res.status(400).json({ error: 'Invalid QR code' });
    }

    const booking = await Booking.findById(bookingId).populate('event');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.paymentStatus !== 'completed') {
      return res.status(400).json({ error: 'Payment not completed for this booking' });
    }

    if (booking.checkedIn) {
      return res.json({
        alreadyCheckedIn: true,
        message: 'Already checked in',
        booking: {
          id: booking._id,
          name: booking.name,
          email: booking.email,
          spots: booking.spots,
          event: booking.event.title,
          checkedInAt: booking.checkedInAt
        }
      });
    }

    booking.checkedIn = true;
    booking.checkedInAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: 'Check-in successful',
      booking: {
        id: booking._id,
        name: booking.name,
        email: booking.email,
        spots: booking.spots,
        event: booking.event.title,
        checkedInAt: booking.checkedInAt
      }
    });
  } catch (error) {
    console.error('Error scanning QR code:', error);
    res.status(500).json({ error: 'Failed to process QR code' });
  }
});

// Membership-based QR Check-in
router.post('/check-in', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { userId, eventId, membershipNumber } = req.body;

    console.log('=== MEMBERSHIP CHECK-IN REQUEST ===');
    console.log('User ID:', userId);
    console.log('Event ID:', eventId);
    console.log('Membership Number:', membershipNumber);

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get user's active membership
    const membership = await UserMembership.findOne({
      userId: userId,
      membershipNumber: membershipNumber,
      status: { $in: ['active', 'pending-cancellation'] }
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: 'No active membership found for this user'
      });
    }

    console.log('Membership found:', membership.membershipTier);

    // Check if member has a booking for this event (optional - can check in without booking)
    let booking = await Booking.findOne({
      userId: userId,
      event: eventId,
      paymentStatus: 'completed'
    });

    // If they have a booking, mark it as checked in
    if (booking) {
      if (booking.checkedIn) {
        return res.json({
          success: true,
          message: 'Already checked in for this class',
          creditsRemaining: membership.creditsRemaining,
          alreadyCheckedIn: true
        });
      }

      booking.checkedIn = true;
      booking.checkedInAt = new Date();
      await booking.save();
      console.log('Booking marked as checked in');
    } else {
      console.log('No booking found - walk-in check-in');

      // No booking - this is a walk-in, need to deduct credits if not unlimited
      if (membership.membershipTier !== 'epidemic') {
        // Check if they have credits
        if (membership.creditsRemaining <= 0) {
          return res.status(400).json({
            success: false,
            message: 'No credits remaining. Please purchase additional classes or upgrade membership.'
          });
        }

        // Deduct 1 credit
        const deducted = membership.deductCredits(1);
        if (!deducted) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient credits'
          });
        }

        await membership.save();
        console.log('Credit deducted. Remaining:', membership.creditsRemaining);
      }
    }

    // Increment class attendance count for milestone rewards
    membership.incrementClassCount();
    const reward = membership.checkMilestoneReward();
    await membership.save();

    console.log('Class attendance recorded. Total:', membership.totalClassesAttended);
    if (reward) {
      console.log('🎉 Milestone reward earned:', reward);
    }

    // Update event available spots if walk-in
    if (!booking) {
      if (event.availableSpots > 0) {
        event.availableSpots -= 1;
        await event.save();
      }
    }

    // Trigger automated post-class campaigns (async, don't wait)
    const user = await require('../models/User').findById(userId);
    if (user) {
      triggerPostClassCampaign(userId, user.email, {
        userName: user.name,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time
      }).catch(err => console.error('Failed to trigger post-class campaign:', err));

      // Trigger milestone campaign if milestone achieved
      if (reward) {
        triggerMilestoneAchieved(userId, user.email, reward.milestone, reward.reward)
          .catch(err => console.error('Failed to trigger milestone campaign:', err));
      }
    }

    res.json({
      success: true,
      message: reward
        ? `Check-in successful! 🎉 You've earned a ${reward.reward} for attending ${reward.milestone} classes!`
        : 'Check-in successful! Welcome to class.',
      creditsRemaining: membership.membershipTier === 'epidemic' ? 'unlimited' : membership.creditsRemaining,
      totalClassesAttended: membership.totalClassesAttended,
      reward: reward || null
    });

  } catch (error) {
    console.error('=== CHECK-IN ERROR ===');
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Check-in failed. Please try again or see staff for assistance.',
      error: error.message
    });
  }
});

module.exports = router;
