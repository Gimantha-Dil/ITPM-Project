import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const VerifyOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) navigate('/register');
  }, [email]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp: code });
      toast.success('Email verified! Welcome!');
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.href = '/';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await axios.post(`${API_URL}/auth/resend-otp`, { email });
      toast.success('OTP resent!');
      setCountdown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resend failed');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      backgroundImage: "url('/main.jpeg')",
      backgroundSize: 'cover', backgroundPosition: 'center',
      minHeight: '100vh', width: '100vw', position: 'fixed',
      top: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="auth-container" style={{ maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>📧</div>
          <h1 style={{ color: 'var(--primary)', marginBottom: 8 }}>Verify Email</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center' }}>
            OTP sent to <strong style={{ color: '#000', background: 'rgba(255,255,255,0.9)', padding: '2px 8px', borderRadius: 6 }}>{email}</strong>
          </p>
          <div style={{ background: 'rgba(255,193,7,0.2)', border: '1px solid #fbbf24', borderRadius: 10, padding: '10px 14px', marginTop: 8, textAlign: 'center' }}>
            <p style={{ color: '#fbbf24', fontSize: 13, margin: 0 }}>
              ⚠️ If you don't see the email in your inbox, please check your <strong>Junk / Spam</strong> folder.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ✅ FIX: OTP boxes - digits vertically & horizontally centered */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
            }}
            onPaste={handlePaste}
          >
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => inputRefs.current[idx] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(e.target.value, idx)}
                onKeyDown={e => handleKeyDown(e, idx)}
                style={{
                  width: 48,
                  height: 56,
                  textAlign: 'center',
                  fontSize: 24,
                  fontWeight: 700,
                  borderRadius: 12,
                  border: `2px solid ${digit ? '#0ab5d6' : '#b1f2ff'}`,
                  background: '#fff',
                  color: '#0a4a57',
                  outline: 'none',
                  transition: 'border 0.2s',
                  // ✅ Fix: digit box middle එකට center කරනවා
                  lineHeight: '56px',
                  padding: 0,
                  boxSizing: 'border-box',
                  display: 'block',
                }}
              />
            ))}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Verifying...' : '✅ Verify OTP'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
          {countdown > 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>Resend OTP in <strong style={{ color: 'var(--primary)' }}>{countdown}s</strong></p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
            >
              {resending ? 'Sending...' : '🔄 Resend OTP'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;