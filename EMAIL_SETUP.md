# Email Configuration Guide

## Current Production Setup

**Email Address:** info@thefeverstudio.com
**SMTP Host:** mail.thefeverstudio.com
**Port:** 587
**Status:** ✅ Configured and ready

## Overview

The system automatically sends emails for:
- ✅ **Welcome emails** when users register
- ✅ **Booking confirmations** when bookings are created
- ✅ **Payment confirmations** when payments are received
- ✅ **Password reset emails** when users request password resets

## Gmail Setup (Recommended)

### Step 1: Enable 2-Factor Authentication

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification**

### Step 2: Generate App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Enter name: **Fever Collective**
5. Click **Generate**
6. Copy the 16-character password (remove spaces)

### Step 3: Add to Vercel Environment

Go to Vercel dashboard → Your Project → Settings → Environment Variables:

```
EMAIL_SERVICE=gmail
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

(Paste the app password exactly as shown, with or without spaces)

---

## Custom Domain Email (Current Setup)

**For info@thefeverstudio.com:**

```
EMAIL_SERVICE=custom
EMAIL_USER=info@thefeverstudio.com
EMAIL_PASSWORD=your-email-password
SMTP_HOST=mail.thefeverstudio.com
SMTP_PORT=587
```

This is the current production configuration. Add these to Vercel environment variables.

---

## Other Email Providers

### SendGrid (Recommended for Production)

**Benefits:**
- 100 emails/day FREE
- Better deliverability
- Analytics dashboard

**Setup:**
1. Create account: https://signup.sendgrid.com/
2. Verify your email
3. Create API key
4. Add to Render:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASSWORD=your-sendgrid-api-key
   ```

### Mailgun

**Benefits:**
- 5,000 emails/month FREE
- Good deliverability
- Simple API

**Setup:**
1. Create account: https://signup.mailgun.com/
2. Verify domain or use sandbox
3. Get SMTP credentials
4. Add to Render:
   ```
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   EMAIL_USER=your-mailgun-username
   EMAIL_PASSWORD=your-mailgun-password
   ```

### Outlook/Hotmail

```
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@hotmail.com
EMAIL_PASSWORD=your-password
```

---

## Testing Emails

### Local Testing

1. Update `server/.env`:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

2. Register a new user at http://localhost:3000/register

3. Check your inbox for welcome email

### Production Testing

1. Add environment variables to Vercel (see above)
2. Wait for Vercel to redeploy (automatic)
3. Register at https://thefevercollective.com/register
4. Check inbox

---

## Email Templates

### Welcome Email
- Sent when user registers
- Contains welcome message
- Link to browse events

### Booking Confirmation
- Sent when admin confirms booking
- Contains event details
- Booking ID for reference

### Payment Confirmation
- Sent when admin confirms payment
- Contains payment amount
- Booking reference

---

## Troubleshooting

### Emails not sending

**Check Vercel logs:**
1. Go to Vercel dashboard
2. Select your project
3. Check **Deployments** → Click on latest deployment
4. View **Function Logs**
5. Look for email errors

**Common issues:**
- Wrong app password (needs 2FA enabled)
- Email not configured (check environment variables)
- Gmail blocking (enable "Less secure app access")

### Gmail specific issues

**"Less secure app" error:**
- Use App Password instead of regular password
- Enable 2-Factor Authentication first

**Still not working:**
- Check spam folder
- Verify app password copied correctly
- Try SendGrid instead

### Emails going to spam

**Solutions:**
- Use SendGrid or Mailgun (better reputation)
- Add SPF/DKIM records to your domain
- Ask recipients to whitelist your email

---

## Cost Comparison

| Provider | Free Tier | Cost After | Best For |
|----------|-----------|------------|----------|
| Gmail | Unlimited* | Free | Development/Testing |
| SendGrid | 100/day | $15/mo | Small business |
| Mailgun | 5,000/mo | $35/mo | Growing business |
| AWS SES | 62,000/mo | $0.10/1000 | Large volume |

*Gmail has daily sending limits (~500/day) but good for testing

---

## Production Recommendations

1. **Development:** Use Gmail (free, easy setup)
2. **Production:** Use SendGrid or Mailgun (better deliverability)
3. **Scale:** Use AWS SES (cheapest for high volume)

---

## Future Enhancements

- [ ] Event reminder emails (24 hours before)
- [ ] Booking cancellation emails
- [ ] Admin notification emails (new bookings)
- [ ] Email templates with better design
- [ ] Email preferences (opt-out options)
- [ ] HTML email builder

---

## Environment Variables Summary

**Required for emails:**
```
EMAIL_SERVICE=gmail          # or omit for custom SMTP
EMAIL_USER=your@email.com    # Your email address
EMAIL_PASSWORD=your-password # App password for Gmail
```

**Optional (for custom SMTP):**
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
```

**On Vercel:**
All variables should be added to Settings → Environment Variables.

**Current Production Values:**
```
EMAIL_SERVICE=custom
EMAIL_USER=info@thefeverstudio.com
EMAIL_PASSWORD=Laurcalmilo123!
SMTP_HOST=mail.thefeverstudio.com
SMTP_PORT=587
```
