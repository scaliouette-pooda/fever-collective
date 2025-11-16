import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../config/api';
import WaiverModal from './WaiverModal';
import './MembershipCheckout.css';

function MembershipCheckout() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedTier = location.state?.tier;
  const isUpgrade = location.state?.isUpgrade || false;
  const currentMembership = location.state?.currentMembership;

  const [user, setUser] = useState(null);
  const [hasWaiver, setHasWaiver] = useState(false);
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [formData, setFormData] = useState({
    paymentMethod: 'cash',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Review, 2: Waiver, 3: Payment

  // Calculate upgrade discount (15% off first month)
  const upgradeDiscount = isUpgrade ? 0.15 : 0;
  const discountedPrice = selectedTier ? selectedTier.price * (1 - upgradeDiscount) : 0;

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.id) {
      navigate('/login', { state: { returnTo: '/memberships' } });
      return;
    }
    setUser(userData);
    checkWaiverStatus(userData.id);
  }, [navigate]);

  useEffect(() => {
    if (!selectedTier) {
      navigate('/memberships');
    }
  }, [selectedTier, navigate]);

  const checkWaiverStatus = async (userId) => {
    try {
      const response = await api.get(`/api/waivers/check/${userId}`);
      setHasWaiver(response.data.hasValidWaiver);
    } catch (error) {
      console.error('Error checking waiver status:', error);
    }
  };

  const handleWaiverComplete = () => {
    setHasWaiver(true);
    setShowWaiverModal(false);
    setStep(3);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasWaiver) {
      setError('Please sign the liability waiver before completing your membership signup.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/memberships/admin/assign', {
        userId: user.id,
        membershipTierId: selectedTier._id,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        startDate: new Date()
      });

      // Success - redirect to profile with success message
      navigate('/profile', {
        state: {
          message: `Welcome to ${selectedTier.displayName}! Your membership is now active.`,
          membershipId: response.data.membership._id
        }
      });
    } catch (error) {
      console.error('Error creating membership:', error);
      setError(error.response?.data?.message || 'Failed to create membership. Please contact us.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedTier || !user) {
    return (
      <div className="membership-checkout">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  const isFounderTier = selectedTier.pricingTier.startsWith('founders');
  const slotsRemaining = isFounderTier && selectedTier.founderSlotsTotal
    ? selectedTier.founderSlotsTotal - selectedTier.founderSlotsUsed
    : null;

  return (
    <div className="membership-checkout">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Complete Your Membership</h1>
          <div className="progress-steps">
            <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Review</span>
            </div>
            <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Waiver</span>
            </div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Payment</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Step 1: Review Membership */}
        {step === 1 && (
          <div className="checkout-step">
            <div className="tier-review-card">
              <div className="tier-review-header">
                <h2>{selectedTier.displayName}</h2>
                {isFounderTier && (
                  <span className="badge-founder">FOUNDERS RATE</span>
                )}
                {isUpgrade && (
                  <span className="badge-founder" style={{ background: '#4caf50' }}>
                    UPGRADE DISCOUNT
                  </span>
                )}
              </div>

              {isUpgrade && currentMembership && (
                <div className="upgrade-notice">
                  <p>
                    <strong>Current:</strong> {currentMembership.membershipTier?.displayName} (${currentMembership.membershipTier?.price}/mo)
                  </p>
                  <p>
                    <strong>→ Upgrading to:</strong> {selectedTier.displayName}
                  </p>
                </div>
              )}

              <div className="tier-review-price">
                {isUpgrade && upgradeDiscount > 0 ? (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                      <span style={{
                        fontSize: '20px',
                        color: '#999',
                        textDecoration: 'line-through'
                      }}>
                        ${selectedTier.price}
                      </span>
                      <span style={{
                        fontSize: '16px',
                        color: '#4caf50',
                        marginLeft: '10px',
                        fontWeight: '600'
                      }}>
                        15% OFF FIRST MONTH
                      </span>
                    </div>
                    <div>
                      <span className="price-amount">${discountedPrice.toFixed(2)}</span>
                      <span className="price-period">/month*</span>
                    </div>
                    <p style={{
                      fontSize: '12px',
                      color: '#666',
                      textAlign: 'center',
                      marginTop: '10px'
                    }}>
                      *${selectedTier.price}/month thereafter
                    </p>
                  </>
                ) : (
                  <>
                    <span className="price-amount">${selectedTier.price}</span>
                    <span className="price-period">/month</span>
                  </>
                )}
              </div>

              {slotsRemaining !== null && slotsRemaining > 0 && (
                <div className="slots-info">
                  <strong>{slotsRemaining}</strong> founder spots remaining
                </div>
              )}

              <div className="tier-review-benefits">
                <h3>What's Included:</h3>
                <ul>
                  {selectedTier.benefits.map((benefit, index) => (
                    <li key={index}>
                      <span className="checkmark">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tier-review-details">
                <h3>Membership Details:</h3>
                <ul>
                  <li>Month-to-month commitment</li>
                  <li>30-day cancellation notice required</li>
                  <li>Access to all milestone rewards</li>
                  <li>Referral program eligible ($50 off per referral)</li>
                  {selectedTier.classesPerMonth && (
                    <li>Credits expire after 2 months</li>
                  )}
                </ul>
              </div>

              <button
                className="btn-primary btn-large"
                onClick={() => setStep(2)}
              >
                Continue to Waiver
              </button>
              <button
                className="btn-secondary btn-large"
                onClick={() => navigate('/memberships')}
              >
                Change Membership
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Waiver */}
        {step === 2 && (
          <div className="checkout-step">
            <div className="waiver-step-card">
              <h2>🔥 Ready to Get Heated?</h2>
              <p>
                Let's make it official. Sign your waiver so we can get you into the studio
                and transforming. Quick, simple, and gets you one step closer to your first class.
              </p>

              {hasWaiver ? (
                <div className="waiver-completed">
                  <div className="success-icon">✓</div>
                  <h3>You're All Set!</h3>
                  <p>Your waiver is signed and ready. Let's move forward with your membership.</p>
                  <button
                    className="btn-primary btn-large"
                    onClick={() => setStep(3)}
                  >
                    Continue to Payment
                  </button>
                </div>
              ) : (
                <div className="waiver-required">
                  <button
                    className="btn-primary btn-large"
                    onClick={() => setShowWaiverModal(true)}
                  >
                    Sign Your Waiver
                  </button>
                  <p style={{
                    fontSize: '14px',
                    color: '#999',
                    marginTop: '15px',
                    textAlign: 'center'
                  }}>
                    Takes less than 2 minutes
                  </p>
                </div>
              )}

              <button
                className="btn-secondary btn-large"
                onClick={() => setStep(1)}
              >
                Back to Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="checkout-step">
            <form onSubmit={handleSubmit} className="payment-form-card">
              <h2>Payment Information</h2>

              <div className="payment-summary">
                <div className="summary-row">
                  <span>Membership:</span>
                  <strong>{selectedTier.displayName}</strong>
                </div>
                {isUpgrade && (
                  <div className="summary-row">
                    <span>Current Membership:</span>
                    <strong>{currentMembership.membershipTier?.displayName}</strong>
                  </div>
                )}
                <div className="summary-row">
                  <span>Monthly Rate:</span>
                  <strong>${selectedTier.price}/month</strong>
                </div>
                {isUpgrade && upgradeDiscount > 0 && (
                  <div className="summary-row" style={{ color: '#4caf50' }}>
                    <span>Upgrade Discount (15%):</span>
                    <strong>-${(selectedTier.price * upgradeDiscount).toFixed(2)}</strong>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Due Today:</span>
                  <strong>${isUpgrade ? discountedPrice.toFixed(2) : selectedTier.price}</strong>
                </div>
                {isUpgrade && (
                  <p style={{
                    fontSize: '13px',
                    color: '#666',
                    textAlign: 'center',
                    marginTop: '10px',
                    fontStyle: 'italic'
                  }}>
                    Regular price of ${selectedTier.price}/month applies from next billing cycle
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method</label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="venmo">Venmo</option>
                  <option value="zelle">Zelle</option>
                  <option value="credit-card">Credit Card (In Person)</option>
                </select>
                <p className="form-help">
                  We're currently in manual payment mode. Our team will contact you
                  to complete payment processing.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Additional Notes (Optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Any special requests or questions..."
                />
              </div>

              <div className="payment-notice">
                <h4>What Happens Next:</h4>
                <ol>
                  <li>Your membership will be created as "Pending Payment"</li>
                  <li>Our team will contact you within 24 hours to complete payment</li>
                  <li>Once payment is confirmed, your membership activates immediately</li>
                  <li>You'll receive a confirmation email with booking instructions</li>
                </ol>
              </div>

              <button
                type="submit"
                className="btn-primary btn-large"
                disabled={loading || !hasWaiver}
              >
                {loading ? 'Processing...' : 'Complete Signup'}
              </button>

              <button
                type="button"
                className="btn-secondary btn-large"
                onClick={() => setStep(2)}
                disabled={loading}
              >
                Back to Waiver
              </button>
            </form>
          </div>
        )}
      </div>

      {showWaiverModal && (
        <WaiverModal
          isOpen={showWaiverModal}
          onClose={() => setShowWaiverModal(false)}
          onComplete={handleWaiverComplete}
        />
      )}
    </div>
  );
}

export default MembershipCheckout;
