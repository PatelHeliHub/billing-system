import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Receipt, Calculator, Clock } from 'lucide-react';
import api from '../../utils/api';
import type { Customer } from './Customers';
import './Customers.css';

interface CustomerDetailData extends Customer {
  invoices: any[];
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const { data } = await api.get(`/customers/${id}`);
        setCustomer(data);
      } catch (error) {
        console.error('Error fetching customer details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  if (loading) return <div className="products-container">Loading...</div>;
  if (!customer) return <div className="products-container">Customer not found</div>;

  return (
    <div className="products-container">
      <div className="mb-6">
        <Link to="/customers" className="btn-outline" style={{ display: 'inline-flex' }}>
          <ArrowLeft size={18} /> Back to Customers
        </Link>
      </div>

      <div className="customer-detail-header">
        <div className="table-card p-6 mb-6">
          <div className="detail-grid">
            <div className="detail-main-info">
              <h1>{customer.name}</h1>
              <div className="detail-meta">
                <span className="badge category-badge">ID: {customer.id.substring(0, 8)}</span>
                <span className="badge success-badge">Member since {new Date(customer.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="contact-grid">
                <div className="contact-item">
                  <Phone size={16} /> <span>{customer.phone || 'N/A'}</span>
                </div>
                <div className="contact-item">
                  <Mail size={16} /> <span>{customer.email || 'N/A'}</span>
                </div>
                <div className="contact-item">
                  <MapPin size={16} /> <span>{customer.address || 'N/A'}</span>
                </div>
                <div className="contact-item">
                  <Receipt size={16} /> <span>GST: {customer.gstNumber || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="detail-stats">
              <div className="summary-card">
                <Calculator size={20} className="text-emerald" />
                <div className="summary-info">
                  <span className="summary-label">Total Purchases</span>
                  <span className="summary-value">₹ {(customer?.totalPurchases ?? 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="text-red"><Calculator size={20} /></div>
                <div className="summary-info">
                  <span className="summary-label">Outstanding Balance</span>
                  <span className="summary-value text-red">₹ {(customer?.outstandingBalance ?? 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="summary-card">
                <Clock size={20} className="text-blue" />
                <div className="summary-info">
                  <span className="summary-label">Credit Limit</span>
                  <span className="summary-value text-blue">₹ {(customer?.creditLimit || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="toolbar">
          <h3>Invoice History</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total Amount</th>
              <th>Amount Paid</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {!customer.invoices || customer.invoices.length === 0 ? (
              <tr><td colSpan={6} className="text-center empty-state">No invoices found for this customer.</td></tr>
            ) : (
              customer.invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td><strong>{invoice.invoiceNumber}</strong></td>
                  <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${
                      invoice.status === 'paid' ? 'success-badge' : 
                      invoice.status === 'overdue' ? 'alert-badge' : 'category-badge'
                    }`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="font-medium">₹{invoice.totalAmount.toLocaleString()}</td>
                  <td>₹{invoice.amountPaid?.toLocaleString() || '0'}</td>
                  <td>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerDetail;
