import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUpload } from 'react-icons/fi';

const CreateNote = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', subject: '', price: '', tags: ''
  });
  const [isFree, setIsFree] = useState(false);
  const [file, setFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePriceTypeChange = (free) => {
    setIsFree(free);
    if (free) {
      setFormData({ ...formData, price: '0.00' });
    } else {
      setFormData({ ...formData, price: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!isFree && (!formData.price || parseFloat(formData.price) <= 0)) {
      toast.error('Please enter a valid price for paid note');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      data.append('file', file);
      if (previewFile) data.append('previewFile', previewFile);

      await api.post('/notes', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Note uploaded successfully!');
      navigate('/my-notes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '700px' }}>
      <h1 className="page-title mb-4">📝 Upload New Note</h1>

      <div className="card">
        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[A-Za-z\s]*$/.test(value))
                  setFormData({ ...formData, title: value });
              }}
              required
              placeholder="e.g. Data Structures Complete Notes"
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea className="form-textarea" value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required placeholder="Describe your notes..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Category *</label>
              <select className="form-select" value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                <option value="">Select</option>
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
              <input
                type="text"
                className="form-input"
                value={formData.subject}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^[A-Za-z0-9\s]*$/.test(value))
                    setFormData({ ...formData, subject: value });
                }}
                required
                placeholder="e.g. DSA"
              />
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

          {/* Price field — only for Paid */}
          {!isFree && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Price (Rs) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d{0,2}$/.test(value))
                      setFormData({ ...formData, price: value });
                  }}
                  onKeyPress={(e) => {
                    if (!/[0-9.]/.test(e.key)) e.preventDefault();
                    if (e.key === '.' && formData.price.includes('.')) e.preventDefault();
                  }}
                  onBlur={() => {
                    if (formData.price)
                      setFormData({ ...formData, price: parseFloat(formData.price).toFixed(2) });
                  }}
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Tags</label>
                <input type="text" className="form-input" value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. exam, semester2" />
              </div>
            </div>
          )}

          {isFree && (
            <div className="form-group">
              <label>Tags</label>
              <input type="text" className="form-input" value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g. exam, semester2" />
            </div>
          )}

          {/* ── Upload Main File ── */}
          <div className="form-group">
            <label>Upload File * (Max 10MB)</label>
            <div className={`file-upload-area ${file ? 'has-file' : ''}`}
              onClick={() => document.getElementById('noteFile').click()}>
              <input id="noteFile" type="file" style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.png,.gif"
                onChange={e => setFile(e.target.files[0])} />
              {file ? (
                <div>
                  <p style={{ fontSize: '24px' }}></p>
                  <p><strong>{file.name}</strong></p>
                  <p className="text-small text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '36px' }}></p>
                  <p>Click to select file</p>
                  <p className="text-small text-muted">PDF, DOC, PPT, XLS, TXT, Images</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Preview File (optional, only for paid) ── */}
          {!isFree && (
            <div className="form-group">
              <label>Preview File <span className="text-muted text-small">(optional — buyers can see this before purchasing)</span></label>
              <div
                className={`file-upload-area ${previewFile ? 'has-file' : ''}`}
                style={{ borderColor: '#63e5ff', background: '#f0fdff' }}
                onClick={() => document.getElementById('previewFile').click()}
              >
                <input id="previewFile" type="file" style={{ display: 'none' }}
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
                    <p style={{ fontSize: '36px' }}></p>
                    <p>Click to upload preview</p>
                    <p className="text-small text-muted">PDF or Image — shown to buyers before purchase</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            <FiUpload /> {loading ? 'Uploading...' : 'Upload Note'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateNote;