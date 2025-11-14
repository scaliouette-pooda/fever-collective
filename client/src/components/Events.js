import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { LiveBookingNotification, SpotsRemainingBadge } from './SocialProof';
import './Events.css';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container loading">Loading...</div>;

  return (
    <div className="events-page">
      <LiveBookingNotification />

      <div className="events-header">
        <h1>Events</h1>
        <p className="events-subtitle">Discover our upcoming popup experiences</p>
      </div>

      {events.length === 0 ? (
        <div className="no-events">
          <p>No upcoming events at this time.</p>
          <p>Check back soon for new experiences.</p>
        </div>
      ) : (
        <div className="events-list">
          {events.map(event => (
            <div key={event._id} className="event-item">
              <div className="event-item-image">
                {event.imageUrl ? (
                  <img src={event.imageUrl} alt={event.title} />
                ) : (
                  <div className="placeholder-event-img">
                    <span>{event.level}</span>
                  </div>
                )}
              </div>
              <div className="event-item-content">
                <div className="event-item-header">
                  <div>
                    <h3>{event.title}</h3>
                    <p className="event-item-instructor">with {event.instructor}</p>
                  </div>
                  <div className="event-item-price">${event.price}</div>
                </div>
                <div className="event-item-details">
                  <div className="detail">
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
                  <div className="detail">
                    <span className="detail-label">Time</span>
                    <span className="detail-value">{event.time}</span>
                  </div>
                  <div className="detail">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{event.location}</span>
                  </div>
                  <div className="detail" style={{ gridColumn: '1 / -1' }}>
                    <SpotsRemainingBadge
                      availableSpots={event.availableSpots}
                      capacity={event.capacity}
                    />
                  </div>
                </div>
                <p className="event-item-description">{event.description}</p>
                <Link to={`/booking/${event._id}`}>
                  <button>Book Event</button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Events;
