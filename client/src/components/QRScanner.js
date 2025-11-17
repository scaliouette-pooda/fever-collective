import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../config/api';
import './QRScanner.css';

function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const scannerRef = useRef(null);
  const html5QrCodeScannerRef = useRef(null);

  useEffect(() => {
    fetchUpcomingEvents();
    return () => {
      if (html5QrCodeScannerRef.current) {
        html5QrCodeScannerRef.current.clear().catch(err => console.error('Error clearing scanner:', err));
      }
    };
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const response = await api.get('/api/events');
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Filter events for today and future
      const upcoming = response.data.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today;
      }).slice(0, 10); // Show next 10 events

      setEvents(upcoming);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    }
  };

  const startScanner = () => {
    if (!selectedEvent) {
      setError('Please select an event first');
      return;
    }

    setScanning(true);
    setError('');
    setScanResult(null);

    setTimeout(() => {
      if (scannerRef.current) {
        html5QrCodeScannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        html5QrCodeScannerRef.current.render(onScanSuccess, onScanError);
      }
    }, 100);
  };

  const stopScanner = () => {
    if (html5QrCodeScannerRef.current) {
      html5QrCodeScannerRef.current.clear().catch(err => console.error('Error clearing scanner:', err));
      html5QrCodeScannerRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText) => {
    console.log('QR Code scanned:', decodedText);

    try {
      // Stop scanner immediately after successful scan
      stopScanner();

      setLoading(true);
      setError('');

      // Parse the QR code data
      const qrData = JSON.parse(decodedText);
      console.log('Parsed QR data:', qrData);

      // Send check-in request
      const response = await api.post('/api/bookings/check-in', {
        userId: qrData.userId,
        eventId: selectedEvent,
        membershipNumber: qrData.membershipNumber
      });

      setScanResult({
        success: true,
        member: qrData.name,
        membershipNumber: qrData.membershipNumber,
        event: events.find(e => e._id === selectedEvent)?.title,
        creditsRemaining: response.data.creditsRemaining,
        message: response.data.message
      });

      // Add to recent check-ins
      setRecentCheckIns(prev => [{
        name: qrData.name,
        time: new Date().toLocaleTimeString(),
        membershipNumber: qrData.membershipNumber
      }, ...prev.slice(0, 9)]); // Keep last 10

    } catch (err) {
      console.error('Check-in error:', err);
      setError(err.response?.data?.message || 'Check-in failed. Please try again.');
      setScanResult({
        success: false,
        message: err.response?.data?.message || 'Check-in failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const onScanError = (err) => {
    // Ignore scan errors (they happen constantly while scanning)
    // console.warn('QR scan error:', err);
  };

  const resetScanner = () => {
    setScanResult(null);
    setError('');
    startScanner();
  };

  return (
    <div className="qr-scanner-container">
      <div className="scanner-header">
        <h2>QR Check-In Scanner</h2>
        <p>Scan member QR codes to check them into classes</p>
      </div>

      {/* Event Selection */}
      <div className="event-selection">
        <label>Select Event/Class *</label>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          disabled={scanning}
        >
          <option value="">Choose an event...</option>
          {events.map(event => (
            <option key={event._id} value={event._id}>
              {new Date(event.date).toLocaleDateString()} - {event.time} - {event.title}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="scanner-alert scanner-alert-error">
          {error}
        </div>
      )}

      {/* Scanner Section */}
      {!scanning && !scanResult && (
        <div className="scanner-start">
          <button
            onClick={startScanner}
            className="btn-start-scan"
            disabled={!selectedEvent}
          >
            Start Scanning
          </button>
        </div>
      )}

      {scanning && (
        <div className="scanner-active">
          <div id="qr-reader" ref={scannerRef}></div>
          <button onClick={stopScanner} className="btn-stop-scan">
            Stop Scanning
          </button>
          {loading && <div className="scanner-loading">Processing check-in...</div>}
        </div>
      )}

      {/* Scan Result */}
      {scanResult && (
        <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
          <div className="result-icon">
            {scanResult.success ? '✓' : '✗'}
          </div>
          <h3>{scanResult.success ? 'Check-In Successful!' : 'Check-In Failed'}</h3>

          {scanResult.success ? (
            <div className="result-details">
              <p><strong>Member:</strong> {scanResult.member}</p>
              <p><strong>Membership #:</strong> {scanResult.membershipNumber}</p>
              <p><strong>Event:</strong> {scanResult.event}</p>
              {scanResult.creditsRemaining !== undefined && (
                <p><strong>Credits Remaining:</strong> {scanResult.creditsRemaining}</p>
              )}
              <p className="result-message">{scanResult.message}</p>
            </div>
          ) : (
            <div className="result-details">
              <p className="result-message">{scanResult.message}</p>
            </div>
          )}

          <div className="result-actions">
            <button onClick={resetScanner} className="btn-scan-next">
              Scan Next Member
            </button>
            <button onClick={() => { setScanResult(null); setError(''); }} className="btn-done">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Recent Check-Ins */}
      {recentCheckIns.length > 0 && (
        <div className="recent-checkins">
          <h3>Recent Check-Ins</h3>
          <div className="checkins-list">
            {recentCheckIns.map((checkIn, index) => (
              <div key={index} className="checkin-item">
                <span className="checkin-name">{checkIn.name}</span>
                <span className="checkin-time">{checkIn.time}</span>
                <span className="checkin-number">{checkIn.membershipNumber}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default QRScanner;
