import React, { useState, useEffect } from 'react';
import { X, Save, Package, DollarSign, Info, Boxes, Image as ImageIcon } from 'lucide-react';
import api from '../../../utils/api';
import type { Product } from '../Products';

interface ProductFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData: Product | null;
}

const ProductForm: React.FC<ProductFormProps> = ({ onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    brand: initialData?.brand || '',
    unit: initialData?.unit || 'pcs',
    sku: initialData?.sku || '',
    barcode: initialData?.barcode || '',
    price: initialData?.price || '',
    costPrice: initialData?.costPrice || '',
    gstPercent: initialData?.gstPercent || '18',
    taxType: initialData?.taxType || 'Exclusive',
    hsnCode: initialData?.hsnCode || '',
    stockQuantity: initialData?.stockQuantity || '',
    minStockLevel: initialData?.minStockLevel || '10',
    description: initialData?.description || '',
    supplierId: initialData?.supplierId || '',
    image: initialData?.image || ''
  });
  
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data } = await api.get('/suppliers');
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const generateBarcode = () => {
    // Generate a random 12-digit number (standard UPC-A style)
    const randomDigits = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setFormData({ ...formData, barcode: randomDigits });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (initialData) {
        await api.put(`/products/${initialData.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="action-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Package size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {initialData ? 'Edit Product' : 'Add New Product'}
            </h2>
          </div>
          <button className="action-btn" onClick={onClose} style={{ borderRadius: '50%' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="drawer-content">
            {error && <div className="badge badge-danger" style={{ width: '100%', marginBottom: '1.5rem', padding: '0.75rem' }}>{error}</div>}

            <div className="form-section-title"><Info size={16} /> Basic Information</div>
            <div className="form-group">
              <label>Product Name *</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Wireless Mouse" />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>SKU Code</label>
                <input type="text" name="sku" value={formData.sku} onChange={handleChange} placeholder="e.g. ITM-001" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="e.g. Electronics" />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Brand</label>
                <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g. Logitech" />
              </div>
              <div className="form-group">
                <label>Supplier</label>
                <select name="supplierId" value={formData.supplierId} onChange={handleChange}>
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Unit</label>
              <select name="unit" value={formData.unit} onChange={handleChange}>
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="box">Box</option>
                <option value="pkt">Packet</option>
                <option value="mtr">Meter</option>
              </select>
            </div>

            <div className="form-section-title"><DollarSign size={16} /> Pricing</div>
            <div className="form-grid">
              <div className="form-group">
                <label>Purchase Price (₹)</label>
                <input type="number" step="0.01" name="costPrice" value={formData.costPrice} onChange={handleChange} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Selling Price (₹) *</label>
                <input type="number" step="0.01" required name="price" value={formData.price} onChange={handleChange} placeholder="0.00" />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>GST %</label>
                <select name="gstPercent" value={formData.gstPercent} onChange={handleChange}>
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tax Type</label>
                <select name="taxType" value={formData.taxType} onChange={handleChange}>
                  <option value="Exclusive">GST Exclusive</option>
                  <option value="Inclusive">GST Inclusive</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>HSN Code</label>
              <input type="text" name="hsnCode" value={formData.hsnCode} onChange={handleChange} placeholder="8-digit HSN code" />
            </div>

            <div className="form-section-title"><Boxes size={16} /> Inventory</div>
            <div className="form-grid">
              <div className="form-group">
                <label>Opening Stock</label>
                <input type="number" required name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Low Stock Warning</label>
                <input type="number" name="minStockLevel" value={formData.minStockLevel} onChange={handleChange} placeholder="10" />
              </div>
            </div>

            <div className="form-section-title"><ImageIcon size={16} /> Visuals & Identifiers</div>
            <div className="form-group">
              <label>Barcode (EAN/UPC)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  name="barcode" 
                  value={formData.barcode} 
                  onChange={handleChange} 
                  placeholder="Scan or type barcode" 
                  style={{ flex: 1 }}
                />
                <button 
                  type="button" 
                  className="btn-outline" 
                  onClick={generateBarcode}
                  style={{ padding: '0 1rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                >
                  Generate
                </button>
              </div>
              <small style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.25rem', display: 'block' }}>
                Tip: Click "Generate" to create a unique internal code for this item.
              </small>
            </div>
            
            <div className="form-group">
              <label>Product Image URL</label>
              <input type="text" name="image" value={formData.image} onChange={handleChange} placeholder="https://example.com/item-photo.jpg" />
              <small style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.25rem', display: 'block' }}>
                Paste a link to an image. This will be shown in the Point of Sale terminal.
              </small>
            </div>

            <div className="form-group">
              <label>Product Description</label>
              <textarea name="description" rows={3} value={formData.description} onChange={handleChange} placeholder="More details about the product..."></textarea>
            </div>
          </div>
          
          <div className="drawer-footer">
            <button type="button" className="btn-outline" onClick={onClose} style={{ padding: '0.75rem 1.5rem' }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.75rem 2rem' }}>
              <Save size={18} /> {loading ? 'Saving...' : 'Save Product Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
