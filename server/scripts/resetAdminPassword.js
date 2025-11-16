const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const resetAdminPassword = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'info@thefeverstudio.com';
    const newPassword = 'Laurcalmilo123!';

    // Find and delete existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await User.deleteOne({ email });
      console.log('✅ Deleted existing admin user');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Create new admin user with fresh password
    const adminUser = new User({
      name: 'The Fever Studio',
      email: email,
      phone: '555-0100',
      password: hashedPassword,
      role: 'admin'
    });

    await adminUser.save();

    console.log('✅ Admin password reset successfully!');
    console.log('\n📧 Admin Credentials:');
    console.log('Email:', email);
    console.log('Password:', newPassword);
    console.log('\n🔗 Login at: https://thefeverstudio.com/login');
    console.log('\n⚠️  Remember to change this password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetAdminPassword();
