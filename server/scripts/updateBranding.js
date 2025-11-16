const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

dns.setServers(['8.8.8.8', '8.8.4.4']);

const Settings = require('../models/Settings');

const updateBranding = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update or create settings
    const settings = await Settings.findOneAndUpdate(
      { _id: 'site_settings' },
      {
        $set: {
          'siteInfo.siteName': '🔥 Fever',
          'siteInfo.tagline': 'Get Hot. Get Strong. Get Fever.',
          'siteInfo.secondaryTagline': 'Heat That Heals. Movement That Empowers.',
          'siteInfo.description': 'Fever is a boutique heated mat Pilates studio in Berkeley designed to elevate strength, flexibility, and community. With a music-driven, energizing environment, members experience a high-intensity Pilates workout in a warm, welcoming studio.',
          'siteInfo.concept': 'A fever is your body\'s natural response to burn out what doesn\'t serve you — it raises your temperature to heal and reset. Likewise, Fever the studio represents using heat, movement, and intensity to transform your body and renew your energy.',
          'siteInfo.offeringTypes': ['Heated Mat Pilates', 'Non-Heated Pilates', 'Yoga Sculpt'],
          'emailConfig.fromName': 'Fever',
          'contact.email': 'info@thefeverstudio.com'
        }
      },
      { upsert: true, new: true }
    );

    console.log('✅ Branding updated successfully!');
    console.log('\nNew Settings:');
    console.log('Site Name:', settings.siteInfo.siteName);
    console.log('Tagline:', settings.siteInfo.tagline);
    console.log('Secondary Tagline:', settings.siteInfo.secondaryTagline);
    console.log('Offerings:', settings.siteInfo.offeringTypes.join(', '));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating branding:', error);
    process.exit(1);
  }
};

updateBranding();
