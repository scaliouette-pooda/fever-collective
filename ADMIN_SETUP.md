# Admin User Setup

## Current Admin Account

**Email:** info@thefeverstudio.com
**Password:** Laurcalmilo123!

**Login URLs:**
- Production: https://thefeverstudio.com/login
- Alternative Domain: https://thefevercollective.com/login
- Local: http://localhost:3000/login

**Admin Dashboard:**
- Production: https://thefeverstudio.com/admin
- Alternative Domain: https://thefevercollective.com/admin
- Local: http://localhost:3000/admin

---

## Creating Admin User

### Production Database (MongoDB Atlas - Current Setup)

The admin user has already been created in production. If you need to create a new admin or reset the password:

### Option 1: Run Locally with Production Connection (Recommended)

1. Make sure `server/.env` has production MongoDB URI:
   ```
   MONGODB_URI=mongodb+srv://fever_admin:wtSF3WV9tiDZ3mCG@cluster0.zvsajyi.mongodb.net/fever-collective?retryWrites=true&w=majority
   ```

2. Run the script:
   ```bash
   cd server
   node scripts/createAdmin.js
   ```

The script will:
- Create a new admin user with email: info@thefeverstudio.com
- Set password to: Laurcalmilo123!
- If user exists, it will update their role to admin

### Option 2: Update User Role Manually in MongoDB Atlas

1. Go to MongoDB Atlas dashboard
2. Browse Collections → fever-collective database → users collection
3. Find the user with email: info@thefeverstudio.com
4. Edit the document and set `role: "admin"`
5. Save changes

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
- Use the "Forgot Password" feature on the login page
- Or run the create-admin script again to reset to default password
- Or use MongoDB Atlas to reset the password hash directly

**Need to change admin email:**
- Update the email in `server/scripts/createAdmin.js` (line 14)
- Run the script to create new admin with different email
