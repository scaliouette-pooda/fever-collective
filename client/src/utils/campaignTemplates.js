// Pre-defined campaign templates for quick setup

export const CAMPAIGN_TEMPLATES = {
  'post-event-followup': {
    name: 'Post-Event Follow-Up',
    description: 'Sent 24 hours after event completion. Thanks attendees and offers 20% discount code (COMEBACK20) valid for 48 hours.',
    triggerType: 'post_class',
    triggerConfig: {
      delayHours: 24
    },
    emailSequence: [
      {
        subject: 'Thanks for joining us at {{eventTitle}}!',
        message: `Hi {{userName}},

Thank you for attending {{eventTitle}} on {{eventDate}}! We hope you had an amazing experience.

As a token of our appreciation, here's an exclusive offer just for you:

🎁 Use code COMEBACK20 for 20% off your next booking!
⏰ Valid for the next 48 hours

Check out our upcoming events and book your next experience:
{{upcomingEvents}}

We'd love to hear about your experience! If you have a moment, please leave us a review.

See you soon!
The Fever Studio Team`,
        delayDays: 0,
        delayHours: 0
      }
    ],
    targetAudience: {
      includeAll: true,
      membershipTiers: []
    },
    isActive: false
  },

  'win-back': {
    name: 'Win-Back Campaign',
    description: 'Targets inactive users (30-60 days). Offers 30% discount (WELCOME30) valid for 7 days to re-engage customers.',
    triggerType: 'inactive_user',
    triggerConfig: {
      inactiveDays: 30
    },
    emailSequence: [
      {
        subject: 'We miss you, {{userName}}! Here\'s 30% off to welcome you back',
        message: `Hi {{userName}},

We noticed it's been a while since your last visit to The Fever Studio, and we miss you!

A lot has happened since you were last here, and we'd love to have you back:

✨ New classes and experiences
🎉 Fresh events and workshops
👥 A growing community of amazing people

To make your return extra special, we're offering you:

🎁 30% OFF your next booking with code WELCOME30
⏰ Valid for the next 7 days

Here's what's coming up:
{{upcomingEvents}}

Don't let this opportunity pass you by! Book now and rediscover what you've been missing.

Hope to see you soon!
The Fever Studio Team`,
        delayDays: 0,
        delayHours: 0
      }
    ],
    targetAudience: {
      includeAll: true,
      membershipTiers: []
    },
    isActive: false
  },

  'birthday-special': {
    name: 'Birthday Special',
    description: 'Celebrates user birthdays with free class or 50% off code (BDAYxxxx) valid for entire birthday month.',
    triggerType: 'milestone_achieved',
    triggerConfig: {},
    emailSequence: [
      {
        subject: '🎂 Happy Birthday {{userName}}! Here\'s a special gift for you',
        message: `Happy Birthday {{userName}}! 🎉🎂✨

The entire Fever Studio family wishes you the most amazing birthday!

To celebrate YOUR special day, we have a birthday gift for you:

🎁 50% OFF any class this month with your personal code: BDAY{{membershipNumber}}
🎂 Valid for your entire birthday month
💝 Use it on any of our classes or events

Here are some popular classes to consider:
{{upcomingEvents}}

This is your month to shine! Treat yourself to an unforgettable experience.

Make your birthday month special - book your class today!

Warmest birthday wishes,
The Fever Studio Team

P.S. - Feel free to bring friends along to celebrate! 🥳`,
        delayDays: 0,
        delayHours: 0
      }
    ],
    targetAudience: {
      includeAll: true,
      membershipTiers: []
    },
    isActive: false
  },

  'abandoned-booking': {
    name: 'Abandoned Booking Reminder',
    description: 'Reminds users about incomplete bookings. Offers 10% discount (COMPLETE10) valid for 24 hours to encourage completion.',
    triggerType: 'abandoned_booking',
    triggerConfig: {
      delayHours: 2
    },
    emailSequence: [
      {
        subject: 'Don\'t miss out on {{eventTitle}}! Complete your booking now',
        message: `Hi {{userName}},

We noticed you started booking {{eventTitle}} but didn't complete your reservation.

📅 Event: {{eventTitle}}
📍 Date: {{eventDate}} at {{eventTime}}
⏰ Spots are filling up fast!

Don't let this opportunity slip away! To help you complete your booking, here's a special offer:

🎁 Use code COMPLETE10 for 10% off
⏰ Valid for the next 24 hours only

This class is popular and spaces are limited. Secure your spot before it's too late!

[Complete My Booking]

Questions? Just reply to this email and we'll be happy to help.

See you soon!
The Fever Studio Team

P.S. - This discount expires in 24 hours, so don't wait!`,
        delayDays: 0,
        delayHours: 0
      }
    ],
    targetAudience: {
      includeAll: true,
      membershipTiers: []
    },
    isActive: false
  },

  'class-reminder': {
    name: 'Class Reminder (24 Hours Before)',
    description: 'Reminds attendees about their upcoming class 24 hours in advance with event details and preparation tips.',
    triggerType: 'class_reminder',
    triggerConfig: {
      hoursBeforeEvent: 24
    },
    emailSequence: [
      {
        subject: 'Reminder: {{eventTitle}} is tomorrow!',
        message: `Hi {{userName}},

This is a friendly reminder that your class is coming up soon!

📅 Event: {{eventTitle}}
📍 Date: {{eventDate}}
🕐 Time: {{eventTime}}
📍 Location: The Fever Studio

What to bring:
• Comfortable clothing
• Water bottle
• Positive energy!

We're excited to see you tomorrow. If you need to make any changes to your booking or have questions, please let us know.

See you soon!
The Fever Studio Team`,
        delayDays: 0,
        delayHours: 0
      }
    ],
    targetAudience: {
      includeAll: true,
      membershipTiers: []
    },
    isActive: false
  },

  'new-registration': {
    name: 'Welcome Series (New Member)',
    description: 'Multi-step welcome series for new members. Introduces the studio, provides getting started tips, and offers first-booking incentive.',
    triggerType: 'new_registration',
    triggerConfig: {},
    emailSequence: [
      {
        subject: 'Welcome to The Fever Studio, {{userName}}! 🎉',
        message: `Hi {{userName}},

Welcome to The Fever Studio family! We're thrilled to have you join our community.

You're now part of a vibrant community of creators, learners, and experience-seekers. Here's what you can look forward to:

✨ Exclusive classes and workshops
🎨 Unique creative experiences
👥 An amazing community
🎁 Member-only perks and discounts

Ready to book your first experience? Here's what's coming up:
{{upcomingEvents}}

🎁 SPECIAL OFFER: Use code WELCOME10 for 10% off your first booking!

Questions? Just reply to this email - we're here to help!

Looking forward to meeting you,
The Fever Studio Team`,
        delayDays: 0,
        delayHours: 0
      },
      {
        subject: 'Getting Started at The Fever Studio',
        message: `Hi {{userName}},

Hope you're settling in! Here are some tips to make the most of your Fever Studio membership:

📱 Bookmark your profile page for easy access
🔔 Check your email for class updates and exclusive offers
💳 Credits never expire - book with confidence
⭐ Leave reviews to help others discover great experiences

Haven't booked your first class yet? Here's what's popular this week:
{{upcomingEvents}}

Remember, you can use code WELCOME10 for 10% off!

See you soon!
The Fever Studio Team`,
        delayDays: 3,
        delayHours: 0
      }
    ],
    targetAudience: {
      includeAll: true,
      membershipTiers: []
    },
    isActive: false
  },

  'membership-expiring': {
    name: 'Membership Expiring Soon',
    description: 'Notifies members when their membership is about to expire (7 days before) with renewal options.',
    triggerType: 'membership_expiring',
    triggerConfig: {
      daysBeforeExpiry: 7
    },
    emailSequence: [
      {
        subject: 'Your Fever Studio membership expires in 7 days',
        message: `Hi {{userName}},

Just a heads up - your Fever Studio membership will expire in 7 days.

Current Membership: {{membershipTier}}
Expiration Date: {{expiryDate}}

Don't lose access to:
✨ Your membership benefits
💳 Your unused credits ({{creditsRemaining}} remaining)
🎁 Exclusive member discounts
👥 Priority booking

Renew now to continue enjoying all your member perks!

[Renew My Membership]

Questions about renewal? We're here to help - just reply to this email.

Thanks for being part of The Fever Studio family!
The Fever Studio Team`,
        delayDays: 0,
        delayHours: 0
      }
    ],
    targetAudience: {
      includeAll: true,
      membershipTiers: []
    },
    isActive: false
  },

  'credits-expiring': {
    name: 'Credits Expiring Soon',
    description: 'Reminds members about expiring credits (30 days before expiration) to encourage booking.',
    triggerType: 'credit_expiring',
    triggerConfig: {
      daysBeforeExpiry: 30
    },
    emailSequence: [
      {
        subject: 'Use your credits before they expire! 💳',
        message: `Hi {{userName}},

Your Fever Studio credits are expiring soon!

💳 Credits expiring: \${{expiringCredits}}
📅 Expiration date: {{expiryDate}}
⏰ That's just {{daysUntilExpiry}} days away!

Don't let your credits go to waste! Here are some amazing experiences you can book right now:
{{upcomingEvents}}

[Browse All Classes]

Need help choosing? Reply to this email and we'll help you find the perfect experience.

Book now and make the most of your credits!
The Fever Studio Team`,
        delayDays: 0,
        delayHours: 0
      }
    ],
    targetAudience: {
      includeAll: true,
      membershipTiers: []
    },
    isActive: false
  }
};

// Helper function to get template by key
export const getTemplate = (templateKey) => {
  return CAMPAIGN_TEMPLATES[templateKey] || null;
};

// Helper function to get all template options for dropdown
export const getTemplateOptions = () => {
  return [
    { value: '', label: 'Custom Campaign (Start from scratch)' },
    { value: 'new-registration', label: '👋 Welcome Series (New Member)' },
    { value: 'post-event-followup', label: '💌 Post-Event Follow-Up' },
    { value: 'win-back', label: '🎯 Win-Back Campaign' },
    { value: 'birthday-special', label: '🎂 Birthday Special' },
    { value: 'abandoned-booking', label: '⏰ Abandoned Booking Reminder' },
    { value: 'class-reminder', label: '🔔 Class Reminder (24h Before)' },
    { value: 'membership-expiring', label: '⚠️ Membership Expiring Soon' },
    { value: 'credits-expiring', label: '💳 Credits Expiring Soon' }
  ];
};
