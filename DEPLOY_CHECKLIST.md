# Deployment Checklist for Review

Follow these steps to deploy The Fever Studio for external review.

## ✅ Step 1: Create GitHub Repository (5 minutes)

1. Go to https://github.com/new
2. Repository name: `fever-collective`
3. Description: "Pilates popup class booking platform"
4. Choose **Public** or **Private**
5. **Do NOT** check "Initialize with README"
6. Click **"Create repository"**

7. Run these commands in your terminal:
```bash
cd C:\Users\scali\OneDrive\Documents\GitHub\fever-collective
git remote add origin https://github.com/YOUR_USERNAME/fever-collective.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## ✅ Step 2: MongoDB Atlas Setup (10 minutes)

**Why:** Free cloud database - no local MongoDB needed for deployment

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free account (Google sign-in works)
3. Click **"Build a Database"**
4. Select **"M0 FREE"** tier
5. Choose AWS / Region closest to you
6. Click **"Create Cluster"** (takes 2-3 minutes)

**Create Database User:**
1. Left sidebar: **"Database Access"**
2. **"Add New Database User"**
3. Username: `fever_admin`
4. **"Autogenerate Secure Password"** - COPY THIS PASSWORD!
5. Privileges: **"Read and write to any database"**
6. **"Add User"**

**Allow Network Access:**
1. Left sidebar: **"Network Access"**
2. **"Add IP Address"**
3. **"Allow Access from Anywhere"** (for now)
4. **"Confirm"**

**Get Connection String:**
1. Left sidebar: **"Database"**
2. Click **"Connect"** on your cluster
3. **"Connect your application"**
4. Copy the connection string - looks like:
```
mongodb+srv://fever_admin:<password>@cluster0.xxxxx.mongodb.net/
```
5. **IMPORTANT:** Replace `<password>` with the password you copied earlier
6. Add database name at the end: `/fever-collective?retryWrites=true&w=majority`

**Final connection string format:**
```
mongodb+srv://fever_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/fever-collective?retryWrites=true&w=majority
```

**SAVE THIS STRING - you'll need it for Render!**

---

## ✅ Step 3: Deploy Backend to Render (10 minutes)

**Why:** Free backend hosting

1. Go to https://dashboard.render.com
2. Sign up with GitHub (easiest)
3. Click **"New +"** → **"Web Service"**
4. Click **"Connect GitHub"** → Authorize Render
5. Select **`fever-collective`** repository

**Configure Service:**
- **Name:** `fever-collective-api`
- **Root Directory:** `server`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Instance Type:** **Free**

**Add Environment Variables:**
Click **"Advanced"** → **"Add Environment Variable"**

Add these (click "+ Add Environment Variable" for each):

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string from Step 2 |
| `JWT_SECRET` | `fever_collective_production_secret_2025_change_this` |
| `CLIENT_URL` | `https://fever-collective.vercel.app` (update after Vercel deploy) |
| `PORT` | `5001` |

**Optional - for image uploads (skip for now):**
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

6. Click **"Create Web Service"**
7. **Wait 3-5 minutes** for deployment
8. **SAVE YOUR BACKEND URL** (shown at top):
   - Example: `https://fever-collective-api.onrender.com`

---

## ✅ Step 4: Deploy Frontend to Vercel (5 minutes)

**Why:** Free, fast frontend hosting

1. Go to https://vercel.com/signup
2. Sign up with GitHub
3. Go to https://vercel.com/new
4. Click **"Import"** next to `fever-collective`

**Configure Project:**
- **Framework Preset:** Create React App (should auto-detect)
- **Root Directory:** `client`
- **Build Command:** `npm run build`
- **Output Directory:** `build`

**Add Environment Variable:**
Click **"Environment Variables"** tab

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | Your Render backend URL from Step 3 |

Example: `https://fever-collective-api.onrender.com`

5. Click **"Deploy"**
6. **Wait 2-3 minutes**
7. **SAVE YOUR FRONTEND URL:**
   - Example: `https://fever-collective.vercel.app`

---

