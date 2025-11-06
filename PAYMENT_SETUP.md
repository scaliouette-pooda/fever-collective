# Payment Setup Guide

The Fever Collective now supports **PayPal** and **Venmo** payments for event bookings.

## How It Works

1. **Customer books an event** on your website
2. **Selects payment method** (Venmo or PayPal)
3. **Gets redirected** to pay you directly
4. **Booking is created** with "pending" status
5. **You confirm payment** manually in the admin dashboard

## Setup Instructions

### 1. Venmo Setup (100% FREE)

**Step 1:** Make sure you have a Venmo account at https://venmo.com

**Step 2:** Find your Venmo username:
- Open Venmo app or website
- Go to your profile
- Your username is shown (e.g., `@JohnDoe` → username is `JohnDoe`)

**Step 3:** Add to Render environment variables:
```
VENMO_USERNAME=YourVenmoUsername
```
(Don't include the @ symbol)

**How it works:**
- Customer clicks "Proceed to Payment"
- Opens Venmo app/website with:
  - Your username pre-filled
  - Amount pre-filled
  - Event details in note
- Customer completes payment in Venmo
- You manually confirm in admin dashboard

---

### 2. PayPal Setup (100% FREE)

**Option A: PayPal.me (Simplest)**

**Step 1:** Create PayPal.me link:
- Go to https://paypal.me
- Create your custom link (e.g., `paypal.me/JohnDoe`)

**Step 2:** Add to Render environment variables:
```
PAYPAL_EMAIL=your-paypal-email@example.com
```

**How it works:**
- Customer clicks "Proceed to Payment"
- Opens PayPal.me with amount pre-filled
- Customer completes payment
- You receive payment instantly
- You manually confirm in admin dashboard

**Option B: Full PayPal Integration (Coming Later)**
For automatic payment verification, we can integrate PayPal SDK later. This requires:
- PayPal Business account
- API credentials
- Webhook setup
- **Cost:** 2.9% + $0.30 per transaction

---

## Adding to Render (Production)

1. Go to your Render dashboard
2. Select your **fever-collective-api** service
3. Go to **Environment** tab
4. Add these variables:
   ```
   VENMO_USERNAME=YourActualVenmoUsername
   PAYPAL_EMAIL=your-actual-email@example.com
   ```
5. Click **Save Changes**
6. Render will automatically redeploy

---

## Managing Bookings as Admin

### When a customer books:
1. Booking appears in Admin Dashboard with status: **Pending**
2. Customer pays you via Venmo/PayPal
3. You receive payment notification (Venmo/PayPal app)
4. **Verify payment** matches booking ID
5. **Update booking status** in admin dashboard:
   - Change from "Pending" to "Confirmed"
   - (This feature needs to be added - let me know if you want it)

---

## Testing Locally

1. Update `server/.env`:
   ```
   VENMO_USERNAME=TestVenmo
   PAYPAL_EMAIL=test@example.com
   ```

2. Book an event on `http://localhost:3000`

3. Select Venmo or PayPal

4. You'll be redirected to payment link

---

## Future Enhancements (Optional)

### 1. Automatic Payment Verification
- PayPal SDK integration
- Webhook to confirm payments automatically
- **Cost:** Development time + transaction fees

### 2. Stripe Integration (Credit Cards)
- Accept credit/debit cards
- Automatic confirmation
- **Cost:** 2.9% + $0.30 per transaction + development time

### 3. Booking Confirmation Emails
- Automatic email when booking is confirmed
- Requires email service (SendGrid, Mailgun)
- **Cost:** Free tier available

---

## Support

Need help setting this up? Let me know:
- Finding your Venmo username
- Setting up PayPal.me
- Adding environment variables to Render
- Testing the payment flow
