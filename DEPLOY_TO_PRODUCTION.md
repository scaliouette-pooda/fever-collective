# Deploy to Production - Step by Step

## Step 1: Push Code to GitHub

1. Open **GitHub Desktop**
2. You should see 7 commits ready to push:
   - Add logout functionality and improve navigation
   - Update admin password to fever2025
   - Add admin user creation script and documentation
   - Add PayPal and Venmo payment integration
   - Remove login success alert and add Admin nav button
   - Add frontend admin access control
   - And more...

3. Click **"Push origin"**

4. Wait for push to complete

---

## Step 2: Wait for Automatic Deployments

### Vercel (Frontend) - Automatic
- Vercel will automatically detect the push
- Rebuilds and redeploys frontend
- Usually takes 1-2 minutes
- Check status at: https://vercel.com/dashboard

### Render (Backend) - Automatic
- Render will automatically detect the push
- Rebuilds and redeploys backend
- Usually takes 3-5 minutes
- Check status at: https://dashboard.render.com

**Wait for BOTH to complete before proceeding!**

---

## Step 3: Add Payment Environment Variables to Render

1. Go to https://dashboard.render.com
2. Select **fever-collective-api** service
3. Click **Environment** tab
4. Add these variables:
   ```
   VENMO_USERNAME=YourVenmoUsername
   PAYPAL_EMAIL=your-paypal-email@example.com
   ```
5. Click **Save Changes**
6. Render will redeploy (takes 3-5 minutes)

---

## Step 4: Create Admin User on Production

### Option 1: Via Render Shell (Recommended)

1. Go to https://dashboard.render.com
2. Select **fever-collective-api** service
3. Click **Shell** tab (next to Logs)
4. Wait for shell to connect
5. Run this command:
   ```bash
   npm run create-admin
   ```
6. You should see: "✅ Admin user created successfully!"

### Option 2: Via Local Script

1. Open `server/.env`
2. **TEMPORARILY** change MongoDB URI to production:
   ```
   MONGODB_URI=mongodb+srv://fever_admin:wtSF3WV9tiDZ3mCG@cluster0.zvsajyi.mongodb.net/fever-collective?retryWrites=true&w=majority
   ```
3. Run:
   ```bash
   cd server
   npm run create-admin
   ```
4. **RESTORE** local MongoDB URI:
   ```
   MONGODB_URI=mongodb://localhost:27017/fever-collective
   ```

---

## Step 5: Test Production Login

1. Go to: https://fever-collective.vercel.app/login

2. Login with:
   - **Email:** admin@thefeverstudio.com
   - **Password:** fever2025

3. You should:
   - Be redirected to `/admin`
   - See "Logout" in navigation
   - See "Admin" button in navigation
   - Have access to admin dashboard

---

## Step 6: Test Event Booking (Optional)

1. Go to: https://fever-collective.vercel.app/events
2. Click on an event
3. Fill out booking form
4. Select payment method (Venmo or PayPal)
5. Click "Proceed to Payment"
6. You'll be redirected to payment provider
7. Booking is created with "pending" status

---

## Troubleshooting

### Vercel/Render still showing old code
- Check deployment status in dashboard
- Wait 5 minutes after push
- Clear browser cache (Ctrl+Shift+Delete)
- Try incognito/private window

### Admin user creation fails
- Make sure Render deployment is complete
- Check Render logs for errors
- Verify MongoDB Atlas is accessible
- Try Option 2 (local script)

### Login fails with correct credentials
- Clear browser localStorage
- Check browser console for errors
- Verify both Vercel and Render deployments completed
- Check Render logs for authentication errors

### Payment not working
- Verify VENMO_USERNAME and PAYPAL_EMAIL are set in Render
- Check Render logs for payment errors
- Make sure environment variables were saved and deployment completed

---

## Summary of What's New

✅ **Admin System**
- Admin-only access to dashboard
- Role-based authentication
- Admin user: admin@thefeverstudio.com

✅ **Payment Integration**
- Venmo payment links
- PayPal payment links
- Payment method selector in booking form

✅ **UI Improvements**
- Logout functionality
- Dynamic navigation (Login/Logout)
- Admin button for admin users only
- Mobile optimizations

✅ **Security**
- Admin middleware on backend
- Frontend admin access control
- JWT tokens include user role
