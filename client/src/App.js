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
            /* Visual Style Customizer - CSS Variables */
            /* All colors and styles are controlled from Admin Dashboard > CSS Editor */

            :root {
              /* Main Colors */
              --primary-color: ${sc.primaryColor || '#c9a86a'};
              --background-color: ${sc.backgroundColor || '#1a1a1a'};
              --secondary-background: ${sc.secondaryBackground || '#2a2a2a'};

              /* Text Colors */
              --text-color: ${sc.textColor || '#e8e8e8'};
              --heading-color: ${sc.headingColor || '#ffffff'};
              --muted-text-color: ${sc.mutedTextColor || '#b8b8b8'};
              --label-color: ${sc.labelColor || '#e8e8e8'};

              /* Interactive Elements */
              --link-color: ${sc.linkColor || sc.primaryColor || '#c9a86a'};
              --link-hover-color: ${sc.linkHoverColor || '#d4b97a'};
              --button-hover-color: ${sc.buttonHoverColor || '#d4b97a'};

              /* Borders */
              --border-color: ${sc.borderColor || '#333333'};

              /* Status Colors */
              --success-color: ${sc.successColor || '#4caf50'};
              --warning-color: ${sc.warningColor || '#ff9800'};
              --error-color: ${sc.errorColor || '#f44336'};

              /* Typography */
              --font-family: ${sc.fontFamily || 'Arial, sans-serif'};
              --font-size: ${sc.fontSize || '16px'};
              --body-font-weight: ${sc.bodyFontWeight || '400'};
              --h1-font-size: ${sc.h1FontSize || '4rem'};
              --h1-font-weight: ${sc.h1FontWeight || '200'};
              --h2-font-size: ${sc.h2FontSize || '2rem'};
              --h2-font-weight: ${sc.h2FontWeight || '300'};
              --h3-font-size: ${sc.h3FontSize || '1.5rem'};
              --h3-font-weight: ${sc.h3FontWeight || '300'};

              /* Layout */
              --section-padding: ${sc.sectionPadding || '4rem'};
              --button-radius: ${sc.buttonRadius || '0'};
              --max-width: ${sc.maxWidth || '1400px'};

              /* Navigation */
              --nav-background: ${sc.navBackgroundColor || '#000000'};
              --nav-text-color: ${sc.navTextColor || '#e8e8e8'};
              --nav-height: ${sc.navHeight || '5rem'};

              /* Events */
              --event-card-background: ${sc.eventCardBackground || '#1a1a1a'};
              --event-card-border: ${sc.eventCardBorder || '#c9a86a'};
              --event-card-radius: ${sc.eventCardRadius || '0'};

              /* Forms */
              --input-background: ${sc.inputBackground || '#2a2a2a'};
              --input-border: ${sc.inputBorder || '#c9a86a'};
              --input-text-color: ${sc.inputTextColor || '#e8e8e8'};
            }

            /* Apply CSS Variables to Elements */

            body {
              background-color: var(--background-color) !important;
              color: var(--text-color) !important;
              font-family: var(--font-family) !important;
              font-size: var(--font-size) !important;
              font-weight: var(--body-font-weight) !important;
            }

            /* Headings */
            h1, h2, h3, h4, h5, h6 {
              color: var(--heading-color) !important;
            }

            h1 {
              font-size: var(--h1-font-size) !important;
              font-weight: var(--h1-font-weight) !important;
            }

            h2 {
              font-size: var(--h2-font-size) !important;
              font-weight: var(--h2-font-weight) !important;
            }

            h3 {
              font-size: var(--h3-font-size) !important;
              font-weight: var(--h3-font-weight) !important;
            }

            /* Links */
            a {
              color: var(--link-color) !important;
            }

            a:hover {
              color: var(--link-hover-color) !important;
            }

            /* Labels */
            label {
              color: var(--label-color) !important;
            }

            /* Buttons */
            button,
            .btn-primary,
            .hero button,
            .cta button,
            .submit-button {
              background-color: var(--primary-color) !important;
              border-radius: var(--button-radius) !important;
            }

            button:hover,
            .btn-primary:hover,
            .hero button:hover,
            .cta button:hover,
            .submit-button:hover {
              background-color: var(--button-hover-color) !important;
            }

            /* Backgrounds */
            .form-group,
            .settings-card,
            .card,
            .event-summary,
            .booking-form-container,
            select option {
              background-color: var(--secondary-background) !important;
            }

            /* Borders */
            .border,
            .event-item,
            .value-card,
            input,
            textarea,
            select {
              border-color: var(--border-color) !important;
            }

            /* Muted text */
            .tagline,
            .cta p,
            .muted,
            .text-muted,
            .detail-label,
            small {
              color: var(--muted-text-color) !important;
            }

            /* Status colors */
            .success,
            .status-active,
            .status-confirmed {
              color: var(--success-color) !important;
            }

            .warning,
            .status-pending,
            .status-waitlist {
              color: var(--warning-color) !important;
            }

            .error,
            .status-cancelled,
            .status-failed {
              color: var(--error-color) !important;
            }

            /* Section padding */
            .hero,
            .about,
            .mission,
            .values,
            .approach,
            .cta,
            section {
              padding: var(--section-padding) 2rem !important;
            }

            /* Maximum width */
            .hero-content,
            .about-grid,
            .mission-content,
            .values-grid,
            .approach-content,
            .cta-content {
              max-width: var(--max-width) !important;
              margin-left: auto !important;
              margin-right: auto !important;
            }

            /* Navigation */
            nav,
            .navigation {
              background-color: var(--nav-background) !important;
              height: var(--nav-height) !important;
            }

            nav a,
            .navigation a,
            .nav-links a {
              color: var(--nav-text-color) !important;
            }

            /* Events */
            .event-card,
            .class-card {
              background-color: var(--event-card-background) !important;
              border-color: var(--event-card-border) !important;
              border-radius: var(--event-card-radius) !important;
            }

            /* Forms */
            input,
            textarea,
            select {
              background-color: var(--input-background) !important;
              border-color: var(--input-border) !important;
              color: var(--input-text-color) !important;
            }

            input:focus,
            textarea:focus,
            select:focus {
              border-color: var(--primary-color) !important;
            }

            /* Visibility */
            ${sc.showSocialLinks === false ? `.social-links { display: none !important; }` : ''}
            ${sc.showFooter === false ? `footer { display: none !important; }` : ''}
          `;
        }

        // Append custom CSS if exists
        if (response.data?.customCSS) {
          generatedCSS += '\\n\\n/* Custom CSS */\\n' + response.data.customCSS;
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
