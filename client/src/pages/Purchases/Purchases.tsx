import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Eye, 
  Calendar, 
  User, 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import ModuleHeader from '../../components/Listing/ModuleHeader';
import StatGrid from '../../components/Listing/StatGrid';
import FilterBar from '../../components/Listing/FilterBar';
import Pagination from '../../components/Listing/Pagination';
import EmptyState from '../../components/Listing/EmptyState';
import './Purchases.css';

export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplier: { supplierName: string };
  purchaseDate: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const Purchases: React.FC = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/purchases');
      setPurchases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch purchases', err);
    } finally {
      setLoading(false);
    }
  };

  const purchaseStats = useMemo(() => {
    const total = purchases.length;
    const pending = purchases.filter(p => p.status === 'Pending').length;
    const received = purchases.filter(p => p.status === 'Received').length;
    const totalSpend = purchases.reduce((acc, p) => acc + p.totalAmount, 0);

    return [
      { title: 'Total Orders', value: total, icon: <ShoppingCart size={24} /> },
      { title: 'Pending Orders', value: pending, icon: <Clock size={24} />, color: 'var(--warning)', bg: '#fef9c3' },
      { title: 'Received Orders', value: received, icon: <CheckCircle size={24} />, color: 'var(--success)', bg: '#dcfce7' },
      { title: 'Total Spend', value: `₹${totalSpend.toLocaleString()}`, icon: <Download size={24} />, color: 'var(--primary)', bg: '#eff6ff' },
    ];
  }, [purchases]);

  const filteredAndSortedPurchases = useMemo(() => {
    let result = [...purchases];

    // Search
    if (search) {
      const lowSearch = search.toLowerCase();
      result = result.filter(p => 
        p.purchaseNumber.toLowerCase().includes(lowSearch) || 
        (p.supplier?.supplierName || '').toLowerCase().includes(lowSearch)
      );
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
      if (sortBy === 'oldest') return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
      if (sortBy === 'amount-desc') return b.totalAmount - a.totalAmount;
      if (sortBy === 'amount-asc') return a.totalAmount - b.totalAmount;
      return 0;
    });

    return result;
  }, [purchases, search, statusFilter, sortBy]);

  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedPurchases.slice(start, start + itemsPerPage);
  }, [filteredAndSortedPurchases, currentPage]);

  const handleReset = () => {
    setSearch('');
    setStatusFilter('all');
    setSortBy('latest');
    setCurrentPage(1);
  };

  return (
    <div className="page-container">
      <ModuleHeader 
        title="Purchase Management"
        description="Order products, manage vendors, and track your procurement inventory workflow."
        actions={[
          { label: 'Export Data', icon: <Download size={18} />, onClick: () => alert('Exporting...') },
          { label: 'New Purchase Order', icon: <Plus size={18} />, onClick: () => navigate('/purchases/new'), variant: 'primary' }
        ]}
      />

      <StatGrid stats={purchaseStats} />

      <FilterBar 
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by order # or supplier..."
        selectFilters={[
          { name: 'status', placeholder: 'All Status', options: [
            { value: 'Pending', label: 'Pending' },
            { value: 'Received', label: 'Received' },
            { value: 'Cancelled', label: 'Cancelled' }
          ], value: statusFilter, onChange: setStatusFilter }
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { value: 'latest', label: 'Latest Date' },
          { value: 'oldest', label: 'Oldest Date' },
          { value: 'amount-desc', label: 'Highest Amount' },
          { value: 'amount-asc', label: 'Lowest Amount' }
        ]}
        onReset={handleReset}
      />

      {loading ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>Loading purchases...</div>
      ) : filteredAndSortedPurchases.length === 0 ? (
        <EmptyState 
          icon={<ShoppingCart size={32} />}
          title="No purchase orders found"
          description={search ? `We couldn't find any orders matching "${search}".` : "You haven't created any purchase orders yet. Restock your inventory by placing an order."}
          actionLabel={search ? undefined : "Create PO"}
          onAction={() => navigate('/purchases/new')}
        />
      ) : (
        <>
          <div className="card shadow-sm" style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPurchases.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.purchaseNumber}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={14} className="text-muted" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.supplier?.supplierName || 'Unknown Supplier'}</span>
                      </div>
                    </td>
                    <td className="text-muted">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <Calendar size={14} />
                        {p.purchaseDate && !isNaN(Date.parse(p.purchaseDate)) 
                          ? new Date(p.purchaseDate).toLocaleDateString() 
                          : 'N/A'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{(p.totalAmount || 0).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${p.status === 'Received' ? 'badge-success' : p.status === 'Cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {p.status === 'Pending' && (
                          <button 
                            className="action-btn" 
                            style={{ background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 700 }}
                            onClick={() => handleReceive(p.id, p.purchaseNumber)}
                          >
                            Receive
                          </button>
                        )}
                        <button className="action-btn" title="View Details" onClick={() => navigate(`/purchases/${p.id}`)}>
                          <Eye size={18} />
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
            totalItems={filteredAndSortedPurchases.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default Purchases;
