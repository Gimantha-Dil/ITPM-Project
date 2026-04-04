import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const EditNote = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isFree, setIsFree] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [currentFileName, setCurrentFileName] = useState('');
  const [currentFileUrl, setCurrentFileUrl] = useState('');
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState(null);
  const API_BASE = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const [form, setForm] = useState({
    title: '', description: '', category: 'IT', subject: '', price: 0, tags: ''
  });

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await api.get(`/notes/${id}`);
        const n = res.data;
        const free = n.price === 0;
        setIsFree(free);
        setCurrentPreviewUrl(n.previewUrl || null);
        setCurrentFileName(n.fileName || '');
        setCurrentFileUrl(n.fileUrl || '');
        setForm({
          title: n.title || '',
          description: n.description || '',
          category: n.category || 'IT',
          subject: n.subject || '',
          price: n.price || 0,
          tags: n.tags?.join(', ') || ''
        });
      } catch (err) {
        toast.error('Note loading failed');
        navigate('/my-notes');
      } finally {
        setFetching(false);
      }
    };
    fetchNote();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceTypeChange = (free) => {
    setIsFree(free);
    setForm(prev => ({ ...prev, price: free ? 0 : '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFree && (!form.price || parseFloat(form.price) <= 0)) {
      toast.error('Please enter a valid price for paid note');
      return;
    }
    setLoading(true);
    try {
      if (previewFile || newFile) {
        const data = new FormData();
        Object.keys(form).forEach(key => data.append(key, form[key]));
        data.append('price', isFree ? 0 : parseFloat(form.price));
        if (previewFile) data.append('previewFile', previewFile);
        if (newFile) data.append('file', newFile);
        await api.put(`/notes/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.put(`/notes/${id}`, { ...form, price: isFree ? 0 : parseFloat(form.price) });
      }
      toast.success('Note updated');
      navigate('/my-notes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1 className="page-title">Edit Note</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Title *</label>
            <input type="text" name="title" className="form-input"
              value={form.title} onChange={handleChange} required
              placeholder="Note title" />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea name="description" className="form-textarea"
              value={form.description} onChange={handleChange} required
              placeholder="Note description" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Category *</label>
              <select name="category" className="form-select"
                value={form.category} onChange={handleChange}>
                <option value="IT">IT</option>
                <option value="SE">SE</option>
                <option value="CS">CS</option>
                <option value="DS">DS</option>
                <option value="Business">Business</option>
                <option value="Engineering">Engineering</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Subject *</label>
              <input type="text" name="subject" className="form-input"
                value={form.subject} onChange={handleChange} required
                placeholder="Subject name" />
            </div>
          </div>

          {/* ── Free / Paid Toggle ── */}
          <div className="form-group">
            <label>Price Type *</label>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => handlePriceTypeChange(true)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 15, transition: 'all 0.15s',
                  background: isFree ? 'linear-gradient(135deg, #63e5ff, #b1f2ff)' : '#f3f4f6',
                  color: isFree ? '#0a4a57' : '#6b7280',
                  boxShadow: isFree ? '0 4px 12px rgba(99,229,255,0.4)' : 'none',
                }}
              >
                 Free
              </button>
              <button
                type="button"
                onClick={() => handlePriceTypeChange(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 15, transition: 'all 0.15s',
                  background: !isFree ? 'linear-gradient(135deg, #63e5ff, #b1f2ff)' : '#f3f4f6',
                  color: !isFree ? '#0a4a57' : '#6b7280',
                  boxShadow: !isFree ? '0 4px 12px rgba(99,229,255,0.4)' : 'none',
                }}
              >
                 Paid
              </button>
            </div>
          </div>

          {/* Price + Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {!isFree && (
              <div className="form-group">
                <label>Price (LKR) *</label>
                <input
                  type="text"
                  name="price"
                  className="form-input"
                  value={form.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d{0,2}$/.test(value))
                      setForm(prev => ({ ...prev, price: value }));
                  }}
                  onBlur={() => {
                    if (form.price)
                      setForm(prev => ({ ...prev, price: parseFloat(form.price).toFixed(2) }));
                  }}
                  required
                  placeholder="0.00"
                />
              </div>
            )}
            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input type="text" name="tags" className="form-input"
                value={form.tags} onChange={handleChange}
                placeholder="SQL, MongoDB, Oracle" />
            </div>
          </div>

          {/* Replace Main File */}
          <div className="form-group">
            <label>Replace Note File <span className="text-muted text-small">(optional — leave empty to keep current)</span></label>
            {currentFileName && !newFile && (
              <div style={{ marginBottom: 8, padding: '8px 12px', background: '#f0fdff', borderRadius: 8, border: '1px solid #63e5ff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                 Current file: <strong>{currentFileName}</strong>
                {' — '}
                <a href={`${API_BASE}${currentFileUrl}`} target="_blank" rel="noreferrer" className="link">View</a>
                {' | '}
                <span style={{ color: '#dc2626', cursor: 'pointer' }} onClick={() => setCurrentFileName('')}>Remove</span>
              </div>
            )}
            <div
              className={`file-upload-area ${newFile ? 'has-file' : ''}`}
              onClick={() => document.getElementById('editNoteFile').click()}
            >
              <input id="editNoteFile" type="file" style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.png,.gif"
                onChange={e => setNewFile(e.target.files[0])} />
              {newFile ? (
                <div>
                  <p style={{ fontSize: '24px' }}></p>
                  <p><strong>{newFile.name}</strong></p>
                  <p className="text-small text-muted">{(newFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <span style={{ color: '#dc2626', cursor: 'pointer', fontSize: 12 }}
                    onClick={e => { e.stopPropagation(); setNewFile(null); }}>✕ Remove</span>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '28px' }}></p>
                  <p>Click to replace file</p>
                  <p className="text-small text-muted">PDF, DOC, PPT, XLS, TXT, Images</p>
                </div>
              )}
            </div>
          </div>

          {/* Preview File */}
          {!isFree && (
            <div className="form-group">
              <label>Preview File <span className="text-muted text-small">(optional — buyers see before purchase)</span></label>
              {currentPreviewUrl && !previewFile && (
                <div style={{ marginBottom: 8, padding: '8px 12px', background: '#f0fdff', borderRadius: 8, border: '1px solid #63e5ff', fontSize: 13 }}>
                   Current preview set —{' '}
                  <a href={`${API_BASE}${currentPreviewUrl}`} target="_blank" rel="noreferrer" className="link">View</a>
                  {' | '}
                  <span style={{ color: '#dc2626', cursor: 'pointer' }} onClick={() => setCurrentPreviewUrl(null)}>Remove</span>
                </div>
              )}
              <div
                className={`file-upload-area ${previewFile ? 'has-file' : ''}`}
                style={{ borderColor: '#63e5ff', background: '#f0fdff' }}
                onClick={() => document.getElementById('editPreviewFile').click()}
              >
                <input id="editPreviewFile" type="file" style={{ display: 'none' }}
                  accept=".pdf,.jpg,.png"
                  onChange={e => setPreviewFile(e.target.files[0])} />
                {previewFile ? (
                  <div>
                    <p style={{ fontSize: '24px' }}></p>
                    <p><strong>{previewFile.name}</strong></p>
                    <p className="text-small text-muted">{(previewFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '28px' }}></p>
                    <p>Click to {currentPreviewUrl ? 'change' : 'upload'} preview</p>
                    <p className="text-small text-muted">PDF or Image</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : ' Update Note'}
            </button>
            <button type="button" className="btn btn-secondary"
              onClick={() => navigate('/my-notes')}>
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditNote;