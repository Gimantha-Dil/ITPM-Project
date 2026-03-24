import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiStar, FiBookmark, FiEye } from 'react-icons/fi';

const fileIcons = {
  'application/pdf': '',
  'application/msword': '',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '',
  'application/vnd.ms-powerpoint': '',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '',
  default: ''
};

const Notes = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      params.set('sortBy', sortBy);
      params.set('page', page);
      params.set('limit', 12);

      const res = await api.get(`/notes?${params}`);
      setNotes(res.data.notes);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, [category, sortBy, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchNotes();
  };

  const getPurchaseStatus = (note) => {
    if (!user) return null;
    const purchase = note.purchases?.find(p => p.buyer === user._id || p.buyer?._id === user._id);
    if (!purchase) return null;
    return purchase.verified ? 'owned' : 'pending';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notes Marketplace</h1>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearch} className="search-filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="filter-select" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          <option value="IT">IT</option>
          <option value="SE">SE</option>
          <option value="CS">CS</option>
          <option value="DS">DS</option>
          <option value="Business">Business</option>
          <option value="Engineering">Engineering</option>
          <option value="Other">Other</option>
        </select>
        <select className="filter-select" value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}>
          <option value="newest">Newest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="popular">Most Popular</option>
        </select>
        <button type="submit" className="btn btn-primary"><FiSearch /> Search</button>
      </form>

      {loading ? (
        <div className="loading-screen"><div className="spinner"></div></div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <h3>No notes found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="card-grid">
            {notes.map(note => {
              const status = getPurchaseStatus(note);
              return (
                <div key={note._id} className="note-card" onClick={() => navigate(`/notes/${note._id}`)}>
                  <div className="note-card-header">
                    {fileIcons[note.fileType] || fileIcons.default}
                  </div>
                  <div className="note-card-body">
                    <div className="note-card-title">{note.title}</div>
                    <p className="text-muted text-small" style={{ marginTop: '4px' }}>
                      {note.seller?.fullName} • {note.subject}
                    </p>
                    <div className="note-card-meta">
                      <span className="badge badge-category">{note.category}</span>
                      {note.price === 0 ? (
                        <span className="badge badge-free">Free</span>
                      ) : (
                        <span className="note-card-price">LKR {note.price}</span>
                      )}
                      {status === 'owned' && <span className="badge badge-owned"> Owned</span>}
                      {status === 'pending' && <span className="badge badge-pending"> Pending</span>}
                    </div>
                    <div className="note-card-meta" style={{ marginTop: '6px' }}>
                      <span className="text-small text-muted"><FiStar style={{ color: '#f59e0b' }} /> {note.averageRating}</span>
                      <span className="text-small text-muted"><FiEye /> {note.views}</span>
                      <span className="text-small text-muted"><FiBookmark /> {note.bookmarkedBy?.length || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex-between mt-4">
              <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <span className="text-muted">Page {page} of {totalPages}</span>
              <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Notes;
