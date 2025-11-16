import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import './Memberships.css';

function Memberships() {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState({ 'founders-1': [], 'founders-2': [], 'general': [] });
  const [currentMembership, setCurrentMembership] = useState(null);
  const [selectedPricingTier, setSelectedPricingTier] = useState('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchMembershipData();
  }, []);

  const fetchMembershipData = async () => {
    try {
      setLoading(true);

      // Fetch available tiers
      const tiersResponse = await api.get('/api/memberships/tiers');
      setTiers(tiersResponse.data);

      // Check current date to determine default pricing tier
      const now = new Date();
      if (now < new Date('2025-01-01')) {
        setSelectedPricingTier('founders-1');
      } else if (now < new Date('2025-02-01')) {
        setSelectedPricingTier('founders-2');
      } else {
        setSelectedPricingTier('general');
      }

      // Fetch user's current membership if logged in
      if (user.id) {
        try {
          const membershipResponse = await api.get('/api/memberships/my-membership');
          if (membershipResponse.data.hasMembership) {
            setCurrentMembership(membershipResponse.data.membership);
          }
        } catch (err) {
          // User not logged in or no membership
          console.log('No current membership');
        }
      }
    } catch (error) {
      console.error('Error fetching membership data:', error);
      setError('Failed to load membership options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMembership = (tier) => {
    if (!user.id) {
      alert('Please log in or register to select a membership');
      navigate('/login');
      return;
    }

    // For now, show contact message (will be replaced with checkout flow)
    alert(`Great choice! Please contact us to complete your ${tier.displayName} membership signup.\n\nEmail: info@thefeverstudio.com\nPhone: (555) 123-4567`);
  };

  const getPricingTierLabel = (pricingTier) => {
    const labels = {
      'founders-1': 'Founders Tier 1 - Dec 1 (Limited to 100)',
      'founders-2': 'Founders Tier 2 - Jan 1 (Limited to 100)',
      'general': 'General Membership - Feb 1'
    };
    return labels[pricingTier];
  };

  const getPricingTierBadge = (pricingTier) => {
    if (pricingTier.startsWith('founders')) {
      return <span className="badge badge-founder">FOUNDERS RATE</span>;
    }
    return null;
  };

  const getSlotsRemaining = (tier) => {
    if (tier.founderSlotsTotal) {
      const remaining = tier.founderSlotsTotal - tier.founderSlotsUsed;
      return remaining > 0 ? remaining : 0;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="memberships-page">
        <div className="loading">Loading membership options...</div>
      </div>
    );
  }

  const selectedTiers = tiers[selectedPricingTier] || [];
  const isFounderTier = selectedPricingTier.startsWith('founders');

  return (
    <div className="memberships-page">
      <div className="memberships-header">
        <h1>Choose Your Membership</h1>
        <p className="subtitle">
          Select the perfect plan for your fitness journey at Fever
        </p>
        <p className="brand-tagline">
          Get Hot. Get Strong. Get Fever.
        </p>
      </div>

      {currentMembership && (
        <div className="current-membership-banner">
          <div className="banner-content">
            <h3>Your Current Membership</h3>
            <p>
              <strong>{currentMembership.membershipTier === 'fever-starter' ? 'The Fever Starter' :
                       currentMembership.membershipTier === 'outbreak' ? 'The Outbreak' :
                       'The Epidemic'}</strong>
              {' - '}
              {currentMembership.membershipTier === 'epidemic' ? 'Unlimited classes' :
               `${currentMembership.creditsRemaining} of ${currentMembership.creditsTotal} credits remaining`}
            </p>
            <span className={`status-badge status-${currentMembership.status}`}>
              {currentMembership.status}
            </span>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="pricing-tier-selector">
        <h2>Select Pricing Tier</h2>
        <div className="tier-buttons">
          {Object.keys(tiers).map(tierKey => {
            if (tiers[tierKey].length === 0) return null;

            const isAvailable = tierKey === 'founders-1' ? new Date() < new Date('2025-01-01') :
                               tierKey === 'founders-2' ? new Date() < new Date('2025-02-01') :
                               true;

            return (
              <button
                key={tierKey}
                className={`tier-button ${selectedPricingTier === tierKey ? 'active' : ''} ${!isAvailable ? 'disabled' : ''}`}
                onClick={() => isAvailable && setSelectedPricingTier(tierKey)}
                disabled={!isAvailable}
              >
                {getPricingTierLabel(tierKey)}
                {!isAvailable && <span className="unavailable-label">Not Yet Available</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="membership-tiers">
        {selectedTiers.map((tier) => {
          const slotsRemaining = getSlotsRemaining(tier);
          const isSoldOut = slotsRemaining === 0;

          return (
            <div key={tier._id} className={`membership-card ${tier.name} ${isSoldOut ? 'sold-out' : ''}`}>
              {getPricingTierBadge(tier.pricingTier)}
              {tier.name === 'epidemic' && <span className="badge badge-popular">MOST POPULAR</span>}

              <div className="card-header">
                <h2>{tier.displayName}</h2>
                {tier.pricePerClass > 0 && (
                  <p className="price-per-class">${tier.pricePerClass} per class</p>
                )}
              </div>

              <div className="price-section">
                <div className="price">
                  <span className="dollar">$</span>
                  <span className="amount">{tier.price}</span>
                  <span className="period">/month</span>
                </div>
              </div>

              {isFounderTier && slotsRemaining !== null && (
                <div className={`slots-remaining ${slotsRemaining < 20 ? 'low' : ''}`}>
                  {isSoldOut ? (
                    <strong>SOLD OUT</strong>
                  ) : (
                    <>Only <strong>{slotsRemaining}</strong> spots left!</>
                  )}
                </div>
              )}

              <div className="benefits-list">
                {tier.benefits.map((benefit, index) => (
                  <div key={index} className="benefit-item">
                    <span className="checkmark">✓</span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="card-footer">
                <button
                  className="select-button"
                  onClick={() => handleSelectMembership(tier)}
                  disabled={isSoldOut}
                >
                  {isSoldOut ? 'Sold Out' : 'Select Plan'}
                </button>
                {tier.name === 'epidemic' && (
                  <p className="highlight-text">Best value for frequent attendees!</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="additional-info">
        <div className="info-card">
          <h3>Drop-In Rate</h3>
          <p className="drop-in-price">$30 per class</p>
          <p className="info-text">
            Perfect for trying us out! Sign up for any membership the same day and get 15% off your first month.
          </p>
        </div>

        <div className="info-card">
          <h3>Milestone Rewards</h3>
          <div className="milestones">
            <div className="milestone-item">
              <span className="milestone-count">50</span>
              <span className="milestone-reward">Sweat Towel</span>
            </div>
            <div className="milestone-item">
              <span className="milestone-count">100</span>
              <span className="milestone-reward">Tote Bag</span>
            </div>
            <div className="milestone-item">
              <span className="milestone-count">150</span>
              <span className="milestone-reward">Water Bottle</span>
            </div>
            <div className="milestone-item">
              <span className="milestone-count">200</span>
              <span className="milestone-reward">Hat</span>
            </div>
            <div className="milestone-item">
              <span className="milestone-count">250</span>
              <span className="milestone-reward">Hoodie</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <h3>Referral Program</h3>
          <p className="referral-reward">$50 off 1 month</p>
          <p className="info-text">
            Refer a friend and you'll both receive $50 off your next month's membership!
          </p>
        </div>
      </div>

      <div className="membership-faq">
        <h2>Frequently Asked Questions</h2>

        <div className="faq-item">
          <h4>Can I cancel my membership?</h4>
          <p>Yes! All memberships are month-to-month with a 30-day cancellation notice required.</p>
        </div>

        <div className="faq-item">
          <h4>Do my credits expire?</h4>
          <p>Class credits expire after 2 months for Starter and Outbreak tiers. Epidemic members have unlimited access with no expiration.</p>
        </div>

        <div className="faq-item">
          <h4>How do specialty classes work?</h4>
          <p>Specialty classes count as 2 class credits for Starter and Outbreak members. Epidemic members get complimentary access to all specialty classes and pop-up events.</p>
        </div>

        <div className="faq-item">
          <h4>How far in advance can I book?</h4>
          <p>Starter and Outbreak members can book 48 hours in advance. Epidemic members get priority booking up to 72 hours in advance.</p>
        </div>

        <div className="faq-item">
          <h4>Can I upgrade my membership?</h4>
          <p>Absolutely! Upgrade anytime and receive 15% off your first month at the new tier level.</p>
        </div>
      </div>
    </div>
  );
}

export default Memberships;
