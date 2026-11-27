import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import api from '../../utils/api';
import './Purchases.css';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Supplier {
  id: string;
  supplierName: string;
}

interface PurchaseRow {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  tax: number;
  subtotal: number;
}

const PurchaseForm: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [suppliersRes, productsRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/products')
      ]);
      setSuppliers(suppliersRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      console.error('Failed to fetch master data', err);
    }
  };

  const addRow = () => {
    const newRow: PurchaseRow = {
      productId: '',
      name: '',
      quantity: 1,
      price: 0,
      tax: 0,
      subtotal: 0
    };
    setRows([...rows, newRow]);
  };

  const updateRow = (index: number, field: keyof PurchaseRow, value: any) => {
    const newRows = [...rows];
    const row = { ...newRows[index] };

    if (field === 'productId') {
      const p = products.find(prod => prod.id === value);
      if (p) {
        row.productId = p.id;
        row.name = p.name;
        // Purchase price might differ from sales price, keep it 0 as default to force entry
      }
    } else {
      (row as any)[field] = value;
    }

    // Recalculate subtotal
    row.subtotal = (Number(row.price) * Number(row.quantity)) + Number(row.tax);
    newRows[index] = row;
    setRows(newRows);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const grandTotal = rows.reduce((sum, row) => sum + row.subtotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return setError('Please select a supplier');
    if (rows.length === 0) return setError('Please add at least one product');
    if (rows.some(r => !r.productId || r.quantity <= 0)) return setError('Please complete all product rows');

    try {
      setLoading(true);
      await api.post('/purchases', {
        supplierId,
        purchaseDate,
        items: rows
      });
      navigate('/purchases');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="purchases-container">
      <div className="purchases-header">
        <button className="btn-outline" onClick={() => navigate('/purchases')}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1>Create Purchase Order</h1>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          <Save size={18} /> {loading ? 'Saving...' : 'Create Order'}
        </button>
      </div>

      {error && <div className="form-error mb-4">{error}</div>}

      <div className="table-card" style={{ padding: '24px' }}>
        <div className="form-row" style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Supplier *</label>
            <select 
               className="select-input" 
               value={supplierId} 
               onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Select Vendor</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Purchase Date *</label>
            <input 
              type="date" 
              className="select-input" 
              value={purchaseDate} 
              onChange={(e) => setPurchaseDate(e.target.value)} 
            />
          </div>
        </div>

        <div className="items-list">
          <h3 style={{ marginBottom: '16px' }}>Items & Pricing</h3>
          <div className="purchase-row-grid sub-text" style={{ padding: '0 12px 12px 12px', borderBottom: '1px solid #f1f5f9' }}>
            <span>Product</span>
            <span>Quantity</span>
            <span>Price (per unit)</span>
            <span>Tax Amount</span>
            <span>Subtotal</span>
          </div>

          {rows.map((row, index) => (
            <div key={index} className="purchase-row-grid" style={{ alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
              <select 
                className="select-input" 
                value={row.productId} 
                onChange={(e) => updateRow(index, 'productId', e.target.value)}
              >
                <option value="">Select Product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input 
                type="number" 
                className="select-input" 
                value={row.quantity} 
                onChange={(e) => updateRow(index, 'quantity', parseInt(e.target.value) || 0)} 
              />
              <input 
                type="number" 
                className="select-input" 
                placeholder="Unit Cost" 
                value={row.price} 
                onChange={(e) => updateRow(index, 'price', parseFloat(e.target.value) || 0)} 
              />
              <input 
                type="number" 
                className="select-input" 
                placeholder="Tax" 
                value={row.tax} 
                onChange={(e) => updateRow(index, 'tax', parseFloat(e.target.value) || 0)} 
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="font-bold">₹{row.subtotal.toFixed(2)}</span>
                <button className="action-btn text-red" onClick={() => removeRow(index)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          <button className="btn-outline" style={{ marginTop: '12px' }} onClick={addRow}>
            <Plus size={16} /> Add Another Product
          </button>

          <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #f1f5f9', paddingTop: '24px' }}>
            <div style={{ textAlign: 'right' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Grand Total</label>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>₹{grandTotal.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseForm;
