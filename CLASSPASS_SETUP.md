# ClassPass Integration Setup Guide

## 📋 Overview

This guide will help you set up and activate the complete ClassPass integration system for The Fever Studio. The integration includes:

- ✅ Booking source tracking
- ✅ Customer acquisition analytics
- ✅ Conversion funnel tracking
- ✅ Automated email nurture campaigns
- ✅ Hot leads identification
- ✅ Revenue analytics and ROI tracking

---

## 🚀 Quick Start (5 Steps)

### Step 1: Enable ClassPass Integration

1. Go to **Admin Dashboard** → **Settings** tab
2. Scroll to **ClassPass Integration** section
3. Check ✅ **Enable ClassPass Integration**
4. Configure settings:
   - ✅ Auto-tag ClassPass users in email system
   - ✅ Track ClassPass to member conversions
   - **Conversion Goal**: 30 days (recommended)
   - **Default Payout Rate**: $22 (adjust based on your actual ClassPass payout)
5. Click **Save All Settings**

### Step 2: Seed Email Campaigns

Open terminal in the `server` directory and run:

```bash
cd server
node scripts/seedClassPassCampaigns.js
```

This will create 3 pre-written email campaigns:
- ClassPass - First Visit Welcome
- ClassPass - Second Visit Nurture
- ClassPass - Hot Lead Conversion

### Step 3: Customize Email Templates

1. Go to **Admin Dashboard** → **Automated Campaigns** tab
2. Find the ClassPass campaigns (look for 🔵 ClassPass badge)
3. Click **Edit** on each campaign
4. Customize the content:

#### Required Replacements:
- `[Schedule Link]` → Your actual booking page URL
- `[Calendar Link]` → Your scheduling/calendar link (Calendly, etc.)
- `[View Full Membership Details]` → Link to your membership page
- `[Claim Your Member Discount]` → Link to membership signup with discount code

#### Optional Customizations:
- Adjust pricing if your membership tiers differ
- Change discount percentages (currently 15% and 20%)
- Personalize the tone/voice
- Update contact information

5. Save each campaign

### Step 4: Activate Email Campaigns

1. Review each campaign carefully
2. Test with a sample booking first (see Testing section)
3. Toggle **Active** switch to ON for each campaign
4. Campaigns will now trigger automatically!

### Step 5: View Analytics

1. Go to **Admin Dashboard** → **ClassPass** tab (blue indicator dot)
2. Monitor:
   - Total bookings and revenue
   - Conversion rate
   - Hot leads (users with 2+ visits)
   - Recent ClassPass activity

---

## 📊 How It Works

### Automatic Tracking

When a ClassPass booking is created (with `bookingSource: 'classpass'`):

1. **Booking tracked** with source, payout amount, ClassPass booking ID
2. **User tagged** in email system with "classpass" tag
3. **User acquisition data** updated:
   - First ClassPass booking date recorded
   - Booking count incremented
   - Acquisition source set to "classpass"

### Email Campaign Triggers

Emails are automatically sent based on visit count:

| Visit # | Timing | Campaign | Goal |
|---------|--------|----------|------|
| 1st | 2 hours after booking | Welcome Email | Introduce studio, encourage return |
| 2nd | 1 day after booking | Nurture Email | Build relationship, 15% discount offer |
| 3rd+ | 12 hours after booking | Hot Lead Email | Strong conversion push, 20% off + gift |
| - | 4 days after 3rd | Reminder Email | Urgency reminder, offer expiring |

### Conversion Tracking

When a ClassPass user becomes a member:

1. **Manual**: Admin clicks "Mark Converted" in Hot Leads table
2. **Automatic**: System detects membership purchase and updates user
3. **Analytics**: Conversion rate automatically recalculated

---

## 🎯 Using the ClassPass Analytics Dashboard

### Key Metrics

**Total Bookings**: Total ClassPass bookings (completed + pending)

**Total Revenue**: Revenue earned from ClassPass (uses actual payout or default rate)

**Total Users**: Unique ClassPass customers

**Conversion Rate**: % of ClassPass users who became members

