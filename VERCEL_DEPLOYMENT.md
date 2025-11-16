# Vercel Deployment Guide

## Current Deployment Status

**Live Site:** https://thefevercollective.com
**Platform:** Vercel (Frontend & Backend)
**Database:** MongoDB Atlas
**Status:** ✅ Deployed and Live

---

## Project Structure

The Fever Studio is deployed as a monorepo on Vercel:
- **Frontend** (client/) - React application
- **Backend** (server/) - Express API (deployed as Vercel Serverless Functions)

---

## Initial Deployment Setup

### 1. Prerequisites

- GitHub repository connected to Vercel
- MongoDB Atlas account with database created
- Custom domain configured (thefevercollective.com)

### 2. Deploy to Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository: `fever-collective`
4. Configure project settings:

**Framework Preset:** Create React App (for frontend)

**Root Directory:** `client` (for frontend deployment)

**Build Command:** `npm run build`

**Output Directory:** `build`

**Install Command:** `npm install`

### 3. Deploy Backend API

Create a second Vercel project for the backend:

1. Click "Add New Project" again
2. Import same repository
3. Configure as:
   - **Root Directory:** `server`
   - **Framework:** Other
   - **Build Command:** Leave empty
   - **Output Directory:** Leave empty

---

## Environment Variables Setup

### Frontend Environment Variables

Go to Vercel Dashboard → Client Project → Settings → Environment Variables

Add the following:

```
REACT_APP_API_URL=https://your-backend-url.vercel.app
```

**Note:** Replace with your actual backend Vercel URL after backend is deployed.

### Backend Environment Variables

Go to Vercel Dashboard → Server Project → Settings → Environment Variables

Add the following (use "Production", "Preview", and "Development" for all):

```
MONGODB_URI=mongodb+srv://fever_admin:wtSF3WV9tiDZ3mCG@cluster0.zvsajyi.mongodb.net/fever-collective?retryWrites=true&w=majority

JWT_SECRET=f1e62c8e923229be2736c30a8ccf1f6d

CLIENT_URL=https://thefevercollective.com

PORT=5001

EMAIL_SERVICE=custom

EMAIL_USER=info@thefeverstudio.com

EMAIL_PASSWORD=Laurcalmilo123!

SMTP_HOST=mail.thefeverstudio.com

SMTP_PORT=587
```

**Important:** Make sure to add these to ALL environments (Production, Preview, Development)

---

## Custom Domain Setup

### 1. Connect Domain to Vercel

1. Go to Vercel Dashboard → Client Project → Settings → Domains
2. Add custom domain: `thefevercollective.com`
3. Add www variant: `www.thefevercollective.com`

### 2. Configure DNS Records

In your domain registrar (GoDaddy, Namecheap, etc.), add these DNS records:

**A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto
```

**CNAME Record:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

### 3. SSL Certificate

Vercel automatically provisions SSL certificates. Wait 24-48 hours for DNS propagation and SSL setup.

---

## Deployment Checklist

After deployment, verify these items:

- [ ] Frontend loads at https://thefevercollective.com
- [ ] Backend API is accessible
- [ ] Environment variables are set correctly
- [ ] Database connection works
- [ ] User registration works
- [ ] Login works
- [ ] Email sending works (welcome, booking, password reset)
- [ ] Admin login works with info@thefeverstudio.com
- [ ] Events can be created/edited/deleted
- [ ] Bookings can be created
- [ ] Images upload correctly (if Cloudinary configured)

---

## Testing the Deployment

### Test User Registration
1. Go to https://thefevercollective.com/register
2. Create a new account
3. Check email for welcome message

### Test Password Reset
1. Go to https://thefevercollective.com/forgot-password
2. Enter your email
3. Check email for reset link
4. Click link and reset password

### Test Admin Access
1. Go to https://thefeverstudio.com/login (or https://thefevercollective.com/login)
2. Login with: info@thefeverstudio.com / Laurcalmilo123!
3. Verify admin dashboard loads
4. Try creating/editing an event

---

## Redeployment

### Automatic Redeployment
Vercel automatically redeploys when you push to your GitHub repository:
- Push to `main` branch → triggers production deployment
- Push to other branches → triggers preview deployment

### Manual Redeployment
1. Go to Vercel Dashboard
2. Select project
3. Go to Deployments tab
4. Click "..." on latest deployment
5. Click "Redeploy"

---

## Monitoring and Logs

### View Logs
1. Go to Vercel Dashboard
2. Select project
3. Click on latest deployment
4. View "Function Logs" or "Build Logs"

### Common Log Locations
- API errors: Server project → Function Logs
- Build errors: Client project → Build Logs
- Email errors: Server project → Function Logs (search for "email")

---

## Troubleshooting

### Issue: API Not Responding

**Check:**
1. Backend environment variables are set
2. MONGODB_URI is correct
3. Function logs for errors
4. CORS settings allow your frontend domain

### Issue: Emails Not Sending

**Check:**
1. EMAIL_* environment variables are set in backend
2. SMTP credentials are correct
3. Function logs for email errors
4. Check spam folder

### Issue: "Module not found" Errors

**Solution:**
1. Make sure all dependencies are in package.json
2. Delete node_modules and package-lock.json
3. Run `npm install`
4. Push to trigger redeploy

### Issue: Database Connection Errors

**Check:**
1. MONGODB_URI is correct
2. MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
3. Database user has correct permissions
4. Network access in MongoDB Atlas is configured

---

## Environment Variables Reference

See `ENVIRONMENT_VARIABLES.md` for detailed explanation of each variable.

**Required for Production:**
- MONGODB_URI
- JWT_SECRET
- CLIENT_URL
- EMAIL_SERVICE
- EMAIL_USER
- EMAIL_PASSWORD
- SMTP_HOST
- SMTP_PORT

**Optional:**
- STRIPE_SECRET_KEY (for payments)
- CLOUDINARY_* (for image uploads)
- VENMO_USERNAME (for Venmo payments)
- PAYPAL_EMAIL (for PayPal payments)

---

## Security Best Practices

1. **Never commit .env files** - They're in .gitignore
2. **Use different secrets for dev/prod** - Especially JWT_SECRET
3. **Rotate credentials regularly** - Update passwords every 90 days
4. **Monitor access logs** - Check Vercel analytics
5. **Enable 2FA on Vercel account**
6. **Restrict MongoDB Atlas IP access** - Only allow Vercel IPs if possible

---

## Backup and Rollback

### Create Backup
MongoDB Atlas automatically backs up your data. Manual backups:
1. Go to MongoDB Atlas
2. Clusters → Select your cluster
3. Click "..." → Backup
4. Download backup

### Rollback Deployment
1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

---

## Cost Overview

**Vercel:**
- Free tier: Unlimited deployments, 100GB bandwidth/month
- Pro: $20/month for team features

**MongoDB Atlas:**
- Free tier: 512MB storage (sufficient for small apps)
- Shared: $9/month for 2GB

**Domain:**
- ~$10-15/year (varies by registrar)

**Total Estimated Cost:** ~$0-10/month for small scale

---

## Support and Resources

- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com/
- **Project README:** See README.md
- **Email Setup:** See EMAIL_SETUP.md
- **Admin Setup:** See ADMIN_SETUP.md

---

## Next Steps After Deployment

1. Test all features thoroughly
2. Set up monitoring/alerts
3. Configure analytics (Google Analytics, etc.)
4. Set up regular database backups
5. Document any custom workflows
6. Train admin users
7. Plan for scaling (if needed)

---

## Contact

For deployment issues or questions, refer to project documentation or check Vercel support.
