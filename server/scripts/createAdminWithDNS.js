const dns = require('dns');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Set DNS servers to use Google's public DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Import User model
const User = require('../models/User');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'info@thefeverstudio.com';
    const name = 'The Fever Studio';
    const phone = '555-0100';
    const password = 'Laurcalmilo123!';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️  User already exists!');
      console.log('Current role:', existingUser.role);

      // Update password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      existingUser.password = hashedPassword;

      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
      }

      await existingUser.save();
      console.log('✅ User updated with new password and admin role!');

      console.log('\n📧 Updated Admin Account:');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Login URL: https://thefeverstudio.com/login');
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create admin user
      const adminUser = new User({
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'admin'
      });

      await adminUser.save();
      console.log('✅ New admin user created successfully!');
      console.log('\n📧 New Admin Credentials:');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Login URL: https://thefeverstudio.com/login');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdminUser();
