import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.endsWith('@my.sliit.lk')) {
      toast.error('Only SLIIT email addresses (@my.sliit.lk) are allowed');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password
      });
      toast.success('Registration successful! Welcome!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="logo-emoji">🎓</div>
      <h1>Create Account</h1>
      <p className="subtitle">Join SLIIT Learning Platform</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" className="form-input" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="John Doe" required />
        </div>

        <div className="form-group">
          <label>SLIIT Email</label>
          <input type="email" className="form-input" name="email" value={formData.email} onChange={handleChange} placeholder="your.name@my.sliit.lk" required />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input type="text" className="form-input" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="07X XXXX XXX" required />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input type="password" className="form-input" name="password" value={formData.password} onChange={handleChange} placeholder="Min 6 characters" required />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input type="password" className="form-input" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm password" required />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <p className="text-center mt-4" style={{ fontSize: '14px', color: '#6b7280' }}>
        ℹ️ Bank details are NOT required now. Add them later when you want to sell.
      </p>
      <p className="text-center mt-2" style={{ fontSize: '14px' }}>
        Already have an account? <Link to="/login" className="link">Login</Link>
      </p>
    </div>
  );
};

export default Register;
