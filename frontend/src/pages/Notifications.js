import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiTrash2 } from 'react-icons/fi';

const Notifications = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {}
  };

  const handleClick = (notification) => {
    handleMarkRead(notification._id);
    if (notification.type === 'payment_received' || notification.type === 'new_feedback') {
      // Seller — note purchases → my-notes, session enrollments → my-sessions
      if (notification.relatedSession) {
        navigate('/my-sessions');
      } else if (notification.relatedNote) {
        navigate('/my-notes');
      } else if (notification.link) {
        navigate(notification.link);
      }
    } else if (notification.type === 'enrollment') {
      // New enrollment → session detail page
      if (notification.relatedSession) {
        navigate(`/kuppi-sessions/${notification.relatedSession}`);
      } else {
        navigate('/my-sessions');
      }
    } else if (notification.relatedSession) {
      navigate(`/kuppi-sessions/${notification.relatedSession}`);
    } else if (notification.relatedNote) {
      navigate(`/notes/${notification.relatedNote}`);
    } else if (notification.link) {
      navigate(notification.link);
    }
  };

  const getIconConfig = (type) => {
    const configs = {
      payment_received:   { bg: '#fef9c3', border: '#fbbf24', color: '#b45309' },
      payment_verified:   { bg: '#dcfce7', border: '#16a34a', color: '#15803d' },
      payment_unverified: { bg: '#fee2e2', border: '#dc2626', color: '#dc2626' },
      new_feedback:       { bg: '#fef3c7', border: '#f59e0b', color: '#b45309' },
      enrollment:         { bg: '#e0faff', border: '#0ab5d6', color: '#0ab5d6' },
      new_message:        { bg: '#e0faff', border: '#63e5ff', color: '#0ab5d6' },
      system:             { bg: '#f3f4f6', border: '#9ca3af', color: '#6b7280' },
    };
    return configs[type] || { bg: '#f3f4f6', border: '#9ca3af', color: '#6b7280' };
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        {notifications.some(n => !n.read) && (
          <button className="btn btn-secondary" onClick={handleMarkAllRead}>
            <FiCheckCircle /> Mark All Read
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          notifications.map(n => {
            const cfg = getIconConfig(n.type);
            return (
              <div
                key={n._id}
                className={`notification-item ${!n.read ? 'unread' : ''}`}
                onClick={() => handleClick(n)}
                style={{ cursor: 'pointer' }}
              >
                <div
                  style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: cfg.border,
                    alignSelf: 'center', flexShrink: 0,
                    marginRight: 4, marginLeft: 4,
                    boxShadow: `0 0 6px ${cfg.border}80`
                  }}
                />
                <div className="notification-content" style={{ flex: 1 }}>
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                  <span className="notification-time">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                {!n.read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--primary-deeper)',
                    alignSelf: 'center', flexShrink: 0, marginRight: 8
                  }} />
                )}
                <button
                  className="btn btn-sm"
                  onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }}
                  style={{ background: 'none', boxShadow: 'none', color: '#9ca3af' }}
                >
                  <FiTrash2 />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;