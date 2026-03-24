import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiClock, FiUsers, FiTrash2, FiEye, FiEdit2, FiXCircle } from 'react-icons/fi';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const MySessions = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/kuppi/user/my-sessions');
      setSessions(res.data);
    } catch (err) {
      toast.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (sessionId, enrollmentId) => {
    try {
      await api.put(`/kuppi/${sessionId}/verify/${enrollmentId}`);
      toast.success('Enrollment verified! Email sent to student.');
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleReject = async (sessionId, enrollmentId) => {
    if (!window.confirm('Reject this payment slip? Student will be notified to re-upload.')) return;
    try {
      await api.put(`/kuppi/${sessionId}/reject/${enrollmentId}`);
      toast.success('Enrollment rejected. Student notified.');
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed');
    }
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Cancel this session?')) return;
    try {
      await api.delete(`/kuppi/${sessionId}`);
      toast.success('Session cancelled');
      // ── Remove from state immediately — page updates instantly ──
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      if (expandedSession === sessionId) setExpandedSession(null);
    } catch (err) {
      toast.error('Failed to cancel session');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Sessions</h1>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <h3>No sessions created yet</h3>
        </div>
      ) : (
        sessions.map(session => {
          const pendingCount = session.enrollments?.filter(e => !e.verified).length || 0;
          const verifiedCount = session.enrollments?.filter(e => e.verified).length || 0;

          return (
            <div key={session._id} className="card" style={{ marginBottom: 16 }}>
              <div className="flex-between">
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600 }}>{session.title}</h3>
                  <div className="text-small text-muted" style={{ marginTop: 4 }}>
                    Type {session.sessionType} • {session.category} • {new Date(session.date).toLocaleDateString()} at {session.startTime}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <span className="badge badge-verified">
                      <FiCheckCircle style={{ marginRight: 4 }} />{verifiedCount} verified
                    </span>
                    {pendingCount > 0 && (
                      <span className="badge badge-pending">
                        <FiClock style={{ marginRight: 4 }} />{pendingCount} pending
                      </span>
                    )}
                    <span className="badge badge-category">
                      <FiUsers style={{ marginRight: 4 }} />{session.enrollments?.length || 0}/{session.maxParticipants}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {/* ── Edit Button ── */}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/edit-session/${session._id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <FiEdit2 /> Edit
                  </button>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setExpandedSession(expandedSession === session._id ? null : session._id)}
                  >
                    <FiEye /> {expandedSession === session._id ? 'Hide' : 'View'} Enrollments
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(session._id)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              {expandedSession === session._id && (
                <div style={{ marginTop: 16 }}>
                  {session.enrollments?.length === 0 ? (
                    <p className="text-muted">No enrollments yet</p>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Email</th>
                            <th>Payment Slip</th>
                            <th>Status</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {session.enrollments.map(enrollment => (
                            <tr key={enrollment._id}>
                              <td>{enrollment.student?.fullName}</td>
                              <td>{enrollment.student?.email}</td>
                              <td>
                                {enrollment.paymentSlip && enrollment.paymentSlip !== 'free' ? (
                                  <a href={`${API_BASE}${enrollment.paymentSlip}`} target="_blank" rel="noopener noreferrer" className="link">
                                    View Slip
                                  </a>
                                ) : (
                                  <span className="badge badge-free">Free</span>
                                )}
                              </td>
                              <td>
                                {enrollment.verified ? (
                                  <span className="badge badge-verified">✅ Verified</span>
                                ) : enrollment.rejected ? (
                                  <span className="badge" style={{ background: '#fee2e2', color: '#dc2626' }}>❌ Rejected</span>
                                ) : (
                                  <span className="badge badge-pending">⏳ Pending</span>
                                )}
                              </td>
                              <td>
                                {!enrollment.verified && !enrollment.rejected && (
                                  <div className="flex gap-2">
                                    <button
                                      className="btn btn-success btn-sm"
                                      onClick={() => handleVerify(session._id, enrollment._id)}
                                    >
                                      <FiCheckCircle /> Verify
                                    </button>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handleReject(session._id, enrollment._id)}
                                    >
                                      <FiXCircle /> Reject
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default MySessions;