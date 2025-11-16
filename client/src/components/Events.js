import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { LiveBookingNotification, SpotsRemainingBadge } from './SocialProof';
import './Events.css';

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('schedule'); // 'schedule' or 'list'

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

  // Organize events into weekly schedule
  const getWeeklySchedule = () => {
    const schedule = {
      'Monday': {},
      'Tuesday': {},
      'Wednesday': {},
      'Thursday': {},
      'Friday': {},
      'Saturday': {},
      'Sunday': {}
    };

    const times = ['6:30 AM', '9:00 AM', '12:30 PM', '5:30 PM'];

    // Get events for the next 7 days
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    events.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate >= today && eventDate <= nextWeek) {
        const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
        const timeSlot = event.time;

        if (!schedule[dayName][timeSlot]) {
          schedule[dayName][timeSlot] = [];
        }
        schedule[dayName][timeSlot].push(event);
      }
    });

    return { schedule, times };
  };

  if (loading) return <div className="container loading">Loading...</div>;

  const { schedule, times } = getWeeklySchedule();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="events-page">
      <LiveBookingNotification />

      <div className="events-header">
        <h1>Classes & Events</h1>
        <p className="events-subtitle">Browse our weekly class schedule or upcoming events</p>

        <div className="view-toggle">
          <button
            className={viewMode === 'schedule' ? 'active' : ''}
            onClick={() => setViewMode('schedule')}
          >
            📅 Weekly Schedule
          </button>
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            📋 List View
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="no-events">
          <p>No upcoming events at this time.</p>
          <p>Check back soon for new experiences.</p>
        </div>
      ) : (
        <>
          {/* Weekly Schedule View */}
          {viewMode === 'schedule' && (
            <div className="weekly-schedule">
              <div className="schedule-grid">
                {/* Header row with days */}
                <div className="schedule-header time-header">Time</div>
                {days.map(day => (
                  <div key={day} className="schedule-header">
                    {day}
                  </div>
                ))}

                {/* Time slots rows */}
                {times.map(time => (
                  <React.Fragment key={time}>
                    <div className="time-cell">{time}</div>
                    {days.map(day => (
                      <div key={`${day}-${time}`} className="schedule-cell">
                        {schedule[day][time] && schedule[day][time].length > 0 ? (
                          schedule[day][time].map(event => (
                            <Link
                              key={event._id}
                              to={`/booking/${event._id}`}
                              className="class-card"
                            >
                              <div className="class-title">{event.title}</div>
                              <div className="class-instructor">{event.instructor}</div>
                              <div className="class-spots">
                                {event.availableSpots} spots
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="empty-cell">—</div>
                        )}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
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
        </>
      )}
    </div>
  );
}

export default Events;
