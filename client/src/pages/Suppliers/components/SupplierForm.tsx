import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../../utils/api';
import type { Supplier } from '../Suppliers';

interface SupplierFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData: Supplier | null;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    supplierName: initialData?.supplierName || '',
    contactPerson: initialData?.contactPerson || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    gstNumber: initialData?.gstNumber || '',
    status: initialData?.status || 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (initialData) {
        await api.put(`/suppliers/${initialData.id}`, formData);
      } else {
        await api.post('/suppliers', formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>{initialData ? 'Edit Supplier' : 'Add New Supplier'}</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="drawer-content">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label>Supplier / Company Name *</label>
            <input 
              type="text" 
              name="supplierName" 
              required 
              value={formData.supplierName} 
              onChange={handleChange} 
              placeholder="e.g. Reliance Retail"
            />
          </div>

          <div className="form-group">
            <label>Contact Person *</label>
            <input 
              type="text" 
              name="contactPerson" 
              required 
              value={formData.contactPerson} 
              onChange={handleChange} 
              placeholder="Name of contact person"
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
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="vendor@email.com"
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
                placeholder="27AAAAA0000A1Z5"
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea 
              name="address" 
              rows={3} 
              value={formData.address} 
              onChange={handleChange} 
              placeholder="Full office address..."
            ></textarea>
          </div>

          <div className="drawer-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Save size={18} /> {loading ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierForm;
