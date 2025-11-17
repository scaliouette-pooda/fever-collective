import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import './AdminDashboard.css';
import AdminMembershipSection from './AdminMembershipSection';
import QRScanner from './QRScanner';
import AutomatedCampaigns from './AutomatedCampaigns';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [promoCodes, setPromoCodes] = useState([]);
  const [emailCampaigns, setEmailCampaigns] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [waitlists, setWaitlists] = useState([]);
  const [referralLeaderboard, setReferralLeaderboard] = useState([]);
  const [selectedEventForWaitlist, setSelectedEventForWaitlist] = useState(null);
  const [qrScanInput, setQrScanInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aboutImageFile, setAboutImageFile] = useState(null);
  const [aboutImagePreview, setAboutImagePreview] = useState(null);
  const [missionImageFile, setMissionImageFile] = useState(null);
  const [missionImagePreview, setMissionImagePreview] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [showBookingEditForm, setShowBookingEditForm] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [recipientPreview, setRecipientPreview] = useState(null);

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
    imageUrl: '',
    useTieredPricing: false,
    ticketTiers: []
  });

  const [promoForm, setPromoForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscount: '',
    minPurchase: '',
    usageLimit: '',
    perUserLimit: '1',
    startDate: '',
    expiryDate: '',
    isActive: true
  });

  const [emailForm, setEmailForm] = useState({
    name: '',
    subject: '',
    message: '',
    recipients: 'all',
    customEmails: '',
    includedPromoCode: ''
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
      } else if (activeTab === 'settings') {
        const res = await api.get('/api/settings', config);
        setSettings(res.data);
      } else if (activeTab === 'promoCodes') {
        const res = await api.get('/api/promo-codes', config);
        setPromoCodes(res.data);
      } else if (activeTab === 'emailMarketing') {
        const res = await api.get('/api/email-campaigns', config);
        setEmailCampaigns(res.data);
      } else if (activeTab === 'reviews') {
        const res = await api.get('/api/reviews/admin/all', config);
        setReviews(res.data);
      } else if (activeTab === 'waitlist') {
        const eventsRes = await api.get('/api/events', config);
        setEvents(eventsRes.data);
      } else if (activeTab === 'referrals') {
        const res = await api.get('/api/referrals/leaderboard', config);
        setReferralLeaderboard(res.data);
      } else if (activeTab === 'checkin') {
        // Load recent bookings for check-in
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

  const handleAboutImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAboutImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAboutImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMissionImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMissionImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMissionImagePreview(reader.result);
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
      const response = await api.post('/api/upload/image', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.response?.status === 400) {
        alert('No file uploaded. Please select an image.');
      } else if (error.response?.data?.error) {
        alert(`Upload failed: ${error.response.data.error}`);
      } else {
        alert('Image upload failed. Event will be created without image.');
      }
      return null;
    }
  };

  // Convert 24-hour time (HH:MM) to 12-hour AM/PM format (H:MM AM/PM)
  const convertTo12HourFormat = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${period}`;
  };

  // Convert 12-hour AM/PM format (H:MM AM/PM) to 24-hour format (HH:MM) for time input
  const convertTo24HourFormat = (time12) => {
    if (!time12) return '';
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return time12; // Return as-is if not in expected format
    let [, hours, minutes, period] = match;
    let hour = parseInt(hours, 10);
    if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
    if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      let imageUrl = eventForm.imageUrl;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      // Convert time to 12-hour format for consistency with schedule
      const convertedTime = convertTo12HourFormat(eventForm.time);

      const eventData = {
        ...eventForm,
        time: convertedTime, // Use converted 12-hour format
        imageUrl: imageUrl || ''
      };

      console.log('Creating event with time:', {
        original: eventForm.time,
        converted: convertedTime
      });

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
      time: convertTo24HourFormat(event.time), // Convert to 24-hour format for time input
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

  const handleSettingsChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      // Upload images if new ones were selected
      let aboutImageUrl = settings.homeImages?.aboutImage || '';
      let missionImageUrl = settings.homeImages?.missionImage || '';

      if (aboutImageFile) {
        const formData = new FormData();
        formData.append('image', aboutImageFile);
        const response = await api.post('/api/upload/image', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        aboutImageUrl = response.data.imageUrl;
      }

      if (missionImageFile) {
        const formData = new FormData();
        formData.append('image', missionImageFile);
        const response = await api.post('/api/upload/image', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        missionImageUrl = response.data.imageUrl;
      }

      // Update settings with image URLs
      const updatedSettings = {
        ...settings,
        homeImages: {
          aboutImage: aboutImageUrl,
          missionImage: missionImageUrl
        }
      };

      await api.put('/api/settings', updatedSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Clear image files after successful upload
      setAboutImageFile(null);
      setMissionImageFile(null);

      alert('Settings updated successfully!');
      fetchData(); // Refresh settings
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    }
  };

  // Promo Code Handlers
  const handlePromoFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPromoForm({
      ...promoForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetPromoForm = () => {
    setPromoForm({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      maxDiscount: '',
      minPurchase: '',
      usageLimit: '',
      perUserLimit: '1',
      startDate: '',
      expiryDate: '',
      isActive: true
    });
  };

  const handleCreatePromoCode = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      // Prepare data
      const promoData = {
        ...promoForm,
        code: promoForm.code.toUpperCase(),
        discountValue: parseFloat(promoForm.discountValue),
        maxDiscount: promoForm.maxDiscount ? parseFloat(promoForm.maxDiscount) : null,
        minPurchase: promoForm.minPurchase ? parseFloat(promoForm.minPurchase) : 0,
        usageLimit: promoForm.usageLimit ? parseInt(promoForm.usageLimit) : null,
        perUserLimit: parseInt(promoForm.perUserLimit) || 1,
        startDate: promoForm.startDate || new Date().toISOString(),
        expiryDate: promoForm.expiryDate || null
      };

      if (editingPromo) {
        await api.put(`/api/promo-codes/${editingPromo._id}`, promoData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Promo code updated successfully!');
      } else {
        await api.post('/api/promo-codes', promoData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Promo code created successfully!');
      }

      setShowPromoForm(false);
      setEditingPromo(null);
      resetPromoForm();
      fetchData();
    } catch (error) {
      console.error('Error saving promo code:', error);
      alert(error.response?.data?.error || 'Failed to save promo code. Please try again.');
    }
  };

  const handleEditPromoCode = (promo) => {
    setEditingPromo(promo);
    setPromoForm({
      code: promo.code,
      description: promo.description,
      discountType: promo.discountType,
      discountValue: promo.discountValue.toString(),
      maxDiscount: promo.maxDiscount?.toString() || '',
      minPurchase: promo.minPurchase?.toString() || '',
      usageLimit: promo.usageLimit?.toString() || '',
      perUserLimit: promo.perUserLimit?.toString() || '1',
      startDate: promo.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : '',
      expiryDate: promo.expiryDate ? new Date(promo.expiryDate).toISOString().split('T')[0] : '',
      isActive: promo.isActive
    });
    setShowPromoForm(true);
  };

  const handleDeletePromoCode = async (promoId) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/promo-codes/${promoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Promo code deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      alert('Failed to delete promo code.');
    }
  };

  const handleTogglePromoCode = async (promoId) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(`/api/promo-codes/${promoId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling promo code:', error);
      alert('Failed to toggle promo code status.');
    }
  };

  // Email Marketing Handlers
  const handleEmailFormChange = (e) => {
    const { name, value } = e.target;
    setEmailForm({
      ...emailForm,
      [name]: value
    });
  };

  const resetEmailForm = () => {
    setEmailForm({
      name: '',
      subject: '',
      message: '',
      recipients: 'all',
      customEmails: '',
      includedPromoCode: ''
    });
    setRecipientPreview(null);
  };

  const handlePreviewRecipients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/api/email-campaigns/preview-recipients', {
        recipients: emailForm.recipients,
        customEmails: emailForm.customEmails.split(',').map(e => e.trim()).filter(e => e)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecipientPreview(response.data);
    } catch (error) {
      console.error('Error previewing recipients:', error);
      alert('Failed to preview recipients');
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      const campaignData = {
        ...emailForm,
        customEmails: emailForm.customEmails.split(',').map(e => e.trim()).filter(e => e)
      };

      await api.post('/api/email-campaigns', campaignData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Campaign created successfully!');
      setShowEmailForm(false);
      resetEmailForm();
      fetchData();
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert(error.response?.data?.error || 'Failed to create campaign');
    }
  };

  const handleSendCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to send this email campaign? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`/api/email-campaigns/${campaignId}/send`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Campaign is being sent to ${response.data.recipientCount} recipients!`);
      fetchData();
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert(error.response?.data?.error || 'Failed to send campaign');
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/email-campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Campaign deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign');
    }
  };

  // Review Handlers
  const handleApproveReview = async (reviewId) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(`/api/reviews/${reviewId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Review approved!');
      fetchData();
    } catch (error) {
      console.error('Error approving review:', error);
      alert('Failed to approve review');
    }
  };

  const handleToggleFeaturedReview = async (reviewId) => {
    try {
      const token = localStorage.getItem('token');
      await api.patch(`/api/reviews/${reviewId}/featured`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling featured:', error);
      alert('Failed to toggle featured status');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Review deleted!');
      fetchData();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  // Waitlist Handlers
  const handleLoadWaitlist = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/waitlist/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWaitlists(res.data);
      setSelectedEventForWaitlist(eventId);
    } catch (error) {
      console.error('Error loading waitlist:', error);
      alert('Failed to load waitlist');
    }
  };

  const handleNotifyNextWaitlist = async (eventId) => {
    if (!window.confirm('Notify the next person on the waitlist?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/api/waitlist/notify/${eventId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Notified: ${res.data.notified.name} (${res.data.notified.email})`);
      handleLoadWaitlist(eventId);
    } catch (error) {
      console.error('Error notifying waitlist:', error);
      alert(error.response?.data?.error || 'Failed to notify waitlist');
    }
  };

  // Check-in Handler
  const handleQRScan = async () => {
    if (!qrScanInput.trim()) {
      alert('Please enter QR code data');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/bookings/check-in/scan',
        { qrData: qrScanInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setScanResult(res.data);
      setQrScanInput('');

      if (res.data.success) {
        alert(`✅ Check-in Successful!\n\nName: ${res.data.booking.name}\nSpots: ${res.data.booking.spots}\nEvent: ${res.data.booking.event}`);
      } else if (res.data.alreadyCheckedIn) {
        alert(`Already Checked In\n\nName: ${res.data.booking.name}\nChecked in at: ${new Date(res.data.booking.checkedInAt).toLocaleString()}`);
      }

      fetchData();
    } catch (error) {
      console.error('Error scanning QR:', error);
      alert(error.response?.data?.error || 'Failed to scan QR code');
      setScanResult(null);
    }
  };


  // Ticket Tier Handlers
  const handleAddTicketTier = () => {
    setEventForm({
      ...eventForm,
      ticketTiers: [
        ...eventForm.ticketTiers,
        {
          name: '',
          price: '',
          capacity: '',
          benefits: '',
          order: eventForm.ticketTiers.length
        }
      ]
    });
  };

  const handleRemoveTicketTier = (index) => {
    const newTiers = eventForm.ticketTiers.filter((_, i) => i !== index);
    setEventForm({
      ...eventForm,
      ticketTiers: newTiers.map((tier, i) => ({ ...tier, order: i }))
    });
  };

  const handleTicketTierChange = (index, field, value) => {
    const newTiers = [...eventForm.ticketTiers];
    newTiers[index] = {
      ...newTiers[index],
      [field]: value
    };
    setEventForm({
      ...eventForm,
      ticketTiers: newTiers
    });
  };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage your events, bookings, and users</p>
      </div>

      <div className="admin-tabs">
        {/* Core Operations */}
        <button
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => setActiveTab('events')}
        >
          📅 Events
        </button>
        <button
          className={activeTab === 'bookings' ? 'active' : ''}
          onClick={() => setActiveTab('bookings')}
        >
          📋 Bookings
        </button>
        <button
          className={activeTab === 'checkin' ? 'active' : ''}
          onClick={() => setActiveTab('checkin')}
        >
          ✅ Check-In
        </button>

        {/* Customer Engagement */}
        <button
          className={activeTab === 'memberships' ? 'active' : ''}
          onClick={() => setActiveTab('memberships')}
        >
          💎 Memberships
        </button>
        <button
          className={activeTab === 'reviews' ? 'active' : ''}
          onClick={() => setActiveTab('reviews')}
        >
          ⭐ Reviews
        </button>
        <button
          className={activeTab === 'referrals' ? 'active' : ''}
          onClick={() => setActiveTab('referrals')}
        >
          🎯 Referrals
        </button>
        <button
          className={activeTab === 'waitlist' ? 'active' : ''}
          onClick={() => setActiveTab('waitlist')}
        >
          ⏳ Waitlist
        </button>

        {/* Marketing & Promotions */}
        <button
          className={activeTab === 'promoCodes' ? 'active' : ''}
          onClick={() => setActiveTab('promoCodes')}
        >
          🎫 Promo Codes
        </button>
        <button
          className={activeTab === 'emailMarketing' ? 'active' : ''}
          onClick={() => setActiveTab('emailMarketing')}
        >
          📧 Email Marketing
        </button>
        <button
          className={activeTab === 'emailAutomation' ? 'active' : ''}
          onClick={() => setActiveTab('emailAutomation')}
        >
          🤖 Email Automation
        </button>

        {/* Admin & Insights */}
        <button
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
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

                    {/* Ticket Tiers Section */}
                    {/* TIERED PRICING FEATURE - COMMENTED OUT (Not fully implemented)
                    <div className="form-group" style={{
                      borderTop: '2px solid rgba(201, 168, 106, 0.3)',
                      paddingTop: '1.5rem',
                      marginTop: '1.5rem'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                        <input
                          type="checkbox"
                          checked={eventForm.useTieredPricing || false}
                          onChange={(e) => {
                            setEventForm({
                              ...eventForm,
                              useTieredPricing: e.target.checked,
                              ticketTiers: e.target.checked && eventForm.ticketTiers.length === 0
                                ? [{
                                    name: 'General Admission',
                                    price: eventForm.price || '',
                                    capacity: eventForm.capacity || '',
                                    benefits: '',
                                    order: 0
                                  }]
                                : eventForm.ticketTiers
                            });
                          }}
                        />
                        <strong>Use Tiered Pricing</strong>
                      </label>
                      <small style={{ color: 'rgba(232, 232, 232, 0.6)', display: 'block', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                        Create multiple ticket tiers with different prices and capacities (e.g., Early Bird, VIP, General)
                      </small>

                      {eventForm.useTieredPricing && (
                        <div style={{
                          background: 'rgba(201, 168, 106, 0.1)',
                          border: '1px solid rgba(201, 168, 106, 0.3)',
                          borderRadius: '8px',
                          padding: '1.5rem',
                          marginTop: '1rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0 }}>Ticket Tiers</h4>
                            <button
                              type="button"
                              onClick={handleAddTicketTier}
                              style={{
                                padding: '8px 15px',
                                background: 'rgba(52, 199, 89, 0.2)',
                                border: '1px solid rgba(52, 199, 89, 0.5)',
                                color: '#34c759',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              + Add Tier
                            </button>
                          </div>

                          {eventForm.ticketTiers.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'rgba(232, 232, 232, 0.5)', padding: '1rem' }}>
                              No tiers added yet. Click "Add Tier" to create your first ticket tier.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {eventForm.ticketTiers.map((tier, index) => (
                                <div
                                  key={index}
                                  style={{
                                    background: 'rgba(26, 26, 26, 0.5)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    padding: '1rem'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <strong style={{ color: '#c9a86a' }}>Tier {index + 1}</strong>
                                    {eventForm.ticketTiers.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveTicketTier(index)}
                                        style={{
                                          padding: '4px 10px',
                                          background: 'rgba(255, 59, 48, 0.2)',
                                          border: '1px solid rgba(255, 59, 48, 0.5)',
                                          color: '#ff3b30',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          fontSize: '0.85rem'
                                        }}
                                      >
                                        Remove
                                      </button>
                                    )}
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                                    <div>
                                      <label style={{ fontSize: '0.9rem', marginBottom: '0.25rem', display: 'block' }}>Tier Name *</label>
                                      <input
                                        type="text"
                                        value={tier.name}
                                        onChange={(e) => handleTicketTierChange(index, 'name', e.target.value)}
                                        placeholder="e.g., Early Bird, VIP, General"
                                        required
                                        style={{ width: '100%' }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.9rem', marginBottom: '0.25rem', display: 'block' }}>Price ($) *</label>
                                      <input
                                        type="number"
                                        value={tier.price}
                                        onChange={(e) => handleTicketTierChange(index, 'price', e.target.value)}
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        required
                                        style={{ width: '100%' }}
                                      />
                                    </div>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                                    <div>
                                      <label style={{ fontSize: '0.9rem', marginBottom: '0.25rem', display: 'block' }}>Capacity *</label>
                                      <input
                                        type="number"
                                        value={tier.capacity}
                                        onChange={(e) => handleTicketTierChange(index, 'capacity', e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        required
                                        style={{ width: '100%' }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.9rem', marginBottom: '0.25rem', display: 'block' }}>Benefits (Optional)</label>
                                      <input
                                        type="text"
                                        value={tier.benefits}
                                        onChange={(e) => handleTicketTierChange(index, 'benefits', e.target.value)}
                                        placeholder="e.g., Priority seating, Welcome gift"
                                        style={{ width: '100%' }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: 'rgba(0, 122, 255, 0.1)',
                            border: '1px solid rgba(0, 122, 255, 0.3)',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            color: 'rgba(232, 232, 232, 0.7)'
                          }}>
                            <strong style={{ color: '#007aff' }}>Note:</strong> When using tiered pricing, the regular price and capacity fields are ignored. Total capacity and pricing are determined by your ticket tiers.
                          </div>
                        </div>
                      )}
                    </div>
                    END OF TIERED PRICING COMMENT */}

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
                    <th>Ticket Tier</th>
                    <th>Credit Used</th>
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
                      <td>
                        {booking.ticketTierName ? (
                          <span style={{
                            background: 'rgba(201, 168, 106, 0.2)',
                            color: '#c9a86a',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}>
                            {booking.ticketTierName}
                          </span>
                        ) : (
                          <span style={{ color: 'rgba(232, 232, 232, 0.5)' }}>Standard</span>
                        )}
                      </td>
                      <td>
                        {booking.usedCredits ? (
                          <span style={{
                            background: 'rgba(52, 199, 89, 0.2)',
                            color: '#34c759',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}>
                            {booking.usedCredits} {booking.usedCredits === 1 ? 'credit' : 'credits'}
                          </span>
                        ) : (
                          <span style={{ color: 'rgba(232, 232, 232, 0.5)' }}>—</span>
                        )}
                      </td>
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
                          backgroundColor: 'rgba(11, 85, 244, 1)'
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

        {activeTab === 'promoCodes' && (
          <div className="promo-codes-section">
            <div className="section-header">
              <h2>Manage Promo Codes</h2>
              <button onClick={() => {
                setShowPromoForm(true);
                setEditingPromo(null);
                resetPromoForm();
              }}>
                Create New Promo Code
              </button>
            </div>

            {/* Description/Help Text */}
            <div className="section-description">
              <h3>About Promo Codes</h3>
              <p>Create and manage discount codes to drive sales and reward customers. Promo codes can be used during checkout to reduce the booking price.</p>

              <div className="promo-tips">
                <h4>💡 Tips for Creating Effective Promo Codes:</h4>
                <ul>
                  <li><strong>First-Time Customers:</strong> Use codes like FIRST10 or WELCOME15 to attract new customers</li>
                  <li><strong>Early Bird Discounts:</strong> Reward customers who book in advance (e.g., EARLYBIRD, ADVANCE20)</li>
                  <li><strong>Social Media:</strong> Create exclusive codes for Instagram/Facebook followers (e.g., INSTA15, FB10)</li>
                  <li><strong>Loyalty Rewards:</strong> Thank returning customers with special codes (e.g., LOYAL20, VIP25)</li>
                  <li><strong>Seasonal Campaigns:</strong> Run time-limited promotions (e.g., SUMMER10, HOLIDAY15)</li>
                  <li><strong>Influencer Partnerships:</strong> Give influencers unique codes to track referrals</li>
                </ul>
              </div>

              <div className="promo-features">
                <h4>✨ Features:</h4>
                <ul>
                  <li><strong>Flexible Discounts:</strong> Choose percentage (10%, 25%) or fixed amount ($5, $10)</li>
                  <li><strong>Usage Limits:</strong> Set total usage limits and per-user limits</li>
                  <li><strong>Minimum Purchase:</strong> Require minimum booking amount</li>
                  <li><strong>Schedule Codes:</strong> Set start dates and expiry dates</li>
                  <li><strong>Track Performance:</strong> See usage count for each code</li>
                  <li><strong>Quick Toggle:</strong> Activate or deactivate codes instantly</li>
                </ul>
              </div>
            </div>

            {showPromoForm && (
              <div className="event-form-modal">
                <div className="event-form-container">
                  <h3>{editingPromo ? 'Edit Promo Code' : 'Create New Promo Code'}</h3>
                  <form onSubmit={handleCreatePromoCode}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Code *</label>
                        <input
                          type="text"
                          name="code"
                          value={promoForm.code}
                          onChange={handlePromoFormChange}
                          placeholder="SUMMER2024"
                          required
                          disabled={editingPromo}
                          style={{ textTransform: 'uppercase' }}
                        />
                        <small>Will be converted to uppercase</small>
                      </div>
                      <div className="form-group">
                        <label>Discount Type *</label>
                        <select
                          name="discountType"
                          value={promoForm.discountType}
                          onChange={handlePromoFormChange}
                          required
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount ($)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Description *</label>
                      <input
                        type="text"
                        name="description"
                        value={promoForm.description}
                        onChange={handlePromoFormChange}
                        placeholder="10% off for new customers"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Discount Value * {promoForm.discountType === 'percentage' ? '(%)' : '($)'}</label>
                        <input
                          type="number"
                          name="discountValue"
                          value={promoForm.discountValue}
                          onChange={handlePromoFormChange}
                          min="0"
                          step="0.01"
                          placeholder={promoForm.discountType === 'percentage' ? '10' : '5.00'}
                          required
                        />
                      </div>
                      {promoForm.discountType === 'percentage' && (
                        <div className="form-group">
                          <label>Max Discount ($) (optional)</label>
                          <input
                            type="number"
                            name="maxDiscount"
                            value={promoForm.maxDiscount}
                            onChange={handlePromoFormChange}
                            min="0"
                            step="0.01"
                            placeholder="50.00"
                          />
                          <small>Cap the maximum discount amount</small>
                        </div>
                      )}
                      <div className="form-group">
                        <label>Minimum Purchase ($)</label>
                        <input
                          type="number"
                          name="minPurchase"
                          value={promoForm.minPurchase}
                          onChange={handlePromoFormChange}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Total Usage Limit (optional)</label>
                        <input
                          type="number"
                          name="usageLimit"
                          value={promoForm.usageLimit}
                          onChange={handlePromoFormChange}
                          min="1"
                          placeholder="Unlimited"
                        />
                        <small>Leave empty for unlimited uses</small>
                      </div>
                      <div className="form-group">
                        <label>Per User Limit</label>
                        <input
                          type="number"
                          name="perUserLimit"
                          value={promoForm.perUserLimit}
                          onChange={handlePromoFormChange}
                          min="1"
                          placeholder="1"
                        />
                        <small>Times one user can use this code</small>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Start Date</label>
                        <input
                          type="date"
                          name="startDate"
                          value={promoForm.startDate}
                          onChange={handlePromoFormChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Expiry Date (optional)</label>
                        <input
                          type="date"
                          name="expiryDate"
                          value={promoForm.expiryDate}
                          onChange={handlePromoFormChange}
                        />
                        <small>Leave empty for no expiry</small>
                      </div>
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={promoForm.isActive}
                          onChange={handlePromoFormChange}
                        />
                        Active (code can be used immediately)
                      </label>
                    </div>

                    <div className="form-actions">
                      <button type="button" onClick={() => {
                        setShowPromoForm(false);
                        setEditingPromo(null);
                        resetPromoForm();
                      }}>
                        Cancel
                      </button>
                      <button type="submit">
                        {editingPromo ? 'Update Promo Code' : 'Create Promo Code'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="promo-codes-table">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Discount</th>
                    <th>Usage</th>
                    <th>Valid Until</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map(promo => (
                    <tr key={promo._id}>
                      <td><strong>{promo.code}</strong></td>
                      <td>{promo.description}</td>
                      <td>
                        {promo.discountType === 'percentage'
                          ? `${promo.discountValue}%`
                          : `$${promo.discountValue}`}
                        {promo.maxDiscount && ` (max $${promo.maxDiscount})`}
                      </td>
                      <td>
                        {promo.usageCount} / {promo.usageLimit || '∞'}
                      </td>
                      <td>
                        {promo.expiryDate
                          ? new Date(promo.expiryDate).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td>
                        <span className={`status-badge ${promo.isValid() ? 'completed' : 'failed'}`}>
                          {promo.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleTogglePromoCode(promo._id)}>
                          {promo.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleEditPromoCode(promo)}>Edit</button>
                        <button onClick={() => handleDeletePromoCode(promo._id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'emailMarketing' && (
          <div className="email-marketing-section">
            <div className="section-header">
              <h2>Email Marketing</h2>
              <button onClick={() => {
                setShowEmailForm(true);
                resetEmailForm();
              }}>
                Create New Campaign
              </button>
            </div>

            {/* Description */}
            <div className="section-description">
              <h3>About Email Marketing</h3>
              <p>Send targeted email campaigns to your customers to announce new events, share promotions, and build loyalty.</p>

              <div className="promo-tips">
                <h4>💡 Campaign Ideas:</h4>
                <ul>
                  <li><strong>New Event Announcements:</strong> Email all customers when you launch a new popup</li>
                  <li><strong>Win-Back Campaigns:</strong> Re-engage customers who haven't booked recently</li>
                  <li><strong>Exclusive Offers:</strong> Send promo codes to reward loyal customers</li>
                  <li><strong>Last Chance Reminders:</strong> Alert customers about events filling up</li>
                </ul>
              </div>
            </div>

            {showEmailForm && (
              <div className="event-form-modal">
                <div className="event-form-container">
                  <h3>Create Email Campaign</h3>
                  <form onSubmit={handleCreateCampaign}>
                    <div className="form-group">
                      <label>Campaign Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={emailForm.name}
                        onChange={handleEmailFormChange}
                        placeholder="Summer Promotion 2024"
                        required
                      />
                      <small>Internal name for your reference</small>
                    </div>

                    <div className="form-group">
                      <label>Email Subject *</label>
                      <input
                        type="text"
                        name="subject"
                        value={emailForm.subject}
                        onChange={handleEmailFormChange}
                        placeholder="New Pilates Popup in Berkeley!"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Message *</label>
                      <textarea
                        name="message"
                        value={emailForm.message}
                        onChange={handleEmailFormChange}
                        rows="8"
                        placeholder="We're excited to announce our next popup event in Berkeley!&#10;&#10;Join us for an incredible pilates experience..."
                        required
                      />
                      <small>Write your email message. Keep it friendly and engaging!</small>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Recipients *</label>
                        <select
                          name="recipients"
                          value={emailForm.recipients}
                          onChange={handleEmailFormChange}
                          required
                        >
                          <option value="all">All Customers</option>
                          <option value="past_customers">Past Customers (Completed Bookings)</option>
                          <option value="recent">Recent (Last 30 Days)</option>
                          <option value="custom">Custom Email List</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Include Promo Code (Optional)</label>
                        <select
                          name="includedPromoCode"
                          value={emailForm.includedPromoCode}
                          onChange={handleEmailFormChange}
                        >
                          <option value="">No Promo Code</option>
                          {promoCodes.filter(p => p.isActive).map(promo => (
                            <option key={promo._id} value={promo._id}>
                              {promo.code} - {promo.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {emailForm.recipients === 'custom' && (
                      <div className="form-group">
                        <label>Custom Email List</label>
                        <textarea
                          name="customEmails"
                          value={emailForm.customEmails}
                          onChange={handleEmailFormChange}
                          rows="4"
                          placeholder="email1@example.com, email2@example.com, email3@example.com"
                        />
                        <small>Comma-separated email addresses</small>
                      </div>
                    )}

                    <div className="form-group">
                      <button
                        type="button"
                        onClick={handlePreviewRecipients}
                        style={{
                          background: '#2196F3',
                          color: 'white',
                          padding: '0.75rem 1.5rem',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '4px'
                        }}
                      >
                        Preview Recipients
                      </button>
                      {recipientPreview && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(100, 255, 100, 0.1)', borderRadius: '4px' }}>
                          <strong>Will send to {recipientPreview.count} recipients</strong>
                          {recipientPreview.emails && recipientPreview.emails.length > 0 && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'rgba(232, 232, 232, 0.7)' }}>
                              Preview: {recipientPreview.emails.slice(0, 5).join(', ')}
                              {recipientPreview.count > 5 && '...'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="form-actions">
                      <button type="button" onClick={() => {
                        setShowEmailForm(false);
                        resetEmailForm();
                      }}>
                        Cancel
                      </button>
                      <button type="submit">
                        Create Campaign
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="email-campaigns-table">
              <table>
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Subject</th>
                    <th>Recipients</th>
                    <th>Status</th>
                    <th>Sent</th>
                    <th>Success Rate</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {emailCampaigns.map(campaign => (
                    <tr key={campaign._id}>
                      <td><strong>{campaign.name}</strong></td>
                      <td>{campaign.subject}</td>
                      <td>
                        {campaign.recipients === 'all' && 'All Customers'}
                        {campaign.recipients === 'past_customers' && 'Past Customers'}
                        {campaign.recipients === 'recent' && 'Recent (30 days)'}
                        {campaign.recipients === 'custom' && 'Custom List'}
                      </td>
                      <td>
                        <span className={`status-badge ${campaign.status === 'sent' ? 'completed' : campaign.status === 'failed' ? 'failed' : 'pending'}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td>
                        {campaign.sentAt
                          ? new Date(campaign.sentAt).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        {campaign.totalRecipients > 0
                          ? `${campaign.successCount}/${campaign.totalRecipients} (${Math.round((campaign.successCount / campaign.totalRecipients) * 100)}%)`
                          : '-'}
                      </td>
                      <td>
                        {campaign.status === 'draft' && (
                          <button
                            onClick={() => handleSendCampaign(campaign._id)}
                            style={{ backgroundColor: '#4CAF50' }}
                          >
                            Send Now
                          </button>
                        )}
                        {campaign.status !== 'sending' && (
                          <button onClick={() => handleDeleteCampaign(campaign._id)}>
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <h2>Analytics Dashboard</h2>

            {/* Core Metrics */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#c9a86a' }}>Core Metrics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Events</h3>
                  <p className="stat-value">{events.length}</p>
                  <small style={{ color: 'rgba(232, 232, 232, 0.6)' }}>
                    {events.filter(e => new Date(e.date) >= new Date()).length} upcoming
                  </small>
                </div>
                <div className="stat-card">
                  <h3>Total Bookings</h3>
                  <p className="stat-value">{bookings.length}</p>
                  <small style={{ color: 'rgba(232, 232, 232, 0.6)' }}>
                    {bookings.filter(b => b.status === 'confirmed').length} confirmed
                  </small>
                </div>
                <div className="stat-card" style={{ background: 'rgba(52, 199, 89, 0.1)', borderColor: 'rgba(52, 199, 89, 0.3)' }}>
                  <h3>Total Revenue</h3>
                  <p className="stat-value" style={{ color: '#34c759' }}>
                    ${bookings.reduce((sum, b) => sum + (b.paymentStatus === 'completed' ? b.totalAmount : 0), 0).toFixed(2)}
                  </p>
                  <small style={{ color: 'rgba(232, 232, 232, 0.6)' }}>
                    From {bookings.filter(b => b.paymentStatus === 'completed').length} completed payments
                  </small>
                </div>
                <div className="stat-card">
                  <h3>Avg Booking Value</h3>
                  <p className="stat-value">
                    ${bookings.length > 0 ?
                      (bookings.reduce((sum, b) => sum + b.totalAmount, 0) / bookings.length).toFixed(2) :
                      '0.00'}
                  </p>
                  <small style={{ color: 'rgba(232, 232, 232, 0.6)' }}>
                    Per transaction
                  </small>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#c9a86a' }}>Revenue Breakdown</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Event Bookings</h3>
                  <p className="stat-value">
                    ${bookings
                      .filter(b => b.paymentStatus === 'completed' && !b.usedCredits)
                      .reduce((sum, b) => sum + b.totalAmount, 0)
                      .toFixed(2)}
                  </p>
                  <small style={{ color: 'rgba(232, 232, 232, 0.6)' }}>
                    Direct event revenue
                  </small>
                </div>
                <div className="stat-card">
                  <h3>Tiered Bookings</h3>
                  <p className="stat-value">
                    ${bookings
                      .filter(b => b.paymentStatus === 'completed' && b.ticketTierId)
                      .reduce((sum, b) => sum + b.totalAmount, 0)
                      .toFixed(2)}
                  </p>
                  <small style={{ color: 'rgba(232, 232, 232, 0.6)' }}>
                    {bookings.filter(b => b.ticketTierId).length} tiered tickets sold
                  </small>
                </div>
                <div className="stat-card">
                  <h3>Credit Redemptions</h3>
                  <p className="stat-value" style={{ color: '#ff9500' }}>
                    {bookings.filter(b => b.usedCredits).reduce((sum, b) => sum + (b.usedCredits || 0), 0)}
                  </p>
                  <small style={{ color: 'rgba(232, 232, 232, 0.6)' }}>
                    Credits redeemed ({bookings.filter(b => b.usedCredits).length} bookings)
                  </small>
                </div>
                <div className="stat-card">
                  <h3>Pending Revenue</h3>
                  <p className="stat-value" style={{ color: '#ff9500' }}>
                    ${bookings
                      .filter(b => b.paymentStatus === 'pending')
                      .reduce((sum, b) => sum + b.totalAmount, 0)
                      .toFixed(2)}
                  </p>
                  <small style={{ color: 'rgba(232, 232, 232, 0.6)' }}>
                    {bookings.filter(b => b.paymentStatus === 'pending').length} pending payments
                  </small>
                </div>
              </div>
            </div>

            {/* Class Packs & Credits */}

            {/* Referral Program ROI */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#c9a86a' }}>Referral Program Performance</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Referrals</h3>
                  <p className="stat-value">
                    {referralLeaderboard.reduce((sum, u) => sum + (u.referralCount || 0), 0)}
                  </p>
                  <small style={{ color: 'rgba(232, 232, 232, 0.6)' }}>
                    By {referralLeaderboard.length} active referrers
                  </small>
                </div>
                <div className="stat-card">
                  <h3>Elite Members</h3>
                  <p className="stat-value" style={{ color: '#FFD700' }}>
                    {referralLeaderboard.filter(u => u.referralTier === 'elite').length}
                  </p>
                  <small style={{ color: 'rgba(232, 232, 232, 0.6)' }}>
                    10+ referrals each
                  </small>
                </div>
                <div className="stat-card">
                  <h3>Ambassador Members</h3>
                  <p className="stat-value" style={{ color: '#C0C0C0' }}>
                    {referralLeaderboard.filter(u => u.referralTier === 'ambassador').length}
                  </p>
                  <small style={{ color: 'rgba(232, 232, 232, 0.6)' }}>
                    4-9 referrals each
                  </small>
                </div>
                <div className="stat-card">
                  <h3>Avg Referrals/User</h3>
                  <p className="stat-value">
                    {referralLeaderboard.length > 0 ?
                      (referralLeaderboard.reduce((sum, u) => sum + (u.referralCount || 0), 0) / referralLeaderboard.length).toFixed(1) :
                      '0.0'}
                  </p>
                  <small style={{ color: 'rgba(232, 232, 232, 0.6)' }}>
                    Per active referrer
                  </small>
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#c9a86a' }}>Top Performers</h3>
              <div style={{
                background: 'rgba(201, 168, 106, 0.1)',
                border: '1px solid rgba(201, 168, 106, 0.3)',
                borderRadius: '8px',
                padding: '1.5rem'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Top 5 Events by Revenue</h4>
                {events.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {events
                      .map(event => ({
                        ...event,
                        revenue: bookings
                          .filter(b => b.event?._id === event._id && b.paymentStatus === 'completed')
                          .reduce((sum, b) => sum + b.totalAmount, 0)
                      }))
                      .sort((a, b) => b.revenue - a.revenue)
                      .slice(0, 5)
                      .map((event, index) => (
                        <div key={event._id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: 'rgba(26, 26, 26, 0.5)',
                          borderRadius: '4px'
                        }}>
                          <div>
                            <span style={{ color: index < 3 ? '#c9a86a' : 'rgba(232, 232, 232, 0.9)', fontWeight: '600' }}>
                              #{index + 1}
                            </span>
                            <span style={{ marginLeft: '1rem' }}>{event.title}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#34c759', fontWeight: '600', fontSize: '1.1rem' }}>
                              ${event.revenue.toFixed(2)}
                            </div>
                            <small style={{ color: 'rgba(232, 232, 232, 0.6)' }}>
                              {bookings.filter(b => b.event?._id === event._id && b.paymentStatus === 'completed').length} bookings
                            </small>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'rgba(232, 232, 232, 0.5)', margin: 0 }}>
                    No events yet
                  </p>
                )}
              </div>
            </div>

            {/* Coming Soon */}
            <div style={{
              padding: '1.5rem',
              background: 'rgba(0, 122, 255, 0.1)',
              border: '1px solid rgba(0, 122, 255, 0.3)',
              borderRadius: '8px'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#007aff' }}>
                📊 Coming Soon
              </h3>
              <ul style={{ lineHeight: '1.8', marginBottom: 0, color: 'rgba(232, 232, 232, 0.8)', columns: 2, columnGap: '2rem' }}>
                <li>Monthly recurring revenue (MRR)</li>
                <li>Customer lifetime value (LTV)</li>
                <li>Churn rate tracking</li>
                <li>Email campaign conversion rates</li>
                <li>Promo code usage analytics</li>
                <li>Peak booking times</li>
                <li>Geographic distribution</li>
                <li>Custom date range filters</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'settings' && settings && (
          <div className="settings-section">
            <h2>Site Settings</h2>
            <form onSubmit={handleUpdateSettings} className="settings-form">

              {/* Social Media Section */}
              <div className="settings-card">
                <h3>Social Media Links</h3>
                <div className="form-group">
                  <label>Instagram URL</label>
                  <input
                    type="url"
                    value={settings.socialMedia?.instagram || ''}
                    onChange={(e) => handleSettingsChange('socialMedia', 'instagram', e.target.value)}
                    placeholder="https://instagram.com/thethefeverstudio"
                  />
                </div>
                <div className="form-group">
                  <label>Facebook URL</label>
                  <input
                    type="url"
                    value={settings.socialMedia?.facebook || ''}
                    onChange={(e) => handleSettingsChange('socialMedia', 'facebook', e.target.value)}
                    placeholder="https://facebook.com/thethefeverstudio"
                  />
                </div>
                <div className="form-group">
                  <label>Twitter/X URL</label>
                  <input
                    type="url"
                    value={settings.socialMedia?.twitter || ''}
                    onChange={(e) => handleSettingsChange('socialMedia', 'twitter', e.target.value)}
                    placeholder="https://twitter.com/thefeverstudio"
                  />
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="settings-card">
                <h3>Contact Information</h3>
                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={settings.contact?.email || ''}
                    onChange={(e) => handleSettingsChange('contact', 'email', e.target.value)}
                    placeholder="info@thefeverstudio.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={settings.contact?.phone || ''}
                    onChange={(e) => handleSettingsChange('contact', 'phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={settings.contact?.address || ''}
                    onChange={(e) => handleSettingsChange('contact', 'address', e.target.value)}
                    placeholder="123 Main St, City, State 12345"
                  />
                </div>
              </div>

              {/* Email Configuration Section */}
              <div className="settings-card">
                <h3>Email Configuration</h3>
                <div className="form-group">
                  <label>From Name</label>
                  <input
                    type="text"
                    value={settings.emailConfig?.fromName || ''}
                    onChange={(e) => handleSettingsChange('emailConfig', 'fromName', e.target.value)}
                    placeholder="The Fever Studio"
                  />
                </div>
                <div className="form-group">
                  <label>From Email</label>
                  <input
                    type="email"
                    value={settings.emailConfig?.fromEmail || ''}
                    onChange={(e) => handleSettingsChange('emailConfig', 'fromEmail', e.target.value)}
                    placeholder="info@thefeverstudio.com"
                  />
                </div>
                <div className="form-group">
                  <label>Reply-To Email</label>
                  <input
                    type="email"
                    value={settings.emailConfig?.replyTo || ''}
                    onChange={(e) => handleSettingsChange('emailConfig', 'replyTo', e.target.value)}
                    placeholder="info@thefeverstudio.com"
                  />
                </div>
              </div>

              {/* Payment Settings Section */}
              <div className="settings-card">
                <h3>Payment Settings</h3>
                <div className="form-group">
                  <label>Venmo Username</label>
                  <input
                    type="text"
                    value={settings.payment?.venmoUsername || ''}
                    onChange={(e) => handleSettingsChange('payment', 'venmoUsername', e.target.value)}
                    placeholder="@thefeverstudio"
                  />
                </div>
                <div className="form-group">
                  <label>PayPal Email</label>
                  <input
                    type="email"
                    value={settings.payment?.paypalEmail || ''}
                    onChange={(e) => handleSettingsChange('payment', 'paypalEmail', e.target.value)}
                    placeholder="payments@thefeverstudio.com"
                  />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={settings.payment?.acceptVenmo || false}
                      onChange={(e) => handleSettingsChange('payment', 'acceptVenmo', e.target.checked)}
                    />
                    Accept Venmo
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={settings.payment?.acceptPayPal || false}
                      onChange={(e) => handleSettingsChange('payment', 'acceptPayPal', e.target.checked)}
                    />
                    Accept PayPal
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={settings.payment?.acceptCash || false}
                      onChange={(e) => handleSettingsChange('payment', 'acceptCash', e.target.checked)}
                    />
                    Accept Cash
                  </label>
                </div>
              </div>

              {/* Site Information Section */}
              <div className="settings-card">
                <h3>Site Information</h3>
                <div className="form-group">
                  <label>Site Name</label>
                  <input
                    type="text"
                    value={settings.siteInfo?.siteName || ''}
                    onChange={(e) => handleSettingsChange('siteInfo', 'siteName', e.target.value)}
                    placeholder="The Fever Studio"
                  />
                </div>
                <div className="form-group">
                  <label>Tagline</label>
                  <input
                    type="text"
                    value={settings.siteInfo?.tagline || ''}
                    onChange={(e) => handleSettingsChange('siteInfo', 'tagline', e.target.value)}
                    placeholder="Exclusive Pilates Popup Events"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={settings.siteInfo?.description || ''}
                    onChange={(e) => handleSettingsChange('siteInfo', 'description', e.target.value)}
                    placeholder="Join us for unique pilates experiences in stunning locations"
                    rows="3"
                  />
                </div>
              </div>

              {/* Home Page Images Section */}
              <div className="settings-card">
                <h3>Home Page Images</h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(232, 232, 232, 0.7)', marginBottom: '1.5rem' }}>
                  Upload images for the home page sections. Images will be optimized and stored in Cloudinary.
                </p>

                <div className="form-group">
                  <label>About Section Image (Wellness · Community · Movement)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleAboutImageChange}
                  />
                  {(aboutImagePreview || settings.homeImages?.aboutImage) && (
                    <div className="image-preview" style={{ marginTop: '1rem' }}>
                      <img
                        src={aboutImagePreview || settings.homeImages?.aboutImage}
                        alt="About section preview"
                        style={{ maxWidth: '300px', border: '1px solid rgba(255,255,255,0.2)' }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Mission Section Image (Movement · Community · Wellness)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleMissionImageChange}
                  />
                  {(missionImagePreview || settings.homeImages?.missionImage) && (
                    <div className="image-preview" style={{ marginTop: '1rem' }}>
                      <img
                        src={missionImagePreview || settings.homeImages?.missionImage}
                        alt="Mission section preview"
                        style={{ maxWidth: '300px', border: '1px solid rgba(255,255,255,0.2)' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '2rem' }}>
                <button type="submit" className="btn-primary">
                  Save All Settings
                </button>
              </div>
            </form>
          </div>
        )}


        {/* Email Automation Dashboard Tab */}
        {activeTab === 'emailAutomation' && (
          <AutomatedCampaigns />
        )}

        {/* Memberships Tab */}
        {activeTab === 'memberships' && (
          <AdminMembershipSection />
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <h2>Manage Reviews</h2>
            <p style={{ marginBottom: '2rem', color: 'rgba(232, 232, 232, 0.7)' }}>
              Approve, feature, or delete customer reviews. Featured reviews appear on the homepage.
            </p>

            {reviews.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '3rem', color: 'rgba(232, 232, 232, 0.5)' }}>
                No reviews yet
              </p>
            ) : (
              <div className="bookings-table">
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Name</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map(review => (
                      <tr key={review._id}>
                        <td>{review.event?.title || 'N/A'}</td>
                        <td>{review.name}</td>
                        <td>
                          <span style={{ color: '#c9a86a', fontSize: '1.2rem' }}>
                            {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </span>
                        </td>
                        <td style={{ maxWidth: '300px' }}>{review.comment}</td>
                        <td>
                          {review.featured && <span className="status-badge completed">Featured</span>}
                          {review.approved ? (
                            <span className="status-badge completed">Approved</span>
                          ) : (
                            <span className="status-badge pending">Pending</span>
                          )}
                        </td>
                        <td>
                          {!review.approved && (
                            <button onClick={() => handleApproveReview(review._id)}>
                              Approve
                            </button>
                          )}
                          {review.approved && (
                            <button onClick={() => handleToggleFeaturedReview(review._id)}>
                              {review.featured ? 'Unfeature' : 'Feature'}
                            </button>
                          )}
                          <button onClick={() => handleDeleteReview(review._id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div>
            <h2>Referral Leaderboard</h2>

            <div className="section-description">
              <h3>How the Referral Program Works</h3>
              <p>
                Track and reward your most engaged community members who are spreading the word about your events.
              </p>

              <div className="promo-features">
                <h4>Key Metrics</h4>
                <ul>
                  <li><strong>Rank:</strong> Top 3 referrers are highlighted in gold</li>
                  <li><strong>Referral Code:</strong> Unique code each user shares (auto-generated when they visit their profile)</li>
                  <li><strong>Total Referrals:</strong> Number of new users who signed up using their code</li>
                  <li><strong>Credits Earned:</strong> Dollar amount of credits earned from successful referrals</li>
                </ul>
              </div>

              <div className="promo-tips">
                <h4>Program Details</h4>
                <ul>
                  <li>New users get <strong>10% off</strong> their first booking when using a referral code</li>
                  <li>Referrers earn <strong>credits</strong> that can be applied to future bookings</li>
                  <li>Users can find their referral link in their <strong>Profile page</strong></li>
                  <li>Encourage top referrers with special rewards or recognition</li>
                </ul>
                <h4 style={{ marginTop: '1rem' }}>Referral Tiers & Rewards</h4>
                <ul>
                  <li>🌟 <strong>Starter</strong> (0-3 referrals): Earn <strong>$10</strong> per successful referral</li>
                  <li>🎖️ <strong>Ambassador</strong> (4-9 referrals): Earn <strong>$15</strong> per successful referral</li>
                  <li>⭐ <strong>Elite</strong> (10+ referrals): Earn <strong>$20</strong> per successful referral</li>
                </ul>
              </div>
            </div>

            {referralLeaderboard.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '3rem', color: 'rgba(232, 232, 232, 0.5)' }}>
                No referrals yet
              </p>
            ) : (
              <div className="bookings-table">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Referral Tier</th>
                      <th>Referral Code</th>
                      <th>Total Referrals</th>
                      <th>Credits Earned</th>
                      <th>Reward Per Referral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralLeaderboard.map((user, index) => {
                      const tier = user.referralTier || 'starter';
                      const rewardAmount = tier === 'elite' ? 20 : tier === 'ambassador' ? 15 : 10;
                      return (
                        <tr key={user._id}>
                          <td>
                            <strong style={{ fontSize: '1.3rem', color: index < 3 ? '#c9a86a' : 'inherit' }}>
                              #{index + 1}
                            </strong>
                          </td>
                          <td>{user.name}</td>
                          <td style={{ color: 'rgba(232, 232, 232, 0.7)', fontSize: '0.9rem' }}>{user.email}</td>
                          <td>
                            <span style={{
                              background: tier === 'elite' ?
                                'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' :
                                tier === 'ambassador' ?
                                'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)' :
                                'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              color: '#1a1a1a',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              textTransform: 'uppercase',
                              display: 'inline-block'
                            }}>
                              {tier === 'elite' ? '⭐ ELITE' :
                               tier === 'ambassador' ? '🎖️ AMBASSADOR' :
                               '🌟 STARTER'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', color: '#c9a86a', fontWeight: 'bold' }}>
                              {user.referralCode}
                            </span>
                          </td>
                          <td><strong style={{ fontSize: '1.1rem', color: '#c9a86a' }}>{user.referralCount}</strong></td>
                          <td>
                            <strong style={{ color: '#34c759' }}>${user.referralCredits}</strong>
                          </td>
                          <td>
                            <span style={{
                              background: 'rgba(52, 199, 89, 0.2)',
                              color: '#34c759',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontWeight: '600'
                            }}>
                              ${rewardAmount}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Check-In Tab */}
        {activeTab === 'checkin' && (
          <QRScanner />
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
