import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiCheck, FiCheckCircle, FiTrash2, FiBell } from 'react-icons/fi';

const Notifications = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

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
    if (notification.link) navigate(notification.link);
  };

  const getIcon = (type) => {
    const icons = {
      payment_received: '💰',
      payment_verified: '✅',
      new_feedback: '⭐',
      enrollment: '📅',
      new_message: '💬'
    };
    return icons[type] || '🔔';
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
            <div className="empty-icon">🔔</div>
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n._id}
              className={`notification-item ${!n.read ? 'unread' : ''}`}
              onClick={() => handleClick(n)}
            >
              <div className="notification-icon" style={{ background: !n.read ? '#ede9fe' : '#f3f4f6' }}>
                {getIcon(n.type)}
              </div>
              <div className="notification-content" style={{ flex: 1 }}>
                <h4>{n.title}</h4>
                <p>{n.message}</p>
                <span className="notification-time">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                className="btn btn-sm"
                onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }}
                style={{ background: 'none', color: '#9ca3af' }}
              >
                <FiTrash2 />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
