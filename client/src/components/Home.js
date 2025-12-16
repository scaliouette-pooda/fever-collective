import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import './Home.css';

function Home() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Get content from settings or use defaults
  const content = settings?.homePageContent || {};
  const aboutImage = content.aboutImage || settings?.homeImages?.aboutImage;
  const missionImage = content.missionImage || settings?.homeImages?.missionImage;

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>{content.heroTitle || 'The Fever Studio'}</h1>
          <p className="tagline">{content.heroTagline || 'Heat That Heals. Movement That Empowers.'}</p>
          <p className="tagline-secondary">{content.heroSecondaryTagline || 'sculpt · strength · sweat · stretch'}</p>
          <div className="hero-actions">
            <Link to="/events">
              <button>View Classes</button>
            </Link>
          </div>
        </div>
      </section>

      <section className="about">
        <div className="about-grid">
          <div className="about-text">
            <h2>{content.aboutTitle || 'Pop-Up Pilates Experiences'}</h2>
            <p>
              {content.aboutParagraph1 || 'We bring transformative pilates experiences to unique locations. Each class is carefully curated to create an intentional space for movement, connection, and wellness.'}
            </p>
            <p>
              {content.aboutParagraph2 || 'Join our community and discover a new approach to fitness that transcends the traditional studio experience.'}
            </p>
          </div>
          <div className="about-image">
            {aboutImage ? (
              <img src={aboutImage} alt="Wellness · Community · Movement" />
            ) : (
              <div className="placeholder-image">
                <span>Wellness · Community · Movement</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mission">
        <div className="mission-content">
          <h2>{content.missionTitle || 'Our Mission'}</h2>
          <p>
            {content.missionParagraph1 || 'The Fever Studio is more than a workout—it\'s a holistic wellness experience that transcends traditional fitness. We curate transformative pilates popup events in unique locations, creating intentional spaces for movement, connection, and community.'}
          </p>
          <p>
            {content.missionParagraph2 || 'Each class is carefully designed to blend premium instruction with extraordinary atmospheres, offering an experience that nourishes both body and spirit.'}
          </p>
        </div>
        <div className="mission-image">
          {missionImage ? (
            <img src={missionImage} alt="Movement · Community · Wellness" />
          ) : (
            <div className="placeholder-mission-img">
              <span>Movement · Community · Wellness</span>
            </div>
          )}
        </div>
      </section>

      <section className="values">
        <h2>{content.valuesTitle || 'What We Believe'}</h2>
        <div className="values-grid">
          <div className="value-card">
            <h3>{content.value1Title || 'You Belong Here'}</h3>
            <p>
              {content.value1Description || 'We create inclusive spaces where everyone feels welcome, regardless of experience level or fitness background.'}
            </p>
          </div>
          <div className="value-card">
            <h3>{content.value2Title || 'Community First'}</h3>
            <p>
              {content.value2Description || 'Movement is better together. We foster genuine connections that extend beyond the mat.'}
            </p>
          </div>
          <div className="value-card">
            <h3>{content.value3Title || 'Holistic Wellness'}</h3>
            <p>
              {content.value3Description || 'True wellness encompasses mind, body, and spirit. Our approach integrates all three dimensions.'}
            </p>
          </div>
          <div className="value-card">
            <h3>{content.value4Title || 'Intentional Experiences'}</h3>
            <p>
              {content.value4Description || 'Every detail matters. From location selection to music curation, we craft memorable moments.'}
            </p>
          </div>
        </div>
      </section>

      <section className="approach">
        <div className="approach-content">
          <h2>{content.approachTitle || 'Our Approach'}</h2>
          <div className="approach-items">
            <div className="approach-item">
              <h3>{content.approach1Title || 'Popup Locations'}</h3>
              <p>
                {content.approach1Description || 'We partner with unique venues—rooftops, galleries, gardens, and hidden gems—transforming spaces into wellness sanctuaries.'}
              </p>
            </div>
            <div className="approach-item">
              <h3>{content.approach2Title || 'Expert Instruction'}</h3>
              <p>
                {content.approach2Description || 'Our certified instructors bring years of experience and a passion for holistic movement practices.'}
              </p>
            </div>
            <div className="approach-item">
              <h3>{content.approach3Title || 'All Levels Welcome'}</h3>
              <p>
                {content.approach3Description || 'Whether you\'re brand new to pilates or a seasoned practitioner, we offer modifications and challenges for every body.'}
              </p>
            </div>
            <div className="approach-item">
              <h3>{content.approach4Title || 'Premium Equipment'}</h3>
              <p>
                {content.approach4Description || 'We provide everything you need—mats, props, towels—so you can focus on your practice.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-content">
          <h2>{content.ctaTitle || 'Join The Collective'}</h2>
          <p>{content.ctaSubtitle || 'Experience wellness that\'s out of this world'}</p>
          <Link to="/events">
            <button>Book Your Spot</button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
