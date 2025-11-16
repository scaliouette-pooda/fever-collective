const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

dns.setServers(['8.8.8.8', '8.8.4.4']);

const { MembershipTier } = require('../models/Membership');

const seedMembershipTiers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing tiers
    await MembershipTier.deleteMany({});
    console.log('Cleared existing membership tiers');

    const tiers = [
      // FOUNDERS TIER 1 (Dec 1 - Max 100)
      {
        name: 'fever-starter',
        displayName: 'The Fever Starter',
        pricingTier: 'founders-1',
        price: 60,
        pricePerClass: 15,
        classesPerMonth: 4,
        isUnlimited: false,
        advanceBookingHours: 48,
        specialtyClassCredits: 2,
        creditExpiration: 2,
        benefits: [
          '4 classes per month',
          '48 hour advance booking',
          'Specialty classes = 2 class credits',
          '2 month credit expiration'
        ],
        founderSlotsTotal: 100,
        founderSlotsUsed: 0,
        releaseDate: new Date('2024-12-01')
      },
      {
        name: 'outbreak',
        displayName: 'The Outbreak',
        pricingTier: 'founders-1',
        price: 80,
        pricePerClass: 10,
        classesPerMonth: 8,
        isUnlimited: false,
        advanceBookingHours: 48,
        specialtyClassCredits: 2,
        creditExpiration: 2,
        benefits: [
          '8 classes per month',
          '48 hour advance booking',
          'Specialty classes = 2 class credits',
          '2 month credit expiration'
        ],
        founderSlotsTotal: 100,
        founderSlotsUsed: 0,
        releaseDate: new Date('2024-12-01')
      },
      {
        name: 'epidemic',
        displayName: 'The Epidemic',
        pricingTier: 'founders-1',
        price: 100,
        pricePerClass: 0,
        classesPerMonth: null,
        isUnlimited: true,
        advanceBookingHours: 72,
        specialtyClassCredits: 0,
        creditExpiration: 12,
        benefits: [
          'Unlimited classes',
          'Priority 72 hour advance booking',
          'Complimentary specialty classes',
          'Complimentary pop-up events',
          'Tote bag included'
        ],
        founderSlotsTotal: 100,
        founderSlotsUsed: 0,
        releaseDate: new Date('2024-12-01')
      },

      // FOUNDERS TIER 2 (Jan 1 - Max 100)
      {
        name: 'fever-starter',
        displayName: 'The Fever Starter',
        pricingTier: 'founders-2',
        price: 80,
        pricePerClass: 20,
        classesPerMonth: 4,
        isUnlimited: false,
        advanceBookingHours: 48,
        specialtyClassCredits: 2,
        creditExpiration: 2,
        benefits: [
          '4 classes per month',
          '48 hour advance booking',
          'Specialty classes = 2 class credits',
          '2 month credit expiration'
        ],
        founderSlotsTotal: 100,
        founderSlotsUsed: 0,
        releaseDate: new Date('2025-01-01')
      },
      {
        name: 'outbreak',
        displayName: 'The Outbreak',
        pricingTier: 'founders-2',
        price: 120,
        pricePerClass: 15,
        classesPerMonth: 8,
        isUnlimited: false,
        advanceBookingHours: 48,
        specialtyClassCredits: 2,
        creditExpiration: 2,
        benefits: [
          '8 classes per month',
          '48 hour advance booking',
          'Specialty classes = 2 class credits',
          '2 month credit expiration'
        ],
        founderSlotsTotal: 100,
        founderSlotsUsed: 0,
        releaseDate: new Date('2025-01-01')
      },
      {
        name: 'epidemic',
        displayName: 'The Epidemic',
        pricingTier: 'founders-2',
        price: 140,
        pricePerClass: 0,
        classesPerMonth: null,
        isUnlimited: true,
        advanceBookingHours: 72,
        specialtyClassCredits: 0,
        creditExpiration: 12,
        benefits: [
          'Unlimited classes',
          'Priority 72 hour advance booking',
          'Complimentary specialty classes',
          'Complimentary pop-up events',
          'Tote bag included'
        ],
        founderSlotsTotal: 100,
        founderSlotsUsed: 0,
        releaseDate: new Date('2025-01-01')
      },

      // GENERAL TIER (Feb 1)
      {
        name: 'fever-starter',
        displayName: 'The Fever Starter',
        pricingTier: 'general',
        price: 100,
        pricePerClass: 25,
        classesPerMonth: 4,
        isUnlimited: false,
        advanceBookingHours: 48,
        specialtyClassCredits: 2,
        creditExpiration: 2,
        benefits: [
          '4 classes per month',
          '48 hour advance booking',
          'Specialty classes = 2 class credits',
          '2 month credit expiration'
        ],
        founderSlotsTotal: null,
        founderSlotsUsed: 0,
        releaseDate: new Date('2025-02-01')
      },
      {
        name: 'outbreak',
        displayName: 'The Outbreak',
        pricingTier: 'general',
        price: 160,
        pricePerClass: 20,
        classesPerMonth: 8,
        isUnlimited: false,
        advanceBookingHours: 48,
        specialtyClassCredits: 2,
        creditExpiration: 2,
        benefits: [
          '8 classes per month',
          '48 hour advance booking',
          'Specialty classes = 2 class credits',
          '2 month credit expiration'
        ],
        founderSlotsTotal: null,
        founderSlotsUsed: 0,
        releaseDate: new Date('2025-02-01')
      },
      {
        name: 'epidemic',
        displayName: 'The Epidemic',
        pricingTier: 'general',
        price: 200,
        pricePerClass: 0,
        classesPerMonth: null,
        isUnlimited: true,
        advanceBookingHours: 72,
        specialtyClassCredits: 0,
        creditExpiration: 12,
        benefits: [
          'Unlimited classes',
          'Priority 72 hour advance booking',
          'Complimentary specialty classes',
          'Complimentary pop-up events',
          'Tote bag included'
        ],
        founderSlotsTotal: null,
        founderSlotsUsed: 0,
        releaseDate: new Date('2025-02-01')
      }
    ];

    await MembershipTier.insertMany(tiers);
    console.log('✅ Membership tiers seeded successfully!');
    console.log(`Created ${tiers.length} membership tiers`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding membership tiers:', error);
    process.exit(1);
  }
};

seedMembershipTiers();
