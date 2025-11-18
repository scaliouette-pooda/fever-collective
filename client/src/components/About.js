import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

function About() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <h1>Luxury Wellness<br/>Curated For You</h1>
        <p className="about-tagline">sculpt · strength · sweat · stretch</p>
      </section>

      <section className="about-mission">
        <div className="mission-content">
          <h2>Our Mission</h2>
          <p>
            The Fever Studio is more than a workout—it's a holistic wellness experience
            that transcends traditional fitness. We curate transformative pilates popup events
            in unique locations, creating intentional spaces for movement, connection, and community.
          </p>
          <p>
            Each class is carefully designed to blend premium instruction with extraordinary
            atmospheres, offering an experience that nourishes both body and spirit.
          </p>
        </div>
        <div className="mission-image">
          <div className="placeholder-mission-img">
            <span>Movement · Community · Wellness</span>
          </div>
        </div>
      </section>

      <section className="about-values">
        <h2>What We Believe</h2>
        <div className="values-grid">
          <div className="value-card">
            <h3>You Belong Here</h3>
            <p>
              We create inclusive spaces where everyone feels welcome, regardless of
              experience level or fitness background.
            </p>
          </div>
          <div className="value-card">
            <h3>Community First</h3>
            <p>
              Movement is better together. We foster genuine connections that extend
              beyond the mat.
            </p>
          </div>
          <div className="value-card">
            <h3>Holistic Wellness</h3>
            <p>
              True wellness encompasses mind, body, and spirit. Our approach integrates
              all three dimensions.
            </p>
          </div>
          <div className="value-card">
            <h3>Intentional Experiences</h3>
            <p>
              Every detail matters. From location selection to music curation, we craft
              memorable moments.
            </p>
          </div>
        </div>
      </section>

      <section className="about-approach">
        <div className="approach-content">
          <h2>Our Approach</h2>
          <div className="approach-items">
            <div className="approach-item">
              <h3>Popup Locations</h3>
              <p>
                We partner with unique venues—rooftops, galleries, gardens, and hidden gems—
                transforming spaces into wellness sanctuaries.
              </p>
            </div>
            <div className="approach-item">
              <h3>Expert Instruction</h3>
              <p>
                Our certified instructors bring years of experience and a passion for
                holistic movement practices.
              </p>
            </div>
            <div className="approach-item">
              <h3>All Levels Welcome</h3>
              <p>
                Whether you're brand new to pilates or a seasoned practitioner, we offer
                modifications and challenges for every body.
              </p>
            </div>
            <div className="approach-item">
              <h3>Premium Equipment</h3>
              <p>
                We provide everything you need—mats, props, towels—so you can focus on
                your practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <h2>Join The Collective</h2>
        <p>Experience wellness that's out of this world</p>
        <Link to="/events">
          <button>View Classes</button>
        </Link>
      </section>
    </div>
  );
}

export default About;
