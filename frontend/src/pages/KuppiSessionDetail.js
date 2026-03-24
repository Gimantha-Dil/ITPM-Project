import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiCalendar, FiClock, FiUsers, FiExternalLink, } from 'react-icons/fi';
 
const KuppiSessionDetail = () => {
  const { id } = useParams();
  const { api, user } = useAuth();
  //const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
 
  useEffect(() => {
    fetchSession();
  }, [id]);
 
  const fetchSession = async () => {
    try {
      const res = await api.get(`/kuppi/${id}`);
      setSession(res.data);
    } catch (err) {
      toast.error('Failed to load session');
    } finally {
      setLoading(false);
    }
  };
 
  const userId = user?._id || user?.id;
 
  const getMyEnrollment = () => {
    return session?.enrollments?.find(
      e => { const sid = e.student?._id || e.student?.id || e.student; return sid && userId && String(sid) === String(userId); }
    );
  };
 
  const handleEnroll = async (e) => {
    e.preventDefault();
    if (session.price > 0 && !paymentSlip) {
      return toast.error('Please upload payment slip');
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (paymentSlip) formData.append('paymentSlip', paymentSlip);
      await api.post(`/kuppi/${id}/enroll`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Enrolled successfully!');
      fetchSession();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setSubmitting(false);
    }
  };
 
  const handleFeedback = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/kuppi/${id}/feedback`, { rating, comment });
      toast.success('Feedback submitted!');
      setRating(0);
      setComment('');
      fetchSession();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    }
  };
 
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!session) return <div className="empty-state"><h3>Session not found</h3></div>;
 
  const myEnrollment = getMyEnrollment();
  const hostId = session.host?._id || session.host?.id;
  const isHost = !!(userId && hostId && String(userId) === String(hostId));
  const avgRating = session.feedback?.length > 0
    ? (session.feedback.reduce((a, b) => a + b.rating, 0) / session.feedback.length).toFixed(1)
    : 'N/A';
 
  return (
    <div className="detail-page">
      <div className="detail-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{session.title}</h1>
            <div className="text-muted">by {session.host?.fullName}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <span className="badge badge-type">Type {session.sessionType}</span>
              <span className="badge badge-category">{session.category}</span>
              <span className="badge badge-category">{session.subject}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary-deeper)' }}>
              {session.price === 0 ? 'Free' : `Rs. ${session.price}`}
            </div>
            <div className="text-small text-muted">Rating: {avgRating} </div>
          </div>
        </div>
      </div>
 
      <div className="detail-section">
        <h2>Session Details</h2>
        <p style={{ marginBottom: 16 }}>{session.description}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          <div><FiCalendar /> <strong>Date:</strong> {new Date(session.date).toLocaleDateString()}</div>
          <div><FiClock /> <strong>Time:</strong> {session.startTime}</div>
          <div><FiClock /> <strong>Duration:</strong> {session.duration} mins</div>
          <div><FiUsers /> <strong>Enrolled:</strong> {session.enrollments?.length || 0}/{session.maxParticipants}</div>
        </div>
      </div>
 
      {/* MS Teams Link - only for verified enrollments or host */}
      {(isHost || myEnrollment?.verified) && session.msTeamsLink && (
        <div className="detail-section" style={{ background: '#f0fdf4', border: '2px solid #10b981' }}>
          <h2 style={{ color: '#059669' }}>Join Session</h2>
          <a href={session.msTeamsLink} target="_blank" rel="noopener noreferrer" className="btn btn-success">
            <FiExternalLink /> Open MS Teams Link
          </a>
        </div>
      )}
 
      {/* Bank Details - for paid sessions */}
      {!isHost && !myEnrollment && session.price > 0 && session.host?.bankName && (
        <div className="bank-details-box">
          <h3>💳 Seller Bank Details (Transfer here)</h3>
          <div className="bank-detail-row">
            <span className="bank-detail-label">Bank</span>
            <span className="bank-detail-value">{session.host.bankName}</span>
          </div>
          <div className="bank-detail-row">
            <span className="bank-detail-label">Account Number</span>
            <span className="bank-detail-value">{session.host.bankAccountNumber}</span>
          </div>
          <div className="bank-detail-row">
            <span className="bank-detail-label">Branch</span>
            <span className="bank-detail-value">{session.host.bankBranch}</span>
          </div>
          <div className="bank-detail-row">
            <span className="bank-detail-label">Account Holder</span>
            <span className="bank-detail-value">{session.host.accountHolderName}</span>
          </div>
        </div>
      )}
 
      {/* Enrollment Section */}
      {!isHost && !myEnrollment && (
        <div className="detail-section">
          <h2>Enroll in Session</h2>
          <form onSubmit={handleEnroll}>
            {session.price > 0 && (
              <div className="payment-upload-section">
                <p style={{ marginBottom: 12, fontWeight: 600 }}>Upload Payment Slip</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setPaymentSlip(e.target.files[0])}
                  className="form-input"
                />
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 12 }}>
              {submitting ? 'Enrolling...' : session.price === 0 ? 'Enroll (Free)' : 'Submit Enrollment'}
            </button>
          </form>
        </div>
      )}
 
      {myEnrollment && (
        <div className="detail-section" style={{
          background: myEnrollment.verified ? '#f0fdf4' : '#fffbeb',
          border: `2px solid ${myEnrollment.verified ? '#10b981' : '#f59e0b'}`
        }}>
          <h2 style={{ color: myEnrollment.verified ? '#059669' : '#d97706' }}>
            {myEnrollment.verified ? ' Enrolled & Verified' : ' Enrollment Pending Verification'}
          </h2>
          <p>{myEnrollment.verified ? 'You have access to this session.' : 'The host will verify your payment soon.'}</p>
        </div>
      )}
 
      {/* Feedback Section */}
      <div className="detail-section">
        <h2>Feedback ({session.feedback?.length || 0})</h2>
        {myEnrollment?.verified && (
          <form onSubmit={handleFeedback} style={{ marginBottom: 20 }}>
            <div className="star-rating" style={{ marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} className={`star ${s <= rating ? 'active' : ''}`} onClick={() => setRating(s)}>★</span>
              ))}
            </div>
            <textarea
              className="form-textarea"
              placeholder="Write your feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!rating}>Submit Feedback</button>
          </form>
        )}
        {session.feedback?.map((fb, idx) => (
          <div key={idx} className="feedback-item">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{fb.user?.fullName}</strong>
              <span className="feedback-stars">{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</span>
            </div>
            {fb.comment && <p className="text-muted" style={{ marginTop: 4 }}>{fb.comment}</p>}
          </div>
        ))}
        {(!session.feedback || session.feedback.length === 0) && (
          <p className="text-muted">No feedback yet.</p>
        )}
      </div>
    </div>
  );
};
 
export default KuppiSessionDetail;