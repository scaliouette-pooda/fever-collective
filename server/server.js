const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const winston = require('winston');

dotenv.config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const app = express();

const allowedOrigins = [
  'https://thefeverstudio.com',
  'https://thefevercollective.com',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    }
    // Allow Vercel preview deployments (fever-collective-*.vercel.app)
    else if (origin && origin.match(/https:\/\/fever-collective-.*\.vercel\.app$/)) {
      console.log('✅ CORS allowed Vercel preview:', origin);
      callback(null, true);
    }
    else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  logger.info('MongoDB connected');

  // Initialize email scheduler after database connection
  const { initializeEmailScheduler } = require('./services/emailScheduler');
  initializeEmailScheduler();

  // Initialize SMS service (Twilio)
  const { initializeTwilio } = require('./services/smsService');
  initializeTwilio();
})
.catch(err => logger.error('MongoDB connection error:', err));

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const settingsRoutes = require('./routes/settings');
const promoCodeRoutes = require('./routes/promoCodes');
const emailCampaignRoutes = require('./routes/emailCampaigns');
const emailListRoutes = require('./routes/emailLists');
const emailSubscriberRoutes = require('./routes/emailSubscribers');
const uploadRoutes = require('./routes/upload');
const waitlistRoutes = require('./routes/waitlist');
const reviewRoutes = require('./routes/reviews');
const referralRoutes = require('./routes/referrals');
const waiverRoutes = require('./routes/waivers');
const membershipRoutes = require('./routes/memberships');
const userRoutes = require('./routes/users');
const automatedCampaignRoutes = require('./routes/automatedCampaigns');
const classPassAnalyticsRoutes = require('./routes/classpassAnalytics');
const emailTrackingRoutes = require('./routes/emailTracking');

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/email-campaigns', emailCampaignRoutes);
app.use('/api/email-lists', emailListRoutes);
app.use('/api/email-subscribers', emailSubscriberRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/waivers', waiverRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/users', userRoutes);
app.use('/api/automated-campaigns', automatedCampaignRoutes);
app.use('/api/classpass-analytics', classPassAnalyticsRoutes);
app.use('/api/email-tracking', emailTrackingRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'The Fever Studio API' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
