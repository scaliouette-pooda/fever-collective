import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import './Auth.css';

function ClassPacks() {
  const navigate = useNavigate();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState(null);

  useEffect(() => {
    fetchPacks();
    fetchUserCredits();
  }, []);

  const fetchPacks = async () => {
    try {
      const response = await api.get('/api/class-packs');
      setPacks(response.data);
    } catch (error) {
      console.error('Error fetching class packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.get('/api/class-packs/my-credits', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserCredits(response.data);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const handlePurchase = async (packId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to purchase a class pack');
        navigate('/login');
        return;
      }

      const response = await api.post(`/api/class-packs/${packId}/purchase`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.clientSecret) {
        // TODO: Integrate Stripe payment UI
        alert('Class pack purchased! Credits added to your account.');
      } else {
        alert(response.data.message || 'Class pack purchased successfully!');
      }

      fetchUserCredits();
    } catch (error) {
      console.error('Error purchasing pack:', error);
      alert(error.response?.data?.error || 'Failed to purchase class pack');
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '1200px' }}>
        <div className="auth-header">
          <h1>Class Packs</h1>
          <p>Save money and commit to your wellness journey</p>

          {userCredits && (
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: 'rgba(201, 168, 106, 0.1)',
              border: '1px solid rgba(201, 168, 106, 0.3)',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#c9a86a', marginBottom: '0.5rem' }}>Your Available Credits</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: '300', color: '#c9a86a', margin: 0 }}>
                {userCredits.totalCredits}
              </p>
              <p style={{ fontSize: '0.9rem', color: 'rgba(232, 232, 232, 0.7)', marginTop: '0.5rem' }}>
                credits
              </p>
            </div>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          marginTop: '3rem'
        }}>
          {packs.map((pack) => (
            <div
              key={pack._id}
              style={{
                border: pack.isPopular ? '2px solid #c9a86a' : '1px solid rgba(255, 255, 255, 0.1)',
                padding: '2rem',
                position: 'relative',
                backgroundColor: pack.isPopular ? 'rgba(201, 168, 106, 0.05)' : 'transparent',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {pack.isPopular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '20px',
                  backgroundColor: '#c9a86a',
                  color: '#1a1a1a',
                  padding: '0.4rem 1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  Most Popular
                </div>
              )}

              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#c9a86a' }}>
                {pack.name}
              </h3>

              <p style={{ color: 'rgba(232, 232, 232, 0.8)', marginBottom: '1.5rem', minHeight: '3rem' }}>
                {pack.description}
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: '300', color: '#c9a86a' }}>
                    ${pack.price}
                  </span>
                  <span style={{ fontSize: '1rem', color: 'rgba(232, 232, 232, 0.5)', textDecoration: 'line-through' }}>
                    ${pack.regularPrice}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#4caf50', fontWeight: '600' }}>
                  Save ${pack.savings}
                </p>
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <p style={{ fontSize: '2rem', fontWeight: '300', color: '#e8e8e8', margin: 0 }}>
                  {pack.credits}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'rgba(232, 232, 232, 0.7)', margin: 0 }}>
                  Credits
                </p>
              </div>

              {pack.features && pack.features.length > 0 && (
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem',
                  color: 'rgba(232, 232, 232, 0.8)'
                }}>
                  {pack.features.map((feature, index) => (
                    <li key={index} style={{ padding: '0.4rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
              )}

              <div style={{ fontSize: '0.85rem', color: 'rgba(232, 232, 232, 0.6)', marginBottom: '1.5rem' }}>
                Valid for {pack.validityDays} days
              </div>

              <button
                onClick={() => handlePurchase(pack._id)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: pack.isPopular ? '#c9a86a' : 'transparent',
                  border: pack.isPopular ? 'none' : '1px solid #c9a86a',
                  color: pack.isPopular ? '#1a1a1a' : '#c9a86a',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!pack.isPopular) {
                    e.target.style.backgroundColor = '#c9a86a';
                    e.target.style.color = '#1a1a1a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!pack.isPopular) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#c9a86a';
                  }
                }}
              >
                Purchase Pack
              </button>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '4rem',
          padding: '2rem',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#c9a86a' }}>How Class Packs Work</h3>
          <ul style={{ lineHeight: '1.8', color: 'rgba(232, 232, 232, 0.8)' }}>
            <li>Purchase a pack and credits are added to your account immediately</li>
            <li>Use 1 credit per class booking (regardless of ticket tier)</li>
            <li>Credits expire after the validity period shown above</li>
            <li>Mix and match - attend any events you choose</li>
            <li>Non-refundable but transferable to friends/family</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ClassPacks;
