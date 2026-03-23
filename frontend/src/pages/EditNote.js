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
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    title: '', description: '', category: 'IT', subject: '', price: '0.00', tags: ''
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
          price: n.price != null ? parseFloat(n.price).toFixed(2) : '0.00',
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

  const handleTitleChange = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9\s.,\-()']/g, '');
    setForm(prev => ({ ...prev, title: cleaned }));
  };

  const handleSubjectChange = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
    setForm(prev => ({ ...prev, subject: cleaned }));
  };

  const handleTagsChange = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z0-9\s,]/g, '');
    setForm(prev => ({ ...prev, tags: cleaned }));
  };

  const handlePriceKeyDown = (e) => {
    if (
      !/[0-9.]/.test(e.key) &&
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
    ) {
      e.preventDefault();
    }
    if (e.key === '.' && String(form.price).includes('.')) {
      e.preventDefault();
    }
  };

  const handlePriceChange = (e) => {
    let cleaned = e.target.value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts[1];
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    }
    setForm(prev => ({ ...prev, price: cleaned }));
  };

  const handlePriceBlur = () => {
    const val = parseFloat(form.price) || 0;
    setForm(prev => ({ ...prev, price: val.toFixed(2) }));
  };

  const handlePriceFocus = (e) => e.target.select();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = 'Note title is required';
    } else if (form.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!form.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (form.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!form.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (form.price === '' || isNaN(parseFloat(form.price))) {
      newErrors.price = 'Enter a valid price';
    } else if (parseFloat(form.price) < 0) {
      newErrors.price = 'Price cannot be negative';
    }

    if (form.tags.trim()) {
      const tagList = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length === 0) {
        newErrors.tags = 'Enter at least one valid tag';
      } else if (tagList.some(t => t.length < 2)) {
        newErrors.tags = 'Each tag must be at least 2 characters';
      } else if (tagList.length > 10) {
        newErrors.tags = 'Maximum 10 tags allowed';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.put(`/notes/${id}`, {
        ...form,
        price: parseFloat(form.price) || 0,
        tags: form.tags
          ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
          : []
      });
      toast.success('Note updated successfully!');
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
        <form onSubmit={handleSubmit} noValidate>

          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              value={form.title}
              onChange={handleTitleChange}
              placeholder="Note title"
            />
            {errors.title && <p className="error-text">{errors.title}</p>}
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              className={`form-textarea ${errors.description ? 'input-error' : ''}`}
              value={form.description}
              onChange={handleChange}
              placeholder="Note description"
            />
            {errors.description && <p className="error-text">{errors.description}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                className="form-select"
                value={form.category}
                onChange={handleChange}
              >
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
                name="subject"
                className={`form-input ${errors.subject ? 'input-error' : ''}`}
                value={form.subject}
                onChange={handleSubjectChange}
                placeholder="Subject name"
              />
              {errors.subject && <p className="error-text">{errors.subject}</p>}
            </div>

            <div className="form-group">
              <label>Price (LKR) — 0 = Free</label>
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

            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input
                type="text"
                name="tags"
                className={`form-input ${errors.tags ? 'input-error' : ''}`}
                value={form.tags}
                onChange={handleTagsChange}
                placeholder="SQL, MongoDB, Oracle"
              />
              {errors.tags && <p className="error-text">{errors.tags}</p>}
            </div>

          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Update Note'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/my-notes')}
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditNote;