const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { AutomatedCampaign } = require('../models/AutomatedCampaign');
const User = require('../models/User');

dotenv.config();

const classPassCampaigns = [
  {
    name: 'ClassPass - First Visit Welcome',
    description: 'Welcome email sent after a customer\'s first ClassPass booking. Introduces them to the studio, highlights benefits, and encourages them to return.',
    triggerType: 'classpass_first_visit',
    triggerConfig: {},
    emailSequence: [
      {
        stepNumber: 1,
        subject: 'Welcome to Fever! 🔥 Thanks for Your First Visit',
        message: `Hi {{userName}},

Thank you for choosing Fever for your first visit through ClassPass! We're thrilled to have you in our community.

**What Makes Fever Special:**
• 🔥 Heated Mat Pilates in a boutique setting
• 🎵 Music-driven, high-energy workouts
• 💪 Expert instructors focused on your success
• 🏠 Welcoming community that feels like family

**Your Recent Class:**
Class: {{eventTitle}}
Date: {{eventDate}}

We hope you felt the heat and loved the experience!

**Want to Make Fever Your Home Studio?**
As a ClassPass user, you get exclusive perks when you become a member:
• Unlimited or credits-based options
• Priority booking for popular classes
• Member-only workshops and events
• Special pricing - ask us about our ClassPass conversion discount!

**Book Your Next Class:**
Keep your momentum going! Browse our schedule and book your next sweat session: [Schedule Link]

Have questions? Reply to this email or text us at {{studioPhone}}

See you on the mat soon!

The Fever Team
{{studioEmail}}
{{studioWebsite}}`,
        delayDays: 0,
        delayHours: 2 // Send 2 hours after first booking
      }
    ],
    targetAudience: {
      includeAll: true,
      membershipTiers: ['all']
    },
    isActive: false // Admin needs to activate
  },

  {
    name: 'ClassPass - Second Visit Nurture',
    description: 'Nurture email sent after a customer\'s second ClassPass visit. Celebrates their return, emphasizes community, and introduces membership benefits.',
    triggerType: 'classpass_second_visit',
    triggerConfig: {},
    emailSequence: [
      {
        stepNumber: 1,
        subject: 'You\'re Back! 🎉 Let\'s Talk About Your Fever Journey',
        message: `Hey {{userName}},

We noticed you came back for a second class - that's awesome! 🙌

**Your Fever Journey So Far:**
• First Visit: {{firstClassDate}}
• Second Visit: {{eventDate}}
• Total Classes: 2

You're officially part of the Fever family now! Most people who take 2+ classes end up making Fever their regular workout home.

**Why Our Members Love Fever:**
"I tried Fever through ClassPass and never left. The instructors are incredible and the heated room makes such a difference!" - Sarah, Epidemic Member

"Best decision I made was switching from ClassPass to membership. Unlimited classes changed my life." - Mike, Fever Member

**Special Offer Just For You:**
Since you've experienced Fever twice, we want to make it easy for you to join as a full member:

✨ **ClassPass Conversion Special:** 15% off your first month of membership
✨ **No commitment required** - try it for a month!
✨ **Keep your favorite class times** with priority booking

**Our Membership Options:**
• Fever Starter: 4 classes/month - \\$99
• Outbreak: 8 classes/month - \\$169
• Epidemic: Unlimited classes - \\$199

[View Full Membership Details]

Want to chat about which plan is right for you? Reply to this email or schedule a quick call: [Calendar Link]

Your next class is calling! 🔥

Warmly,
The Fever Team
{{studioEmail}}
{{studioPhone}}`,
        delayDays: 1,
        delayHours: 0 // Send 1 day after second visit
      }
    ],
    targetAudience: {
      includeAll: true,
      membershipTiers: ['all']
    },
    isActive: false
  },

  {
    name: 'ClassPass - Hot Lead Conversion',
    description: 'Conversion-focused email for ClassPass users with 3+ visits who haven\'t converted. Includes strong membership offer and urgency.',
    triggerType: 'classpass_hot_lead',
    triggerConfig: {},
    emailSequence: [
      {
        stepNumber: 1,
        subject: '🔥 {{userName}}, You\'re a Fever Regular! Special Member Pricing Inside',
        message: '{{userName}},\n\n' +
          'We see you! 👀\n\n' +
          'You\'ve taken {{bookingCount}} classes at Fever, and we absolutely love having you in our community. You\'re basically a regular already!\n\n' +
          '**Here\'s What We Notice About Our Best Members:**\n' +
          'They started just like you - coming in through ClassPass, falling in love with the heated mat Pilates experience, and eventually making Fever their home studio.\n\n' +
          '**The Math is Simple:**\n' +
          '• Your {{bookingCount}} ClassPass visits = ${{classPassTotal}}+ in ClassPass credits\n' +
          '• Epidemic Membership (Unlimited) = $199/month\n\n' +
          'If you take just 7 classes per month with membership, you\'re already saving money - plus you get:\n' +
          '✅ Priority booking (never miss your favorite instructor!)\n' +
          '✅ Member-only workshops\n' +
          '✅ Exclusive community events\n' +
          '✅ Bring-a-friend passes\n' +
          '✅ Discounts on retail & workshops\n\n' +
          '**EXCLUSIVE OFFER FOR YOU:**\n' +
          'Since you\'re already part of the family, we\'re offering you:\n\n' +
          '🎁 **First Month: 20% OFF + FREE Fever Water Bottle ($25 value)**\n' +
          '🎁 **Switch anytime** - No long-term contract\n' +
          '🎁 **Try it for 30 days** and if it\'s not right, we\'ll help you find what works\n\n' +
          '[Claim Your Member Discount - Expires in 7 Days]\n\n' +
          '**From Our Community Manager:**\n' +
          '"{{userName}}, we\'ve loved watching you progress in class! You clearly know what you want in a workout. Let\'s chat about making your Fever experience even better as a member. Coffee on us?" - [Schedule 15-min Chat]\n\n' +
          'You\'ve got {{daysInWindow}} days left in your conversion window for this special pricing. After that, it\'s back to regular rates.\n\n' +
          'Questions? Just reply to this email!\n\n' +
          'Keep bringing that fire! 🔥\n\n' +
          '[Your Name]\n' +
          'Studio Manager, Fever\n' +
          '{{studioEmail}}\n' +
          '{{studioPhone}}\n\n' +
          'P.S. Spots in our most popular classes (looking at you, 6pm Monday!) fill up fast for members. Don\'t miss out!',
        delayDays: 0,
        delayHours: 12 // Send 12 hours after 3rd visit
      },
      {
        stepNumber: 2,
        subject: 'Reminder: Your Fever Member Discount Expires Soon',
        message: 'Hi {{userName}},\n\n' +
          'Just a friendly reminder that your exclusive 20% off membership offer expires in 3 days!\n\n' +
          '**Your Offer:**\n' +
          '• 20% off first month\n' +
          '• FREE Fever water bottle ($25 value)\n' +
          '• No long-term commitment\n\n' +
          '**Quick Stats:**\n' +
          'You\'ve taken {{bookingCount}} classes at Fever. Our members at your activity level save an average of $150/month compared to ClassPass.\n\n' +
          '[Claim Your Discount Before It Expires]\n\n' +
          'Still deciding? Reply with any questions!\n\n' +
          'The Fever Team',
        delayDays: 4,
        delayHours: 0 // Send 4 days after first email (3 days before expiry)
      }
    ],
    targetAudience: {
      includeAll: true,
      membershipTiers: ['all']
    },
    isActive: false
  }
];

async function seedClassPassCampaigns() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Find an admin user to set as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log(`📧 Seeding ${classPassCampaigns.length} ClassPass email campaigns...`);

    for (const campaignData of classPassCampaigns) {
      // Check if campaign already exists
      const existing = await AutomatedCampaign.findOne({ name: campaignData.name });

      if (existing) {
        console.log(`⏭️  Skipping "${campaignData.name}" - already exists`);
        continue;
      }

      // Create new campaign
      const campaign = new AutomatedCampaign({
        ...campaignData,
        createdBy: adminUser._id
      });

      await campaign.save();
      console.log(`✅ Created "${campaignData.name}"`);
    }

    console.log('\n🎉 ClassPass campaigns seeded successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Go to Admin Dashboard → Automated Campaigns');
    console.log('2. Review each ClassPass campaign');
    console.log('3. Customize the email content with your studio details');
    console.log('4. Activate the campaigns you want to use');
    console.log('\n⚠️  Note: Campaigns are inactive by default. Activate them when ready!');

  } catch (error) {
    console.error('❌ Error seeding ClassPass campaigns:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the seeding
seedClassPassCampaigns();
