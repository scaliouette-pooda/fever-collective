import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';
import './RegistrationConfirmation.css';

function RegistrationConfirmation() {
  return (
    <div className="auth-page">
      <div className="auth-container confirmation-container">
        <div className="auth-header">
          <div className="success-icon">✓</div>
          <h1>Welcome to Fever Collective!</h1>
          <p>Your account has been successfully created</p>
        </div>

        <div className="confirmation-content">
          <h2>What Happens Next?</h2>

          <div className="next-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Sign Your Waiver</h3>
                <p>Before attending your first class, you'll need to sign our waiver. Don't worry - you'll be prompted to do this when you book your first event.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Explore Our Classes</h3>
                <p>Browse our weekly schedule and discover transformative experiences. We offer a variety of classes at different times throughout the week.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Book Your First Experience</h3>
                <p>You can book individual classes or explore our membership options for better rates and exclusive benefits.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Join the Community</h3>
                <p>Connect with other members, track your progress, and unlock rewards as you attend more classes.</p>
              </div>
            </div>
          </div>

          <div className="confirmation-actions">
            <Link to="/events">
              <button className="btn-primary">Browse Classes</button>
            </Link>
            <Link to="/memberships">
              <button className="btn-secondary">View Memberships</button>
            </Link>
          </div>

          <div className="auth-footer">
            <p>Ready to get started? <Link to="/login">Login to your account</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrationConfirmation;
