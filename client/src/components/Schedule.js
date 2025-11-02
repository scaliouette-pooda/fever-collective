import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Schedule.css';

function Schedule() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container loading">Loading...</div>;

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <h1>Upcoming Events</h1>
        <p className="schedule-subtitle">Join us for transformative pilates experiences</p>
      </div>

      {events.length === 0 ? (
        <div className="no-events">
          <p>No upcoming events scheduled at this time.</p>
          <p>Check back soon for new experiences.</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map(event => (
            <div key={event._id} className="event-card">
              <div className="event-image">
                <div className="placeholder-event-image">
                  <span>{event.level}</span>
                </div>
              </div>
              <div className="event-details">
                <div className="event-meta">
                  <span className="event-date">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="event-time">{event.time}</span>
                </div>
                <h3>{event.title}</h3>
                <p className="event-instructor">with {event.instructor}</p>
                <p className="event-location">{event.location}</p>
                <p className="event-description">{event.description}</p>
                <div className="event-footer">
                  <div className="event-info">
                    <span className="event-price">${event.price}</span>
                    <span className="event-spots">{event.availableSpots} spots left</span>
                  </div>
                  <Link to={`/booking/${event._id}`}>
                    <button>Book Now</button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Schedule;
