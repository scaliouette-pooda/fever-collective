# Email System Setup Guide

The Fever Studio application now includes a comprehensive email marketing system with SendGrid integration, email list management, and subscriber tracking.

## Features

1. **SendGrid Integration** - Professional email delivery
2. **Email List Management** - Static and dynamic lists
3. **Subscriber Tracking** - Opens, clicks, bounces, unsubscribes
4. **Campaign Management** - Send to lists with promo codes
5. **Unsubscribe Handling** - Automatic unsubscribe links

## Quick Setup

### SendGrid (Recommended)

1. Sign up at https://sendgrid.com (free: 100 emails/day)
2. Create API key (Settings > API Keys)
3. Verify sender email (Settings > Sender Authentication)
4. Add to .env:
   ```
   SENDGRID_API_KEY=SG.your_key_here
   SENDGRID_FROM_EMAIL=hello@feverstudio.com
   ```

### Gmail SMTP (Testing Only)

1. Enable 2-Factor Authentication
2. Create App Password
3. Add to .env:
   ```
   EMAIL_USER=your.email@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```

## Using Email Lists

### Create Email List via API

```javascript
POST /api/email-lists
{
  "name": "VIP Members",
  "description": "Epidemic tier members",
  "type": "dynamic",
  "dynamicCriteria": {
    "membershipTiers": ["epidemic"]
  }
}
```

### Send Campaign to List

1. Go to Admin Dashboard > Email Marketing
2. Create New Campaign
3. Select "Email Lists" as recipients
4. Choose your list(s)
5. Add optional promo code
6. Preview recipients
7. Send!

## API Endpoints

- `GET /api/email-lists` - All lists
- `POST /api/email-lists` - Create list
- `GET /api/email-subscribers` - All subscribers
- `POST /api/email-subscribers/unsubscribe` - Unsubscribe (public)

See full documentation in the codebase.
