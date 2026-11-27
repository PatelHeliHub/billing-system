import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, ShoppingBag, Phone, Mail, MapPin, Hash, ShieldCheck } from 'lucide-react';
import api from '../../utils/api';
import type { Supplier } from './Suppliers';
import SupplierForm from './components/SupplierForm';
import './Suppliers.css';

const SupplierDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/suppliers/${id}`);
      setSupplier(data);
    } catch (err) {
      console.error('Failed to fetch supplier details', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="suppliers-container text-center">Loading details...</div>;
  if (!supplier) return <div className="suppliers-container text-center">Supplier not found</div>;

  return (
    <div className="suppliers-container">
      <div className="suppliers-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-outline" style={{ padding: '8px' }} onClick={() => navigate('/suppliers')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{supplier.supplierName}</h1>
            <p>Vendor Profile & History</p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => setIsFormOpen(true)}>
          <Edit2 size={18} /> Edit Supplier
        </button>
      </div>

      <div className="detail-grid">
        <aside className="supplier-profile">
          <div className="info-card">
            <div className="info-group">
              <label><Phone size={14} /> Contact Person</label>
              <p>{supplier.contactPerson}</p>
            </div>
            <div className="info-group">
              <label><Phone size={14} /> Phone</label>
              <p>{supplier.phone}</p>
            </div>
            <div className="info-group">
              <label><Mail size={14} /> Email</label>
              <p>{supplier.email || 'N/A'}</p>
            </div>
            <div className="info-group">
              <label><Hash size={14} /> GST Number</label>
              <p>{supplier.gstNumber || 'Not provided'}</p>
            </div>
            <div className="info-group">
              <label><ShieldCheck size={14} /> Status</label>
              <span className={`status-badge ${supplier.status.toLowerCase()}`}>
                {supplier.status}
              </span>
            </div>
            <div className="info-group">
              <label><MapPin size={14} /> Address</label>
              <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{supplier.address || 'N/A'}</p>
            </div>
          </div>
        </aside>

        <section className="supplier-history">
          <div className="history-section">
            <div className="section-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Recent Purchases</h3>
              <span className="badge success-badge">Module Coming Soon</span>
            </div>

            <div className="empty-purchase-state">
              <ShoppingBag size={48} />
              <div className="text-center">
                <h3>No Purchase History</h3>
                <p>Purchase orders from this supplier will appear here once the Purchase Module is active.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {isFormOpen && (
        <SupplierForm 
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => { setIsFormOpen(false); fetchSupplier(); }}
          initialData={supplier}
        />
      )}
    </div>
  );
};

export default SupplierDetail;