**Avg Bookings/User**: Average number of visits per ClassPass customer

### Hot Leads Table

Shows ClassPass users with 2+ visits who haven't converted yet.

**Columns**:
- Name & Email
- Booking Count (2, 3, 4, etc.)
- Days Since First Visit
- Action: "Mark Converted" button

**Best Practice**: Reach out personally to hot leads with 3+ bookings!

### Recent Activity

Last 10 ClassPass bookings showing:
- Customer info
- Class booked
- Payout amount
- Status (completed/pending)
- Date

---

## 🔧 Advanced Configuration

### Environment Variables

Add to your `.env` file:

```env
# ClassPass Email Customization
STUDIO_PHONE="+1 (555) 123-4567"
STUDIO_EMAIL="info@thefeverstudio.com"
STUDIO_WEBSITE="https://thefeverstudio.com"

# Email Service (SendGrid or SMTP)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
SMTP_FROM="The Fever Studio <info@thefeverstudio.com>"
```

### Customizing Conversion Window

The default conversion tracking window is 30 days. To change:

1. Go to **Settings** → **ClassPass Integration**
2. Update **Conversion Goal (Days)** field
3. Save settings

This affects:
- Hot lead email urgency messaging
- Analytics conversion tracking period
- Offer expiration timing

### Adjusting Email Timing

To change when emails are sent:

1. Go to **Automated Campaigns**
2. Edit the campaign
3. Modify **Delay Days** and **Delay Hours** for each step
4. Save changes

**Recommended timings**:
- First visit: 2-6 hours (strike while iron is hot!)
- Second visit: 1-2 days (let them process)
- Third visit: 6-24 hours (urgency!)
- Reminder: 3-5 days after first hot lead email

### Custom Discount Codes

To implement actual discount codes:

1. Go to **Promo Codes** tab
2. Create codes matching your email offers:
   - `CLASSPASS15` - 15% off (2nd visit email)
   - `CLASSPASS20` - 20% off (hot lead email)
3. Set appropriate restrictions:
   - One-time use per user
   - 30-day expiration
   - Minimum purchase (if desired)

---

## 🧪 Testing the Integration

### Test ClassPass Booking Flow

1. **Create Test Booking**:
   ```javascript
   POST /api/bookings
   {
     "eventId": "...",
     "name": "Test User",
     "email": "test@example.com",
     "phone": "5555555555",
     "spots": 1,
     "paymentMethod": "venmo",
     "bookingSource": "classpass",
     "classPassBookingId": "CP-TEST-001",
     "classPassPayout": 25.00
   }
   ```

2. **Verify Tracking**:
   - Check **Bookings** tab → Source column shows "ClassPass"
   - Check **ClassPass Analytics** → Booking count increased
   - Check user record → `acquisitionSource: 'classpass'`

3. **Check Email Scheduling**:
   - Email should be scheduled for 2 hours after booking
   - Check email logs in Automated Campaigns
   - Status should be "scheduled"

4. **Test Email Sending** (optional):
   - Wait 2 hours OR manually trigger: `node services/emailScheduler.js`
   - Check email received
   - Verify placeholders replaced correctly

### Test Second Visit

1. Create another booking for same user with `bookingSource: 'classpass'`
2. Verify user's `classPassBookingCount` = 2
3. Check nurture email scheduled for 1 day later

### Test Hot Lead

1. Create third booking for same user
2. Verify user appears in **Hot Leads** table
3. Check hot lead email sequence scheduled (2 emails)
4. Test "Mark Converted" button

---

## 📈 Optimization Tips

### Email Performance

**Monitor These Metrics**:
- Open rate (target: 35-45%)
- Click rate (target: 10-20%)
- Conversion rate (target: 15-25% for hot leads)

**If Open Rates Low**:
- Test different subject lines
- Send at different times (evening vs. morning)
- Personalize subject lines more

**If Click Rates Low**:
- Make CTAs more prominent
- Add urgency/scarcity
- Simplify the offer