## ✅ Step 5: Update Backend CORS (2 minutes)

**Why:** Allow frontend to talk to backend

1. Go back to Render dashboard: https://dashboard.render.com
2. Click on **`fever-collective-api`** service
3. Left sidebar: **"Environment"**
4. Find `CLIENT_URL` variable
5. Click **"Edit"**
6. Update to your **actual Vercel URL** from Step 4
   - Example: `https://fever-collective.vercel.app`
7. Click **"Save Changes"**
8. Render will auto-redeploy (takes 1-2 minutes)

---

## ✅ Step 6: Test Your Deployment

### Test Frontend
1. Visit your Vercel URL: `https://fever-collective.vercel.app`
2. Should see The Fever Studio homepage
3. Navigation should work: About, Events, Contact

### Test Backend Connection
1. Click on **Events** page
2. Should see "No upcoming events" (not stuck loading)
3. If stuck loading = backend connection issue

### Test Registration
1. Go to `/register` page
2. Fill out form with test email
3. Click "Create Account"
4. Should redirect to login or show success

### Test Login
1. Go to `/login` page
2. Enter credentials from registration
3. Click "Login"
4. Should be logged in

### Test Admin Dashboard
1. Go to `/admin` page
2. Should see admin dashboard (tabs: Events, Bookings, Analytics)
3. Click "Create New Event"
4. Fill out event form
5. Submit - should see new event in table

### Test Events Page
1. Go to `/events` page
2. Should see the event you just created
3. Should load instantly (not 10 seconds)

---

## 📋 Your Deployment URLs

**Fill these in as you deploy:**

- **GitHub Repository:** https://github.com/_______________/fever-collective
- **Frontend (Vercel):** https://fever-collective.vercel.app (update with actual URL)
- **Backend (Render):** https://fever-collective-api.onrender.com (update with actual URL)
- **MongoDB Atlas:** cluster0.xxxxx.mongodb.net (note your cluster name)

---

## 🚨 Troubleshooting

### Frontend can't reach backend
**Symptoms:** Events page stuck loading, registration fails

**Fix:**
1. Check Vercel environment variable `REACT_APP_API_URL`
2. Make sure it matches your Render backend URL
3. Redeploy frontend: Vercel dashboard → Deployments → menu → Redeploy

### Backend can't connect to MongoDB
**Symptoms:** Backend logs show "MongoServerError"

**Fix:**
1. Check Render environment variable `MONGODB_URI`
2. Make sure password has no special characters or is URL-encoded
3. Check MongoDB Atlas → Network Access → "Allow from anywhere"

### CORS errors in browser console
**Symptoms:** Browser console shows "CORS policy" errors

**Fix:**
1. Check Render environment variable `CLIENT_URL`
2. Must exactly match your Vercel URL (no trailing slash)
3. Wait for Render to redeploy after change

### Backend shows "Application failed to respond"
**Symptoms:** Render backend status shows error

**Fix:**
1. Check Render logs (right side of dashboard)
2. Most common: MongoDB connection string wrong
3. Check all environment variables are set

---

## 🎉 Share for Review

Once everything works:

1. **Share your Vercel URL** with reviewers
2. **Create a test admin account** before sharing
3. **Add 2-3 sample events** in admin dashboard
4. **Share test login credentials** (optional)

Example message:
```
Hi! Here's The Fever Studio for review:

🌐 Website: https://fever-collective.vercel.app

📝 Test the following:
- Browse events page
- View admin dashboard at /admin (login required)
- Test booking flow (payments not live yet)

Let me know your feedback!
```

---

## ⏭️ Next Steps (After Review)

- [ ] Custom domain (Vercel + Render)
- [ ] Add Cloudinary for image uploads
- [ ] Set up Stripe for payments
- [ ] Email notifications (SendGrid)
- [ ] Google Analytics
- [ ] SEO optimization

---

## 💰 Current Costs

**$0/month** - Everything is on free tiers:
- Vercel: Free forever for personal projects
- Render: 750 hours/month free (one 24/7 service)
- MongoDB Atlas: 512MB free forever
