# Cloudinary Image Upload Setup Guide

This guide will help you set up Cloudinary for handling event images in The Fever Collective application.

## Why Cloudinary?

- **Free Tier**: 25 GB storage, 25 GB bandwidth/month, 25k transformations
- **No MongoDB Storage Costs**: Images are stored on Cloudinary's servers, not in your database
- **Automatic Optimization**: Images are automatically optimized for web delivery
- **CDN Delivery**: Fast image loading from servers worldwide
- **Easy Integration**: Already configured in this project

## Step 1: Create a Free Cloudinary Account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up with your email (or use Google/GitHub login)
3. Verify your email address
4. Complete the registration

## Step 2: Get Your Cloudinary Credentials

After logging in to your Cloudinary dashboard:

1. You'll see your **Account Details** on the dashboard homepage
2. Look for these three values:
   - **Cloud Name**: Your unique Cloudinary cloud name
   - **API Key**: Your API key (looks like a number)
   - **API Secret**: Your API secret (click "Show" to reveal it)

3. Click the "Copy" button next to each value to copy them

## Step 3: Update Your Environment Variables

### For Local Development:

Open `server/.env` and update these lines:

```env
# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Replace** the placeholder values with your actual Cloudinary credentials.

### For Production (Vercel):

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** ’ **Environment Variables**
4. Add these three variables:
   - `CLOUDINARY_CLOUD_NAME` = your cloud name
   - `CLOUDINARY_API_KEY` = your API key
   - `CLOUDINARY_API_SECRET` = your API secret

5. Click **Save**
6. **Redeploy** your application for changes to take effect

## Step 4: Test the Image Upload

1. Start your local server: `cd server && npm start`
2. Go to the Admin Dashboard at `http://localhost:3000/admin`
3. Click **Create New Event**
4. Fill in the event details
5. Click **Choose File** under "Event Image"
6. Select an image (JPG, PNG, or WEBP, max 5MB)
7. You'll see a preview of the image
8. Click **Create Event**
9. The image will be uploaded to Cloudinary and the URL will be saved

## How It Works

1. **Admin uploads image**: When you create/edit an event, you can upload an image
2. **Image goes to Cloudinary**: The image is sent to Cloudinary's servers
3. **URL is saved in MongoDB**: Only the image URL is stored in your database (not the actual image)
4. **Image is displayed**: The event page loads the image from Cloudinary's CDN

## Image Configuration

Images are automatically:
- **Limited to 1200x800 pixels** (maintains aspect ratio)
- **Stored in folder**: `fever-collective/events` on Cloudinary
- **Optimized for web**: Cloudinary automatically compresses and optimizes
- **Limited to 5MB** file size per upload

## Supported Formats

- JPG/JPEG
- PNG
- WEBP

## Troubleshooting

### "Image upload failed" error
- Check that your Cloudinary credentials are correct in `.env`
- Verify the API Secret is copied correctly (it's case-sensitive)
- Make sure the file is under 5MB
- Check the file format is JPG, PNG, or WEBP

### Images not appearing
- Check the browser console for errors
- Verify the imageUrl is saved in the database
- Make sure Cloudinary credentials are set in Vercel environment variables

### "No file uploaded" error
- Make sure you selected a file before submitting
- Try a different image file

## Free Tier Limits

Cloudinary's free tier includes:
- **25 GB** storage
- **25 GB** bandwidth per month
- **25,000** transformations per month

For a small to medium events site, this should last you a **very long time**. At ~1-2 MB per image:
- You can store ~12,500 - 25,000 images
- Serve thousands of page views per month

## Monitoring Usage

Check your Cloudinary usage:
1. Log in to [Cloudinary Dashboard](https://cloudinary.com/console)
2. View your usage under **Dashboard** ’ **Usage**
3. Monitor storage, bandwidth, and transformations

## Need Help?

- Cloudinary Documentation: [https://cloudinary.com/documentation](https://cloudinary.com/documentation)
- Support: Available through Cloudinary dashboard (even on free tier)

## What's Next?

Once Cloudinary is set up:
1. You can upload images for all your events
2. Images will load fast from Cloudinary's CDN
3. Your MongoDB costs stay low (only storing URLs)
4. Images are automatically optimized for web delivery

Enjoy your new image upload capability! <‰
