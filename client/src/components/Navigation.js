import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Navigation() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');
  }, []);

  return (
    <nav>
      <div className="nav-content">
        <Link to="/" className="nav-logo">The Fever Collective</Link>
        <ul>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/events">Events</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to="/login">Login</Link></li>
          {isAdmin && <li><Link to="/admin">Admin</Link></li>}
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
