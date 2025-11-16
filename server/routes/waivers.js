const express = require('express');
const router = express.Router();
const Waiver = require('../models/Waiver');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// Get default waiver text
router.get('/template/:type?', async (req, res) => {
  try {
    const type = req.params.type || 'general';

    const waiverTemplates = {
      general: `LIABILITY WAIVER AND RELEASE

By signing this waiver, I acknowledge and agree to the following:

1. ASSUMPTION OF RISK
I understand that participation in dance classes, fitness activities, and events at The Fever Studio involves inherent risks, including but not limited to physical injury, illness, or property damage. I voluntarily assume all risks associated with my participation.

2. HEALTH REPRESENTATION
I certify that I am in good physical condition and have no medical conditions that would prevent my safe participation in these activities. I agree to immediately inform the instructor of any health concerns or physical limitations.

3. RELEASE OF LIABILITY
I hereby release, waive, discharge, and covenant not to sue The Fever Studio, its owners, instructors, employees, and agents from any and all liability, claims, demands, or causes of action arising from my participation in activities, including those caused by negligence.

4. MEDICAL TREATMENT
I authorize The Fever Studio to obtain emergency medical treatment if necessary and agree to be financially responsible for any costs incurred.

5. MEMBERSHIP CANCELLATION POLICY
I understand and agree that if I purchase a membership, a 30-day written notice is required for cancellation. My membership will remain active during the 30-day notice period, and I may continue to use my credits. After the notice period, my membership will be cancelled and no further charges will be applied.

6. PHOTO/VIDEO RELEASE
I grant The Fever Studio permission to use photographs and videos taken during classes and events for promotional purposes.

7. ACKNOWLEDGMENT
I have read this waiver and fully understand its contents. I voluntarily agree to its terms and conditions.`,

      minor: `PARENTAL CONSENT AND LIABILITY WAIVER

As the parent or legal guardian of the minor named below, I acknowledge and agree to the following:

1. ASSUMPTION OF RISK
I understand that participation in dance classes and activities at The Fever Studio involves inherent risks of injury. I voluntarily allow my child to participate and assume all associated risks.

2. HEALTH REPRESENTATION
I certify that my child is in good physical condition and has no medical conditions that would prevent safe participation. I will immediately inform instructors of any health concerns.

3. RELEASE OF LIABILITY
I hereby release The Fever Studio, its owners, instructors, and staff from any liability for injuries or damages arising from my child's participation, including those caused by negligence.

4. MEDICAL TREATMENT
I authorize The Fever Studio to obtain emergency medical treatment for my child if necessary and agree to be financially responsible for any costs.

5. SUPERVISION
I understand that The Fever Studio provides instruction but does not provide childcare services outside of class time.

6. MEMBERSHIP CANCELLATION POLICY
I understand and agree that if I purchase a membership for my child, a 30-day written notice is required for cancellation. The membership will remain active during the 30-day notice period, and my child may continue to use credits. After the notice period, the membership will be cancelled and no further charges will be applied.

7. PHOTO/VIDEO RELEASE
I grant permission for The Fever Studio to use photographs and videos of my child for promotional purposes.

8. ACKNOWLEDGMENT
I have read and fully understand this waiver and voluntarily agree to its terms on behalf of my child.`
    };

    res.json({
      waiverText: waiverTemplates[type] || waiverTemplates.general,
      type
    });
  } catch (error) {
    console.error('Error fetching waiver template:', error);
    res.status(500).json({ error: 'Failed to fetch waiver template' });
  }
});

// Sign a waiver
router.post('/sign', authenticateUser, async (req, res) => {
  try {
    const {
      waiverType,
      waiverText,
      signature,
      signatureType,
      fullName,
      agreedToTerms,
      eventId,
      guardianName,
      guardianRelationship,
      dateOfBirth,
      isMinor
    } = req.body;

    if (!agreedToTerms) {
      return res.status(400).json({ error: 'You must agree to the terms' });
    }

    if (!signature || !fullName) {
      return res.status(400).json({ error: 'Signature and full name are required' });
    }

    // Get IP address
    const ipAddress = req.headers['x-forwarded-for'] ||
                     req.connection.remoteAddress ||
                     req.socket.remoteAddress;

    const userAgent = req.headers['user-agent'];

    // Calculate expiration (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const waiver = new Waiver({
      userId: req.user.userId,
      waiverType: waiverType || 'general',
      waiverText,
      signature,
      signatureType: signatureType || 'typed',
      fullName,
      email: req.user.email,
      ipAddress,
      userAgent,
      agreedToTerms,
      eventId,
      guardianName,
      guardianRelationship,
      dateOfBirth,
      isMinor: isMinor || false,
      expiresAt
    });

    await waiver.save();

    console.log('✅ Waiver signed:', {
      userId: req.user.userId,
      email: req.user.email,
      type: waiverType,
      signedAt: waiver.signedAt
    });

    res.status(201).json({
      message: 'Waiver signed successfully',
      waiver: {
        id: waiver._id,
        signedAt: waiver.signedAt,
        expiresAt: waiver.expiresAt,
        type: waiver.waiverType
      }
    });
  } catch (error) {
    console.error('Error signing waiver:', error);
    res.status(500).json({ error: 'Failed to sign waiver' });
  }
});

