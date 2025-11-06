import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../config/api';
import './Booking.css';

function Booking() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    spots: 1,
    paymentMethod: 'venmo'
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/bookings', {
        ...formData,
        eventId
      });

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
          const confirmResponse = await api.post(`/api/bookings/${booking._id}/confirm-payment`);
          const confirmationNumber = confirmResponse.data.confirmationNumber || `FC${booking._id.substring(0, 6).toUpperCase()}`;

          alert(`✅ Payment Confirmed!\n\nConfirmation Number: ${confirmationNumber}\n\nYou will receive an email receipt shortly with your booking details.`);
        } catch (err) {
          console.error('Error confirming payment:', err);
          alert('Failed to confirm payment. Please contact support with your booking ID: ' + booking._id);
        }
      } else {
        alert(`Booking saved!\n\nBooking ID: ${booking._id}\n\nPlease complete payment and contact us to confirm. Check your email for details.`);
      }

      // Redirect to events page
      navigate('/events');
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

            <div className="booking-total">
              <span>Total</span>
              <span className="total-amount">${event.price * formData.spots}</span>
            </div>

            <button type="submit" className="booking-submit">Proceed to Payment</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Booking;
