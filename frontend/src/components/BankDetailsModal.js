import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const sriLankanBanks = [
  'Bank of Ceylon (BOC)', "People's Bank", 'Commercial Bank of Ceylon',
  'Hatton National Bank (HNB)', 'Sampath Bank', 'Seylan Bank',
  'Nations Trust Bank (NTB)', 'DFCC Bank', 'National Development Bank (NDB)',
  'Pan Asia Banking Corporation (PABC)', 'Union Bank of Colombo', 'Amana Bank',
  'Cargills Bank', 'National Savings Bank (NSB)', 'Sri Lanka Savings Bank',
  'State Mortgage & Investment Bank', 'Housing Development Finance Corporation (HDFC)',
  'Pradeshiya Sanwardhana Bank', 'Regional Development Bank', 'Sanasa Development Bank',
  'HSBC Sri Lanka', 'Standard Chartered Bank Sri Lanka', 'Citibank Sri Lanka',
  'Deutsche Bank Sri Lanka', 'Indian Bank Sri Lanka', 'Indian Overseas Bank Sri Lanka',
  'State Bank of India Sri Lanka', 'MCB Bank Sri Lanka', 'Habib Bank Sri Lanka',
  'Public Bank Berhad Sri Lanka'
];

const BankDetailsModal = ({ onClose, onSaved, onSuccess, currentDetails }) => {
  const { user, api, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    bankName: '',
    bankAccountNumber: '',
    bankBranch: '',
    accountHolderName: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const details = currentDetails || user;
    if (details) {
      setFormData({
        bankName: details.bankName || '',
        bankAccountNumber: details.bankAccountNumber || '',
        bankBranch: details.bankBranch || '',
        accountHolderName: details.accountHolderName || ''
      });
    }
  }, [user, currentDetails]);

  // ── Account Number: numbers only ─────────────────────────────────────────
  const handleAccountNumberChange = (e) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, bankAccountNumber: cleaned }));
  };

  const blockNonNumeric = (e) => {
    if (
      !/[0-9]/.test(e.key) &&
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  // ── Branch: letters, numbers and spaces only — no special chars ──────────
  const handleBranchChange = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setFormData(prev => ({ ...prev, bankBranch: cleaned }));
  };

  // ── Account Holder Name: letters and spaces only ──────────────────────────
  const handleHolderNameChange = (e) => {
    const cleaned = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setFormData(prev => ({ ...prev, accountHolderName: cleaned }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bankName || !formData.bankAccountNumber || !formData.bankBranch || !formData.accountHolderName) {
      toast.error('All bank details are required');
      return;
    }

    setLoading(true);
    try {
      const res = await api.put('/auth/profile', formData);
      if (updateUser) updateUser(res.data.user);
      toast.success('Bank details updated successfully!');
      onSuccess?.();
      onSaved?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>🏦 Bank Details</h2>
        <p className="text-muted mb-4" style={{ fontSize: '14px' }}>
          Bank details are required to receive payments from buyers.
        </p>

        <form onSubmit={handleSubmit}>

          {/* Bank Name */}
          <div className="form-group">
            <label>Bank Name *</label>
            <select
              className="form-select"
              value={formData.bankName}
              onChange={e => setFormData({ ...formData, bankName: e.target.value })}
              required
            >
              <option value="">Select Bank</option>
              {sriLankanBanks.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          {/* Account Number — numbers only */}
          <div className="form-group">
            <label>Account Number *</label>
            <input
              type="text"
              inputMode="numeric"
              className="form-input"
              value={formData.bankAccountNumber}
              onChange={handleAccountNumberChange}
              onKeyDown={blockNonNumeric}
              placeholder="Enter account number"
              required
            />
          </div>

          {/* Branch — letters, numbers, spaces only */}
          <div className="form-group">
            <label>Branch Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.bankBranch}
              onChange={handleBranchChange}
              placeholder="Enter branch name"
              required
            />
          </div>

          {/* Account Holder Name — letters and spaces only */}
          <div className="form-group">
            <label>Account Holder Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.accountHolderName}
              onChange={handleHolderNameChange}
              placeholder="Enter account holder name"
              required
            />
          </div>

          <div className="flex gap-2" style={{ marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Saving...' : 'Save Bank Details'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankDetailsModal;