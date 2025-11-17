const express = require('express');
const router = express.Router();
const { authenticateUser, requireAdmin } = require('../middleware/auth');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Settings = require('../models/Settings');

// Get ClassPass analytics overview
router.get('/overview', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const settings = await Settings.findOne();

    if (!settings?.classPassIntegration?.enabled) {
      return res.status(400).json({ error: 'ClassPass integration is not enabled' });
    }

    const conversionGoalDays = settings.classPassIntegration.conversionGoalDays || 30;
    const defaultPayout = settings.classPassIntegration.defaultPayoutRate || 22;

    // Get all ClassPass bookings
    const classPassBookings = await Booking.find({ bookingSource: 'classpass' })
      .populate('event')
      .sort({ createdAt: -1 });

    const totalBookings = classPassBookings.length;
    const completedBookings = classPassBookings.filter(b => b.paymentStatus === 'completed').length;

    // Calculate revenue (use classPassPayout if available, otherwise default)
    const totalRevenue = classPassBookings
      .filter(b => b.paymentStatus === 'completed')
      .reduce((sum, b) => sum + (b.classPassPayout || defaultPayout), 0);

    // Get ClassPass users
    const classPassUsers = await User.find({ acquisitionSource: 'classpass' });
    const totalUsers = classPassUsers.length;

    // Calculate conversions
    const convertedUsers = classPassUsers.filter(u => u.convertedToMember).length;
    const conversionRate = totalUsers > 0 ? (convertedUsers / totalUsers * 100).toFixed(1) : 0;

    // Get users within conversion window
    const conversionWindowDate = new Date();
    conversionWindowDate.setDate(conversionWindowDate.getDate() - conversionGoalDays);

    const recentClassPassUsers = classPassUsers.filter(u =>
      u.firstClassPassBooking && new Date(u.firstClassPassBooking) >= conversionWindowDate
    );

    // Hot leads: ClassPass users with 2+ bookings but not converted
    const hotLeads = classPassUsers.filter(u =>
      !u.convertedToMember && u.classPassBookingCount >= 2
    ).slice(0, 20);

    // Average bookings per user
    const avgBookingsPerUser = totalUsers > 0
      ? (classPassBookings.length / totalUsers).toFixed(1)
      : 0;

    // Recent ClassPass bookings for activity feed
    const recentBookings = classPassBookings.slice(0, 10).map(b => ({
      id: b._id,
      name: b.name,
      email: b.email,
      eventTitle: b.event?.title || 'N/A',
      date: b.createdAt,
      payout: b.classPassPayout || defaultPayout,
      status: b.paymentStatus
    }));

    res.json({
      overview: {
        totalBookings,
        completedBookings,
        totalRevenue,
        totalUsers,
        convertedUsers,
        conversionRate,
        avgBookingsPerUser,
        conversionGoalDays
      },
      hotLeads: hotLeads.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        bookingCount: u.classPassBookingCount,
        firstBooking: u.firstClassPassBooking,
        daysSinceFirst: u.firstClassPassBooking
          ? Math.floor((new Date() - new Date(u.firstClassPassBooking)) / (1000 * 60 * 60 * 24))
          : 0
      })),
      recentActivity: recentBookings
    });
  } catch (error) {
    console.error('Error fetching ClassPass analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get ClassPass conversion funnel data
router.get('/funnel', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const settings = await Settings.findOne();

    if (!settings?.classPassIntegration?.enabled) {
      return res.status(400).json({ error: 'ClassPass integration is not enabled' });
    }

    const classPassUsers = await User.find({ acquisitionSource: 'classpass' });

    // Funnel stages
    const stage1_firstBooking = classPassUsers.length;
    const stage2_secondBooking = classPassUsers.filter(u => u.classPassBookingCount >= 2).length;
    const stage3_thirdBooking = classPassUsers.filter(u => u.classPassBookingCount >= 3).length;
    const stage4_converted = classPassUsers.filter(u => u.convertedToMember).length;

    res.json({
      funnel: [
        {
          stage: 'First Visit',
          count: stage1_firstBooking,
          percentage: 100,
          color: '#007aff'
        },
        {
          stage: 'Second Visit',
          count: stage2_secondBooking,
          percentage: stage1_firstBooking > 0 ? (stage2_secondBooking / stage1_firstBooking * 100).toFixed(1) : 0,
          color: '#34c759'
        },
        {
          stage: '3+ Visits',
          count: stage3_thirdBooking,
          percentage: stage1_firstBooking > 0 ? (stage3_thirdBooking / stage1_firstBooking * 100).toFixed(1) : 0,
          color: '#ff9500'
        },
        {
          stage: 'Converted',
          count: stage4_converted,
          percentage: stage1_firstBooking > 0 ? (stage4_converted / stage1_firstBooking * 100).toFixed(1) : 0,
          color: '#c9a86a'
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching funnel data:', error);
    res.status(500).json({ error: 'Failed to fetch funnel data' });
  }
});

// Mark user as converted (manual action)
router.post('/convert-user/:userId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.convertedToMember) {
      return res.json({ message: 'User already marked as converted', user });
    }

    user.convertedToMember = true;
    user.conversionDate = new Date();
    await user.save();

    res.json({
      message: 'User marked as converted successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        convertedToMember: user.convertedToMember,
        conversionDate: user.conversionDate
      }
    });
  } catch (error) {
    console.error('Error marking user as converted:', error);
    res.status(500).json({ error: 'Failed to mark user as converted' });
  }
});

// Get revenue comparison (ClassPass vs Direct)
router.get('/revenue-comparison', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const settings = await Settings.findOne();

    if (!settings?.classPassIntegration?.enabled) {
      return res.status(400).json({ error: 'ClassPass integration is not enabled' });
    }

    const defaultPayout = settings.classPassIntegration.defaultPayoutRate || 22;

    // Get all completed bookings
    const allBookings = await Booking.find({ paymentStatus: 'completed' });

    const classPassBookings = allBookings.filter(b => b.bookingSource === 'classpass');
    const directBookings = allBookings.filter(b => (b.bookingSource || 'direct') === 'direct');

    const classPassRevenue = classPassBookings.reduce((sum, b) =>
      sum + (b.classPassPayout || defaultPayout), 0
    );
    const directRevenue = directBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    res.json({
      classPass: {
        bookings: classPassBookings.length,
        revenue: classPassRevenue,
        avgPerBooking: classPassBookings.length > 0
          ? (classPassRevenue / classPassBookings.length).toFixed(2)
          : 0
      },
      direct: {
        bookings: directBookings.length,
        revenue: directRevenue,
        avgPerBooking: directBookings.length > 0
          ? (directRevenue / directBookings.length).toFixed(2)
          : 0
      },
      comparison: {
        totalRevenue: classPassRevenue + directRevenue,
        classPassPercentage: ((classPassRevenue / (classPassRevenue + directRevenue)) * 100).toFixed(1),
        directPercentage: ((directRevenue / (classPassRevenue + directRevenue)) * 100).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Error fetching revenue comparison:', error);
    res.status(500).json({ error: 'Failed to fetch revenue comparison' });
  }
});

module.exports = router;
