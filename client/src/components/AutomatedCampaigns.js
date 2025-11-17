import React, { useState, useEffect } from 'react';
import api from '../config/api';
import './AutomatedCampaigns.css';
import { getTemplateOptions, getTemplate } from '../utils/campaignTemplates';

function AutomatedCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignStats, setCampaignStats] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [settings, setSettings] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'new_registration',
    triggerConfig: {},
    emailSequence: [
      {
        subject: '',
        message: '',
        delayDays: 0,
        delayHours: 0
      }
    ],
    targetAudience: {
      includeAll: true,
      membershipTiers: []
    },
    isActive: false
  });

  const triggerTypes = [
    { value: 'new_registration', label: 'New Registration', description: 'Triggered when a new user registers' },
    { value: 'class_reminder', label: 'Class Reminder', description: 'Sent before a scheduled class' },
    { value: 'inactive_user', label: 'Inactive User', description: 'Sent to users who haven\'t attended in X days' },
    { value: 'credit_expiring', label: 'Credits Expiring', description: 'Sent when credits are about to expire' },
    { value: 'milestone_achieved', label: 'Milestone Achieved', description: 'Sent when member reaches a milestone' },
    { value: 'membership_expiring', label: 'Membership Expiring', description: 'Sent before membership expires' },
    { value: 'post_class', label: 'Post-Class Follow-up', description: 'Sent after attending a class' },
    { value: 'abandoned_booking', label: 'Abandoned Booking', description: 'Sent when booking is started but not completed' },
    { value: 'classpass_first_visit', label: 'ClassPass - First Visit', description: 'After first ClassPass booking' },
    { value: 'classpass_second_visit', label: 'ClassPass - Second Visit', description: 'After second ClassPass booking' },
    { value: 'classpass_hot_lead', label: 'ClassPass - Hot Lead', description: 'ClassPass user with 3+ visits' }
  ];

  const membershipTiers = [
    { value: 'fever-starter', label: 'Fever Starter' },
    { value: 'fever-enthusiast', label: 'Fever Enthusiast' },
    { value: 'epidemic', label: 'Epidemic' },
    { value: 'all', label: 'All Tiers' }
  ];

  // Filter trigger types based on ClassPass integration setting
  const availableTriggerTypes = triggerTypes.filter(trigger => {
    // If it's a ClassPass trigger, only show if integration is enabled
    if (trigger.value.startsWith('classpass_')) {
      return settings?.classPassIntegration?.enabled === true;
    }
    return true;
  });

  // Filter campaigns list to hide ClassPass campaigns when integration is disabled
  const visibleCampaigns = campaigns.filter(campaign => {
    // If it's a ClassPass campaign, only show if integration is enabled
    if (campaign.triggerType && campaign.triggerType.startsWith('classpass_')) {
      return settings?.classPassIntegration?.enabled === true;
    }
    return true;
  });

  useEffect(() => {
    fetchCampaigns();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/automated-campaigns');
      setCampaigns(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load automated campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignStats = async (campaignId) => {
    try {
      const response = await api.get(`/api/automated-campaigns/${campaignId}/stats`);
      setCampaignStats(response.data);
    } catch (err) {
      console.error('Error fetching campaign stats:', err);
      setError('Failed to load campaign statistics');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTriggerConfigChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      triggerConfig: {
        ...prev.triggerConfig,
        [field]: parseInt(value) || 0
      }
    }));
  };

  const handleEmailSequenceChange = (index, field, value) => {
    const updatedSequence = [...formData.emailSequence];
    updatedSequence[index] = {
      ...updatedSequence[index],
      [field]: field.includes('delay') ? parseInt(value) || 0 : value
    };
    setFormData(prev => ({
      ...prev,
      emailSequence: updatedSequence
    }));
  };

  const addEmailStep = () => {
    setFormData(prev => ({
      ...prev,
      emailSequence: [
        ...prev.emailSequence,
        {
          subject: '',
          message: '',
          delayDays: 0,
          delayHours: 0
        }
      ]
    }));
  };

  const removeEmailStep = (index) => {
    if (formData.emailSequence.length === 1) {
      alert('Campaign must have at least one email');
      return;
    }
    setFormData(prev => ({
      ...prev,
      emailSequence: prev.emailSequence.filter((_, i) => i !== index)
    }));
  };

  const handleTargetAudienceChange = (tier) => {
    if (tier === 'all') {
      setFormData(prev => ({
        ...prev,
        targetAudience: {
          includeAll: true,
          membershipTiers: []
        }
      }));
    } else {
      setFormData(prev => {
        const tiers = prev.targetAudience.membershipTiers.includes(tier)
          ? prev.targetAudience.membershipTiers.filter(t => t !== tier)
          : [...prev.targetAudience.membershipTiers, tier];

        return {
          ...prev,
          targetAudience: {
            includeAll: false,
            membershipTiers: tiers
          }
        };
      });
    }
  };

  const handleTemplateSelect = (e) => {
    const templateKey = e.target.value;
    setSelectedTemplate(templateKey);

    if (templateKey === '') {
      // Reset to empty form for custom campaign
      resetForm();
      return;
    }

    const template = getTemplate(templateKey);
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        triggerType: template.triggerType,
        triggerConfig: template.triggerConfig,
        emailSequence: template.emailSequence,
        targetAudience: template.targetAudience,
        isActive: template.isActive
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (editingCampaign) {
        await api.patch(`/api/automated-campaigns/${editingCampaign._id}`, formData);
      } else {
        await api.post('/api/automated-campaigns', formData);
      }

      await fetchCampaigns();
      resetForm();
      setError('');
    } catch (err) {
      console.error('Error saving campaign:', err);
      setError(err.response?.data?.error || 'Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      triggerType: campaign.triggerType,
      triggerConfig: campaign.triggerConfig || {},
      emailSequence: campaign.emailSequence,
      targetAudience: campaign.targetAudience || { includeAll: true, membershipTiers: [] },
      isActive: campaign.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (campaignId) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This will also cancel all scheduled emails.')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/api/automated-campaigns/${campaignId}`);
      await fetchCampaigns();
      setError('');
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setError('Failed to delete campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (campaignId) => {
    try {
      await api.patch(`/api/automated-campaigns/${campaignId}/toggle`);
      await fetchCampaigns();
      setError('');
    } catch (err) {
      console.error('Error toggling campaign:', err);
      setError('Failed to toggle campaign status');
    }
  };

  const handleViewStats = (campaign) => {
    setSelectedCampaign(campaign);
    fetchCampaignStats(campaign._id);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCampaign(null);
    setSelectedTemplate('');
    setFormData({
      name: '',
      description: '',
      triggerType: 'new_registration',
      triggerConfig: {},
      emailSequence: [
        {
          subject: '',
          message: '',
          delayDays: 0,
          delayHours: 0
        }
      ],
      targetAudience: {
        includeAll: true,
        membershipTiers: []
      },
      isActive: false
    });
  };

  const getTriggerConfigFields = () => {
    switch (formData.triggerType) {
      case 'class_reminder':
        return (
          <>
            <div className="form-group">
              <label>Days Before Class</label>
              <input
                type="number"
                min="0"
                value={formData.triggerConfig.daysBeforeEvent || 1}
                onChange={(e) => handleTriggerConfigChange('daysBeforeEvent', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Hours Before Class</label>
              <input
                type="number"
                min="0"
                value={formData.triggerConfig.hoursBeforeEvent || 0}
                onChange={(e) => handleTriggerConfigChange('hoursBeforeEvent', e.target.value)}
              />
            </div>
          </>
        );
      case 'inactive_user':
        return (
          <div className="form-group">
            <label>Inactive Days</label>
            <input
              type="number"
              min="1"
              value={formData.triggerConfig.inactiveDays || 30}
              onChange={(e) => handleTriggerConfigChange('inactiveDays', e.target.value)}
            />
          </div>
        );
      case 'credit_expiring':
      case 'membership_expiring':
        return (
          <div className="form-group">
            <label>Days Before Expiry</label>
            <input
              type="number"
              min="1"
              value={formData.triggerConfig.daysBeforeExpiry || 7}
              onChange={(e) => handleTriggerConfigChange('daysBeforeExpiry', e.target.value)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (selectedCampaign && campaignStats) {
    return (
      <div className="automated-campaigns">
        <div className="campaign-stats-view">
          <div className="stats-header">
            <button onClick={() => { setSelectedCampaign(null); setCampaignStats(null); }} className="btn-back">
              ← Back to Campaigns
            </button>
            <h3>{selectedCampaign.name} - Statistics</h3>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h4>Total Triggered</h4>
              <p className="stat-value">{campaignStats.stats.totalTriggered}</p>
            </div>
            <div className="stat-card">
              <h4>Total Sent</h4>
              <p className="stat-value">{campaignStats.stats.totalSent}</p>
            </div>
            <div className="stat-card">
              <h4>Scheduled</h4>
              <p className="stat-value">{campaignStats.stats.scheduled}</p>
            </div>
            <div className="stat-card">
              <h4>Failed</h4>
              <p className="stat-value">{campaignStats.stats.totalFailed}</p>
            </div>
          </div>

          {campaignStats.recentEmails.length > 0 && (
            <div className="recent-emails">
              <h4>Recent Emails</h4>
              <table>
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignStats.recentEmails.map((email) => (
                    <tr key={email._id}>
                      <td>{email.recipient?.name || 'N/A'}</td>
                      <td>{email.recipientEmail}</td>
                      <td>
                        <span className={`status-badge ${email.status}`}>
                          {email.status}
                        </span>
                      </td>
                      <td>{email.sentAt ? new Date(email.sentAt).toLocaleString() : 'Pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="automated-campaigns">
      <div className="campaigns-header">
        <h2>Automated Email Campaigns</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Cancel' : '+ New Campaign'}
        </button>
      </div>

      <div className="section-description" style={{
        background: 'rgba(201, 168, 106, 0.05)',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '25px',
        border: '1px solid rgba(201, 168, 106, 0.2)'
      }}>
        <h3 style={{ fontSize: '1.1rem', color: '#c9a86a', marginBottom: '10px', marginTop: 0 }}>
          What are Automated Email Campaigns?
        </h3>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', margin: '0 0 15px 0' }}>
          Automated campaigns send emails based on specific triggers and conditions. Set up a campaign once, and it will automatically send personalized emails to your members when the trigger event occurs.
        </p>
        <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)' }}>
          <strong style={{ color: '#c9a86a', display: 'block', marginBottom: '8px' }}>Key Features:</strong>
          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            <li><strong>Trigger-Based:</strong> Automatically send emails when events occur (new registration, inactive users, expiring credits, etc.)</li>
            <li><strong>Email Sequences:</strong> Create multi-step email journeys with custom delays between messages</li>
            <li><strong>Personalization:</strong> Use placeholders like {'{name}'}, {'{email}'}, {'{membershipTier}'} in your messages</li>
            <li><strong>Audience Targeting:</strong> Target all members or specific membership tiers</li>
            <li><strong>Templates:</strong> Start with pre-built templates for common scenarios (welcome series, re-engagement, etc.)</li>
            <li><strong>Statistics:</strong> Track sends, opens, clicks, and conversions for each campaign</li>
          </ul>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="campaign-form">
          <h3>{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</h3>

          {!editingCampaign && (
            <div className="form-group" style={{
              background: 'rgba(201, 168, 106, 0.1)',
              padding: '20px',
              borderRadius: '8px',
              border: '2px solid rgba(201, 168, 106, 0.3)',
              marginBottom: '25px'
            }}>
              <label style={{ fontSize: '1.1rem', color: '#c9a86a', marginBottom: '10px' }}>
                Start with a Template
              </label>
              <select
                value={selectedTemplate}
                onChange={handleTemplateSelect}
                style={{
                  fontSize: '1rem',
                  padding: '14px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(201, 168, 106, 0.5)'
                }}
              >
                {getTemplateOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p style={{
                fontSize: '0.9rem',
                color: 'rgba(232, 232, 232, 0.7)',
                marginTop: '10px',
                marginBottom: 0
              }}>
                Choose a pre-built template to get started quickly, or select "Custom Campaign" to build from scratch.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Campaign Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., Welcome Series"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="2"
                placeholder="Brief description of this campaign"
              />
            </div>

            <div className="form-group">
              <label>Trigger Type *</label>
              <select
                name="triggerType"
                value={formData.triggerType}
                onChange={handleInputChange}
                required
              >
                {availableTriggerTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            {getTriggerConfigFields()}

            <div className="form-section">
              <h4>Email Sequence</h4>
              {formData.emailSequence.map((email, index) => (
                <div key={index} className="email-step">
                  <div className="email-step-header">
                    <h5>Email #{index + 1}</h5>
                    {formData.emailSequence.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmailStep(index)}
                        className="btn-remove"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Subject *</label>
                    <input
                      type="text"
                      value={email.subject}
                      onChange={(e) => handleEmailSequenceChange(index, 'subject', e.target.value)}
                      required
                      placeholder="Email subject line"
                    />
                  </div>

                  <div className="form-group">
                    <label>Message * (HTML allowed)</label>
                    <textarea
                      value={email.message}
                      onChange={(e) => handleEmailSequenceChange(index, 'message', e.target.value)}
                      required
                      rows="6"
                      placeholder="Email message content. Use {{userName}}, {{eventTitle}}, etc. for placeholders"
                    />
                  </div>

                  <div className="delay-fields">
                    <div className="form-group">
                      <label>Delay Days</label>
                      <input
                        type="number"
                        min="0"
                        value={email.delayDays}
                        onChange={(e) => handleEmailSequenceChange(index, 'delayDays', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Delay Hours</label>
                      <input
                        type="number"
                        min="0"
                        value={email.delayHours}
                        onChange={(e) => handleEmailSequenceChange(index, 'delayHours', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addEmailStep}
                className="btn-secondary"
              >
                + Add Email Step
              </button>
            </div>

            <div className="form-section">
              <h4>Target Audience</h4>
              <div className="checkbox-group">
                {membershipTiers.map(tier => (
                  <label key={tier.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={
                        tier.value === 'all'
                          ? formData.targetAudience.includeAll
                          : formData.targetAudience.membershipTiers.includes(tier.value)
                      }
                      onChange={() => handleTargetAudienceChange(tier.value)}
                    />
                    {tier.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                Activate campaign immediately
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (editingCampaign ? 'Update Campaign' : 'Create Campaign')}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showForm ? (
        <p>Loading campaigns...</p>
      ) : (
        <div className="campaigns-list">
          {campaigns.length === 0 ? (
            <p>No automated campaigns yet. Create your first campaign above!</p>
          ) : (
            <table className="campaigns-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Trigger</th>
                  <th>Emails</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Stats</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCampaigns.map(campaign => (
                  <tr key={campaign._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong>{campaign.name}</strong>
                        {campaign.triggerType && campaign.triggerType.startsWith('classpass_') && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            background: 'rgba(0, 122, 255, 0.2)',
                            border: '1px solid rgba(0, 122, 255, 0.5)',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            color: '#007aff',
                            fontWeight: '600'
                          }}>
                            🔵 ClassPass
                          </span>
                        )}
                      </div>
                      {campaign.description && (
                        <div className="campaign-description">{campaign.description}</div>
                      )}
                    </td>
                    <td>
                      {triggerTypes.find(t => t.value === campaign.triggerType)?.label || campaign.triggerType}
                    </td>
                    <td>{campaign.emailSequence.length} email{campaign.emailSequence.length > 1 ? 's' : ''}</td>
                    <td>
                      {campaign.targetAudience.includeAll
                        ? 'All Members'
                        : campaign.targetAudience.membershipTiers.join(', ')}
                    </td>
                    <td>
                      <span className={`status-badge ${campaign.isActive ? 'active' : 'inactive'}`}>
                        {campaign.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="campaign-stats">
                        <div>Triggered: {campaign.stats.totalTriggered || 0}</div>
                        <div>Sent: {campaign.stats.totalSent || 0}</div>
                      </div>
                    </td>
                    <td className="actions">
                      <button
                        onClick={() => handleToggleActive(campaign._id)}
                        className="btn-icon"
                        title={campaign.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {campaign.isActive ? '⏸' : '▶'}
                      </button>
                      <button
                        onClick={() => handleViewStats(campaign)}
                        className="btn-icon"
                        title="View Statistics"
                      >
                        📊
                      </button>
                      <button
                        onClick={() => handleEdit(campaign)}
                        className="btn-icon"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(campaign._id)}
                        className="btn-icon btn-danger"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default AutomatedCampaigns;
