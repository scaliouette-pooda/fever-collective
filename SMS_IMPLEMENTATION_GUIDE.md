# SMS Implementation Guide - Fever Collective

## ✅ Completed Features

### 1. SMS Service Integration
- **File**: `server/services/smsService.js`
- Twilio integration with full SMS capabilities
- Statistics tracking (sent, failed, cost)
- Settings-based enable/disable
- Daily limit enforcement
- Phone number validation (E.164 format)

### 2. SMS Template Variables System
- **File**: `server/utils/smsTemplates.js`
- Dynamic variable replacement: `{{name}}`, `{{eventTitle}}`, `{{confirmationNumber}}`, etc.
- Pre-built templates for common scenarios
- Character limit handling (160 chars)
- Available variables API

### 3. Settings Model Enhancement
- **File**: `server/models/Settings.js`
- Added `smsConfig` section with:
  - Global enable/disable
  - Notification type toggles
  - Daily limits
  - Cost tracking
- Added `smsStats` section for analytics

### 4. Booking SMS Integration
- **Files**: `server/routes/bookings.js`, `server/models/Booking.js`
- SMS sent on booking confirmation
- SMS sent on payment confirmation
- User opt-in via checkbox in booking form
- `sendSMS` field in Booking model

### 5. Automated Campaign Model
- **File**: `server/models/AutomatedCampaign.js`
- Added `sendSMS` and `smsMessage` fields to email sequences
- SMS tracking fields in AutomatedEmailLog

### 6. Environment Configuration
- Twilio credentials configured in `.env`:
  - TWILIO_ACCOUNT_SID=your_account_sid_here
  - TWILIO_AUTH_TOKEN=your_auth_token_here
  - TWILIO_PHONE_NUMBER=+1234567890

---

## ⚠️ Remaining Work - Implementation Guide

### HIGH PRIORITY

#### 1. SMS Settings UI in Admin Dashboard
**File to Modify**: `client/src/components/AdminDashboard.js`

**What to Add**: New tab "SMS Settings" in admin dashboard

**UI Components Needed**:
```javascript
<div className="sms-settings-section">
  {/* Global Enable/Disable */}
  <label>
    <input
      type="checkbox"
      checked={settings.smsConfig?.enabled}
      onChange={(e) => handleSettingsChange('smsConfig', 'enabled', e.target.checked)}
    />
    Enable SMS Notifications
  </label>

  {/* Connection Status */}
  <div className="twilio-status">
    Status: {twilioConfigured ? '✅ Connected' : '❌ Not Configured'}
  </div>

  {/* Notification Type Toggles */}
  <h3>Notification Types</h3>
  <label><input type="checkbox" /> Booking Confirmations</label>
  <label><input type="checkbox" /> Payment Confirmations</label>
  <label><input type="checkbox" /> Class Reminders</label>
  <label><input type="checkbox" /> Waitlist Notifications</label>
  <label><input type="checkbox" /> Membership Confirmations</label>
  <label><input type="checkbox" /> Low Credits Warnings</label>

  {/* Daily Limit */}
  <label>
    Daily SMS Limit:
    <input type="number" value={settings.smsConfig?.dailyLimit} />
  </label>

  {/* Test SMS */}
  <button onClick={handleTestSMS}>Send Test SMS</button>

  {/* Statistics Display */}
  <div className="sms-stats">
    <h3>Today's Statistics</h3>
    <p>Sent: {settings.smsStats?.todaySent}</p>
    <p>Failed: {settings.smsStats?.totalFailed}</p>
    <p>Cost: ${settings.smsStats?.totalCost.toFixed(2)}</p>
  </div>
</div>
```

**Backend Routes Needed**:
- `POST /api/sms/test` - Send test SMS
- `GET /api/sms/stats` - Get SMS statistics
- `POST /api/sms/reset-daily` - Reset daily counter (cron job)

---

#### 2. Automated Campaigns SMS UI
**File to Modify**: `client/src/components/AutomatedCampaigns.js`

