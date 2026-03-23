import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiClock } from 'react-icons/fi';
import TimePickerModal from '../components/TimePickerModal';

const EditSession = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', sessionType: 'A', category: 'IT',
    subject: '', price: '0.00', msTeamsLink: '', date: '', startTime: '',
    duration: 60, maxParticipants: 50
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = form.date === todayStr;

  const getNowTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // Convert "HH:MM AM/PM" → "HH:MM" 24h for validation & backend
  const to24h = (val) => {
    if (!val) return '';
    if (!val.includes(' ')) return val;
    const [time, ap] = val.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (ap === 'AM' && h === 12) h = 0;
    if (ap === 'PM' && h !== 12) h += 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Convert stored "HH:MM" 24h → "HH:MM AM/PM" for display
  const to12h = (val) => {
    if (!val) return '';
    const [hh, mm] = val.split(':').map(Number);
    const ap = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ap}`;
  };

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
          price: s.price != null ? parseFloat(s.price).toFixed(2) : '0.00',
          msTeamsLink: s.msTeamsLink || '',
          date: s.date ? s.date.split('T')[0] : '',
          startTime: s.startTime ? to12h(s.startTime) : '',
          duration: s.duration || 60,
          maxParticipants: s.maxParticipants || 50
        });
      } catch (err) {
        toast.error('Failed to load session');
        navigate('/my-sessions');
      } finally {
        setFetching(false);
      }
    };
    fetchSession();
  }, [id]);

  const handleTitleChange = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9\s.,\-()']/g, '');
    setForm(prev => ({ ...prev, title: cleaned }));
  };

  const handleSubjectChange = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
    setForm(prev => ({ ...prev, subject: cleaned }));
  };

  const handlePriceKeyDown = (e) => {
    if (!/[0-9.]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key))
      e.preventDefault();
    if (e.key === '.' && String(form.price).includes('.')) e.preventDefault();
  };

  const handlePriceChange = (e) => {
    let cleaned = e.target.value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts[1];
    if (parts.length === 2 && parts[1].length > 2)
      cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    setForm(prev => ({ ...prev, price: cleaned }));
  };

  const handlePriceBlur = () => {
    const val = parseFloat(form.price) || 0;
    setForm(prev => ({ ...prev, price: val.toFixed(2) }));
  };

  const handlePriceFocus = (e) => e.target.select();

  const handleLinkChange = (e) => setForm(prev => ({ ...prev, msTeamsLink: e.target.value }));
  const validateLink = (url) => !url || url.startsWith('https://') || url.startsWith('http://');

  const handleDurationKeyDown = (e) => {
    if (!/[0-9]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key))
      e.preventDefault();
  };
  const handleDurationChange = (e) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '');
    let val = cleaned === '' ? '' : parseInt(cleaned);
    if (val > 480) val = 480;
    setForm(prev => ({ ...prev, duration: val }));
  };
  const handleDurationBlur = () => {
    let val = parseInt(form.duration) || 1;
    if (val < 1) val = 1; if (val > 480) val = 480;
    setForm(prev => ({ ...prev, duration: val }));
  };

  const handleMaxKeyDown = (e) => {
    if (!/[0-9]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key))
      e.preventDefault();
  };
  const handleMaxChange = (e) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '');
    let val = cleaned === '' ? '' : parseInt(cleaned);
    if (val > 500) val = 500;
    setForm(prev => ({ ...prev, maxParticipants: val }));
  };
  const handleMaxBlur = () => {
    let val = parseInt(form.maxParticipants) || 1;
    if (val < 1) val = 1; if (val > 500) val = 500;
    setForm(prev => ({ ...prev, maxParticipants: val }));
  };

  const handleDateChange = (e) => setForm(prev => ({ ...prev, date: e.target.value, startTime: '' }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'sessionType' && value === 'A') {
      setForm(prev => ({ ...prev, sessionType: value, price: '0.00' }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const isFreeSession = form.sessionType === 'A';

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Session title is required';
    else if (form.title.trim().length < 3) newErrors.title = 'Title must be at least 3 characters';
    if (!form.subject.trim()) newErrors.subject = 'Subject is required';
    if (!form.date) newErrors.date = 'Date is required';
    else if (form.date < todayStr) newErrors.date = 'Cannot select a past date';
    if (!form.startTime) newErrors.startTime = 'Start time is required';
    else if (isToday && to24h(form.startTime) < getNowTime())
      newErrors.startTime = 'Cannot select a past time for today';
    if (form.msTeamsLink && !validateLink(form.msTeamsLink))
      newErrors.msTeamsLink = 'Enter a valid URL (https://...)';
    if (!isFreeSession) {
      if (form.price === '' || isNaN(parseFloat(form.price))) newErrors.price = 'Enter a valid price';
      else if (parseFloat(form.price) < 0) newErrors.price = 'Price cannot be negative';
    }
    if (!form.duration || form.duration < 1) newErrors.duration = 'Duration must be at least 1 minute';
    if (!form.maxParticipants || form.maxParticipants < 1) newErrors.maxParticipants = 'Must have at least 1 participant';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.put(`/kuppi/${id}`, {
        ...form,
        price: parseFloat(form.price) || 0,
        startTime: to24h(form.startTime),
      });
      toast.success('Session updated successfully!');
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
        <h1 className="page-title">Edit Session</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} noValidate>

          <div className="form-group">
            <label>Session Title *</label>
            <input type="text" name="title"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              value={form.title} onChange={handleTitleChange}
              placeholder="e.g., Data Structures Revision" />
            {errors.title && <p className="error-text">{errors.title}</p>}
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
              <select name="sessionType" className="form-select" value={form.sessionType} onChange={handleChange}>
                <option value="A">Type A - Free</option>
                <option value="B">Type B - Paid Individual</option>
                <option value="C">Type C - Paid Group</option>
                <option value="D">Type D - Premium</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select name="category" className="form-select" value={form.category} onChange={handleChange}>
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
              <input type="text" name="subject"
                className={`form-input ${errors.subject ? 'input-error' : ''}`}
                value={form.subject} onChange={handleSubjectChange}
                placeholder="e.g., Data Structures" />
              {errors.subject && <p className="error-text">{errors.subject}</p>}
            </div>

            <div className="form-group">
              <label>Price (LKR) {isFreeSession && <span style={{ color: '#7c3aed', fontSize: '12px', fontWeight: 500 }}>— Free Session</span>}</label>
              <input type="text" inputMode="decimal" name="price"
                className={`form-input ${errors.price ? 'input-error' : ''}`}
                value={isFreeSession ? '0.00' : form.price}
                onChange={handlePriceChange} onKeyDown={handlePriceKeyDown}
                onBlur={handlePriceBlur} onFocus={handlePriceFocus}
                placeholder="0.00" disabled={isFreeSession}
                style={isFreeSession ? { backgroundColor: '#f3f0ff', color: '#9ca3af', cursor: 'not-allowed' } : {}} />
              {isFreeSession && <p style={{ fontSize: '12px', color: '#7c3aed', marginTop: 4 }}>Type A sessions are always free</p>}
              {errors.price && <p className="error-text">{errors.price}</p>}
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input type="date" name="date"
                className={`form-input ${errors.date ? 'input-error' : ''}`}
                value={form.date} onChange={handleDateChange} min={todayStr} />
              {errors.date && <p className="error-text">{errors.date}</p>}
            </div>

            {/* ── iOS Time Picker trigger ── */}
            <div className="form-group">
              <label>Start Time *</label>
              <div
                className={`form-input ${errors.startTime ? 'input-error' : ''}`}
                onClick={() => setShowTimePicker(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', userSelect: 'none',
                  color: form.startTime ? 'inherit' : '#9ca3af'
                }}
              >
                <span>{form.startTime || 'Select time'}</span>
                <FiClock size={16} style={{ color: '#6b7280' }} />
              </div>
              {errors.startTime && <p className="error-text">{errors.startTime}</p>}
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <input type="text" inputMode="numeric" name="duration"
                className={`form-input ${errors.duration ? 'input-error' : ''}`}
                value={form.duration} onChange={handleDurationChange}
                onKeyDown={handleDurationKeyDown} onBlur={handleDurationBlur} />
              {errors.duration && <p className="error-text">{errors.duration}</p>}
            </div>

            <div className="form-group">
              <label>Max Participants</label>
              <input type="text" inputMode="numeric" name="maxParticipants"
                className={`form-input ${errors.maxParticipants ? 'input-error' : ''}`}
                value={form.maxParticipants} onChange={handleMaxChange}
                onKeyDown={handleMaxKeyDown} onBlur={handleMaxBlur} />
              {errors.maxParticipants && <p className="error-text">{errors.maxParticipants}</p>}
            </div>
          </div>

          <div className="form-group">
            <label>MS Teams Link</label>
            <input type="text" name="msTeamsLink"
              className={`form-input ${errors.msTeamsLink ? 'input-error' : ''}`}
              value={form.msTeamsLink} onChange={handleLinkChange}
              placeholder="https://teams.microsoft.com/..." />
            {errors.msTeamsLink && <p className="error-text">{errors.msTeamsLink}</p>}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Update Session'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/my-sessions')}>
              Cancel
            </button>
          </div>

        </form>
      </div>

      {showTimePicker && (
        <TimePickerModal
          value={form.startTime}
          onConfirm={(val) => { setForm(prev => ({ ...prev, startTime: val })); setShowTimePicker(false); }}
          onCancel={() => setShowTimePicker(false)}
        />
      )}
    </div>
  );
};

export default EditSession;