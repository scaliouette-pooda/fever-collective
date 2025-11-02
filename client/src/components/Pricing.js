import React from 'react';
import './Pricing.css';

function Pricing() {
  const pricingOptions = [
    {
      title: 'Drop-In',
      price: '35',
      description: 'Single class access',
      features: [
        'Access to any popup event',
        'No commitment required',
        'Premium instruction',
        'Community experience'
      ]
    },
    {
      title: 'Class Pack',
      price: '120',
      description: '4 classes',
      features: [
        'Use within 3 months',
        'Flexible scheduling',
        'All popup locations',
        'Priority booking',
        'Save $20'
      ],
      popular: true
    },
    {
      title: 'Monthly',
      price: '200',
      description: 'Unlimited classes',
      features: [
        'Unlimited popup events',
        'Early event notifications',
        'Exclusive workshops',
        'Community events access',
        'Best value'
      ]
    }
  ];

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1>Pricing</h1>
        <p className="pricing-subtitle">Choose the option that works for you</p>
      </div>

      <div className="pricing-grid">
        {pricingOptions.map((option, index) => (
          <div key={index} className={`pricing-card ${option.popular ? 'popular' : ''}`}>
            {option.popular && <div className="popular-badge">Most Popular</div>}
            <h3>{option.title}</h3>
            <div className="price">
              <span className="currency">$</span>
              <span className="amount">{option.price}</span>
            </div>
            <p className="price-description">{option.description}</p>
            <ul className="features-list">
              {option.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
            <button>Get Started</button>
          </div>
        ))}
      </div>

      <div className="pricing-faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>What should I bring?</h3>
            <p>Just yourself and water. We provide all equipment including mats, props, and towels.</p>
          </div>
          <div className="faq-item">
            <h3>What if I need to cancel?</h3>
            <p>Cancel up to 12 hours before class for a full credit. No-shows will forfeit the class.</p>
          </div>
          <div className="faq-item">
            <h3>Are classes suitable for beginners?</h3>
            <p>Absolutely! Our instructors offer modifications for all fitness levels.</p>
          </div>
          <div className="faq-item">
            <h3>Where are the popup locations?</h3>
            <p>Locations vary and are announced with each event. We partner with unique venues across the city.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;
