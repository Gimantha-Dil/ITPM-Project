import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiBookmark, FiTrash2 } from 'react-icons/fi';

const Bookmarks = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await api.get('/notes/user/bookmarks');
      setBookmarks(res.data);
    } catch (err) {
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (noteId) => {
    try {
      await api.post(`/notes/${noteId}/bookmark`);
      setBookmarks(prev => prev.filter(b => b._id !== noteId));
      toast.success('Bookmark removed');
    } catch (err) {
      toast.error('Failed to remove bookmark');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Bookmarks</h1>
      </div>

      {bookmarks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔖</div>
          <h3>No bookmarks yet</h3>
          <p>Bookmark notes from the marketplace to find them quickly later!</p>
        </div>
      ) : (
        <div className="card-grid">
          {bookmarks.map(note => (
            <div key={note._id} className="note-card">
              <div className="note-card-header" onClick={() => navigate(`/notes/${note._id}`)}>
                📄
              </div>
              <div className="note-card-body">
                <div className="note-card-title" onClick={() => navigate(`/notes/${note._id}`)} style={{ cursor: 'pointer' }}>
                  {note.title}
                </div>
                <div className="text-small text-muted" style={{ marginTop: 4 }}>
                  by {note.seller?.fullName}
                </div>
                <div className="note-card-meta">
                  <span className="badge badge-category">{note.category}</span>
                  <span className="note-card-price">
                    {note.price === 0 ? 'Free' : `Rs. ${note.price}`}
                  </span>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleRemove(note._id)}
                  style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
                >
                  <FiTrash2 /> Remove Bookmark
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
