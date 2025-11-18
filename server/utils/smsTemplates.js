// SMS Template Variable Replacement System

/**
 * Replace template variables in SMS message
 * @param {string} template - The SMS template with {{variables}}
 * @param {object} data - Data object containing variable values
 * @returns {string} - Processed message with variables replaced
 */
const replaceVariables = (template, data = {}) => {
  if (!template) return '';

  let message = template;

  // Define available variables and their data sources
  const variables = {
    name: data.name || data.userName || '',
    firstName: (data.name || data.userName || '').split(' ')[0],
    email: data.email || data.userEmail || '',
    phone: data.phone || data.userPhone || '',

    // Event/Class variables
    eventTitle: data.eventTitle || data.className || '',
    eventDate: data.eventDate ? formatDate(data.eventDate) : '',
    eventTime: data.eventTime || '',
    eventLocation: data.eventLocation || data.location || '',

    // Booking variables
    confirmationNumber: data.confirmationNumber || '',
    bookingId: data.bookingId || '',
    spots: data.spots || '',
    totalAmount: data.totalAmount || '',

    // Membership variables
    membershipTier: data.membershipTier || '',
    membershipNumber: data.membershipNumber || '',
    creditsRemaining: data.creditsRemaining || '',
    availableCredits: data.availableCredits || '',

    // General
    studioName: 'The Fever Studio',
    studioPhone: '+1 (408) 805-5814',
    websiteUrl: 'https://thefevercollective.com'
  };

  // Replace all variables
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    message = message.replace(regex, variables[key]);
  });

  // Clean up any remaining unreplaced variables
  message = message.replace(/{{[^}]+}}/g, '');

  return message.trim();
};

/**
 * Format date for SMS
 */
const formatDate = (date) => {
  if (!date) return '';

  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Truncate SMS message to character limit
 * @param {string} message - The message to truncate
 * @param {number} maxLength - Maximum length (default 160)
 * @returns {string} - Truncated message
 */
const truncateSMS = (message, maxLength = 160) => {
  if (!message) return '';
  if (message.length <= maxLength) return message;

  return message.substring(0, maxLength - 3) + '...';
};

/**
 * Get list of available template variables
 */
const getAvailableVariables = () => {
  return [
    { key: '{{name}}', description: 'User full name' },
    { key: '{{firstName}}', description: 'User first name' },
    { key: '{{eventTitle}}', description: 'Class/event title' },
    { key: '{{eventDate}}', description: 'Class date' },
    { key: '{{eventTime}}', description: 'Class time' },
    { key: '{{eventLocation}}', description: 'Studio location' },
    { key: '{{confirmationNumber}}', description: 'Booking confirmation number' },
    { key: '{{spots}}', description: 'Number of spots booked' },
    { key: '{{totalAmount}}', description: 'Total booking amount' },
    { key: '{{membershipTier}}', description: 'Membership tier name' },
    { key: '{{membershipNumber}}', description: 'Membership number' },
    { key: '{{creditsRemaining}}', description: 'Remaining membership credits' },
    { key: '{{studioName}}', description: 'Studio name' },
    { key: '{{studioPhone}}', description: 'Studio phone number' },
    { key: '{{websiteUrl}}', description: 'Website URL' }
  ];
};

/**
 * Pre-built SMS templates
 */
const templates = {
  bookingConfirmation: `🎉 Booking Confirmed! {{eventTitle}} on {{eventDate}} at {{eventTime}}. {{eventLocation}}. Spots: {{spots}}. See you there! - {{studioName}}`,

  classReminder: `⏰ Reminder: {{eventTitle}} tomorrow at {{eventTime}} at {{eventLocation}}. We're excited to see you! - {{studioName}}`,

  waitlistNotification: `🎉 A spot opened up! {{eventTitle}} on {{eventDate}} at {{eventTime}}. Book now before it's gone! - {{studioName}}`,

  membershipConfirmation: `🎊 Welcome to {{membershipTier}}! Membership #: {{membershipNumber}}. Credits: {{creditsRemaining}}. Start booking classes today! - {{studioName}}`,

  creditsLow: `⚠️ Credits Running Low. You have {{creditsRemaining}} credits remaining. Renew your membership to keep enjoying classes! - {{studioName}}`,

  welcome: `Welcome to {{studioName}}, {{firstName}}! 🧘‍♀️ Thank you for joining our community. Book your first class today at {{websiteUrl}}`,

  paymentConfirmation: `✅ Payment confirmed! Your booking for {{eventTitle}} on {{eventDate}} at {{eventTime}} is confirmed. Confirmation #: {{confirmationNumber}} - {{studioName}}`
};

/**
 * Get a pre-built template
 */
const getTemplate = (templateName) => {
  return templates[templateName] || '';
};

module.exports = {
  replaceVariables,
  truncateSMS,
  getAvailableVariables,
  getTemplate,
  templates
};
