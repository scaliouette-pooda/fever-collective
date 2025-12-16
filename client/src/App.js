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
    // Fetch custom CSS and generate from visual settings
    const fetchCustomCSS = async () => {
      try {
        const response = await api.get('/api/settings');
        let generatedCSS = '';

        // Generate CSS from visual customizer settings
        if (response.data?.styleCustomizer) {
          const sc = response.data.styleCustomizer;

          generatedCSS = `
            /* Visual Style Customizer Generated CSS */
            body {
              background-color: ${sc.backgroundColor || '#1a1a1a'} !important;
              color: ${sc.textColor || '#e8e8e8'} !important;
              font-family: ${sc.fontFamily || 'Arial, sans-serif'} !important;
              font-size: ${sc.fontSize || '16px'} !important;
            }

            h1, h2, h3, h4, h5, h6 {
              color: ${sc.headingColor || '#ffffff'} !important;
              font-weight: ${sc.headingWeight || '600'} !important;
            }

            /* Primary color for buttons and accents */
            button,
            .btn-primary,
            .hero button,
            .cta button,
            .submit-button {
              background-color: ${sc.primaryColor || '#c9a86a'} !important;
              border-radius: ${sc.buttonRadius || '0'} !important;
            }

            a {
              color: ${sc.primaryColor || '#c9a86a'} !important;
            }

            /* Section padding */
            .hero,
            .about,
            .mission,
            .values,
            .approach,
            .cta,
            section {
              padding: ${sc.sectionPadding || '4rem'} 2rem !important;
            }

            /* Maximum width */
            .hero-content,
            .about-grid,
            .mission-content,
            .values-grid,
            .approach-content,
            .cta-content {
              max-width: ${sc.maxWidth || '1400px'} !important;
              margin-left: auto !important;
              margin-right: auto !important;
            }

            /* Visibility controls */
            ${sc.showSocialLinks === false ? `.social-links { display: none !important; }` : ''}
            ${sc.showFooter === false ? `footer { display: none !important; }` : ''}
          `;
        }

        // Append custom CSS if exists
        if (response.data?.customCSS) {
          generatedCSS += '\n\n/* Custom CSS */\n' + response.data.customCSS;
        }

        if (generatedCSS) {
          setCustomCSS(generatedCSS);
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
