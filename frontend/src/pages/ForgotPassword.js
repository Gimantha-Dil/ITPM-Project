import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  const DOMAIN = '@my.sliit.lk';

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  // Step 1 — send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      toast.success('OTP sent to your email!');
      setStep(2);
      setCountdown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      inputRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split('')); inputRefs.current[5]?.focus(); }
  };

  // Step 2 — verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setStep(3);
  };

  // Step 3 — reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Minimum 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { email, otp: otp.join(''), newPassword });
      toast.success('Password reset successful!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
      if (err.response?.data?.message?.includes('OTP')) setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      toast.success('OTP resent!');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      toast.error('Resend failed');
    } finally {
      setLoading(false);
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

        {/* Step 1 — Email */}
        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48 }}></div>
              <h1 style={{ color: 'var(--primary)' }}>Forgot Password</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Enter your SLIIT email to receive an OTP</p>
            </div>
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label>SLIIT Email</label>
                <input
                  type="text"
                  className="form-input"
                  value={email}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (val.endsWith(DOMAIN)) val = val.slice(0, -DOMAIN.length);
                    const atIdx = val.indexOf('@');
                    if (atIdx !== -1) val = val.slice(0, atIdx);
                    const cleaned = val.replace(/[^a-zA-Z0-9]/g, '');
                    setEmail(cleaned ? cleaned + DOMAIN : '');
                  }}
                  placeholder="IT23365478@my.sliit.lk"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Sending...' : ' Send OTP'}
              </button>
            </form>
            <p className="text-center mt-4" style={{ fontSize: 14 }}>
              <Link to="/login" className="link">← Back to Login</Link>
            </p>
          </>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48 }}></div>
              <h1 style={{ color: 'var(--primary)' }}>Enter OTP</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                Sent to <strong style={{ color: 'var(--primary-light)' }}>{email}</strong>
              </p>
              <div style={{ background: 'rgba(255,193,7,0.2)', border: '1px solid #fbbf24', borderRadius: 10, padding: '10px 14px', marginTop: 8 }}>
                <p style={{ color: '#fbbf24', fontSize: 13, margin: 0, textAlign: 'center' }}>
                   If you don't see the email in your inbox, please check your <strong>Junk / Spam</strong> folder.
                </p>
              </div>
            </div>
            <form onSubmit={handleVerifyOtp}>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }} onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => inputRefs.current[idx] = el}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(e.target.value, idx)}
                    onKeyDown={e => handleOtpKeyDown(e, idx)}
                    style={{
                      width: 48, height: 56, textAlign: 'center', fontSize: 24, fontWeight: 700,
                      borderRadius: 12, border: `2px solid ${digit ? '#0ab5d6' : '#b1f2ff'}`,
                      background: '#fff', color: '#0a4a57', outline: 'none',
                    }}
                  />
                ))}
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                 Verify OTP
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14 }}>
              {countdown > 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>Resend in <strong style={{ color: 'var(--primary)' }}>{countdown}s</strong></p>
              ) : (
                <button onClick={handleResend} disabled={loading}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                   Resend OTP
                </button>
              )}
            </div>
          </>
        )}

        {/* Step 3 — New Password */}
        {step === 3 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48 }}></div>
              <h1 style={{ color: 'var(--primary)' }}>New Password</h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Set your new password</p>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    style={{ paddingRight: 40 }}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 18 }}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              {newPassword.length > 0 && (() => {
                let strength = { label: 'Weak', color: '#dc2626', width: '33%' };
                let score = 0;
                if (newPassword.length >= 8) score++;
                if (/[A-Z]/.test(newPassword)) score++;
                if (/[0-9]/.test(newPassword)) score++;
                if (/[^a-zA-Z0-9]/.test(newPassword)) score++;
                if (score >= 3) strength = { label: 'Strong', color: '#16a34a', width: '100%' };
                else if (score >= 2) strength = { label: 'Medium', color: '#d97706', width: '66%' };
                return (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: 3, transition: 'all 0.3s' }} />
                    </div>
                    <p style={{ fontSize: 12, color: strength.color, margin: 0, fontWeight: 600 }}>{strength.label}</p>
                  </div>
                );
              })()}
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;