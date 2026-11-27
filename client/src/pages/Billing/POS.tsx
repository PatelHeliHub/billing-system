import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Receipt, 
  Printer, 
  Send, 
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../../utils/api';
import CustomerForm from '../Customers/components/CustomerForm';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import './POS.css';

interface Product {
  id: string;
  name: string;
  price: number;
  gstPercent: number;
  stockQuantity: number;
  barcode?: string;
  category?: string;
}

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  gstPercent: number;
  stockQuantity: number;
}

const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [lastGeneratedInvoice, setLastGeneratedInvoice] = useState<any | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [isUPIConfirmed, setIsUPIConfirmed] = useState(false);
  const [cardRef, setCardRef] = useState('');
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [redeemedPoints, setRedeemedPoints] = useState(0);

  // Confirm Modal State
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
    searchInputRef.current?.focus();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [productsRes, customersRes] = await Promise.all([
        api.get('/products'),
        api.get('/customers')
      ]);
      setProducts(productsRes.data);
      setCustomers(customersRes.data);
      
      const walkIn = customersRes.data.find((c: any) => c.name.toLowerCase().includes('walk-in'));
      if (walkIn) {
        setCustomerId(walkIn.id);
        setCustomerSearch(walkIn.name);
      } else if (customersRes.data.length > 0) {
        setCustomerId(customersRes.data[0].id);
        setCustomerSearch(customersRes.data[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch POS data', err);
    }
  };

  // Handle Click Outside for Customer Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };

    if (showCustomerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomerDropdown]);

  const filteredProducts = useMemo(() => {
    if (!search) return products.slice(0, 20);
    const lower = search.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      (p.barcode && p.barcode.toLowerCase() === lower) ||
      (p.category && p.category.toLowerCase().includes(lower))
    ).slice(0, 50);
  }, [products, search]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const lower = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      (c.phone && c.phone.includes(lower))
    );
  }, [customers, customerSearch]);

  const addToOrder = (product: Product) => {
    if (product.stockQuantity <= 0) return;

    setOrderItems(prev => {
      const existing = prev.find(it => it.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev;
        return prev.map(it => it.productId === product.id ? { ...it, quantity: it.quantity + 1 } : it);
      }
      return [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        gstPercent: product.gstPercent,
        stockQuantity: product.stockQuantity
      }];
    });
    
    setSearch('');
    setTimeout(() => searchInputRef.current?.focus(), 10);
  };

  const handleCustomerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowCustomerDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search) {
      if (filteredProducts.length > 0) {
        addToOrder(filteredProducts[0]);
      }
    }
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) return removeItem(productId);
    setOrderItems(prev => prev.map(it => {
      if (it.productId === productId) {
        return { ...it, quantity: Math.min(qty, it.stockQuantity) };
      }
      return it;
    }));
  };

  const removeItem = (productId: string) => {
    setOrderItems(prev => prev.filter(it => it.productId !== productId));
  };

  const cartTotals = useMemo(() => {
    return orderItems.reduce((acc, item) => {
      const itemSubtotal = item.price * item.quantity;
      const itemTax = itemSubtotal * (item.gstPercent / 100);
      acc.subtotal += itemSubtotal;
      acc.tax += itemTax;
      return acc;
    }, { subtotal: 0, tax: 0 });
  }, [orderItems]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === customerId);
  }, [customers, customerId]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') return cartTotals.subtotal * (discountValue / 100);
    return discountValue;
  }, [cartTotals.subtotal, discountValue, discountType]);

  const totalBeforeRedemption = Math.max(0, cartTotals.subtotal - discountAmount + cartTotals.tax);
  const grandTotal = Math.max(0, totalBeforeRedemption - redeemedPoints);
  const earnedPoints = Math.floor(grandTotal / 100);
  const dueAmount = Math.max(0, grandTotal - amountPaid);
  const changeAmount = Math.max(0, amountPaid - grandTotal);

  const upiUri = useMemo(() => {
    const upiId = 'merchant@upi'; // Default placeholder
    const bizName = 'BillingSystem';
    return `upi://pay?pa=${upiId}&pn=${bizName}&am=${grandTotal.toFixed(2)}&cu=INR`;
  }, [grandTotal]);

  const isValidPayment = useMemo(() => {
    if (orderItems.length === 0) return false;
    if (!customerId) return false;
    if (paymentMethod === 'cash') return amountPaid >= grandTotal;
    if (paymentMethod === 'upi') return utrNumber.trim().length > 5 || isUPIConfirmed;
    return true; // Card
  }, [paymentMethod, amountPaid, grandTotal, utrNumber, isUPIConfirmed, orderItems.length, customerId]);

  useEffect(() => {
    if (paymentMethod !== 'cash') {
      setAmountPaid(grandTotal);
    }
  }, [grandTotal, paymentMethod]);

  const handleGenerateInvoice = async () => {
    if (!customerId) return alert('Please select a customer');
    if (!isValidPayment) return alert('Payment validation failed');

    setLoading(true);
    try {
      const payload = {
        customerId,
        items: orderItems.map(it => ({
          productId: it.productId,
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          gstPercent: it.gstPercent
        })),
        discountPercent: discountType === 'percent' ? discountValue : 0,
        redeemedPoints: Number(redeemedPoints),
        amountPaid: Number(amountPaid),
        paymentMethod,
        status: dueAmount <= 0 ? 'paid' : (amountPaid > 0 ? 'partial' : 'unpaid'),
        paymentNotes: paymentMethod === 'upi' ? `UTR: ${utrNumber}` : (paymentMethod === 'card' ? `Ref: ${cardRef}` : '')
      };

      const { data } = await api.post('/invoices', payload);
      setLastGeneratedInvoice(data);
      setShowReceipt(true);
      fetchInitialData();
      setOrderItems([]);
      setSearch('');
      setUtrNumber('');
      setCardRef('');
      setRedeemedPoints(0);
      setDiscountValue(0);
      setIsUPIConfirmed(false);
    } catch (err: any) {
      console.error('Invoice generation failed', err);
      const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message || 'Failed to generate invoice';
      alert(`POS Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (!lastGeneratedInvoice) return;
    
    // Find customer in existing customers state
    const customer = customers.find(c => c.id === lastGeneratedInvoice.customerId);
    const phone = customer?.phone || '';
    
    if (!phone) {
      alert('Customer has no phone number recorded for WhatsApp.');
      return;
    }

    // Basic Indian number formatting - prepend 91 if 10 digits
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const message = `✨ *INVOICE: ${lastGeneratedInvoice.invoiceNumber}* ✨\n\n` +
      `Hello *${customer?.name || 'Customer'}*,\n` +
      `Thank you for shopping with us! Here is your bill summary:\n\n` +
      `---------------------------------\n` +
      `📦 *Items List:*\n` +
      lastGeneratedInvoice.items.map((item: any) => `• ${item.name} x ${item.quantity} (₹${item.total.toLocaleString()})`).join('\n') +
      `\n---------------------------------\n\n` +
      `💰 *Grand Total: ₹${lastGeneratedInvoice.totalAmount.toLocaleString()}*\n` +
      `⭐ *Loyalty Points Earned:* ${lastGeneratedInvoice.earnedPoints} pts\n` +
      `💳 *Payment:* ${lastGeneratedInvoice.paymentMethod.toUpperCase()}\n` +
      `✅ *Status:* ${lastGeneratedInvoice.status.toUpperCase()}\n\n` +
      `Thank you! Visit us again soon! 🛍️`;
    
    const wpUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(wpUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pos-container">
      {/* Panel 1: Product Selection */}
      <div className="pos-left">
        <div className="pos-search-box">
          <Search size={18} className="pos-search-icon" />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Scan product or search (Enter to add)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="pos-product-list">
          {filteredProducts.map(p => {
            const isOutOfStock = p.stockQuantity <= 0;
            const isLowStock = p.stockQuantity < (p.minStockLevel || 10);
            
            return (
              <div 
                key={p.id} 
                className={`pos-product-card ${isOutOfStock ? 'out-of-stock' : ''}`} 
                onClick={() => !isOutOfStock ? addToOrder(p) : alert('Product is out of stock!')}
                style={{ opacity: isOutOfStock ? 0.6 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
              >
                <div className={`stock ${isOutOfStock ? 'text-red' : isLowStock ? 'text-orange' : 'text-success'}`} style={{ fontWeight: 700 }}>
                  {isOutOfStock ? 'OUT OF STOCK' : `Stock: ${p.stockQuantity}`}
                </div>
                <h4>{p.name}</h4>
                <div className="price">₹{p.price.toLocaleString()}</div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="text-muted text-center p-4" style={{ fontSize: '13px' }}>
              No products found
            </div>
          )}
        </div>
      </div>

      {/* Panel 2: Current Order / Cart */}
      <div className="pos-middle">
        <div className="pos-toolbar">
          <div className="customer-select-wrapper" ref={dropdownRef}>
             <div className="pos-input-with-icon" onClick={() => setShowCustomerDropdown(true)}>
                <CheckCircle2 size={16} className={customerId ? 'text-success' : 'text-muted'} />
                <input 
                  ref={customerSearchRef}
                  type="text" 
                  placeholder="Select Customer (Search by Phone/Name)..." 
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  onKeyDown={handleCustomerKeyDown}
                />
                {selectedCustomer && (
                  <div className="pos-customer-loyalty-badge">
                    <span>★ {selectedCustomer.loyaltyPoints || 0} Points</span>
                  </div>
                )}
             </div>
             {showCustomerDropdown && (
               <div className="customer-dropdown">
                  {filteredCustomers.length > 0 ? (
                    <>
                      {filteredCustomers.map(c => (
                        <div 
                          key={c.id} 
                          className={`customer-option ${c.id === customerId ? 'active' : ''}`}
                          onClick={() => {
                            setCustomerId(c.id);
                            setCustomerSearch(c.name);
                            setShowCustomerDropdown(false);
                          }}
                        >
                          <div className="customer-info-line">
                            <div className="name">{c.name}</div>
                            <div className="pts">{c.loyaltyPoints || 0} pts</div>
                          </div>
                          <div className="phone">{c.phone || 'No Phone'}</div>
                        </div>
                      ))}
                      <div className="dropdown-divider"></div>
                    </>
                  ) : (
                    <div className="p-3 text-muted text-center" style={{ fontSize: '12px' }}>
                      <AlertCircle size={16} style={{ marginBottom: '4px', opacity: 0.5 }} />
                      <div>No customers found</div>
                    </div>
                  )}
                  <button 
                    className="add-customer-btn"
                    onClick={() => {
                      setIsCustomerFormOpen(true);
                      setShowCustomerDropdown(false);
                    }}
                  >
                    <Plus size={14} /> Add New Customer
                  </button>
               </div>
             )}
          </div>
          
          <button 
            className="qty-btn danger-outline" 
            onClick={() => setIsResetConfirmOpen(true)}
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        
        <div className="pos-table-area">
          <table className="pos-table">
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th>Price</th>
                <th>GST</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map(item => {
                const itemTotal = (item.price * item.quantity) * (1 + item.gstPercent/100);
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
                    </td>
                    <td style={{ width: '120px' }}>
                      <div className="qty-control" style={{ margin: '0 auto' }}>
                        <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.quantity - 1)}><Minus size={14}/></button>
                        <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.quantity + 1)}><Plus size={14}/></button>
                      </div>
                    </td>
                    <td>₹{item.price.toLocaleString()}</td>
                    <td className="text-muted" style={{ fontSize: '12px' }}>{item.gstPercent}%</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{itemTotal.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', width: '40px' }}>
                      <Trash2 size={16} className="remove-item" onClick={() => removeItem(item.productId)} />
                    </td>
                  </tr>
                );
              })}
              {orderItems.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '8rem 0' }}>
                    <div style={{ opacity: 0.5 }}>
                      <Search size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                      <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                        Cart is empty. Start adding products.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel 3: Billing & Payment */}
      <div className="pos-right">
        <div className="pos-summary-card">
          <div className="summary-row">
            <span>Subtotal</span>
            <span style={{ color: 'var(--text-main)' }}>₹{cartTotals.subtotal.toFixed(2)}</span>
          </div>
          
          <div className="summary-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <span>Discount</span>
               <div className="discount-switcher">
                  <button 
                    onClick={() => setDiscountType('percent')}
                    className={discountType === 'percent' ? 'active' : ''}
                  >%</button>
                  <button 
                    onClick={() => setDiscountType('amount')}
                    className={discountType === 'amount' ? 'active' : ''}
                  >₹</button>
               </div>
               <input 
                type="number" 
                className="pos-input-mini"
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              />
            </div>
            <span className="text-danger" style={{ fontWeight: 600 }}>- ₹{discountAmount.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>GST Tax</span>
            <span style={{ color: 'var(--text-main)' }}>₹{cartTotals.tax.toFixed(2)}</span>
          </div>

          <div className="summary-row loyalty-row">
            <span>Loyalty Points Earned</span>
            <span className="text-success" style={{ fontWeight: 700 }}>+ {earnedPoints} Points</span>
          </div>

          <div className="summary-row total">
            <span>Grand Total</span>
            <span className="grand-total-amount">₹{grandTotal.toFixed(2)}</span>
          </div>

          {selectedCustomer && selectedCustomer.loyaltyPoints > 0 && (
            <div className="loyalty-redemption-box mt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase text-slate-500">Loyalty Redemption</span>
                <span className="text-xs font-medium text-primary">{selectedCustomer.loyaltyPoints} pts available</span>
              </div>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  className="pos-input-mini flex-1"
                  placeholder="Redeem Points"
                  value={redeemedPoints || ''}
                  onChange={(e) => {
                    const val = Math.min(
                      parseFloat(e.target.value) || 0, 
                      selectedCustomer.loyaltyPoints,
                      totalBeforeRedemption
                    );
                    setRedeemedPoints(val);
                  }}
                />
                <button 
                  className="btn-redeem-max"
                  onClick={() => setRedeemedPoints(Math.min(selectedCustomer.loyaltyPoints, totalBeforeRedemption))}
                >Max</button>
              </div>
              {redeemedPoints > 0 && (
                <div className="summary-row mt-2" style={{ borderTop: 'none', padding: 0 }}>
                  <span className="text-xs text-primary font-bold">Redeeming Points</span>
                  <span className="text-xs text-primary font-bold">- ₹{redeemedPoints.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="payment-section">
          <div className="payment-methods">
            <button className={`payment-btn ${paymentMethod === 'cash' ? 'active' : ''}`} onClick={() => setPaymentMethod('cash')}>
              <Banknote size={16} /> Cash
            </button>
            <button className={`payment-btn ${paymentMethod === 'upi' ? 'active' : ''}`} onClick={() => setPaymentMethod('upi')}>
              <Smartphone size={16} /> UPI
            </button>
            <button className={`payment-btn ${paymentMethod === 'card' ? 'active' : ''}`} onClick={() => setPaymentMethod('card')}>
              <CreditCard size={16} /> Card
            </button>
          </div>

          {paymentMethod === 'cash' && (
            <div className="payment-detail-card">
              <div className="payment-input-group">
                <label>Amount Received</label>
                <input 
                  type="number" 
                  className="pos-input-large"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className={`change-notice ${amountPaid >= grandTotal ? 'success' : 'danger'}`}>
                <span>{amountPaid >= grandTotal ? 'Change to Return' : 'Due Amount'}</span>
                <span className="balance">₹{Math.abs(amountPaid - grandTotal).toFixed(2)}</span>
              </div>
            </div>
          )}

          {paymentMethod === 'upi' && (
            <div className="payment-detail-card upi-centered">
               <div className="qr-box">
                 <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(upiUri)}`}
                    alt="Scan to Pay"
                 />
                 <p>Scan ₹{grandTotal.toFixed(2)} to Pay</p>
               </div>
               <div className="payment-input-group mt-2">
                  <label>Transaction ID / UTR</label>
                  <input 
                    type="text" 
                    className="pos-input-large" 
                    placeholder="Enter UTR Number"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                  />
               </div>
               <button 
                className={`pos-confirm-btn ${isUPIConfirmed ? 'confirmed' : ''}`}
                onClick={() => setIsUPIConfirmed(!isUPIConfirmed)}
               >
                 {isUPIConfirmed ? <><CheckCircle2 size={16}/> Payment Confirmed</> : 'Mark as Confirmed'}
               </button>
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="payment-detail-card">
              <div className="card-placeholder">
                <CreditCard size={32} />
                <p>Process payment on Card Terminal</p>
              </div>
              <div className="payment-input-group">
                  <label>Reference Number (Optional)</label>
                  <input 
                    type="text" 
                    className="pos-input-large" 
                    placeholder="Auth Code / Ref No"
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                  />
               </div>
            </div>
          )}
        </div>

        {showReceipt && lastGeneratedInvoice && (
          <div className="receipt-modal-overlay" onClick={() => setShowReceipt(false)}>
            <div className="receipt-paper" onClick={(e) => e.stopPropagation()}>
              <div className="receipt-header">
                <div className="shop-name">BILLING SYSTEM</div>
                <div className="shop-info">123 Business Avenue, City, State</div>
                <div className="shop-info">Phone: +91 98765 43210</div>
              </div>

              <div className="receipt-divider"></div>

              <div className="receipt-meta">
                <div><strong>Invoice:</strong> {lastGeneratedInvoice.invoiceNumber}</div>
                <div><strong>Date:</strong> {new Date().toLocaleString()}</div>
                <div><strong>Customer:</strong> {lastGeneratedInvoice.customer?.name || 'Walk-in'}</div>
              </div>

              <div className="receipt-divider"></div>

              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lastGeneratedInvoice.items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>₹{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="receipt-divider"></div>

              <div className="receipt-summary">
                <div className="row">
                  <span>Subtotal</span>
                  <span>₹{lastGeneratedInvoice.subtotal.toLocaleString()}</span>
                </div>
                {lastGeneratedInvoice.taxAmount > 0 && (
                  <div className="row">
                    <span>GST Tax</span>
                    <span>₹{lastGeneratedInvoice.taxAmount.toLocaleString()}</span>
                  </div>
                )}
                {lastGeneratedInvoice.redeemedPoints > 0 && (
                  <div className="row text-primary">
                    <span>Loyalty Discount</span>
                    <span>- ₹{lastGeneratedInvoice.redeemedPoints.toLocaleString()}</span>
                  </div>
                )}
                <div className="row grand-total">
                  <span>GRAND TOTAL</span>
                  <span>₹{lastGeneratedInvoice.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="receipt-loyalty">
                <div className="pts-earned">★ {lastGeneratedInvoice.earnedPoints} Points Earned Today</div>
              </div>

              <div className="receipt-footer">
                <p>Thank you for your business!</p>
                <div className="qr-tiny">
                   {/* Optional: Small QR to view bill online */}
                </div>
              </div>

              <div className="receipt-actions no-print">
                 <button className="receipt-btn print" onClick={handlePrint}>
                   <Printer size={18} /> Print Receipt
                 </button>
                 <button className="receipt-btn whatsapp" onClick={handleWhatsApp}>
                   <Send size={18} /> WhatsApp
                 </button>
                 <button className="receipt-btn close" onClick={() => setShowReceipt(false)}>
                   Done
                 </button>
              </div>
            </div>
          </div>
        )}

        <div className="action-buttons">
          <button 
            className="pos-btn btn-generate" 
            onClick={handleGenerateInvoice} 
            disabled={loading || orderItems.length === 0 || !isValidPayment}
          >
            {loading ? 'Processing...' : (
              <><Receipt size={18} /> Generate Invoice</>
            )}
          </button>
          <div className="secondary-actions">
            <button className="pos-btn btn-print" onClick={handlePrint} disabled={!lastGeneratedInvoice}>
              <Printer size={16} /> Print
            </button>
            <button className="pos-btn btn-whatsapp" onClick={handleWhatsApp} disabled={!lastGeneratedInvoice}>
              <Send size={16} /> Link
            </button>
          </div>
        </div>
      </div>

      {/* Hidden printing overlay logic or portal could go here */}

      {isCustomerFormOpen && (
        <CustomerForm 
          onClose={() => setIsCustomerFormOpen(false)}
          onSuccess={() => {
            setIsCustomerFormOpen(false);
            fetchInitialData();
          }}
          initialData={
            // Only pre-fill if no customer is currently selected
            !customerId && customerSearch ? (
              /^\d+$/.test(customerSearch) 
                ? { phone: customerSearch, name: '' } as any
                : { name: customerSearch, phone: '' } as any
            ) : null
          }
        />
      )}

      <ConfirmDialog 
        isOpen={isResetConfirmOpen}
        title="Clear Cart?"
        message="Are you sure you want to remove all items from the current cart? This action cannot be undone."
        onConfirm={() => {
          setOrderItems([]);
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
        variant="warning"
        confirmLabel="Clear All"
      />
    </div>
  );
};
export default POS;
