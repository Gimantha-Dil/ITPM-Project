import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCheck, FiEye, FiTrash2, FiEdit2, FiXCircle } from 'react-icons/fi';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const MyNotes = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => { fetchMyNotes(); }, []);

  const fetchMyNotes = async () => {
    try {
      const res = await api.get('/notes/user/my-notes');
      setNotes(res.data);
    } catch (err) {
      toast.error('Failed to fetch notes');
    }
    setLoading(false);
  };

  const verifyPayment = async (noteId, purchaseId) => {
    try {
      await api.put(`/notes/${noteId}/verify/${purchaseId}`);
      toast.success('Payment verified! Buyer notified with receipt.');
      fetchMyNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    }
  };

  const unverifyPayment = async (noteId, purchaseId) => {
    if (!window.confirm('Unverify this payment? Buyer will be notified to re-upload the payment slip.')) return;
    try {
      await api.put(`/notes/${noteId}/unverify/${purchaseId}`);
      toast.success('Payment unverified. Buyer notified to re-upload slip.');
      fetchMyNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unverify failed');
    }
  };

  const bulkVerify = async (noteId, purchaseIds) => {
    try {
      await api.post('/notes/bulk-verify', { noteId, purchaseIds });
      toast.success('All payments verified!');
      fetchMyNotes();
    } catch (err) {
      toast.error('Bulk verification failed');
    }
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.delete(`/notes/${noteId}`);
      toast.success('Note deleted');
      setNotes(prev => prev.filter(n => n._id !== noteId));
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📝 My Notes</h1>
        <span className="text-muted">{notes.length} notes</span>
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No notes yet</h3>
          <p>Upload your first note to start selling!</p>
        </div>
      ) : (
        notes.map(note => {
          const pendingPurchases = note.purchases.filter(p => !p.verified);
          const verifiedPurchases = note.purchases.filter(p => p.verified);

          return (
            <div key={note._id} className="card mb-4">
              <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{note.title}</h3>
                  <div className="note-card-meta mt-2">
                    <span className="badge badge-category">{note.category}</span>
                    <span className="note-card-price">LKR {note.price}</span>
                    <span className="text-muted text-small">
                      {verifiedPurchases.length} verified • {pendingPurchases.length} pending
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate(`/edit-note/${note._id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedNote(selectedNote === note._id ? null : note._id)}
                  >
                    <FiEye /> {selectedNote === note._id ? 'Hide' : 'View'} Purchases
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteNote(note._id)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              {selectedNote === note._id && (
                <div style={{ marginTop: '16px' }}>
                  {note.purchases.length === 0 ? (
                    <p className="text-muted">No purchases yet</p>
                  ) : (
                    <>
                      {pendingPurchases.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => bulkVerify(note._id, pendingPurchases.map(p => p._id))}
                          >
                            <FiCheck /> Verify All Pending ({pendingPurchases.length})
                          </button>
                        </div>
                      )}
                      <div className="table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Buyer</th>
                              <th>Date</th>
                              <th>Payment Slip</th>
                              <th>Status</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {note.purchases.map(purchase => (
                              <tr key={purchase._id}>
                                <td>
                                  <strong>{purchase.buyer?.fullName}</strong>
                                  <br /><span className="text-small text-muted">{purchase.buyer?.email}</span>
                                </td>
                                <td>{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                                <td>
                                  <a href={`${API_BASE}${purchase.paymentSlip}`} target="_blank" rel="noreferrer" className="link">
                                    View Slip
                                  </a>
                                </td>
                                <td>
                                  {purchase.verified ? (
                                    <span className="badge badge-verified">✅ Verified</span>
                                  ) : purchase.rejected ? (
                                    <span className="badge" style={{ background: '#fee2e2', color: '#dc2626' }}>❌ Rejected</span>
                                  ) : (
                                    <span className="badge badge-pending">⏳ Pending</span>
                                  )}
                                </td>
                                <td>
                                  <div className="flex gap-2">
                                    {!purchase.verified && !purchase.rejected && (
                                      <>
                                        <button
                                          className="btn btn-success btn-sm"
                                          onClick={() => verifyPayment(note._id, purchase._id)}
                                        >
                                          <FiCheck /> Verify
                                        </button>
                                        <button
                                          className="btn btn-danger btn-sm"
                                          onClick={() => unverifyPayment(note._id, purchase._id)}
                                          title="Reject slip — ask buyer to re-upload"
                                        >
                                          <FiXCircle /> Reject
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
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

export default MyNotes;