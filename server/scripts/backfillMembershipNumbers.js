const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { UserMembership } = require('../models/Membership');

async function backfillMembershipNumbers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all memberships without membership numbers
    const membershipsWithoutNumbers = await UserMembership.find({
      $or: [
        { membershipNumber: null },
        { membershipNumber: undefined },
        { membershipNumber: '' }
      ]
    });

    console.log(`\nFound ${membershipsWithoutNumbers.length} memberships without membership numbers`);

    if (membershipsWithoutNumbers.length === 0) {
      console.log('✅ All memberships already have membership numbers!');
      await mongoose.connection.close();
      return;
    }

    // Update each membership with a unique number
    let updatedCount = 0;
    let errorCount = 0;

    for (const membership of membershipsWithoutNumbers) {
      try {
        // Generate unique membership number
        const membershipNumber = await UserMembership.generateMembershipNumber();

        // Update the membership
        membership.membershipNumber = membershipNumber;
        await membership.save();

        console.log(`✅ Updated membership ${membership._id} → ${membershipNumber}`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating membership ${membership._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== BACKFILL SUMMARY ===');
    console.log(`Total memberships processed: ${membershipsWithoutNumbers.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);

    // Close connection
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');

  } catch (error) {
    console.error('❌ Error during backfill:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillMembershipNumbers();
