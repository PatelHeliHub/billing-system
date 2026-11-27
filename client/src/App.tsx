import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import MainLayout from './layouts/MainLayout';
import LoginForm from './pages/Auth/LoginForm';
import RegisterForm from './pages/Auth/RegisterForm';
import Dashboard from './pages/Dashboard/Dashboard';
import Products from './pages/Products/Products';
import Customers from './pages/Customers/Customers';
import CustomerDetail from './pages/Customers/CustomerDetail';
import CustomerLedger from './pages/Customers/CustomerLedger';
import Invoices from './pages/Billing/Invoices';
import InvoiceForm from './pages/Billing/InvoiceForm';
import POS from './pages/Billing/POS';
import Inventory from './pages/Inventory/Inventory';
import Suppliers from './pages/Suppliers/Suppliers';
import SupplierDetail from './pages/Suppliers/SupplierDetail';
import Purchases from './pages/Purchases/Purchases';
import PurchaseForm from './pages/Purchases/PurchaseForm';
import PurchaseDetail from './pages/Purchases/PurchaseDetail';
import Reports from './pages/Reports/Reports';
import Users from './pages/Users/Users';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

// Placeholder Pages

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const { token, loading, user } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  
  const userRole = user?.role?.name || 'Cashier';
  if (roles && !roles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-id';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              
              <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<ProtectedRoute roles={['Admin', 'Manager']}><Products /></ProtectedRoute>} />
                <Route path="customers" element={<Customers />} />
                <Route path="customers/:id" element={<CustomerDetail />} />
                <Route path="customers/:id/ledger" element={<CustomerLedger />} />
                <Route path="billing" element={<ProtectedRoute roles={['Admin', 'Manager']}><Invoices /></ProtectedRoute>} />
                <Route path="billing/new" element={<ProtectedRoute roles={['Admin', 'Manager']}><InvoiceForm /></ProtectedRoute>} />
                <Route path="billing/:id" element={<ProtectedRoute roles={['Admin', 'Manager']}><InvoiceForm /></ProtectedRoute>} />
                <Route path="pos" element={<POS />} />
                <Route path="inventory" element={<ProtectedRoute roles={['Admin', 'Manager']}><Inventory /></ProtectedRoute>} />
                <Route path="suppliers" element={<ProtectedRoute roles={['Admin', 'Manager']}><Suppliers /></ProtectedRoute>} />
                <Route path="suppliers/:id" element={<ProtectedRoute roles={['Admin', 'Manager']}><SupplierDetail /></ProtectedRoute>} />
                <Route path="purchases" element={<ProtectedRoute roles={['Admin', 'Manager']}><Purchases /></ProtectedRoute>} />
                <Route path="purchases/new" element={<ProtectedRoute roles={['Admin', 'Manager']}><PurchaseForm /></ProtectedRoute>} />
                <Route path="purchases/:id" element={<ProtectedRoute roles={['Admin', 'Manager']}><PurchaseDetail /></ProtectedRoute>} />
                <Route path="reports" element={<ProtectedRoute roles={['Admin', 'Manager']}><Reports /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute roles={['Admin']}><Users /></ProtectedRoute>} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
