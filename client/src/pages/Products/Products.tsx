import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  Download, 
  Package,
  CheckCircle2,
  XCircle,
  Shapes,
  Box,
  TrendingDown,
  Upload
} from 'lucide-react';
import api from '../../utils/api';
import ProductForm from './components/ProductForm';
import BulkImport from './components/BulkImport';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import ModuleHeader from '../../components/Listing/ModuleHeader';
import StatGrid from '../../components/Listing/StatGrid';
import FilterBar from '../../components/Listing/FilterBar';
import Pagination from '../../components/Listing/Pagination';
import EmptyState from '../../components/Listing/EmptyState';
import './Products.css';

export interface Product {
  id: string;
  name: string;
  category: string | null;
  brand: string | null;
  unit: string | null;
  price: number;
  costPrice: number;
  gstPercent: number;
  taxType: string | null;
  hsnCode: string | null;
  image: string | null;
  stockQuantity: number;
  minStockLevel: number;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  supplierId: string | null;
  createdAt: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Confirm Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products', error);
    } finally {
      setLoading(false);
    }
  };

  const productStats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.stockQuantity > p.minStockLevel).length;
    const lowStock = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel).length;
    const outOfStock = products.filter(p => p.stockQuantity === 0).length;

    return [
      { title: 'Total Products', value: total, icon: <Package size={24} /> },
      { title: 'In Stock', value: inStock, icon: <CheckCircle2 size={24} />, color: 'var(--success)', bg: '#dcfce7' },
      { title: 'Low Stock', value: lowStock, icon: <AlertTriangle size={24} />, color: 'var(--warning)', bg: '#fef9c3' },
      { title: 'Out of Stock', value: outOfStock, icon: <XCircle size={24} />, color: 'var(--danger)', bg: '#fee2e2' },
    ];
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(set).map(cat => ({ value: cat!, label: cat! }));
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (search) {
      const lowSearch = search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lowSearch) || 
        (p.sku && p.sku.toLowerCase().includes(lowSearch))
      );
    }

    // Category
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter);
    }

    // Status
    if (statusFilter !== 'all') {
      result = result.filter(p => {
        if (statusFilter === 'instock') return p.stockQuantity > p.minStockLevel;
        if (statusFilter === 'lowstock') return p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel;
        if (statusFilter === 'outofstock') return p.stockQuantity === 0;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'stock-asc') return a.stockQuantity - b.stockQuantity;
      if (sortBy === 'stock-desc') return b.stockQuantity - a.stockQuantity;
      if (sortBy === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

    return result;
  }, [products, search, categoryFilter, statusFilter, sortBy]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(start, start + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage]);

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete}`);
      setIsConfirmOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error: any) {
      console.error('Failed to delete', error);
      alert(error.response?.data?.error || 'Failed to delete product. It might be linked to other records.');
      setIsConfirmOpen(false);
    }
  };

  const handleReset = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setSortBy('name-asc');
    setCurrentPage(1);
  };

  const getStockStatus = (p: Product) => {
    if (p.stockQuantity === 0) return { label: 'Out of Stock', class: 'badge-danger', icon: <XCircle size={12} /> };
    if (p.stockQuantity <= p.minStockLevel) return { label: 'Low Stock', class: 'badge-warning', icon: <AlertTriangle size={12} /> };
    return { label: 'In Stock', class: 'badge-success', icon: <CheckCircle2 size={12} /> };
  };

  return (
    <div className="page-container">
      <ModuleHeader 
        title="Stock Management"
        description="Manage your product inventory, pricing, and stock levels."
        actions={[
          { label: 'Bulk Import', icon: <Upload size={18} />, onClick: () => setIsBulkImportOpen(true) },
          { label: 'Add New Product', icon: <Plus size={18} />, onClick: () => { setEditingProduct(null); setIsFormOpen(true); }, variant: 'primary' }
        ]}
      />

      <StatGrid stats={productStats} />

      <FilterBar 
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by product name or SKU..."
        selectFilters={[
          { name: 'category', placeholder: 'All Categories', options: categories, value: categoryFilter, onChange: setCategoryFilter },
          { name: 'status', placeholder: 'All Status', options: [
            { value: 'instock', label: 'In Stock' },
            { value: 'lowstock', label: 'Low Stock' },
            { value: 'outofstock', label: 'Out of Stock' }
          ], value: statusFilter, onChange: setStatusFilter }
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { value: 'name-asc', label: 'Name (A-Z)' },
          { value: 'name-desc', label: 'Name (Z-A)' },
          { value: 'price-asc', label: 'Price (Low to High)' },
          { value: 'price-desc', label: 'Price (High to Low)' },
          { value: 'stock-asc', label: 'Stock (Low to High)' },
          { value: 'stock-desc', label: 'Stock (High to Low)' },
          { value: 'latest', label: 'Recently Added' }
        ]}
        onReset={handleReset}
      />

      {loading ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>Loading products...</div>
      ) : filteredAndSortedProducts.length === 0 ? (
        <EmptyState 
          icon={<Package size={32} />}
          title="No products found"
          description={search ? `We couldn't find anything matching "${search}". Please try a different search term or clear filters.` : "Get started by adding your first product to the inventory."}
          actionLabel={search ? undefined : "Add Product"}
          onAction={() => { setEditingProduct(null); setIsFormOpen(true); }}
        />
      ) : (
        <>
          <div className="card shadow-sm" style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Product Info</th>
                  <th>Brand/Cat</th>
                  <th>Price (Sale)</th>
                  <th>Stock</th>
                  <th>Min Level</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((p) => {
                  const status = getStockStatus(p);
                  return (
                    <tr key={p.id}>
                      <td style={{ minWidth: '250px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div className="product-img">
                            {p.image ? <img src={p.image} alt={p.name} /> : <Package size={20} color="#94a3b8" />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {p.sku || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.brand || '---'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.category || 'Uncategorized'}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>₹{p.price.toLocaleString()}</td>
                      <td style={{ fontWeight: 700 }}>
                        <span style={{ color: (p.stockQuantity || 0) === 0 ? 'var(--danger)' : (p.stockQuantity || 0) <= (p.minStockLevel || 0) ? 'var(--warning)' : 'inherit' }}>
                          {p.stockQuantity || 0} {p.unit || 'Units'}
                        </span>
                      </td>
                      <td className="text-muted">{p.minStockLevel || 0}</td>
                      <td>
                        <span className={`badge ${status.class}`}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button className="action-btn" onClick={() => { setEditingProduct(p); setIsFormOpen(true); }}><Edit2 size={16} /></button>
                          <button className="action-btn text-red" onClick={() => handleDeleteClick(p.id)}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage}
            totalItems={filteredAndSortedProducts.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {isFormOpen && (
        <ProductForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={() => {
            setIsFormOpen(false);
            fetchProducts();
          }}
          initialData={editingProduct} 
        />
      )}

      {isBulkImportOpen && (
        <BulkImport 
          onClose={() => setIsBulkImportOpen(false)}
          onSuccess={() => {
            setIsBulkImportOpen(false);
            fetchProducts();
          }}
        />
      )}

      <ConfirmDialog 
        isOpen={isConfirmOpen}
        title="Delete Product?"
        message="Are you sure you want to permanently delete this product? This action cannot be undone and will remove all movement history."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
        variant="danger"
      />
    </div>
  );
};

export default Products;