**What to Add**: SMS toggle and textarea for each email sequence step

**Code Example**:
```javascript
{/* In the email sequence map */}
{formData.emailSequence.map((step, index) => (
  <div key={index} className="sequence-step">
    {/* Existing email fields... */}

    {/* NEW: SMS Toggle */}
    <label className="sms-toggle">
      <input
        type="checkbox"
        checked={step.sendSMS || false}
        onChange={(e) => handleSequenceChange(index, 'sendSMS', e.target.checked)}
      />
      Also send as SMS
    </label>

    {/* NEW: SMS Message Field */}
    {step.sendSMS && (
      <div className="sms-message-field">
        <label>SMS Message (160 chars max)</label>
        <textarea
          value={step.smsMessage || ''}
          onChange={(e) => handleSequenceChange(index, 'smsMessage', e.target.value)}
          maxLength={160}
          rows={3}
        />
        <div className="char-count">
          {(step.smsMessage || '').length} / 160 characters
        </div>

        {/* Variable Helper */}
        <div className="variable-helper">
          <p>Available variables:</p>
          <code>{{name}}</code> <code>{{eventTitle}}</code> <code>{{eventDate}}</code>
        </div>
      </div>
    )}
  </div>
))}
```

---

#### 3. SMS Scheduler Service
**File to Create**: `server/services/smsScheduler.js`

**Purpose**: Process scheduled SMS from automated campaigns

**Code Structure**:
```javascript
const { AutomatedEmailLog } = require('../models/AutomatedCampaign');
const { sendSMS } = require('./smsService');
const { replaceVariables } = require('../utils/smsTemplates');

/**
 * Process scheduled SMS messages
 * Called by cron job every 5 minutes
 */
const processScheduledSMS = async () => {
  try {
    const now = new Date();

    // Find SMS that need to be sent
    const pendingSMS = await AutomatedEmailLog.find({
      scheduledFor: { $lte: now },
      smsStatus: 'not_sent',
      'campaign.emailSequence.sendSMS': true
    }).populate('campaign recipient');

    for (const log of pendingSMS) {
      const step = log.campaign.emailSequence.find(s => s.stepNumber === log.sequenceStep);

      if (step && step.sendSMS && step.smsMessage) {
        // Replace variables
        const message = replaceVariables(step.smsMessage, log.triggerData);

        // Send SMS
        const result = await sendSMS(log.recipient.phone, message);

        // Update log
        if (result.success) {
          log.smsSent = true;
          log.smsSentAt = new Date();
          log.smsStatus = 'sent';
        } else {
          log.smsStatus = 'failed';
          log.smsError = result.error;
        }

        await log.save();
      }
    }
  } catch (error) {
    console.error('Error processing scheduled SMS:', error);
  }
};

// Initialize cron job
const initializeSMSScheduler = () => {
  setInterval(processScheduledSMS, 5 * 60 * 1000); // Every 5 minutes
  console.log('✅ SMS Scheduler initialized');
};

module.exports = { initializeSMSScheduler, processScheduledSMS };
```

**Add to server.js**:
```javascript
const { initializeSMSScheduler } = require('./services/smsScheduler');

mongoose.connect(...)
  .then(() => {
    // ... existing initializations
    initializeSMSScheduler();
  });
```

---

### MEDIUM PRIORITY

#### 4. User SMS Preferences
**File to Modify**: `client/src/components/Profile.js`

**What to Add**:
```javascript
<div className="sms-preferences">
  <h3>SMS Notifications</h3>
  <label>
    <input
      type="checkbox"
      checked={profileData.smsPreferences?.enabled}
      onChange={handleSMSToggle}
    />
    Receive SMS notifications
  </label>

  {profileData.smsPreferences?.enabled && (
    <>
      <label><input type="checkbox" /> Booking confirmations</label>
      <label><input type="checkbox" /> Class reminders</label>
      <label><input type="checkbox" /> Promotional messages</label>
    </>
  )}
</div>
```

