const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// Get settings (public - for displaying social media links, contact info)
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findById('site_settings');

    // If no settings exist, create default settings
    if (!settings) {
      settings = new Settings({ _id: 'site_settings' });
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings (admin only)
router.put('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const updates = req.body;

    let settings = await Settings.findById('site_settings');

    if (!settings) {
      settings = new Settings({ _id: 'site_settings' });
    }

    // Update fields
    if (updates.socialMedia) {
      settings.socialMedia = { ...settings.socialMedia, ...updates.socialMedia };
    }
    if (updates.contact) {
      settings.contact = { ...settings.contact, ...updates.contact };
    }
    if (updates.emailConfig) {
      settings.emailConfig = { ...settings.emailConfig, ...updates.emailConfig };
    }
    if (updates.payment) {
      settings.payment = { ...settings.payment, ...updates.payment };
    }
    if (updates.siteInfo) {
      settings.siteInfo = { ...settings.siteInfo, ...updates.siteInfo };
    }
    if (updates.smsConfig) {
      settings.smsConfig = { ...settings.smsConfig, ...updates.smsConfig };
    }
    if (updates.homeImages) {
      settings.homeImages = { ...settings.homeImages, ...updates.homeImages };
    }
    if (updates.classPassIntegration) {
      settings.classPassIntegration = { ...settings.classPassIntegration, ...updates.classPassIntegration };
    }
    if (updates.styleCustomizer) {
      settings.styleCustomizer = { ...settings.styleCustomizer, ...updates.styleCustomizer };
    }
    if (updates.customCSS !== undefined) {
      settings.customCSS = updates.customCSS;
    }
    if (updates.homePageContent) {
      settings.homePageContent = { ...settings.homePageContent, ...updates.homePageContent };
    }

    settings.updatedBy = req.user.userId;
    await settings.save();

    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Reset settings to default (admin only)
router.post('/reset', authenticateUser, requireAdmin, async (req, res) => {
  try {
    await Settings.findByIdAndDelete('site_settings');

    const settings = new Settings({ _id: 'site_settings', updatedBy: req.user.userId });
    await settings.save();

    res.json({
      message: 'Settings reset to defaults',
      settings
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

module.exports = router;
