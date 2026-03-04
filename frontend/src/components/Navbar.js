import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiBell, FiMessageSquare, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data.count);
      } catch (err) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [api]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span>🎓</span>
        SLIIT Learning Platform
      </Link>

      <div className="navbar-right">
        <button className="navbar-icon-btn" onClick={() => navigate('/chat')} title="Messages">
          <FiMessageSquare />
        </button>

        <button className="navbar-icon-btn" onClick={() => navigate('/notifications')} title="Notifications">
          <FiBell />
          {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </button>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div className="navbar-user" onClick={() => setShowDropdown(!showDropdown)}>
            <div className="navbar-avatar">
              {user?.fullName?.charAt(0)?.toUpperCase()}
            </div>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              {user?.fullName?.split(' ')[0]}
            </span>
          </div>

          {showDropdown && (
            <div className="navbar-dropdown">
              <Link to="/profile" onClick={() => setShowDropdown(false)}>
                <FiUser /> Profile
              </Link>
              <Link to="/payment-history" onClick={() => setShowDropdown(false)}>
                <FiSettings /> Payment History
              </Link>
              <button className="logout-btn" onClick={handleLogout}>
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
