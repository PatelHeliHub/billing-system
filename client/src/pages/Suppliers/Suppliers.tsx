import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Eye, 
  Edit2, 
  Trash2, 
  Truck, 
  UserCheck, 
  UserX, 
  Calendar,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import SupplierForm from './components/SupplierForm';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import ModuleHeader from '../../components/Listing/ModuleHeader';
import StatGrid from '../../components/Listing/StatGrid';
import FilterBar from '../../components/Listing/FilterBar';
import Pagination from '../../components/Listing/Pagination';
import EmptyState from '../../components/Listing/EmptyState';
import './Suppliers.css';

export interface Supplier {
  id: string;
  supplierName: string;
  contactPerson: string;
  phone: string;
  email: string | null;
  address: string | null;
  gstNumber: string | null;
  status: string;
  totalOrders: number;
  totalPurchaseAmount: number;
  lastOrderDate: string | null;
  createdAt: string;
}

const Suppliers: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Confirm Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/suppliers');
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    } finally {
      setLoading(false);
    }
  };

  const supplierStats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter(s => s.status === 'Active').length;
    const inactive = suppliers.filter(s => s.status === 'Inactive').length;
    
    // Recent - last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = suppliers.filter(s => new Date(s.createdAt) > thirtyDaysAgo).length;

    return [
      { title: 'Total Suppliers', value: total, icon: <Truck size={24} /> },
      { title: 'Active Vendors', value: active, icon: <UserCheck size={24} />, color: 'var(--success)', bg: '#dcfce7' },
      { title: 'Inactive Vendors', value: inactive, icon: <UserX size={24} />, color: 'var(--danger)', bg: '#fee2e2' },
      { title: 'Recent Partners', value: recent, icon: <Calendar size={24} />, color: 'var(--primary)', bg: '#eff6ff' },
    ];
  }, [suppliers]);

  const filteredAndSortedSuppliers = useMemo(() => {
    let result = [...suppliers];

    // Search
    if (search) {
      const lowSearch = search.toLowerCase();
      result = result.filter(s => 
        s.supplierName.toLowerCase().includes(lowSearch) || 
        s.contactPerson.toLowerCase().includes(lowSearch) ||
        s.phone.includes(lowSearch)
      );
    }

    // Status Filter
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.supplierName.localeCompare(b.supplierName);
      if (sortBy === 'name-desc') return b.supplierName.localeCompare(a.supplierName);
      if (sortBy === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

    return result;
  }, [suppliers, search, statusFilter, sortBy]);

  const paginatedSuppliers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedSuppliers.slice(start, start + itemsPerPage);
  }, [filteredAndSortedSuppliers, currentPage]);

  const handleDeleteClick = (id: string) => {
    setSupplierToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await api.delete(`/suppliers/${supplierToDelete}`);
      setIsConfirmOpen(false);
      setSupplierToDelete(null);
      fetchSuppliers();
    } catch (err: any) {
      console.error('Delete error', err);
      alert(err.response?.data?.error || 'Failed to delete supplier. They may be linked to existing products or purchases.');
      setIsConfirmOpen(false);
    }
  };

  const handleReset = () => {
    setSearch('');
    setStatusFilter('all');
    setSortBy('latest');
    setCurrentPage(1);
  };

  return (
    <div className="page-container">
      <ModuleHeader 
        title="Supplier Management"
        description="Manage your vendors, track contacts, and oversee procurement distribution."
        actions={[
          { label: 'Export Data', icon: <Download size={18} />, onClick: () => alert('Exporting...') },
          { label: 'Add New Supplier', icon: <Plus size={18} />, onClick: () => { setEditingSupplier(null); setIsFormOpen(true); }, variant: 'primary' }
        ]}
      />

      <StatGrid stats={supplierStats} />

      <FilterBar 
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, contact, or phone..."
        selectFilters={[
          { name: 'status', placeholder: 'All Status', options: [
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' }
          ], value: statusFilter, onChange: setStatusFilter }
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { value: 'latest', label: 'Newest First' },
          { value: 'name-asc', label: 'Name (A-Z)' },
          { value: 'name-desc', label: 'Name (Z-A)' }
        ]}
        onReset={handleReset}
      />

      {loading ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>Loading suppliers...</div>
      ) : filteredAndSortedSuppliers.length === 0 ? (
        <EmptyState 
          icon={<Truck size={32} />}
          title="No suppliers found"
          description={search ? `We couldn't find any suppliers matching "${search}".` : "You haven't added any suppliers yet. Build your vendor network to start purchasing."}
          actionLabel={search ? undefined : "Add Supplier"}
          onAction={() => { setEditingSupplier(null); setIsFormOpen(true); }}
        />
      ) : (
        <>
          <div className="card shadow-sm" style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Supplier Name</th>
                  <th>Contact Person</th>
                  <th>Total Orders</th>
                  <th>Purchase Value</th>
                  <th>Last Order</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                  {paginatedSuppliers.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <strong>{s.supplierName || 'Unknown Supplier'}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>{s.contactPerson || 'N/A'}</td>
                      <td style={{ fontWeight: 600 }}>{s.totalOrders || 0}</td>
                      <td style={{ fontWeight: 700 }}>₹{(s.totalPurchaseAmount || 0).toLocaleString()}</td>
                      <td className="text-muted" style={{ fontSize: '0.875rem' }}>
                        {s.lastOrderDate && !isNaN(Date.parse(s.lastOrderDate)) 
                          ? new Date(s.lastOrderDate).toLocaleDateString() 
                          : 'No Orders'}
                      </td>
                      <td>
                        <span className={`badge ${s.status === 'Active' ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 600 }}>
                          {s.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="action-btn" 
                            style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 700 }}
                            onClick={() => navigate('/purchases/new', { state: { supplierId: s.id, supplierName: s.supplierName } })}
                          >
                            + PO
                          </button>
                          <button className="action-btn" title="Edit" onClick={() => { setEditingSupplier(s); setIsFormOpen(true); }}><Edit2 size={16} /></button>
                          <button className="action-btn text-red" title="Delete" onClick={() => handleDeleteClick(s.id)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage}
            totalItems={filteredAndSortedSuppliers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {isFormOpen && (
        <SupplierForm 
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => { setIsFormOpen(false); fetchSuppliers(); }}
          initialData={editingSupplier}
        />
      )}

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        title="Delete Supplier?"
        message="Are you sure you want to permanently delete this supplier? This will remove their contact information from your vendor list."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
        variant="danger"
      />
    </div>
  );
};

export default Suppliers;
