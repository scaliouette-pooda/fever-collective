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

  // Helper function to parse date without timezone conversion
  const parseEventDate = (dateString) => {
    const dateStr = dateString.split('T')[0]; // Get YYYY-MM-DD part only
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // Create date in local timezone
  };

  // Generate time slots every 30 minutes from 6:30 AM to 5:30 PM
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 6;
    const startMinute = 30;
    const endHour = 17;
    const endMinute = 30;

    let hour = startHour;
    let minute = startMinute;

    while (hour < endHour || (hour === endHour && minute <= endMinute)) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      const timeString = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
      slots.push(timeString);

      minute += 30;
      if (minute >= 60) {
        minute = 0;
        hour += 1;
      }
    }

    return slots;
  };

  // Get current week's dates (7 days starting from today)
  const getCurrentWeekDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      weekDates.push(date);
    }

    return weekDates;
  };

  // Organize events into weekly schedule
  const getWeeklySchedule = () => {
    const weekDates = getCurrentWeekDates();
    const times = generateTimeSlots();
    const schedule = {};

    // Initialize schedule with dates as keys
    weekDates.forEach(date => {
      const dateKey = date.toISOString().split('T')[0];
      schedule[dateKey] = {};
    });

    // Get events for the current week
    const weekStart = weekDates[0];
    const weekEnd = new Date(weekDates[6]);
    weekEnd.setHours(23, 59, 59, 999);

    console.log('=== SCHEDULE DEBUG ===');
    console.log('Available time slots:', times);
    console.log('Week start:', weekStart.toISOString());
    console.log('Week end:', weekEnd.toISOString());

    events.forEach(event => {
      // Parse date without timezone conversion
      const dateStr = event.date.split('T')[0]; // Get YYYY-MM-DD part only
      const eventDate = parseEventDate(event.date);

      console.log('Event:', event.title, 'Original date:', event.date, 'Parsed date:', eventDate.toISOString(), 'Time:', event.time);

      if (eventDate >= weekStart && eventDate <= weekEnd) {
        const dateKey = dateStr; // Use the original date string as key

        console.log('✓ Event in range. DateKey:', dateKey, 'TimeSlot:', event.time, 'Match found:', times.includes(event.time));

        if (schedule[dateKey]) {
          if (!schedule[dateKey][event.time]) {
            schedule[dateKey][event.time] = [];
          }
          schedule[dateKey][event.time].push(event);
        }
      } else {
        console.log('✗ Event out of range');
      }
    });

    return { schedule, times, weekDates };
  };

  if (loading) return <div className="container loading">Loading...</div>;

  const { schedule, times, weekDates } = getWeeklySchedule();

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
                {/* Header row with dates */}
                <div className="schedule-header time-header">Time</div>
                {weekDates.map(date => (
                  <div key={date.toISOString()} className="schedule-header">
                    <div className="day-name">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="date-number">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}

                {/* Time slots rows */}
                {times.map(time => (
                  <React.Fragment key={time}>
                    <div className="time-cell">{time}</div>
                    {weekDates.map(date => {
                      const dateKey = date.toISOString().split('T')[0];
                      return (
                        <div key={`${dateKey}-${time}`} className="schedule-cell">
                          {schedule[dateKey] && schedule[dateKey][time] && schedule[dateKey][time].length > 0 ? (
                            schedule[dateKey][time].map(event => (
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
                      );
                    })}
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
                          {parseEventDate(event.date).toLocaleDateString('en-US', {
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
