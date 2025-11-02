# The Fever Collective

Pilates popup event booking platform with event registration, scheduling, and payment processing.

## Features

- Event schedule display
- User registration and authentication
- Booking system with real-time availability
- Stripe payment integration
- Admin event management
- Responsive design

## Tech Stack

**Frontend:**
- React 18
- React Router
- Axios

**Backend:**
- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Stripe payments
- Winston logging

## Setup

### Prerequisites

- Node.js (v14+)
- MongoDB
- Stripe account

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

3. Configure environment variables:

**Server (.env):**
```
MONGODB_URI=mongodb://localhost:27017/fever-collective
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:3000
PORT=5001
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

**Client (.env):**
```
REACT_APP_API_URL=http://localhost:5001
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
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

### Frontend (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables
3. Deploy from main branch

### Backend (Render/Heroku)
1. Connect GitHub repository
2. Set environment variables
3. Configure build command: `npm install`
4. Configure start command: `npm start`

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Input sanitization
- Request validation
- CORS configuration
- Secure payment processing with Stripe

## License

MIT
