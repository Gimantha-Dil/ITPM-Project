import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiSearch, FiCalendar, FiUsers, FiClock } from 'react-icons/fi';

const KuppiSessions = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sessionType, setSessionType] = useState('');

  useEffect(() => {
    fetchSessions();
  }, [category, sessionType]);

  const fetchSessions = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (sessionType) params.append('sessionType', sessionType);
      const res = await api.get(`/kuppi?${params.toString()}`);
      setSessions(res.data.sessions || res.data);
    } catch (err) {
      toast.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSessions();
  };

  const getEnrollmentStatus = (session) => {
    if (!user) return null;
    const enrollment = session.enrollments?.find(
      e => (e.student?._id || e.student) === user._id
    );
    if (!enrollment) return null;
    return enrollment.verified ? 'verified' : 'pending';
  };

  const getTypeLabel = (type) => {
    const types = { A: 'Free', B: 'Paid Individual', C: 'Paid Group', D: 'Premium' };
    return types[type] || type;
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Kuppi Sessions</h1>
      </div>

      <form onSubmit={handleSearch} className="search-filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search sessions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="IT">IT</option>
          <option value="SE">SE</option>
          <option value="CS">CS</option>
          <option value="DS">DS</option>
          <option value="Business">Business</option>
          <option value="Engineering">Engineering</option>
          <option value="Other">Other</option>
        </select>
        <select className="filter-select" value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
          <option value="">All Types</option>
          <option value="A">Type A (Free)</option>
          <option value="B">Type B (Paid Individual)</option>
          <option value="C">Type C (Paid Group)</option>
          <option value="D">Type D (Premium)</option>
        </select>
        <button type="submit" className="btn btn-primary"><FiSearch /> Search</button>
      </form>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No sessions found</h3>
          <p>Be the first to create a kuppi session!</p>
        </div>
      ) : (
        <div className="card-grid">
          {sessions.map(session => {
            const status = getEnrollmentStatus(session);
            return (
              <div key={session._id} className="note-card" onClick={() => navigate(`/kuppi-sessions/${session._id}`)}>
                <div className="note-card-header" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #c7d2fe 100%)' }}>
                  📚
                </div>
                <div className="note-card-body">
                  <div className="note-card-title">{session.title}</div>
                  <div className="text-small text-muted" style={{ marginTop: 4 }}>
                    by {session.host?.fullName}
                  </div>
                  <div className="note-card-meta">
                    <span className="badge badge-type">Type {session.sessionType}</span>
                    <span className="badge badge-category">{session.category}</span>
                    {status === 'verified' && <span className="badge badge-owned">Enrolled</span>}
                    {status === 'pending' && <span className="badge badge-pending">Pending</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, fontSize: 13, color: '#6b7280' }}>
                    <span><FiCalendar style={{ marginRight: 4 }} />{new Date(session.date).toLocaleDateString()}</span>
                    <span><FiClock style={{ marginRight: 4 }} />{session.startTime}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <span className="note-card-price">
                      {session.price === 0 ? 'Free' : `Rs. ${session.price}`}
                    </span>
                    <span className="text-small text-muted">
                      <FiUsers style={{ marginRight: 4 }} />
                      {session.enrollments?.length || 0}/{session.maxParticipants}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KuppiSessions;
