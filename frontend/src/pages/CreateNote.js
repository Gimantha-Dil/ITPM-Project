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
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      data.append('file', file);

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
      <h1 className="page-title mb-4"> Upload New Note</h1>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input type="text" className="form-input" value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Data Structures Complete Notes" />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea className="form-textarea" value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})} required placeholder="Describe your notes..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Category *</label>
              <select className="form-select" value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})} required>
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
              <input type="text" className="form-input" value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})} required placeholder="e.g. DSA" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Price (LKR) *</label>
              <input type="number" className="form-input" value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})} required min="0" placeholder="0 for free" />
            </div>
            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input type="text" className="form-input" value={formData.tags}
                onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="e.g. exam, semester2" />
            </div>
          </div>

          <div className="form-group">
            <label>Upload File * (Max 10MB)</label>
            <div className={`file-upload-area ${file ? 'has-file' : ''}`} onClick={() => document.getElementById('noteFile').click()}>
              <input id="noteFile" type="file" style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.png,.gif"
                onChange={e => setFile(e.target.files[0])} />
              {file ? (
                <div>
                  <p style={{ fontSize: '24px' }}>✅</p>
                  <p><strong>{file.name}</strong></p>
                  <p className="text-small text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '36px' }}>📁</p>
                  <p>Click to select file</p>
                  <p className="text-small text-muted">PDF, DOC, PPT, XLS, TXT, Images</p>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            <FiUpload /> {loading ? 'Uploading...' : 'Upload Note'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateNote;
