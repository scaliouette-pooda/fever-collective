import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navigation() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setIsLoggedIn(!!token);
      setIsAdmin(user.role === 'admin');
    };

    checkAuth();
    // Re-check on storage change (e.g., after login/logout)
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setIsAdmin(false);
    navigate('/');
  };

  return (
    <nav>
      <div className="nav-content">
        <Link to="/" className="nav-logo">The Fever Studio</Link>
        <ul>
          <li><Link to="/events">Events</Link></li>
          <li><Link to="/class-packs">Class Packs</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          {!isLoggedIn ? (
            <li><Link to="/login">Login</Link></li>
          ) : (
            <>
              <li><Link to="/profile">Profile</Link></li>
              <li><a onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</a></li>
            </>
          )}
          {isAdmin && <li><Link to="/admin">Admin</Link></li>}
        </ul>
      </div>
    </nav>
  );
}

export default Navigation;
