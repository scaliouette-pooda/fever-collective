const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Event = require('../models/Event');
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

      const event = new Event(eventData);
      await event.save();

      res.status(201).json(event);
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

module.exports = router;
