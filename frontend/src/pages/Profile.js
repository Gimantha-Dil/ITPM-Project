import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import BankDetailsModal from '../components/BankDetailsModal';

const Profile = () => {
  const { user, api, updateUser } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ fullName: '', phoneNumber: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showBankModal, setShowBankModal] = useState(false);
  const [saving, setSaving] = useState(false);
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
            <input type="text" className="form-input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-input" value={profile?.email || ''} disabled style={{ background: '#f3f4f6' }} />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="text" className="form-input" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Bank Details */}
      <div className="profile-section">
        <h2>💳 Bank Details</h2>
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
            <input type="password" className="form-input" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" className="form-input" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" className="form-input" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary">Change Password</button>
        </form>
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