**Update User Model**:
```javascript
smsPreferences: {
  enabled: { type: Boolean, default: true },
  bookingConfirmations: { type: Boolean, default: true },
  reminders: { type: Boolean, default: true },
  promotional: { type: Boolean, default: false }
}
```

---

#### 5. SMS Analytics Dashboard
**File to Modify**: `client/src/components/AdminDashboard.js`

**What to Add**: New analytics section in dashboard

**Metrics to Display**:
- Total SMS sent (today/week/month)
- Delivery success rate
- Failed SMS with reasons
- Cost tracking graph
- Most active phone numbers
- SMS sent by campaign type
- Opt-out rate

**Chart Example**:
```javascript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

<div className="sms-analytics">
  <h2>SMS Analytics</h2>

  <div className="metrics-grid">
    <div className="metric-card">
      <h3>Today</h3>
      <p className="metric-value">{smsStats.todaySent}</p>
      <p className="metric-label">SMS Sent</p>
    </div>

    <div className="metric-card">
      <h3>Success Rate</h3>
      <p className="metric-value">
        {((smsStats.totalSent / (smsStats.totalSent + smsStats.totalFailed)) * 100).toFixed(1)}%
      </p>
    </div>

    <div className="metric-card">
      <h3>Total Cost</h3>
      <p className="metric-value">${smsStats.totalCost.toFixed(2)}</p>
    </div>
  </div>

  <LineChart width={600} height={300} data={smsHistory}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="sent" stroke="#8884d8" />
  </LineChart>
</div>
```

---

#### 6. Bulk SMS Campaign Tool
**File to Modify**: `client/src/components/AdminDashboard.js`

**What to Add**: New section for bulk SMS

**UI Components**:
```javascript
<div className="bulk-sms-tool">
  <h2>Send Bulk SMS</h2>

  {/* Recipient Selection */}
  <div className="recipient-selection">
    <h3>Select Recipients</h3>
    <label><input type="radio" name="recipients" /> All Users</label>
    <label><input type="radio" name="recipients" /> Active Members</label>
    <label><input type="radio" name="recipients" /> Specific Tier</label>
    <label><input type="radio" name="recipients" /> Custom List</label>
  </div>

  {/* Message Composer */}
  <div className="message-composer">
    <h3>Compose Message</h3>
    <textarea
      value={bulkMessage}
      onChange={(e) => setBulkMessage(e.target.value)}
      maxLength={160}
    />
    <p>{bulkMessage.length} / 160 characters</p>

    {/* Variables */}
    <div className="variable-buttons">
      <button onClick={() => insertVariable('{{name}}')}>Insert Name</button>
      <button onClick={() => insertVariable('{{firstName}}')}>Insert First Name</button>
    </div>
  </div>

  {/* Preview */}
  <div className="preview">
    <h3>Preview</h3>
    <p>Recipients: {selectedRecipients.length}</p>
    <p>Estimated Cost: ${(selectedRecipients.length * 0.0075).toFixed(2)}</p>
  </div>

  {/* Actions */}
  <button onClick={handleSendTestSMS}>Send Test</button>
  <button onClick={handleSendBulkSMS}>Send to All ({selectedRecipients.length})</button>
</div>
```

**Backend Route**:
```javascript
// POST /api/sms/bulk
router.post('/bulk', authenticateUser, requireAdmin, async (req, res) => {
  const { recipientFilter, message } = req.body;

  // Get recipients based on filter
  let recipients = await User.find(recipientFilter).select('phone name');

  // Filter out users who opted out
  recipients = recipients.filter(u => u.smsPreferences?.enabled);

  // Send bulk SMS
  const { sendBulkSMS } = require('../services/smsService');
  const phones = recipients.map(r => r.phone);
  const result = await sendBulkSMS(phones, message);

  res.json(result);
});
```

---

### LOW PRIORITY

#### 7. SMS Opt-out Automation
**File to Create**: `server/routes/smsWebhook.js`

