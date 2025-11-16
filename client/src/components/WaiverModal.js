import React, { useState, useRef, useEffect } from 'react';
import api from '../config/api';
import './WaiverModal.css';

function WaiverModal({ isOpen, onClose, onComplete, eventId, waiverType = 'general' }) {
  const [waiverText, setWaiverText] = useState('');
  const [fullName, setFullName] = useState('');
  const [signature, setSignature] = useState('');
  const [signatureType, setSignatureType] = useState('typed');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWaiverTemplate();
      // Pre-fill name from localStorage user
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.name) {
        setFullName(user.name);
      }
    }
  }, [isOpen, waiverType]);

  const fetchWaiverTemplate = async () => {
    try {
      const response = await api.get(`/api/waivers/template/${waiverType}`);
      setWaiverText(response.data.waiverText);
    } catch (error) {
      console.error('Error fetching waiver:', error);
      setError('Failed to load waiver. Please try again.');
    }
  };

  // Canvas drawing functions
  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      setSignature(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!agreedToTerms) {
      setError('You must agree to the terms to continue');
      return;
    }

    if (!fullName) {
      setError('Please enter your full name');
      return;
    }

    if (signatureType === 'drawn' && !signature) {
      setError('Please provide a signature');
      return;
    }

    if (isMinor && (!guardianName || !dateOfBirth)) {
      setError('Guardian information is required for minors');
      return;
    }

    setLoading(true);

    try {
      const waiverData = {
        waiverType,
        waiverText,
        signature: signatureType === 'drawn' ? signature : fullName,
        signatureType,
        fullName,
        agreedToTerms,
        eventId
      };

      if (isMinor) {
        waiverData.isMinor = true;
        waiverData.dateOfBirth = dateOfBirth;
        waiverData.guardianName = guardianName;
        waiverData.guardianRelationship = guardianRelationship;
      }

      await api.post('/api/waivers/sign', waiverData);

      alert('Waiver signed successfully!');
      if (onComplete) onComplete();
      onClose();
    } catch (error) {
      console.error('Error signing waiver:', error);
      setError(error.response?.data?.error || 'Failed to sign waiver. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="waiver-modal-overlay">
      <div className="waiver-modal">
        <div className="waiver-modal-header">
          <h2>Liability Waiver</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>

        <div className="waiver-modal-content">
          <div className="waiver-text">
            <pre>{waiverText}</pre>
          </div>

          <form onSubmit={handleSubmit} className="waiver-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={isMinor}
                  onChange={(e) => setIsMinor(e.target.checked)}
                />
                I am signing for a minor (under 18)
              </label>
            </div>

            {isMinor && (
              <>
                <div className="form-group">
                  <label>Minor's Date of Birth *</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Parent/Guardian Full Name *</label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Parent or Guardian Name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Relationship to Minor</label>
                  <select
                    value={guardianRelationship}
                    onChange={(e) => setGuardianRelationship(e.target.value)}
                  >
                    <option value="">Select...</option>
                    <option value="parent">Parent</option>
                    <option value="legal-guardian">Legal Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label>Full Name * {isMinor && '(Minor\'s Name)'}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full legal name"
                required
              />
            </div>

            <div className="form-group">
              <label>Signature Method</label>
              <div className="signature-type-selector">
                <label>
                  <input
                    type="radio"
                    value="typed"
                    checked={signatureType === 'typed'}
                    onChange={(e) => setSignatureType(e.target.value)}
                  />
                  Type Name
                </label>
                <label>
                  <input
                    type="radio"
                    value="drawn"
                    checked={signatureType === 'drawn'}
                    onChange={(e) => setSignatureType(e.target.value)}
                  />
                  Draw Signature
                </label>
              </div>
            </div>

            {signatureType === 'drawn' && (
              <div className="form-group">
                <label>Draw Your Signature *</label>
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={150}
                  className="signature-canvas"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="clear-signature-btn"
                >
                  Clear Signature
                </button>
              </div>
            )}

            {signatureType === 'typed' && (
              <div className="typed-signature">
                <p>Your signature: <span className="signature-display">{fullName}</span></p>
              </div>
            )}

            <div className="form-group">
              <label className="agreement-checkbox">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  required
                />
                <span>
                  I have read and understood this waiver, and I voluntarily agree to its terms and conditions.
                  I understand that by signing this document, I am giving up substantial legal rights.
                </span>
              </label>
            </div>

            <div className="waiver-actions">
              <button type="button" onClick={onClose} className="cancel-btn">
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading || !agreedToTerms}
              >
                {loading ? 'Signing...' : 'Sign Waiver'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default WaiverModal;
