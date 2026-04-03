import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff } from 'react-icons/fi';
 
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailInputRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();
 
  const DOMAIN = '@my.sliit.lk';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! ';
    if (hour < 17) return 'Good Afternoon! ';
    if (hour < 21) return 'Good Evening! ';
    return 'Good Night! ';
  };
  const emailRegex = /^(it|eng|bus)\d+@my\.sliit\.lk$/i;
 
  const handleEmailChange = (e) => {
    let val = e.target.value;
    if (val.endsWith(DOMAIN)) val = val.slice(0, val.length - DOMAIN.length);
    const atIndex = val.indexOf('@');
    if (atIndex !== -1) val = val.slice(0, atIndex);
    const cleaned = val.replace(/[^a-zA-Z0-9]/g, '');
    const fullEmail = cleaned ? cleaned + DOMAIN : '';
    setEmail(fullEmail);
    setTimeout(() => {
      if (emailInputRef.current)
        emailInputRef.current.setSelectionRange(cleaned.length, cleaned.length);
    }, 0);
  };
 
  const handleEmailKeyDown = (e) => {
    const input = emailInputRef.current;
    if (!input) return;
    const cursorPos = input.selectionStart;
    const atIndex = email.indexOf('@');
    const safeLength = atIndex === -1 ? email.length : atIndex;
    if (cursorPos > safeLength) {
      if (['Backspace','Delete','ArrowRight','End'].includes(e.key)) {
        e.preventDefault();
        input.setSelectionRange(safeLength, safeLength);
      }
    }
  };
 
  const handleEmailClick = () => {
    const input = emailInputRef.current;
    if (!input) return;
    const atIndex = email.indexOf('@');
    const safeLength = atIndex === -1 ? email.length : atIndex;
    if (input.selectionStart > safeLength)
      input.setSelectionRange(safeLength, safeLength);
  };
 
  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Format: IT/ENG/BUS + student number (e.g. IT23365478@my.sliit.lk)';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Minimum 6 characters required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
 
  const emailPrefix = email.replace(DOMAIN, '');
 
  return (
    <div
      style={{
        backgroundImage: "url('/main.jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="auth-container">
        <h1>{getGreeting()}</h1>
        <p className="subtitle">Login to SLIIT Learning Platform</p>

        <form onSubmit={handleSubmit} noValidate>

          <div className="form-group">
            <label>SLIIT Email</label>
            <input
              ref={emailInputRef}
              type="text"
              className={`form-input ${
                errors.email
                  ? 'input-error'
                  : email && emailRegex.test(email.trim())
                  ? 'input-success'
                  : ''
              }`}
              value={email}
              onChange={handleEmailChange}
              onKeyDown={handleEmailKeyDown}
              onClick={handleEmailClick}
              placeholder="IT23365478@my.sliit.lk"
              autoComplete="off"
              spellCheck={false}
            />
            {emailPrefix && !errors.email && !emailRegex.test(email) && (
              <p className="hint-text">Type your student ID — @my.sliit.lk is added automatically</p>
            )}
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${
                  errors.password
                    ? 'input-error'
                    : password && password.length >= 6
                    ? 'input-success'
                    : ''
                }`}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 18 }}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center mt-2" style={{ fontSize: '14px' }}>
          <Link to="/forgot-password" className="link">Forgot Password?</Link>
        </p>
        <p className="text-center mt-2" style={{ fontSize: '14px' }}>
          Don't have an account?{' '}
          <Link to="/register" className="link">Register</Link>
        </p>
      </div>
    </div>
  );
};
 
export default Login;