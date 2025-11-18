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

  // Helper function to parse date without timezone conversion
  const parseEventDate = (dateString) => {
    const dateStr = dateString.split('T')[0]; // Get YYYY-MM-DD part only
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // Create date in local timezone
  };

  // Helper to format date as YYYY-MM-DD without timezone conversion
  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to expand recurring events into individual instances
  const expandRecurringEvents = (eventsList) => {
    const expandedEvents = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    eventsList.forEach(event => {
      // Add the original event
      expandedEvents.push(event);

      // If it's a recurring event, generate instances
      // Support both 'weekly' and 'daily' patterns when recurrenceDays are specified
      if (event.isRecurring && (event.recurrencePattern === 'weekly' || event.recurrencePattern === 'daily') && event.recurrenceDays?.length > 0) {
        const originalDate = parseEventDate(event.date);
        const endDate = event.recurrenceEndDate ? parseEventDate(event.recurrenceEndDate) : new Date(originalDate.getFullYear() + 1, originalDate.getMonth(), originalDate.getDate());

        // Map day names to day numbers (0 = Sunday, 1 = Monday, etc.)
        const dayMap = {
          'sunday': 0,
          'monday': 1,
          'tuesday': 2,
          'wednesday': 3,
          'thursday': 4,
          'friday': 5,
          'saturday': 6
        };

        const recurDayNumbers = event.recurrenceDays.map(day => dayMap[day.toLowerCase()]);

        // Start from the day after the original event
        let currentDate = new Date(originalDate);
        currentDate.setDate(currentDate.getDate() + 1);

        // Generate instances for up to 1 year or until recurrenceEndDate
        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay();

          // If this day is in the recurrence days, create an instance
          if (recurDayNumbers.includes(dayOfWeek)) {
            const instanceDate = new Date(currentDate);
            const dateKey = formatDateKey(instanceDate);

            // Create a virtual event instance
            expandedEvents.push({
              ...event,
              _id: `${event._id}_${dateKey}`, // Unique ID for each instance
              date: `${dateKey}T00:00:00.000Z`, // Format as ISO string
              isRecurringInstance: true, // Flag to identify this is a generated instance
              parentEventId: event._id // Reference to original event
            });
          }

          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    });

    return expandedEvents;
  };

  const fetchEvents = async () => {
    try {
      console.log('Fetching events...');
      const response = await api.get('/api/events');
      console.log('Events API response:', response.data);
      console.log('Number of events:', response.data.length);

      // Expand recurring events into individual instances
      const expandedEvents = expandRecurringEvents(response.data);
      console.log('After expanding recurring events:', expandedEvents.length);

      setEvents(expandedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      console.error('Error details:', error.response);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse time string (e.g., "7:30 AM")
  const parseEventTime = (timeString) => {
    const timeParts = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) return { hours: 0, minutes: 0 };

    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const period = timeParts[3].toUpperCase();

    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return { hours, minutes };
  };

  // Helper function to check if event has passed
  const isEventPast = (eventDate, eventTime) => {
    const now = new Date();
    const eventDateObj = parseEventDate(eventDate);
    const { hours, minutes } = parseEventTime(eventTime);
    eventDateObj.setHours(hours, minutes, 0, 0);
    return eventDateObj.getTime() < now.getTime();
  };

  // Filter upcoming events for list view
  const upcomingEvents = events.filter(event => !isEventPast(event.date, event.time));

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
      const dateKey = formatDateKey(date);
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
    console.log('Total events loaded:', events.length);

    events.forEach(event => {
      // Parse date without timezone conversion
      const dateStr = event.date.split('T')[0]; // Get YYYY-MM-DD part only
      const eventDate = parseEventDate(event.date);

      console.log('\n--- Event Debug ---');
      console.log('Title:', event.title);
      console.log('Original date:', event.date);
      console.log('Parsed date:', eventDate.toISOString());
      console.log('Event time value:', `"${event.time}"`);
      console.log('Event time length:', event.time.length);
      console.log('Date in range?', eventDate >= weekStart && eventDate <= weekEnd);

      if (eventDate >= weekStart && eventDate <= weekEnd) {
        const dateKey = dateStr; // Use the original date string as key
        const timeMatch = times.includes(event.time);

        console.log('✓ Event IS in date range');
        console.log('DateKey:', dateKey);
        console.log('Time slot match?', timeMatch);

        if (!timeMatch) {
          console.log('❌ TIME MISMATCH! Event time does not match any slot');
          console.log('Event time:', `"${event.time}"`);
          console.log('Looking for exact match in:', times.slice(0, 10), '...');
          // Show similar times
          const similar = times.filter(t => t.toLowerCase().includes(event.time.toLowerCase().replace(/\s+/g, '')));
          if (similar.length > 0) {
            console.log('Similar times found:', similar);
          }
        }

        if (schedule[dateKey]) {
          if (!schedule[dateKey][event.time]) {
            schedule[dateKey][event.time] = [];
          }
          schedule[dateKey][event.time].push(event);
          console.log('✓ Event added to schedule');
        } else {
          console.log('❌ DateKey not found in schedule object');
        }
      } else {
        console.log('✗ Event out of date range');
        console.log('Event date:', eventDate.toLocaleDateString());
        console.log('Week range:', weekStart.toLocaleDateString(), 'to', weekEnd.toLocaleDateString());
      }
    });

    console.log('\n=== SCHEDULE SUMMARY ===');
    console.log('Events placed in schedule:', Object.keys(schedule).reduce((count, dateKey) => {
      return count + Object.keys(schedule[dateKey]).reduce((dayCount, time) => {
        return dayCount + schedule[dateKey][time].length;
      }, 0);
    }, 0));

    return { schedule, times, weekDates };
  };

  if (loading) return <div className="container loading">Loading...</div>;

  const { schedule, times, weekDates } = getWeeklySchedule();

  return (
    <div className="events-page">
      <LiveBookingNotification />

      <div className="events-header">
        <h1>Classes</h1>
        <p className="events-subtitle">Browse our weekly class schedule</p>

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
                  <div key={formatDateKey(date)} className="schedule-header">
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
                      const dateKey = formatDateKey(date);
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
              {upcomingEvents.map(event => (
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
