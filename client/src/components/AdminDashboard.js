import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [showBookingEditForm, setShowBookingEditForm] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    phone: '',
    spots: 1,
    paymentStatus: 'pending'
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    address: '',
    price: '',
    capacity: '',
    instructor: '',
    level: 'all levels',
    imageUrl: ''
  });

  useEffect(() => {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.role || user.role !== 'admin') {
      alert('Access denied. Admin privileges required.');
      navigate('/events');
      return;
    }

    fetchData();
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (activeTab === 'events') {
        const res = await api.get('/api/events', config);
        setEvents(res.data);
      } else if (activeTab === 'bookings') {
        const res = await api.get('/api/bookings', config);
        setBookings(res.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventFormChange = (e) => {
    setEventForm({
      ...eventForm,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await api.post('/api/events/upload-image', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.response?.status === 501) {
        alert('Image upload is not configured on the server. Event will be created without image.');
      }
      return null;
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      let imageUrl = eventForm.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const eventData = {
        ...eventForm,
        imageUrl: imageUrl || ''
      };

      if (editingEvent) {
        await api.put(`/api/events/${editingEvent._id}`, eventData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Event updated successfully!');
      } else {
        await api.post('/api/events', eventData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Event created successfully!');
      }

      setShowEventForm(false);
      setEditingEvent(null);
      setImageFile(null);
      setImagePreview(null);
      resetEventForm();
      fetchData();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      date: event.date.split('T')[0],
      time: event.time,
      location: event.location,
      address: event.address,
      price: event.price,
      capacity: event.capacity,
      instructor: event.instructor,
      level: event.level,
      imageUrl: event.imageUrl || ''
    });
    setImagePreview(event.imageUrl || null);
    setShowEventForm(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Event deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event.');
    }
  };

  const handleRecalculateSpots = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`/api/events/${eventId}/recalculate-spots`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { oldAvailableSpots, newAvailableSpots, totalBooked, capacity } = response.data;
      alert(`Spots recalculated!\n\nCapacity: ${capacity}\nBooked (completed payments): ${totalBooked}\n\nOld Available: ${oldAvailableSpots}\nNew Available: ${newAvailableSpots}`);
      fetchData();
    } catch (error) {
      console.error('Error recalculating spots:', error);
      alert(error.response?.data?.error || 'Failed to recalculate spots');
    }
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      address: '',
      price: '',
      capacity: '',
      instructor: '',
      level: 'all levels',
      imageUrl: ''
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleUpdateBookingStatus = async (bookingId, status, paymentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(`/api/bookings/${bookingId}/status`,
        { status, paymentStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      alert('Booking status updated!');
      fetchData();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking status');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Booking deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const handleEditBooking = (booking) => {
    setEditingBooking(booking);
    setBookingForm({
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      spots: booking.spots,
      paymentStatus: booking.paymentStatus
    });
    setShowBookingEditForm(true);
  };

  const handleBookingFormChange = (e) => {
    setBookingForm({
      ...bookingForm,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateBooking = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      // Check if payment status changed
      const paymentStatusChanged = bookingForm.paymentStatus !== editingBooking.paymentStatus;

      // Update booking details (name, email, phone, spots)
      await api.put(`/api/bookings/${editingBooking._id}`, {
        name: bookingForm.name,
        email: bookingForm.email,
        phone: bookingForm.phone,
        spots: bookingForm.spots
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // If payment status changed, update it separately to trigger spot management
      if (paymentStatusChanged) {
        const response = await api.patch(`/api/bookings/${editingBooking._id}/status`, {
          paymentStatus: bookingForm.paymentStatus
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.spotsReturned > 0) {
          alert(`Booking updated successfully!\n\n${response.data.spotsReturned} spots returned to event (refunded).`);
        } else {
          alert('Booking updated successfully!');
        }
      } else {
        alert('Booking updated successfully!');
      }

      setShowBookingEditForm(false);
      setEditingBooking(null);
      setBookingForm({ name: '', email: '', phone: '', spots: 1, paymentStatus: 'pending' });
      fetchData();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert(error.response?.data?.error || 'Failed to update booking');
    }
  };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage your events, bookings, and users</p>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
        <button
          className={activeTab === 'bookings' ? 'active' : ''}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings
        </button>
        <button
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'events' && (
          <div className="events-section">
            <div className="section-header">
              <h2>Manage Events</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
               
                <button onClick={() => {
                  setShowEventForm(true);
                  setEditingEvent(null);
                  resetEventForm();
                }}>
                  Create New Event
                </button>
              </div>
            </div>

            {showEventForm && (
              <div className="event-form-modal">
                <div className="event-form-container">
                  <h3>{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
                  <form onSubmit={handleCreateEvent}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          name="title"
                          value={eventForm.title}
                          onChange={handleEventFormChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Instructor</label>
                        <input
                          type="text"
                          name="instructor"
                          value={eventForm.instructor}
                          onChange={handleEventFormChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        name="description"
                        value={eventForm.description}
                        onChange={handleEventFormChange}
                        rows="4"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Date</label>
                        <input
                          type="date"
                          name="date"
                          value={eventForm.date}
                          onChange={handleEventFormChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Time</label>
                        <input
                          type="time"
                          name="time"
                          value={eventForm.time}
                          onChange={handleEventFormChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Location</label>
                        <input
                          type="text"
                          name="location"
                          value={eventForm.location}
                          onChange={handleEventFormChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Address</label>
                        <input
                          type="text"
                          name="address"
                          value={eventForm.address}
                          onChange={handleEventFormChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Price ($)</label>
                        <input
                          type="number"
                          name="price"
                          value={eventForm.price}
                          onChange={handleEventFormChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Capacity</label>
                        <input
                          type="number"
                          name="capacity"
                          value={eventForm.capacity}
                          onChange={handleEventFormChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Level</label>
                        <select
                          name="level"
                          value={eventForm.level}
                          onChange={handleEventFormChange}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="all levels">All Levels</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Event Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      {imagePreview && (
                        <div className="image-preview">
                          <img src={imagePreview} alt="Preview" />
                        </div>
                      )}
                    </div>

                    <div className="form-actions">
                      <button type="button" onClick={() => {
                        setShowEventForm(false);
                        setEditingEvent(null);
                        resetEventForm();
                      }}>
                        Cancel
                      </button>
                      <button type="submit">
                        {editingEvent ? 'Update Event' : 'Create Event'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="events-table">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Price</th>
                    <th>Available/Capacity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr key={event._id}>
                      <td>{event.title}</td>
                      <td>{new Date(event.date).toLocaleDateString()}</td>
                      <td>{event.location}</td>
                      <td>${event.price}</td>
                      <td>{event.availableSpots}/{event.capacity}</td>
                      <td>
                        <button onClick={() => handleEditEvent(event)}>Edit</button>
                        <button
                          onClick={() => handleRecalculateSpots(event._id)}
                          style={{
                            backgroundColor: '#FF9800',
                            color: 'white'
                          }}
                          title="Recalculate available spots from completed bookings"
                        >
                          Recalculate
                        </button>
                        <button onClick={() => handleDeleteEvent(event._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bookings-section">
            <h2>Recent Bookings</h2>
            <div className="bookings-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Event</th>
                    <th>Spots</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Booking</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking._id}>
                      <td>{booking.name}</td>
                      <td>{booking.email}</td>
                      <td>{booking.event?.title || 'N/A'}</td>
                      <td>{booking.spots}</td>
                      <td>${booking.totalAmount}</td>
                      <td>
                        <span className={`status-badge ${booking.paymentStatus}`}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${booking.status}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>{new Date(booking.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {booking.paymentStatus === 'pending' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(booking._id, 'confirmed', 'completed')}
                              className="btn-confirm"
                              style={{ padding: '5px 10px', fontSize: '0.85rem', backgroundColor: '#4CAF50' }}
                            >
                              Confirm Payment
                            </button>
                          )}
                          {booking.status === 'pending' && booking.paymentStatus === 'completed' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(booking._id, 'confirmed', booking.paymentStatus)}
                              className="btn-confirm"
                              style={{ padding: '5px 10px', fontSize: '0.85rem', backgroundColor: '#4CAF50' }}
                            >
                              Confirm Booking
                            </button>
                          )}
                          <button
                            onClick={() => handleEditBooking(booking)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.85rem',
                              backgroundColor: '#2196F3',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '3px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBooking(booking._id)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.85rem',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: '3px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showBookingEditForm && editingBooking && (
              <div className="event-form-modal">
                <div className="event-form-container">
                  <h3>Edit Booking</h3>
                  <form onSubmit={handleUpdateBooking}>
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        name="name"
                        value={bookingForm.name}
                        onChange={handleBookingFormChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={bookingForm.email}
                        onChange={handleBookingFormChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={bookingForm.phone}
                        onChange={handleBookingFormChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Spots</label>
                      <input
                        type="number"
                        name="spots"
                        value={bookingForm.spots}
                        onChange={handleBookingFormChange}
                        min="1"
                        required
                      />
                      <small style={{ color: '#666', fontSize: '0.85rem' }}>
                        Event: {editingBooking.event?.title} |
                        Current: {editingBooking.spots} spots |
                        Available: {editingBooking.event?.availableSpots} spots
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Payment Status</label>
                      <select
                        name="paymentStatus"
                        value={bookingForm.paymentStatus}
                        onChange={handleBookingFormChange}
                        style={{
                          backgroundColor: bookingForm.paymentStatus === 'refunded' ? '#ffebee' :
                                         bookingForm.paymentStatus === 'completed' ? '#e8f5e9' :
                                         '#fff3cd'
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                      <small style={{ color: '#666', fontSize: '0.85rem' }}>
                        {editingBooking.paymentStatus === 'completed' && bookingForm.paymentStatus === 'refunded' ? (
                          <strong style={{ color: '#d32f2f' }}>⚠️ Changing to "Refunded" will automatically return {editingBooking.spots} spots to the event</strong>
                        ) : editingBooking.paymentStatus === 'pending' && bookingForm.paymentStatus === 'completed' ? (
                          <strong style={{ color: '#388e3c' }}>✓ Changing to "Completed" will reduce available spots by {editingBooking.spots}</strong>
                        ) : (
                          'Select payment status. Refunding automatically releases spots.'
                        )}
                      </small>
                    </div>

                    <div className="form-actions">
                      <button type="button" onClick={() => {
                        setShowBookingEditForm(false);
                        setEditingBooking(null);
                        setBookingForm({ name: '', email: '', phone: '', spots: 1, paymentStatus: 'pending' });
                      }}>
                        Cancel
                      </button>
                      <button type="submit">
                        Update Booking
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <h2>Analytics Dashboard</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Events</h3>
                <p className="stat-value">{events.length}</p>
              </div>
              <div className="stat-card">
                <h3>Total Bookings</h3>
                <p className="stat-value">{bookings.length}</p>
              </div>
              <div className="stat-card">
                <h3>Revenue</h3>
                <p className="stat-value">
                  ${bookings.reduce((sum, b) => sum + (b.paymentStatus === 'completed' ? b.totalAmount : 0), 0)}
                </p>
              </div>
              <div className="stat-card">
                <h3>Pending Payments</h3>
                <p className="stat-value">
                  {bookings.filter(b => b.paymentStatus === 'pending').length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
