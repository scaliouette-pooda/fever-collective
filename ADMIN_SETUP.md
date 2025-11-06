# Admin User Setup

## Local Database

Admin user has been created in your local MongoDB:

**Email:** admin@fevercollective.com
**Password:** fever2025

You can now login at http://localhost:3000/login

---

## Production Database (MongoDB Atlas)

To create the admin user on production:

### Option 1: Via Render Console (Easiest)

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your **fever-collective-api** service
3. Click on **Shell** tab
4. Run this command:
   ```bash
   npm run create-admin
   ```

### Option 2: Run Locally with Production Connection

1. Temporarily update `server/.env` with production MongoDB URI:
   ```
   MONGODB_URI=mongodb+srv://fever_admin:wtSF3WV9tiDZ3mCG@cluster0.zvsajyi.mongodb.net/fever-collective?retryWrites=true&w=majority
   ```

2. Run the script:
   ```bash
   cd server
   npm run create-admin
   ```

3. Restore local MongoDB URI in `.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/fever-collective
   ```

---

## Admin Credentials

Once created, login at:
- **Local:** http://localhost:3000/login
- **Production:** https://fever-collective.vercel.app/login

**Email:** admin@fevercollective.com
**Password:** fever2025

---

## What Admin Can Do

✅ View all events
✅ Create new events
✅ Edit existing events
✅ Delete events
✅ View all bookings
✅ Upload event images (when Cloudinary is configured)
✅ Access admin dashboard at `/admin`

---

## Security Notes

- Only users with `role: 'admin'` can access the admin dashboard
- Admin routes are protected by authentication middleware
- JWT tokens include user role
- Non-admin users are redirected to events page
- Admin button only appears in navigation for admin users

---

## Troubleshooting

**"Admin user already exists" message:**
- The script will update the existing user to admin role
- Just login with the credentials above

**Can't access admin page:**
- Make sure you're logged in
- Clear browser cache and localStorage
- Try logging out and back in
- Check browser console for errors

**Forgot admin password:**
- Run the create-admin script again
- It will reset the password to `fever2025`
