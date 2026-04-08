import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiBell, FiMessageSquare, FiUser, FiLogOut, FiSettings, FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const getInitialDark = () => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [darkMode, setDarkMode] = useState(getInitialDark);
  const [isSystemMode, setIsSystemMode] = useState(() => localStorage.getItem('darkMode') === null);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  // Auto-follow OS theme if user has not manually set preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (localStorage.getItem('darkMode') === null) {
        setDarkMode(e.matches);
        setIsSystemMode(true);
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

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
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) {
        setShowThemeMenu(false);
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
        <img
          src="/logo.png"
          alt="SLIIT LP Logo"
          style={{
            height: '55px',
            width: '55px',
            borderRadius: '8px',
            objectFit: 'cover',
          }}
        />
        SLIIT Learning Platform
      </Link>

      <div className="navbar-right">
        {/* Theme Toggle */}
        <div ref={themeMenuRef} style={{ position: 'relative' }}>
          <button
            className="dark-toggle"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            title="Theme settings"
          >
            {isSystemMode
              ? <FiMonitor size={18} />
              : darkMode ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>

          {showThemeMenu && (
            <div style={{
              position: 'absolute', top: 48, right: 0,
              background: 'var(--bg-card)', borderRadius: 12, padding: 8,
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              minWidth: 170, zIndex: 1001,
              border: '1px solid var(--border-color)',
            }}>
              {[
                { label: 'Light', icon: 'light', action: () => { setDarkMode(false); setIsSystemMode(false); localStorage.setItem('darkMode', 'false'); setShowThemeMenu(false); } },
                { label: 'Dark', icon: 'dark', action: () => { setDarkMode(true); setIsSystemMode(false); localStorage.setItem('darkMode', 'true'); setShowThemeMenu(false); } },
                { label: 'System', icon: 'system', action: () => { const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches; setDarkMode(sysDark); setIsSystemMode(true); localStorage.removeItem('darkMode'); setShowThemeMenu(false); } },
              ].map(opt => (
                <button key={opt.label}
                  onClick={opt.action}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', border: 'none', borderRadius: 8,
                    background: (isSystemMode && opt.icon === 'system') || (!isSystemMode && !darkMode && opt.icon === 'light') || (!isSystemMode && darkMode && opt.icon === 'dark')
                      ? 'var(--bg-hover)' : 'transparent',
                    color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', width: '100%', textAlign: 'left',
                  }}
                >
                  {opt.icon === 'light' && <FiSun size={15} />}
                  {opt.icon === 'dark' && <FiMoon size={15} />}
                  {opt.icon === 'system' && <FiMonitor size={15} />}
                  {opt.label}
                  {((isSystemMode && opt.icon === 'system') || (!isSystemMode && !darkMode && opt.icon === 'light') || (!isSystemMode && darkMode && opt.icon === 'dark')) && (
                    <span style={{ marginLeft: 'auto', color: 'var(--primary-deeper)', fontSize: 11 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

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