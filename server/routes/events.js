const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const { validateRequestBody, sanitizeInput } = require('../middleware/validation');
const { upload } = require('../config/cloudinary');

router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ isActive: true })
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

router.post('/',
  authenticateUser,
  requireAdmin,
  sanitizeInput,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('time').notEmpty().withMessage('Time is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
    body('instructor').notEmpty().withMessage('Instructor is required')
  ],
  validateRequestBody(),
  async (req, res) => {
    try {
      const eventData = {
        ...req.body,
        availableSpots: req.body.capacity
      };

      // Check if this is a recurring event
      if (req.body.isRecurring && req.body.recurrencePattern !== 'none' && req.body.recurrenceEndDate) {
        const createdEvents = [];
        const startDate = new Date(req.body.date);
        const endDate = new Date(req.body.recurrenceEndDate);

        // Helper function to get day name from date
        const getDayName = (date) => {
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          return days[date.getDay()];
        };

        // Helper function to check if date matches selected days
        const shouldCreateEvent = (date, pattern, selectedDays) => {
          if (pattern !== 'daily' || !selectedDays || selectedDays.length === 0) {
            return true; // Create event for all days if not daily pattern or no specific days selected
          }
          const dayName = getDayName(date);
          return selectedDays.includes(dayName);
        };

        // Create the first event
        const firstEvent = new Event(eventData);
        await firstEvent.save();
        createdEvents.push(firstEvent);

        // Generate recurring events
        let currentDate = new Date(startDate);

        while (currentDate < endDate) {
          // Calculate next date based on pattern
          switch (req.body.recurrencePattern) {
            case 'daily':
              currentDate.setDate(currentDate.getDate() + 1);
              break;
            case 'weekly':
              currentDate.setDate(currentDate.getDate() + 7);
              break;
            case 'monthly':
              currentDate.setMonth(currentDate.getMonth() + 1);
              break;
            default:
              break;
          }

          // Create event for this date if within range and matches selected days
          if (currentDate <= endDate && shouldCreateEvent(currentDate, req.body.recurrencePattern, req.body.recurrenceDays)) {
            const recurringEventData = {
              ...eventData,
              date: currentDate.toISOString(),
              parentEventId: firstEvent._id
            };
            const recurringEvent = new Event(recurringEventData);
            await recurringEvent.save();
            createdEvents.push(recurringEvent);
          }
        }

        res.status(201).json({
          message: `Created ${createdEvents.length} recurring events`,
          events: createdEvents,
          count: createdEvents.length
        });
      } else {
        // Single event creation
        const event = new Event(eventData);
        await event.save();
        res.status(201).json(event);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  }
);

router.put('/:id',
  authenticateUser,
  requireAdmin,
  sanitizeInput,
  async (req, res) => {
    try {
      const event = await Event.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json(event);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  }
);

router.delete('/:id',
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const event = await Event.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      );

      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  }
);

// Image upload endpoint
router.post('/upload-image',
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      // Check if Cloudinary is configured
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        return res.status(501).json({
          error: 'Image upload not configured',
          message: 'Cloudinary credentials not set. Contact admin to enable image uploads.'
        });
      }

      // Use multer upload middleware
      upload.single('image')(req, res, async (err) => {
        if (err) {
          console.error('Upload error:', err);
          return res.status(500).json({ error: 'Failed to upload image' });
        }

        if (!req.file) {
          return res.status(400).json({ error: 'No image file provided' });
        }

        res.json({
          message: 'Image uploaded successfully',
          imageUrl: req.file.path,
          imageId: req.file.filename
        });
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  }
);

// Recalculate available spots for an event based on completed bookings (admin only)
router.post('/:id/recalculate-spots', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get all bookings with completed payment for this event
    const completedBookings = await Booking.find({
      event: event._id,
      paymentStatus: 'completed'
    });

    // Calculate total spots booked
    const totalBooked = completedBookings.reduce((sum, booking) => sum + booking.spots, 0);

    // Calculate correct available spots
    const correctAvailableSpots = event.capacity - totalBooked;

    const oldAvailableSpots = event.availableSpots;
    event.availableSpots = correctAvailableSpots;
    await event.save();

    console.log(`Event ${event.title}: Recalculated spots from ${oldAvailableSpots} to ${correctAvailableSpots} (Capacity: ${event.capacity}, Booked: ${totalBooked})`);

    res.json({
      message: 'Spots recalculated successfully',
      event,
      oldAvailableSpots,
      newAvailableSpots: correctAvailableSpots,
      totalBooked,
      capacity: event.capacity
    });
  } catch (error) {
    console.error('Error recalculating spots:', error);
    res.status(500).json({ error: 'Failed to recalculate spots' });
  }
});

module.exports = router;
