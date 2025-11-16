const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'info@thefevercollective.com';
    const name = 'The Fever Studio';
    const phone = '555-0100'; // Placeholder phone
    const password = 'FeverDesigner2025!'; // Different password for new admin

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️  User already exists!');
      console.log('Current role:', existingUser.role);
      
      if (existingUser.role !== 'admin') {
        console.log('Updating to admin role...');
        existingUser.role = 'admin';
        await existingUser.save();
        console.log('✅ User updated to admin role!');
      } else {
        console.log('✅ User is already an admin. No changes needed.');
      }
      
      console.log('\n📧 Existing Admin Account:');
      console.log('Email:', email);
      console.log('Password: [Already set - not changed]');
      console.log('Login URL: https://fever-collective.vercel.app/admin');
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
      console.log('Login URL: https://fever-collective.vercel.app/admin');
      console.log('\n⚠️  IMPORTANT: Have them change their password after first login!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdminUser();
