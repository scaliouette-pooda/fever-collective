const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const updateAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'info@thefeverstudio.com';
    const newPassword = 'Laurcalmilo123!';

    // Find the admin user
    const adminUser = await User.findOne({ email });

    if (!adminUser) {
      console.log('❌ Admin user not found with email:', email);
      process.exit(1);
    }

    console.log('✅ Found admin user:', adminUser.name);
    console.log('Current role:', adminUser.role);

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    adminUser.password = hashedPassword;
    await adminUser.save();

    console.log('✅ Password updated successfully!');
    console.log('\n📧 Admin Credentials:');
    console.log('Email:', email);
    console.log('Password:', newPassword);
    console.log('Login URL: https://thefeverstudio.com/login');

    // Clean up old admin account
    const oldAdmin = await User.findOne({ email: 'info@thefevercollective.com' });
    if (oldAdmin) {
      await User.deleteOne({ email: 'info@thefevercollective.com' });
      console.log('\n🗑️  Deleted old admin account: info@thefevercollective.com');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

updateAdminPassword();
