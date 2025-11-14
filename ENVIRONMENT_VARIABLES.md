# Environment Variables Reference Guide

Complete reference for all environment variables used in The Fever Collective application.

---

## Current Production Configuration

### Backend (.env in server/)

```env
MONGODB_URI=mongodb+srv://fever_admin:wtSF3WV9tiDZ3mCG@cluster0.zvsajyi.mongodb.net/fever-collective?retryWrites=true&w=majority
JWT_SECRET=f1e62c8e923229be2736c30a8ccf1f6d
CLIENT_URL=https://thefevercollective.com
PORT=5001
EMAIL_SERVICE=custom
EMAIL_USER=info@thefevercollective.com
EMAIL_PASSWORD=Laurmilo123!
SMTP_HOST=mail.thefevercollective.com
SMTP_PORT=587
VENMO_USERNAME=YourVenmoUsername
PAYPAL_EMAIL=your-email@example.com
```

### Frontend (.env in client/)

```env
REACT_APP_API_URL=https://your-backend-url.vercel.app
```

---

## Required Variables

### Backend Required Variables

#### MONGODB_URI
**Purpose:** Database connection string for MongoDB Atlas
**Type:** String (connection string)
**Required:** Yes
**Example:** `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`

**Current Value:**
```
mongodb+srv://fever_admin:wtSF3WV9tiDZ3mCG@cluster0.zvsajyi.mongodb.net/fever-collective?retryWrites=true&w=majority
```

**Where to get it:**
1. Go to MongoDB Atlas dashboard
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy connection string
5. Replace `<password>` with actual password

---

#### JWT_SECRET
**Purpose:** Secret key for signing JWT authentication tokens
**Type:** String (random hash)
**Required:** Yes
**Security:** CRITICAL - Never expose publicly

**Current Value:**
```
f1e62c8e923229be2736c30a8ccf1f6d
```

**How to generate:**
```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: OpenSSL
openssl rand -hex 32

# Option 3: Online
# https://www.uuidgenerator.net/
```

---

#### CLIENT_URL
**Purpose:** Frontend URL for CORS and email links
**Type:** String (URL)
**Required:** Yes

**Values by environment:**
- **Production:** `https://thefevercollective.com`
- **Local:** `http://localhost:3000`
- **Staging:** `https://staging.thefevercollective.com`

---

#### PORT
**Purpose:** Server port number
**Type:** Number
**Required:** Yes (but Vercel overrides this)
**Default:** 5001

**Current Value:** `5001`

**Note:** On Vercel, the PORT is automatically set. This is mainly for local development.

---

### Email Configuration (Required)

#### EMAIL_SERVICE
**Purpose:** Email service provider type
**Type:** String
**Required:** Yes
**Options:** `gmail`, `custom`, `hotmail`

**Current Value:** `custom`

**When to use:**
- `gmail` - Using Gmail with app password
- `custom` - Using custom domain email (like info@thefevercollective.com)
- `hotmail` - Using Outlook/Hotmail

---

#### EMAIL_USER
**Purpose:** Email address to send emails from
**Type:** String (email address)
**Required:** Yes

**Current Value:** `info@thefevercollective.com`

**This email will be the "From" address for:**
- Welcome emails
- Booking confirmations
- Payment confirmations
- Password reset emails

---

#### EMAIL_PASSWORD
**Purpose:** Password for email account
**Type:** String
**Required:** Yes
**Security:** CRITICAL - Never commit to git

**Current Value:** `Laurmilo123!`

**For Gmail:**
- Use App Password (not regular password)
- Requires 2FA enabled
- Generate at: https://myaccount.google.com/apppasswords

**For custom domain:**
- Use the email account password
- Contact your hosting provider if unknown

---

#### SMTP_HOST
**Purpose:** SMTP server hostname
**Type:** String (hostname)
**Required:** Yes (when EMAIL_SERVICE=custom)

**Current Value:** `mail.thefevercollective.com`

**Common values:**
- Gmail: `smtp.gmail.com`
- Outlook: `smtp.office365.com`
- Custom domain: `mail.yourdomain.com` or `smtp.yourdomain.com`

**Where to find it:**
- Check your hosting provider's documentation
- Look in email client settings
- Contact your domain/hosting support

---

#### SMTP_PORT
**Purpose:** SMTP server port
**Type:** Number
**Required:** Yes (when EMAIL_SERVICE=custom)

**Current Value:** `587`

**Common ports:**
- `587` - TLS (recommended)
- `465` - SSL
- `25` - Unencrypted (not recommended)

---

### Frontend Required Variables

#### REACT_APP_API_URL
**Purpose:** Backend API base URL
**Type:** String (URL)
**Required:** Yes

**Values by environment:**
- **Production:** `https://your-backend.vercel.app`
- **Local:** `http://localhost:5001`

**Important:** Must match your backend deployment URL

---

## Optional Variables

### Payment Configuration

#### VENMO_USERNAME
**Purpose:** Venmo username for payment instructions
**Type:** String
**Required:** No
**Current Value:** `YourVenmoUsername`

**Usage:** Displayed to users when selecting Venmo payment option

---

#### PAYPAL_EMAIL
**Purpose:** PayPal email for payment instructions
**Type:** String (email)
**Required:** No
**Current Value:** `your-email@example.com`

**Usage:** Displayed to users when selecting PayPal payment option

---

#### STRIPE_SECRET_KEY
**Purpose:** Stripe API secret key for payments
**Type:** String
**Required:** No (if using Stripe)
**Security:** CRITICAL

