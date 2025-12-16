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

            /* Site-wide Styles */
            body {
              background-color: ${sc.backgroundColor || '#1a1a1a'} !important;
              color: ${sc.textColor || '#e8e8e8'} !important;
              font-family: ${sc.fontFamily || 'Arial, sans-serif'} !important;
              font-size: ${sc.fontSize || '16px'} !important;
              font-weight: ${sc.bodyFontWeight || '400'} !important;
            }

            /* Headings */
            h1, h2, h3, h4, h5, h6 {
              color: ${sc.headingColor || '#ffffff'} !important;
              font-weight: ${sc.headingWeight || '600'} !important;
            }

            h1 {
              font-family: ${sc.h1FontFamily || 'inherit'} !important;
              font-size: ${sc.h1FontSize || '4rem'} !important;
              font-weight: ${sc.h1FontWeight || '200'} !important;
            }

            h2 {
              font-size: ${sc.h2FontSize || '2rem'} !important;
              font-weight: ${sc.h2FontWeight || '300'} !important;
            }

            h3 {
              font-size: ${sc.h3FontSize || '1.5rem'} !important;
              font-weight: ${sc.h3FontWeight || '300'} !important;
            }

            /* Links */
            a {
              color: ${sc.linkColor || sc.primaryColor || '#c9a86a'} !important;
            }

            a:hover {
              color: ${sc.linkHoverColor || '#d4b97a'} !important;
            }

            /* Buttons */
            button,
            .btn-primary,
            .hero button,
            .cta button,
            .submit-button {
              background-color: ${sc.primaryColor || '#c9a86a'} !important;
              border-radius: ${sc.buttonRadius || '0'} !important;
            }

            button:hover,
            .btn-primary:hover,
            .hero button:hover,
            .cta button:hover,
            .submit-button:hover {
              background-color: ${sc.buttonHoverColor || '#d4b97a'} !important;
            }

            /* Secondary backgrounds (cards, sections) */
            .about-grid,
            .mission,
            .value-card,
            .approach-item,
            .settings-card,
            .card,
            .section-secondary {
              background-color: ${sc.secondaryBackground || '#2a2a2a'} !important;
            }

            /* Borders */
            .border,
            .about-image img,
            .mission-image img,
            .placeholder-image,
            .placeholder-mission-img,
            .value-card {
              border-color: ${sc.borderColor || 'rgba(255, 255, 255, 0.1)'} !important;
            }

            /* Muted text */
            .tagline,
            .cta p,
            .muted,
            .text-muted,
            small {
              color: ${sc.mutedTextColor || 'rgba(232, 232, 232, 0.7)'} !important;
            }

            /* Status colors */
            .success,
            .status-active,
            .status-confirmed {
              color: ${sc.successColor || '#4caf50'} !important;
            }

            .warning,
            .status-pending,
            .status-waitlist {
              color: ${sc.warningColor || '#ff9800'} !important;
            }

            .error,
            .status-cancelled,
            .status-failed {
              color: ${sc.errorColor || '#f44336'} !important;
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

            /* Navigation Bar */
            nav,
            .navigation {
              background-color: ${sc.navBackgroundColor || '#000000'} !important;
              height: ${sc.navHeight || '5rem'} !important;
            }

            nav a,
            .navigation a,
            .nav-links a {
              color: ${sc.navTextColor || '#e8e8e8'} !important;
            }

            /* Events Page */
            .event-card {
              background-color: ${sc.eventCardBackground || '#1a1a1a'} !important;
              border-color: ${sc.eventCardBorder || '#c9a86a'} !important;
              border-radius: ${sc.eventCardRadius || '0'} !important;
            }

            /* Forms & Inputs */
            input,
            textarea,
            select {
              background-color: ${sc.inputBackground || '#2a2a2a'} !important;
              border-color: ${sc.inputBorder || '#c9a86a'} !important;
              color: ${sc.inputTextColor || '#e8e8e8'} !important;
            }

            input:focus,
            textarea:focus,
            select:focus {
              border-color: ${sc.primaryColor || '#c9a86a'} !important;
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
