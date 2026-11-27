import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  Receipt, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  DollarSign,
  Calendar,
  Download
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import ModuleHeader from '../../components/Listing/ModuleHeader';
import StatGrid from '../../components/Listing/StatGrid';
import FilterBar from '../../components/Listing/FilterBar';
import Pagination from '../../components/Listing/Pagination';
import EmptyState from '../../components/Listing/EmptyState';
import './Billing.css';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer: { name: string };
  totalAmount: number;
  amountPaid: number;
  dueAmount: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Confirm Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{id: string, number: string} | null>(null);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) setSearch(searchParam);
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/invoices/list');
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching invoices', error);
    } finally {
      setLoading(false);
    }
  };

  const invoiceStats = useMemo(() => {
    const total = invoices.length;
    const paidCount = invoices.filter(i => i.status === 'paid').length;
    const totalRevenue = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
    const totalDue = invoices.reduce((acc, i) => acc + (i.dueAmount || 0), 0);

    return [
      { title: 'Total Invoices', value: total, icon: <Receipt size={24} /> },
      { title: 'Fully Paid', value: paidCount, icon: <CheckCircle size={24} />, color: 'var(--success)', bg: '#dcfce7' },
      { title: 'Total Revenue', value: `₹${(totalRevenue || 0).toLocaleString()}`, icon: <DollarSign size={24} />, color: 'var(--primary)', bg: '#eff6ff' },
      { title: 'Total Outstanding', value: `₹${(totalDue || 0).toLocaleString()}`, icon: <AlertCircle size={24} />, color: 'var(--danger)', bg: '#fee2e2' },
    ];
  }, [invoices]);

  const filteredAndSortedInvoices = useMemo(() => {
    let result = [...invoices];
    if (search) {
      const lowSearch = search.toLowerCase();
      result = result.filter(i => 
        i.invoiceNumber.toLowerCase().includes(lowSearch) || 
        (i.customer?.name || '').toLowerCase().includes(lowSearch)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(i => i.status === statusFilter);
    }
    result.sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'amount-desc') return b.totalAmount - a.totalAmount;
      return 0;
    });
    return result;
  }, [invoices, search, statusFilter, sortBy]);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedInvoices.slice(start, start + itemsPerPage);
  }, [filteredAndSortedInvoices, currentPage]);

  const handleDeleteClick = (id: string, number: string) => {
    setInvoiceToDelete({ id, number });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      await api.delete(`/invoices/${invoiceToDelete.id}`);
      setIsConfirmOpen(false);
      setInvoiceToDelete(null);
      fetchInvoices();
    } catch (error: any) {
      console.error('Delete error', error);
      alert(error.response?.data?.error || 'Failed to delete invoice');
      setIsConfirmOpen(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice || !paymentAmount) return;
    try {
      setRecordingPayment(true);
      await api.post(`/invoices/${selectedInvoice.id}/payments`, {
        amount: Number(paymentAmount),
        paymentMethod: 'cash',
        note: 'Recording pending payment'
      });
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="badge badge-success" style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Paid</span>;
      case 'partial': return <span className="badge badge-warning" style={{ background: '#fef9c3', color: '#854d0e', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Partial</span>;
      case 'unpaid': return <span className="badge badge-danger" style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Unpaid</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      <ModuleHeader 
        title="Invoices & Billing"
        description="Monitor sales performance and manage invoice-level receivables."
        actions={[
          { label: 'Export', icon: <Download size={18} />, onClick: () => alert('Exporting...') },
          { label: 'New POS Order', icon: <Plus size={18} />, onClick: () => navigate('/pos'), variant: 'primary' }
        ]}
      />

      <StatGrid stats={invoiceStats} />

      <FilterBar 
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Invoice # or Patient..."
        selectFilters={[
          { name: 'status', placeholder: 'All Status', options: [
            { value: 'paid', label: 'Paid' },
            { value: 'partial', label: 'Partial' },
            { value: 'unpaid', label: 'Unpaid' }
          ], value: statusFilter, onChange: setStatusFilter }
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        sortOptions={[{ value: 'latest', label: 'Latest First' }, { value: 'amount-desc', label: 'High Amount' }]}
        onReset={() => { setSearch(''); setStatusFilter('all'); }}
      />

      {loading ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>
      ) : (
        <>
          <div className="card shadow-sm" style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td><strong>{inv.invoiceNumber}</strong></td>
                    <td style={{ fontWeight: 600 }}>{inv.customer?.name || 'Walk-in Customer'}</td>
                    <td className="text-muted" style={{ fontSize: '13px' }}>
                      {inv.createdAt && !isNaN(Date.parse(inv.createdAt)) 
                        ? new Date(inv.createdAt).toLocaleDateString() 
                        : 'N/A'}
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{(inv.totalAmount || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{(inv.amountPaid || 0).toLocaleString()}</td>
                    <td style={{ color: (inv.dueAmount || 0) > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700 }}>
                      ₹{(inv.dueAmount || 0).toLocaleString()}
                    </td>
                    <td>{getStatusBadge(inv.status || 'unpaid')}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {inv.dueAmount > 0 && (
                          <button 
                            className="action-btn" 
                            style={{ background: 'var(--warning)', color: '#854d0e', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 700 }}
                            onClick={() => { setSelectedInvoice(inv); setIsPaymentModalOpen(true); }}
                          >
                            Receive
                          </button>
                        )}
                        <Link to={`/billing/${inv.id}`} className="action-btn" title="View"><Eye size={16} /></Link>
                        <button className="action-btn text-red" onClick={() => handleDeleteClick(inv.id, inv.invoiceNumber)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalItems={filteredAndSortedInvoices.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
        </>
      )}

      {isPaymentModalOpen && selectedInvoice && (
        <div className="drawer-overlay">
          <div className="drawer-panel" style={{ maxWidth: '400px' }}>
            <div className="drawer-header">
              <h2>Record Payment</h2>
              <button className="btn-close" onClick={() => setIsPaymentModalOpen(false)}>×</button>
            </div>
            <div className="drawer-content p-4">
               <div className="mb-4">
                 <p className="text-muted mb-1">Invoice: <strong>{selectedInvoice.invoiceNumber}</strong></p>
                 <p className="text-muted">Remaining Balance: <strong className="text-danger">₹{selectedInvoice.dueAmount.toLocaleString()}</strong></p>
               </div>
               <div className="form-group">
                 <label>Payment Amount (₹)</label>
                 <input 
                  type="number" 
                  autoFocus
                  placeholder="Enter amount to receive..."
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={selectedInvoice.dueAmount}
                 />
               </div>
               <div className="drawer-footer mt-4">
                  <button className="btn-outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</button>
                  <button 
                    className="btn-primary" 
                    disabled={recordingPayment || !paymentAmount || Number(paymentAmount) <= 0}
                    onClick={handleRecordPayment}
                  >
                    {recordingPayment ? 'Processing...' : 'Confirm Receipt'}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        title="Delete Invoice?"
        message={`Are you sure you want to delete invoice ${invoiceToDelete?.number}? This will restore the product stock and remove the financial record.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
        variant="danger"
      />
    </div>
  );
};

export default Invoices;
