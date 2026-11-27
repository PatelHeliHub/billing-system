import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Receipt, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../utils/api';
import './Customers.css';

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  note: string;
}

interface LedgerEntry {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  totalAmount: number;
  amountPaid: number;
  dueAmount: number;
  status: string;
  payments: Payment[];
}

interface LedgerData {
  customerName: string;
  totalInvoiced: number;
  totalPaid: number;
  currentDue: number;
  ledgerEntries: LedgerEntry[];
}

const CustomerLedger: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLedger();
  }, [id]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/${id}/ledger`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch ledger', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (invoiceId: string) => {
    const newSet = new Set(expandedInvoices);
    if (newSet.has(invoiceId)) newSet.delete(invoiceId);
    else newSet.add(invoiceId);
    setExpandedInvoices(newSet);
  };

  if (loading) return <div className="products-container">Loading Ledger...</div>;
  if (!data) return <div className="products-container">Customer not found</div>;

  return (
    <div className="products-container">
      <div className="mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-outline" onClick={() => navigate('/customers')}>
          <ArrowLeft size={18} /> Back to Customers
        </button>
        <h2 style={{ margin: 0 }}>Customer Ledger: {data.customerName}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="summary-card p-6" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <Receipt size={24} className="text-blue mb-2" />
          <span className="summary-label">Total Invoiced</span>
          <span className="summary-value">₹ {data.totalInvoiced.toLocaleString()}</span>
        </div>
        <div className="summary-card p-6" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <CheckCircle2 size={24} className="text-emerald mb-2" />
          <span className="summary-label">Total Paid</span>
          <span className="summary-value text-emerald">₹ {data.totalPaid.toLocaleString()}</span>
        </div>
        <div className="summary-card p-6" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <AlertCircle size={24} className="text-red mb-2" />
          <span className="summary-label">Current Due</span>
          <span className="summary-value text-red">₹ {data.currentDue.toLocaleString()}</span>
        </div>
      </div>

      <div className="table-card">
        <div className="toolbar px-6 py-4 border-b border-slate-700">
          <h3>Transaction History</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.ledgerEntries.map((inv) => (
              <React.Fragment key={inv.id}>
                <tr>
                  <td><strong>{inv.invoiceNumber}</strong></td>
                  <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td>₹{inv.totalAmount.toLocaleString()}</td>
                  <td className="text-emerald">₹{inv.amountPaid.toLocaleString()}</td>
                  <td className={inv.dueAmount > 0 ? 'text-red font-bold' : ''}>₹{inv.dueAmount.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${
                      inv.status === 'paid' ? 'success-badge' : 
                      inv.status === 'partial' ? 'category-badge' : 'alert-badge'
                    }`}>
                      {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button className="btn-outline px-2 py-1" onClick={() => toggleExpand(inv.id)}>
                      {expandedInvoices.has(inv.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      History
                    </button>
                  </td>
                </tr>
                {expandedInvoices.has(inv.id) && (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <div className="px-12 py-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>Payment History</h4>
                        {inv.payments.length === 0 ? (
                          <p style={{ fontSize: '12px', color: '#64748b' }}>No payments recorded yet.</p>
                        ) : (
                          <div className="payment-timeline">
                            {inv.payments.map((p) => (
                              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e293b' }}>
                                <div>
                                  <span style={{ fontSize: '12px', color: '#94a3b8' }}><Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} /> {new Date(p.paymentDate).toLocaleString()}</span>
                                  <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{p.note || 'Regular payment'}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-emerald font-bold">₹{p.amount.toLocaleString()}</span>
                                  <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>{p.paymentMethod}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerLedger;
