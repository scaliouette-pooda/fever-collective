import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import './App.css';
import Navigation from './components/Navigation';
import Home from './components/Home';
import Events from './components/Events';
import Contact from './components/Contact';
import Booking from './components/Booking';
import BookingConfirmation from './components/BookingConfirmation';
import Registration from './components/Registration';
import RegistrationConfirmation from './components/RegistrationConfirmation';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import Memberships from './components/Memberships';
import MembershipCheckout from './components/MembershipCheckout';
import api from './config/api';

function App() {
  const [customCSS, setCustomCSS] = useState('');

  useEffect(() => {
    // Fetch custom CSS from settings
    const fetchCustomCSS = async () => {
      try {
        const response = await api.get('/api/settings');
        if (response.data?.customCSS) {
          setCustomCSS(response.data.customCSS);
        }
      } catch (error) {
        console.error('Error fetching custom CSS:', error);
      }
    };

    fetchCustomCSS();
  }, []);

  return (
    <Router>
      <div className="App">
        {/* Inject custom CSS */}
        {customCSS && (
          <style>{customCSS}</style>
        )}
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/memberships" element={<Memberships />} />
          <Route path="/membership-checkout" element={<MembershipCheckout />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/booking/:eventId" element={<Booking />} />
          <Route path="/confirmation/:bookingId" element={<BookingConfirmation />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/registration-confirmation" element={<RegistrationConfirmation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
        <Analytics />
      </div>
    </Router>
  );
}

export default App;