// Check if user has signed a valid waiver
router.get('/status', authenticateUser, async (req, res) => {
  try {
    const { type, eventId } = req.query;

    const query = {
      userId: req.user.userId,
      agreedToTerms: true
    };

    if (type) query.waiverType = type;
    if (eventId) query.eventId = eventId;

    const waiver = await Waiver.findOne(query)
      .sort({ signedAt: -1 })
      .select('waiverType signedAt expiresAt isMinor');

    if (!waiver) {
      return res.json({ hasSigned: false });
    }

    const isValid = waiver.isValid();

    res.json({
      hasSigned: true,
      isValid,
      waiver: {
        id: waiver._id,
        type: waiver.waiverType,
        signedAt: waiver.signedAt,
        expiresAt: waiver.expiresAt,
        isMinor: waiver.isMinor
      }
    });
  } catch (error) {
    console.error('Error checking waiver status:', error);
    res.status(500).json({ error: 'Failed to check waiver status' });
  }
});

// Get user's waiver history
router.get('/my-waivers', authenticateUser, async (req, res) => {
  try {
    const waivers = await Waiver.find({ userId: req.user.userId })
      .sort({ signedAt: -1 })
      .select('-waiverText -signature -ipAddress -userAgent')
      .populate('eventId', 'title date');

    res.json(waivers);
  } catch (error) {
    console.error('Error fetching waivers:', error);
    res.status(500).json({ error: 'Failed to fetch waivers' });
  }
});

// Get a specific waiver (for viewing)
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const waiver = await Waiver.findOne({
      _id: req.params.id,
      userId: req.user.userId
    }).populate('eventId', 'title date');

    if (!waiver) {
      return res.status(404).json({ error: 'Waiver not found' });
    }

    res.json(waiver);
  } catch (error) {
    console.error('Error fetching waiver:', error);
    res.status(500).json({ error: 'Failed to fetch waiver' });
  }
});

// Admin: Get all waivers
router.get('/admin/all', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, startDate, endDate } = req.query;

    const query = {};
    if (type) query.waiverType = type;
    if (startDate || endDate) {
      query.signedAt = {};
      if (startDate) query.signedAt.$gte = new Date(startDate);
      if (endDate) query.signedAt.$lte = new Date(endDate);
    }

    const waivers = await Waiver.find(query)
      .sort({ signedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name email')
      .populate('eventId', 'title date')
      .select('-waiverText -signature');

    const count = await Waiver.countDocuments(query);

    res.json({
      waivers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    console.error('Error fetching all waivers:', error);
    res.status(500).json({ error: 'Failed to fetch waivers' });
  }
});

// Admin: Get waiver statistics
router.get('/admin/stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const totalWaivers = await Waiver.countDocuments();
    const generalWaivers = await Waiver.countDocuments({ waiverType: 'general' });
    const minorWaivers = await Waiver.countDocuments({ waiverType: 'minor' });
    const eventWaivers = await Waiver.countDocuments({ waiverType: 'event-specific' });

    // Waivers signed in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentWaivers = await Waiver.countDocuments({
      signedAt: { $gte: thirtyDaysAgo }
    });

    // Expired waivers
    const expiredWaivers = await Waiver.countDocuments({
      expiresAt: { $lt: new Date() }
    });

    res.json({
      total: totalWaivers,
      byType: {
        general: generalWaivers,
        minor: minorWaivers,
        eventSpecific: eventWaivers
      },
      recentWaivers,
      expiredWaivers
    });
  } catch (error) {
    console.error('Error fetching waiver stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
