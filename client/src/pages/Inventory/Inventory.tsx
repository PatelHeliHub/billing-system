import React, { useState, useEffect } from 'react';
import { Package, History, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';
import api from '../../utils/api';
import './Inventory.css';

interface InventoryItem {
  id: string;
  name: string;
  stockQuantity: number;
  minStockLevel: number;
  category: string;
  status: string;
  isLowStock: boolean;
}

interface Movement {
  id: string;
  productId: string;
  product: { name: string };
  movementType: string;
  quantity: number;
  referenceId: string;
  createdAt: string;
}

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'movements'>('overview');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverview();
    } else {
      fetchMovements();
    }
  }, [activeTab]);

  const fetchOverview = async () => {
    try {
      const { data } = await api.get('/inventory/overview');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch inventory overview', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const { data } = await api.get('/inventory/movements');
      setMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch movements', err);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="card">
        <div className="card-header">
          <div>
            <h3>Stock Management</h3>
            <p className="text-muted text-sm">Track stock levels and movements in real-time</p>
          </div>
          <div className="tab-switcher">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Package size={18} /> Overview
            </button>
            <button 
              className={`tab-btn ${activeTab === 'movements' ? 'active' : ''}`}
              onClick={() => setActiveTab('movements')}
            >
              <History size={18} /> Movement History
            </button>
          </div>
        </div>

        <div className="table-responsive">
          {activeTab === 'overview' ? (
            loading ? (
              <div className="p-8 text-center text-muted">Loading inventory...</div>
            ) : (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Current Stock</th>
                      <th>Min Level</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => {
                      const statusClass = item.stockQuantity === 0 ? 'badge-red' : item.stockQuantity < item.minStockLevel ? 'badge-orange' : 'badge-green';
                      
                      return (
                        <tr key={item.id}>
                          <td><strong>{item.name || 'Unknown Product'}</strong></td>
                          <td><span className="badge badge-grey">{item.category || 'Uncategorized'}</span></td>
                          <td style={{ fontWeight: 800, fontSize: '1rem' }} className={(item.stockQuantity || 0) === 0 ? 'text-red' : (item.stockQuantity || 0) < (item.minStockLevel || 0) ? 'text-orange' : 'text-success'}>
                            {item.stockQuantity || 0}
                          </td>
                          <td className="text-muted">{item.minStockLevel || 0}</td>
                          <td>
                            <span className={`badge ${statusClass}`} style={{ fontWeight: 700 }}>
                              {(item.stockQuantity || 0) === 0 ? 'Out of Stock' : (item.stockQuantity || 0) < (item.minStockLevel || 0) ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
            )
          ) : (
            loading ? (
               <div className="p-8 text-center text-muted">Loading movements...</div>
            ) : (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      <th>Movement Type</th>
                      <th>Quantity</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map(m => (
                      <tr key={m.id}>
                        <td className="text-muted">
                          {m.createdAt && !isNaN(Date.parse(m.createdAt)) 
                            ? new Date(m.createdAt).toLocaleString() 
                            : 'N/A'}
                        </td>
                        <td><strong>{m.product?.name || 'Deleted Product'}</strong></td>
                        <td>
                          <span className={`movement-type ${(m.movementType || 'ADJUSTMENT').toLowerCase()} badge ${m.movementType === 'SALE' ? 'badge-red' : m.movementType === 'PURCHASE' ? 'badge-blue' : 'badge-grey'}`}>
                            {m.movementType === 'SALE' && <ArrowDownRight size={14} />}
                            {m.movementType === 'PURCHASE' && <ArrowUpRight size={14} />}
                            {m.movementType === 'ADJUSTMENT' && <RefreshCcw size={14} />}
                            {m.movementType || 'ADJUSTMENT'}
                          </span>
                        </td>
                        <td className="font-medium">{m.quantity || 0}</td>
                        <td className="text-muted">{m.referenceId || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            )
          )}
        </div>
      </div>
  );
};

export default Inventory;
