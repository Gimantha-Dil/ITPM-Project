import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const emailInputRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  const DOMAIN = '@my.sliit.lk';
  const emailRegex = /^(it|eng|bus)\d+@my\.sliit\.lk$/i;

  const handleNameChange = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setFormData(prev => ({ ...prev, fullName: cleaned }));
  };

  const handleEmailChange = (e) => {
    let val = e.target.value;
    if (val.endsWith(DOMAIN)) val = val.slice(0, val.length - DOMAIN.length);
    const atIndex = val.indexOf('@');
    if (atIndex !== -1) val = val.slice(0, atIndex);
    const cleaned = val.replace(/[^a-zA-Z0-9]/g, '');
    const fullEmail = cleaned ? cleaned + DOMAIN : '';
    setFormData(prev => ({ ...prev, email: fullEmail }));
    setTimeout(() => {
      if (emailInputRef.current)
        emailInputRef.current.setSelectionRange(cleaned.length, cleaned.length);
    }, 0);
  };

  const handleEmailKeyDown = (e) => {
    const input = emailInputRef.current;
    if (!input) return;
    const cursorPos = input.selectionStart;
    const atIndex = formData.email.indexOf('@');
    const safeLength = atIndex === -1 ? formData.email.length : atIndex;
    if (cursorPos > safeLength) {
      if (['Backspace', 'Delete', 'ArrowRight', 'End'].includes(e.key)) {
        e.preventDefault();
        input.setSelectionRange(safeLength, safeLength);
      }
    }
  };

  const handleEmailClick = () => {
    const input = emailInputRef.current;
    if (!input) return;
    const atIndex = formData.email.indexOf('@');
    const safeLength = atIndex === -1 ? formData.email.length : atIndex;
    if (input.selectionStart > safeLength)
      input.setSelectionRange(safeLength, safeLength);
  };

  const handlePhoneChange = (e) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, phoneNumber: cleaned }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return null;
    if (pass.length < 8) return { label: 'Too short — min 8 chars', color: '#E24B4A', width: '15%' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;
    if (score <= 1) return { label: 'Weak — add uppercase or numbers', color: '#E24B4A', width: '33%' };
    if (score <= 2) return { label: 'Medium — try adding symbols', color: '#EF9F27', width: '66%' };
    return { label: 'Strong', color: '#1D9E75', width: '100%' };
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (/[^a-zA-Z\s]/.test(formData.fullName)) {
      newErrors.fullName = 'Name cannot contain numbers or special characters';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Format: IT/ENG/BUS + student number (e.g. IT23365478@my.sliit.lk)';
    }
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (formData.phoneNumber.length !== 10) {
      newErrors.phoneNumber = `${formData.phoneNumber.length}/10 digits — must be exactly 10`;
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Minimum 8 characters required';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Must contain at least one uppercase letter (A-Z)';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Must contain at least one number (0-9)';
    } else if (!/[^a-zA-Z0-9]/.test(formData.password)) {
      newErrors.password = 'Must contain at least one special character (!@#$...)';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber,
        password: formData.password,
      });
      toast.success('OTP sent to your email! Please verify.');
      navigate('/verify-otp', { state: { email: formData.email.trim() } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(formData.password);
  const emailPrefix = formData.email.replace(DOMAIN, '');

  return (
    <div
      style={{
        backgroundImage: "url('/main.jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '20px',
        paddingBottom: '20px',
      }}
    >
      <div className="auth-container">
        <div className="logo-emoji"></div>
        <h1>Create Account</h1>
        <p className="subtitle">Join SLIIT Learning Platform</p>

        <form onSubmit={handleSubmit} noValidate>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              className={`form-input ${
                errors.fullName
                  ? 'input-error'
                  : formData.fullName && !/[^a-zA-Z\s]/.test(formData.fullName)
                  ? 'input-success'
                  : ''
              }`}
              value={formData.fullName}
              onChange={handleNameChange}
              placeholder="John Doe"
            />
            {errors.fullName && <p className="error-text">{errors.fullName}</p>}
          </div>

          <div className="form-group">
            <label>SLIIT Email</label>
            <input
              ref={emailInputRef}
              type="text"
              className={`form-input ${
                errors.email
                  ? 'input-error'
                  : formData.email && emailRegex.test(formData.email.trim())
                  ? 'input-success'
                  : ''
              }`}
              value={formData.email}
              onChange={handleEmailChange}
              onKeyDown={handleEmailKeyDown}
              onClick={handleEmailClick}
              placeholder="IT23365478@my.sliit.lk"
              autoComplete="off"
              spellCheck={false}
            />
            {emailPrefix && !errors.email && !emailRegex.test(formData.email) && (
              <p className="hint-text">Type your student ID — @my.sliit.lk is added automatically</p>
            )}
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              inputMode="numeric"
              className={`form-input ${
                errors.phoneNumber
                  ? 'input-error'
                  : formData.phoneNumber.length === 10
                  ? 'input-success'
                  : ''
              }`}
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              placeholder="07XXXXXXXX"
              maxLength={10}
            />
            {errors.phoneNumber ? (
              <p className="error-text">{errors.phoneNumber}</p>
            ) : formData.phoneNumber ? (
              <p className="hint-text">{formData.phoneNumber.length}/10 digits</p>
            ) : null}
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${
                  errors.password
                    ? 'input-error'
                    : formData.password && formData.password.length >= 6
                    ? 'input-success'
                    : ''
                }`}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min 8 chars, uppercase, number, special char"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 18 }}
              >
                {showPassword ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>
            {formData.password && strength && (
              <>
                <div style={{
                  height: '4px',
                  background: '#e5e7eb',
                  borderRadius: '2px',
                  marginTop: '8px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: strength.width,
                    background: strength.color,
                    borderRadius: '2px',
                    transition: 'width 0.3s ease, background 0.3s ease',
                  }} />
                </div>
                <p style={{ fontSize: '12px', color: strength.color, marginTop: '4px' }}>
                  {strength.label}
                </p>
              </>
            )}
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                className={`form-input ${
                  errors.confirmPassword
                    ? 'input-error'
                    : formData.confirmPassword && formData.password === formData.confirmPassword
                    ? 'input-success'
                    : ''
                }`}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 18 }}
              >
                {showConfirm ? <FiEye /> : <FiEyeOff />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="error-text">{errors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center mt-4" style={{ fontSize: '13px', color: 'var(--text-secondary, rgba(255,255,255,0.75))' }}>
          Bank details are not required now — add them later when you want to sell.
        </p>
        <p className="text-center mt-2" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
          Already have an account?{' '}
          <Link to="/login" className="link">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;