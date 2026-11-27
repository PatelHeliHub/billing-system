import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import api from '../../utils/api';
import './Billing.css';

interface Product {
  id: string;
  name: string;
  price: number;
  gstPercent: number;
  stock: number;
}

interface Customer {
  id: string;
  name: string;
}

interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  price: number; // For override
  gstPercent: number; // Read-only
  subtotal: number;
  discountPercent: number;
  taxAmount: number;
  total: number;
}

const InvoiceForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [customerId, setCustomerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, productsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/products')
      ]);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);

      if (isEdit) {
        const invoiceRes = await api.get(`/invoices/${id}`);
        const inv = invoiceRes.data;
        setCustomerId(inv.customerId);
        setDueDate(inv.dueDate ? inv.dueDate.split('T')[0] : '');
        setDiscountPercent(inv.discountPercent);
        setItems(inv.items.map((it: any) => ({
          ...it,
          subtotal: it.price * it.quantity
        })));
      }
    } catch (err) {
      console.error('Data fetch error', err);
    }
  };

  const addItem = (product: Product) => {
    const newItem: InvoiceItem = {
      productId: product.id,
      name: product.name,
      quantity: 1,
      price: product.price,
      gstPercent: product.gstPercent,
      subtotal: product.price,
      discountPercent: 0,
      taxAmount: 0, // Will be calculated
      total: 0 // Will be calculated
    };
    calculateItemTotals(newItem);
    setItems([...items, newItem]);
  };

  const calculateItemTotals = (item: InvoiceItem) => {
    const subtotal = item.price * item.quantity;
    const discountAmount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * (item.gstPercent / 100);
    
    item.subtotal = subtotal;
    item.taxAmount = tax;
    item.total = taxableAmount + tax;
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const nextItems = [...items];
    const item = { ...nextItems[index], [field]: value };
    
    if (field === 'price' || field === 'quantity') {
      calculateItemTotals(item);
    }
    
    nextItems[index] = item;
    setItems(nextItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Global recalculation when discount changes
  useEffect(() => {
    const updatedItems = items.map(item => {
      const updated = { ...item };
      calculateItemTotals(updated);
      return updated;
    });
    setItems(updatedItems);
  }, [discountPercent]);

  const subtotalAll = items.reduce((sum, it) => sum + it.subtotal, 0);
  const taxTotal = items.reduce((sum, it) => sum + it.taxAmount, 0);
  const grandTotal = items.reduce((sum, it) => sum + it.total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return setError('Please select a customer');
    if (items.length === 0) return setError('Please add at least one product');

    setLoading(true);
    try {
      const payload = {
        customerId,
        dueDate,
        discountPercent,
        items: items.map(it => ({
          productId: it.productId,
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          gstPercent: it.gstPercent
        }))
      };

      if (isEdit) {
        await api.put(`/invoices/${id}`, payload);
      } else {
        await api.post('/invoices', payload);
      }
      navigate('/billing');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="billing-container">
      <div className="billing-header">
        <button className="btn-outline" onClick={() => navigate('/billing')}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1>{isEdit ? 'Edit Invoice' : 'Create New Invoice'}</h1>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          <Save size={18} /> {loading ? 'Saving...' : 'Save Invoice'}
        </button>
      </div>

      {error && <div className="form-error mb-4">{error}</div>}

      <div className="invoice-form-card">
        <div className="form-header-grid">
          <div className="form-group">
            <label>Customer *</label>
            <select className="select-input" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input type="date" className="select-input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div className="items-section">
          <h3>Products / Services</h3>
          <div className="toolbar" style={{ border: 'none', padding: '16px 0' }}>
            <div className="search-box">
              <Plus size={18} className="search-icon" />
              <select 
                className="select-input" 
                style={{ width: '100%', paddingLeft: '40px' }}
                onChange={(e) => {
                  const p = products.find(prod => prod.id === e.target.value);
                  if (p) {
                    addItem(p);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">Search & Add Product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock} | Price: ₹{p.price})</option>
                ))}
              </select>
            </div>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Price (₹)</th>
                <th>GST %</th>
                <th>Subtotal</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td><strong>{item.name}</strong></td>
                  <td>
                    <input 
                      type="number" 
                      className="select-input quantity-input" 
                      value={item.quantity} 
                      min="1"
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)} 
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className="select-input price-input" 
                      value={item.price} 
                      onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)} 
                    />
                  </td>
                  <td>{item.gstPercent}%</td>
                  <td className="font-medium">₹{item.subtotal.toFixed(2)}</td>
                  <td>
                    <button className="remove-btn" onClick={() => removeItem(index)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals-section">
            <div className="totals-box">
              <div className="total-row">
                <span>Subtotal</span>
                <span>₹{subtotalAll.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Discount</span>
                  <input 
                    type="number" 
                    className="select-input" 
                    style={{ width: '60px', padding: '1px 4px' }} 
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  /> %
                </div>
                <span>- ₹{(subtotalAll * (discountPercent/100)).toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Total GST</span>
                <span>+ ₹{taxTotal.toFixed(2)}</span>
              </div>
              <div className="total-row grand-total">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
