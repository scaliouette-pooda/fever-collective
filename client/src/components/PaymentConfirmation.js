import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';
import './PaymentConfirmation.css';

function PaymentConfirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/api/bookings/${bookingId}`);
      setBooking(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError('Could not find booking. Please contact support.');
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setConfirming(true);
    try {
      await api.post(`/api/bookings/${bookingId}/confirm-payment`);
      alert('Payment confirmed! You will receive a confirmation email shortly.');
      navigate('/events');
    } catch (err) {
      console.error('Error confirming payment:', err);
      setError('Failed to confirm payment. Please try again or contact support.');
      setConfirming(false);
    }
  };

  if (loading) {
    return <div className="payment-confirmation-loading">Loading booking details...</div>;
  }

  if (error) {
    return (
      <div className="payment-confirmation-container">
        <div className="payment-confirmation-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/events')}>Back to Events</button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-confirmation-container">
      <div className="payment-confirmation-card">
        <h1>Payment Confirmation</h1>

        {booking.paymentStatus === 'completed' ? (
          <div className="payment-success">
            <div className="success-icon">✓</div>
            <h2>Payment Already Confirmed!</h2>
            <p>Your booking has been confirmed and you should have received an email.</p>
          </div>
        ) : (
          <div className="payment-pending">
            <h2>Complete Your Payment</h2>
            <p>Please confirm that you have completed the payment via Venmo.</p>

            <div className="booking-details">
              <h3>Booking Details</h3>
              <div className="detail-row">
                <span className="label">Event:</span>
                <span className="value">{booking.event?.title || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="label">Date:</span>
                <span className="value">
                  {booking.event?.date ? new Date(booking.event.date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Spots:</span>
                <span className="value">{booking.spots}</span>
              </div>
              <div className="detail-row">
                <span className="label">Total Amount:</span>
                <span className="value">${booking.totalAmount}</span>
              </div>
              <div className="detail-row">
                <span className="label">Booking ID:</span>
                <span className="value">{booking._id}</span>
              </div>
            </div>

            <div className="payment-instructions">
              <h3>Payment Instructions</h3>
              <p>1. Complete payment via Venmo to: <strong>@lauryn-caliouette</strong></p>
              <p>2. Amount: <strong>${booking.totalAmount}</strong></p>
              <p>3. Include booking ID in note: <strong>{booking._id.substring(0, 8)}</strong></p>
              <p>4. Click "I've Completed Payment" below after sending</p>
            </div>

            <div className="payment-actions">
              <button
                className="confirm-button"
                onClick={handleConfirmPayment}
                disabled={confirming}
              >
                {confirming ? 'Confirming...' : 'I\'ve Completed Payment'}
              </button>
              <button
                className="back-button"
                onClick={() => navigate('/events')}
                disabled={confirming}
              >
                Back to Events
              </button>
            </div>

            <p className="note">
              Note: Your booking will be reviewed and confirmed by our team shortly.
              You will receive an email confirmation once approved.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentConfirmation;
