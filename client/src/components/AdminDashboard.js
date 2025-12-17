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

  // Helper function to parse date without timezone conversion
  const parseEventDate = (dateString) => {
    const dateStr = dateString.split('T')[0]; // Get YYYY-MM-DD part only
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // Create date in local timezone
  };
  const [bookings, setBookings] = useState([]);
  const [bookingSourceFilter, setBookingSourceFilter] = useState('all');
  const [users, setUsers] = useState([]);
  const [classPassAnalytics, setClassPassAnalytics] = useState(null);
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
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [recipientPreview, setRecipientPreview] = useState(null);
  const [activeHelpSection, setActiveHelpSection] = useState('getting-started');
  const [smsStats, setSmsStats] = useState(null);
  const [twilioStatus, setTwilioStatus] = useState(null);
  const [testSmsPhone, setTestSmsPhone] = useState('');
  const [testSmsMessage, setTestSmsMessage] = useState('');
  const [testSmsResult, setTestSmsResult] = useState(null);

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
    ticketTiers: [],
    isRecurring: false,
    recurrencePattern: 'none',
    recurrenceDays: [],
    recurrenceEndDate: ''
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
    emailLists: [],
    includedPromoCode: ''
  });

  const [emailLists, setEmailLists] = useState([]);
  const [emailSubscribers, setEmailSubscribers] = useState([]);
  const [showListForm, setShowListForm] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [showSubscriberImport, setShowSubscriberImport] = useState(false);
  const [selectedListForImport, setSelectedListForImport] = useState(null);
  const [showAddSubscriberForm, setShowAddSubscriberForm] = useState(false);
  const [selectedListForAdd, setSelectedListForAdd] = useState(null);
  const [selectedSubscriberId, setSelectedSubscriberId] = useState('');
  const [expandedListId, setExpandedListId] = useState(null);
  const [listSubscribers, setListSubscribers] = useState({});
  const [showSubscriberForm, setShowSubscriberForm] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [selectedListIds, setSelectedListIds] = useState([]);
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [subscriberFilter, setSubscriberFilter] = useState('all');

  const [listForm, setListForm] = useState({
    name: '',
    description: '',
    type: 'static',
    dynamicCriteria: {
      membershipTiers: [],
      bookingStatus: '',
      inactiveDays: '',
      minBookings: '',
      maxBookings: '',
      hasActiveMembership: false,
      expiringCredits: false,
      expiringMembership: false,
      birthdayMonth: ''
    }
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
      } else if (activeTab === 'settings' || activeTab === 'homePage' || activeTab === 'cssEditor') {
        const [settingsRes, smsStatsRes, twilioStatusRes] = await Promise.all([
          api.get('/api/settings', config),
          api.get('/api/sms/stats', config).catch(() => ({ data: null })),
          api.get('/api/sms/config-status', config).catch(() => ({ data: null }))
        ]);
        setSettings(settingsRes.data);
        setSmsStats(smsStatsRes.data);
        setTwilioStatus(twilioStatusRes.data);
      } else if (activeTab === 'promoCodes') {
        const res = await api.get('/api/promo-codes', config);
        setPromoCodes(res.data);
      } else if (activeTab === 'emailMarketing') {
        // Fetch campaigns, promo codes, and email lists for the campaign form
        const [campaignsRes, promoCodesRes, emailListsRes] = await Promise.all([
          api.get('/api/email-campaigns', config),
          api.get('/api/promo-codes', config),
          api.get('/api/email-lists', config)
        ]);
        setEmailCampaigns(campaignsRes.data);
        setPromoCodes(promoCodesRes.data);
        setEmailLists(emailListsRes.data);
      } else if (activeTab === 'emailLists') {
        // Fetch email lists and subscribers
        const [listsRes, subscribersRes] = await Promise.all([
          api.get('/api/email-lists', config),
          api.get('/api/email-subscribers?limit=100', config)
        ]);
        setEmailLists(listsRes.data);
        setEmailSubscribers(subscribersRes.data.subscribers || subscribersRes.data);
      } else if (activeTab === 'emailSubscribers') {
        // Fetch all subscribers and lists
        const [subscribersRes, listsRes] = await Promise.all([
          api.get('/api/email-subscribers?limit=1000', config),
          api.get('/api/email-lists', config)
        ]);
        setEmailSubscribers(subscribersRes.data.subscribers || subscribersRes.data);
        setEmailLists(listsRes.data);
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
      } else if (activeTab === 'classpassAnalytics') {
        const res = await api.get('/api/classpass-analytics/overview', config);
        setClassPassAnalytics(res.data);
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

  // Generate time slots for :00 and :30 of each hour
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of ['00', '30']) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute}`;
        const time12 = convertTo12HourFormat(time24);
        slots.push({ value: time24, label: time12 });
      }
    }
    return slots;
  };

  // Handle day selection for recurring events
  const handleDayToggle = (day) => {
    const currentDays = eventForm.recurrenceDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    setEventForm({ ...eventForm, recurrenceDays: newDays });
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

      // Fix timezone issue: Parse date correctly to avoid day shifts
      // When date picker returns "2025-11-19", we need to treat it as a local date
      const [year, month, day] = eventForm.date.split('-').map(Number);
      const eventDate = new Date(year, month - 1, day, 12, 0, 0, 0); // Create date in local timezone at noon

      const eventData = {
        ...eventForm,
        date: eventDate.toISOString(), // Convert to ISO string for consistent storage
        time: convertedTime, // Use converted 12-hour format
        imageUrl: imageUrl || ''
      };

      console.log('Saving event:', {
        isEditing: !!editingEvent,
        originalDate: eventForm.date,
        convertedDate: eventDate.toISOString(),
        originalTime: eventForm.time,
        convertedTime: convertedTime,
        eventData: eventData
      });

      if (editingEvent) {
        const response = await api.put(`/api/events/${editingEvent._id}`, eventData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Update response:', response.data);
        alert('Class updated successfully!');
      } else {
        const response = await api.post('/api/events', eventData, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Check if recurring events were created
        if (response.data.count && response.data.count > 1) {
          alert(`Successfully created ${response.data.count} recurring classes!`);
        } else {
          alert('Class created successfully!');
        }
      }

      setShowEventForm(false);
      setEditingEvent(null);
      setImageFile(null);
      setImagePreview(null);
      resetEventForm();
      fetchData();
    } catch (error) {
      console.error('Error saving event:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to save event: ${error.response?.data?.error || error.message}`);
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
      imageUrl: event.imageUrl || '',
      useTieredPricing: event.useTieredPricing || false,
      ticketTiers: event.ticketTiers || [],
      isRecurring: event.isRecurring || false,
      recurrencePattern: event.recurrencePattern || 'none',
      recurrenceDays: event.recurrenceDays || [],
      recurrenceEndDate: event.recurrenceEndDate ? event.recurrenceEndDate.split('T')[0] : ''
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
      alert('Class deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete class.');
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
      imageUrl: '',
      useTieredPricing: false,
      ticketTiers: [],
      isRecurring: false,
      recurrencePattern: 'none',
      recurrenceDays: [],
      recurrenceEndDate: ''
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
          ...settings.homeImages,
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

      // If CSS Editor changes were made, reload the page to apply them
      if (activeTab === 'cssEditor') {
        alert('Settings updated successfully! Page will reload to apply style changes.');
        window.location.reload();
      } else {
        alert('Settings updated successfully!');
        fetchData(); // Refresh settings
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    }
  };

  // SMS Test Handler
  const handleSendTestSMS = async () => {
    if (!testSmsPhone) {
      alert('Please enter a phone number');
      return;
    }
    if (!testSmsMessage) {
      alert('Please enter a message');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      setTestSmsResult({ loading: true });

      const res = await api.post('/api/sms/test', {
        phoneNumber: testSmsPhone,
        message: testSmsMessage
      }, config);

      setTestSmsResult({
        success: true,
        message: res.data.message || 'Test SMS sent successfully!'
      });

      // Clear form after 3 seconds
      setTimeout(() => {
        setTestSmsResult(null);
        setTestSmsMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error sending test SMS:', error);

      const errorData = error.response?.data || {};
      const errorType = errorData.errorType;
      let errorMessage = errorData.error || 'Failed to send test SMS';
      let helpText = errorData.details || '';

      // Provide specific, actionable error messages based on error type
      switch (errorType) {
        case 'GLOBALLY_DISABLED':
          errorMessage = '⚠️ SMS is globally disabled';
          helpText = 'Enable SMS in Settings above (toggle "Enable SMS Notifications") then try again';
          break;
        case 'NOT_CONFIGURED':
          errorMessage = '❌ Twilio not configured';
          helpText = 'Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to Vercel environment variables';
          break;
        case 'PHONE_NOT_CONFIGURED':
          errorMessage = '❌ Twilio phone number missing';
          helpText = 'Add TWILIO_PHONE_NUMBER to Vercel environment variables';
          break;
        case 'INVALID_PHONE':
          errorMessage = '❌ Invalid phone number format';
          helpText = 'Use E.164 format: +1234567890 or (123) 456-7890';
          break;
        case 'DAILY_LIMIT_REACHED':
          errorMessage = errorData.error; // Already includes count
          helpText = 'Resets at midnight or increase limit in Settings';
          break;
        case 'TWILIO_API_ERROR':
          errorMessage = '❌ Twilio API Error';
          helpText = errorData.error || 'Check credentials, account balance, and phone number validity';
          break;
        default:
          // Use the error and details from the response
          break;
      }

      setTestSmsResult({
        success: false,
        message: errorMessage,
        details: helpText
      });
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
      emailLists: [],
      includedPromoCode: ''
    });
    setRecipientPreview(null);
  };

  const handlePreviewRecipients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/api/email-campaigns/preview-recipients', {
        recipients: emailForm.recipients,
        customEmails: emailForm.customEmails.split(',').map(e => e.trim()).filter(e => e),
        emailLists: emailForm.emailLists
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

      if (editingCampaign) {
        // Update existing campaign
        await api.put(`/api/email-campaigns/${editingCampaign._id}`, campaignData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Campaign updated successfully!');
      } else {
        // Create new campaign
        await api.post('/api/email-campaigns', campaignData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Campaign created successfully!');
      }

      setShowEmailForm(false);
      setEditingCampaign(null);
      resetEmailForm();
      fetchData();
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert(error.response?.data?.error || 'Failed to save campaign');
    }
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setEmailForm({
      name: campaign.name,
      subject: campaign.subject,
      message: campaign.message,
      recipients: campaign.recipients,
      emailLists: campaign.emailLists || [],
      customEmails: campaign.customEmails?.join(', ') || '',
      includedPromoCode: campaign.includedPromoCode || ''
    });
    setShowEmailForm(true);
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

  const handleTestSend = async () => {
    const testEmail = prompt('Enter email address(es) to send test (comma-separated):');

    if (!testEmail || testEmail.trim() === '') {
      return;
    }

    if (!emailForm.subject || !emailForm.message) {
      alert('Please fill in subject and message before sending test');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const testEmails = testEmail.split(',').map(e => e.trim()).filter(e => e);

      const response = await api.post('/api/email-campaigns/test-send', {
        subject: emailForm.subject,
        message: emailForm.message,
        testEmails: testEmails,
        promoCode: emailForm.includedPromoCode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(response.data.message);
    } catch (error) {
      console.error('Error sending test email:', error);
      alert(error.response?.data?.error || 'Failed to send test email');
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

  // Email List Handlers
  const handleListFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('dynamicCriteria.')) {
      const field = name.split('.')[1];
      setListForm({
        ...listForm,
        dynamicCriteria: {
          ...listForm.dynamicCriteria,
          [field]: type === 'checkbox' ? checked : value
        }
      });
    } else {
      setListForm({
        ...listForm,
        [name]: value
      });
    }
  };

  const handleCreateEmailList = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      const listData = {
        ...listForm,
        // Only send dynamicCriteria if it's a dynamic list
        dynamicCriteria: listForm.type === 'dynamic' ? listForm.dynamicCriteria : undefined
      };

      if (editingList) {
        await api.put(`/api/email-lists/${editingList._id}`, listData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Email list updated successfully!');
      } else {
        await api.post('/api/email-lists', listData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Email list created successfully!');
      }

      setShowListForm(false);
      setEditingList(null);
      resetListForm();
      fetchData();
    } catch (error) {
      console.error('Error saving email list:', error);
      alert(error.response?.data?.error || 'Failed to save email list');
    }
  };

  const resetListForm = () => {
    setListForm({
      name: '',
      description: '',
      type: 'static',
      dynamicCriteria: {
        membershipTiers: [],
        bookingStatus: '',
        inactiveDays: '',
        minBookings: '',
        maxBookings: '',
        hasActiveMembership: false,
        expiringCredits: false,
        expiringMembership: false,
        birthdayMonth: ''
      }
    });
  };

  const handleEditList = (list) => {
    setEditingList(list);
    setListForm({
      name: list.name,
      description: list.description || '',
      type: list.type,
      dynamicCriteria: list.dynamicCriteria || {
        membershipTiers: [],
        bookingStatus: '',
        inactiveDays: '',
        minBookings: '',
        maxBookings: '',
        hasActiveMembership: false,
        expiringCredits: false,
        expiringMembership: false,
        birthdayMonth: ''
      }
    });
    setShowListForm(true);
  };

  const handleAddSubscriber = async (e) => {
    e.preventDefault();

    if (!selectedSubscriberId) {
      alert('Please select a subscriber');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      // Find the selected subscriber
      const subscriber = emailSubscribers.find(sub => sub._id === selectedSubscriberId);
      if (!subscriber) {
        alert('Subscriber not found');
        return;
      }

      // Add subscriber to the list
      await api.post(`/api/email-lists/${selectedListForAdd}/subscribers`, {
        email: subscriber.email,
        name: subscriber.name,
        phone: subscriber.phone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Subscriber added successfully!');
      setShowAddSubscriberForm(false);
      setSelectedSubscriberId('');
      setSelectedListForAdd(null);
      fetchData();

      // Refresh subscribers if the list is expanded
      if (expandedListId === selectedListForAdd) {
        handleToggleViewSubscribers(selectedListForAdd);
      }
    } catch (error) {
      console.error('Error adding subscriber:', error);
      alert(error.response?.data?.error || 'Failed to add subscriber');
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this email list?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/email-lists/${listId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Email list deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('Failed to delete email list');
    }
  };

  const handleExportList = async (listId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/email-lists/${listId}/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Convert to CSV
      const csvContent = [
        ['Email', 'Name', 'Subscribed', 'Emails Sent', 'Emails Opened', 'Created At'].join(','),
        ...response.data.subscribers.map(sub => [
          sub.email,
          sub.name || '',
          sub.isSubscribed,
          sub.totalEmailsSent,
          sub.totalEmailsOpened,
          new Date(sub.createdAt).toLocaleDateString()
        ].join(','))
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${response.data.listName}-subscribers.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      alert(`Exported ${response.data.count} subscribers!`);
    } catch (error) {
      console.error('Error exporting list:', error);
      alert(error.response?.data?.error || 'Failed to export list');
    }
  };

  const handleToggleViewSubscribers = async (listId) => {
    if (expandedListId === listId) {
      setExpandedListId(null);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/api/email-lists/${listId}/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setListSubscribers(prev => ({
        ...prev,
        [listId]: response.data.subscribers
      }));
      setExpandedListId(listId);
    } catch (error) {
      console.error('Error exporting list:', error);
      alert('Failed to export list');
    }
  };

  const handleImportSubscribers = async (listId, file) => {
    try {
      const token = localStorage.getItem('token');
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      // Skip header row, parse CSV
      const subscribers = lines.slice(1).map(line => {
        const [email, name] = line.split(',').map(s => s.trim());
        return { email, name: name || '' };
      }).filter(sub => sub.email && sub.email.includes('@'));

      if (subscribers.length === 0) {
        alert('No valid email addresses found in file');
        return;
      }

      const response = await api.post(`/api/email-lists/${listId}/import`, {
        subscribers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Import complete! Imported: ${response.data.results.imported}, Updated: ${response.data.results.updated}, Failed: ${response.data.results.failed}`);
      setShowSubscriberImport(false);
      setSelectedListForImport(null);
      fetchData();
    } catch (error) {
      console.error('Error importing subscribers:', error);
      alert(error.response?.data?.error || 'Failed to import subscribers');
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
        <div style={{ gridColumn: '1 / -1', fontSize: '0.7rem', color: 'rgba(201, 168, 106, 0.6)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Core Operations</div>
        <button
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => setActiveTab('events')}
        >
          Classes
        </button>
        <button
          className={activeTab === 'bookings' ? 'active' : ''}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings
        </button>
        <button
          className={activeTab === 'checkin' ? 'active' : ''}
          onClick={() => setActiveTab('checkin')}
        >
          Check-In
        </button>

        <div style={{ gridColumn: '1 / -1', height: '1px', background: 'rgba(201, 168, 106, 0.3)', margin: '12px 0 8px 0' }}></div>

        {/* Customer Engagement */}
        <div style={{ gridColumn: '1 / -1', fontSize: '0.7rem', color: 'rgba(201, 168, 106, 0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Customer Engagement</div>
        <button
          className={activeTab === 'memberships' ? 'active' : ''}
          onClick={() => setActiveTab('memberships')}
        >
          Memberships
        </button>
        <button
          className={activeTab === 'reviews' ? 'active' : ''}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews
        </button>
        <button
          className={activeTab === 'referrals' ? 'active' : ''}
          onClick={() => setActiveTab('referrals')}
        >
          Referrals
        </button>
        <button
          className={activeTab === 'waitlist' ? 'active' : ''}
          onClick={() => setActiveTab('waitlist')}
        >
          Waitlist
        </button>

        <div style={{ gridColumn: '1 / -1', height: '1px', background: 'rgba(201, 168, 106, 0.3)', margin: '12px 0 8px 0' }}></div>

        {/* Marketing & Promotions */}
        <div style={{ gridColumn: '1 / -1', fontSize: '0.7rem', color: 'rgba(201, 168, 106, 0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Marketing & Promotions</div>
        <button
          className={activeTab === 'promoCodes' ? 'active' : ''}
          onClick={() => setActiveTab('promoCodes')}
        >
          Promo Codes
        </button>
        <button
          className={activeTab === 'emailMarketing' ? 'active' : ''}
          onClick={() => setActiveTab('emailMarketing')}
        >
          Email Marketing
        </button>
        <button
          className={activeTab === 'emailLists' ? 'active' : ''}
          onClick={() => setActiveTab('emailLists')}
        >
          Email Lists
        </button>
        <button
          className={activeTab === 'emailSubscribers' ? 'active' : ''}
          onClick={() => setActiveTab('emailSubscribers')}
        >
          Email Subscribers
        </button>
        <button
          className={activeTab === 'emailAutomation' ? 'active' : ''}
          onClick={() => setActiveTab('emailAutomation')}
        >
          Email Automation
        </button>

        <div style={{ gridColumn: '1 / -1', height: '1px', background: 'rgba(201, 168, 106, 0.3)', margin: '12px 0 8px 0' }}></div>

        {/* Admin & Insights */}
        <div style={{ gridColumn: '1 / -1', fontSize: '0.7rem', color: 'rgba(201, 168, 106, 0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Admin & Insights</div>
        <button
          className={activeTab === 'analytics' ? 'active' : ''}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        {settings?.classPassIntegration?.enabled && (
          <button
            className={activeTab === 'classpassAnalytics' ? 'active' : ''}
            onClick={() => setActiveTab('classpassAnalytics')}
            style={{
              position: 'relative',
              borderLeft: '2px solid rgba(0, 122, 255, 0.3)'
            }}
          >
            ClassPass
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '6px',
              height: '6px',
              backgroundColor: '#007aff',
              borderRadius: '50%'
            }}></span>
          </button>
        )}
        <button
          className={activeTab === 'homePage' ? 'active' : ''}
          onClick={() => setActiveTab('homePage')}
        >
          Home Page
        </button>
        <button
          className={activeTab === 'cssEditor' ? 'active' : ''}
          onClick={() => setActiveTab('cssEditor')}
        >
          CSS Editor
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button
          className={activeTab === 'help' ? 'active' : ''}
          onClick={() => setActiveTab('help')}
        >
          Help
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'events' && (
          <div className="events-section">
            <div className="section-header">
              <h2>Manage Classes</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
               
                <button onClick={() => {
                  setShowEventForm(true);
                  setEditingEvent(null);
                  resetEventForm();
                }}>
                  Create New Class
                </button>
              </div>
            </div>

            {showEventForm && (
              <div className="event-form-modal">
                <div className="event-form-container">
                  <h3>{editingEvent ? 'Edit Class' : 'Create New Class'}</h3>
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
                        <select
                          name="time"
                          value={eventForm.time}
                          onChange={handleEventFormChange}
                          required
                        >
                          <option value="">Select time</option>
                          {generateTimeSlots().map((slot) => (
                            <option key={slot.value} value={slot.value}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Recurrence Section */}
                    <div className="form-group" style={{
                      borderTop: '2px solid rgba(201, 168, 106, 0.3)',
                      paddingTop: '1.5rem',
                      marginTop: '1.5rem'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                        <input
                          type="checkbox"
                          checked={eventForm.isRecurring || false}
                          onChange={(e) => {
                            setEventForm({
                              ...eventForm,
                              isRecurring: e.target.checked,
                              recurrencePattern: e.target.checked ? 'weekly' : 'none'
                            });
                          }}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                        <span style={{ fontSize: '1rem', fontWeight: '600', color: '#c9a86a' }}>
                          Recurring Class
                        </span>
                      </label>

                      {eventForm.isRecurring && (
                        <>
                          <div className="form-row" style={{ marginTop: '1rem' }}>
                            <div className="form-group">
                              <label>Repeat</label>
                              <select
                                name="recurrencePattern"
                                value={eventForm.recurrencePattern}
                                onChange={handleEventFormChange}
                                required
                              >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Repeat Until (Optional)</label>
                              <input
                                type="date"
                                name="recurrenceEndDate"
                                value={eventForm.recurrenceEndDate}
                                onChange={handleEventFormChange}
                                min={eventForm.date}
                              />
                            </div>
                          </div>

                          {eventForm.recurrencePattern === 'daily' && (
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                              <label>Select Days (Optional - leave blank for every day)</label>
                              <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '10px',
                                marginTop: '10px'
                              }}>
                                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                  <label
                                    key={day}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '8px 12px',
                                      background: (eventForm.recurrenceDays || []).includes(day)
                                        ? 'rgba(201, 168, 106, 0.2)'
                                        : 'rgba(255, 255, 255, 0.05)',
                                      border: `1px solid ${(eventForm.recurrenceDays || []).includes(day)
                                        ? '#c9a86a'
                                        : 'rgba(255, 255, 255, 0.2)'}`,
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      transition: 'all 0.3s ease'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={(eventForm.recurrenceDays || []).includes(day)}
                                      onChange={() => handleDayToggle(day)}
                                      style={{ cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>
                                      {day.substring(0, 3)}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
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
                      <label>Class Image</label>
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
                      <td>{parseEventDate(event.date).toLocaleDateString()}</td>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Recent Bookings</h2>
              {settings?.classPassIntegration?.enabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'rgba(232, 232, 232, 0.8)' }}>Filter by Source:</label>
                  <select
                    value={bookingSourceFilter}
                    onChange={(e) => setBookingSourceFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid rgba(201, 168, 106, 0.3)',
                      background: '#1a1a1a',
                      color: '#e8e8e8',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">All Sources</option>
                    <option value="direct">Direct Bookings</option>
                    <option value="classpass">ClassPass</option>
                    <option value="membership">Membership</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>
              )}
            </div>
            <div className="bookings-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Class</th>
                    <th>Spots</th>
                    <th>Ticket Tier</th>
                    <th>Credit Used</th>
                    {settings?.classPassIntegration?.enabled && <th>Source</th>}
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Booking</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings
                    .filter(booking => {
                      if (bookingSourceFilter === 'all') return true;
                      return (booking.bookingSource || 'direct') === bookingSourceFilter;
                    })
                    .map(booking => (
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
                      {settings?.classPassIntegration?.enabled && (
                        <td>
                          <span style={{
                            background: booking.bookingSource === 'classpass' ? 'rgba(0, 122, 255, 0.2)' :
                                       booking.bookingSource === 'membership' ? 'rgba(52, 199, 89, 0.2)' :
                                       booking.bookingSource === 'referral' ? 'rgba(201, 168, 106, 0.2)' :
                                       'rgba(255, 255, 255, 0.1)',
                            color: booking.bookingSource === 'classpass' ? '#007aff' :
                                  booking.bookingSource === 'membership' ? '#34c759' :
                                  booking.bookingSource === 'referral' ? '#c9a86a' :
                                  'rgba(232, 232, 232, 0.7)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>
                            {booking.bookingSource || 'direct'}
                          </span>
                        </td>
                      )}
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
                        <span className={`status-badge ${promo.isActive && (!promo.expiryDate || new Date(promo.expiryDate) > new Date()) && (!promo.usageLimit || promo.usageCount < promo.usageLimit) ? 'completed' : 'failed'}`}>
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
                <h4>How to Send a Campaign:</h4>
                <ol style={{ fontSize: '0.95em', lineHeight: '1.6', marginBottom: '15px' }}>
                  <li><strong>Click "Create New Campaign"</strong> - Start a new email campaign</li>
                  <li><strong>Name Your Campaign</strong> - Give it a descriptive name for tracking</li>
                  <li><strong>Choose Recipients:</strong>
                    <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                      <li><strong>All Customers</strong> - Everyone in your system</li>
                      <li><strong>Past Customers</strong> - Users who have completed bookings</li>
                      <li><strong>Recent</strong> - Users active in the last 30 days</li>
                      <li><strong>Email Lists</strong> - Target specific lists you've created (VIP members, newsletter subscribers, etc.)</li>
                      <li><strong>Custom</strong> - Paste specific email addresses</li>
                    </ul>
                  </li>
                  <li><strong>Add Optional Promo Code</strong> - Include a discount or special offer</li>
                  <li><strong>Write Your Message</strong> - Craft engaging subject line and email body</li>
                  <li><strong>Preview Recipients</strong> - See exactly who will receive the email</li>
                  <li><strong>Send!</strong> - Campaign will be sent immediately</li>
                </ol>

                <h4>Campaign Ideas:</h4>
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
                  <h3>{editingCampaign ? 'Edit Email Campaign' : 'Create Email Campaign'}</h3>
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
                          <option value="email_list">Email Lists</option>
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

                    {emailForm.recipients === 'email_list' && (
                      <div className="form-group">
                        <label>Select Email Lists</label>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '10px' }}>
                          {emailLists.length === 0 ? (
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No email lists available. Create one from the Email Lists tab.</p>
                          ) : (
                            emailLists.map(list => (
                              <label key={list._id} style={{ display: 'block', padding: '8px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <input
                                  type="checkbox"
                                  checked={emailForm.emailLists.includes(list._id)}
                                  onChange={(e) => {
                                    const newLists = e.target.checked
                                      ? [...emailForm.emailLists, list._id]
                                      : emailForm.emailLists.filter(id => id !== list._id);
                                    setEmailForm({ ...emailForm, emailLists: newLists });
                                  }}
                                  style={{ marginRight: '8px' }}
                                />
                                <strong>{list.name}</strong> ({list.subscriberCount} subscribers)
                                {list.description && <div style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.6)', marginLeft: '24px' }}>{list.description}</div>}
                              </label>
                            ))
                          )}
                        </div>
                        <small>Select one or more email lists to send to</small>
                      </div>
                    )}

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
                        setEditingCampaign(null);
                        resetEmailForm();
                      }}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleTestSend}
                        style={{
                          background: 'rgba(201, 168, 106, 0.2)',
                          border: '2px solid #c9a86a',
                          color: '#c9a86a'
                        }}
                      >
                        Send Test Email
                      </button>
                      <button type="submit">
                        {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
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
                        <button
                          onClick={() => handleEditCampaign(campaign)}
                          style={{ backgroundColor: '#c9a86a', marginRight: '0.5rem' }}
                        >
                          Edit
                        </button>
                        {campaign.status === 'draft' && (
                          <button
                            onClick={() => handleSendCampaign(campaign._id)}
                            style={{ backgroundColor: '#4CAF50', marginRight: '0.5rem' }}
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
                  <h3>Total Classes</h3>
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
                  <h3>Class Bookings</h3>
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

        {activeTab === 'homePage' && settings && (
          <div className="settings-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2>Edit Home Page</h2>
                <p style={{ color: 'rgba(232, 232, 232, 0.7)', margin: '0.5rem 0 0 0' }}>
                  Edit your home page content in a layout that mirrors the actual page
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.open('/', '_blank')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(201, 168, 106, 0.2)',
                  border: '1px solid #c9a86a',
                  borderRadius: '4px',
                  color: '#c9a86a',
                  cursor: 'pointer'
                }}
              >
                Preview Home Page →
              </button>
            </div>
            <form onSubmit={handleUpdateSettings} className="settings-form">

              {/* Hero Section */}
              <div className="settings-card" style={{
                background: 'linear-gradient(135deg, rgba(201, 168, 106, 0.15) 0%, rgba(0,0,0,0.3) 100%)',
                border: '2px solid rgba(201, 168, 106, 0.3)',
                padding: '2rem'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#c9a86a',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    background: 'rgba(201, 168, 106, 0.2)',
                    padding: '0.25rem 1rem',
                    borderRadius: '20px'
                  }}>
                    ✨ Hero Section (Top of Page)
                  </span>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.9rem', color: '#c9a86a' }}>Main Title</label>
                  <input
                    type="text"
                    value={settings.homePageContent?.heroTitle || ''}
                    onChange={(e) => handleSettingsChange('homePageContent', 'heroTitle', e.target.value)}
                    placeholder="The Fever Studio"
                    style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.9rem', color: '#c9a86a' }}>Tagline</label>
                  <input
                    type="text"
                    value={settings.homePageContent?.heroTagline || ''}
                    onChange={(e) => handleSettingsChange('homePageContent', 'heroTagline', e.target.value)}
                    placeholder="Heat That Heals. Movement That Empowers."
                    style={{ fontSize: '1.1rem', textAlign: 'center' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.9rem', color: '#c9a86a' }}>Secondary Tagline</label>
                  <input
                    type="text"
                    value={settings.homePageContent?.heroSecondaryTagline || ''}
                    onChange={(e) => handleSettingsChange('homePageContent', 'heroSecondaryTagline', e.target.value)}
                    placeholder="sculpt · strength · sweat · stretch"
                    style={{ textAlign: 'center' }}
                  />
                </div>
              </div>

              {/* About Section */}
              <div className="settings-card" style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '0.25rem 1rem',
                    borderRadius: '20px'
                  }}>
                    📖 About Section
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                  <div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Section Title</label>
                      <input
                        type="text"
                        name="homePageContent.aboutTitle"
                        value={settings.homePageContent?.aboutTitle || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        placeholder="Pop-Up Pilates Experiences"
                        style={{ fontSize: '1.3rem', fontWeight: 'bold' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.85rem' }}>First Paragraph</label>
                      <textarea
                        name="homePageContent.aboutParagraph1"
                        value={settings.homePageContent?.aboutParagraph1 || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        rows="4"
                        placeholder="We bring transformative pilates experiences..."
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.85rem' }}>Second Paragraph</label>
                      <textarea
                        name="homePageContent.aboutParagraph2"
                        value={settings.homePageContent?.aboutParagraph2 || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        rows="3"
                        placeholder="Join our community..."
                      />
                    </div>
                  </div>
                  <div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>About Image</label>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Upload Image</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleAboutImageChange}
                          style={{
                            padding: '0.5rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '4px',
                            color: 'white',
                            width: '100%'
                          }}
                        />
                        <small style={{ display: 'block', marginTop: '0.5rem', opacity: 0.7 }}>Or enter image URL below</small>
                      </div>

                      <input
                        type="url"
                        name="homePageContent.aboutImage"
                        value={settings.homePageContent?.aboutImage || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                      <small style={{ display: 'block', marginTop: '0.5rem', opacity: 0.7 }}>Image appears on the right side</small>

                      {(aboutImagePreview || settings.homePageContent?.aboutImage || settings.homeImages?.aboutImage) && (
                        <div style={{ marginTop: '1rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                          <img
                            src={aboutImagePreview || settings.homePageContent?.aboutImage || settings.homeImages?.aboutImage}
                            alt="Preview"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mission Section */}
              <div className="settings-card" style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '0.25rem 1rem',
                    borderRadius: '20px'
                  }}>
                    🎯 Mission Section
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
                  <div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Mission Image</label>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem', opacity: 0.8 }}>Upload Image</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleMissionImageChange}
                          style={{
                            padding: '0.5rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '4px',
                            color: 'white',
                            width: '100%'
                          }}
                        />
                        <small style={{ display: 'block', marginTop: '0.5rem', opacity: 0.7 }}>Or enter image URL below</small>
                      </div>

                      <input
                        type="url"
                        name="homePageContent.missionImage"
                        value={settings.homePageContent?.missionImage || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                      <small style={{ display: 'block', marginTop: '0.5rem', opacity: 0.7 }}>Image appears on the left side</small>

                      {(missionImagePreview || settings.homePageContent?.missionImage || settings.homeImages?.missionImage) && (
                        <div style={{ marginTop: '1rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                          <img
                            src={missionImagePreview || settings.homePageContent?.missionImage || settings.homeImages?.missionImage}
                            alt="Preview"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Section Title</label>
                      <input
                        type="text"
                        name="homePageContent.missionTitle"
                        value={settings.homePageContent?.missionTitle || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        placeholder="Our Mission"
                        style={{ fontSize: '1.3rem', fontWeight: 'bold' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.85rem' }}>First Paragraph</label>
                      <textarea
                        name="homePageContent.missionParagraph1"
                        value={settings.homePageContent?.missionParagraph1 || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        rows="4"
                        placeholder="The Fever Studio is more than a workout..."
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.85rem' }}>Second Paragraph</label>
                      <textarea
                        name="homePageContent.missionParagraph2"
                        value={settings.homePageContent?.missionParagraph2 || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        rows="3"
                        placeholder="Each class is carefully designed..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Values Section */}
              <div className="settings-card" style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '0.25rem 1rem',
                    borderRadius: '20px'
                  }}>
                    💎 Values Section (4 Cards)
                  </span>
                </div>
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Section Title</label>
                  <input
                    type="text"
                    name="homePageContent.valuesTitle"
                    value={settings.homePageContent?.valuesTitle || ''}
                    onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                    placeholder="What We Believe"
                    style={{ fontSize: '1.3rem', fontWeight: 'bold', textAlign: 'center' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Value 1 */}
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Card 1 - Title</label>
                      <input
                        type="text"
                        name="homePageContent.value1Title"
                        value={settings.homePageContent?.value1Title || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        placeholder="You Belong Here"
                        style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Description</label>
                      <textarea
                        name="homePageContent.value1Description"
                        value={settings.homePageContent?.value1Description || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        rows="4"
                        placeholder="We create inclusive spaces..."
                      />
                    </div>
                  </div>

                  {/* Value 2 */}
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Card 2 - Title</label>
                      <input
                        type="text"
                        name="homePageContent.value2Title"
                        value={settings.homePageContent?.value2Title || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        placeholder="Community First"
                        style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Description</label>
                      <textarea
                        name="homePageContent.value2Description"
                        value={settings.homePageContent?.value2Description || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        rows="4"
                        placeholder="Movement is better together..."
                      />
                    </div>
                  </div>

                  {/* Value 3 */}
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Card 3 - Title</label>
                      <input
                        type="text"
                        name="homePageContent.value3Title"
                        value={settings.homePageContent?.value3Title || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        placeholder="Holistic Wellness"
                        style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Description</label>
                      <textarea
                        name="homePageContent.value3Description"
                        value={settings.homePageContent?.value3Description || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        rows="4"
                        placeholder="True wellness encompasses..."
                      />
                    </div>
                  </div>

                  {/* Value 4 */}
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Card 4 - Title</label>
                      <input
                        type="text"
                        name="homePageContent.value4Title"
                        value={settings.homePageContent?.value4Title || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        placeholder="Intentional Experiences"
                        style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Description</label>
                      <textarea
                        name="homePageContent.value4Description"
                        value={settings.homePageContent?.value4Description || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        rows="4"
                        placeholder="Every detail matters..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Approach Section */}
              <div className="settings-card" style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '0.25rem 1rem',
                    borderRadius: '20px'
                  }}>
                    🎨 Approach Section (4 Items)
                  </span>
                </div>
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Section Title</label>
                  <input
                    type="text"
                    name="homePageContent.approachTitle"
                    value={settings.homePageContent?.approachTitle || ''}
                    onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                    placeholder="Our Approach"
                    style={{ fontSize: '1.3rem', fontWeight: 'bold', textAlign: 'center' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Approach 1 */}
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Item 1 - Title</label>
                      <input
                        type="text"
                        name="homePageContent.approach1Title"
                        value={settings.homePageContent?.approach1Title || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        placeholder="Popup Locations"
                        style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Description</label>
                      <textarea
                        name="homePageContent.approach1Description"
                        value={settings.homePageContent?.approach1Description || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        rows="4"
                        placeholder="We partner with unique venues..."
                      />
                    </div>
                  </div>

                  {/* Approach 2 */}
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Item 2 - Title</label>
                      <input
                        type="text"
                        name="homePageContent.approach2Title"
                        value={settings.homePageContent?.approach2Title || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        placeholder="Expert Instruction"
                        style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Description</label>
                      <textarea
                        name="homePageContent.approach2Description"
                        value={settings.homePageContent?.approach2Description || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        rows="4"
                        placeholder="Our certified instructors..."
                      />
                    </div>
                  </div>

                  {/* Approach 3 */}
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Item 3 - Title</label>
                      <input
                        type="text"
                        name="homePageContent.approach3Title"
                        value={settings.homePageContent?.approach3Title || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        placeholder="All Levels Welcome"
                        style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Description</label>
                      <textarea
                        name="homePageContent.approach3Description"
                        value={settings.homePageContent?.approach3Description || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        rows="4"
                        placeholder="Whether you're brand new..."
                      />
                    </div>
                  </div>

                  {/* Approach 4 */}
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Item 4 - Title</label>
                      <input
                        type="text"
                        name="homePageContent.approach4Title"
                        value={settings.homePageContent?.approach4Title || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        placeholder="Premium Equipment"
                        style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Description</label>
                      <textarea
                        name="homePageContent.approach4Description"
                        value={settings.homePageContent?.approach4Description || ''}
                        onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                        rows="4"
                        placeholder="We provide everything you need..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="settings-card" style={{
                background: 'linear-gradient(135deg, rgba(201, 168, 106, 0.15) 0%, rgba(0,0,0,0.3) 100%)',
                border: '2px solid rgba(201, 168, 106, 0.3)',
                padding: '2rem'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#c9a86a',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    background: 'rgba(201, 168, 106, 0.2)',
                    padding: '0.25rem 1rem',
                    borderRadius: '20px'
                  }}>
                    🚀 Call-to-Action Section (Bottom of Page)
                  </span>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.9rem', color: '#c9a86a' }}>CTA Title</label>
                  <input
                    type="text"
                    name="homePageContent.ctaTitle"
                    value={settings.homePageContent?.ctaTitle || ''}
                    onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                    placeholder="Join The Collective"
                    style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.9rem', color: '#c9a86a' }}>CTA Subtitle</label>
                  <input
                    type="text"
                    name="homePageContent.ctaSubtitle"
                    value={settings.homePageContent?.ctaSubtitle || ''}
                    onChange={(e) => handleSettingsChange('homePageContent', e.target.name.split(".")[1], e.target.value)}
                    placeholder="Experience wellness that's out of this world"
                    style={{ fontSize: '1.1rem', textAlign: 'center' }}
                  />
                </div>
              </div>

              <div style={{
                position: 'sticky',
                bottom: '0',
                background: 'rgba(0, 0, 0, 0.95)',
                padding: '1.5rem',
                marginTop: '2rem',
                marginLeft: '-2rem',
                marginRight: '-2rem',
                marginBottom: '-2rem',
                borderTop: '2px solid #c9a86a',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center'
              }}>
                <button
                  type="button"
                  onClick={() => window.open('/', '_blank')}
                  style={{
                    padding: '0.75rem 2rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Preview Home Page
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 3rem',
                    background: '#c9a86a',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#000',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  💾 Save All Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'cssEditor' && settings && (
          <div className="settings-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2>Site Style Editor</h2>
                <p style={{ color: 'rgba(232, 232, 232, 0.7)', margin: '0.5rem 0 0 0' }}>
                  Control all colors across your website. Each description shows exactly where that color appears.
                  Click "Save Settings" to apply changes - the page will reload automatically.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateSettings}>
              {/* COLORS SECTION */}
              <div className="settings-card">
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#c9a86a' }}>🎨 Colors</h3>

                {/* Primary & Backgrounds */}
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', marginTop: '1.5rem', color: 'var(--primary-color)' }}>Main Colors</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>Primary Color</label>
                    <input type="color" value={settings.styleCustomizer?.primaryColor || '#c9a86a'}
                      onChange={(e) => setSettings(prev => ({ ...prev, styleCustomizer: { ...prev.styleCustomizer, primaryColor: e.target.value } }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }} />
                    <small style={{ color: 'var(--muted-text-color)' }}>All buttons across site, navigation links, accent colors, event card borders</small>
                  </div>

                  <div className="form-group">
                    <label>Background</label>
                    <input type="color" value={settings.styleCustomizer?.backgroundColor || '#1a1a1a'}
                      onChange={(e) => setSettings(prev => ({ ...prev, styleCustomizer: { ...prev.styleCustomizer, backgroundColor: e.target.value } }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }} />
                    <small style={{ color: 'var(--muted-text-color)' }}>Behind all page content - home page, events page, all pages</small>
                  </div>

                  <div className="form-group">
                    <label>Secondary Background</label>
                    <input type="color" value={settings.styleCustomizer?.secondaryBackground || '#2a2a2a'}
                      onChange={(e) => setSettings(prev => ({ ...prev, styleCustomizer: { ...prev.styleCustomizer, secondaryBackground: e.target.value } }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }} />
                    <small style={{ color: 'var(--muted-text-color)' }}>Event cards, all forms & form groups, booking forms, admin dashboard cards, table headers</small>
                  </div>
                </div>

                {/* Text Colors */}
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', marginTop: '2rem', color: 'var(--primary-color)' }}>Text Colors</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>Body Text</label>
                    <input type="color" value={settings.styleCustomizer?.textColor || '#e8e8e8'}
                      onChange={(e) => setSettings(prev => ({ ...prev, styleCustomizer: { ...prev.styleCustomizer, textColor: e.target.value } }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }} />
                    <small style={{ color: 'var(--muted-text-color)' }}>All body paragraphs, form text, page descriptions, most readable text</small>
                  </div>

                  <div className="form-group">
                    <label>Headings</label>
                    <input type="color" value={settings.styleCustomizer?.headingColor || '#ffffff'}
                      onChange={(e) => setSettings(prev => ({ ...prev, styleCustomizer: { ...prev.styleCustomizer, headingColor: e.target.value } }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }} />
                    <small style={{ color: 'var(--muted-text-color)' }}>Page titles (H1), section titles (H2), subsection titles (H3), admin section headers</small>
                  </div>

                  <div className="form-group">
                    <label>Muted Text</label>
                    <input type="color" value={settings.styleCustomizer?.mutedTextColor || '#b8b8b8'}
                      onChange={(e) => setSettings(prev => ({ ...prev, styleCustomizer: { ...prev.styleCustomizer, mutedTextColor: e.target.value } }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }} />
                    <small style={{ color: 'var(--muted-text-color)' }}>Helper text, small descriptions, event dates, time stamps, hints and tooltips</small>
                  </div>

                  <div className="form-group">
                    <label>Label Color</label>
                    <input type="color" value={settings.styleCustomizer?.labelColor || '#e8e8e8'}
                      onChange={(e) => setSettings(prev => ({ ...prev, styleCustomizer: { ...prev.styleCustomizer, labelColor: e.target.value } }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }} />
                    <small style={{ color: 'var(--muted-text-color)' }}>THIS TEXT - All form field labels, input labels, CSS Editor labels, booking form labels</small>
                  </div>
                </div>

                {/* Links & Buttons */}
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', marginTop: '2rem', color: 'var(--primary-color)' }}>Interactive Elements</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>Link Color</label>
                    <input type="color" value={settings.styleCustomizer?.linkColor || '#c9a86a'}
                      onChange={(e) => setSettings(prev => ({ ...prev, styleCustomizer: { ...prev.styleCustomizer, linkColor: e.target.value } }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }} />
                    <small style={{ color: 'var(--muted-text-color)' }}>Clickable links, navigation menu links, footer links, in-text links</small>
                  </div>

                  <div className="form-group">
                    <label>Link Hover</label>
                    <input type="color" value={settings.styleCustomizer?.linkHoverColor || '#d4b97a'}
                      onChange={(e) => setSettings(prev => ({ ...prev, styleCustomizer: { ...prev.styleCustomizer, linkHoverColor: e.target.value } }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }} />
                    <small style={{ color: 'var(--muted-text-color)' }}>When you hover over any link - shows interactivity</small>
                  </div>

                  <div className="form-group">
                    <label>Button Hover</label>
                    <input type="color" value={settings.styleCustomizer?.buttonHoverColor || '#d4b97a'}
                      onChange={(e) => setSettings(prev => ({ ...prev, styleCustomizer: { ...prev.styleCustomizer, buttonHoverColor: e.target.value } }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }} />
                    <small style={{ color: 'var(--muted-text-color)' }}>When you hover over any button - "Book Now", "Save Settings", etc.</small>
                  </div>
                </div>

                {/* Borders */}
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', marginTop: '2rem', color: 'var(--primary-color)' }}>Borders & Dividers</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>Border Color</label>
                    <input type="color" value={settings.styleCustomizer?.borderColor || '#333333'}
                      onChange={(e) => setSettings(prev => ({ ...prev, styleCustomizer: { ...prev.styleCustomizer, borderColor: e.target.value } }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }} />
                    <small style={{ color: 'var(--muted-text-color)' }}>Card borders, divider lines, input field borders, box outlines</small>
                  </div>
                </div>

                {/* Status Colors */}
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', marginTop: '2rem', color: 'var(--primary-color)' }}>Status Colors</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>Success</label>
                    <input type="color" value={settings.styleCustomizer?.successColor || '#4caf50'}
                      onChange={(e) => setSettings(prev => ({ ...prev, styleCustomizer: { ...prev.styleCustomizer, successColor: e.target.value } }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }} />
                    <small style={{ color: 'var(--muted-text-color)' }}>Booking confirmed, active status, success messages</small>
                  </div>

                  <div className="form-group">
                    <label>Warning</label>
                    <input type="color" value={settings.styleCustomizer?.warningColor || '#ff9800'}
                      onChange={(e) => setSettings(prev => ({ ...prev, styleCustomizer: { ...prev.styleCustomizer, warningColor: e.target.value } }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }} />
                    <small style={{ color: 'var(--muted-text-color)' }}>Pending bookings, waitlist status, warning messages</small>
                  </div>

                  <div className="form-group">
                    <label>Error</label>
                    <input type="color" value={settings.styleCustomizer?.errorColor || '#f44336'}
                      onChange={(e) => setSettings(prev => ({ ...prev, styleCustomizer: { ...prev.styleCustomizer, errorColor: e.target.value } }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }} />
                    <small style={{ color: 'var(--muted-text-color)' }}>Cancelled bookings, failed payments, error messages</small>
                  </div>
                </div>
              </div>

              {/* TYPOGRAPHY & LAYOUT SECTION */}
              <div className="settings-card">
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#c9a86a' }}>📝 Typography & Layout</h3>
                <p style={{ color: 'var(--muted-text-color)', marginBottom: '1.5rem' }}>
                  Choose colors for your site's appearance
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>Primary Accent Color (Buttons, Links)</label>
                    <input
                      type="color"
                      value={settings.styleCustomizer?.primaryColor || '#c9a86a'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, primaryColor: e.target.value }
                      }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <small>Current: {settings.styleCustomizer?.primaryColor || '#c9a86a'}</small>
                  </div>

                  <div className="form-group">
                    <label>Background Color</label>
                    <input
                      type="color"
                      value={settings.styleCustomizer?.backgroundColor || '#1a1a1a'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, backgroundColor: e.target.value }
                      }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <small>Current: {settings.styleCustomizer?.backgroundColor || '#1a1a1a'}</small>
                  </div>

                  <div className="form-group">
                    <label>Text Color</label>
                    <input
                      type="color"
                      value={settings.styleCustomizer?.textColor || '#e8e8e8'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, textColor: e.target.value }
                      }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <small>Current: {settings.styleCustomizer?.textColor || '#e8e8e8'}</small>
                  </div>

                  <div className="form-group">
                    <label>Heading Color</label>
                    <input
                      type="color"
                      value={settings.styleCustomizer?.headingColor || '#ffffff'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, headingColor: e.target.value }
                      }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <small>Current: {settings.styleCustomizer?.headingColor || '#ffffff'}</small>
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div className="settings-card">
                <h3>📝 Typography</h3>
                <p style={{ color: 'var(--muted-text-color)', marginBottom: '1.5rem' }}>
                  Customize all fonts and text sizes throughout your site
                </p>

                {/* Body Text */}
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#c9a86a' }}>Body Text (Paragraphs)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div className="form-group">
                    <label>Body Font Family</label>
                    <select
                      value={settings.styleCustomizer?.fontFamily || '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, fontFamily: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '0.75rem', background: 'var(--input-background)', border: '1px solid var(--input-border)', color: 'var(--input-text-color)', borderRadius: '4px' }}
                    >
                      <option value="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif">System Default (Helvetica/Arial)</option>
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                      <option value="'Georgia', serif">Georgia</option>
                      <option value="'Times New Roman', Times, serif">Times New Roman</option>
                      <option value="'Courier New', Courier, monospace">Courier</option>
                      <option value="'Verdana', sans-serif">Verdana</option>
                      <option value="'Trebuchet MS', sans-serif">Trebuchet</option>
                      <option value="'Palatino', serif">Palatino</option>
                      <option value="'Comic Sans MS', cursive">Comic Sans</option>
                      <option value="'Impact', sans-serif">Impact</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Body Font Size</label>
                    <select
                      value={settings.styleCustomizer?.fontSize || '16px'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, fontSize: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '0.75rem', background: 'var(--input-background)', border: '1px solid var(--input-border)', color: 'var(--input-text-color)', borderRadius: '4px' }}
                    >
                      <option value="12px">Very Small (12px)</option>
                      <option value="14px">Small (14px)</option>
                      <option value="16px">Medium (16px) - Default</option>
                      <option value="18px">Large (18px)</option>
                      <option value="20px">Extra Large (20px)</option>
                      <option value="22px">Huge (22px)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Body Font Weight</label>
                    <select
                      value={settings.styleCustomizer?.bodyFontWeight || '400'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, bodyFontWeight: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '0.75rem', background: 'var(--input-background)', border: '1px solid var(--input-border)', color: 'var(--input-text-color)', borderRadius: '4px' }}
                    >
                      <option value="200">Extra Light</option>
                      <option value="300">Light</option>
                      <option value="400">Normal</option>
                      <option value="500">Medium</option>
                      <option value="600">Semi-Bold</option>
                    </select>
                  </div>
                </div>

                {/* Main Headings (H1) */}
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#c9a86a' }}>Main Headings (H1 - Large Titles)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div className="form-group">
                    <label>H1 Font Family</label>
                    <select
                      value={settings.styleCustomizer?.h1FontFamily || 'inherit'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, h1FontFamily: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '0.75rem', background: 'var(--input-background)', border: '1px solid var(--input-border)', color: 'var(--input-text-color)', borderRadius: '4px' }}
                    >
                      <option value="inherit">Same as Body</option>
                      <option value="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif">System Default</option>
                      <option value="'Georgia', serif">Georgia</option>
                      <option value="'Times New Roman', Times, serif">Times New Roman</option>
                      <option value="'Palatino', serif">Palatino</option>
                      <option value="'Impact', sans-serif">Impact</option>
                      <option value="'Arial Black', sans-serif">Arial Black</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>H1 Font Size</label>
                    <select
                      value={settings.styleCustomizer?.h1FontSize || '4rem'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, h1FontSize: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '0.75rem', background: 'var(--input-background)', border: '1px solid var(--input-border)', color: 'var(--input-text-color)', borderRadius: '4px' }}
                    >
                      <option value="2.5rem">Small (2.5rem)</option>
                      <option value="3rem">Medium (3rem)</option>
                      <option value="4rem">Default (4rem)</option>
                      <option value="5rem">Large (5rem)</option>
                      <option value="6rem">Extra Large (6rem)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>H1 Font Weight</label>
                    <select
                      value={settings.styleCustomizer?.h1FontWeight || '200'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, h1FontWeight: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '0.75rem', background: 'var(--input-background)', border: '1px solid var(--input-border)', color: 'var(--input-text-color)', borderRadius: '4px' }}
                    >
                      <option value="200">Extra Light</option>
                      <option value="300">Light</option>
                      <option value="400">Normal</option>
                      <option value="500">Medium</option>
                      <option value="600">Semi-Bold</option>
                      <option value="700">Bold</option>
                      <option value="800">Extra Bold</option>
                    </select>
                  </div>
                </div>

                {/* Sub Headings (H2) */}
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#c9a86a' }}>Sub Headings (H2 - Section Titles)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div className="form-group">
                    <label>H2 Font Size</label>
                    <select
                      value={settings.styleCustomizer?.h2FontSize || '2rem'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, h2FontSize: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '0.75rem', background: 'var(--input-background)', border: '1px solid var(--input-border)', color: 'var(--input-text-color)', borderRadius: '4px' }}
                    >
                      <option value="1.5rem">Small (1.5rem)</option>
                      <option value="1.8rem">Medium (1.8rem)</option>
                      <option value="2rem">Default (2rem)</option>
                      <option value="2.5rem">Large (2.5rem)</option>
                      <option value="3rem">Extra Large (3rem)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>H2 Font Weight</label>
                    <select
                      value={settings.styleCustomizer?.h2FontWeight || '300'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, h2FontWeight: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '0.75rem', background: 'var(--input-background)', border: '1px solid var(--input-border)', color: 'var(--input-text-color)', borderRadius: '4px' }}
                    >
                      <option value="200">Extra Light</option>
                      <option value="300">Light</option>
                      <option value="400">Normal</option>
                      <option value="500">Medium</option>
                      <option value="600">Semi-Bold</option>
                      <option value="700">Bold</option>
                    </select>
                  </div>
                </div>

                {/* Sub Sub Headings (H3) */}
                <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#c9a86a' }}>Sub-Sub Headings (H3 - Smaller Titles)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>H3 Font Size</label>
                    <select
                      value={settings.styleCustomizer?.h3FontSize || '1.5rem'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, h3FontSize: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '0.75rem', background: 'var(--input-background)', border: '1px solid var(--input-border)', color: 'var(--input-text-color)', borderRadius: '4px' }}
                    >
                      <option value="1.2rem">Small (1.2rem)</option>
                      <option value="1.3rem">Medium (1.3rem)</option>
                      <option value="1.5rem">Default (1.5rem)</option>
                      <option value="1.8rem">Large (1.8rem)</option>
                      <option value="2rem">Extra Large (2rem)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>H3 Font Weight</label>
                    <select
                      value={settings.styleCustomizer?.h3FontWeight || '300'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, h3FontWeight: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '0.75rem', background: 'var(--input-background)', border: '1px solid var(--input-border)', color: 'var(--input-text-color)', borderRadius: '4px' }}
                    >
                      <option value="300">Light</option>
                      <option value="400">Normal</option>
                      <option value="500">Medium</option>
                      <option value="600">Semi-Bold</option>
                      <option value="700">Bold</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Spacing & Layout */}
              <div className="settings-card">
                <h3>📏 Spacing & Layout</h3>
                <p style={{ color: 'var(--muted-text-color)', marginBottom: '1.5rem' }}>
                  Adjust spacing and padding
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>Section Padding</label>
                    <select
                      value={settings.styleCustomizer?.sectionPadding || '4rem'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, sectionPadding: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '0.75rem', background: 'var(--input-background)', border: '1px solid var(--input-border)', color: 'var(--input-text-color)', borderRadius: '4px' }}
                    >
                      <option value="2rem">Compact</option>
                      <option value="4rem">Default</option>
                      <option value="6rem">Spacious</option>
                      <option value="8rem">Extra Spacious</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Button Border Radius</label>
                    <select
                      value={settings.styleCustomizer?.buttonRadius || '0'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, buttonRadius: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '0.75rem', background: 'var(--input-background)', border: '1px solid var(--input-border)', color: 'var(--input-text-color)', borderRadius: '4px' }}
                    >
                      <option value="0">Sharp (Square)</option>
                      <option value="4px">Slightly Rounded</option>
                      <option value="8px">Rounded</option>
                      <option value="25px">Very Rounded (Pill)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Maximum Page Width</label>
                    <select
                      value={settings.styleCustomizer?.maxWidth || '1400px'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, maxWidth: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '0.75rem', background: 'var(--input-background)', border: '1px solid var(--input-border)', color: 'var(--input-text-color)', borderRadius: '4px' }}
                    >
                      <option value="1200px">Narrow (1200px)</option>
                      <option value="1400px">Default (1400px)</option>
                      <option value="1600px">Wide (1600px)</option>
                      <option value="100%">Full Width</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Navigation Bar */}
              <div className="settings-card">
                <h3>🧭 Navigation Bar</h3>
                <p style={{ color: 'var(--muted-text-color)', marginBottom: '1.5rem' }}>
                  Customize navigation appearance
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>Navigation Background</label>
                    <input
                      type="color"
                      value={settings.styleCustomizer?.navBackgroundColor || '#000000'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, navBackgroundColor: e.target.value }
                      }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <small>Current: {settings.styleCustomizer?.navBackgroundColor || '#000000'}</small>
                  </div>

                  <div className="form-group">
                    <label>Navigation Text Color</label>
                    <input
                      type="color"
                      value={settings.styleCustomizer?.navTextColor || '#e8e8e8'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, navTextColor: e.target.value }
                      }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <small>Current: {settings.styleCustomizer?.navTextColor || '#e8e8e8'}</small>
                  </div>

                  <div className="form-group">
                    <label>Navigation Height</label>
                    <select
                      value={settings.styleCustomizer?.navHeight || '5rem'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, navHeight: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '0.75rem', background: 'var(--input-background)', border: '1px solid var(--input-border)', color: 'var(--input-text-color)', borderRadius: '4px' }}
                    >
                      <option value="4rem">Compact</option>
                      <option value="5rem">Default</option>
                      <option value="6rem">Tall</option>
                      <option value="7rem">Extra Tall</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Events Page */}
              <div className="settings-card">
                <h3>📅 Events Page</h3>
                <p style={{ color: 'var(--muted-text-color)', marginBottom: '1.5rem' }}>
                  Customize events display
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>Event Card Background</label>
                    <input
                      type="color"
                      value={settings.styleCustomizer?.eventCardBackground || '#1a1a1a'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, eventCardBackground: e.target.value }
                      }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <small>Current: {settings.styleCustomizer?.eventCardBackground || '#1a1a1a'}</small>
                  </div>

                  <div className="form-group">
                    <label>Event Card Border Color</label>
                    <input
                      type="color"
                      value={settings.styleCustomizer?.eventCardBorder || '#c9a86a'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, eventCardBorder: e.target.value }
                      }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <small>Current: {settings.styleCustomizer?.eventCardBorder || '#c9a86a'}</small>
                  </div>

                  <div className="form-group">
                    <label>Event Card Corner Radius</label>
                    <select
                      value={settings.styleCustomizer?.eventCardRadius || '0'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, eventCardRadius: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '0.75rem', background: 'var(--input-background)', border: '1px solid var(--input-border)', color: 'var(--input-text-color)', borderRadius: '4px' }}
                    >
                      <option value="0">Sharp (Square)</option>
                      <option value="4px">Slightly Rounded</option>
                      <option value="8px">Rounded</option>
                      <option value="12px">Very Rounded</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Forms & Inputs */}
              <div className="settings-card">
                <h3>📋 Forms & Inputs</h3>
                <p style={{ color: 'var(--muted-text-color)', marginBottom: '1.5rem' }}>
                  Customize form appearance
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label>Input Background</label>
                    <input
                      type="color"
                      value={settings.styleCustomizer?.inputBackground || '#2a2a2a'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, inputBackground: e.target.value }
                      }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <small>Current: {settings.styleCustomizer?.inputBackground || '#2a2a2a'}</small>
                  </div>

                  <div className="form-group">
                    <label>Input Border Color</label>
                    <input
                      type="color"
                      value={settings.styleCustomizer?.inputBorder || '#c9a86a'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, inputBorder: e.target.value }
                      }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <small>Current: {settings.styleCustomizer?.inputBorder || '#c9a86a'}</small>
                  </div>

                  <div className="form-group">
                    <label>Input Text Color</label>
                    <input
                      type="color"
                      value={settings.styleCustomizer?.inputTextColor || '#e8e8e8'}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        styleCustomizer: { ...prev.styleCustomizer, inputTextColor: e.target.value }
                      }))}
                      style={{ width: '100%', height: '50px', cursor: 'pointer', borderRadius: '4px' }}
                    />
                    <small>Current: {settings.styleCustomizer?.inputTextColor || '#e8e8e8'}</small>
                  </div>
                </div>
              </div>

              {/* Visibility Options */}
              <div className="settings-card">
                <h3>👁️ Show/Hide Elements</h3>
                <p style={{ color: 'var(--muted-text-color)', marginBottom: '1.5rem' }}>
                  Control which elements are visible
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.styleCustomizer?.showSocialLinks !== false}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          styleCustomizer: { ...prev.styleCustomizer, showSocialLinks: e.target.checked }
                        }))}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <span>Show Social Media Links</span>
                    </label>
                  </div>

                  <div className="form-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.styleCustomizer?.showFooter !== false}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          styleCustomizer: { ...prev.styleCustomizer, showFooter: e.target.checked }
                        }))}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <span>Show Footer</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div style={{
                position: 'sticky',
                bottom: '0',
                background: 'rgba(0, 0, 0, 0.95)',
                padding: '1.5rem',
                marginTop: '2rem',
                marginLeft: '-2rem',
                marginRight: '-2rem',
                marginBottom: '-2rem',
                borderTop: '2px solid #c9a86a',
                display: 'flex',
                gap: '1rem',
                justifyContent: 'center'
              }}>
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Reset all styles to default? This will reload the page.')) {
                      try {
                        const token = localStorage.getItem('token');

                        // Default values from Settings schema
                        const defaultStyles = {
                          primaryColor: '#c9a86a',
                          backgroundColor: '#1a1a1a',
                          textColor: '#e8e8e8',
                          headingColor: '#ffffff',
                          fontFamily: 'Arial, sans-serif',
                          fontSize: '16px',
                          headingWeight: '600',
                          sectionPadding: '4rem',
                          buttonRadius: '0',
                          maxWidth: '1400px',
                          linkColor: '#c9a86a',
                          linkHoverColor: '#d4b97a',
                          buttonHoverColor: '#d4b97a',
                          mutedTextColor: '#b8b8b8',
                          labelColor: '#e8e8e8',
                          secondaryBackground: '#2a2a2a',
                          borderColor: '#333333',
                          successColor: '#4caf50',
                          warningColor: '#ff9800',
                          errorColor: '#f44336',
                          bodyFontWeight: '400',
                          h1FontSize: '4rem',
                          h1FontWeight: '200',
                          h2FontSize: '2rem',
                          h2FontWeight: '300',
                          h3FontSize: '1.5rem',
                          h3FontWeight: '300',
                          navBackgroundColor: '#000000',
                          navTextColor: '#e8e8e8',
                          navHeight: '5rem',
                          eventCardBackground: '#1a1a1a',
                          eventCardBorder: '#c9a86a',
                          eventCardRadius: '0',
                          inputBackground: '#2a2a2a',
                          inputBorder: '#c9a86a',
                          inputTextColor: '#e8e8e8',
                          showSocialLinks: true,
                          showFooter: true
                        };

                        const updatedSettings = {
                          ...settings,
                          styleCustomizer: defaultStyles
                        };

                        await api.put('/api/settings', updatedSettings, {
                          headers: { Authorization: `Bearer ${token}` }
                        });

                        alert('Styles reset to defaults! Page will reload.');
                        window.location.reload();
                      } catch (error) {
                        console.error('Error resetting styles:', error);
                        alert('Failed to reset styles. Please try again.');
                      }
                    }
                  }}
                  style={{
                    padding: '0.75rem 2rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Reset to Defaults
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 3rem',
                    background: '#c9a86a',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#000',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 'bold'
                  }}
                >
                  💾 Save All Changes
                </button>
              </div>
            </form>
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

              {/* ClassPass Integration Section */}
              <div className="settings-card">
                <h3>ClassPass Integration</h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(232, 232, 232, 0.7)', marginBottom: '1.5rem' }}>
                  Track and manage ClassPass bookings, customer acquisition, and conversion analytics. Enable this feature to activate ClassPass-specific tracking and analytics throughout the admin dashboard.
                </p>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', background: 'rgba(0, 122, 255, 0.1)', borderRadius: '6px', border: '1px solid rgba(0, 122, 255, 0.3)' }}>
                    <input
                      type="checkbox"
                      checked={settings.classPassIntegration?.enabled || false}
                      onChange={(e) => handleSettingsChange('classPassIntegration', 'enabled', e.target.checked)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <div>
                      <strong style={{ color: '#007aff' }}>Enable ClassPass Integration</strong>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(232, 232, 232, 0.6)', marginTop: '4px' }}>
                        Activate ClassPass tracking, analytics, and automated email campaigns
                      </div>
                    </div>
                  </label>
                </div>

                {settings.classPassIntegration?.enabled && (
                  <>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={settings.classPassIntegration?.autoTagUsers || false}
                          onChange={(e) => handleSettingsChange('classPassIntegration', 'autoTagUsers', e.target.checked)}
                        />
                        Auto-tag ClassPass users in email system
                      </label>
                      <small style={{ marginLeft: '28px', display: 'block', marginTop: '4px' }}>
                        Automatically tag users with "classpass" when they book through ClassPass for targeted campaigns
                      </small>
                    </div>

                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={settings.classPassIntegration?.trackConversions || false}
                          onChange={(e) => handleSettingsChange('classPassIntegration', 'trackConversions', e.target.checked)}
                        />
                        Track ClassPass to member conversions
                      </label>
                      <small style={{ marginLeft: '28px', display: 'block', marginTop: '4px' }}>
                        Monitor which ClassPass users become paying members or regular customers
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Conversion Goal (Days)</label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={settings.classPassIntegration?.conversionGoalDays || 30}
                        onChange={(e) => handleSettingsChange('classPassIntegration', 'conversionGoalDays', parseInt(e.target.value))}
                        placeholder="30"
                      />
                      <small>Number of days to track conversion from first ClassPass booking to membership</small>
                    </div>

                    <div className="form-group">
                      <label>Default Payout Rate ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={settings.classPassIntegration?.defaultPayoutRate || 22}
                        onChange={(e) => handleSettingsChange('classPassIntegration', 'defaultPayoutRate', parseFloat(e.target.value))}
                        placeholder="22.00"
                      />
                      <small>Average payout per ClassPass booking for revenue analytics (if specific payout not recorded)</small>
                    </div>
                  </>
                )}
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

              {/* SMS Configuration Section */}
              <div className="settings-card">
                <h3>SMS Configuration</h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(232, 232, 232, 0.7)', marginBottom: '1.5rem' }}>
                  Configure Twilio SMS notifications for booking confirmations, reminders, and promotional messages. Requires Twilio account credentials in server environment variables.
                </p>

                {/* Twilio Connection Status */}
                <div style={{ marginBottom: '1.5rem', padding: '12px', background: twilioStatus?.configured ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 69, 58, 0.1)', borderRadius: '6px', border: `1px solid ${twilioStatus?.configured ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 69, 58, 0.3)'}` }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', color: twilioStatus?.configured ? '#34c759' : '#ff453a' }}>
                    {twilioStatus?.configured ? '✅ Twilio Connected' : '❌ Twilio Not Configured'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(232, 232, 232, 0.6)' }}>
                    {twilioStatus?.configured
                      ? `Phone Number: ${twilioStatus.phoneNumber}`
                      : 'Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in server environment variables'}
                  </div>
                </div>

                {/* Global Enable/Disable */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', background: 'rgba(0, 122, 255, 0.1)', borderRadius: '6px', border: '1px solid rgba(0, 122, 255, 0.3)' }}>
                    <input
                      type="checkbox"
                      checked={settings.smsConfig?.enabled || false}
                      onChange={(e) => handleSettingsChange('smsConfig', 'enabled', e.target.checked)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <div>
                      <strong style={{ color: '#007aff' }}>Enable SMS Notifications</strong>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(232, 232, 232, 0.6)', marginTop: '4px' }}>
                        Master switch for all SMS functionality
                      </div>
                    </div>
                  </label>
                </div>

                {settings.smsConfig?.enabled && (
                  <>
                    {/* Notification Types */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Notification Types</h4>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={settings.smsConfig?.sendBookingConfirmations !== false}
                            onChange={(e) => handleSettingsChange('smsConfig', 'sendBookingConfirmations', e.target.checked)}
                          />
                          Booking Confirmations
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={settings.smsConfig?.sendPaymentConfirmations !== false}
                            onChange={(e) => handleSettingsChange('smsConfig', 'sendPaymentConfirmations', e.target.checked)}
                          />
                          Payment Confirmations
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={settings.smsConfig?.sendReminders !== false}
                            onChange={(e) => handleSettingsChange('smsConfig', 'sendReminders', e.target.checked)}
                          />
                          Class Reminders (24 hours before)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={settings.smsConfig?.sendWaitlistNotifications !== false}
                            onChange={(e) => handleSettingsChange('smsConfig', 'sendWaitlistNotifications', e.target.checked)}
                          />
                          Waitlist Notifications
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={settings.smsConfig?.sendMembershipConfirmations !== false}
                            onChange={(e) => handleSettingsChange('smsConfig', 'sendMembershipConfirmations', e.target.checked)}
                          />
                          Membership Confirmations
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={settings.smsConfig?.sendCreditsLowWarning !== false}
                            onChange={(e) => handleSettingsChange('smsConfig', 'sendCreditsLowWarning', e.target.checked)}
                          />
                          Low Credits Warnings
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={settings.smsConfig?.allowPromotionalSMS || false}
                            onChange={(e) => handleSettingsChange('smsConfig', 'allowPromotionalSMS', e.target.checked)}
                          />
                          Promotional SMS (Bulk campaigns)
                        </label>
                      </div>
                    </div>

                    {/* Daily Limit */}
                    <div className="form-group">
                      <label>Daily SMS Limit</label>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={settings.smsConfig?.dailyLimit || 1000}
                        onChange={(e) => handleSettingsChange('smsConfig', 'dailyLimit', parseInt(e.target.value))}
                      />
                      <small>Maximum number of SMS messages to send per day (cost control)</small>
                    </div>

                    {/* SMS Statistics */}
                    {smsStats && (
                      <div style={{ marginTop: '1.5rem', padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>SMS Statistics</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                          <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#007aff' }}>
                              {smsStats.todaySent || 0}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(232, 232, 232, 0.7)' }}>
                              Sent Today
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34c759' }}>
                              {smsStats.totalSent || 0}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(232, 232, 232, 0.7)' }}>
                              Total Sent
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff453a' }}>
                              {smsStats.totalFailed || 0}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(232, 232, 232, 0.7)' }}>
                              Failed
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffd60a' }}>
                              ${(smsStats.totalCost || 0).toFixed(2)}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(232, 232, 232, 0.7)' }}>
                              Total Cost
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#bf5af2' }}>
                              {smsStats.successRate || 100}%
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(232, 232, 232, 0.7)' }}>
                              Success Rate
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Test SMS Section */}
                    <div style={{ marginTop: '1.5rem', padding: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '6px' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Send Test SMS</h4>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          value={testSmsPhone}
                          onChange={(e) => setTestSmsPhone(e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div className="form-group">
                        <label>Test Message</label>
                        <textarea
                          value={testSmsMessage}
                          onChange={(e) => setTestSmsMessage(e.target.value)}
                          placeholder="Test message from The Fever Studio"
                          rows="3"
                          maxLength="160"
                        />
                        <small>{testSmsMessage.length} / 160 characters</small>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendTestSMS}
                        className="btn-secondary"
                        disabled={testSmsResult?.loading}
                      >
                        {testSmsResult?.loading ? 'Sending...' : 'Send Test SMS'}
                      </button>
                      {testSmsResult && !testSmsResult.loading && (
                        <div style={{
                          marginTop: '10px',
                          padding: '12px',
                          background: testSmsResult.success ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 69, 58, 0.1)',
                          borderRadius: '4px',
                          border: `1px solid ${testSmsResult.success ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 69, 58, 0.3)'}`
                        }}>
                          <div style={{
                            color: testSmsResult.success ? '#34c759' : '#ff453a',
                            fontWeight: '600',
                            marginBottom: testSmsResult.details ? '6px' : '0'
                          }}>
                            {testSmsResult.message}
                          </div>
                          {testSmsResult.details && (
                            <div style={{
                              color: 'rgba(232, 232, 232, 0.8)',
                              fontSize: '0.9rem',
                              marginTop: '4px',
                              lineHeight: '1.4'
                            }}>
                              {testSmsResult.details}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="form-actions" style={{ marginTop: '2rem' }}>
                <button type="submit" className="btn-primary">
                  Save All Settings
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ClassPass Analytics Tab */}
        {activeTab === 'classpassAnalytics' && classPassAnalytics && (
          <div className="classpass-analytics-section">
            <h2 style={{ marginBottom: '0.5rem' }}>ClassPass Analytics</h2>
            <p style={{ color: 'rgba(232, 232, 232, 0.7)', marginBottom: '2rem' }}>
              Track ClassPass customer acquisition, conversions, and revenue impact
            </p>

            {/* Key Metrics */}
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#007aff' }}>
                  {classPassAnalytics.overview.totalBookings}
                </div>
                <div className="stat-label">Total Bookings</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(232, 232, 232, 0.6)', marginTop: '4px' }}>
                  {classPassAnalytics.overview.completedBookings} completed
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-value" style={{ color: '#34c759' }}>
                  ${classPassAnalytics.overview.totalRevenue.toFixed(2)}
                </div>
                <div className="stat-label">Total Revenue</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(232, 232, 232, 0.6)', marginTop: '4px' }}>
                  from ClassPass
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-value" style={{ color: '#c9a86a' }}>
                  {classPassAnalytics.overview.totalUsers}
                </div>
                <div className="stat-label">ClassPass Users</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(232, 232, 232, 0.6)', marginTop: '4px' }}>
                  unique customers
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-value" style={{ color: '#ff9500' }}>
                  {classPassAnalytics.overview.conversionRate}%
                </div>
                <div className="stat-label">Conversion Rate</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(232, 232, 232, 0.6)', marginTop: '4px' }}>
                  {classPassAnalytics.overview.convertedUsers} converted
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-value" style={{ color: '#ff3b30' }}>
                  {classPassAnalytics.overview.avgBookingsPerUser}
                </div>
                <div className="stat-label">Avg Bookings/User</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(232, 232, 232, 0.6)', marginTop: '4px' }}>
                  per customer
                </div>
              </div>
            </div>

            {/* Hot Leads Section */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#ff9500' }}>
                🔥 Hot Leads ({classPassAnalytics.hotLeads.length})
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(232, 232, 232, 0.7)', marginBottom: '1rem' }}>
                ClassPass users with 2+ visits who haven't converted yet. Prime candidates for membership offers!
              </p>

              {classPassAnalytics.hotLeads.length > 0 ? (
                <div style={{ background: 'rgba(26, 26, 26, 0.5)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(255, 149, 0, 0.1)', borderBottom: '1px solid rgba(255, 149, 0, 0.3)' }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#ff9500' }}>Name</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#ff9500' }}>Email</th>
                        <th style={{ padding: '12px', textAlign: 'center', color: '#ff9500' }}>Bookings</th>
                        <th style={{ padding: '12px', textAlign: 'center', color: '#ff9500' }}>Days Since First</th>
                        <th style={{ padding: '12px', textAlign: 'center', color: '#ff9500' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classPassAnalytics.hotLeads.map((lead, index) => (
                        <tr key={lead.id} style={{ borderBottom: index < classPassAnalytics.hotLeads.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none' }}>
                          <td style={{ padding: '12px' }}>{lead.name}</td>
                          <td style={{ padding: '12px', fontSize: '0.9rem', color: 'rgba(232, 232, 232, 0.8)' }}>{lead.email}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span style={{
                              background: 'rgba(0, 122, 255, 0.2)',
                              color: '#007aff',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontWeight: '600',
                              fontSize: '0.9rem'
                            }}>
                              {lead.bookingCount}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: 'rgba(232, 232, 232, 0.7)' }}>
                            {lead.daysSinceFirst} days
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('token');
                                  await api.post(`/api/classpass-analytics/convert-user/${lead.id}`, {}, {
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  alert(`${lead.name} marked as converted!`);
                                  // Refresh data
                                  const res = await api.get('/api/classpass-analytics/overview', {
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  setClassPassAnalytics(res.data);
                                } catch (err) {
                                  console.error('Error marking as converted:', err);
                                  alert('Failed to mark as converted');
                                }
                              }}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.85rem',
                                backgroundColor: '#34c759',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              Mark Converted
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  background: 'rgba(26, 26, 26, 0.5)',
                  borderRadius: '8px',
                  color: 'rgba(232, 232, 232, 0.6)'
                }}>
                  No hot leads yet. Check back as ClassPass users make repeat bookings!
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Recent ClassPass Bookings</h3>
              {classPassAnalytics.recentActivity.length > 0 ? (
                <div style={{ background: 'rgba(26, 26, 26, 0.5)', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(0, 122, 255, 0.1)', borderBottom: '1px solid rgba(0, 122, 255, 0.3)' }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Customer</th>
                        <th style={{ padding: '12px', textAlign: 'left' }}>Class</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Payout</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classPassAnalytics.recentActivity.map((booking, index) => (
                        <tr key={booking.id} style={{ borderBottom: index < classPassAnalytics.recentActivity.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none' }}>
                          <td style={{ padding: '12px' }}>
                            <div>{booking.name}</div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(232, 232, 232, 0.6)' }}>{booking.email}</div>
                          </td>
                          <td style={{ padding: '12px' }}>{booking.eventTitle}</td>
                          <td style={{ padding: '12px', textAlign: 'center', color: '#34c759', fontWeight: '600' }}>
                            ${booking.payout.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontSize: '0.9rem', color: 'rgba(232, 232, 232, 0.7)' }}>
                            {new Date(booking.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  background: 'rgba(26, 26, 26, 0.5)',
                  borderRadius: '8px',
                  color: 'rgba(232, 232, 232, 0.6)'
                }}>
                  No ClassPass bookings yet
                </div>
              )}
            </div>

            {/* Conversion Goal Info */}
            <div style={{
              padding: '1.5rem',
              background: 'rgba(0, 122, 255, 0.1)',
              border: '1px solid rgba(0, 122, 255, 0.3)',
              borderRadius: '8px'
            }}>
              <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#007aff' }}>
                Conversion Tracking
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}>
                Tracking conversions within <strong>{classPassAnalytics.overview.conversionGoalDays} days</strong> of first ClassPass booking.
                Mark users as "converted" when they purchase a membership or become regular paying customers.
                This helps measure the ROI of your ClassPass partnership.
              </p>
            </div>
          </div>
        )}

        {/* Email Lists Tab */}
        {activeTab === 'emailLists' && (
          <div className="email-lists-section">
            <div className="section-header">
              <h2>Email Lists</h2>
              <button onClick={() => {
                setShowListForm(true);
                setEditingList(null);
                resetListForm();
              }}>
                Create New List
              </button>
            </div>

            <div className="section-description">
              <h3>About Email Lists</h3>
              <p>Create and manage subscriber lists for targeted email campaigns. Use static lists for manual management or dynamic lists that auto-populate based on criteria.</p>

              <div className="list-types-info">
                <h4>How to Create an Email List:</h4>
                <ol style={{ fontSize: '0.95em', lineHeight: '1.6', marginBottom: '15px' }}>
                  <li><strong>Click "Create New List"</strong> - Opens the list creation form</li>
                  <li><strong>Name & Describe Your List</strong> - e.g., "VIP Members", "Newsletter Subscribers"</li>
                  <li><strong>Choose List Type:</strong>
                    <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                      <li><strong>Static:</strong> Manually add/remove subscribers. Perfect for curated segments.</li>
                      <li><strong>Dynamic:</strong> Auto-populate based on criteria (membership tiers, booking status, birthday month, etc.). Always up-to-date!</li>
                    </ul>
                  </li>
                  <li><strong>Set Dynamic Criteria (if applicable):</strong>
                    <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                      <li><strong>Membership Tiers</strong> - Target specific membership levels</li>
                      <li><strong>Booking Status</strong> - Never booked, has booked, recent, or inactive users</li>
                      <li><strong>Active Membership</strong> - Only users with active memberships</li>
                      <li><strong>Expiring Credits/Membership</strong> - Target users with expiring benefits</li>
                      <li><strong>Birthday Month</strong> - Send birthday campaigns (users must set birthday in profile)</li>
                    </ul>
                  </li>
                  <li><strong>Save & Use</strong> - Use this list when creating email campaigns</li>
                </ol>

                <h4>List Type Comparison:</h4>
                <div className="list-type" style={{ marginBottom: '10px' }}>
                  <strong>Static Lists:</strong> You control exactly who's on the list. Great for: hand-picked VIPs, event-specific attendees, beta testers, special segments.
                </div>
                <div className="list-type">
                  <strong>Dynamic Lists:</strong> Automatically stays current based on your criteria. Great for: all VIP members, inactive users, users with expiring credits, birthday campaigns.
                </div>
              </div>
            </div>

            {showListForm && (
              <div className="modal-overlay" onClick={() => {
                setShowListForm(false);
                setEditingList(null);
                resetListForm();
              }}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>{editingList ? 'Edit Email List' : 'Create New Email List'}</h2>

                  <form onSubmit={handleCreateEmailList}>
                    <div className="form-group">
                      <label>List Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={listForm.name}
                        onChange={handleListFormChange}
                        placeholder="e.g., VIP Members, Newsletter Subscribers"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        name="description"
                        value={listForm.description}
                        onChange={handleListFormChange}
                        rows="2"
                        placeholder="Describe this list..."
                      />
                    </div>

                    <div className="form-group">
                      <label>List Type *</label>
                      <select
                        name="type"
                        value={listForm.type}
                        onChange={handleListFormChange}
                        required
                      >
                        <option value="static">Static (Manual)</option>
                        <option value="dynamic">Dynamic (Auto-populate)</option>
                      </select>
                      <small>
                        Static: Manually add/remove subscribers | Dynamic: Auto-populate based on criteria below
                      </small>
                    </div>

                    {listForm.type === 'dynamic' && (
                      <div className="dynamic-criteria-section">
                        <h3>Dynamic Criteria</h3>
                        <p style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                          Select criteria to automatically populate this list. Multiple criteria will be combined (AND logic).
                        </p>

                        <div className="form-group">
                          <label>Membership Tiers</label>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <label>
                              <input
                                type="checkbox"
                                checked={listForm.dynamicCriteria.membershipTiers.includes('fever-starter')}
                                onChange={(e) => {
                                  const tiers = e.target.checked
                                    ? [...listForm.dynamicCriteria.membershipTiers, 'fever-starter']
                                    : listForm.dynamicCriteria.membershipTiers.filter(t => t !== 'fever-starter');
                                  setListForm({
                                    ...listForm,
                                    dynamicCriteria: { ...listForm.dynamicCriteria, membershipTiers: tiers }
                                  });
                                }}
                              /> Fever Starter
                            </label>
                            <label>
                              <input
                                type="checkbox"
                                checked={listForm.dynamicCriteria.membershipTiers.includes('outbreak')}
                                onChange={(e) => {
                                  const tiers = e.target.checked
                                    ? [...listForm.dynamicCriteria.membershipTiers, 'outbreak']
                                    : listForm.dynamicCriteria.membershipTiers.filter(t => t !== 'outbreak');
                                  setListForm({
                                    ...listForm,
                                    dynamicCriteria: { ...listForm.dynamicCriteria, membershipTiers: tiers }
                                  });
                                }}
                              /> Outbreak
                            </label>
                            <label>
                              <input
                                type="checkbox"
                                checked={listForm.dynamicCriteria.membershipTiers.includes('epidemic')}
                                onChange={(e) => {
                                  const tiers = e.target.checked
                                    ? [...listForm.dynamicCriteria.membershipTiers, 'epidemic']
                                    : listForm.dynamicCriteria.membershipTiers.filter(t => t !== 'epidemic');
                                  setListForm({
                                    ...listForm,
                                    dynamicCriteria: { ...listForm.dynamicCriteria, membershipTiers: tiers }
                                  });
                                }}
                              /> Epidemic
                            </label>
                          </div>
                        </div>

                        <div className="form-group">
                          <label>Booking Status</label>
                          <select
                            name="dynamicCriteria.bookingStatus"
                            value={listForm.dynamicCriteria.bookingStatus}
                            onChange={handleListFormChange}
                          >
                            <option value="">Any</option>
                            <option value="never_booked">Never Booked</option>
                            <option value="has_booked">Has Booked</option>
                            <option value="recent_booking">Recent Booking (Last 30 Days)</option>
                            <option value="inactive">Inactive Users</option>
                          </select>
                        </div>

                        {listForm.dynamicCriteria.bookingStatus === 'inactive' && (
                          <div className="form-group">
                            <label>Inactive Days</label>
                            <input
                              type="number"
                              name="dynamicCriteria.inactiveDays"
                              value={listForm.dynamicCriteria.inactiveDays}
                              onChange={handleListFormChange}
                              placeholder="e.g., 30"
                              min="1"
                            />
                            <small>Users who haven't booked in this many days</small>
                          </div>
                        )}

                        <div className="form-group">
                          <label>Birthday Month</label>
                          <select
                            name="dynamicCriteria.birthdayMonth"
                            value={listForm.dynamicCriteria.birthdayMonth}
                            onChange={handleListFormChange}
                          >
                            <option value="">Any Month</option>
                            <option value="1">January</option>
                            <option value="2">February</option>
                            <option value="3">March</option>
                            <option value="4">April</option>
                            <option value="5">May</option>
                            <option value="6">June</option>
                            <option value="7">July</option>
                            <option value="8">August</option>
                            <option value="9">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          <label>
                            <input
                              type="checkbox"
                              name="dynamicCriteria.expiringCredits"
                              checked={listForm.dynamicCriteria.expiringCredits}
                              onChange={handleListFormChange}
                            /> Credits Expiring Soon
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              name="dynamicCriteria.expiringMembership"
                              checked={listForm.dynamicCriteria.expiringMembership}
                              onChange={handleListFormChange}
                            /> Membership Expiring Soon
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="form-actions">
                      <button type="button" onClick={() => {
                        setShowListForm(false);
                        setEditingList(null);
                        resetListForm();
                      }}>
                        Cancel
                      </button>
                      <button type="submit">
                        {editingList ? 'Update List' : 'Create List'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {showSubscriberImport && (
              <div className="modal-overlay" onClick={() => {
                setShowSubscriberImport(false);
                setSelectedListForImport(null);
              }}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>Import Subscribers</h2>
                  <p>Upload a CSV file with email addresses. First column should be email, second column (optional) should be name.</p>

                  <div className="form-group">
                    <label>CSV File Format:</label>
                    <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px', fontSize: '0.85em' }}>
{`email,name
john@example.com,John Doe
jane@example.com,Jane Smith
...`}
                    </pre>
                  </div>

                  <div className="form-group">
                    <label>Select CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleImportSubscribers(selectedListForImport, file);
                        }
                      }}
                    />
                  </div>

                  <div className="form-actions">
                    <button onClick={() => {
                      setShowSubscriberImport(false);
                      setSelectedListForImport(null);
                    }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showAddSubscriberForm && (
              <div className="modal-overlay" onClick={() => {
                setShowAddSubscriberForm(false);
                setSelectedListForAdd(null);
                setSelectedSubscriberId('');
              }}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>Add Subscriber to List</h2>
                  <p>Select an existing subscriber to add to this email list.</p>

                  <form onSubmit={handleAddSubscriber}>
                    <div className="form-group">
                      <label>Select Subscriber *</label>
                      <select
                        value={selectedSubscriberId}
                        onChange={(e) => setSelectedSubscriberId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose a subscriber --</option>
                        {emailSubscribers
                          .filter(sub => sub.isSubscribed && !sub.isBlocked)
                          .sort((a, b) => (a.email || '').localeCompare(b.email || ''))
                          .map(subscriber => (
                            <option key={subscriber._id} value={subscriber._id}>
                              {subscriber.name ? `${subscriber.name} (${subscriber.email})` : subscriber.email}
                            </option>
                          ))}
                      </select>
                      <small style={{ color: 'rgba(232, 232, 232, 0.7)', marginTop: '0.5rem' }}>
                        Only showing active, non-blocked subscribers
                      </small>
                    </div>

                    <div className="form-actions">
                      <button type="button" onClick={() => {
                        setShowAddSubscriberForm(false);
                        setSelectedListForAdd(null);
                        setSelectedSubscriberId('');
                      }}>
                        Cancel
                      </button>
                      <button type="submit" style={{ backgroundColor: '#4CAF50' }}>
                        Add to List
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="email-lists-table">
              <table>
                <thead>
                  <tr>
                    <th>List Name</th>
                    <th>Type</th>
                    <th>Subscribers</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLists.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                        No email lists yet. Create your first list to get started!
                      </td>
                    </tr>
                  ) : (
                    emailLists.map(list => (
                      <React.Fragment key={list._id}>
                        <tr>
                          <td>
                            <strong>{list.name}</strong>
                          </td>
                          <td>
                            <span className={`badge badge-${list.type}`}>
                              {list.type === 'static' ? 'Static' : 'Dynamic'}
                            </span>
                          </td>
                          <td>{list.subscriberCount || 0}</td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {list.description || '-'}
                          </td>
                          <td>
                            <span className={`status-badge ${list.isActive ? 'status-active' : 'status-inactive'}`}>
                              {list.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="actions">
                            <button
                              onClick={() => handleToggleViewSubscribers(list._id)}
                              className="action-btn view-btn"
                              title="View Subscribers"
                              style={{ background: expandedListId === list._id ? '#c9a86a' : 'rgba(201, 168, 106, 0.2)', color: expandedListId === list._id ? 'white' : '#c9a86a' }}
                            >
                              {expandedListId === list._id ? 'Hide' : 'View'}
                            </button>
                            <button
                              onClick={() => handleEditList(list)}
                              className="action-btn edit-btn"
                              title="Edit"
                            >
                              Edit
                            </button>
                            {list.type === 'static' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedListForAdd(list._id);
                                    setShowAddSubscriberForm(true);
                                  }}
                                  className="action-btn"
                                  title="Add Subscriber"
                                  style={{ backgroundColor: '#4CAF50' }}
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedListForImport(list._id);
                                    setShowSubscriberImport(true);
                                  }}
                                  className="action-btn import-btn"
                                  title="Import Subscribers"
                                >
                                  Import
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleExportList(list._id)}
                              className="action-btn export-btn"
                              title="Export"
                            >
                              Export
                            </button>
                            <button
                              onClick={() => handleDeleteList(list._id)}
                              className="action-btn delete-btn"
                            title="Delete"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      {expandedListId === list._id && listSubscribers[list._id] && (
                        <tr>
                          <td colSpan="6" style={{ background: 'rgba(201, 168, 106, 0.05)', padding: '20px' }}>
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                              <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#c9a86a' }}>
                                Subscribers ({listSubscribers[list._id].length})
                              </h4>
                              {listSubscribers[list._id].length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                                  No subscribers in this list yet.
                                </p>
                              ) : (
                                <table style={{ width: '100%', fontSize: '0.9em' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                      <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
                                      <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
                                      <th style={{ textAlign: 'center', padding: '8px' }}>Status</th>
                                      <th style={{ textAlign: 'center', padding: '8px' }}>Emails Sent</th>
                                      <th style={{ textAlign: 'center', padding: '8px' }}>Opened</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {listSubscribers[list._id].map((sub, idx) => (
                                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <td style={{ padding: '8px' }}>{sub.email}</td>
                                        <td style={{ padding: '8px' }}>{sub.name || '-'}</td>
                                        <td style={{ textAlign: 'center', padding: '8px' }}>
                                          <span style={{
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            fontSize: '0.85em',
                                            background: sub.isSubscribed ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                                            color: sub.isSubscribed ? '#4caf50' : '#f44336'
                                          }}>
                                            {sub.isSubscribed ? 'Active' : 'Unsubscribed'}
                                          </span>
                                        </td>
                                        <td style={{ textAlign: 'center', padding: '8px' }}>{sub.totalEmailsSent || 0}</td>
                                        <td style={{ textAlign: 'center', padding: '8px' }}>{sub.totalEmailsOpened || 0}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Email Subscribers Tab */}
        {activeTab === 'emailSubscribers' && (
          <div className="email-subscribers-section">
            <div className="section-header">
              <h2>Email Subscribers</h2>
              <button onClick={() => setShowSubscriberForm(true)}>
                Add New Subscriber
              </button>
            </div>

            <div className="section-description">
              <h3>📧 Email Subscriber Management</h3>
              <p style={{ marginBottom: '12px', lineHeight: '1.6' }}>
                Centralized management of all email subscribers in your system. Subscribers are automatically created when customers opt-in during booking or when manually added by admins.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '15px', padding: '15px', background: 'rgba(201, 168, 106, 0.1)', borderRadius: '8px' }}>
                <div>
                  <strong style={{ color: '#c9a86a' }}>📝 Manual Management:</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
                    <li>Add subscribers individually</li>
                    <li>Edit subscriber details</li>
                    <li>View subscription status</li>
                    <li>Track email engagement</li>
                  </ul>
                </div>
                <div>
                  <strong style={{ color: '#c9a86a' }}>🎯 Automatic Collection:</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
                    <li>Booking form opt-in checkbox</li>
                    <li>Auto-created from bookings</li>
                    <li>Organized into lists</li>
                    <li>Dynamic segmentation</li>
                  </ul>
                </div>
                <div>
                  <strong style={{ color: '#c9a86a' }}>🔍 Search & Filter:</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
                    <li>Search by email or name</li>
                    <li>Filter by status</li>
                    <li>View list memberships</li>
                    <li>Track engagement metrics</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="subscriber-controls" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '250px' }}>
                <input
                  type="text"
                  placeholder="Search by email or name..."
                  value={subscriberSearch}
                  onChange={(e) => setSubscriberSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 15px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#e8e8e8',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ minWidth: '200px' }}>
                <select
                  value={subscriberFilter}
                  onChange={(e) => setSubscriberFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 15px',
                    border: '2px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#e8e8e8',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">All Subscribers</option>
                  <option value="subscribed">Subscribed</option>
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>

            {/* Subscribers Table */}
            <div className="email-lists-table">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>Lists</th>
                    <th>Emails Sent</th>
                    <th>Emails Opened</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {emailSubscribers
                    .filter(sub => {
                      // Filter by status
                      if (subscriberFilter === 'subscribed' && !sub.isSubscribed) return false;
                      if (subscriberFilter === 'unsubscribed' && sub.isSubscribed) return false;
                      if (subscriberFilter === 'blocked' && !sub.isBlocked) return false;

                      // Filter by search
                      if (subscriberSearch) {
                        const search = subscriberSearch.toLowerCase();
                        return sub.email.toLowerCase().includes(search) ||
                               (sub.name && sub.name.toLowerCase().includes(search));
                      }
                      return true;
                    })
                    .map(subscriber => (
                      <tr key={subscriber._id}>
                        <td>{subscriber.email}</td>
                        <td>{subscriber.name || '-'}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                            background: subscriber.isBlocked ? 'rgba(244, 67, 54, 0.2)' : subscriber.isSubscribed ? 'rgba(76, 175, 80, 0.2)' : 'rgba(158, 158, 158, 0.2)',
                            color: subscriber.isBlocked ? '#f44336' : subscriber.isSubscribed ? '#4caf50' : '#9e9e9e'
                          }}>
                            {subscriber.isBlocked ? 'Blocked' : subscriber.isSubscribed ? 'Active' : 'Unsubscribed'}
                          </span>
                        </td>
                        <td>
                          {emailLists
                            .filter(list =>
                              list.type === 'static' && list.subscribers && list.subscribers.includes(subscriber._id)
                            )
                            .map(list => list.name)
                            .join(', ') || '-'}
                        </td>
                        <td>{subscriber.totalEmailsSent || 0}</td>
                        <td>{subscriber.totalEmailsOpened || 0}</td>
                        <td>{new Date(subscriber.createdAt).toLocaleDateString()}</td>
                        <td className="actions">
                          <button
                            onClick={() => {
                              setEditingSubscriber(subscriber);
                              setSelectedListIds(subscriber.lists?.map(list => typeof list === 'string' ? list : list._id) || []);
                              setShowSubscriberForm(true);
                            }}
                            className="action-btn edit-btn"
                          >
                            Edit
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm(`Delete subscriber ${subscriber.email}?`)) return;
                              try {
                                const token = localStorage.getItem('token');
                                await api.delete(`/api/email-subscribers/${subscriber._id}`, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                alert('Subscriber deleted successfully');
                                fetchData();
                              } catch (error) {
                                console.error('Error deleting subscriber:', error);
                                alert(error.response?.data?.error || 'Failed to delete subscriber');
                              }
                            }}
                            className="action-btn delete-btn"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  {emailSubscribers.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                        No subscribers yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add/Edit Subscriber Modal */}
            {showSubscriberForm && (
              <div className="modal-overlay" onClick={() => {
                setShowSubscriberForm(false);
                setEditingSubscriber(null);
                setSelectedListIds([]);
              }}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>{editingSubscriber ? 'Edit Subscriber' : 'Add New Subscriber'}</h2>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = {
                      email: formData.get('email'),
                      name: formData.get('name'),
                      isSubscribed: formData.get('isSubscribed') === 'true',
                      isBlocked: formData.get('isBlocked') === 'true',
                      lists: editingSubscriber ? selectedListIds : undefined
                    };

                    try {
                      const token = localStorage.getItem('token');
                      if (editingSubscriber) {
                        await api.put(`/api/email-subscribers/${editingSubscriber._id}`, data, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        alert('Subscriber updated successfully');
                      } else {
                        await api.post('/api/email-subscribers', data, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        alert('Subscriber added successfully');
                      }
                      setShowSubscriberForm(false);
                      setEditingSubscriber(null);
                      setSelectedListIds([]);
                      fetchData();
                    } catch (error) {
                      console.error('Error saving subscriber:', error);
                      alert(error.response?.data?.error || 'Failed to save subscriber');
                    }
                  }}>
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={editingSubscriber?.email}
                        required
                        disabled={!!editingSubscriber}
                        style={{ opacity: editingSubscriber ? 0.6 : 1 }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={editingSubscriber?.name}
                      />
                    </div>

                    <div className="form-group">
                      <label>Status</label>
                      <select name="isSubscribed" defaultValue={editingSubscriber?.isSubscribed !== false ? 'true' : 'false'}>
                        <option value="true">Subscribed</option>
                        <option value="false">Unsubscribed</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Blocked</label>
                      <select name="isBlocked" defaultValue={editingSubscriber?.isBlocked ? 'true' : 'false'}>
                        <option value="false">No</option>
                        <option value="true">Yes (will not receive any emails)</option>
                      </select>
                    </div>

                    {editingSubscriber && (
                      <div className="form-group">
                        <label>Email Lists</label>
                        <div style={{
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          padding: '1rem',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          backgroundColor: 'rgba(0,0,0,0.2)'
                        }}>
                          {emailLists.filter(list => list.type === 'static').length === 0 ? (
                            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>No static lists available</p>
                          ) : (
                            emailLists
                              .filter(list => list.type === 'static')
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(list => (
                                <div key={list._id} style={{ marginBottom: '0.5rem' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={selectedListIds.includes(list._id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedListIds([...selectedListIds, list._id]);
                                        } else {
                                          setSelectedListIds(selectedListIds.filter(id => id !== list._id));
                                        }
                                      }}
                                      style={{ marginRight: '0.5rem' }}
                                    />
                                    <span>{list.name}</span>
                                    {list.description && (
                                      <small style={{ marginLeft: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>
                                        ({list.subscriberCount} subscribers)
                                      </small>
                                    )}
                                  </label>
                                </div>
                              ))
                          )}
                        </div>
                        <small style={{ color: 'rgba(232, 232, 232, 0.7)', display: 'block', marginTop: '0.5rem' }}>
                          Select which email lists this subscriber should belong to (static lists only)
                        </small>
                      </div>
                    )}

                    <div className="form-actions">
                      <button type="button" onClick={() => {
                        setShowSubscriberForm(false);
                        setEditingSubscriber(null);
                        setSelectedListIds([]);
                      }}>
                        Cancel
                      </button>
                      <button type="submit">
                        {editingSubscriber ? 'Update Subscriber' : 'Add Subscriber'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
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

            <div className="section-description">
              <h3>⭐ Review Management</h3>
              <p style={{ marginBottom: '12px', lineHeight: '1.6' }}>
                Moderate and showcase customer feedback. Reviews help build trust and credibility with potential customers. Manage review visibility, feature standout testimonials, and maintain quality standards.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '15px', padding: '15px', background: 'rgba(201, 168, 106, 0.1)', borderRadius: '8px', marginBottom: '2rem' }}>
                <div>
                  <strong style={{ color: '#c9a86a' }}>✅ Review Approval:</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
                    <li>New reviews start as "Pending"</li>
                    <li>Click "Approve" to make visible</li>
                    <li>Approved reviews appear publicly</li>
                    <li>Review content before approving</li>
                  </ul>
                </div>
                <div>
                  <strong style={{ color: '#c9a86a' }}>⭐ Featured Reviews:</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
                    <li>Feature best testimonials</li>
                    <li>Featured reviews show on homepage</li>
                    <li>Highlight 5-star experiences</li>
                    <li>Showcase diverse feedback</li>
                  </ul>
                </div>
                <div>
                  <strong style={{ color: '#c9a86a' }}>🔧 Review Actions:</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.8' }}>
                    <li>Delete inappropriate content</li>
                    <li>Toggle featured status anytime</li>
                    <li>View associated event details</li>
                    <li>See customer name and rating</li>
                  </ul>
                </div>
              </div>
            </div>

            {reviews.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '3rem', color: 'rgba(232, 232, 232, 0.5)' }}>
                No reviews yet
              </p>
            ) : (
              <div className="bookings-table">
                <table>
                  <thead>
                    <tr>
                      <th>Class</th>
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

        {/* Help Tab */}
        {activeTab === 'help' && (
          <div className="help-section">
            <div className="section-header">
              <h2>ClassPass Integration Help</h2>
              <p>Complete guide to understanding and managing the ClassPass integration</p>
            </div>

            <div className="help-content-wrapper">
              {/* Sidebar Navigation */}
              <div className="help-sidebar">
                <div
                  className={`help-sidebar-item ${activeHelpSection === 'getting-started' ? 'active' : ''}`}
                  onClick={() => setActiveHelpSection('getting-started')}
                >
                  Getting Started
                </div>
                <div
                  className={`help-sidebar-item ${activeHelpSection === 'configuration' ? 'active' : ''}`}
                  onClick={() => setActiveHelpSection('configuration')}
                >
                  Configuration Setup
                </div>
                <div
                  className={`help-sidebar-item ${activeHelpSection === 'email-campaigns' ? 'active' : ''}`}
                  onClick={() => setActiveHelpSection('email-campaigns')}
                >
                  Email Campaigns
                </div>
                <div
                  className={`help-sidebar-item ${activeHelpSection === 'user-journey' ? 'active' : ''}`}
                  onClick={() => setActiveHelpSection('user-journey')}
                >
                  User Journey & Flow
                </div>
                <div
                  className={`help-sidebar-item ${activeHelpSection === 'analytics' ? 'active' : ''}`}
                  onClick={() => setActiveHelpSection('analytics')}
                >
                  Analytics & Metrics
                </div>
                <div
                  className={`help-sidebar-item ${activeHelpSection === 'pricing' ? 'active' : ''}`}
                  onClick={() => setActiveHelpSection('pricing')}
                >
                  Pricing & Revenue
                </div>
                <div
                  className={`help-sidebar-item ${activeHelpSection === 'troubleshooting' ? 'active' : ''}`}
                  onClick={() => setActiveHelpSection('troubleshooting')}
                >
                  Troubleshooting
                </div>
                <div
                  className={`help-sidebar-item ${activeHelpSection === 'quick-reference' ? 'active' : ''}`}
                  onClick={() => setActiveHelpSection('quick-reference')}
                >
                  Quick Reference
                </div>
                <div
                  className={`help-sidebar-item ${activeHelpSection === 'sms-setup' ? 'active' : ''}`}
                  onClick={() => setActiveHelpSection('sms-setup')}
                >
                  SMS Notifications
                </div>
              </div>

              {/* Content Area */}
              <div className="help-content-area">
                {/* Getting Started Section */}
                {activeHelpSection === 'getting-started' && (
                  <div className="help-section-content">
                    <h3>Getting Started with ClassPass Integration</h3>

                    <h4>What is ClassPass Integration?</h4>
                    <p>
                      The ClassPass integration allows you to track and manage customers who book classes through the ClassPass platform.
                      This system helps you understand ClassPass customer behavior, track conversions to direct memberships,
                      and automate marketing efforts to convert ClassPass users into regular members.
                    </p>

                    <h4>How It Works</h4>
                    <p>When enabled, the system:</p>
                    <ul>
                      <li>Tracks all bookings made through ClassPass separately from direct bookings</li>
                      <li>Automatically tags ClassPass users in your email system</li>
                      <li>Sends targeted email campaigns based on visit frequency</li>
                      <li>Monitors conversion from ClassPass to membership</li>
                      <li>Provides detailed analytics on ClassPass customer behavior and revenue</li>
                    </ul>

                    <h4>Benefits for Your Studio</h4>
                    <ul>
                      <li><strong>Customer Acquisition:</strong> Reach new customers through ClassPass marketplace</li>
                      <li><strong>Conversion Tracking:</strong> Identify which ClassPass users become regular members</li>
                      <li><strong>Automated Marketing:</strong> Nurture ClassPass leads with targeted email sequences</li>
                      <li><strong>Revenue Analytics:</strong> Compare ClassPass vs direct booking revenue</li>
                      <li><strong>Data-Driven Decisions:</strong> Use conversion metrics to optimize your offerings</li>
                    </ul>

                    <h4>Quick Start Checklist</h4>
                    <div className="help-checklist">
                      <li>Enable ClassPass Integration in Settings</li>
                      <li>Configure default payout rate for revenue tracking</li>
                      <li>Set conversion tracking window (default: 30 days)</li>
                      <li>Activate Email Automation campaigns</li>
                      <li>Customize email templates with your studio details</li>
                      <li>Test with a ClassPass booking</li>
                      <li>Monitor ClassPass Analytics dashboard</li>
                    </div>
                  </div>
                )}

                {/* Configuration Setup Section */}
                {activeHelpSection === 'configuration' && (
                  <div className="help-section-content">
                    <h3>Configuration Setup</h3>

                    <p>
                      Follow these steps to properly configure ClassPass integration for your studio.
                    </p>

                    <h4>Step 1: Enable Integration (Settings Tab)</h4>
                    <p>Navigate to Settings tab and find the ClassPass Integration section:</p>
                    <div className="help-code-block">
                      1. Check "Enable ClassPass Integration" checkbox<br/>
                      2. This activates ClassPass tracking across all bookings<br/>
                      3. Reveals ClassPass Analytics tab in Admin & Insights section
                    </div>

                    <h4>Step 2: Configure Integration Settings</h4>
                    <ul>
                      <li>
                        <strong>Auto-tag ClassPass users:</strong> Automatically adds "classpass" tag to email subscribers
                        for targeted campaign delivery (recommended: enabled)
                      </li>
                      <li>
                        <strong>Track ClassPass to member conversions:</strong> Monitor when ClassPass users purchase memberships
                        or become regular direct-booking customers (recommended: enabled)
                      </li>
                      <li>
                        <strong>Conversion Goal (Days):</strong> Number of days to track conversion from first ClassPass booking
                        to membership purchase (default: 30 days, range: 1-180)
                      </li>
                      <li>
                        <strong>Default Payout Rate:</strong> Average payout per ClassPass booking for revenue analytics
                        when specific payout not recorded (typical: $18-$25)
                      </li>
                    </ul>

                    <h4>Step 3: Activate Email Campaigns (Email Automation Tab)</h4>
                    <p>Navigate to Email Automation and activate these campaigns:</p>
                    <div className="help-code-block">
                      Campaign 1: "ClassPass - First Visit Welcome"<br/>
                      - Sends 2 hours after first booking<br/>
                      - Introduces studio and membership benefits<br/>
                      <br/>
                      Campaign 2: "ClassPass - Second Visit Nurture"<br/>
                      - Sends 1 day after second booking<br/>
                      - Includes 15% membership discount offer<br/>
                      <br/>
                      Campaign 3: "ClassPass - Hot Lead Conversion"<br/>
                      - Sends 12 hours after 3rd+ booking<br/>
                      - Strong conversion offer: 20% off + FREE gift<br/>
                      - Follow-up reminder 4 days later
                    </div>

                    <h4>Step 4: Customize Email Templates</h4>
                    <p>Edit campaign email content to include:</p>
                    <ul>
                      <li>Your studio's unique value proposition</li>
                      <li>Current membership pricing and benefits</li>
                      <li>Studio contact information (phone, email, website)</li>
                      <li>Links to membership purchase page</li>
                      <li>Testimonials from converted members</li>
                    </ul>

                    <h4>Configuration Verification Checklist</h4>
                    <div className="help-checklist">
                      <li>ClassPass Integration enabled in Settings</li>
                      <li>Default payout rate set (e.g., $22)</li>
                      <li>Conversion window configured (e.g., 30 days)</li>
                      <li>Auto-tagging enabled</li>
                      <li>All three email campaigns activated</li>
                      <li>Email templates customized with studio details</li>
                      <li>ClassPass Analytics tab visible in dashboard</li>
                    </div>
                  </div>
                )}

                {/* Email Campaigns Section */}
                {activeHelpSection === 'email-campaigns' && (
                  <div className="help-section-content">
                    <h3>Email Campaign Management</h3>

                    <p>
                      ClassPass email campaigns are automatically triggered based on user behavior.
                      Understanding how each campaign works helps you optimize conversion rates.
                    </p>

                    <h4>Campaign Triggers & Timing</h4>

                    <div className="help-expandable">
                      <strong>First Visit Welcome Campaign</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #c9a86a' }}>
                        <p><strong>Trigger:</strong> After customer creates first ClassPass booking</p>
                        <p><strong>Delay:</strong> 2 hours after booking</p>
                        <p><strong>Purpose:</strong> Introduce studio, create positive first impression</p>
                        <p><strong>Content Strategy:</strong></p>
                        <ul>
                          <li>Welcome message and excitement about their upcoming class</li>
                          <li>What to expect: location, parking, what to bring</li>
                          <li>Brief studio history and mission</li>
                          <li>Highlight membership benefits vs ClassPass</li>
                          <li>Call-to-action: Learn more about memberships</li>
                        </ul>
                      </div>
                    </div>

                    <div className="help-expandable">
                      <strong>Second Visit Nurture Campaign</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #c9a86a' }}>
                        <p><strong>Trigger:</strong> After customer creates second ClassPass booking</p>
                        <p><strong>Delay:</strong> 1 day after booking</p>
                        <p><strong>Purpose:</strong> Reinforce community connection, introduce conversion offer</p>
                        <p><strong>Content Strategy:</strong></p>
                        <ul>
                          <li>Acknowledge they're coming back - "We noticed you're becoming a regular!"</li>
                          <li>Emphasize community and belonging</li>
                          <li>Share member testimonials or success stories</li>
                          <li>Present initial conversion incentive: 15% off first month</li>
                          <li>Show the math: ClassPass credits vs membership value</li>
                        </ul>
                      </div>
                    </div>

                    <div className="help-expandable">
                      <strong>Hot Lead Conversion Campaign</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #c9a86a' }}>
                        <p><strong>Trigger:</strong> After customer reaches 3+ ClassPass bookings</p>
                        <p><strong>Delay:</strong> 12 hours after booking (+ reminder at 4 days)</p>
                        <p><strong>Purpose:</strong> Strong conversion push with urgency and value</p>
                        <p><strong>Content Strategy:</strong></p>
                        <ul>
                          <li>Personalized message: "You've taken X classes - you're part of the family!"</li>
                          <li>Value comparison: Show estimated ClassPass spend vs membership cost</li>
                          <li>Premium offer: 20% off first month + FREE branded gift</li>
                          <li>Create urgency: Limited time offer (7 days)</li>
                          <li>Two-email sequence: Initial offer + reminder before expiration</li>
                        </ul>
                      </div>
                    </div>

                    <h4>Email Placeholders</h4>
                    <p>Use these dynamic placeholders in your campaign templates:</p>
                    <div className="help-code-block">
                      Available Placeholders:<br/>
                      <br/>
                      User Information:<br/>
                      - {`{{userName}}`} = Customer's name<br/>
                      <br/>
                      Booking Details:<br/>
                      - {`{{eventTitle}}`} = Class name<br/>
                      - {`{{eventDate}}`} = Class date<br/>
                      - {`{{eventTime}}`} = Class time<br/>
                      - {`{{firstClassDate}}`} = Date of first ClassPass visit<br/>
                      <br/>
                      Analytics:<br/>
                      - {`{{bookingCount}}`} = Total ClassPass bookings<br/>
                      - {`{{classPassTotal}}`} = Estimated spending via ClassPass<br/>
                      - {`{{daysInWindow}}`} = Days remaining in conversion window<br/>
                      <br/>
                      Studio Contact:<br/>
                      - {`{{studioPhone}}`} = Your phone number<br/>
                      - {`{{studioEmail}}`} = Your email<br/>
                      - {`{{studioWebsite}}`} = Your website URL
                    </div>

                    <h4>Campaign Metrics</h4>
                    <p>Monitor these key performance indicators in Email Automation:</p>
                    <ul>
                      <li><strong>Triggered:</strong> Number of times campaign criteria were met</li>
                      <li><strong>Sent:</strong> Successfully delivered emails</li>
                      <li><strong>Opened:</strong> Recipients who opened the email (tracked via pixel)</li>
                      <li><strong>Clicked:</strong> Recipients who clicked links in email</li>
                      <li><strong>Open Rate:</strong> Opens / Sent (target: 25-35%)</li>
                      <li><strong>Click Rate:</strong> Clicks / Opens (target: 15-25%)</li>
                    </ul>

                    <h4>Optimization Tips</h4>
                    <ul>
                      <li>Test different subject lines to improve open rates</li>
                      <li>A/B test discount amounts (15% vs 20% vs free month)</li>
                      <li>Adjust timing delays based on your class schedule patterns</li>
                      <li>Include social proof (testimonials, community photos)</li>
                      <li>Make membership CTAs prominent and clear</li>
                    </ul>
                  </div>
                )}

                {/* User Journey Section */}
                {activeHelpSection === 'user-journey' && (
                  <div className="help-section-content">
                    <h3>User Journey & Flow</h3>

                    <p>
                      Understanding the complete ClassPass user journey helps you identify optimization opportunities
                      and improve conversion rates.
                    </p>

                    <h4>Complete Flow Diagram</h4>
                    <div className="help-flow-diagram">
                      <div style={{ padding: '1.5rem', lineHeight: '1.8' }}>
                        <strong>Stage 1: BOOKING</strong><br/>
                        - User books class via ClassPass platform<br/>
                        - Booking source automatically set to "classpass"<br/>
                        - ClassPass booking ID stored (optional)<br/>
                        - ClassPass payout amount stored (optional)<br/>
                        - Event available spots reduced<br/>
                        <br/>
                        <strong>Stage 2: USER TRACKING</strong><br/>
                        - Acquisition source set to "classpass" (first time only)<br/>
                        - First ClassPass booking date recorded<br/>
                        - ClassPass booking count incremented<br/>
                        - User automatically subscribed to email list<br/>
                        - "classpass" tag applied for targeted campaigns<br/>
                        <br/>
                        <strong>Stage 3: CAMPAIGN TRIGGER</strong><br/>
                        1st booking → First Visit Welcome (sent in 2 hours)<br/>
                        2nd booking → Second Visit Nurture (sent in 1 day)<br/>
                        3rd booking → Hot Lead Conversion (sent in 12 hours + reminder in 4 days)<br/>
                        <br/>
                        <strong>Stage 4: CHECK-IN</strong><br/>
                        - Admin scans QR code or manual check-in<br/>
                        - Booking marked as checked in with timestamp<br/>
                        - Post-class follow-up campaign triggered<br/>
                        - Analytics updated with attendance data<br/>
                        <br/>
                        <strong>Stage 5: CONVERSION TRACKING</strong><br/>
                        - User purchases membership or makes direct booking<br/>
                        - "Converted to member" flag set to true<br/>
                        - Conversion metrics updated in analytics<br/>
                        - User removed from "hot leads" list<br/>
                        - Days to conversion calculated<br/>
                        <br/>
                        <strong>Stage 6: ANALYTICS</strong><br/>
                        - Total ClassPass bookings tracked<br/>
                        - Revenue calculations (sum of payouts)<br/>
                        - Conversion rate computed<br/>
                        - Hot leads list maintained<br/>
                        - Funnel visualization updated
                      </div>
                    </div>

                    <h4>Booking Types Comparison</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--secondary-background)', borderBottom: '2px solid var(--primary-color)' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Type</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Revenue</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Tracking</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Goal</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <td style={{ padding: '0.75rem' }}><strong>ClassPass</strong></td>
                          <td style={{ padding: '0.75rem' }}>Lower (~$18-25/class)</td>
                          <td style={{ padding: '0.75rem' }}>Separate analytics, conversion tracking</td>
                          <td style={{ padding: '0.75rem' }}>Convert to membership</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <td style={{ padding: '0.75rem' }}><strong>Membership</strong></td>
                          <td style={{ padding: '0.75rem' }}>Monthly recurring ($199 Unlimited, $99-$159 Limited)</td>
                          <td style={{ padding: '0.75rem' }}>Credit usage, class attendance, milestones</td>
                          <td style={{ padding: '0.75rem' }}>Retain and engage</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.75rem' }}><strong>Direct</strong></td>
                          <td style={{ padding: '0.75rem' }}>Full price per class</td>
                          <td style={{ padding: '0.75rem' }}>Standard booking analytics</td>
                          <td style={{ padding: '0.75rem' }}>Convert to membership</td>
                        </tr>
                      </tbody>
                    </table>

                    <h4>Credit System (Memberships Only)</h4>
                    <p>How credits work for membership-based check-ins:</p>
                    <ul>
                      <li><strong>1 Credit = 1 Class:</strong> Standard deduction for limited plans</li>
                      <li><strong>Unlimited Plans (Epidemic):</strong> No credit deduction, unlimited access</li>
                      <li><strong>Limited Plans:</strong> Credits checked at check-in, booking fails if insufficient</li>
                      <li><strong>Monthly Reset:</strong> Credits refresh on billing cycle date</li>
                      <li><strong>Walk-Ins:</strong> Credits deducted at check-in even without pre-booking</li>
                    </ul>

                    <h4>Milestone Rewards System</h4>
                    <p>Automatic rewards triggered at class attendance milestones:</p>
                    <div className="help-code-block">
                      50 classes   → Sweat Towel<br/>
                      100 classes  → Branded Tote Bag<br/>
                      150 classes  → Water Bottle<br/>
                      200 classes  → Studio Hat<br/>
                      250 classes  → Premium Hoodie
                    </div>
                  </div>
                )}

                {/* Analytics & Metrics Section */}
                {activeHelpSection === 'analytics' && (
                  <div className="help-section-content">
                    <h3>Analytics & Metrics</h3>

                    <p>
                      The ClassPass Analytics dashboard provides insights into acquisition, conversion,
                      and revenue impact from ClassPass bookings.
                    </p>

                    <h4>Accessing Analytics</h4>
                    <p>
                      Navigate to Admin & Insights → ClassPass (only visible when integration is enabled)
                    </p>

                    <h4>Key Metrics Explained</h4>

                    <div className="help-expandable">
                      <strong>Total Bookings</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem' }}>
                        <p>Total number of class bookings made through ClassPass</p>
                        <p><strong>Includes:</strong> All booking statuses (pending, confirmed, completed, cancelled)</p>
                        <p><strong>Completed Bookings:</strong> Subset showing only attended classes</p>
                        <p><strong>Use for:</strong> Understanding ClassPass volume and attendance rate</p>
                      </div>
                    </div>

                    <div className="help-expandable">
                      <strong>Total Revenue</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem' }}>
                        <p>Sum of all payouts received from ClassPass bookings</p>
                        <p><strong>Calculation:</strong> Uses recorded payout amounts or default payout rate</p>
                        <p><strong>Average Payout:</strong> Total revenue / completed bookings</p>
                        <p><strong>Use for:</strong> Financial planning and comparing to direct booking revenue</p>
                      </div>
                    </div>

                    <div className="help-expandable">
                      <strong>Unique Customers</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem' }}>
                        <p>Number of distinct ClassPass users who have booked with your studio</p>
                        <p><strong>Tracked by:</strong> User account (email)</p>
                        <p><strong>Use for:</strong> Understanding reach and customer acquisition from ClassPass</p>
                      </div>
                    </div>

                    <div className="help-expandable">
                      <strong>Converted to Members</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem' }}>
                        <p>Number of ClassPass users who purchased a membership</p>
                        <p><strong>Conversion Rate:</strong> Converted / Unique Customers</p>
                        <p><strong>Time Window:</strong> Based on "Conversion Goal Days" setting</p>
                        <p><strong>Benchmark:</strong> Industry average is 8-15%, aim for 15%+</p>
                        <p><strong>Use for:</strong> Measuring effectiveness of conversion campaigns</p>
                      </div>
                    </div>

                    <div className="help-expandable">
                      <strong>Hot Leads</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem' }}>
                        <p>ClassPass users with 2+ bookings who haven't converted to membership</p>
                        <p><strong>Why important:</strong> These are high-intent prospects likely to convert</p>
                        <p><strong>Action:</strong> Prioritize personal outreach to hot leads</p>
                        <p><strong>Use for:</strong> Targeted conversion efforts and retention campaigns</p>
                      </div>
                    </div>

                    <h4>Conversion Funnel</h4>
                    <p>Visual representation of customer progression:</p>
                    <div className="help-code-block">
                      First Visit (100% baseline)<br/>
                      │<br/>
                      ▼ % who return<br/>
                      Second Visit<br/>
                      │<br/>
                      ▼ % who become regulars<br/>
                      3+ Visits (Hot Leads)<br/>
                      │<br/>
                      ▼ % conversion rate<br/>
                      Converted to Member<br/>
                      <br/>
                      Optimize: Identify where most drop-off occurs
                    </div>

                    <h4>Revenue Comparison</h4>
                    <p>Compare ClassPass vs Direct booking revenue:</p>
                    <ul>
                      <li><strong>ClassPass Revenue:</strong> Total payouts from ClassPass</li>
                      <li><strong>Direct Revenue:</strong> Full-price bookings and memberships</li>
                      <li><strong>Blended Revenue:</strong> Combined total from all sources</li>
                      <li><strong>Use case:</strong> Determine if ClassPass is profitable customer acquisition channel</li>
                    </ul>

                    <h4>Interpreting Your Data</h4>

                    <strong>Healthy Metrics:</strong>
                    <ul>
                      <li>Conversion rate: 15%+</li>
                      <li>Average bookings per user: 2.5+</li>
                      <li>Second visit rate: 40%+</li>
                      <li>Hot lead conversion: 25%+</li>
                    </ul>

                    <strong>If conversion rate is low (&lt;10%):</strong>
                    <ul>
                      <li>Review email campaign content and offers</li>
                      <li>Increase discount incentives</li>
                      <li>Improve in-class experience and instructor engagement</li>
                      <li>Add personal follow-up for hot leads</li>
                    </ul>

                    <strong>If few return visits:</strong>
                    <ul>
                      <li>Send post-class feedback survey</li>
                      <li>Improve first-time customer experience</li>
                      <li>Offer ClassPass-exclusive class times or formats</li>
                      <li>Build community through social media</li>
                    </ul>
                  </div>
                )}

                {/* Pricing & Revenue Section */}
                {activeHelpSection === 'pricing' && (
                  <div className="help-section-content">
                    <h3>Pricing & Revenue</h3>

                    <p>
                      Understanding ClassPass payouts and revenue calculations is essential for profitability analysis
                      and pricing strategy.
                    </p>

                    <h4>How ClassPass Payouts Work</h4>
                    <p>
                      ClassPass pays studios a negotiated rate per booking, typically lower than your regular class price.
                      The exact payout depends on your agreement with ClassPass and class demand.
                    </p>

                    <h4>Typical Payout Ranges</h4>
                    <div className="help-code-block">
                      Industry Standards:<br/>
                      <br/>
                      Premium Studios:  $22-30 per class<br/>
                      Standard Studios: $18-25 per class<br/>
                      Budget Studios:   $12-18 per class<br/>
                      <br/>
                      Note: Your actual payout may vary based on:<br/>
                      - Studio location and market<br/>
                      - Class type and duration<br/>
                      - Time of day (peak vs off-peak)<br/>
                      - ClassPass partnership tier
                    </div>

                    <h4>Setting Default Payout Rate</h4>
                    <p>
                      In Settings → ClassPass Integration, set your default payout rate. This is used for revenue
                      calculations when specific booking payout is not recorded.
                    </p>
                    <ul>
                      <li><strong>Recommended:</strong> Use your average or median payout from ClassPass reports</li>
                      <li><strong>Conservative approach:</strong> Use lowest typical payout for baseline projections</li>
                      <li><strong>Update regularly:</strong> Adjust as your ClassPass agreement changes</li>
                    </ul>

                    <h4>Revenue Calculation Methods</h4>

                    <strong>Method 1: Specific Payout Tracking (Most Accurate)</strong>
                    <div className="help-code-block">
                      When creating booking:<br/>
                      {`{`}<br/>
                      &nbsp;&nbsp;bookingSource: "classpass",<br/>
                      &nbsp;&nbsp;classPassBookingId: "CP-12345-67890",<br/>
                      &nbsp;&nbsp;classPassPayout: 25.00  // Actual payout amount<br/>
                      {`}`}<br/>
                      <br/>
                      Revenue = Sum of all classPassPayout values
                    </div>

                    <strong>Method 2: Default Rate Estimation</strong>
                    <div className="help-code-block">
                      If classPassPayout not provided:<br/>
                      <br/>
                      Revenue = (Number of ClassPass bookings) × (Default payout rate)<br/>
                      <br/>
                      Example:<br/>
                      50 bookings × $22 = $1,100 estimated revenue
                    </div>

                    <h4>Cost Comparison Example</h4>
                    <p>Understanding value proposition for conversion campaigns:</p>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--secondary-background)', borderBottom: '2px solid var(--primary-color)' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Scenario</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right' }}>ClassPass</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right' }}>Membership</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right' }}>Savings</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <td style={{ padding: '0.75rem' }}>4 classes/month</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>~$80 in credits</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>$99 Fever Starter</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', color: '#34c759' }}>+$19 value</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <td style={{ padding: '0.75rem' }}>8 classes/month</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>~$160 in credits</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>$159 Outbreak</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', color: '#34c759' }}>+$1 value</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.75rem' }}>Unlimited</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>~$200+ in credits</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>$199 Epidemic</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', color: '#34c759' }}>Unlimited access</td>
                        </tr>
                      </tbody>
                    </table>

                    <h4>ROI Tracking Strategy</h4>

                    <strong>Customer Lifetime Value (CLV) Calculation:</strong>
                    <div className="help-code-block">
                      Initial Phase (ClassPass):<br/>
                      - Average bookings: 2.5 classes<br/>
                      - Revenue per booking: $22<br/>
                      - Initial revenue: $55<br/>
                      <br/>
                      Post-Conversion (Membership):<br/>
                      - Monthly membership: $159 (Outbreak)<br/>
                      - Average retention: 8 months<br/>
                      - Membership revenue: $1,272<br/>
                      <br/>
                      Total CLV: $55 + $1,272 = $1,327<br/>
                      <br/>
                      ROI: Even low ClassPass payouts become profitable<br/>
                      when converted to long-term members
                    </div>

                    <strong>Break-Even Analysis:</strong>
                    <p>
                      If ClassPass payout is lower than your cost per class (instructor, space, etc.),
                      ClassPass functions as a customer acquisition channel. The goal is conversion to direct
                      membership to achieve profitability.
                    </p>

                    <h4>Pricing Strategy Tips</h4>
                    <ul>
                      <li><strong>View ClassPass as marketing:</strong> Customer acquisition cost vs direct advertising</li>
                      <li><strong>Optimize class timing:</strong> Offer ClassPass slots during off-peak hours to fill capacity</li>
                      <li><strong>Capacity management:</strong> Limit ClassPass spots per class to preserve premium pricing</li>
                      <li><strong>Conversion incentives:</strong> Discount offers should exceed ClassPass credit value to customer</li>
                      <li><strong>Track cohorts:</strong> Compare CLV of ClassPass converts vs direct sign-ups</li>
                    </ul>
                  </div>
                )}

                {/* Troubleshooting Section */}
                {activeHelpSection === 'troubleshooting' && (
                  <div className="help-section-content">
                    <h3>Troubleshooting</h3>

                    <p>
                      Common issues and solutions for ClassPass integration problems.
                    </p>

                    <h4>Campaigns Not Sending</h4>

                    <strong>Symptoms:</strong>
                    <p>Email campaigns show "triggered" but not "sent", or sent count is much lower than triggered count.</p>

                    <strong>Possible Causes & Solutions:</strong>
                    <ul>
                      <li>
                        <strong>Campaign not activated:</strong> Check Email Automation tab, ensure campaign status is "Active"
                      </li>
                      <li>
                        <strong>Email service not configured:</strong> Verify SMTP settings in server environment variables
                      </li>
                      <li>
                        <strong>Scheduler not running:</strong> Confirm automated email scheduler is running (typically hourly cron job)
                      </li>
                      <li>
                        <strong>User has no email:</strong> Verify ClassPass bookings include valid email addresses
                      </li>
                      <li>
                        <strong>User unsubscribed:</strong> Check email subscriber status, respect unsubscribe preferences
                      </li>
                      <li>
                        <strong>Duplicate prevention:</strong> System prevents sending same campaign multiple times to same user
                      </li>
                    </ul>

                    <strong>How to Test:</strong>
                    <div className="help-code-block">
                      1. Create test ClassPass booking with your email<br/>
                      2. Wait for campaign delay period<br/>
                      3. Check Email Automation → Campaign → Logs<br/>
                      4. Review sent emails list for your test<br/>
                      5. Check spam folder if not in inbox
                    </div>

                    <h4>Credit Deduction Issues</h4>

                    <strong>Symptoms:</strong>
                    <p>Members report incorrect credit balance, or check-in fails with credit error.</p>

                    <strong>Possible Causes & Solutions:</strong>
                    <ul>
                      <li>
                        <strong>Membership tier mismatch:</strong> Verify user's membership tier and credit allocation
                      </li>
                      <li>
                        <strong>Billing cycle confusion:</strong> Credits reset on billing date, not calendar month
                      </li>
                      <li>
                        <strong>Multiple check-ins:</strong> System should prevent double check-in, verify booking status
                      </li>
                      <li>
                        <strong>Unlimited plan not recognized:</strong> Check membership tier is exactly "epidemic" (lowercase)
                      </li>
                      <li>
                        <strong>Expired membership:</strong> Membership may have lapsed, verify end date
                      </li>
                    </ul>

                    <strong>Manual Credit Adjustment:</strong>
                    <p>If needed, admin can manually adjust credits in Memberships tab → Edit member → Credits field.</p>

                    <h4>Booking Source Not Tracking</h4>

                    <strong>Symptoms:</strong>
                    <p>ClassPass bookings not showing in ClassPass Analytics, or marked as "direct" instead.</p>

                    <strong>Possible Causes & Solutions:</strong>
                    <ul>
                      <li>
                        <strong>Missing bookingSource field:</strong> Ensure booking creation includes bookingSource: "classpass"
                      </li>
                      <li>
                        <strong>Integration not enabled:</strong> Verify Settings → ClassPass Integration → Enabled is checked
                      </li>
                      <li>
                        <strong>Manual booking entry:</strong> Admin-created bookings need bookingSource manually set
                      </li>
                      <li>
                        <strong>Case sensitivity:</strong> Must be lowercase "classpass", not "ClassPass" or "Classpass"
                      </li>
                    </ul>

                    <strong>Correct Booking Format:</strong>
                    <div className="help-code-block">
                      {`{`}<br/>
                      &nbsp;&nbsp;userId: "user_id_here",<br/>
                      &nbsp;&nbsp;eventId: "event_id_here",<br/>
                      &nbsp;&nbsp;bookingSource: "classpass",  // Required<br/>
                      &nbsp;&nbsp;classPassBookingId: "CP-12345",  // Optional<br/>
                      &nbsp;&nbsp;classPassPayout: 22.00,  // Optional but recommended<br/>
                      &nbsp;&nbsp;paymentStatus: "completed"<br/>
                      {`}`}
                    </div>

                    <h4>Analytics Not Updating</h4>

                    <strong>Symptoms:</strong>
                    <p>ClassPass Analytics tab shows stale data or zeros.</p>

                    <strong>Possible Causes & Solutions:</strong>
                    <ul>
                      <li>
                        <strong>Cache issue:</strong> Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
                      </li>
                      <li>
                        <strong>No ClassPass bookings yet:</strong> Analytics only show after first ClassPass booking created
                      </li>
                      <li>
                        <strong>Date filter:</strong> Check if date range filter is excluding recent bookings
                      </li>
                      <li>
                        <strong>API error:</strong> Check browser console for errors, verify backend connection
                      </li>
                    </ul>

                    <h4>Common Configuration Errors</h4>

                    <strong>Error: "ClassPass Analytics tab not visible"</strong>
                    <ul>
                      <li>Solution: Enable ClassPass Integration in Settings tab, save, refresh page</li>
                    </ul>

                    <strong>Error: "Email campaigns trigger but show wrong data"</strong>
                    <ul>
                      <li>Solution: Check placeholder syntax, ensure template uses correct variables like {`{{userName}}`}</li>
                      <li>Verify user data is complete in database (name, email, etc.)</li>
                    </ul>

                    <strong>Error: "Conversion rate shows 0% despite conversions"</strong>
                    <ul>
                      <li>Solution: Verify "Track ClassPass to member conversions" is enabled in Settings</li>
                      <li>Check that new membership bookings have user with acquisitionSource: "classpass"</li>
                      <li>Ensure conversion occurred within tracking window (default 30 days)</li>
                    </ul>

                    <h4>Getting Additional Help</h4>
                    <p>If issues persist:</p>
                    <ul>
                      <li>Check server logs for error messages</li>
                      <li>Verify database connection and schema</li>
                      <li>Review environment variables for SMTP and API configuration</li>
                      <li>Test with minimal example (single test booking)</li>
                      <li>Contact technical support with specific error messages and steps to reproduce</li>
                    </ul>
                  </div>
                )}

                {/* Quick Reference Section */}
                {activeHelpSection === 'quick-reference' && (
                  <div className="help-section-content">
                    <h3>Quick Reference</h3>

                    <p>Fast access to key information, code examples, and configuration values.</p>

                    <h4>API Booking Fields</h4>
                    <div className="help-code-block">
                      Required Fields:<br/>
                      - userId: String (user _id)<br/>
                      - eventId: String (event/class _id)<br/>
                      - bookingSource: "classpass" | "direct" | "membership" | "referral"<br/>
                      <br/>
                      ClassPass-Specific Optional Fields:<br/>
                      - classPassBookingId: String (CP tracking ID)<br/>
                      - classPassPayout: Number (actual payout amount in dollars)<br/>
                      <br/>
                      Example:<br/>
                      {`POST /api/bookings`}<br/>
                      {`{`}<br/>
                      &nbsp;&nbsp;"userId": "abc123",<br/>
                      &nbsp;&nbsp;"eventId": "xyz789",<br/>
                      &nbsp;&nbsp;"bookingSource": "classpass",<br/>
                      &nbsp;&nbsp;"classPassBookingId": "CP-2024-12345",<br/>
                      &nbsp;&nbsp;"classPassPayout": 23.50,<br/>
                      &nbsp;&nbsp;"paymentStatus": "completed"<br/>
                      {`}`}
                    </div>

                    <h4>Email Template Placeholders</h4>
                    <div className="help-code-block">
                      User Data:<br/>
                      {`{{userName}}`} - Customer's first and last name<br/>
                      <br/>
                      Class Information:<br/>
                      {`{{eventTitle}}`} - Class name/title<br/>
                      {`{{eventDate}}`} - Formatted date<br/>
                      {`{{eventTime}}`} - Class start time<br/>
                      {`{{firstClassDate}}`} - Date of first visit<br/>
                      <br/>
                      Analytics:<br/>
                      {`{{bookingCount}}`} - Total ClassPass bookings<br/>
                      {`{{classPassTotal}}`} - Estimated $ spent via ClassPass<br/>
                      {`{{daysInWindow}}`} - Days left in conversion window<br/>
                      <br/>
                      Studio Contact:<br/>
                      {`{{studioPhone}}`} - Studio phone number<br/>
                      {`{{studioEmail}}`} - Studio email address<br/>
                      {`{{studioWebsite}}`} - Studio website URL
                    </div>

                    <h4>Campaign Timing Reference</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--secondary-background)', borderBottom: '2px solid var(--primary-color)' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Campaign</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Trigger</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Delay</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <td style={{ padding: '0.75rem' }}>First Visit Welcome</td>
                          <td style={{ padding: '0.75rem' }}>1st booking</td>
                          <td style={{ padding: '0.75rem' }}>2 hours</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <td style={{ padding: '0.75rem' }}>Second Visit Nurture</td>
                          <td style={{ padding: '0.75rem' }}>2nd booking</td>
                          <td style={{ padding: '0.75rem' }}>1 day</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <td style={{ padding: '0.75rem' }}>Hot Lead Conversion</td>
                          <td style={{ padding: '0.75rem' }}>3rd+ booking</td>
                          <td style={{ padding: '0.75rem' }}>12 hours</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.75rem' }}>Hot Lead Reminder</td>
                          <td style={{ padding: '0.75rem' }}>3rd+ booking</td>
                          <td style={{ padding: '0.75rem' }}>4 days</td>
                        </tr>
                      </tbody>
                    </table>

                    <h4>Settings Configuration Checklist</h4>
                    <div className="help-checklist">
                      <li>ClassPass Integration enabled</li>
                      <li>Auto-tag users: ON (recommended)</li>
                      <li>Track conversions: ON (recommended)</li>
                      <li>Conversion window: 30 days (adjustable 1-180)</li>
                      <li>Default payout rate: $18-30 (match your agreement)</li>
                      <li>Studio contact info complete (phone, email, website)</li>
                      <li>SMTP email service configured</li>
                    </div>

                    <h4>Membership Tiers & Credits</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--secondary-background)', borderBottom: '2px solid var(--primary-color)' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Tier</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Classes/Month</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <td style={{ padding: '0.75rem' }}>Fever Starter</td>
                          <td style={{ padding: '0.75rem' }}>4 credits</td>
                          <td style={{ padding: '0.75rem' }}>$99/month</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <td style={{ padding: '0.75rem' }}>Outbreak</td>
                          <td style={{ padding: '0.75rem' }}>8 credits</td>
                          <td style={{ padding: '0.75rem' }}>$159/month</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.75rem' }}>Epidemic</td>
                          <td style={{ padding: '0.75rem' }}>Unlimited</td>
                          <td style={{ padding: '0.75rem' }}>$199/month</td>
                        </tr>
                      </tbody>
                    </table>

                    <h4>Benchmark Metrics</h4>
                    <div className="help-code-block">
                      Target Performance Indicators:<br/>
                      <br/>
                      Conversion Rate: 15%+ (Converted / Unique Customers)<br/>
                      Second Visit Rate: 40%+ (2+ bookings / Total unique)<br/>
                      Hot Lead Conversion: 25%+ (Converted / Hot leads)<br/>
                      Email Open Rate: 25-35%<br/>
                      Email Click Rate: 15-25%<br/>
                      Average Bookings per User: 2.5+<br/>
                      Time to Conversion: &lt;21 days (median)
                    </div>

                    <h4>Database Collections</h4>
                    <div className="help-code-block">
                      Relevant Collections:<br/>
                      <br/>
                      - users: User accounts and ClassPass tracking fields<br/>
                      - bookings: All class bookings with source tracking<br/>
                      - events: Classes/events available for booking<br/>
                      - memberships: Membership subscriptions and credits<br/>
                      - automated_campaigns: Email campaign definitions<br/>
                      - automated_email_logs: Individual email send records<br/>
                      - settings: Global configuration including ClassPass settings
                    </div>

                    <h4>Useful Admin Shortcuts</h4>
                    <ul>
                      <li><strong>View hot leads:</strong> ClassPass Analytics → Hot Leads section</li>
                      <li><strong>Check email status:</strong> Email Automation → Select campaign → View logs</li>
                      <li><strong>Manual check-in:</strong> Bookings tab → Find booking → Check-in button</li>
                      <li><strong>Adjust member credits:</strong> Memberships tab → Edit member → Credits field</li>
                      <li><strong>Test campaign:</strong> Create ClassPass booking with your email, wait for delay</li>
                    </ul>

                    <h4>Support Resources</h4>
                    <ul>
                      <li>Server logs: Check for error messages and API failures</li>
                      <li>Browser console: View client-side errors and network requests</li>
                      <li>Database queries: Direct inspection of collections for troubleshooting</li>
                      <li>Environment variables: Verify SMTP, API keys, and configuration</li>
                    </ul>
                  </div>
                )}

                {/* SMS Notifications Section */}
                {activeHelpSection === 'sms-setup' && (
                  <div className="help-section-content">
                    <h3>SMS Notifications Setup & Management</h3>

                    <p>
                      Send text message notifications to your members for bookings, reminders, and important updates.
                      Powered by Twilio SMS service with full opt-out compliance.
                    </p>

                    <h4>What is SMS Notifications?</h4>
                    <p>
                      SMS notifications allow you to communicate with members via text messages for time-sensitive updates
                      like booking confirmations, class reminders, payment confirmations, and promotional offers. All SMS
                      features comply with SMS marketing regulations and include automatic opt-out handling.
                    </p>

                    <h4>Setup Requirements</h4>
                    <p>Before you can send SMS messages, you'll need:</p>
                    <ul>
                      <li><strong>Twilio Account:</strong> Sign up at twilio.com (free trial available)</li>
                      <li><strong>Phone Number:</strong> Purchase a Twilio phone number ($1.15/month)</li>
                      <li><strong>Account Credentials:</strong> Account SID and Auth Token from Twilio</li>
                      <li><strong>Vercel Configuration:</strong> Add environment variables to Vercel</li>
                    </ul>

                    <h4>Configuration Steps</h4>

                    <div className="help-expandable" style={{ marginBottom: '1.5rem' }}>
                      <strong>Step 1: Create Twilio Account</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #c9a86a' }}>
                        <ol>
                          <li>Go to <a href="https://twilio.com" target="_blank" rel="noopener noreferrer" style={{ color: '#007aff' }}>twilio.com</a></li>
                          <li>Sign up for a free account (includes $15 trial credit)</li>
                          <li>Verify your email and phone number</li>
                          <li>Complete the account setup wizard</li>
                        </ol>
                      </div>
                    </div>

                    <div className="help-expandable" style={{ marginBottom: '1.5rem' }}>
                      <strong>Step 2: Get Phone Number</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #c9a86a' }}>
                        <ol>
                          <li>In Twilio Console, go to Phone Numbers → Buy a number</li>
                          <li>Choose a US number with SMS capabilities ($1.15/month)</li>
                          <li>Verify your caller ID if required</li>
                          <li>Note the phone number (format: +1234567890)</li>
                        </ol>
                      </div>
                    </div>

                    <div className="help-expandable" style={{ marginBottom: '1.5rem' }}>
                      <strong>Step 3: Get API Credentials</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #c9a86a' }}>
                        <p>In Twilio Console dashboard, you'll find:</p>
                        <div className="help-code-block" style={{ marginTop: '0.5rem' }}>
                          Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx<br/>
                          Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                        </div>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#ff453a' }}>
                          ⚠️ Keep these credentials secure - never commit to GitHub or share publicly
                        </p>
                      </div>
                    </div>

                    <div className="help-expandable" style={{ marginBottom: '1.5rem' }}>
                      <strong>Step 4: Configure Vercel Environment Variables</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #c9a86a' }}>
                        <ol>
                          <li>Go to your Vercel Dashboard</li>
                          <li>Select your fever-collective project</li>
                          <li>Navigate to Settings → Environment Variables</li>
                          <li>Add these three variables:</li>
                        </ol>
                        <div className="help-code-block" style={{ marginTop: '0.5rem' }}>
                          TWILIO_ACCOUNT_SID = Your Account SID<br/>
                          TWILIO_AUTH_TOKEN = Your Auth Token<br/>
                          TWILIO_PHONE_NUMBER = Your phone number (e.g., +14088055814)
                        </div>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                          Set for: Production, Preview, and Development environments
                        </p>
                        <ol start="5">
                          <li>Save and redeploy your application</li>
                        </ol>
                      </div>
                    </div>

                    <div className="help-expandable" style={{ marginBottom: '1.5rem' }}>
                      <strong>Step 5: Configure Webhook (Optional - for opt-out automation)</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #c9a86a' }}>
                        <p>To enable automatic STOP/START handling:</p>
                        <ol>
                          <li>In Twilio Console, go to Phone Numbers → Manage → Active numbers</li>
                          <li>Select your phone number</li>
                          <li>Scroll to "Messaging" section</li>
                          <li>For "A MESSAGE COMES IN", configure webhook:</li>
                        </ol>
                        <div className="help-code-block" style={{ marginTop: '0.5rem' }}>
                          URL: https://fever-collective.vercel.app/api/sms/webhook/incoming<br/>
                          Method: POST
                        </div>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                          This enables users to text STOP to unsubscribe and START to re-subscribe
                        </p>
                      </div>
                    </div>

                    <h4>Admin Dashboard Features</h4>

                    <div className="help-code-block">
                      Settings Tab → SMS Configuration:<br/>
                      <br/>
                      ✅ Twilio connection status indicator<br/>
                      ✅ Master enable/disable toggle<br/>
                      ✅ Individual notification type toggles:<br/>
                      &nbsp;&nbsp;&nbsp;- Booking confirmations<br/>
                      &nbsp;&nbsp;&nbsp;- Payment confirmations<br/>
                      &nbsp;&nbsp;&nbsp;- Class reminders (24h before)<br/>
                      &nbsp;&nbsp;&nbsp;- Waitlist notifications<br/>
                      &nbsp;&nbsp;&nbsp;- Membership confirmations<br/>
                      &nbsp;&nbsp;&nbsp;- Low credits warnings<br/>
                      &nbsp;&nbsp;&nbsp;- Promotional SMS<br/>
                      ✅ Daily SMS limit (cost control)<br/>
                      ✅ Real-time statistics dashboard<br/>
                      ✅ Test SMS tool<br/>
                      <br/>
                      Email Automation Tab → SMS Toggle:<br/>
                      ✅ Add SMS to automated email campaigns<br/>
                      ✅ 160 character SMS composer<br/>
                      ✅ Template variables support<br/>
                      ✅ Character counter
                    </div>

                    <h4>SMS Template Variables</h4>
                    <p>Use these placeholders in your SMS messages:</p>
                    <div className="help-code-block">
                      {`{{name}}`} - User's full name<br/>
                      {`{{firstName}}`} - User's first name<br/>
                      {`{{eventTitle}}`} - Class title<br/>
                      {`{{eventDate}}`} - Class date (formatted)<br/>
                      {`{{eventTime}}`} - Class time<br/>
                      {`{{eventLocation}}`} - Studio location<br/>
                      {`{{confirmationNumber}}`} - Booking confirmation #<br/>
                      {`{{spots}}`} - Number of spots booked<br/>
                      {`{{totalAmount}}`} - Total payment amount<br/>
                      {`{{membershipTier}}`} - Member's tier name<br/>
                      {`{{creditsRemaining}}`} - Available credits<br/>
                      {`{{studioName}}`} - The Fever Studio<br/>
                      {`{{studioPhone}}`} - (408) 805-5814
                    </div>

                    <h4>User SMS Preferences</h4>
                    <p>Members can manage their SMS preferences in their Profile:</p>
                    <ul>
                      <li><strong>Master Toggle:</strong> Enable/disable all SMS notifications</li>
                      <li><strong>Booking Confirmations:</strong> Text confirmations for bookings and payments</li>
                      <li><strong>Class Reminders:</strong> 24-hour reminders before classes</li>
                      <li><strong>Promotional:</strong> Marketing and special offer messages (opt-in required)</li>
                    </ul>

                    <h4>Opt-Out Compliance</h4>
                    <p>Automatic handling of SMS regulations:</p>
                    <ul>
                      <li><strong>STOP Keyword:</strong> Users can text STOP to unsubscribe instantly</li>
                      <li><strong>START Keyword:</strong> Users can text START to re-subscribe</li>
                      <li><strong>HELP Keyword:</strong> Provides contact information</li>
                      <li><strong>Opt-In Required:</strong> Users must check SMS opt-in during booking</li>
                      <li><strong>Clear Instructions:</strong> Profile shows "Reply STOP to unsubscribe"</li>
                    </ul>

                    <h4>SMS Scheduler</h4>
                    <p>Automated SMS processing for campaigns:</p>
                    <ul>
                      <li>Runs every 5 minutes to process pending SMS</li>
                      <li>Respects user opt-out preferences</li>
                      <li>Enforces daily sending limits</li>
                      <li>Tracks delivery status (sent, failed, skipped)</li>
                      <li>1-second delay between sends to avoid rate limiting</li>
                    </ul>

                    <h4>Cost Management</h4>
                    <div className="help-code-block">
                      Twilio Pricing (US):<br/>
                      - SMS (outbound): $0.0075 per message<br/>
                      - Phone number: $1.15/month<br/>
                      <br/>
                      Monthly Cost Examples:<br/>
                      100 SMS = $0.75 + $1.15 = $1.90/month<br/>
                      500 SMS = $3.75 + $1.15 = $4.90/month<br/>
                      1000 SMS = $7.50 + $1.15 = $8.65/month<br/>
                      <br/>
                      Cost Control Features:<br/>
                      ✅ Daily limit setting (default: 1000)<br/>
                      ✅ Real-time cost tracking<br/>
                      ✅ Statistics dashboard<br/>
                      ✅ Failed message monitoring
                    </div>

                    <h4>Testing SMS</h4>
                    <div className="help-checklist">
                      <li>Go to Settings tab → SMS Configuration</li>
                      <li>Verify Twilio shows "✅ Connected"</li>
                      <li>Enter your phone number in Test SMS section</li>
                      <li>Type a test message (e.g., "Test from The Fever Studio")</li>
                      <li>Click "Send Test SMS"</li>
                      <li>Check your phone for the message</li>
                      <li>Reply STOP to test opt-out (then START to re-enable)</li>
                    </div>

                    <h4>Troubleshooting</h4>

                    <div className="help-expandable">
                      <strong>❌ Twilio Not Configured</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #ff453a' }}>
                        <p><strong>Symptom:</strong> Red "❌ Twilio Not Configured" message in Settings</p>
                        <p><strong>Solution:</strong></p>
                        <ol>
                          <li>Check Vercel environment variables are set correctly</li>
                          <li>Verify no extra spaces in variable values</li>
                          <li>Phone number must include + sign (e.g., +14088055814)</li>
                          <li>Redeploy application after adding variables</li>
                        </ol>
                      </div>
                    </div>

                    <div className="help-expandable">
                      <strong>SMS Not Sending</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #ffd60a' }}>
                        <p><strong>Possible Causes:</strong></p>
                        <ul>
                          <li>SMS globally disabled in Settings</li>
                          <li>Daily limit reached</li>
                          <li>Invalid phone number format</li>
                          <li>User opted out</li>
                          <li>Twilio account balance depleted</li>
                        </ul>
                        <p><strong>Check:</strong></p>
                        <ul>
                          <li>Settings → SMS Config → Enabled = ON</li>
                          <li>Statistics → Today Sent &lt; Daily Limit</li>
                          <li>Phone number format: +1XXXXXXXXXX</li>
                          <li>User Profile → SMS Preferences → Enabled</li>
                          <li>Twilio Console → Account balance</li>
                        </ul>
                      </div>
                    </div>

                    <div className="help-expandable">
                      <strong>High Failure Rate</strong>
                      <div style={{ marginTop: '0.75rem', paddingLeft: '1rem', borderLeft: '3px solid #ff453a' }}>
                        <p><strong>Common Issues:</strong></p>
                        <ul>
                          <li>Invalid phone numbers in database</li>
                          <li>Landline numbers (SMS not supported)</li>
                          <li>Carrier blocking (spam detection)</li>
                        </ul>
                        <p><strong>Solutions:</strong></p>
                        <ul>
                          <li>Validate phone numbers during registration</li>
                          <li>Use formatPhoneNumber() utility in backend</li>
                          <li>Register brand with Twilio for better deliverability</li>
                          <li>Avoid spam trigger words in messages</li>
                        </ul>
                      </div>
                    </div>

                    <h4>Best Practices</h4>
                    <ul>
                      <li><strong>Keep Messages Short:</strong> Under 160 characters to avoid multi-part SMS</li>
                      <li><strong>Include Studio Name:</strong> Always identify "The Fever Studio"</li>
                      <li><strong>Clear Call-to-Action:</strong> Tell them what to do next</li>
                      <li><strong>Timing Matters:</strong> Don't send late at night (after 9 PM)</li>
                      <li><strong>Personalize:</strong> Use {`{{name}}`} or {`{{firstName}}`} variables</li>
                      <li><strong>Monitor Stats:</strong> Check delivery rates weekly</li>
                      <li><strong>Respect Opt-Outs:</strong> Never manually re-enable for opted-out users</li>
                      <li><strong>Test Before Bulk:</strong> Always test with your phone first</li>
                    </ul>

                    <h4>Compliance Checklist</h4>
                    <div className="help-checklist">
                      <li>✅ Opt-in checkbox in booking flow</li>
                      <li>✅ STOP keyword automatically disables SMS</li>
                      <li>✅ START keyword re-enables SMS</li>
                      <li>✅ Opt-out instructions in user profile</li>
                      <li>✅ Sender identification in messages</li>
                      <li>✅ User preferences stored and respected</li>
                      <li>✅ Webhook configured for automatic opt-out</li>
                      <li>✅ Daily limits prevent abuse</li>
                    </div>

                    <h4>Quick Reference</h4>
                    <div className="help-code-block">
                      SMS Routes:<br/>
                      - Test SMS: POST /api/sms/test<br/>
                      - Get Stats: GET /api/sms/stats<br/>
                      - Config Status: GET /api/sms/config-status<br/>
                      - Bulk SMS: POST /api/sms/bulk<br/>
                      - Webhook: POST /api/sms/webhook/incoming<br/>
                      <br/>
                      Twilio Limits:<br/>
                      - Default: 1 message/second<br/>
                      - Trial: Can only send to verified numbers<br/>
                      - Production: Unlimited after verification<br/>
                      <br/>
                      Character Limits:<br/>
                      - Single SMS: 160 characters<br/>
                      - Multi-part: 153 chars per segment<br/>
                      - Recommended: Keep under 160 chars<br/>
                      <br/>
                      Support:<br/>
                      - Twilio Docs: twilio.com/docs/sms<br/>
                      - SMS Guide: SMS_IMPLEMENTATION_GUIDE.md<br/>
                      - Help: Contact support@thefeverstudio.com
                    </div>
                  </div>
                )}
              </div>
            </div>
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
