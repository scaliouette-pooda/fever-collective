import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import QRCode from 'qrcode';
import './Auth.css';

function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    userId: ''
  });
  const qrCodeRef = useRef(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [showReferralCopied, setShowReferralCopied] = useState(false);
  const [membershipData, setMembershipData] = useState(null);
  const [milestones] = useState([
    { classes: 50, reward: 'Sweat Towel' },
    { classes: 100, reward: 'Tote Bag' },
    { classes: 150, reward: 'Water Bottle' },
    { classes: 200, reward: 'Hat' },
    { classes: 250, reward: 'Hoodie' }
  ]);

  useEffect(() => {
    fetchProfile();
    fetchReferralData();
    fetchMembershipData();
  }, []);

  // Generate QR Code when profile and membership data are loaded
  useEffect(() => {
    const generateQRCode = async () => {
      if (qrCodeRef.current && profileData.userId && membershipData) {
        try {
          const qrData = JSON.stringify({
            userId: profileData.userId,
            membershipNumber: membershipData.membershipNumber,
            name: profileData.name,
            membershipTier: membershipData.membershipTier?.name || membershipData.membershipTier
          });

          await QRCode.toCanvas(qrCodeRef.current, qrData, {
            width: 250,
            margin: 2,
            color: {
              dark: '#1a1a1a',
              light: '#ffffff'
            }
          });
        } catch (err) {
          console.error('Error generating QR code:', err);
        }
      }
    };

    generateQRCode();
  }, [profileData.userId, membershipData]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await api.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfileData({
        name: response.data.name,
        email: response.data.email,
        phone: response.data.phone,
        userId: response.data._id,
        referralTier: response.data.referralTier || 'starter',
        referralCount: response.data.referralCount || 0,
        totalReferralEarnings: response.data.totalReferralEarnings || 0
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get('/api/referrals/my-code', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReferralData(response.data);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    }
  };

  const fetchMembershipData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get('/api/memberships/my-membership', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.hasMembership) {
        setMembershipData(response.data.membership);
      }
    } catch (error) {
      console.error('Error fetching membership data:', error);
    }
  };

  const handleCopyReferralLink = () => {
    if (referralData?.referralUrl) {
      navigator.clipboard.writeText(referralData.referralUrl);
      setShowReferralCopied(true);
      setTimeout(() => setShowReferralCopied(false), 2000);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await api.patch('/api/auth/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update localStorage with new user data
      localStorage.setItem('user', JSON.stringify(response.data.user));

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await api.patch('/api/auth/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
    } catch (error) {
      console.error('Error changing password:', error);
      alert(error.response?.data?.error || 'Failed to change password');
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '600px' }}>
        <div className="auth-header">
          <h1>My Profile</h1>
          <p>Manage your account information</p>
        </div>

        {/* Profile Information Form */}
        <form onSubmit={handleProfileSubmit} className="auth-form">
          <h3 style={{ marginBottom: '20px' }}>Personal Information</h3>

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleProfileChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={profileData.phone}
              onChange={handleProfileChange}
              required
            />
          </div>

          <button type="submit" className="auth-submit">
            Update Profile
          </button>
        </form>

        {/* Password Change Section */}
        <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#e8e8e8',
                cursor: 'pointer'
              }}
            >
              Change Password
            </button>
          ) : (
            <>
              <h3 style={{ marginBottom: '20px' }}>Change Password</h3>
              <form onSubmit={handlePasswordSubmit} className="auth-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    minLength="6"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    minLength="6"
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="auth-submit">
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    style={{
                      flex: 1,
                      padding: '1rem',
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: '#e8e8e8',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Referral Section */}
        {referralData && (
          <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 style={{ marginBottom: '20px', color: '#c9a86a' }}>Your Referral Program</h3>

            {/* Referral Tier Badge */}
            <div style={{
              background: profileData.referralTier === 'elite' ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' :
                         profileData.referralTier === 'ambassador' ? 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)' :
                         'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
              padding: '15px 25px',
              textAlign: 'center',
              marginBottom: '20px',
              position: 'relative'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#1a1a1a', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '5px' }}>
                Your Tier
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {profileData.referralTier === 'elite' ? '⭐ ELITE' :
                 profileData.referralTier === 'ambassador' ? '🎖️ AMBASSADOR' :
                 '🌟 STARTER'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#1a1a1a', marginTop: '5px' }}>
                ${profileData.referralTier === 'elite' ? '20' :
                   profileData.referralTier === 'ambassador' ? '15' : '10'} per referral
              </div>
            </div>

            <div style={{
              background: 'rgba(201, 168, 106, 0.1)',
              border: '1px solid rgba(201, 168, 106, 0.3)',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <p style={{ marginBottom: '15px', fontSize: '0.9rem', color: 'rgba(232, 232, 232, 0.8)' }}>
                Share your referral link and earn rewards! New users get 10% off their first booking.
              </p>

              <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                <strong>Tier Benefits:</strong><br/>
                • Starter (1-3 refs): $10 per referral<br/>
                • Ambassador (4-9 refs): $15 per referral + badge<br/>
                • Elite (10+ refs): $20 per referral + exclusive perks
              </div>

              <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Your Referral Code
                </label>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  backgroundColor: 'rgba(26, 26, 26, 0.6)',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <input
                    type="text"
                    value={referralData.referralCode}
                    readOnly
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#c9a86a',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      letterSpacing: '2px'
                    }}
                  />
                  <button
                    onClick={handleCopyReferralLink}
                    style={{
                      padding: '8px 20px',
                      backgroundColor: '#c9a86a',
                      color: '#1a1a1a',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: '600'
                    }}
                  >
                    {showReferralCopied ? '✓ Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
              marginTop: '20px'
            }}>
              <div style={{
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', color: '#c9a86a', fontWeight: '300' }}>
                  {referralData.referralCount}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(232, 232, 232, 0.6)', marginTop: '5px' }}>
                  Referrals
                </div>
              </div>

              <div style={{
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', color: '#c9a86a', fontWeight: '300' }}>
                  ${referralData.referralCredits}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(232, 232, 232, 0.6)', marginTop: '5px' }}>
                  Credits Earned
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Membership Section */}
        {membershipData && (
          <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 style={{ marginBottom: '20px', color: '#c9a86a' }}>Your Membership</h3>

            {/* Membership Overview Card */}
            <div style={{
              background: 'linear-gradient(135deg, #c9a86a 0%, #b8965a 100%)',
              padding: '25px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', color: '#1a1a1a' }}>
                    {membershipData.membershipTier?.displayName}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#1a1a1a', opacity: 0.8 }}>
                    Monthly Payment: ${membershipData.monthlyPrice || membershipData.membershipTier?.price}
                  </p>
                </div>
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: membershipData.status === 'active' ? 'rgba(76, 175, 80, 0.9)' :
                                  membershipData.status === 'pending-payment' ? 'rgba(255, 152, 0, 0.9)' :
                                  'rgba(158, 158, 158, 0.9)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderRadius: '12px'
                }}>
                  {membershipData.status}
                </span>
              </div>

              {membershipData.membershipTier?.isUnlimited ? (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '15px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.8rem', color: '#1a1a1a', fontWeight: '700', marginBottom: '5px' }}>
                    ∞ UNLIMITED
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#1a1a1a' }}>
                    Book as many classes as you want!
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '15px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.5rem', color: '#1a1a1a', fontWeight: '700', marginBottom: '5px' }}>
                    {membershipData.creditsRemaining}
                    <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>
                      /{membershipData.creditsTotal}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#1a1a1a' }}>
                    Available Credits
                  </div>
                </div>
              )}
            </div>

            {/* Billing Information */}
            <div style={{
              background: 'rgba(201, 168, 106, 0.1)',
              border: '1px solid rgba(201, 168, 106, 0.3)',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#c9a86a' }}>Billing Information</h4>
              <div style={{ display: 'grid', gap: '10px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(232, 232, 232, 0.7)' }}>Start Date:</span>
                  <strong style={{ color: '#e8e8e8' }}>
                    {new Date(membershipData.startDate).toLocaleDateString()}
                  </strong>
                </div>
                {membershipData.nextBillingDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(232, 232, 232, 0.7)' }}>Next Billing:</span>
                    <strong style={{ color: '#e8e8e8' }}>
                      {new Date(membershipData.nextBillingDate).toLocaleDateString()}
                    </strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(232, 232, 232, 0.7)' }}>Payment Method:</span>
                  <strong style={{ color: '#e8e8e8', textTransform: 'capitalize' }}>
                    {membershipData.paymentMethod || 'Manual'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Milestone Progress */}
            <div style={{
              background: 'rgba(201, 168, 106, 0.1)',
              border: '1px solid rgba(201, 168, 106, 0.3)',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#c9a86a' }}>
                Milestone Rewards - {membershipData.classesAttended || 0} Classes Attended
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {milestones.map((milestone, index) => {
                  const isAchieved = (membershipData.classesAttended || 0) >= milestone.classes;
                  const isNext = !isAchieved && (index === 0 || (membershipData.classesAttended || 0) >= milestones[index - 1].classes);
                  const progress = Math.min(100, ((membershipData.classesAttended || 0) / milestone.classes) * 100);

                  return (
                    <div key={milestone.classes} style={{ position: 'relative' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '6px'
                      }}>
                        <span style={{
                          fontSize: '0.85rem',
                          color: isAchieved ? '#4caf50' : isNext ? '#c9a86a' : 'rgba(232, 232, 232, 0.5)',
                          fontWeight: isNext ? '700' : '400'
                        }}>
                          {isAchieved && '✓ '}
                          {milestone.classes} classes - {milestone.reward}
                          {isNext && ' (Next Reward!)'}
                        </span>
                        {isNext && (
                          <span style={{ fontSize: '0.75rem', color: '#c9a86a' }}>
                            {milestone.classes - (membershipData.classesAttended || 0)} to go
                          </span>
                        )}
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: isAchieved ? '#4caf50' : 'linear-gradient(90deg, #c9a86a, #b8965a)',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Membership Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => navigate('/memberships')}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#e8e8e8',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                Upgrade Membership
              </button>
              <button
                onClick={() => navigate('/events')}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#c9a86a',
                  border: 'none',
                  color: '#1a1a1a',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                Book a Class
              </button>
            </div>

            {/* QR Code Section */}
            <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h4 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#c9a86a', textAlign: 'center' }}>
                Your Check-In QR Code
              </h4>
              <div style={{
                background: 'rgba(201, 168, 106, 0.1)',
                border: '1px solid rgba(201, 168, 106, 0.3)',
                padding: '20px',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '0.9rem', color: 'rgba(232, 232, 232, 0.7)', marginBottom: '20px' }}>
                  Show this QR code when checking in to classes
                </p>
                <div style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  display: 'inline-block'
                }}>
                  <canvas ref={qrCodeRef} />
                </div>
                <div style={{ marginTop: '15px', fontSize: '0.85rem', color: 'rgba(232, 232, 232, 0.6)' }}>
                  <p style={{ margin: '5px 0' }}>
                    <strong style={{ color: '#c9a86a' }}>Membership #:</strong> {membershipData.membershipNumber || 'N/A'}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '0.75rem' }}>
                    For assistance, contact staff
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Membership CTA */}
        {!membershipData && !loading && (
          <div style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 style={{ marginBottom: '20px', color: '#c9a86a' }}>Join Our Community</h3>
            <div style={{
              background: 'rgba(201, 168, 106, 0.1)',
              border: '1px solid rgba(201, 168, 106, 0.3)',
              padding: '30px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1.3rem', color: '#e8e8e8' }}>
                Become a Member
              </h4>
              <p style={{ fontSize: '0.95rem', color: 'rgba(232, 232, 232, 0.7)', marginBottom: '20px', lineHeight: '1.6' }}>
                Get unlimited access to classes, milestone rewards, priority booking, and exclusive member benefits. Start your transformation with Fever today!
              </p>
              <button
                onClick={() => navigate('/memberships')}
                style={{
                  padding: '15px 40px',
                  backgroundColor: '#c9a86a',
                  color: '#1a1a1a',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                View Membership Options
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
