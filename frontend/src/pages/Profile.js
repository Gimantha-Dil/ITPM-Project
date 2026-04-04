import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import BankDetailsModal from '../components/BankDetailsModal';

const Profile = () => {
  const { user, api, updateUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', phoneNumber: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState({ current: false, newp: false, confirm: false });
  const [deleteStep, setDeleteStep] = useState(0); // 0=btn, 1=otp sent, 2=enter otp
  const [deleteOtp, setDeleteOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (location.state?.showBankModal) {
      setShowBankModal(true);
    }
  }, [location.state]);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setProfile(res.data);
      setForm({ fullName: res.data.fullName, phoneNumber: res.data.phoneNumber || '' });
    } catch (err) {
      toast.error('Failed to load profile');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      toast.success('Profile updated!');
      setProfile(res.data.user);
      if (updateUser) updateUser(res.data.user);
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (passwords.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleSendDeleteOtp = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone!')) return;
    setSendingOtp(true);
    try {
      await api.post('/auth/send-delete-otp');
      toast.success('OTP sent to your email!');
      setDeleteStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteOtp || deleteOtp.length !== 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }
    setDeleting(true);
    try {
      await api.delete('/auth/delete-account', { data: { otp: deleteOtp } });
      toast.success('Account deleted successfully');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
      setDeleting(false);
    }
  };

  const handleBankDetailsSaved = () => {
    fetchProfile();
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>

      {/* Profile Info */}
      <div className="profile-section">
        <h2>Personal Information</h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" className="form-input" value={form.fullName}
              onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                setForm({ ...form, fullName: val });
              }} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-input" value={profile?.email || ''}
              disabled style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }} />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="text" className="form-input" value={form.phoneNumber}
              inputMode="numeric"
              maxLength={10}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                setForm({ ...form, phoneNumber: val });
              }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Bank Details */}
      <div className="profile-section">
        <h2> Bank Details</h2>
        {profile?.bankName ? (
          <div>
            <div className="bank-details-box" style={{ marginTop: 0 }}>
              <div className="bank-detail-row">
                <span className="bank-detail-label">Bank</span>
                <span className="bank-detail-value">{profile.bankName}</span>
              </div>
              <div className="bank-detail-row">
                <span className="bank-detail-label">Account Number</span>
                <span className="bank-detail-value">{profile.bankAccountNumber}</span>
              </div>
              <div className="bank-detail-row">
                <span className="bank-detail-label">Branch</span>
                <span className="bank-detail-value">{profile.bankBranch}</span>
              </div>
              <div className="bank-detail-row">
                <span className="bank-detail-label">Account Holder</span>
                <span className="bank-detail-value">{profile.accountHolderName}</span>
              </div>
            </div>
            <button className="btn btn-outline" onClick={() => setShowBankModal(true)} style={{ marginTop: 12 }}>
              Edit Bank Details
            </button>
          </div>
        ) : (
          <div>
            <p className="text-muted" style={{ marginBottom: 12 }}>
              No bank details added yet. Add them to start selling notes and hosting paid sessions.
            </p>
            <button className="btn btn-primary" onClick={() => setShowBankModal(true)}>
              Add Bank Details
            </button>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="profile-section">
        <h2>Change Password</h2>
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass.current ? 'text' : 'password'} className="form-input"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                style={{ paddingRight: 40 }} required />
              <button type="button" onClick={() => setShowPass(p => ({ ...p, current: !p.current }))}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 18 }}>
                {showPass.current ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass.newp ? 'text' : 'password'} className="form-input"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                style={{ paddingRight: 40 }} required />
              <button type="button" onClick={() => setShowPass(p => ({ ...p, newp: !p.newp }))}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 18 }}>
                {showPass.newp ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass.confirm ? 'text' : 'password'} className="form-input"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                style={{ paddingRight: 40 }} required />
              <button type="button" onClick={() => setShowPass(p => ({ ...p, confirm: !p.confirm }))}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 18 }}>
                {showPass.confirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Change Password</button>
        </form>
      </div>

      {/* ── Delete Account ── */}
      <div className="profile-section" style={{ borderTop: '2px solid #fee2e2', paddingTop: 20 }}>
        <h2 style={{ color: '#dc2626' }}> Danger Zone</h2>
        <p className="text-muted" style={{ marginBottom: 16, fontSize: 14 }}>
          Deleting your account will remove all your data, notes, and sessions. This cannot be undone!
        </p>

        {deleteStep === 0 && (
          <button
            className="btn btn-danger"
            onClick={handleSendDeleteOtp}
            disabled={sendingOtp}
          >
            {sendingOtp ? 'Sending OTP...' : ' Delete My Account'}
          </button>
        )}

        {deleteStep === 1 && (
          <div>
            <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: 8 }}>
               OTP sent to your email. Enter it below to confirm deletion:
            </p>
            <div style={{ background: 'rgba(255,193,7,0.15)', border: '1px solid #fbbf24', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
              <p style={{ color: '#d97706', fontSize: 13, margin: 0 }}>
                 If you don't see the email in your inbox, please check your <strong>Junk / Spam</strong> folder.
              </p>
            </div>
            <div className="form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                className="form-input"
                maxLength={6}
                value={deleteOtp}
                onChange={e => setDeleteOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="6-digit OTP"
                style={{ letterSpacing: 8, fontSize: 20, textAlign: 'center' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : ' Confirm Delete'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setDeleteStep(0); setDeleteOtp(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {showBankModal && (
        <BankDetailsModal
          onClose={() => setShowBankModal(false)}
          onSaved={handleBankDetailsSaved}
          currentDetails={profile}
        />
      )}
    </div>
  );
};

export default Profile;