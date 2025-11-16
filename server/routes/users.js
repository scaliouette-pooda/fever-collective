const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Admin
router.get('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (admin only)
// @access  Admin
router.get('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

// @route   PATCH /api/users/:id
// @desc    Update user (admin only)
// @access  Admin
router.patch('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;

    await user.save();

    const updatedUser = await User.findById(req.params.id).select('-password');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

module.exports = router;
