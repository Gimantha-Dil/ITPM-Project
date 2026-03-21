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
  const [form, setForm] = useState({
    title: '', description: '', category: 'IT', subject: '', price: 0, tags: ''
  });

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await api.get(`/notes/${id}`);
        const n = res.data;
        setForm({
          title: n.title || '',
          description: n.description || '',
          category: n.category || 'IT',
          subject: n.subject || '',
          price: n.price || 0,
          tags: n.tags?.join(', ') || ''
        });
      } catch (err) {
        toast.error('Note load කරන්න failed');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/notes/${id}`, form);
      toast.success('Note update වුණා! ✅');
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
        <h1 className="page-title">✏️ Edit Note</h1>
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

            <div className="form-group">
              <label>Price (LKR) — 0 = Free</label>
              <input type="number" name="price" className="form-input"
                value={form.price} onChange={handleChange} min="0" />
            </div>

            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input type="text" name="tags" className="form-input"
                value={form.tags} onChange={handleChange}
                placeholder="SQL, MongoDB, Oracle" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : '✏️ Update Note'}
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