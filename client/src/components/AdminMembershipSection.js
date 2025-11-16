import React, { useState, useEffect } from 'react';
import api from '../config/api';
import './AdminMembershipSection.css';

function AdminMembershipSection() {
  const [memberships, setMemberships] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);

  const [assignForm, setAssignForm] = useState({
    userId: '',
    membershipTierId: '',
    paymentMethod: 'cash',
    notes: ''
  });

  const [updateForm, setUpdateForm] = useState({
    status: '',
    creditsRemaining: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all memberships
      const membershipsRes = await api.get('/api/memberships/admin/all');
      setMemberships(membershipsRes.data.memberships || []);

      // Fetch all tiers
      const tiersRes = await api.get('/api/memberships/tiers');
      const allTiers = [
        ...(tiersRes.data['founders-1'] || []),
        ...(tiersRes.data['founders-2'] || []),
        ...(tiersRes.data['general'] || [])
      ];
      setTiers(allTiers);

      // Fetch users for assignment dropdown
      const usersRes = await api.get('/api/users');
      setUsers(usersRes.data || []);

    } catch (err) {
      console.error('Error fetching membership data:', err);
      setError('Failed to load membership data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      await api.post('/api/memberships/admin/assign', {
        ...assignForm,
        startDate: new Date()
      });

      setSuccess('Membership assigned successfully!');
      setShowAssignForm(false);
      setAssignForm({
        userId: '',
        membershipTierId: '',
        paymentMethod: 'cash',
        notes: ''
      });
      fetchData();
    } catch (err) {
      console.error('Error assigning membership:', err);
      setError(err.response?.data?.message || 'Failed to assign membership');
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMembership) return;

    try {
      setError('');
      setSuccess('');

      await api.patch(`/api/memberships/admin/${selectedMembership._id}`, updateForm);

      setSuccess('Membership updated successfully!');
      setShowUpdateForm(false);
      setSelectedMembership(null);
      setUpdateForm({ status: '', creditsRemaining: '', notes: '' });
      fetchData();
    } catch (err) {
      console.error('Error updating membership:', err);
      setError(err.response?.data?.message || 'Failed to update membership');
    }
  };

  const handleCancelMembership = async (membershipId) => {
    if (!window.confirm('Are you sure you want to cancel this membership? It will remain active until the end of the billing cycle.')) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await api.post(`/api/memberships/admin/${membershipId}/cancel`);

      setSuccess('Membership cancelled successfully!');
      fetchData();
    } catch (err) {
      console.error('Error cancelling membership:', err);
      setError(err.response?.data?.message || 'Failed to cancel membership');
    }
  };

  const openUpdateForm = (membership) => {
    setSelectedMembership(membership);
    setUpdateForm({
      status: membership.status,
      creditsRemaining: membership.creditsRemaining || '',
      notes: membership.notes || ''
    });
    setShowUpdateForm(true);
  };

  const getFilteredMemberships = () => {
    let filtered = memberships;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(m => m.status === filterStatus);
    }

    // Filter by tier
    if (filterTier !== 'all') {
      filtered = filtered.filter(m => m.membershipTier?._id === filterTier);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.user?.name?.toLowerCase().includes(query) ||
        m.user?.email?.toLowerCase().includes(query) ||
        m.membershipTier?.displayName?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const calculateMRR = () => {
    return memberships
      .filter(m => m.status === 'active')
      .reduce((sum, m) => sum + (m.membershipTier?.price || 0), 0);
  };

  const getStatusCounts = () => {
    return {
      active: memberships.filter(m => m.status === 'active').length,
      pending: memberships.filter(m => m.status === 'pending-payment').length,
      cancelled: memberships.filter(m => m.status === 'cancelled').length,
      pendingCancellation: memberships.filter(m => m.status === 'pending-cancellation').length
    };
  };

  if (loading) {
    return <div className="admin-section-loading">Loading memberships...</div>;
  }

  const filteredMemberships = getFilteredMemberships();
  const statusCounts = getStatusCounts();
  const mrr = calculateMRR();

  return (
    <div className="admin-membership-section">
      <div className="section-header">
        <h2>Membership Management</h2>
        <button
          className="btn-primary"
          onClick={() => setShowAssignForm(true)}
        >
          + Assign New Membership
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <strong>Success:</strong> {success}
        </div>
      )}

      {/* Stats Overview */}
      <div className="membership-stats">
        <div className="stat-card">
          <div className="stat-label">Monthly Recurring Revenue</div>
          <div className="stat-value">${mrr.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Memberships</div>
          <div className="stat-value">{statusCounts.active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Payment</div>
          <div className="stat-value">{statusCounts.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Cancellation</div>
          <div className="stat-value">{statusCounts.pendingCancellation}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="membership-filters">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Name, email, or tier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending-payment">Pending Payment</option>
            <option value="pending-cancellation">Pending Cancellation</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Tier:</label>
          <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)}>
            <option value="all">All Tiers</option>
            {tiers.map(tier => (
              <option key={tier._id} value={tier._id}>
                {tier.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Memberships Table */}
      <div className="memberships-table-container">
        <table className="memberships-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Credits</th>
              <th>Classes Attended</th>
              <th>Start Date</th>
              <th>Next Billing</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMemberships.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">No memberships found</td>
              </tr>
            ) : (
              filteredMemberships.map(membership => (
                <tr key={membership._id}>
                  <td>
                    <div className="member-info">
                      <strong>{membership.user?.name || 'Unknown'}</strong>
                      <span className="member-email">{membership.user?.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className="tier-info">
                      <strong>{membership.membershipTier?.displayName}</strong>
                      <span className="tier-price">${membership.membershipTier?.price}/mo</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${membership.status}`}>
                      {membership.status}
                    </span>
                  </td>
                  <td>
                    {membership.membershipTier?.isUnlimited ? (
                      <span className="unlimited-badge">Unlimited</span>
                    ) : (
                      <span>{membership.creditsRemaining} / {membership.creditsTotal}</span>
                    )}
                  </td>
                  <td>{membership.classesAttended || 0}</td>
                  <td>{new Date(membership.startDate).toLocaleDateString()}</td>
                  <td>
                    {membership.nextBillingDate
                      ? new Date(membership.nextBillingDate).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-small btn-edit"
                        onClick={() => openUpdateForm(membership)}
                      >
                        Edit
                      </button>
                      {membership.status === 'active' && (
                        <button
                          className="btn-small btn-cancel"
                          onClick={() => handleCancelMembership(membership._id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Membership Modal */}
      {showAssignForm && (
        <div className="modal-overlay" onClick={() => setShowAssignForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign New Membership</h3>
              <button
                className="modal-close"
                onClick={() => setShowAssignForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label>User *</label>
                <select
                  value={assignForm.userId}
                  onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                  required
                >
                  <option value="">Select a user...</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Membership Tier *</label>
                <select
                  value={assignForm.membershipTierId}
                  onChange={(e) => setAssignForm({ ...assignForm, membershipTierId: e.target.value })}
                  required
                >
                  <option value="">Select a tier...</option>
                  {tiers.map(tier => (
                    <option key={tier._id} value={tier._id}>
                      {tier.displayName} - ${tier.price}/mo
                      {tier.founderSlotsTotal && ` (${tier.founderSlotsTotal - tier.founderSlotsUsed} spots left)`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  value={assignForm.paymentMethod}
                  onChange={(e) => setAssignForm({ ...assignForm, paymentMethod: e.target.value })}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="venmo">Venmo</option>
                  <option value="zelle">Zelle</option>
                  <option value="credit-card">Credit Card</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  rows="3"
                  placeholder="Any special notes about this membership..."
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Assign Membership
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAssignForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Membership Modal */}
      {showUpdateForm && selectedMembership && (
        <div className="modal-overlay" onClick={() => setShowUpdateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Membership</h3>
              <button
                className="modal-close"
                onClick={() => setShowUpdateForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit}>
              <div className="current-membership-info">
                <p><strong>Member:</strong> {selectedMembership.user?.name}</p>
                <p><strong>Tier:</strong> {selectedMembership.membershipTier?.displayName}</p>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="pending-payment">Pending Payment</option>
                  <option value="pending-cancellation">Pending Cancellation</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {!selectedMembership.membershipTier?.isUnlimited && (
                <div className="form-group">
                  <label>Credits Remaining</label>
                  <input
                    type="number"
                    value={updateForm.creditsRemaining}
                    onChange={(e) => setUpdateForm({ ...updateForm, creditsRemaining: e.target.value })}
                    min="0"
                  />
                  <p className="form-help">
                    Current: {selectedMembership.creditsRemaining} / {selectedMembership.creditsTotal}
                  </p>
                </div>
              )}

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  rows="3"
                  placeholder="Update notes..."
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">
                  Update Membership
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowUpdateForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMembershipSection;
