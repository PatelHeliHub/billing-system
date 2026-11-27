import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ShoppingCart, 
  Users, 
  Package, 
  AlertTriangle, 
  IndianRupee, 
  ArrowRight,
  UserPlus,
  ShoppingBag,
  FileText,
  TrendingUp,
  CreditCard,
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import MetricCard from './components/MetricCard';
import api from '../../utils/api';
import './Dashboard.css';

interface StatsResponse {
  totalCount: number;
  salesToday: number;
  profitToday: number;
  ordersToday: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  salesTrend: number;
  orderTrend: number;
  amounts: {
    total: number;
    received: number;
    overdue: number;
    pending: number;
  };
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isAuthError = error?.toLowerCase().includes('unauthorized') || error?.toLowerCase().includes('token');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, invoicesRes, reportRes] = await Promise.all([
        api.get('/invoices/stats'),
        api.get('/invoices/list', { params: { limit: 6 } }),
        api.get('/reports/sales-summary', { params: { range: 'week' } })
      ]);

      setStats(statsRes.data);
      setRecentInvoices(Array.isArray(invoicesRes.data) ? invoicesRes.data : []);
      setChartData(reportRes.data.trend || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      const msg = error.response?.data?.error || error.message || 'Failed to load dashboard statistics.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading) return (
    <div className="dashboard-loading-container">
      <div className="loader-orbit">
        <div className="orbit-dot"></div>
        <div className="orbit-dot"></div>
        <div className="orbit-dot"></div>
      </div>
      <p>Syncing Business Data...</p>
    </div>
  );

  if (error || !stats) {
    return (
      <div className="error-state-container">
        <div className="error-card">
          <div className="error-icon-wrapper">
            <AlertTriangle size={48} />
          </div>
          <h2>{isAuthError ? 'Access Revoked' : 'Connection Error'}</h2>
          <p>{isAuthError ? 'Your credentials have expired. Please authenticate again.' : error}</p>
          <button className="btn-retry" onClick={isAuthError ? handleLogout : fetchDashboardData}>
            {isAuthError ? 'Login Again' : 'Try Reconnecting'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-modern">
      {/* Header Section */}
      <div className="dashboard-top-bar">
        <div className="welcome-text">
          <h1>Enterprise Dashboard</h1>
          <p>Real-time analytics & business insights.</p>
        </div>
        <div className="top-bar-actions">
          <div className="date-badge">
            <div className="dot animate-pulse"></div>
            Live: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>

      {/* Hero Stats Grid */}
      <div className="stats-grid-modern">
        <MetricCard 
          title="Daily Revenue" 
          value={`₹${stats.salesToday.toLocaleString()}`} 
          icon={<IndianRupee size={20} />} 
          trend={stats.salesTrend}
          iconBg="linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)"
          iconColor="#15803d"
        />
        <MetricCard 
          title="Daily Orders" 
          value={stats.ordersToday} 
          icon={<ShoppingCart size={20} />} 
          trend={stats.orderTrend}
          iconBg="linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)"
          iconColor="#0369a1"
        />
        <MetricCard 
          title="Daily Profit" 
          value={`₹${stats.profitToday.toLocaleString()}`} 
          icon={<TrendingUp size={20} />} 
          iconBg="linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)"
          iconColor="#7e22ce"
        />
        <MetricCard 
          title="Accounts Receivable" 
          value={`₹${stats.amounts.pending.toLocaleString()}`} 
          icon={<FileText size={20} />} 
          iconBg="linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)"
          iconColor="#b91c1c"
        />
      </div>

      {/* Main Content Layout */}
      <div className="dashboard-main-layout">
        {/* Left Column: Chart & Table */}
        <div className="layout-col-left">
          {/* Chart Section */}
          <div className="glass-card chart-container">
            <div className="card-header-modern">
              <div className="title-group">
                <h3>Sales Performance</h3>
                <span className="subtitle">Revenue trend for the past 7 days</span>
              </div>
              <div className="chart-legend">
                <span className="legend-item"><div className="dot revenue"></div> Revenue</span>
              </div>
            </div>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      fontWeight: '700'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#4f46e5" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="glass-card table-card">
            <div className="card-header-modern">
              <h3>Latest Transactions</h3>
              <button className="btn-view-all" onClick={() => navigate('/billing')}>
                View Ledger <ArrowRight size={16} />
              </button>
            </div>
            <div className="modern-table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Client</th>
                    <th>Volume</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="id-cell"><span>{inv.invoiceNumber}</span></td>
                      <td className="client-cell">
                        <div className="client-avatar">{inv.customer?.name?.[0] || 'W'}</div>
                        {inv.customer?.name || 'Walk-in Customer'}
                      </td>
                      <td className="amount-cell">₹{inv.totalAmount?.toLocaleString()}</td>
                      <td>
                        <span className={`status-pill ${inv.status || 'unpaid'}`}>
                          {inv.status || 'unpaid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Small Stats */}
        <div className="layout-col-right">
          {/* Main Action Card */}
          <div className="pos-hero-card">
            <div className="pos-card-content">
              <div className="pos-icon"><ShoppingCart size={32} /></div>
              <h2>Terminal</h2>
              <p>Execute point-of-sale operations and inventory sync.</p>
              <button className="btn-launch-pos" onClick={() => navigate('/pos')}>
                Launch POS <Plus size={18} />
              </button>
            </div>
            <div className="pos-pattern"></div>
          </div>

          {/* Quick Stats Column */}
          <div className="quick-stats-col">
            <div className="mini-stat-card">
              <div className="mini-icon purple"><Users size={20} /></div>
              <div className="mini-data">
                <span className="label">Customers</span>
                <span className="val">{stats.totalCustomers}</span>
              </div>
            </div>
            <div className="mini-stat-card">
              <div className="mini-icon blue"><Package size={20} /></div>
              <div className="mini-data">
                <span className="label">Total SKUs</span>
                <span className="val">{stats.totalProducts}</span>
              </div>
            </div>
            <div className="mini-stat-card">
              <div className="mini-icon orange"><AlertTriangle size={20} /></div>
              <div className="mini-data">
                <span className="label">Stock Alerts</span>
                <span className="val danger">{stats.lowStockCount}</span>
              </div>
            </div>
          </div>

          {/* Nav Shortcuts */}
          <div className="shortcuts-card">
            <h4 className="section-title">Operations</h4>
            <div className="shortcut-list">
              <div className="shortcut-item" onClick={() => navigate('/billing/new')}>
                <div className="s-icon green"><CreditCard size={18} /></div>
                <span>New Invoice</span>
              </div>
              <div className="shortcut-item" onClick={() => navigate('/products')}>
                <div className="s-icon indigo"><Package size={18} /></div>
                <span>Products</span>
              </div>
              <div className="shortcut-item" onClick={() => navigate('/customers')}>
                <div className="s-icon purple"><UserPlus size={18} /></div>
                <span>Clients</span>
              </div>
              <div className="shortcut-item" onClick={() => navigate('/purchases')}>
                <div className="s-icon blue"><ShoppingBag size={18} /></div>
                <span>Vendors</span>
              </div>
              <div className="shortcut-item" onClick={() => navigate('/reports')}>
                <div className="s-icon slate"><Target size={18} /></div>
                <span>Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
