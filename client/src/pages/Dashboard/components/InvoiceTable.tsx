import React from 'react';
import { Search, Filter, Share2, Bell, MoreHorizontal } from 'lucide-react';

interface Invoice {
  id: string;
  totalAmount: number;
  dueDate: string | Date | null;
  status: string;
  createdAt: string | Date;
  customer?: { name: string };
}

interface InvoiceStats {
  totalCount: number;
  counts: {
    unpaid: number;
    paid: number;
    overdue: number;
    partial: number;
  };
}

interface InvoiceTableProps {
  invoices: Invoice[];
  counts: InvoiceStats;
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  onSearchChange: (search: string) => void;
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({ 
  invoices, 
  counts, 
  currentFilter, 
  onFilterChange,
  onSearchChange
}) => {
  const tabs = [
    { id: 'all', label: 'All Invoices', count: counts.totalCount || 0 },
    { id: 'unpaid', label: 'Unpaid Invoices', count: counts.counts?.unpaid || 0 },
    { id: 'paid', label: 'Paid Invoices', count: counts.counts?.paid || 0 },
    { id: 'due', label: 'Due Invoices', count: counts.counts?.overdue || 0 },
    { id: 'draft', label: 'Drafts', count: 0 },
    { id: 'archived', label: 'Archives', count: 0 },
  ];

  return (
    <div className="invoices-section">
      <div className="section-header">
        <div className="table-controls">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search Invoice no, client name or invoice name" 
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <button className="icon-btn-outline"><Filter size={18} /></button>
        </div>
        
        <div className="filter-tabs" style={{ marginTop: '20px' }}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={`filter-tab ${currentFilter === tab.id ? 'active' : ''}`}
              onClick={() => onFilterChange(tab.id)}
            >
              {tab.label}
              <span className="tab-count">{String(tab.count).padStart(2, '0')}</span>
            </button>
          ))}
        </div>
      </div>

      <table className="invoice-table">
        <thead>
          <tr>
            <th>Invoice Details</th>
            <th>Payment</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length > 0 ? invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>
                <div className="client-info">
                  <h4>{invoice.customer?.name || 'Unknown Client'}</h4>
                  <span>Date: {new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </td>
              <td>
                <div style={{ fontWeight: '600' }}>₹ {invoice.totalAmount.toLocaleString()}</div>
              </td>
              <td style={{ color: '#64748b' }}>
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
              </td>
              <td>
                <span className={`status-badge status-${invoice.status}`}>
                  {invoice.status}
                </span>
              </td>
              <td>
                <div className="action-btns">
                  <Share2 size={18} className="action-btn" />
                  <Bell size={18} className="action-btn" />
                  <MoreHorizontal size={18} className="action-btn" />
                </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                No invoices found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTable;
