import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiDownload, FiClock, FiCheckCircle, FiShoppingCart } from 'react-icons/fi';

const MyPurchases = () => {
  const { api } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchases();
  }, []);

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

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Purchases</h1>
      </div>

      {purchases.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
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
                {purchases.map((item, idx) => (
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
                      {item.purchase?.verified ? (
                        <span className="badge badge-verified"><FiCheckCircle style={{ marginRight: 4 }} /> Verified</span>
                      ) : (
                        <span className="badge badge-pending"><FiClock style={{ marginRight: 4 }} /> Pending</span>
                      )}
                    </td>
                    <td className="text-small">
                      {new Date(item.purchase?.purchaseDate).toLocaleDateString()}
                    </td>
                    <td>
                      {item.purchase?.verified ? (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleDownload(item.note._id, item.note.fileName)}
                        >
                          <FiDownload /> Download
                        </button>
                      ) : (
                        <span className="text-muted text-small">Awaiting verification</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPurchases;
