import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode.react';
import api from '../config/api';
import './Auth.css';

function BookingConfirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/api/bookings/${bookingId}`);
      setBooking(response.data);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (!booking) {
    return (
      <div className="container">
        <h2>Booking Not Found</h2>
        <button onClick={() => navigate('/events')}>View Events</button>
      </div>
    );
  }

  const qrData = `BOOKING:${booking._id}`;

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '700px' }}>
        <div className="auth-header">
          <h1>✓ Booking Confirmed</h1>
          <p style={{ color: '#c9a86a', fontSize: '1.2rem', marginTop: '1rem' }}>
            Confirmation #: {booking.confirmationNumber}
          </p>
        </div>

        {/* QR Code Section */}
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          textAlign: 'center',
          margin: '2rem 0',
          border: '2px solid #c9a86a'
        }}>
          <QRCode
            value={qrData}
            size={256}
            level="H"
            includeMargin={true}
          />
          <p style={{
            marginTop: '1rem',
            color: '#1a1a1a',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            Show this QR code at check-in
          </p>
        </div>

        {/* Booking Details */}
        <div style={{
          backgroundColor: 'rgba(201, 168, 106, 0.1)',
          border: '1px solid rgba(201, 168, 106, 0.3)',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#c9a86a' }}>Booking Details</h3>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <strong>Event:</strong>
              <p style={{ marginTop: '0.3rem' }}>{booking.event?.title || 'N/A'}</p>
            </div>

            <div>
              <strong>Date & Time:</strong>
              <p style={{ marginTop: '0.3rem' }}>
                {new Date(booking.event?.date).toLocaleDateString()} at {booking.event?.time}
              </p>
            </div>

            <div>
              <strong>Location:</strong>
              <p style={{ marginTop: '0.3rem' }}>
                {booking.event?.location}
                {booking.event?.address && <><br />{booking.event.address}</>}
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
              <strong>Name:</strong>
              <p style={{ marginTop: '0.3rem' }}>{booking.name}</p>
            </div>

            <div>
              <strong>Email:</strong>
              <p style={{ marginTop: '0.3rem' }}>{booking.email}</p>
            </div>

            <div>
              <strong>Phone:</strong>
              <p style={{ marginTop: '0.3rem' }}>{booking.phone}</p>
            </div>

            <div>
              <strong>Spots:</strong>
              <p style={{ marginTop: '0.3rem' }}>{booking.spots}</p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
              <strong>Total Amount:</strong>
              <p style={{ marginTop: '0.3rem', fontSize: '1.5rem', color: '#c9a86a' }}>
                ${booking.totalAmount}
              </p>
            </div>

            <div>
              <strong>Payment Status:</strong>
              <p style={{ marginTop: '0.3rem', textTransform: 'capitalize' }}>
                {booking.paymentStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '1rem',
              backgroundColor: '#c9a86a',
              color: '#1a1a1a',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Print Confirmation
          </button>

          <button
            onClick={() => navigate('/events')}
            style={{
              padding: '1rem',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#e8e8e8',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Back to Events
          </button>
        </div>

        {/* Important Notes */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '0.9rem'
        }}>
          <h4 style={{ marginBottom: '1rem', color: '#c9a86a' }}>Important:</h4>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li>Save this QR code or bring your confirmation email to the event</li>
            <li>Arrive 10-15 minutes early for check-in</li>
            <li>Check your email for additional event details and updates</li>
            <li>Contact us if you need to make any changes to your booking</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;
