import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const EditSession = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    title: '', description: '', sessionType: 'A', category: 'IT',
    subject: '', price: 0, msTeamsLink: '', date: '', startTime: '',
    duration: 60, maxParticipants: 50
  });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/kuppi/${id}`);
        const s = res.data;
        setForm({
          title: s.title || '',
          description: s.description || '',
          sessionType: s.sessionType || 'A',
          category: s.category || 'IT',
          subject: s.subject || '',
          price: s.price || 0,
          msTeamsLink: s.msTeamsLink || '',
          date: s.date ? s.date.split('T')[0] : '',
          startTime: s.startTime || '',
          duration: s.duration || 60,
          maxParticipants: s.maxParticipants || 50
        });
      } catch (err) {
        toast.error('failed to load session');
        navigate('/my-sessions');
      } finally {
        setFetching(false);
      }
    };
    fetchSession();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/kuppi/${id}`, form);
      toast.success('Session update successfully!');
      navigate('/my-sessions');
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
        <h1 className="page-title"> Edit Session</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Session Title *</label>
            <input type="text" name="title" className="form-input"
              value={form.title} onChange={handleChange} required
              placeholder="e.g., Data Structures Revision" />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" className="form-textarea"
              value={form.description} onChange={handleChange}
              placeholder="Describe what will be covered..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            <div className="form-group">
              <label>Session Type *</label>
              <select name="sessionType" className="form-select"
                value={form.sessionType} onChange={handleChange}>
                <option value="A">Type A - Free</option>
                <option value="B">Type B - Paid Individual</option>
                <option value="C">Type C - Paid Group</option>
                <option value="D">Type D - Premium</option>
              </select>
            </div>

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
                placeholder="e.g., Data Structures" />
            </div>

            <div className="form-group">
              <label>Price (LKR) — 0 = Free</label>
              <input type="number" name="price" className="form-input"
                value={form.price} onChange={handleChange} min="0" />
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input type="date" name="date" className="form-input"
                value={form.date} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Start Time *</label>
              <input type="time" name="startTime" className="form-input"
                value={form.startTime} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <input type="number" name="duration" className="form-input"
                value={form.duration} onChange={handleChange} min="15" />
            </div>

            <div className="form-group">
              <label>Max Participants</label>
              <input type="number" name="maxParticipants" className="form-input"
                value={form.maxParticipants} onChange={handleChange} min="1" />
            </div>

          </div>

          <div className="form-group">
            <label>MS Teams Link</label>
            <input type="url" name="msTeamsLink" className="form-input"
              value={form.msTeamsLink} onChange={handleChange}
              placeholder="https://teams.microsoft.com/..." />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : ' Update Session'}
            </button>
            <button type="button" className="btn btn-secondary"
              onClick={() => navigate('/my-sessions')}>
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditSession;