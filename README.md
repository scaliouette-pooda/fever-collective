# The Fever Collective

A sophisticated pilates popup event booking platform with admin dashboard, event management, and payment processing capabilities.

## Features

✅ **Event Management**
- Browse upcoming pilates popup events
- Filter by skill level (beginner, intermediate, advanced, all levels)
- Detailed event pages with location, pricing, and instructor info

✅ **Booking System**
- Real-time availability tracking
- Secure booking flow
- Payment processing ready (Stripe integration)

✅ **Admin Dashboard**
- Full CRUD operations for events
- Booking management
- Analytics and revenue tracking
- Image upload for events (Cloudinary integration)

✅ **User Authentication**
- JWT-based secure authentication
- Role-based access control
- User registration and login

✅ **Responsive Design**
- Dark, luxury wellness aesthetic inspired by Astral Studio
- Mobile-first responsive design
- Smooth animations and transitions

## Tech Stack

### Frontend
- React 18
- React Router v6
- Axios for API calls
- CSS3 with custom styling

### Backend
- Node.js & Express
- MongoDB with Mongoose
- JWT authentication
- Bcrypt password hashing
- Winston logging
- Multer + Cloudinary for image uploads

### Deployment
- Frontend: Vercel (https://thefevercollective.com)
- Backend: Vercel
- Database: MongoDB Atlas
- Email: Custom SMTP (info@thefevercollective.com)

## Quick Start (Local Development)

### Prerequisites
- Node.js 16+ and npm
- MongoDB (local or Atlas)
- Git

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Configure environment variables - see `ENVIRONMENT_VARIABLES.md` for complete guide

**Server (.env):**
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:3000
PORT=5001
EMAIL_SERVICE=custom
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
```

**Client (.env):**
```
REACT_APP_API_URL=http://localhost:5001
```

### Running the Application

**Development:**

```bash
# Start the server (from server directory)
npm run dev

# Start the client (from client directory)
npm start
```

The client will run on `http://localhost:3000` and the server on `http://localhost:5001`.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create event (auth required)
- `PUT /api/events/:id` - Update event (auth required)
- `DELETE /api/events/:id` - Delete event (auth required)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get all bookings (auth required)
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings/webhook` - Stripe webhook handler

## Project Structure

```
fever-collective/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.js
│   │   │   ├── Schedule.js
│   │   │   ├── Booking.js
│   │   │   ├── Registration.js
│   │   │   └── Login.js
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
└── server/
    ├── config/
    ├── middleware/
    │   ├── auth.js
    │   └── validation.js
    ├── models/
    │   ├── User.js
    │   ├── Event.js
    │   └── Booking.js
    ├── routes/
    │   ├── auth.js
    │   ├── events.js
    │   └── bookings.js
    ├── utils/
    ├── server.js
    └── package.json
```

## Deployment

See `VERCEL_DEPLOYMENT.md` for complete deployment guide.

### Quick Deploy Checklist
1. Set up MongoDB Atlas database
2. Configure environment variables in Vercel
3. Deploy frontend and backend to Vercel
4. Create admin user
5. Test email functionality

For detailed instructions, see:
- `VERCEL_DEPLOYMENT.md` - Vercel deployment guide
- `ENVIRONMENT_VARIABLES.md` - Environment variables reference
- `EMAIL_SETUP.md` - Email configuration
- `ADMIN_SETUP.md` - Admin user setup

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Input sanitization
- Request validation
- CORS configuration
- Secure payment processing with Stripe

## License

MIT
