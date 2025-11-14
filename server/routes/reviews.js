const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all approved reviews (public)
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find({ approved: true })
      .populate('event', 'title')
      .sort({ featured: -1, createdAt: -1 })
      .limit(100);

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get reviews for a specific event (public)
router.get('/event/:eventId', async (req, res) => {
  try {
    const reviews = await Review.find({
      event: req.params.eventId,
      approved: true
    })
      .sort({ featured: -1, createdAt: -1 });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      reviews,
      avgRating: avgRating.toFixed(1),
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Error fetching event reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get featured reviews (public - for home page)
router.get('/featured', async (req, res) => {
  try {
    const reviews = await Review.find({ approved: true, featured: true })
      .populate('event', 'title')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching featured reviews:', error);
    res.status(500).json({ error: 'Failed to fetch featured reviews' });
  }
});

// Submit a review (requires valid booking)
router.post('/',
  [
    body('bookingId').notEmpty().withMessage('Booking ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').trim().notEmpty().withMessage('Comment is required')
      .isLength({ max: 1000 }).withMessage('Comment must be 1000 characters or less')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { bookingId, rating, comment } = req.body;

      // Check if booking exists and is completed
      const booking = await Booking.findById(bookingId).populate('event');
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.paymentStatus !== 'completed') {
        return res.status(400).json({ error: 'Only completed bookings can be reviewed' });
      }

      // Check if event has already occurred
      const eventDate = new Date(booking.event.date);
      if (eventDate > new Date()) {
        return res.status(400).json({ error: 'Cannot review an event that hasn\'t occurred yet' });
      }

      // Check if review already exists
      const existingReview = await Review.findOne({ booking: bookingId });
      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this event' });
      }

      // Create review
      const review = new Review({
        event: booking.event._id,
        booking: bookingId,
        user: booking.user || null,
        name: booking.name,
        email: booking.email,
        rating,
        comment,
        approved: false // Requires admin approval
      });

      await review.save();

      res.status(201).json({
        message: 'Review submitted successfully. It will appear after admin approval.',
        review
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      res.status(500).json({ error: 'Failed to submit review' });
    }
  }
);

// Get all reviews (admin only - including unapproved)
router.get('/admin/all', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('event', 'title date')
      .populate('booking', 'name email')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Approve review (admin only)
router.patch('/:id/approve', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review approved', review });
  } catch (error) {
    console.error('Error approving review:', error);
    res.status(500).json({ error: 'Failed to approve review' });
  }
});

// Toggle featured status (admin only)
router.patch('/:id/featured', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    review.featured = !review.featured;
    await review.save();

    res.json({ message: 'Featured status updated', review });
  } catch (error) {
    console.error('Error updating featured status:', error);
    res.status(500).json({ error: 'Failed to update featured status' });
  }
});

// Delete review (admin only)
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router;
