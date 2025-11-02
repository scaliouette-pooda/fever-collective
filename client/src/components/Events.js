import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Events.css';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(event => event.level === filter);

  if (loading) return <div className="container loading">Loading...</div>;

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Events</h1>
        <p className="events-subtitle">Discover our upcoming popup experiences</p>
      </div>

      <div className="events-filter">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All Events
        </button>
        <button
          className={filter === 'beginner' ? 'active' : ''}
          onClick={() => setFilter('beginner')}
        >
          Beginner
        </button>
        <button
          className={filter === 'intermediate' ? 'active' : ''}
          onClick={() => setFilter('intermediate')}
        >
          Intermediate
        </button>
        <button
          className={filter === 'advanced' ? 'active' : ''}
          onClick={() => setFilter('advanced')}
        >
          Advanced
        </button>
        <button
          className={filter === 'all levels' ? 'active' : ''}
          onClick={() => setFilter('all levels')}
        >
          All Levels
        </button>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="no-events">
          <p>No events match your filter.</p>
          <p>Check back soon or browse all events.</p>
        </div>
      ) : (
        <div className="events-list">
          {filteredEvents.map(event => (
            <div key={event._id} className="event-item">
              <div className="event-item-image">
                <div className="placeholder-event-img">
                  <span>{event.level}</span>
                </div>
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
                  <div className="detail">
                    <span className="detail-label">Available</span>
                    <span className="detail-value">{event.availableSpots} spots</span>
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
