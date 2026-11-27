import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Box, CheckCircle, Clock } from 'lucide-react';
import api from '../../utils/api';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import './Purchases.css';

interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  tax: number;
  subtotal: number;
}

interface Purchase {
  id: string;
  purchaseNumber: string;
  supplier: { supplierName: string; contactPerson: string; phone: string };
  purchaseDate: string;
  totalAmount: number;
  status: string;
  items: PurchaseItem[];
}

const PurchaseDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Confirm Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    fetchPurchase();
  }, [id]);

  const fetchPurchase = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/purchases/${id}`);
      setPurchase(data);
    } catch (err) {
      console.error('Failed to fetch purchase details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceive = async () => {
    try {
      setIsConfirmOpen(false);
      setProcessing(true);
      await api.patch(`/purchases/${id}/receive`);
      fetchPurchase(); // Refresh to show "Received" status
    } catch (err) {
      console.error('Failed to receive products', err);
      alert('Error processing receipt');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="purchases-container">Loading order details...</div>;
  if (!purchase) return <div className="purchases-container">Purchase order not found</div>;

  return (
    <div className="purchases-container">
      <div className="purchases-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn-outline" style={{ padding: '8px' }} onClick={() => navigate('/purchases')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{purchase.purchaseNumber}</h1>
            <p>Purchase Order Details</p>
          </div>
        </div>
        <div className={`status-badge ${purchase.status.toLowerCase()}`}>
          {purchase.status === 'Received' ? <CheckCircle size={14} style={{ marginRight: '6px' }} /> : <Clock size={14} style={{ marginRight: '6px' }} />}
          {purchase.status}
        </div>
      </div>

      <div className="purchase-detail-grid">
        <aside className="sidebar-card">
          <div className="info-row">
            <label>Vendor</label>
            <p>{purchase.supplier.supplierName}</p>
            <span className="sub-text">{purchase.supplier.contactPerson} | {purchase.supplier.phone}</span>
          </div>
          <div className="info-row">
            <label>Purchase Date</label>
            <p>{new Date(purchase.purchaseDate).toLocaleDateString()}</p>
          </div>
          <div className="info-row">
            <label>Order Amount</label>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{purchase.totalAmount.toLocaleString()}</p>
          </div>

          {purchase.status === 'Pending' && (
            <div className="receive-button-area">
              <button className="btn-receive" onClick={() => setIsConfirmOpen(true)} disabled={processing}>
                <Box size={20} /> {processing ? 'Processing...' : 'Mark as Received'}
              </button>
              <p className="sub-text text-center mt-2" style={{ fontSize: '12px' }}>
                Increase inventory for all items in this order.
              </p>
            </div>
          )}
        </aside>

        <main className="table-card">
          <h3 style={{ padding: '20px 24px 0 24px' }}>Ordered Items</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Tax</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.quantity}</td>
                  <td>₹{item.price.toLocaleString()}</td>
                  <td>₹{item.tax.toLocaleString()}</td>
                  <td className="font-bold">₹{item.subtotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '24px', textAlign: 'right', borderTop: '1px solid #f1f5f9' }}>
            <span className="sub-text">Purchase Summary</span>
            <div style={{ fontSize: '20px', fontWeight: '800' }}>Grand Total: ₹{purchase.totalAmount.toLocaleString()}</div>
          </div>
        </main>
      </div>

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        title="Mark as Received?"
        message="Are you sure you want to mark this order as Received? This will automatically increase your product stock levels for all items in this list."
        onConfirm={handleConfirmReceive}
        onCancel={() => setIsConfirmOpen(false)}
        variant="info"
        confirmLabel="Receive Order"
      />
    </div>
  );
};

export default PurchaseDetail;
