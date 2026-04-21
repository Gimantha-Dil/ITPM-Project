import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiBook, FiShoppingCart, FiBookmark,
  FiUpload, FiList, FiBarChart2, FiUsers,
  FiCalendar, FiMessageCircle, FiLock, FiPlus,
  FiBell
} from 'react-icons/fi';

const Sidebar = ({ isOpen }) => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [hasBankDetails, setHasBankDetails] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const checkBank = async () => {
      try {
        const res = await api.get('/auth/check-bank-details');
        setHasBankDetails(res.data.hasBankDetails);
      } catch (err) {}
    };
    checkBank();
  }, [api, user]);

  const handleLockedClick = () => {
    navigate('/profile', { state: { showBankModal: true } });
  };

  // Closed = 52px icon strip, Open = 240px full — BOTH position:fixed overlay, never push content
  const sidebarStyle = {
    position: 'fixed',
    top: 64,
    left: 0,
    width: isOpen ? 240 : 52,
    height: 'calc(100vh - 64px)',
    background: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
    overflowX: 'hidden',
    overflowY: isOpen ? 'auto' : 'hidden',
    zIndex: 999,
    padding: '12px 0',
    transition: 'width 0.25s ease',
    display: 'flex',
    flexDirection: 'column',
  };

  const sectionTitleStyle = {
    paddingTop: '8px',
    paddingBottom: '4px',
    paddingLeft: isOpen ? 16 : 0,
    paddingRight: isOpen ? 16 : 0,
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textAlign: isOpen ? 'left' : 'center',
    opacity: isOpen ? 1 : 0,
    height: isOpen ? 'auto' : 0,
    transition: 'opacity 0.15s ease, height 0.2s ease',
  };

  const dividerStyle = {
    height: 1,
    background: 'var(--border-color)',
    margin: '8px 10px',
  };

  const linkBase = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: isOpen ? '10px 16px' : '10px 0',
    justifyContent: isOpen ? 'flex-start' : 'center',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    borderLeft: '3px solid transparent',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    transition: 'all 0.2s',
  };

  const iconStyle = {
    fontSize: 18,
    flexShrink: 0,
    width: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const getLinkStyle = (isActive) => ({
    ...linkBase,
    background: isActive ? 'var(--bg-hover)' : 'transparent',
    color: isActive ? 'var(--primary-deeper)' : 'var(--text-secondary)',
    borderLeftColor: isActive ? 'var(--primary)' : 'transparent',
    fontWeight: isActive ? 600 : 500,
  });

  const labelStyle = {
    opacity: isOpen ? 1 : 0,
    maxWidth: isOpen ? 160 : 0,
    overflow: 'hidden',
    transition: 'opacity 0.2s ease, max-width 0.25s ease',
    whiteSpace: 'nowrap',
  };

  const sections = [
    {
      title: 'Browse',
      items: [
        { to: '/', icon: <FiHome />, label: 'Home', end: true },
        { to: '/dashboard', icon: <FiBarChart2 />, label: 'My Dashboard' },
        { to: '/notes', icon: <FiBook />, label: 'Notes Marketplace' },
        { to: '/kuppi-sessions', icon: <FiCalendar />, label: 'Kuppi Sessions' },
      ]
    },
    {
      title: 'My Items',
      items: [
        { to: '/my-purchases', icon: <FiShoppingCart />, label: 'My Purchases' },
        { to: '/bookmarks', icon: <FiBookmark />, label: 'Bookmarks' },
        { to: '/notifications', icon: <FiBell />, label: 'Notifications' },
      ]
    },
  ];

  const sellerItems = [
    { to: '/create-note', icon: <FiPlus />, label: 'Create Note' },
    { to: '/my-notes', icon: <FiUpload />, label: 'My Notes' },
    { to: '/create-session', icon: <FiPlus />, label: 'Create Session' },
    { to: '/my-sessions', icon: <FiList />, label: 'My Sessions' },
    { to: '/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
  ];

  const toolItems = [
    { to: '/chat', icon: <FiMessageCircle />, label: 'Messages' },
    { to: '/chatbot', icon: <FiUsers />, label: 'AI Helper' },
  ];

  return (
    <aside style={sidebarStyle}>
      {sections.map((section, si) => (
        <div key={si}>
          {si > 0 && <div style={dividerStyle} />}
          <div style={sectionTitleStyle}>{section.title}</div>
          {section.items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => getLinkStyle(isActive)}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={iconStyle}>{item.icon}</span>
              <span style={labelStyle}>{item.label}</span>
            </NavLink>
          ))}
        </div>
      ))}

      <div style={dividerStyle} />
      <div style={sectionTitleStyle}>Seller</div>
      {hasBankDetails ? (
        sellerItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => getLinkStyle(isActive)}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={iconStyle}>{item.icon}</span>
            <span style={labelStyle}>{item.label}</span>
          </NavLink>
        ))
      ) : (
        <div
          onClick={handleLockedClick}
          style={{ ...linkBase, cursor: 'pointer', color: 'var(--text-muted)' }}
          title="Add bank details to start selling"
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={iconStyle}><FiLock /></span>
          <span style={labelStyle}>Add bank details</span>
        </div>
      )}

      <div style={dividerStyle} />
      <div style={sectionTitleStyle}>Tools</div>
      {toolItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => getLinkStyle(isActive)}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={iconStyle}>{item.icon}</span>
          <span style={labelStyle}>{item.label}</span>
        </NavLink>
      ))}
    </aside>
  );
};

export default Sidebar;