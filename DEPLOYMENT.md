# The Fever Studio - Deployment Guide

## Quick Deploy to Production (Free Hosting)

### Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)
- Render account (sign up at https://render.com)
- MongoDB Atlas account (sign up at https://mongodb.com/cloud/atlas)

---

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `fever-collective`
3. Make it **Public** or **Private**
4. **Do NOT** initialize with README (we already have code)
5. Click "Create repository"

6. Copy the commands shown and run in terminal:
```bash
cd /c/Users/scali/OneDrive/Documents/GitHub/fever-collective
git remote add origin https://github.com/YOUR_USERNAME/fever-collective.git
git branch -M main
git push -u origin main
```

---

## Step 2: Set Up MongoDB Atlas (5 minutes)

Follow the detailed guide in `SETUP_GUIDE.md` - Steps 1-5

**Important:** Save your MongoDB connection string:
```
mongodb+srv://fever_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/fever-collective?retryWrites=true&w=majority
```

---

## Step 3: Deploy Backend to Render (10 minutes)

### 3.1 Create New Web Service
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select `fever-collective` repository
5. Configure:
   - **Name:** `fever-collective-api`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

### 3.2 Add Environment Variables
Click "Environment" and add these:

```
MONGODB_URI=mongodb+srv://fever_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/fever-collective?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
CLIENT_URL=https://fever-collective.vercel.app
PORT=5001
```

**Optional (for image uploads):**
```
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### 3.3 Deploy
- Click "Create Web Service"
- Wait 3-5 minutes for deployment
- **Save your backend URL:** `https://fever-collective-api.onrender.com`

---

## Step 4: Deploy Frontend to Vercel (5 minutes)

### 4.1 Import Project
1. Go to https://vercel.com/new
2. Click "Import" next to your `fever-collective` repository
3. Configure:
   - **Framework Preset:** `Create React App`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

### 4.2 Add Environment Variable
Click "Environment Variables" and add:

```
REACT_APP_API_URL=https://fever-collective-api.onrender.com
```

### 4.3 Deploy
- Click "Deploy"
- Wait 2-3 minutes
- **Your site URL:** `https://fever-collective.vercel.app`

---

## Step 5: Update Backend CORS

### 5.1 Update Environment Variables in Render
Go back to Render dashboard → Your service → Environment

Update `CLIENT_URL` to your actual Vercel URL:
```
CLIENT_URL=https://fever-collective.vercel.app
```

Click "Save Changes" - Render will auto-redeploy

---

## Step 6: Test Your Deployment

1. **Visit your site:** https://fever-collective.vercel.app
2. **Register an account:** Go to /register
3. **Login:** Go to /login
4. **Access admin dashboard:** Go to /admin
5. **Create events**
6. **View events page:** Go to /events

---

## Troubleshooting

### Frontend can't connect to backend
- Check `REACT_APP_API_URL` in Vercel environment variables
- Make sure it matches your Render backend URL
- Redeploy frontend after changing env vars

### Backend shows CORS errors
- Check `CLIENT_URL` in Render environment variables
- Make sure it matches your Vercel frontend URL
- Wait for auto-redeploy after changing

### MongoDB connection errors
- Verify connection string in Render env vars
- Check MongoDB Atlas: Database Access → User exists
- Check MongoDB Atlas: Network Access → "Allow from anywhere" is enabled

### Images not uploading
- Add Cloudinary credentials to Render environment variables
- Get free account at https://cloudinary.com

---

## Custom Domain (Optional)

### Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS setup instructions

### Render:
1. Go to Settings → Custom Domains
2. Add your custom domain
3. Update Vercel `REACT_APP_API_URL` to new backend domain

---

## Costs

All services are **FREE** for this project size:

- **Vercel:** 100GB bandwidth/month free
- **Render:** 750 hours/month free (enough for 1 service 24/7)
- **MongoDB Atlas:** 512MB storage free forever
- **Cloudinary:** 25GB storage + 25GB bandwidth/month free

---

## Support

If you encounter issues:
1. Check deployment logs in Vercel/Render dashboards
2. Verify all environment variables are correct
3. Make sure MongoDB Atlas network access allows connections
4. Check browser console for errors

---

## What's Next?

After deployment:
- Share your Vercel URL for review
- Create sample events in admin dashboard
- Test booking flow
- Customize content and styling
- Add your real business information