**Purpose**: Handle STOP/unsubscribe keywords from Twilio

**Implementation**:
```javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Twilio webhook for incoming SMS
router.post('/incoming', async (req, res) => {
  const { From, Body } = req.body;
  const message = Body.trim().toUpperCase();

  if (message === 'STOP' || message === 'UNSUBSCRIBE') {
    // Find user by phone and disable SMS
    const user = await User.findOne({ phone: From });
    if (user) {
      user.smsPreferences.enabled = false;
      await user.save();
      console.log(`User ${user.email} opted out of SMS`);
    }

    // Twilio expects TwiML response
    res.type('text/xml');
    res.send('<Response></Response>');
  } else if (message === 'START') {
    // Re-enable SMS
    const user = await User.findOne({ phone: From });
    if (user) {
      user.smsPreferences.enabled = true;
      await user.save();
    }

    res.type('text/xml');
    res.send('<Response><Message>You have been re-subscribed to SMS notifications from Fever Studio.</Message></Response>');
  }
});

module.exports = router;
```

**Configure Twilio Webhook**:
1. Go to Twilio Console → Phone Numbers
2. Select your number
3. Set "A MESSAGE COMES IN" webhook to: `https://yourapp.com/api/sms/webhook/incoming`

---

## Testing Checklist

### Before Going Live:
- [ ] Test SMS sending with valid phone number
- [ ] Test invalid phone number handling
- [ ] Test daily limit enforcement
- [ ] Test booking SMS opt-in/opt-out
- [ ] Test template variable replacement
- [ ] Test automated campaign SMS
- [ ] Test bulk SMS sending
- [ ] Test STOP/START keywords
- [ ] Verify statistics tracking
- [ ] Check Twilio balance

### User Acceptance Testing:
- [ ] User books class → receives SMS confirmation
- [ ] Admin approves payment → user receives SMS
- [ ] User opts out → no more SMS received
- [ ] User receives reminder 24hrs before class
- [ ] Membership purchase → SMS confirmation
- [ ] Credits low → warning SMS sent

---

## Cost Estimation

**Twilio Pricing** (as of 2025):
- SMS to US: $0.0075 per message
- SMS from US: $1.15/month per phone number

**Monthly Cost Example**:
- 1000 SMS/month = $7.50
- Phone number = $1.15
- **Total**: ~$8.65/month for 1000 messages

**Daily Limit Recommendations**:
- Development: 100 SMS/day
- Production: 1000 SMS/day
- Monitor costs weekly

---

## Compliance & Best Practices

### Legal Requirements:
1. **Obtain Consent**: Users must opt-in to receive SMS
2. **Include Opt-out**: All messages should include "Reply STOP to unsubscribe"
3. **Identify Sender**: Include business name in messages
4. **Respect Time Zones**: Don't send SMS late at night

### Best Practices:
- Keep messages under 160 characters
- Use templates consistently
- Personalize with variables
- Track opt-outs carefully
- Monitor delivery rates
- Test before bulk sending

---

## Troubleshooting

### SMS Not Sending:
1. Check Twilio credentials in `.env`
2. Verify phone number format (+1XXXXXXXXXX)
3. Check daily limit not exceeded
4. Verify SMS enabled in settings
5. Check Twilio account balance

### Phone Number Validation Issues:
- Use `formatPhoneNumber()` utility
- Ensure E.164 format
- Test with different formats

### Statistics Not Updating:
- Check `updateSMSStats()` is called
- Verify Settings model has smsStats
- Check for database connection issues

---

## Next Steps

1. **Immediate**: Build SMS Settings UI in Admin Dashboard
2. **Week 1**: Implement Automated Campaigns SMS UI
3. **Week 2**: Create SMS Scheduler Service
4. **Week 3**: Add User SMS Preferences
5. **Week 4**: Build Analytics Dashboard & Bulk SMS Tool

Each component can be built incrementally and tested independently.
