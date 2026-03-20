import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiBook, FiCalendar, FiShoppingCart, FiBookmark, FiTrendingUp, FiDollarSign, FiStar, FiEye } from 'react-icons/fi';

const Home = () => {
  const { user, api } = useAuth();
  const [buyerStats, setBuyerStats] = useState(null);
  const [sellerStats, setSellerStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [buyerRes, sellerRes] = await Promise.all([
          api.get('/analytics/buyer'),
          api.get('/analytics/seller')
        ]);
        setBuyerStats(buyerRes.data);
        setSellerStats(sellerRes.data.stats);
      } catch (err) {}
      setLoading(false);
    };
    fetchStats();
  }, [api]);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.fullName?.split(' ')[0]}! 👋</h1>
          <p className="text-muted">Here's your learning dashboard overview</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{sellerStats?.totalNotes || 0}</div>
          <div className="stat-label">Notes Listed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{sellerStats?.totalSessions || 0}</div>
          <div className="stat-label">Sessions Created</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">LKR {sellerStats?.totalRevenue?.toLocaleString() || 0}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-value">{buyerStats?.totalPurchasedNotes || 0}</div>
          <div className="stat-label">Notes Purchased</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-value">{buyerStats?.totalEnrolledSessions || 0}</div>
          <div className="stat-label">Sessions Enrolled</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{sellerStats?.pendingPayments || 0}</div>
          <div className="stat-label">Pending Payments</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{sellerStats?.averageRating || 0}</div>
          <div className="stat-label">Average Rating</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-value">{sellerStats?.totalViews || 0}</div>
          <div className="stat-label">Total Views</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/notes" className="btn btn-primary"><FiBook /> Browse Notes</Link>
          <Link to="/kuppi-sessions" className="btn btn-outline"><FiCalendar /> Kuppi Sessions</Link>
          <Link to="/my-purchases" className="btn btn-secondary"><FiShoppingCart /> My Purchases</Link>
          <Link to="/bookmarks" className="btn btn-secondary"><FiBookmark /> Bookmarks</Link>
          {user?.bankName && (
            <>
              <Link to="/create-note" className="btn btn-success"><FiTrendingUp /> Upload Note</Link>
              <Link to="/analytics" className="btn btn-outline"><FiDollarSign /> Analytics</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
