import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Booking.css';

function Booking() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    spots: 1
  });

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`/api/events/${eventId}`);
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
      const response = await axios.post('/api/bookings', {
        ...formData,
        eventId
      });

      // Redirect to payment
      window.location.href = response.data.paymentUrl;
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
