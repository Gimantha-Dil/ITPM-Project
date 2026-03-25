import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiDownload, FiBookmark, FiStar, FiMessageCircle, FiUpload } from 'react-icons/fi';

const NoteDetail = () => {
  const { id } = useParams();
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      const res = await api.get(`/notes/${id}`);
      setNote(res.data);
    } catch (err) {
      toast.error('Note not found');
      navigate('/notes');
    }
    setLoading(false);
  };

  const userId = user?._id || user?.id;
  const sellerId = note?.seller?._id || note?.seller?.id;

  const myPurchase = note?.purchases?.find(p => {
    const buyerId = p.buyer?._id || p.buyer?.id || p.buyer;
    return buyerId && userId && String(buyerId) === String(userId);
  });

  const isOwner = !!(userId && sellerId && String(userId) === String(sellerId));
  const isVerified = myPurchase?.verified;
  const isRejected = myPurchase?.rejected && !myPurchase?.verified;
  const isPending = myPurchase && !myPurchase.verified && !myPurchase.rejected;
  const canDownload = isOwner || isVerified || note?.price === 0;

  const handlePurchase = async () => {
    if (!paymentSlip) {
      toast.error('Please upload payment slip');
      return;
    }
    setPurchasing(true);
    try {
      const formData = new FormData();
      formData.append('paymentSlip', paymentSlip);
      await api.post(`/notes/${id}/purchase`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Purchase submitted! Waiting for seller verification.');
      fetchNote();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed');
    }
    setPurchasing(false);
  };

  const handleReupload = async () => {
    if (!paymentSlip) {
      toast.error('Please upload payment slip');
      return;
    }
    setPurchasing(true);
    try {
      const formData = new FormData();
      formData.append('paymentSlip', paymentSlip);
      await api.post(`/notes/${id}/reupload-slip`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Payment slip re-submitted! Waiting for seller verification.');
      fetchNote();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Re-upload failed');
    }
    setPurchasing(false);
  };

  const handleDownload = async () => {
    try {
      const res = await api.get(`/notes/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', note.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started!');
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await api.post(`/notes/${id}/bookmark`);
      toast.success(res.data.message);
      fetchNote();
    } catch (err) {
      toast.error('Bookmark failed');
    }
  };

  const handleFeedback = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      await api.post(`/notes/${id}/feedback`, feedback);
      toast.success('Feedback added!');
      setFeedback({ rating: 5, comment: '' });
      fetchNote();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add feedback');
    }
    setSubmittingFeedback(false);
  };

  const handleChat = async () => {
    try {
      const res = await api.post('/chat/start', {
        sellerId: note.seller._id || note.seller.id,
        noteId: note._id || note.id
      });
      navigate(`/chat/${res.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start chat');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!note) return null;

  const isBookmarked = note.bookmarkedBy?.some(id => String(id) === String(userId));

  return (
    <div className="detail-page">
      {/* Header */}
      <div className="card mb-4">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>{note.title}</h1>
            <p className="text-muted">by {note.seller?.fullName} • {note.subject}</p>
          </div>
          <div className="flex gap-2">
            {isVerified && <span className="badge badge-owned" style={{ fontSize: '14px', padding: '8px 16px' }}>Owned</span>}
            {isPending && <span className="badge badge-pending" style={{ fontSize: '14px', padding: '8px 16px' }}>Pending</span>}
          </div>
        </div>

        <div className="note-card-meta mt-4">
          <span className="badge badge-category">{note.category}</span>
          {note.price === 0 ? (
            <span className="badge badge-free">Free</span>
          ) : (
            <span className="note-card-price" style={{ fontSize: '24px' }}>LKR {note.price}</span>
          )}
          <span className="text-muted"><FiStar style={{ color: '#f59e0b' }} /> {note.averageRating} ({note.feedback?.length} reviews)</span>
        </div>

        <p style={{ marginTop: '16px', color: '#4b5563' }}>{note.description}</p>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4" style={{ flexWrap: 'wrap' }}>
          {canDownload && (
            <button className="btn btn-success" onClick={handleDownload}>
              <FiDownload /> Download Note
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleBookmark}>
            <FiBookmark /> {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </button>
          {!isOwner && (
            <button className="btn btn-outline" onClick={handleChat}>
              <FiMessageCircle /> Ask Seller
            </button>
          )}
        </div>
      </div>

      {/* Preview Section — show to non-owners who haven't purchased */}
      {!isOwner && note.price > 0 && !myPurchase && note.previewUrl && (
        <div className="detail-section">
          <h2 style={{ color: 'var(--primary-deeper)', marginBottom: 12 }}>👁️ Preview</h2>
          <p className="text-small text-muted" style={{ marginBottom: 12 }}>
            This is a preview of the note. Purchase to get full access.
          </p>
          {note.previewUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
            <img
              src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${note.previewUrl}`}
              alt="Note Preview"
              style={{ maxWidth: '100%', borderRadius: 12, border: '2px solid var(--primary-light)' }}
            />
          ) : (
            <iframe
              src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${note.previewUrl}`}
              title="Note Preview"
              style={{ width: '100%', height: '500px', borderRadius: 12, border: '2px solid var(--primary-light)' }}
            />
          )}
        </div>
      )}

      {/* Bank Details (show to buyers) */}
      {!isOwner && note.price > 0 && !myPurchase && note.seller?.bankName && (
        <div className="bank-details-box">
          <h3>Seller Bank Details - Transfer here to purchase</h3>
          <div className="bank-detail-row">
            <span className="bank-detail-label">Bank</span>
            <span className="bank-detail-value">{note.seller.bankName}</span>
          </div>
          <div className="bank-detail-row">
            <span className="bank-detail-label">Account Number</span>
            <span className="bank-detail-value">{note.seller.bankAccountNumber}</span>
          </div>
          <div className="bank-detail-row">
            <span className="bank-detail-label">Branch</span>
            <span className="bank-detail-value">{note.seller.bankBranch}</span>
          </div>
          <div className="bank-detail-row">
            <span className="bank-detail-label">Account Holder</span>
            <span className="bank-detail-value">{note.seller.accountHolderName}</span>
          </div>
        </div>
      )}

      {/* Rejected — Re-upload Section */}
      {!isOwner && isRejected && (
        <div className="payment-upload-section" style={{ borderColor: '#ef4444', background: '#fff5f5' }}>
          <h3 style={{ marginBottom: '12px', color: '#dc2626' }}>❌ Payment Slip Rejected</h3>
          <p className="text-small text-muted mb-2">
            Your previous payment slip was rejected by the seller.<br/>
            Please re-upload a valid payment slip to complete your purchase.
          </p>
          <div className="form-group">
            <label>Re-upload Payment Slip</label>
            <input
              type="file"
              className="form-input"
              accept="image/*"
              onChange={e => setPaymentSlip(e.target.files[0])}
            />
          </div>
          <button className="btn btn-primary" onClick={handleReupload} disabled={purchasing || !paymentSlip}>
            <FiUpload /> {purchasing ? 'Submitting...' : 'Re-submit Payment Slip'}
          </button>
        </div>
      )}

      {/* Purchase Section */}
      {!isOwner && note.price > 0 && !myPurchase && (
        <div className="payment-upload-section">
          <h3 style={{ marginBottom: '12px' }}> Purchase This Note</h3>
          <p className="text-small text-muted mb-2">
            1. Transfer LKR {note.price} to the bank account above<br/>
            2. Upload your payment slip below<br/>
            3. Wait for seller verification
          </p>
          <div className="form-group">
            <label>Upload Payment Slip</label>
            <input
              type="file"
              className="form-input"
              accept="image/*"
              onChange={e => setPaymentSlip(e.target.files[0])}
            />
          </div>
          <button className="btn btn-primary" onClick={handlePurchase} disabled={purchasing || !paymentSlip}>
            <FiUpload /> {purchasing ? 'Submitting...' : 'Submit Purchase'}
          </button>
        </div>
      )}

      {/* Feedback Section */}
      <div className="detail-section">
        <h2>Feedback & Reviews</h2>

        {/* Add Feedback */}
        {(isVerified || note.price === 0) && !isOwner && (
          <form onSubmit={handleFeedback} style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '10px' }}>
            <div className="star-rating mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <span
                  key={star}
                  className={`star ${star <= feedback.rating ? 'active' : ''}`}
                  onClick={() => setFeedback({ ...feedback, rating: star })}
                >★</span>
              ))}
            </div>
            <textarea
              className="form-textarea"
              value={feedback.comment}
              onChange={e => setFeedback({ ...feedback, comment: e.target.value })}
              placeholder="Write your review..."
              rows={3}
            />
            <button type="submit" className="btn btn-primary btn-sm mt-2" disabled={submittingFeedback}>
              {submittingFeedback ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {/* Feedback List */}
        {note.feedback?.length === 0 ? (
          <p className="text-muted">No reviews yet</p>
        ) : (
          note.feedback?.map((fb, i) => (
            <div key={i} className="feedback-item">
              <div className="flex-between">
                <strong>{fb.user?.fullName || 'Student'}</strong>
                <span className="feedback-stars">{'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}</span>
              </div>
              {fb.comment && <p className="text-muted mt-2">{fb.comment}</p>}
              <span className="text-small text-muted">{new Date(fb.createdAt).toLocaleDateString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NoteDetail;