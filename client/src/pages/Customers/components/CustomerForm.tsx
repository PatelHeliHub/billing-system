import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../../utils/api';
import type { Customer } from '../Customers';

interface CustomerFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData: Customer | null;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    gstNumber: initialData?.gstNumber || '',
    creditLimit: initialData?.creditLimit || '0'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (initialData?.id) {
        await api.put(`/customers/${initialData.id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>{initialData?.id ? 'Edit Customer' : 'Add New Customer'}</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="drawer-content">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label>Customer Name *</label>
            <input 
              type="text" 
              name="name" 
              required 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="e.g. John Doe" 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone Number *</label>
              <input 
                type="text" 
                name="phone" 
                required 
                value={formData.phone} 
                onChange={handleChange} 
                placeholder="e.g. +91 9876543210" 
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="john@example.com" 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>GST Number</label>
              <input 
                type="text" 
                name="gstNumber" 
                value={formData.gstNumber} 
                onChange={handleChange} 
                placeholder="22AAAAA0000A1Z5" 
              />
            </div>
            <div className="form-group">
              <label>Credit Limit (₹)</label>
              <input 
                type="number" 
                name="creditLimit" 
                value={formData.creditLimit} 
                onChange={handleChange} 
                placeholder="0" 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea 
              name="address" 
              rows={3} 
              value={formData.address} 
              onChange={handleChange} 
              placeholder="Street, City, State, Zip" 
            />
          </div>
          
          <div className="drawer-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={18} /> {loading ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
