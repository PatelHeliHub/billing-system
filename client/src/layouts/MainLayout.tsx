import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Receipt, 
  Boxes, 
  BarChart3, 
  LogOut,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  LayoutDashboard,
  Package,
  Truck,
  ShoppingBag,
  Settings,
  Users,
  ChevronRight,
  User as UserIcon,
  Search,
  Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../utils/api';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const { hasPermission, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [expandedSections, setExpandedSections] = useState<string[]>(['core']);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const sections = [
    {
      id: 'core',
      label: 'Core Modules',
      items: [
        { path: '/', icon: <LayoutDashboard size={18} />, label: 'Billing Dashboard', roles: ['Admin', 'Manager'] },
        { path: '/products', icon: <Package size={18} />, label: 'Products', roles: ['Admin', 'Manager'] },
        { path: '/customers', icon: <Users size={18} />, label: 'Customers', roles: ['Admin', 'Manager', 'Cashier'] },
        { path: '/billing', icon: <Receipt size={18} />, label: 'Invoices & Billing', roles: ['Admin', 'Manager'] },
        { path: '/pos', icon: <ShoppingCart size={18} />, label: 'Point of Sale', roles: ['Admin', 'Manager', 'Cashier'] },
      ]
    },
    {
      id: 'logistics',
      label: 'Inventory & Stock',
      items: [
        { path: '/inventory', icon: <Boxes size={18} />, label: 'Stock Management', roles: ['Admin', 'Manager'] },
        { path: '/suppliers', icon: <Truck size={18} />, label: 'Suppliers', roles: ['Admin', 'Manager'] },
        { path: '/purchases', icon: <ShoppingBag size={18} />, label: 'Purchases', roles: ['Admin', 'Manager'] },
      ]
    },
    {
      id: 'system',
      label: 'System & Reports',
      items: [
        { path: '/reports', icon: <BarChart3 size={18} />, label: 'Business Reports', roles: ['Admin', 'Manager'] },
        { path: '/users', icon: <Settings size={18} />, label: 'Users & Roles', roles: ['Admin'] },
      ]
    }
  ];

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
       console.error('Failed to mark read', err);
    }
  };

  const userRole = user?.role?.name || 'Cashier';

  const currentPageLabel = [...sections[0].items, ...sections[1].items, ...sections[2].items]
    .find(item => item.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="bg-primary p-2 rounded-lg text-white">
            <Receipt size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem' }}>🧾 Billing System</h2>
            <p style={{ fontSize: '0.65rem', opacity: 0.6, color: 'white', marginTop: '-2px' }}>
              Retail Billing & Inventory
            </p>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          {sections.map(section => {
            const authorizedItems = section.items.filter(item => 
              item.roles.includes(userRole)
            );

            if (authorizedItems.length === 0) return null;

            const isExpanded = expandedSections.includes(section.id);

            const displaySectionLabel = section.id === 'core' ? 'Core Modules' 
              : section.id === 'logistics' ? 'Inventory & Stock' 
              : 'System & Reports';

            return (
              <React.Fragment key={section.id}>
                <div 
                  className={`nav-item ${isExpanded ? 'expanded' : ''}`} 
                  onClick={() => toggleSection(section.id)}
                  style={{ cursor: 'pointer', marginTop: section.id !== 'core' ? '1rem' : '0' }}
                >
                  <div className="nav-section-label" style={{ padding: 0, margin: 0 }}>
                    {displaySectionLabel}
                  </div>
                  <ChevronRight size={14} className="chevron" />
                </div>

                {isExpanded && authorizedItems.map((item) => (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                    style={{ paddingLeft: '1.5rem' }}
                  >
                    <div className="nav-item-content">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  </Link>
                ))}
              </React.Fragment>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="name">{user?.name}</div>
              <div className="email">{user?.role?.name || 'User'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="content-header">
          <h1>{currentPageLabel}</h1>
          
          <div className="header-actions">
            <div className="relative hidden md:block" style={{ position: 'relative' }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={16} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-white/10 border-none text-white placeholder-white/60 rounded-full px-10 py-2 focus:ring-2 focus:ring-white/20 w-64 text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '999px', padding: '8px 40px', fontSize: '14px' }}
              />
            </div>

            <div className="flex items-center gap-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="notification-bell" 
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge" style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount}</span>}
              </div>

              <div className="header-user-dropdown">
                <div className="user-avatar" style={{ width: '32px', height: '32px' }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="user-name hidden sm:inline">{user?.name}</span>
              </div>
            </div>

            {showNotifications && (
              <div className="notification-dropdown" style={{ position: 'absolute', top: '60px', right: '2rem', zIndex: 1000 }}>
                <div className="notification-list-header">
                  <h3>Notifications</h3>
                </div>
                <div className="notification-scroll-area">
                  {notifications.length === 0 ? (
                    <div className="empty-notifications">No new notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                        onClick={() => markAsRead(n.id)}
                      >
                        <div className="notification-icon">
                          {n.type === 'low_stock' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                        </div>
                        <div className="notification-content">
                          <h4>{n.title}</h4>
                          <p>{n.message}</p>
                          <span>{new Date(n.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
