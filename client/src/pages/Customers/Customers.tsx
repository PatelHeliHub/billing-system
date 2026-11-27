import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  FileText, 
  Users, 
  UserCheck, 
  CreditCard, 
  Activity,
  ArrowRight,
  Download
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import CustomerForm from './components/CustomerForm';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import ModuleHeader from '../../components/Listing/ModuleHeader';
import StatGrid from '../../components/Listing/StatGrid';
import FilterBar from '../../components/Listing/FilterBar';
import Pagination from '../../components/Listing/Pagination';
import EmptyState from '../../components/Listing/EmptyState';
import './Customers.css';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  gstNumber: string | null;
  creditLimit: number | null;
  totalPurchases: number;
  outstandingBalance: number;
  lastPurchaseDate: string | null;
  createdAt: string;
}

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Confirm Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/customers');
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching customers', error);
    } finally {
      setLoading(false);
    }
  };

  const customerStats = useMemo(() => {
    const total = customers.length;
    const withBalance = customers.filter(c => c.outstandingBalance > 0).length;
    const totalRevenue = customers.reduce((acc, c) => acc + c.totalPurchases, 0);
    const totalOutstanding = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);

    return [
      { title: 'Total Customers', value: total, icon: <Users size={24} /> },
      { title: 'With Balance', value: withBalance, icon: <Activity size={24} />, color: 'var(--warning)', bg: '#fef9c3' },
      { title: 'Total Revenue', value: `₹${(totalRevenue || 0).toLocaleString()}`, icon: <UserCheck size={24} />, color: 'var(--success)', bg: '#dcfce7' },
      { title: 'Total Outstanding', value: `₹${(totalOutstanding || 0).toLocaleString()}`, icon: <CreditCard size={24} />, color: 'var(--danger)', bg: '#fee2e2' },
    ];
  }, [customers]);

  const filteredAndSortedCustomers = useMemo(() => {
    let result = [...customers];

    // Search
    if (search) {
      const lowSearch = search.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(lowSearch) || 
        (c.phone && c.phone.includes(lowSearch)) ||
        (c.email && c.email.toLowerCase().includes(lowSearch))
      );
    }

    // Balance Filter
    if (balanceFilter !== 'all') {
      if (balanceFilter === 'has_balance') result = result.filter(c => c.outstandingBalance > 0);
      if (balanceFilter === 'no_balance') result = result.filter(c => c.outstandingBalance <= 0);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'purchases-desc') return b.totalPurchases - a.totalPurchases;
      if (sortBy === 'balance-desc') return b.outstandingBalance - a.outstandingBalance;
      if (sortBy === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

    return result;
  }, [customers, search, balanceFilter, sortBy]);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCustomers.slice(start, start + itemsPerPage);
  }, [filteredAndSortedCustomers, currentPage]);

  const handleDeleteClick = (id: string) => {
    setCustomerToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      await api.delete(`/customers/${customerToDelete}`);
      setIsConfirmOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error: any) {
      console.error('Delete error', error);
      alert(error.response?.data?.error || 'Failed to delete customer. They may have active invoices.');
      setIsConfirmOpen(false);
    }
  };

  const handleReset = () => {
    setSearch('');
    setBalanceFilter('all');
    setSortBy('latest');
    setCurrentPage(1);
  };

  return (
    <div className="page-container">
      <ModuleHeader 
        title="Customers"
        description="Manage your client base, track their purchase history and outstanding balances."
        actions={[
          { label: 'Export List', icon: <Download size={18} />, onClick: () => alert('Exporting...') },
          { label: 'Add New Customer', icon: <Plus size={18} />, onClick: () => { setEditingCustomer(null); setIsFormOpen(true); }, variant: 'primary' }
        ]}
      />

      <StatGrid stats={customerStats} />

      <FilterBar 
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, phone, or email..."
        selectFilters={[
          { name: 'balance', placeholder: 'All Accounts', options: [
            { value: 'has_balance', label: 'With Outstanding Balance' },
            { value: 'no_balance', label: 'Clear Balance' }
          ], value: balanceFilter, onChange: setBalanceFilter }
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { value: 'latest', label: 'Newest First' },
          { value: 'name-asc', label: 'Name (A-Z)' },
          { value: 'name-desc', label: 'Name (Z-A)' },
          { value: 'purchases-desc', label: 'Highest Purchases' },
          { value: 'balance-desc', label: 'Highest Balance' }
        ]}
        onReset={handleReset}
      />

      {loading ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>Loading customers...</div>
      ) : filteredAndSortedCustomers.length === 0 ? (
        <EmptyState 
          icon={<Users size={32} />}
          title="No customers found"
          description={search ? `We couldn't find any customers matching "${search}".` : "You haven't added any customers yet. Add your first customer to start billing."}
          actionLabel={search ? undefined : "Add Customer"}
          onAction={() => { setEditingCustomer(null); setIsFormOpen(true); }}
        />
      ) : (
        <>
          <div className="card shadow-sm" style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone</th>
                  <th>Total Purchase</th>
                  <th>Outstanding</th>
                  <th>Last Purchase</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Link to={`/customers/${customer.id}`} style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>
                          {customer.name}
                        </Link>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email: {customer.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{customer.phone || 'No Phone'}</td>
                    <td style={{ fontWeight: 600 }}>₹{(customer.totalPurchases || 0).toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: (customer.outstandingBalance || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ₹{(customer.outstandingBalance || 0).toLocaleString()}
                        {(customer.outstandingBalance || 0) > 0 && <span style={{ width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%' }}></span>}
                      </div>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.875rem' }}>
                      {customer.lastPurchaseDate && !isNaN(Date.parse(customer.lastPurchaseDate)) 
                        ? new Date(customer.lastPurchaseDate).toLocaleDateString() 
                        : 'No Purchase'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          className="action-btn" 
                          style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 700 }}
                          onClick={() => navigate('/pos', { state: { customerId: customer.id, customerName: customer.name } })}
                        >
                          + Invoice
                        </button>
                        <button className="action-btn" title="View Invoices" onClick={() => navigate(`/billing/invoices?search=${customer.name}`)}>
                          <FileText size={16} />
                        </button>
                        <button className="action-btn" title="Edit" onClick={() => { setEditingCustomer(customer); setIsFormOpen(true); }}>
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn text-red" title="Delete" onClick={() => handleDeleteClick(customer.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage}
            totalItems={filteredAndSortedCustomers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {isFormOpen && (
        <CustomerForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => {
            setIsFormOpen(false);
            fetchCustomers();
          }}
          initialData={editingCustomer} 
        />
      )}

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        title="Delete Customer?"
        message="Are you sure you want to permanently delete this customer? All their purchase history will be archived but you will not be able to manage this account anymore."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
        variant="danger"
      />
    </div>
  );
};

export default Customers;
