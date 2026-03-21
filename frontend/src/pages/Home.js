import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiDownload, FiEye, FiUsers, FiSearch, FiArrowRight, FiX, FiCalendar } from 'react-icons/fi';

const Stars = ({ rating }) => {
  const r = Math.round(parseFloat(rating) || 0);
  return (
    <span style={{ color: '#f59e0b', fontSize: 13 }}>
      {'\u2605'.repeat(r)}{'\u2606'.repeat(5 - r)}
      <span style={{ color: '#6b7280', marginLeft: 4, fontSize: 12 }}>
        {parseFloat(rating) > 0 ? parseFloat(rating).toFixed(1) : 'New'}
      </span>
    </span>
  );
};

/* ─────────────────────────────────────────────
   Inline Category Browse Panel
   (appears between category buttons and Top Rated)
───────────────────────────────────────────── */
const CategoryBrowse = ({ category, api, onClose }) => {
  const navigate = useNavigate();
  const sectionRef = useRef(null);

  const [notes, setNotes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [tab, setTab] = useState('notes');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [sessionType, setSessionType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, [category]);

  useEffect(() => {
    setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [category]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [nRes, sRes] = await Promise.all([
        api.get(`/notes?category=${encodeURIComponent(category)}&limit=50`),
        api.get(`/kuppi?category=${encodeURIComponent(category)}&limit=50`)
      ]);
      setNotes(nRes.data.notes || []);
      setSessions(sRes.data.sessions || sRes.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filteredNotes = (() => {
    let list = [...notes];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(n =>
        n.title?.toLowerCase().includes(q) ||
        n.subject?.toLowerCase().includes(q) ||
        n.description?.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'rating')      list.sort((a, b) => (parseFloat(b.averageRating) || 0) - (parseFloat(a.averageRating) || 0));
    else if (sortBy === 'price_low')  list.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === 'price_high') list.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === 'popular')    list.sort((a, b) => (b.views || 0) - (a.views || 0));
    else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  })();

  const filteredSessions = (() => {
    let list = [...sessions];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.title?.toLowerCase().includes(q) ||
        s.subject?.toLowerCase().includes(q)
      );
    }
    if (sessionType) list = list.filter(s => s.sessionType === sessionType);
    list.sort((a, b) => (parseFloat(b.averageRating) || 0) - (parseFloat(a.averageRating) || 0));
    return list;
  })();

  const catColors = {
    IT: '#7c3aed', SE: '#2563eb', CS: '#0891b2',
    DS: '#059669', Business: '#d97706', Engineering: '#dc2626', Other: '#6b7280'
  };
  const accent = catColors[category] || '#7c3aed';

  return (
    <div ref={sectionRef} style={{
      marginBottom: 28, background: '#fff', borderRadius: 16,
      border: `2px solid ${accent}25`, overflow: 'hidden',
      boxShadow: `0 4px 24px ${accent}15`
    }}>
      {/* Panel header */}
      <div style={{
        background: `linear-gradient(135deg, ${accent}18 0%, ${accent}06 100%)`,
        padding: '18px 24px', borderBottom: '1px solid #f3f4f6',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: '#1f2937', marginBottom: 2 }}>
            <span style={{ color: accent }}>{category}</span> — Notes &amp; Sessions
          </h2>
          <p style={{ fontSize: 12, color: '#6b7280' }}>
            {notes.length} note{notes.length !== 1 ? 's' : ''} &nbsp;·&nbsp; {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={onClose} style={{
          background: '#f3f4f6', border: 'none', borderRadius: 8,
          width: 34, height: 34, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280'
        }}>
          <FiX size={15} />
        </button>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* Tab toggle */}
        <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 16 }}>
          {[
            { key: 'notes',    label: ` Notes (${notes.length})` },
            { key: 'sessions', label: ` Sessions (${sessions.length})` }
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }}
              style={{
                padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
                background: tab === t.key ? '#fff' : 'transparent',
                color: tab === t.key ? accent : '#6b7280',
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Search + filters — same style as Notes Marketplace */}
        <form className="search-filters" style={{ marginBottom: 20 }}
          onSubmit={e => { e.preventDefault(); }}>
          <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              className="search-input"
              placeholder={tab === 'notes' ? 'Search notes...' : 'Search sessions...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>

          {tab === 'notes' ? (
            <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="rating">Top Rated</option>
              <option value="price_low">Price: Low → High</option>
              <option value="price_high">Price: High → Low</option>
              <option value="popular">Most Popular</option>
            </select>
          ) : (
            <select className="filter-select" value={sessionType} onChange={e => setSessionType(e.target.value)}>
              <option value="">All Types</option>
              <option value="A">Type A (Free)</option>
              <option value="B">Type B (Paid Individual)</option>
              <option value="C">Type C (Paid Group)</option>
              <option value="D">Type D (Premium)</option>
            </select>
          )}

          <button type="button" className="btn btn-primary" style={{ background: accent, border: 'none' }}
            onClick={() => {
              const params = new URLSearchParams({ category });
              if (search.trim()) params.set('search', search.trim());
              navigate((tab === 'notes' ? '/notes' : '/kuppi-sessions') + '?' + params.toString());
            }}>
            <FiArrowRight size={14} /> View All
          </button>
        </form>

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner"></div></div>
        ) : tab === 'notes' ? (
          filteredNotes.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              
              <h3>No notes found</h3>
              <p>No {category} notes match your search.</p>
            </div>
          ) : (
            <div className="card-grid">
              {filteredNotes.map(note => (
                <div key={note._id} className="note-card" onClick={() => navigate(`/notes/${note._id}`)}>
                  <div className="note-card-header" style={{
                    background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
                    fontSize: 36, minHeight: 90
                  }}></div>
                  <div className="note-card-body">
                    <div className="note-card-title">{note.title}</div>
                    <p className="text-muted text-small" style={{ marginTop: 4 }}>
                      {note.seller?.fullName} · {note.subject}
                    </p>
                    <div className="note-card-meta" style={{ marginTop: 8, justifyContent: 'space-between' }}>
                      {note.price === 0
                        ? <span className="badge badge-free">Free</span>
                        : <span className="note-card-price" style={{ fontSize: 15 }}>LKR {note.price}</span>
                      }
                      <Stars rating={note.averageRating} />
                    </div>
                    <div className="note-card-meta" style={{ marginTop: 6 }}>
                      <span className="text-small text-muted"><FiEye size={11} /> {note.views || 0} views</span>
                      <span className="text-small text-muted"><FiDownload size={11} /> {note.downloads || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredSessions.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              
              <h3>No sessions found</h3>
              <p>No {category} sessions match your search.</p>
            </div>
          ) : (
            <div className="card-grid">
              {filteredSessions.map(session => (
                <div key={session._id} className="note-card" onClick={() => navigate(`/kuppi-sessions/${session._id}`)}>
                  <div className="note-card-header" style={{
                    background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
                    fontSize: 36, minHeight: 90
                  }}></div>
                  <div className="note-card-body">
                    <div className="note-card-title">{session.title}</div>
                    <p className="text-muted text-small" style={{ marginTop: 4 }}>
                      {session.host?.fullName} · {session.subject}
                    </p>
                    <div className="note-card-meta" style={{ marginTop: 8 }}>
                      <span className="badge badge-type">Type {session.sessionType}</span>
                      {session.price === 0
                        ? <span className="badge badge-free">Free</span>
                        : <span style={{ color: accent, fontWeight: 700, fontSize: 13 }}>LKR {session.price}</span>
                      }
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: '#6b7280' }}>
                      <span><FiCalendar size={11} style={{ marginRight: 3 }} />{new Date(session.date).toLocaleDateString()}</span>
                      <span><FiUsers size={11} style={{ marginRight: 3 }} />{session.enrollments?.length || 0}/{session.maxParticipants}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Home Page
───────────────────────────────────────────── */
const Home = () => {
  const { api, user } = useAuth();
  const navigate = useNavigate();

  const [topNotes, setTopNotes]       = useState([]);
  const [topSessions, setTopSessions] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading]         = useState(true);

  // Hero search
  const [search, setSearch]           = useState('');
  const [searchType, setSearchType]   = useState('notes');
  const [heroCategory, setHeroCategory] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [sortBy, setSortBy]           = useState('newest');

  // Category browse panel
  const [browseCategory, setBrowseCategory] = useState(null);

  useEffect(() => { fetchContent(); }, []);

  const fetchContent = async () => {
    try {
      const [notesRes, sessionsRes] = await Promise.all([
        api.get('/notes?limit=50&sortBy=rating'),
        api.get('/kuppi?limit=50&sortBy=newest')
      ]);
      const notes    = notesRes.data.notes    || [];
      const sessions = sessionsRes.data.sessions || [];

      const sorted = [...notes].sort((a, b) => {
        const rA = parseFloat(a.averageRating) || 0;
        const rB = parseFloat(b.averageRating) || 0;
        return rB !== rA ? rB - rA : (b.views || 0) - (a.views || 0);
      });
      setTopNotes(sorted.slice(0, 8));
      setRecentNotes([...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4));

      const sortedS = [...sessions].sort((a, b) => {
        const rA = parseFloat(a.averageRating) || 0;
        const rB = parseFloat(b.averageRating) || 0;
        return rB !== rA ? rB - rA : new Date(a.date) - new Date(b.date);
      });
      setTopSessions(sortedS.slice(0, 6));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim())    params.set('search', search.trim());
    if (heroCategory)     params.set('category', heroCategory);
    if (searchType === 'notes') {
      if (sortBy)         params.set('sortBy', sortBy);
      navigate('/notes?' + params.toString());
    } else {
      if (sessionType)    params.set('sessionType', sessionType);
      navigate('/kuppi-sessions?' + params.toString());
    }
  };

  const handleCategoryClick = (catName) => {
    setBrowseCategory(prev => prev === catName ? null : catName);
  };

  const categories = [
    { name: 'IT',           color: '#7c3aed' },
    { name: 'SE',            color: '#2563eb' },
    { name: 'CS',            color: '#0891b2' },
    { name: 'DS',           color: '#059669' },
    { name: 'Business',     color: '#d97706' },
    { name: 'Engineering',  color: '#dc2626' },
    { name: 'Other',        color: '#6b7280' },
  ];

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)',
        borderRadius: 16, padding: '36px 32px', marginBottom: 28,
        color: '#fff', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 80, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Welcome, {user?.fullName?.split(' ')[0]}! 
        </h1>
        <p style={{ opacity: 0.9, fontSize: 15, marginBottom: 20 }}>
          Discover top-rated notes &amp; kuppi sessions from SLIIT students
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 720 }}>
          {/* Text input */}
          <div style={{ flex: '2 1 220px', position: 'relative', minWidth: 180 }}>
            <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder={searchType === 'notes' ? 'Search notes, subjects, topics...' : 'Search sessions...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '11px 12px 11px 40px', borderRadius: 10, border: 'none', fontSize: 14, outline: 'none', color: '#1f2937', boxSizing: 'border-box' }}
            />
          </div>

          {/* Category */}
          <select value={heroCategory} onChange={e => setHeroCategory(e.target.value)}
            style={{ flex: '1 1 130px', padding: '11px 12px', borderRadius: 10, border: 'none', fontSize: 13, color: '#374151', outline: 'none', cursor: 'pointer', minWidth: 120 }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>

          {/* Sort / Type */}
          {searchType === 'sessions' ? (
            <select value={sessionType} onChange={e => setSessionType(e.target.value)}
              style={{ flex: '1 1 130px', padding: '11px 12px', borderRadius: 10, border: 'none', fontSize: 13, color: '#374151', outline: 'none', cursor: 'pointer', minWidth: 120 }}>
              <option value="">All Types</option>
              <option value="A">Type A (Free)</option>
              <option value="B">Type B (Paid)</option>
              <option value="C">Type C (Group)</option>
              <option value="D">Type D (Premium)</option>
            </select>
          ) : (
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ flex: '1 1 130px', padding: '11px 12px', borderRadius: 10, border: 'none', fontSize: 13, color: '#374151', outline: 'none', cursor: 'pointer', minWidth: 120 }}>
              <option value="newest">Newest</option>
              <option value="rating">Top Rated</option>
              <option value="price_low">Price: Low → High</option>
              <option value="price_high">Price: High → Low</option>
              <option value="popular">Most Popular</option>
            </select>
          )}

          {/* Toggle + Search button */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 3 }}>
              {['notes', 'sessions'].map(t => (
                <button key={t} type="button"
                  onClick={() => { setSearchType(t); t === 'notes' ? setSessionType('') : setSortBy('newest'); }}
                  style={{
                    padding: '7px 13px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, transition: 'all 0.15s', textTransform: 'capitalize',
                    background: searchType === t ? '#fff' : 'transparent',
                    color: searchType === t ? '#7c3aed' : 'rgba(255,255,255,0.85)'
                  }}
                >{t}</button>
              ))}
            </div>
            <button type="submit"
              style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiSearch size={14} /> Search
            </button>
          </div>
        </form>
      </div>

      {/* ── Browse by Category ── */}
      <div style={{ marginBottom: browseCategory ? 16 : 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Browse by Category</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))', gap: 12 }}>
          {categories.map(cat => {
            const isActive = browseCategory === cat.name;
            return (
              <button key={cat.name} onClick={() => handleCategoryClick(cat.name)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 12px',
                  background: isActive ? cat.color : '#fff',
                  borderRadius: 12, border: `2px solid ${isActive ? cat.color : '#f3f4f6'}`,
                  cursor: 'pointer', color: isActive ? '#fff' : '#1f2937', transition: 'all 0.2s',
                  transform: isActive ? 'translateY(-2px)' : 'none',
                  boxShadow: isActive ? `0 6px 20px ${cat.color}40` : 'none'
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = '#f3f4f6'; e.currentTarget.style.transform = 'none'; } }}
              >
                <span style={{ fontSize: 26, marginBottom: 6 }}>{cat.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{cat.name}</span>
                {isActive && <span style={{ fontSize: 10, marginTop: 3, opacity: 0.8 }}>▲ close</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Inline Category Browse Panel ── */}
      {browseCategory && (
        <CategoryBrowse
          key={browseCategory}
          category={browseCategory}
          api={api}
          onClose={() => setBrowseCategory(null)}
        />
      )}

      {/* ── Top Rated Notes ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Top Rated Notes</h2>
          <Link to="/notes" style={{ fontSize: 13, color: '#7c3aed', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            View All <FiArrowRight size={14} />
          </Link>
        </div>
        {topNotes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
            <p>No notes available yet. Be the first to upload!</p>
            <Link to="/create-note" className="btn btn-primary" style={{ marginTop: 12 }}>Upload Note</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {topNotes.map(note => (
              <Link key={note._id} to={'/notes/' + note._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e5e7eb', transition: 'all 0.2s', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ background: '#f3f4f6', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#7c3aed' }}>{note.category}</span>
                    {note.price === 0
                      ? <span style={{ background: '#d1fae5', color: '#065f46', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>FREE</span>
                      : <span style={{ color: '#7c3aed', fontWeight: 700, fontSize: 15 }}>LKR {note.price}</span>
                    }
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{note.title}</h3>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>by {note.seller?.fullName || 'Unknown'} - {note.subject}</p>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{note.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: 10, marginTop: 'auto' }}>
                    <Stars rating={note.averageRating} />
                    <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#9ca3af' }}>
                      <span><FiEye size={12} /> {note.views || 0}</span>
                      <span><FiDownload size={12} /> {note.downloads || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Top Kuppi Sessions ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Top Kuppi Sessions</h2>
          <Link to="/kuppi-sessions" style={{ fontSize: 13, color: '#7c3aed', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            View All <FiArrowRight size={14} />
          </Link>
        </div>
        {topSessions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
            <p>No sessions yet. Create one!</p>
            <Link to="/create-session" className="btn btn-primary" style={{ marginTop: 12 }}>Create Session</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {topSessions.map(session => (
              <Link key={session._id} to={'/kuppi-sessions/' + session._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #e5e7eb', transition: 'all 0.2s', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ background: '#ede9fe', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, color: '#7c3aed' }}>{session.category}</span>
                      <span style={{ background: session.sessionType === 'A' ? '#d1fae5' : '#dbeafe',
                        color: session.sessionType === 'A' ? '#065f46' : '#1e40af',
                        padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Type {session.sessionType}</span>
                    </div>
                    {session.price === 0
                      ? <span style={{ color: '#059669', fontWeight: 700, fontSize: 13 }}>FREE</span>
                      : <span style={{ color: '#7c3aed', fontWeight: 700, fontSize: 14 }}>LKR {session.price}</span>
                    }
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{session.title}</h3>
                  <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>by {session.host?.fullName || 'Unknown'} - {session.subject}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6b7280' }}>
                      <span>{new Date(session.date).toLocaleDateString()}</span>
                      <span>{session.startTime}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FiUsers size={12} color="#9ca3af" />
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{session.enrollments?.length || 0}/{session.maxParticipants}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Recently Added ── */}
      {recentNotes.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>Recently Added</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {recentNotes.map(note => (
              <Link key={note._id} to={'/notes/' + note._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb', transition: 'all 0.2s', display: 'flex', gap: 12, alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📄</div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note.title}</h4>
                    <p style={{ fontSize: 11, color: '#9ca3af' }}>{note.seller?.fullName} - {note.category} - {note.price === 0 ? 'Free' : 'LKR ' + note.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;