**Example:** `sk_test_51Hx...` (test) or `sk_live_51Hx...` (production)

**Where to get it:**
1. Go to https://dashboard.stripe.com
2. Developers → API keys
3. Copy "Secret key"

---

#### STRIPE_PUBLISHABLE_KEY
**Purpose:** Stripe public key for frontend
**Type:** String
**Required:** No (if using Stripe)

**Example:** `pk_test_51Hx...` (test) or `pk_live_51Hx...` (production)

---

#### STRIPE_WEBHOOK_SECRET
**Purpose:** Stripe webhook signing secret
**Type:** String
**Required:** No (if using Stripe webhooks)

**Example:** `whsec_...`

**Where to get it:**
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint
3. Copy "Signing secret"

---

### Image Upload Configuration (Optional)

#### CLOUDINARY_CLOUD_NAME
**Purpose:** Cloudinary account name
**Type:** String
**Required:** No (if using Cloudinary)

**Where to find:** Cloudinary Dashboard → Account Details

---

#### CLOUDINARY_API_KEY
**Purpose:** Cloudinary API key
**Type:** String
**Required:** No (if using Cloudinary)

---

#### CLOUDINARY_API_SECRET
**Purpose:** Cloudinary API secret
**Type:** String
**Required:** No (if using Cloudinary)
**Security:** CRITICAL

---

## Environment-Specific Configurations

### Local Development (.env)

```env
MONGODB_URI=mongodb+srv://fever_admin:wtSF3WV9tiDZ3mCG@cluster0.zvsajyi.mongodb.net/fever-collective?retryWrites=true&w=majority
JWT_SECRET=f1e62c8e923229be2736c30a8ccf1f6d
CLIENT_URL=http://localhost:3000
PORT=5001
EMAIL_SERVICE=custom
EMAIL_USER=info@thefevercollective.com
EMAIL_PASSWORD=Laurmilo123!
SMTP_HOST=mail.thefevercollective.com
SMTP_PORT=587
```

### Production (Vercel Environment Variables)

Same as local, but CLIENT_URL should be:
```
CLIENT_URL=https://thefevercollective.com
```

And REACT_APP_API_URL should point to your backend:
```
REACT_APP_API_URL=https://your-backend.vercel.app
```

---

## Setting Environment Variables

### Local Development

1. Create `.env` file in `server/` directory
2. Copy variables from above
3. Never commit `.env` to git (it's in .gitignore)

### Vercel Deployment

1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable individually
5. Select environments: Production, Preview, Development
6. Save

**Important:** After adding/updating variables, redeploy for changes to take effect.

---

## Security Best Practices

### DO:
✅ Use different JWT_SECRET for production and development
✅ Keep .env files out of version control
✅ Rotate credentials regularly (every 90 days)
✅ Use App Passwords for Gmail (not main password)
✅ Store sensitive values in Vercel environment variables
✅ Use environment-specific values (dev vs prod)

### DON'T:
❌ Commit .env files to git
❌ Share credentials in public channels
❌ Use weak JWT secrets
❌ Hardcode credentials in source code
❌ Use production credentials in development
❌ Leave default placeholder values in production

---

## Troubleshooting

### "Missing environment variable" Error

**Solution:**
1. Check variable name spelling
2. Verify variable is set in Vercel
3. Redeploy after adding variables
4. Check logs for specific missing variable

### Email Not Sending

**Check:**
1. EMAIL_* variables are all set
2. EMAIL_PASSWORD is correct
3. SMTP_HOST and SMTP_PORT are correct
4. For Gmail, App Password is used (not regular password)

### Database Connection Error

**Check:**
1. MONGODB_URI is correct
2. Password in URI is URL-encoded
3. MongoDB Atlas IP whitelist includes 0.0.0.0/0
4. Database user has correct permissions

### JWT Token Invalid

**Check:**
1. JWT_SECRET matches between environments
2. Token hasn't expired (7 day default)
3. Secret wasn't changed after tokens were issued

---

## Variable Validation Checklist

Before deploying, verify:

- [ ] All required variables are set
- [ ] No placeholder values remain
- [ ] Credentials are correct
- [ ] URLs match environment (http vs https)
- [ ] Secrets are strong and unique
- [ ] Variables set in ALL Vercel environments
- [ ] .env file is in .gitignore
- [ ] Documentation is updated

---

## Quick Reference

**Minimum Required for Basic Functionality:**
```
MONGODB_URI=<your-connection-string>
JWT_SECRET=<random-32-char-hex>
CLIENT_URL=<frontend-url>
```

**Add for Email Functionality:**
```
EMAIL_SERVICE=custom
EMAIL_USER=<your-email>
EMAIL_PASSWORD=<your-password>
SMTP_HOST=<smtp-server>
SMTP_PORT=587
```

**Add for Payments:**
```
STRIPE_SECRET_KEY=<stripe-secret>
STRIPE_PUBLISHABLE_KEY=<stripe-public>
VENMO_USERNAME=<venmo-username>
PAYPAL_EMAIL=<paypal-email>
```

---

## Need Help?

- **Vercel Variables:** https://vercel.com/docs/concepts/projects/environment-variables
- **MongoDB Connection:** https://docs.atlas.mongodb.com/tutorial/connect-to-your-cluster/
- **Email Setup:** See EMAIL_SETUP.md
- **Deployment:** See VERCEL_DEPLOYMENT.md
- **Admin Setup:** See ADMIN_SETUP.md
