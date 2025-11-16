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

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
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
.then(() => logger.info('MongoDB connected'))
.catch(err => logger.error('MongoDB connection error:', err));

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const settingsRoutes = require('./routes/settings');
const promoCodeRoutes = require('./routes/promoCodes');
const emailCampaignRoutes = require('./routes/emailCampaigns');
const uploadRoutes = require('./routes/upload');
const waitlistRoutes = require('./routes/waitlist');
const reviewRoutes = require('./routes/reviews');
const referralRoutes = require('./routes/referrals');
const classPackRoutes = require('./routes/classPacks');

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/email-campaigns', emailCampaignRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/class-packs', classPackRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'The Fever Studio API' });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
