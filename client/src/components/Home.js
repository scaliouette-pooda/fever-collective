import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>The Fever Collective</h1>
          <p className="tagline">A pilates & wellness community that's out of this world</p>
          <div className="hero-actions">
            <Link to="/events">
              <button>View Events</button>
            </Link>
          </div>
        </div>
      </section>

      <section className="about">
        <div className="about-grid">
          <div className="about-text">
            <h2>Pop-Up Pilates Experiences</h2>
            <p>
              We bring transformative pilates experiences to unique locations.
              Each event is carefully curated to create an intentional space
              for movement, connection, and wellness.
            </p>
            <p>
              Join our community and discover a new approach to fitness
              that transcends the traditional studio experience.
            </p>
          </div>
          <div className="about-image">
            <div className="placeholder-image">
              <span>Wellness · Community · Movement</span>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Experience the Fever?</h2>
          <p>Join us for our next popup event</p>
          <Link to="/events">
            <button>Book Your Spot</button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
