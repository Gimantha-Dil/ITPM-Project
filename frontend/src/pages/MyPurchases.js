import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiDownload, FiClock, FiCheckCircle, FiUpload, FiXCircle } from 'react-icons/fi';

const MyPurchases = () => {
  const { api } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reuploadingId, setReuploadingId] = useState(null);
  const fileInputRefs = useRef({});

  useEffect(() => { fetchPurchases(); }, []);

  const fetchPurchases = async () => {
    try {
      const res = await api.get('/notes/user/my-purchases');
      setPurchases(res.data);
    } catch (err) {
      toast.error('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (noteId, fileName) => {
    try {
      const res = await api.get(`/notes/${noteId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'note-file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Download failed');
    }
  };

  const handleReupload = async (noteId, file) => {
    if (!file) {
      toast.error('Please select a payment slip');
      return;
    }
    setReuploadingId(noteId);
    try {
      const formData = new FormData();
      formData.append('paymentSlip', file);
      await api.post(`/notes/${noteId}/reupload-slip`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Payment slip re-submitted! Waiting for seller verification.');
      fetchPurchases();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Re-upload failed');
    } finally {
      setReuploadingId(null);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Purchases</h1>
      </div>

      {purchases.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <h3>No purchases yet</h3>
          <p>Browse the marketplace to find notes!</p>
          <Link to="/notes" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Browse Notes
          </Link>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Note</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((item, idx) => {
                  const isVerified = item.purchase?.verified;
                  const isRejected = item.purchase?.rejected && !item.purchase?.verified;
                  const isPending = !isVerified && !isRejected;

                  return (
                    <tr key={idx}>
                      <td>
                        <Link to={`/notes/${item.note._id}`} className="link">
                          {item.note.title}
                        </Link>
                        <div className="text-small text-muted">{item.note.category} • {item.note.subject}</div>
                      </td>
                      <td>{item.note.seller?.fullName}</td>
                      <td>
                        {item.note.price === 0 ? (
                          <span className="badge badge-free">Free</span>
                        ) : (
                          <strong>Rs. {item.note.price}</strong>
                        )}
                      </td>
                      <td>
                        {isVerified ? (
                          <span className="badge badge-verified">
                            <FiCheckCircle style={{ marginRight: 4 }} /> Verified
                          </span>
                        ) : isRejected ? (
                          <span className="badge" style={{ background: '#fee2e2', color: '#dc2626' }}>
                            <FiXCircle style={{ marginRight: 4 }} /> Rejected
                          </span>
                        ) : (
                          <span className="badge badge-pending">
                            <FiClock style={{ marginRight: 4 }} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="text-small">
                        {new Date(item.purchase?.purchaseDate).toLocaleDateString()}
                      </td>
                      <td>
                        {isVerified ? (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleDownload(item.note._id, item.note.fileName)}
                          >
                            <FiDownload /> Download
                          </button>
                        ) : isRejected ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              ref={el => fileInputRefs.current[item.note._id] = el}
                              onChange={e => {
                                const file = e.target.files[0];
                                if (file) {
                                  fileInputRefs.current[`selected_${item.note._id}`] = file;
                                  // Show filename
                                  const label = document.getElementById(`label_${item.note._id}`);
                                  if (label) label.textContent = file.name;
                                  // Show upload button
                                  const btn = document.getElementById(`uploadbtn_${item.note._id}`);
                                  if (btn) btn.style.display = 'block';
                                }
                              }}
                            />
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => fileInputRefs.current[item.note._id]?.click()}
                            >
                               Choose Slip
                            </button>
                            <span id={`label_${item.note._id}`} className="text-small text-muted">No file chosen</span>
                            <button
                              id={`uploadbtn_${item.note._id}`}
                              className="btn btn-primary btn-sm"
                              style={{ display: 'none' }}
                              disabled={reuploadingId === item.note._id}
                              onClick={() => handleReupload(item.note._id, fileInputRefs.current[`selected_${item.note._id}`])}
                            >
                              <FiUpload /> {reuploadingId === item.note._id ? 'Uploading...' : 'Upload Slip'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted text-small">Awaiting verification</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPurchases;