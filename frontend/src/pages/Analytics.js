import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiDownload, FiBook, FiCalendar, FiDollarSign, FiEye, FiStar, FiClock, FiTrendingUp } from 'react-icons/fi';

const Analytics = () => {
  const { api } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics/seller');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/analytics/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-report-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported!');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!data) return <div className="empty-state"><h3>No analytics data</h3></div>;

  const { stats } = data;

  const statCards = [
    { icon: '📝', label: 'Total Notes', value: stats.totalNotes, color: '#7c3aed' },
    { icon: '📅', label: 'Total Sessions', value: stats.totalSessions, color: '#2563eb' },
    { icon: '💰', label: 'Total Revenue', value: `Rs. ${stats.totalRevenue}`, color: '#059669' },
    { icon: '📊', label: 'Note Sales', value: stats.totalNoteSales, color: '#7c3aed' },
    { icon: '👥', label: 'Session Enrollments', value: stats.totalSessionEnrollments, color: '#2563eb' },
    { icon: '⏳', label: 'Pending Payments', value: stats.pendingPayments, color: '#d97706' },
    { icon: '👁️', label: 'Total Views', value: stats.totalViews, color: '#6366f1' },
    { icon: '⭐', label: 'Average Rating', value: `${stats.averageRating} / 5`, color: '#f59e0b' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Seller Analytics</h1>
        <button className="btn btn-success" onClick={handleExport} disabled={exporting}>
          <FiDownload /> {exporting ? 'Exporting...' : 'Export Excel Report'}
        </button>
      </div>

      <div className="stats-grid">
        {statCards.map((card, idx) => (
          <div key={idx} className="stat-card">
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 12, fontWeight: 600 }}>Revenue Breakdown</h3>
          <div style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div className="text-muted text-small">Notes Revenue</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed' }}>Rs. {stats.totalNoteRevenue}</div>
          </div>
          <div style={{ padding: '12px 0' }}>
            <div className="text-muted text-small">Sessions Revenue</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>Rs. {stats.totalSessionRevenue}</div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12, fontWeight: 600 }}>Performance</h3>
          <div style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div className="text-muted text-small">Total Downloads</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.totalDownloads}</div>
          </div>
          <div style={{ padding: '12px 0' }}>
            <div className="text-muted text-small">Total Feedback</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{stats.totalFeedback} reviews</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
