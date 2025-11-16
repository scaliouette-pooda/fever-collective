# The Fever Studio - Setup Guide

## Quick Start (5 Minutes)

### Step 1: Set Up MongoDB Atlas (Free)

1. **Create Account**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Sign up with email or Google

2. **Create Free Cluster**
   - Click "Build a Database"
   - Select **M0 FREE** tier
   - Choose a cloud provider (AWS recommended)
   - Select region closest to you
   - Click "Create Cluster"

3. **Create Database User**
   - Go to "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Username: `fever_admin`
   - Password: Generate a secure password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Allow Network Access**
   - Go to "Network Access" (left sidebar)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (or add your IP)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Select "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://fever_admin:<password>@cluster0.xxxxx.mongodb.net/`

6. **Update Your .env File**
   - Open: `server/.env`
   - Replace the MONGODB_URI line with:
   ```
   MONGODB_URI=mongodb+srv://fever_admin:YOUR_PASSWORD_HERE@cluster0.xxxxx.mongodb.net/fever-collective?retryWrites=true&w=majority
   ```
   - Replace `YOUR_PASSWORD_HERE` with the password from step 3
   - Replace `cluster0.xxxxx` with your actual cluster address

7. **Restart Server**
   - The server should auto-restart with nodemon
   - Check terminal for: "MongoDB connected" ✅

### Step 2: Create Your Admin Account

1. Go to: http://localhost:3000/register
2. Fill out the form:
   - Name: Your name
   - Email: your@email.com
   - Password: (at least 6 characters)
   - Phone: Your phone
3. Click "Create Account"

### Step 3: Login

1. Go to: http://localhost:3000/login
2. Enter your email and password
3. Click "Login"

### Step 4: Access Admin Dashboard

1. Go to: http://localhost:3000/admin
2. Create your first event:
   - Click "Create New Event"
   - Fill out all fields
   - Upload an image (optional)
   - Click "Create Event"

### Step 5: View Events

1. Go to: http://localhost:3000/events
2. Your events will now load instantly!

---

## Environment Variables Needed

### Required NOW:
- `MONGODB_URI` - Get from MongoDB Atlas (Step 1 above)

### Optional (Add Later):
- `CLOUDINARY_CLOUD_NAME` - For image uploads (https://cloudinary.com)
- `CLOUDINARY_API_KEY` - From Cloudinary
- `CLOUDINARY_API_SECRET` - From Cloudinary
- `STRIPE_SECRET_KEY` - For payments (https://stripe.com)
- `STRIPE_PUBLISHABLE_KEY` - From Stripe
- `STRIPE_WEBHOOK_SECRET` - From Stripe

---

## Troubleshooting

### Events page stuck on "Loading..."
❌ **Problem**: MongoDB not connected
✅ **Solution**: Complete Step 1 above

### "Failed to register user"
❌ **Problem**: MongoDB not connected
✅ **Solution**: Complete Step 1 above

### Can't see admin page
❌ **Problem**: Not logged in
✅ **Solution**: Complete Steps 2-3 above

### Image upload fails
❌ **Problem**: Cloudinary not configured
✅ **Solution**: Events work without images! Add Cloudinary later if needed

---

## What Works Right Now (Without Additional Setup)

✅ Full website with all pages
✅ Event creation and management
✅ User registration and login
✅ Booking system
✅ Admin dashboard
✅ Responsive design

## What Needs Additional Setup

⏳ Image uploads (needs Cloudinary account)
⏳ Payment processing (needs Stripe account)
⏳ Email notifications (needs SendGrid account)

---

## Support

If you get stuck:
1. Check the terminal for error messages
2. Make sure MongoDB shows "connected"
3. Try clearing browser cache
4. Restart both servers

**MongoDB Atlas is the ONLY thing you need to get started!**
