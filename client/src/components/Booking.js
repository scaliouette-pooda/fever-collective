import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import './Booking.css';

function Booking() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    spots: 1,
    paymentMethod: 'venmo'
  });
  const [promoCode, setPromoCode] = useState('');
  const [promoData, setPromoData] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [waitlistData, setWaitlistData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/api/events/${eventId}`);
      setEvent(response.data);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setValidatingPromo(true);
    setPromoError('');
    setPromoData(null);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const totalAmount = event.price * formData.spots;

      const response = await api.post('/api/promo-codes/validate', {
        code: promoCode.toUpperCase(),
        eventId: event._id,
        amount: totalAmount,
        userId: user.id
      });

      setPromoData(response.data);
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoError(error.response?.data?.error || 'Invalid promo code');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoData(null);
    setPromoError('');
  };

  const handleWaitlistChange = (e) => {
    setWaitlistData({
      ...waitlistData,
      [e.target.name]: e.target.value
    });
  };

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/waitlist', {
        eventId,
        ...waitlistData
      });

      alert(`✅ Added to Waitlist!\n\nYour position: #${response.data.position}\n\nWe'll notify you immediately if a spot becomes available.`);
      setShowWaitlistForm(false);
      setWaitlistData({ name: '', email: '', phone: '' });
    } catch (error) {
      console.error('Error joining waitlist:', error);
      alert(error.response?.data?.error || 'Failed to join waitlist. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const bookingData = {
        ...formData,
        eventId
      };

      // Include promo code if applied
      if (promoData) {
        bookingData.promoCodeId = promoData.promoCode.id;
        bookingData.promoCode = promoData.promoCode.code;
      }

      const response = await api.post('/api/bookings', bookingData);

      const { booking, paymentUrl } = response.data;

      // Open payment in popup window
      const width = 600;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        paymentUrl,
        'PaymentWindow',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        alert('Please allow popups for this site to complete payment.');
        return;
      }

      popup.focus();

      // Show success message with confirmation prompt
      const userConfirmed = window.confirm(
        `Booking created!\n\nBooking ID: ${booking._id}\nAmount: $${booking.totalAmount}\n\nA payment window has opened. After completing payment, click OK to confirm.\n\nClick Cancel to confirm payment later.`
      );

      if (userConfirmed) {
        // User says they completed payment
        try {
          await api.post(`/api/bookings/${booking._id}/confirm-payment`);
          // Redirect to confirmation page with QR code
          navigate(`/confirmation/${booking._id}`);
        } catch (err) {
          console.error('Error confirming payment:', err);
          alert('Failed to confirm payment. Please contact support with your booking ID: ' + booking._id);
          navigate('/events');
        }
      } else {
        alert(`Booking saved!\n\nBooking ID: ${booking._id}\n\nPlease complete payment and contact us to confirm. Check your email for details.`);
        // Still redirect to confirmation page
        navigate(`/confirmation/${booking._id}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    }
  };

  if (loading) return <div className="container loading">Loading...</div>;
  if (!event) return <div className="container">Event not found</div>;

  return (
    <div className="booking-page">
      <div className="booking-header">
        <h1>{event.title}</h1>
        <p className="booking-instructor">with {event.instructor}</p>
      </div>

      <div className="booking-container">
        <div className="booking-details">
          <div className="event-summary">
            <h2>Event Details</h2>
            <div className="detail-item">
              <span className="detail-label">Date</span>
              <span className="detail-value">
                {new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Time</span>
              <span className="detail-value">{event.time}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Location</span>
              <span className="detail-value">{event.location}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Address</span>
              <span className="detail-value">{event.address}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Level</span>
              <span className="detail-value">{event.level}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Price</span>
              <span className="detail-value">${event.price} per person</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Available</span>
              <span className="detail-value">{event.availableSpots} spots remaining</span>
            </div>
          </div>

          <div className="event-description">
            <p>{event.description}</p>
          </div>
        </div>

        <div className="booking-form-container">
          {event.availableSpots === 0 ? (
            <>
              <h2>Event Sold Out</h2>
              <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'rgba(232, 232, 232, 0.7)' }}>
                This event is currently full. Join the waitlist to be notified if a spot opens up.
              </p>

              {!showWaitlistForm ? (
                <button
                  type="button"
                  onClick={() => setShowWaitlistForm(true)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    backgroundColor: '#c9a86a',
                    color: '#1a1a1a',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: '600'
                  }}
                >
                  Join Waitlist
                </button>
              ) : (
                <form onSubmit={handleJoinWaitlist} className="booking-form">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={waitlistData.name}
                      onChange={handleWaitlistChange}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={waitlistData.email}
                      onChange={handleWaitlistChange}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone (Optional)</label>
                    <input
                      type="tel"
                      name="phone"
                      value={waitlistData.phone}
                      onChange={handleWaitlistChange}
                      placeholder="(123) 456-7890"
                    />
                  </div>

                  <button type="submit">Join Waitlist</button>
                  <button
                    type="button"
                    onClick={() => setShowWaitlistForm(false)}
                    style={{
                      marginTop: '1rem',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    Cancel
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <h2>Complete Your Booking</h2>
              <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(123) 456-7890"
                required
              />
            </div>

            <div className="form-group">
              <label>Number of Spots</label>
              <select
                name="spots"
                value={formData.spots}
                onChange={handleChange}
                required
              >
                {[...Array(Math.min(event.availableSpots, 5))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Payment Method</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                required
              >
                <option value="venmo">Venmo</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            {/* Promo Code Section */}
            <div className="promo-code-section">
              <label>Promo Code (Optional)</label>
              {!promoData ? (
                <div className="promo-input-group">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    disabled={validatingPromo}
                    style={{ textTransform: 'uppercase' }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={validatingPromo || !promoCode.trim()}
                    className="apply-promo-btn"
                  >
                    {validatingPromo ? 'Validating...' : 'Apply'}
                  </button>
                </div>
              ) : (
                <div className="promo-applied">
                  <div className="promo-success">
                    <span>✓ {promoData.promoCode.code} applied!</span>
                    <span className="promo-desc">{promoData.promoCode.description}</span>
                  </div>
                  <button type="button" onClick={handleRemovePromo} className="remove-promo-btn">
                    Remove
                  </button>
                </div>
              )}
              {promoError && (
                <div className="promo-error">{promoError}</div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="booking-total">
              <div className="price-row">
                <span>Subtotal ({formData.spots} {formData.spots === 1 ? 'spot' : 'spots'})</span>
                <span>${event.price * formData.spots}</span>
              </div>
              {promoData && (
                <div className="price-row discount-row">
                  <span>Discount ({promoData.promoCode.code})</span>
                  <span className="discount-amount">-${promoData.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="price-row total-row">
                <span>Total</span>
                <span className="total-amount">
                  ${promoData ? promoData.finalAmount.toFixed(2) : (event.price * formData.spots).toFixed(2)}
                </span>
              </div>
            </div>

            <button type="submit" className="booking-submit">Proceed to Payment</button>
          </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Booking;
