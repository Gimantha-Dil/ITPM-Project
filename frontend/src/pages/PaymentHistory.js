import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiClock, FiDownload } from 'react-icons/fi';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const PaymentHistory = () => {
  const { api } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/payments/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Payment history error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Payment History</h1>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <h3>No payment history</h3>
          <p>Your transaction history will appear here after you make purchases.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Item</th>
                  <th>Seller</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="badge badge-type">
                        {item.type === 'note' ? 'Note' : 'Session'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{item.itemTitle}</td>
                    <td>{item.seller}</td>
                    <td>
                      {item.amount === 0 ? (
                        <span className="badge badge-free">Free</span>
                      ) : (
                        <strong>Rs. {item.amount}</strong>
                      )}
                    </td>
                    <td>
                      {item.verified ? (
                        <span className="badge badge-verified"><FiCheckCircle style={{ marginRight: 4 }} />Verified</span>
                      ) : (
                        <span className="badge badge-pending"><FiClock style={{ marginRight: 4 }} />Pending</span>
                      )}
                    </td>
                    <td className="text-small">
                      {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      {item.receiptUrl ? (
                        <a
                          href={`${API_BASE}${item.receiptUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-secondary"
                        >
                          <FiDownload /> Receipt
                        </a>
                      ) : (
                        <span className="text-muted text-small">-</span>
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

export default PaymentHistory;
