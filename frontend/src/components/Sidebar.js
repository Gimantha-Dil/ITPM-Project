import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiBook, FiShoppingCart, FiBookmark,
  FiUpload, FiList, FiBarChart2, FiUsers,
  FiCalendar, FiMessageCircle, FiLock, FiPlus,
  FiChevronRight
} from 'react-icons/fi';

const Sidebar = ({ isOpen }) => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [hasBankDetails, setHasBankDetails] = useState(false);

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

  return (
    <aside
      className="sidebar"
      style={{
        position: 'fixed',
        top: 60,
        left: 0,
        height: 'calc(100vh - 60px)',
        width: '240px',
        overflowX: 'hidden',
        overflowY: 'auto',
        transform: isOpen ? 'translateX(0)' : 'translateX(-234px)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        boxShadow: isOpen ? '4px 0 24px rgba(0,0,0,0.12)' : 'none',
        zIndex: 199,
      }}
    >
      {/* Collapsed indicator strip */}
      {!isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '6px',
          height: '60px',
          background: 'var(--primary-color, #0ea5e9)',
          borderRadius: '0 6px 6px 0',
          opacity: 0.7,
        }}>
          <FiChevronRight size={12} color="#fff" />
        </div>
      )}

      {/* Browse Section */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Browse</div>
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FiHome className="icon" /> Home
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FiBarChart2 className="icon" /> My Dashboard
        </NavLink>
        <NavLink to="/notes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FiBook className="icon" /> Notes Marketplace
        </NavLink>
        <NavLink to="/kuppi-sessions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FiCalendar className="icon" /> Kuppi Sessions
        </NavLink>
      </div>

      {/* My Items Section */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">My Items</div>
        <NavLink to="/my-purchases" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FiShoppingCart className="icon" /> My Purchases
        </NavLink>
        <NavLink to="/bookmarks" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FiBookmark className="icon" /> Bookmarks
        </NavLink>
      </div>

      {/* Seller Section */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">
          Seller {!hasBankDetails && '🔒'}
        </div>
        {hasBankDetails ? (
          <>
            <NavLink to="/create-note" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <FiPlus className="icon" /> Create Note
            </NavLink>
            <NavLink to="/my-notes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <FiUpload className="icon" /> My Notes
            </NavLink>
            <NavLink to="/create-session" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <FiPlus className="icon" /> Create Session
            </NavLink>
            <NavLink to="/my-sessions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <FiList className="icon" /> My Sessions
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <FiBarChart2 className="icon" /> Analytics
            </NavLink>
          </>
        ) : (
          <div className="sidebar-lock" onClick={handleLockedClick}>
            <FiLock /> Add bank details to start selling
          </div>
        )}
      </div>

      {/* Tools Section */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Tools</div>
        <NavLink to="/chat" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FiMessageCircle className="icon" /> Messages
        </NavLink>
        <NavLink to="/chatbot" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FiUsers className="icon" /> AI Helper
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;