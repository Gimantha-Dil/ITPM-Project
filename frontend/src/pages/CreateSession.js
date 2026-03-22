import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
 
const CreateSession = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', sessionType: 'A', category: 'IT',
    subject: '', price: '0.00', msTeamsLink: '', date: '', startTime: '',
    duration: 60, maxParticipants: 50
  });
  const [errors, setErrors] = useState({});
 
  // ── Today's date string for min date ──────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];
 
  // ── Check if selected date is today (for time restriction) ───────────────
  const isToday = form.date === todayStr;
 
  // ── Current time HH:MM for min time when date = today ────────────────────
  const getNowTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };
 
  // ── Title: letters, numbers, spaces, basic punctuation only ──────────────
  const handleTitleChange = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9\s.,\-()']/g, '');
    setForm(prev => ({ ...prev, title: cleaned }));
  };
 
  // ── Subject: letters, numbers, spaces only ───────────────────────────────
  const handleSubjectChange = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
    setForm(prev => ({ ...prev, subject: cleaned }));
  };
 
  // ── Price: numbers and one dot only ──────────────────────────────────────
  const handlePriceKeyDown = (e) => {
    if (
      !/[0-9.]/.test(e.key) &&
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
    ) {
      e.preventDefault();
    }
    // Block second dot
    if (e.key === '.' && String(form.price).includes('.')) {
      e.preventDefault();
    }
  };
 
  const handlePriceChange = (e) => {
    let cleaned = e.target.value.replace(/[^0-9.]/g, '');
    // Only one dot allowed
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts[1];
    }
    // Max 2 decimal places while typing
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    }
    setForm(prev => ({ ...prev, price: cleaned }));
  };
 
  // Auto-format to 567.00 when field loses focus
  const handlePriceBlur = () => {
    const val = parseFloat(form.price) || 0;
    setForm(prev => ({ ...prev, price: val.toFixed(2) }));
  };
 
  // Select all text when price field focused (easy to retype)
  const handlePriceFocus = (e) => {
    e.target.select();
  };
 
  // ── MS Teams Link ─────────────────────────────────────────────────────────
  const handleLinkChange = (e) => {
    setForm(prev => ({ ...prev, msTeamsLink: e.target.value }));
  };
 
  const validateLink = (url) => {
    if (!url) return true;
    return url.startsWith('https://') || url.startsWith('http://');
  };
 
  // ── Duration: numbers only, 1–480 mins ───────────────────────────────────
  const handleDurationKeyDown = (e) => {
    if (
      !/[0-9]/.test(e.key) &&
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
    ) {
      e.preventDefault();
    }
  };
 
  const handleDurationChange = (e) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '');
    let val = cleaned === '' ? '' : parseInt(cleaned);
    if (val > 480) val = 480;
    setForm(prev => ({ ...prev, duration: val }));
  };
 
  const handleDurationBlur = () => {
    let val = parseInt(form.duration) || 1;
    if (val < 1) val = 1;
    if (val > 480) val = 480;
    setForm(prev => ({ ...prev, duration: val }));
  };
 
  // ── Max Participants: numbers only, 1–500 ────────────────────────────────
  const handleMaxKeyDown = (e) => {
    if (
      !/[0-9]/.test(e.key) &&
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
    ) {
      e.preventDefault();
    }
  };
 
  const handleMaxChange = (e) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '');
    let val = cleaned === '' ? '' : parseInt(cleaned);
    if (val > 500) val = 500;
    setForm(prev => ({ ...prev, maxParticipants: val }));
  };
 
  const handleMaxBlur = () => {
    let val = parseInt(form.maxParticipants) || 1;
    if (val < 1) val = 1;
    if (val > 500) val = 500;
    setForm(prev => ({ ...prev, maxParticipants: val }));
  };
 
  // ── Date: reset time when date changes ───────────────────────────────────
  const handleDateChange = (e) => {
    setForm(prev => ({ ...prev, date: e.target.value, startTime: '' }));
  };
 
  // ── Generic handler ───────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
 
  // ── Validate all fields ───────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
 
    if (!form.title.trim()) {
      newErrors.title = 'Session title is required';
    }
 
    if (!form.date) {
      newErrors.date = 'Date is required';
    } else if (form.date < todayStr) {
      newErrors.date = 'Cannot select a past date';
    }
 
    if (!form.startTime) {
      newErrors.startTime = 'Start time is required';
    } else if (isToday && form.startTime < getNowTime()) {
      newErrors.startTime = 'Cannot select a past time for today';
    }
 
    if (form.msTeamsLink && !validateLink(form.msTeamsLink)) {
      newErrors.msTeamsLink = 'Enter a valid URL (https://...)';
    }
 
    if (parseFloat(form.price) < 0) {
      newErrors.price = 'Price cannot be negative';
    }
 
    if (!form.duration || form.duration < 1) {
      newErrors.duration = 'Duration must be at least 1 minute';
    }
 
    if (!form.maxParticipants || form.maxParticipants < 1) {
      newErrors.maxParticipants = 'Must have at least 1 participant';
    }
 
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
 
  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/kuppi', {
        ...form,
        price: parseFloat(form.price) || 0,
      });
      toast.success('Session created successfully!');
      navigate('/my-sessions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };
 
  return (
<div style={{ maxWidth: 700 }}>
<div className="page-header">
<h1 className="page-title">Create Kuppi Session</h1>
</div>
 
      <div className="card">
<form onSubmit={handleSubmit} noValidate>
 
          {/* Session Title */}
<div className="form-group">
<label>Session Title *</label>
<input
              type="text"
              name="title"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              value={form.title}
              onChange={handleTitleChange}
              placeholder="e.g., Data Structures Revision"
            />
            {errors.title && <p className="error-text">{errors.title}</p>}
</div>
 
          {/* Description */}
<div className="form-group">
<label>Description</label>
<textarea
              name="description"
              className="form-textarea"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe what will be covered..."
            />
</div>
 
          {/* Session Type & Category */}
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
</div>
 
          {/* Subject & Price */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
<div className="form-group">
<label>Subject</label>
<input
                type="text"
                name="subject"
                className="form-input"
                value={form.subject}
                onChange={handleSubjectChange}
                placeholder="e.g., DSA"
              />
</div>
<div className="form-group">
<label>Price (Rs.)</label>
<input
                type="text"
                inputMode="decimal"
                name="price"
                className={`form-input ${errors.price ? 'input-error' : ''}`}
                value={form.price}
                onChange={handlePriceChange}
                onKeyDown={handlePriceKeyDown}
                onBlur={handlePriceBlur}
                onFocus={handlePriceFocus}
                placeholder="0.00"
              />
              {errors.price && <p className="error-text">{errors.price}</p>}
</div>
</div>
 
          {/* MS Teams Link */}
<div className="form-group">
<label>MS Teams Link</label>
<input
              type="text"
              name="msTeamsLink"
              className={`form-input ${errors.msTeamsLink ? 'input-error' : ''}`}
              value={form.msTeamsLink}
              onChange={handleLinkChange}
              placeholder="https://teams.microsoft.com/..."
            />
            {errors.msTeamsLink && <p className="error-text">{errors.msTeamsLink}</p>}
</div>
 
          {/* Date, Start Time, Duration */}
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
<div className="form-group">
<label>Date *</label>
<input
                type="date"
                name="date"
                className={`form-input ${errors.date ? 'input-error' : ''}`}
                value={form.date}
                onChange={handleDateChange}
                min={todayStr}
              />
              {errors.date && <p className="error-text">{errors.date}</p>}
</div>
<div className="form-group">
<label>Start Time *</label>
<input
                type="time"
                name="startTime"
                className={`form-input ${errors.startTime ? 'input-error' : ''}`}
                value={form.startTime}
                onChange={handleChange}
                min={isToday ? getNowTime() : undefined}
              />
              {errors.startTime && <p className="error-text">{errors.startTime}</p>}
</div>
<div className="form-group">
<label>Duration (mins)</label>
<input
                type="text"
                inputMode="numeric"
                name="duration"
                className={`form-input ${errors.duration ? 'input-error' : ''}`}
                value={form.duration}
                onChange={handleDurationChange}
                onKeyDown={handleDurationKeyDown}
                onBlur={handleDurationBlur}
              />
              {errors.duration && <p className="error-text">{errors.duration}</p>}
</div>
</div>
 
          {/* Max Participants */}
<div className="form-group">
<label>Max Participants</label>
<input
              type="text"
              inputMode="numeric"
              name="maxParticipants"
              className={`form-input ${errors.maxParticipants ? 'input-error' : ''}`}
              value={form.maxParticipants}
              onChange={handleMaxChange}
              onKeyDown={handleMaxKeyDown}
              onBlur={handleMaxBlur}
            />
            {errors.maxParticipants && <p className="error-text">{errors.maxParticipants}</p>}
</div>
 
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating...' : 'Create Session'}
</button>
</form>
</div>
</div>
  );
};
 
export default CreateSession;