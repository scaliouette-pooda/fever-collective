import React, { useState, useEffect } from 'react';

// Countdown Timer Component
export function CountdownTimer({ eventDate, spotsLeft }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgency, setUrgency] = useState('low');

  // Helper function to parse date without timezone conversion
  const parseEventDate = (dateString) => {
    const dateStr = dateString.split('T')[0]; // Get YYYY-MM-DD part only
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // Create date in local timezone
  };

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const eventTime = parseEventDate(eventDate).getTime();
      const difference = eventTime - now;

      if (difference <= 0) {
        setTimeLeft('Event started');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      // Determine urgency level
      if (days === 0 && hours < 24) {
        setUrgency('high');
      } else if (days <= 3) {
        setUrgency('medium');
      } else {
        setUrgency('low');
      }

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [eventDate]);

  const getUrgencyColor = () => {
    if (urgency === 'high') return '#ff4444';
    if (urgency === 'medium') return '#ff9800';
    return '#c9a86a';
  };

  const getUrgencyMessage = () => {
    if (spotsLeft <= 3) return '⚡ Almost sold out!';
    if (urgency === 'high') return '🔥 Filling fast!';
    if (urgency === 'medium') return '⏰ Don\'t miss out!';
    return '📅 Book your spot';
  };

  return (
    <div style={{
      padding: '12px 20px',
      backgroundColor: `${getUrgencyColor()}20`,
      border: `1px solid ${getUrgencyColor()}`,
      borderRadius: '4px',
      textAlign: 'center',
      marginBottom: '15px'
    }}>
      <div style={{ fontSize: '0.85rem', color: getUrgencyColor(), fontWeight: '600', marginBottom: '5px' }}>
        {getUrgencyMessage()}
      </div>
      <div style={{ fontSize: '1.2rem', color: getUrgencyColor(), fontWeight: 'bold' }}>
        {timeLeft}
      </div>
      {spotsLeft <= 5 && (
        <div style={{ fontSize: '0.8rem', color: '#ff4444', marginTop: '5px', fontWeight: '600' }}>
          Only {spotsLeft} spots left!
        </div>
      )}
    </div>
  );
}

// Live Booking Notification Component
export function LiveBookingNotification() {
  const [notification, setNotification] = useState(null);
  const [visible, setVisible] = useState(false);

  const sampleBookings = [
    { name: 'Sarah M.', event: 'Sunset Pilates', time: '2 minutes ago' },
    { name: 'James K.', event: 'Morning Flow', time: '5 minutes ago' },
    { name: 'Emily R.', event: 'Core Strength', time: '8 minutes ago' },
    { name: 'Michael T.', event: 'Evening Stretch', time: '12 minutes ago' },
    { name: 'Lisa W.', event: 'Power Pilates', time: '15 minutes ago' },
    { name: 'David S.', event: 'Beginner Session', time: '18 minutes ago' },
    { name: 'Anna P.', event: 'Advanced Flow', time: '22 minutes ago' },
    { name: 'Tom H.', event: 'Sunset Pilates', time: '25 minutes ago' }
  ];

  useEffect(() => {
    const showNotification = () => {
      const randomBooking = sampleBookings[Math.floor(Math.random() * sampleBookings.length)];
      setNotification(randomBooking);
      setVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setVisible(false);
      }, 5000);
    };

    // Show first notification after 3 seconds
    const initialTimer = setTimeout(showNotification, 3000);

    // Show new notification every 15-25 seconds
    const interval = setInterval(() => {
      showNotification();
    }, Math.random() * 10000 + 15000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  if (!visible || !notification) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      maxWidth: '350px',
      backgroundColor: '#1a1a1a',
      border: '1px solid rgba(201, 168, 106, 0.5)',
      padding: '15px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      animation: 'slideInLeft 0.5s ease-out',
      zIndex: 9999
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#c9a86a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem'
        }}>
          👤
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.9rem', color: '#e8e8e8', fontWeight: '600', marginBottom: '3px' }}>
            {notification.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(232, 232, 232, 0.7)' }}>
            booked <strong style={{ color: '#c9a86a' }}>{notification.event}</strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(232, 232, 232, 0.5)', marginTop: '3px' }}>
            {notification.time}
          </div>
        </div>
        <div style={{ fontSize: '1.2rem' }}>
          ✓
        </div>
      </div>
    </div>
  );
}

// Spots Remaining Badge Component
export function SpotsRemainingBadge({ availableSpots, capacity }) {
  const percentage = (availableSpots / capacity) * 100;
  let color, message;

  if (percentage <= 20) {
    color = '#ff4444';
    message = '🔥 Almost Gone!';
  } else if (percentage <= 50) {
    color = '#ff9800';
    message = '⚡ Filling Fast!';
  } else {
    color = '#4caf50';
    message = '✓ Available';
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 12px',
      backgroundColor: `${color}20`,
      border: `1px solid ${color}`,
      borderRadius: '20px',
      fontSize: '0.85rem',
      fontWeight: '600',
      color: color
    }}>
      <span>{message}</span>
      <span style={{ opacity: 0.8 }}>
        {availableSpots} / {capacity} spots
      </span>
    </div>
  );
}

// Recently Viewed Counter Component
export function RecentlyViewedCounter({ viewCount }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      backgroundColor: 'rgba(201, 168, 106, 0.1)',
      border: '1px solid rgba(201, 168, 106, 0.3)',
      borderRadius: '4px',
      fontSize: '0.8rem',
      color: 'rgba(232, 232, 232, 0.8)'
    }}>
      <span>👁️</span>
      <span>{viewCount} people viewing this event</span>
    </div>
  );
}

// Add keyframes animation in component style
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInLeft {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);
