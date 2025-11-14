const express = require('express');
const router = express.Router();
const { upload, cloudinary } = require('../config/cloudinary');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// Upload image endpoint (admin only)
router.post('/image', authenticateUser, requireAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the Cloudinary URL
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: req.file.path,
      publicId: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Delete image endpoint (admin only)
router.delete('/image/:publicId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { publicId } = req.params;

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;