**If Conversion Rates Low**:
- Increase discount percentage
- Add more social proof
- Make booking process easier
- Add personal outreach for hot leads

### Conversion Strategy

**Week 1-2**: Observe patterns
- How many ClassPass users book 2+ times?
- What's the average time between visits?
- Which classes do they prefer?

**Week 3-4**: Optimize emails
- Adjust timing based on user behavior
- Update content based on feedback
- Test different discount amounts

**Month 2+**: Scale what works
- Double down on successful campaigns
- Add more touchpoints if needed
- Consider SMS for hot leads
- Personal phone calls for 5+ visit users

### Hot Lead Outreach

**For users with 3+ visits**:
1. Send automated email (already configured)
2. Wait 2-3 days
3. Personal text: "Hey [Name], saw you've been loving Fever! Let's chat about membership - I have a special deal for you. When can I call?"
4. Schedule 15-min call
5. Close with personalized discount

**Conversion rate boost**: +40-60% with personal touch!

---

## 🔍 Troubleshooting

### Emails Not Sending

**Check**:
1. Campaign is Active (toggle ON)
2. SMTP credentials correct in `.env`
3. Email scheduler running: `node services/emailScheduler.js`
4. Check email logs for errors

**Fix**:
```bash
# Test email sending manually
cd server
node -e "require('./services/emailService').sendTestEmail('test@example.com')"
```

### ClassPass Tab Not Showing

**Check**:
1. Settings → ClassPass Integration → Enabled = TRUE
2. Clear browser cache
3. Refresh admin dashboard

### Analytics Not Updating

**Check**:
1. Bookings have `bookingSource: 'classpass'`
2. Users have `acquisitionSource: 'classpass'`
3. Refresh ClassPass Analytics tab

### User Not Tagged in Email System

**Check**:
1. User opted into emails during booking
2. Email subscriber record exists
3. Tags include "classpass"

**Fix**:
```javascript
// Manually tag user
POST /api/email-subscribers
{
  "email": "user@example.com",
  "name": "User Name",
  "source": "classpass",
  "tags": ["customer", "classpass"]
}
```

---

## 📞 Support

### Need Help?

**Common Issues**:
- Email template customization
- Discount code setup
- Analytics interpretation
- Campaign optimization

**Resources**:
- ClassPass Analytics Dashboard (built-in help text)
- Automated Campaigns help descriptions
- This setup guide

### Best Practices

1. **Start Conservative**: Activate campaigns one at a time
2. **Test Everything**: Use test bookings before going live
3. **Monitor Daily**: Check analytics first 2 weeks
4. **Iterate Quickly**: Adjust based on real data
5. **Personal Touch**: Reach out to hot leads manually

---

## 🎉 Success Metrics

### Target Metrics (Month 1)

- Email Open Rate: 35%+
- Email Click Rate: 10%+
- 2nd Visit Rate: 30%+ (of first-time visitors)
- 3rd Visit Rate: 50%+ (of second-timers)
- Conversion Rate: 15%+ (overall ClassPass → Member)

### ROI Calculation

**Example**: 50 ClassPass users/month
- Average payout: $22/booking
- Average visits: 2
- **Cost**: $2,200 (50 users × 2 visits × $22)

- Conversion rate: 20%
- Converted members: 10
- Average LTV: $199/month × 6 months = $1,194
- **Revenue**: $11,940

**ROI**: 543% ($11,940 / $2,200 = 5.43x)

*Even better when factoring in ClassPass as customer acquisition (vs. $50-200 for ads!)*

---

## ✅ Checklist

Before launching ClassPass integration:

- [ ] Enable ClassPass in Settings
- [ ] Run seed script for email campaigns
- [ ] Customize all email templates
- [ ] Replace placeholder links in emails
- [ ] Set up discount promo codes
- [ ] Configure environment variables
- [ ] Test with sample booking
- [ ] Verify email sending
- [ ] Activate email campaigns
- [ ] Monitor ClassPass Analytics daily
- [ ] Prepare hot lead outreach process

---

**Ready to convert ClassPass users into loyal members? Let's go! 🔥**
