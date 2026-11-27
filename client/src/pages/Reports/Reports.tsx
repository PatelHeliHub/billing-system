import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell
} from 'recharts';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  Download,
  AlertCircle,
  CheckCircle2,
  Receipt,
  BarChart3,
  Boxes
} from 'lucide-react';
import api from '../../utils/api';
import './Reports.css';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'inventory' | 'purchases' | 'closing'>('dashboard');
  const [salesSummary, setSalesSummary] = useState<any>(null);
  const [productStats, setProductStats] = useState<any[]>([]);
  const [inventoryHealth, setInventoryHealth] = useState<any>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [dailyClosing, setDailyClosing] = useState<any>(null);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportRange, setReportRange] = useState('month');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [reportRange]);

  useEffect(() => {
    if (activeTab === 'closing') {
      fetchDailyClosing();
    }
  }, [activeTab, targetDate]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const query = `?range=${reportRange}${reportRange === 'custom' ? `&startDate=${customDates.start}&endDate=${customDates.end}` : ''}`;
      
      const [salesRes, productRes, inventoryRes, purchaseRes] = await Promise.all([
        api.get(`/reports/sales-summary${query}`),
        api.get(`/reports/product-performance${query}`),
        api.get('/reports/inventory-health'),
        api.get('/reports/purchase-report')
      ]);

      setSalesSummary(salesRes.data);
      setProductStats(productRes.data);
      setInventoryHealth(inventoryRes.data);
      setPurchaseHistory(purchaseRes.data);
    } catch (err) {
      console.error('Failed to fetch report data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!salesSummary) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Metric,Value\n";
    csvContent += `Total Sales,${salesSummary.totalRevenue}\n`;
    csvContent += `Total Invoices,${salesSummary.invoiceCount}\n`;
    csvContent += `Average Order Value,${salesSummary.avgOrderValue}\n`;
    csvContent += `Low Stock Count,${salesSummary.lowStockCount}\n`;
    csvContent += `Inventory Value,${salesSummary.inventoryValue}\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `business_report_${reportRange}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchDailyClosing = async () => {
    try {
      const { data } = await api.get(`/reports/daily-closing?date=${targetDate}`);
      setDailyClosing(data);
    } catch (err) {
      console.error('Failed to fetch daily closing', err);
    }
  };

  if (loading) return <div className="reports-container text-center">Loading Analytics...</div>;

  return (
    <div className="reports-container">
      <div className="reports-header glass p-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Business Reports</h1>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>Analytics Dashboard</p>
        </div>
        
        <div className="report-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '4px 8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
             <BarChart3 size={16} className="text-muted" />
             <select 
               className="report-range-select"
               value={reportRange}
               onChange={(e) => setReportRange(e.target.value)}
               style={{ border: 'none', background: 'transparent', color: '#1e293b', fontWeight: 600, fontSize: '13px', outline: 'none' }}
             >
               <option value="today">Today</option>
               <option value="week">This Week</option>
               <option value="month">This Month</option>
               <option value="custom">Custom Range</option>
             </select>
           </div>

           {reportRange === 'custom' && (
             <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: '#f8fafc', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
               <input 
                 type="date" 
                 style={{ border: 'none', background: 'transparent', fontSize: '12px', fontWeight: 500 }}
                 onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
               />
               <span className="text-muted" style={{ fontSize: '11px' }}>-</span>
               <input 
                 type="date" 
                 style={{ border: 'none', background: 'transparent', fontSize: '12px', fontWeight: 500 }}
                 onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
               />
               <button className="btn-save" onClick={fetchReportData} style={{ padding: '4px 10px', fontSize: '12px' }}>Apply</button>
             </div>
           )}

           {activeTab === 'closing' && (
             <input 
               type="date" 
               className="erp-select" 
               value={targetDate} 
               onChange={(e) => setTargetDate(e.target.value)} 
               style={{ padding: '6px 10px', height: '36px' }}
             />
           )}
           
           <button className="btn-outline" onClick={handleExportCSV} style={{ height: '36px', gap: '6px', fontSize: '13px' }}>
             <Download size={16} /> Export
           </button>
        </div>
      </div>

      <div className="report-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'closing' ? 'active' : ''}`}
          onClick={() => setActiveTab('closing')}
        >
          Daily Closing
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Product Sales
        </button>
        <button 
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Stock Health
        </button>
        <button 
          className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          Purchases
        </button>
      </div>

      <div className="report-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-view animate-fade-in">
            <div className="kpi-grid">
              <div className="kpi-card glass">
                <div className="kpi-icon blue"><TrendingUp size={24} /></div>
                <div className="kpi-data">
                  <label>Total Sales ({reportRange})</label>
                  <h3>₹{salesSummary?.totalRevenue?.toLocaleString()}</h3>
                  <span className="trend positive">{salesSummary?.invoiceCount} Invoices</span>
                </div>
              </div>
              <div className="kpi-card glass">
                <div className="kpi-icon green"><ShoppingCart size={24} /></div>
                <div className="kpi-data">
                  <label>Average Order Value</label>
                  <h3>₹{salesSummary?.avgOrderValue?.toLocaleString()}</h3>
                  <span className="trend">Total / Invoices</span>
                </div>
              </div>
              <div className="kpi-card glass">
                <div className="kpi-icon amber"><AlertTriangle size={24} /></div>
                <div className="kpi-data">
                  <label>Low Stock items</label>
                  <h3>{salesSummary?.lowStockCount}</h3>
                  <span className={`trend ${salesSummary?.lowStockCount > 0 ? 'negative' : 'positive'}`}>
                    {salesSummary?.lowStockCount > 0 ? 'Action required' : 'Stock healthy'}
                  </span>
                </div>
              </div>
              <div className="kpi-card glass">
                <div className="kpi-icon purple"><Package size={24} /></div>
                <div className="kpi-data">
                  <label>Net Profit ({reportRange})</label>
                  <h3 className="text-purple">₹{salesSummary?.totalProfit?.toLocaleString()}</h3>
                  <span className="trend positive">After costs & tax</span>
                </div>
              </div>
              <div className="kpi-card glass">
                <div className="kpi-icon slate"><Boxes size={24} /></div>
                <div className="kpi-data">
                  <label>Inventory Value</label>
                  <h3>₹{salesSummary?.inventoryValue?.toLocaleString()}</h3>
                  <span className="trend">Live asset value</span>
                </div>
              </div>
            </div>

            {/* Actionable Insights Section */}
            <div className="insights-section mt-6 glass p-6">
              <h3 className="flex items-center gap-2 mb-4"><CheckCircle2 size={20} className="text-primary" /> Actionable Insights</h3>
              <div className="insights-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                <div className="insight-card" style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Performance Highlight</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    {productStats && productStats.length > 0 
                      ? `Top product this period: ${productStats[0].name || 'N/A'} (₹${(productStats[0].revenue || 0).toLocaleString()})` 
                      : 'No product performance data available for this period.'}
                  </p>
                </div>
                <div className="insight-card" style={{ borderLeft: '4px solid #f59e0b', paddingLeft: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Stock Risk</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    {(salesSummary?.lowStockCount || 0) > 0 
                      ? `${salesSummary.lowStockCount} items are low in stock. Reorder soon to avoid outages.` 
                      : 'Stock levels look healthy across all top categories.'}
                  </p>
                </div>
                <div className="insight-card" style={{ borderLeft: '4px solid #10b981', paddingLeft: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Sales Growth</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    Sales trend is looking {
                       (salesSummary?.trend && salesSummary.trend.length > 1 && salesSummary.trend[salesSummary.trend.length-1]?.revenue > salesSummary.trend[0]?.revenue) 
                       ? 'positive' 
                       : 'stable'
                    } with high transaction integrity.
                  </p>
                </div>
              </div>
            </div>

            <div className="charts-grid mt-6">
              <div className="chart-container glass">
                <div className="chart-header">
                  <h3>7-Day Sales Trend</h3>
                  <span className="sub-text">Revenue over the last week</span>
                </div>
                <div className="chart-body" style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesSummary?.trend}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-container glass">
                <div className="chart-header">
                  <h3>Top Selling Products</h3>
                  <span className="sub-text">Top 5 items by quantity</span>
                </div>
                <div className="chart-body" style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productStats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="quantity" radius={[4, 4, 0, 0]} barSize={40}>
                        {productStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="sales-view animate-fade-in">
             <div className="table-card glass">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                 <h3>Detailed Product Performance</h3>
               </div>
               <table className="data-table">
                 <thead>
                   <tr>
                     <th>Product Name</th>
                     <th>Quantity Sold</th>
                     <th>Total Revenue</th>
                     <th>Relative Performance</th>
                   </tr>
                 </thead>
                 <tbody>
                   {productStats.map((p, idx) => (
                     <tr key={idx}>
                       <td><strong>{p.name}</strong></td>
                       <td>{p.quantity} Units</td>
                       <td>₹{p.revenue.toLocaleString()}</td>
                       <td>
                          <div className="perf-bar-bg">
                             <div className="perf-bar-fill" style={{ width: `${(p.quantity / productStats[0].quantity) * 100}%`, backgroundColor: COLORS[idx % COLORS.length] }}></div>
                          </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="inventory-view animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="table-card glass h-fit">
                   <div className="p-4 border-b border-slate-100">
                     <h3 className="flex items-center gap-2 text-rose-600"><AlertTriangle size={18}/> Low Stock Alert</h3>
                   </div>
                   <table className="data-table">
                     <thead>
                       <tr>
                         <th>Product</th>
                         <th>Current</th>
                         <th>Threshold</th>
                         <th>Status</th>
                       </tr>
                     </thead>
                     <tbody>
                       {inventoryHealth?.lowStockItems?.map((item: any, idx: number) => (
                         <tr key={idx}>
                           <td>{item.name}</td>
                           <td className="text-rose-600 font-bold">{item.stockQuantity}</td>
                           <td>{item.minStockLevel}</td>
                           <td><span className="status-badge received">Order Soon</span></td>
                         </tr>
                       ))}
                       {inventoryHealth?.lowStockItems?.length === 0 && (
                         <tr><td colSpan={4} className="text-center py-8 text-slate-400">Inventory is healthy. All items above threshold.</td></tr>
                       )}
                     </tbody>
                   </table>
                </div>

                <div className="info-card glass flex flex-col items-center justify-center p-8 gap-4">
                   <div className="w-48 h-48 rounded-full border-8 border-emerald-500 flex items-center justify-center">
                      <div className="text-center">
                         <h2 className="text-3xl font-bold">100%</h2>
                         <p className="text-xs uppercase text-slate-400 font-bold">Stock Capacity</p>
                      </div>
                   </div>
                   <div className="text-center">
                      <h3 className="text-xl font-bold">Inventory Integrity</h3>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">All inventory movements are being tracked correctly across sales and purchases.</p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'closing' && dailyClosing && (
          <div className="closing-view animate-fade-in">
              <div className="kpi-grid">
                <div className="kpi-card glass">
                  <div className="kpi-icon blue"><TrendingUp size={24} /></div>
                  <div className="kpi-data">
                    <label>Daily Total Sales</label>
                    <h3>₹{(dailyClosing.totalSales || 0).toLocaleString()}</h3>
                    <span className="trend positive">{dailyClosing.invoiceCount || 0} Invoices</span>
                  </div>
                </div>
                <div className="kpi-card glass">
                  <div className="kpi-icon green"><CheckCircle2 size={24} className="text-emerald" /></div>
                  <div className="kpi-data">
                    <label>Revenue Collected</label>
                    <h3 className="text-emerald">₹{(dailyClosing.receivedAmount || 0).toLocaleString()}</h3>
                    <span className="trend">Actual cash in hand</span>
                  </div>
                </div>
                <div className="kpi-card glass">
                  <div className="kpi-icon amber"><AlertCircle size={24} className="text-red" /></div>
                  <div className="kpi-data">
                    <label>Due On Credit</label>
                    <h3 className="text-red">₹{(dailyClosing.dueAmount || 0).toLocaleString()}</h3>
                    <span className="trend negative">Outstanding receivables</span>
                  </div>
                </div>
                <div className="kpi-card glass">
                  <div className="kpi-icon purple"><ShoppingCart size={24} className="text-purple" /></div>
                  <div className="kpi-data">
                    <label>Estimated Net Profit</label>
                    <h3 className="text-purple">₹{(dailyClosing.totalProfit || 0).toLocaleString()}</h3>
                    <span className="trend positive">Based on recorded costs</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                 <div className="table-card glass">
                    <div className="p-4 border-b border-slate-700">
                       <h3>Payment Method Breakdown</h3>
                    </div>
                    <div className="p-6">
                       <div className="space-y-4">
                          <div className="flex justify-between items-center">
                             <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Cash</span>
                             <span className="font-bold">₹{(dailyClosing.paymentMethods?.cash || 0).toLocaleString()}</span>
                          </div>
                          <div className="perf-bar-bg"><div className="perf-bar-fill bg-emerald-500" style={{ width: `${dailyClosing.totalSales ? (dailyClosing.paymentMethods?.cash / dailyClosing.totalSales) * 100 : 0}%` }}></div></div>
                          
                          <div className="flex justify-between items-center">
                             <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> UPI</span>
                             <span className="font-bold">₹{(dailyClosing.paymentMethods?.upi || 0).toLocaleString()}</span>
                          </div>
                          <div className="perf-bar-bg"><div className="perf-bar-fill bg-blue-500" style={{ width: `${dailyClosing.totalSales ? (dailyClosing.paymentMethods?.upi / dailyClosing.totalSales) * 100 : 0}%` }}></div></div>
                          
                          <div className="flex justify-between items-center">
                             <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Card</span>
                             <span className="font-bold">₹{(dailyClosing.paymentMethods?.card || 0).toLocaleString()}</span>
                          </div>
                          <div className="perf-bar-bg"><div className="perf-bar-fill bg-amber-500" style={{ width: `${dailyClosing.totalSales ? (dailyClosing.paymentMethods?.card / dailyClosing.totalSales) * 100 : 0}%` }}></div></div>
                       </div>
                    </div>
                 </div>

                <div className="info-card glass p-6 flex flex-col justify-center items-center text-center gap-3">
                   <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Receipt size={32} />
                   </div>
                   <h3>End of Day Closing</h3>
                   <p className="text-slate-400 text-sm max-w-xs">Use this report to reconcile your cash drawer and digital payments at the end of the business day.</p>
                   <button className="btn-primary mt-2 w-full" onClick={() => window.print()}>Print Closing Report</button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'purchases' && (
          <div className="purchases-view animate-fade-in">
             <div className="table-card glass">
                <div className="p-4 border-b border-slate-100">
                  <h3>Recent Procurement History</h3>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Supplier</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseHistory.map((p, idx) => (
                      <tr key={idx}>
                        <td><strong>{p.purchaseNumber || 'N/A'}</strong></td>
                        <td>{p.supplier?.supplierName || 'Unknown Vendor'}</td>
                        <td>
                          {p.purchaseDate && !isNaN(Date.parse(p.purchaseDate)) 
                            ? new Date(p.purchaseDate).toLocaleDateString() 
                            : 'N/A'}
                        </td>
                        <td>₹{(p.totalAmount || 0).toLocaleString()}</td>
                        <td className="sub-text">{(p.items || []).length} Items</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
