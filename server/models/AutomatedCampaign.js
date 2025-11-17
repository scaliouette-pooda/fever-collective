const mongoose = require('mongoose');

const emailSequenceStepSchema = new mongoose.Schema({
  stepNumber: {
    type: Number,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  delayDays: {
    type: Number,
    default: 0, // Days after trigger or previous step
    min: 0
  },
  delayHours: {
    type: Number,
    default: 0, // Hours after trigger or previous step
    min: 0
  }
});

const automatedCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  triggerType: {
    type: String,
    enum: [
      'new_registration',      // When new user registers
      'class_reminder',        // Before scheduled class
      'inactive_user',         // After X days of inactivity
      'credit_expiring',       // When credits about to expire
      'milestone_achieved',    // After reaching class milestone
      'membership_expiring',   // Before membership ends
      'post_class',            // After attending a class
      'abandoned_booking',     // Started booking but didn't complete
      'classpass_first_visit', // After first ClassPass booking
      'classpass_second_visit',// After second ClassPass booking
      'classpass_hot_lead'     // ClassPass user with 3+ visits, not converted
    ],
    required: true
  },
  triggerConfig: {
    // Configuration specific to trigger type
    daysBeforeEvent: Number,      // For class_reminder, membership_expiring
    hoursBeforeEvent: Number,     // For class_reminder
    inactiveDays: Number,         // For inactive_user
    daysBeforeExpiry: Number      // For credit_expiring, membership_expiring
  },
  emailSequence: [emailSequenceStepSchema],
  targetAudience: {
    membershipTiers: [{
      type: String,
      enum: ['fever-starter', 'fever-enthusiast', 'epidemic', 'all']
    }],
    includeAll: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: false
  },
  stats: {
    totalTriggered: {
      type: Number,
      default: 0
    },
    totalSent: {
      type: Number,
      default: 0
    },
    totalFailed: {
      type: Number,
      default: 0
    },
    lastTriggeredAt: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Track individual sent emails for this campaign
const automatedEmailLogSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutomatedCampaign',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientEmail: {
    type: String,
    required: true
  },
  sequenceStep: {
    type: Number,
    required: true
  },
  triggerData: {
    type: mongoose.Schema.Types.Mixed // Store trigger-specific data
  },
  scheduledFor: {
    type: Date,
    required: true
  },
  sentAt: Date,
  status: {
    type: String,
    enum: ['scheduled', 'sent', 'failed', 'cancelled'],
    default: 'scheduled'
  },
  error: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
automatedEmailLogSchema.index({ campaign: 1, recipient: 1, sequenceStep: 1 });
automatedEmailLogSchema.index({ scheduledFor: 1, status: 1 });
automatedEmailLogSchema.index({ status: 1, sentAt: 1 });

// Update timestamp before saving
automatedCampaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if user should receive this campaign
automatedCampaignSchema.methods.shouldTriggerForUser = function(user, membershipTier) {
  if (!this.isActive) return false;

  if (this.targetAudience.includeAll) return true;

  if (this.targetAudience.membershipTiers.includes('all')) return true;

  return this.targetAudience.membershipTiers.includes(membershipTier);
};

// Method to schedule email sequence for a user
automatedCampaignSchema.methods.scheduleForUser = async function(userId, userEmail, triggerData = {}) {
  const AutomatedEmailLog = mongoose.model('AutomatedEmailLog');

  // Check if already scheduled for this user
  const existing = await AutomatedEmailLog.findOne({
    campaign: this._id,
    recipient: userId,
    status: { $in: ['scheduled', 'sent'] }
  });

  if (existing) {
    console.log(`Campaign ${this.name} already scheduled for user ${userId}`);
    return null;
  }

  const scheduledEmails = [];
  const now = new Date();

  for (const step of this.emailSequence) {
    let scheduledTime = new Date(now);

    // Calculate delay from trigger time
    if (step.delayDays > 0) {
      scheduledTime.setDate(scheduledTime.getDate() + step.delayDays);
    }
    if (step.delayHours > 0) {
      scheduledTime.setHours(scheduledTime.getHours() + step.delayHours);
    }

    const emailLog = new AutomatedEmailLog({
      campaign: this._id,
      recipient: userId,
      recipientEmail: userEmail,
      sequenceStep: step.stepNumber,
      triggerData: triggerData,
      scheduledFor: scheduledTime,
      status: 'scheduled'
    });

    await emailLog.save();
    scheduledEmails.push(emailLog);
  }

  // Update campaign stats
  this.stats.totalTriggered += 1;
  this.stats.lastTriggeredAt = now;
  await this.save();

  return scheduledEmails;
};

const AutomatedCampaign = mongoose.model('AutomatedCampaign', automatedCampaignSchema);
const AutomatedEmailLog = mongoose.model('AutomatedEmailLog', automatedEmailLogSchema);

module.exports = { AutomatedCampaign, AutomatedEmailLog };
