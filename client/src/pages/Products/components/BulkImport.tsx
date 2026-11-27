import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, FileText, Download } from 'lucide-react';
import api from '../../../utils/api';

interface BulkImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

const BulkImport: React.FC<BulkImportProps> = ({ onClose, onSuccess }) => {
  const [csvData, setCsvData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const sampleCsv = "name,category,price,costPrice,stockQuantity,minStockLevel,sku,barcode,gstPercent\nWireless Mouse,Electronics,599,350,50,10,MS-001,890123456789,18\nGaming Keyboard,Electronics,1299,800,30,5,KB-001,890123456790,18";

  const parseCSV = () => {
    setError(null);
    if (!csvData.trim()) {
      setError("Please paste some CSV data first.");
      return;
    }

    try {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const required = ['name', 'price'];
      const missing = required.filter(h => !headers.includes(h));
      
      if (missing.length > 0) {
        setError(`Missing required columns: ${missing.join(', ')}`);
        return;
      }

      const products = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const product: any = {};
        headers.forEach((header, i) => {
          product[header] = values[i];
        });
        return product;
      });

      setPreview(products);
    } catch (err) {
      setError("Failed to parse CSV. Ensure it is comma-separated.");
    }
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      await api.post('/products/bulk', { products: preview });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Import failed. Check for duplicate SKUs or Barcodes.");
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = () => {
    const element = document.createElement("a");
    const file = new Blob([sampleCsv], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "product_import_sample.csv";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="action-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Upload size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Bulk Import Products</h2>
          </div>
          <button className="action-btn" onClick={onClose} style={{ borderRadius: '50%' }}><X size={20} /></button>
        </div>

        <div className="drawer-content" style={{ padding: '1.5rem' }}>
          <div className="alert-info flex items-center gap-3 p-4 rounded-xl mb-6" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', color: '#0369a1' }}>
            <FileText size={20} />
            <div style={{ fontSize: '0.85rem' }}>
              <strong>Instructions:</strong> Paste comma-separated values (CSV) below. Required columns: <em>name, price</em>. 
              <button onClick={downloadSample} className="text-primary underline ml-2" style={{ background: 'none', border: 'none', padding: 0, fontSize: 'inherit', fontWeight: 700 }}>Download Sample CSV</button>
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              CSV Data
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>Comma-separated (Headers in first line)</span>
            </label>
            <textarea 
              rows={8} 
              className="pos-input-large" 
              placeholder="name,category,price,sku..."
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '13px' }}
            ></textarea>
          </div>

          <button 
            type="button" 
            className="btn-outline w-full mt-2" 
            onClick={parseCSV}
            style={{ padding: '0.75rem' }}
          >
            Preview Import Data ({csvData.split('\n').length > 1 ? csvData.split('\n').length - 1 : 0} items)
          </button>

          {error && (
            <div className="flex items-center gap-2 text-red font-bold mt-4 p-3 bg-red/5 rounded-lg" style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {preview.length > 0 && !error && (
            <div className="import-preview-list mt-6">
              <h4 className="mb-2" style={{ fontSize: '0.9rem', fontWeight: 700 }}>Data Preview</h4>
              <div className="card" style={{ padding: 0, maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
                <table className="erp-table mini">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: '0.8rem' }}>{p.name}</td>
                        <td style={{ fontSize: '0.8rem' }}>{p.category || '---'}</td>
                        <td style={{ fontSize: '0.8rem' }}>₹{p.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button type="button" className="btn-outline" onClick={onClose} style={{ padding: '0.75rem 1.5rem' }}>Cancel</button>
          <button 
            type="button" 
            className="btn-primary" 
            disabled={loading || preview.length === 0} 
            onClick={handleImport}
            style={{ padding: '0.75rem 2rem' }}
          >
            {loading ? 'Importing...' : <><CheckCircle2 size={18} /> Confirm & Import</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkImport;
