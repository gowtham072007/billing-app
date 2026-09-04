import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AdminSidebar } from './components/common/AdminSidebar';
import { Navbar } from './components/common/Navbar';
import { SplashScreen } from './components/common/SplashScreen';

// Admin Pages
import { Dashboard } from './pages/admin/Dashboard';
import { Billing } from './pages/admin/Billing';
import { Products } from './pages/admin/Products';
import { Stock } from './pages/admin/Stock';
import { Orders } from './pages/admin/Orders';
import { DailyBills } from './pages/admin/DailyBills';
import { Customers } from './pages/admin/Customers';
import { Reports } from './pages/admin/Reports';
import { Settings } from './pages/admin/Settings';

// Customer Pages
import { CustomerCatalog } from './pages/customer/CustomerCatalog';
import { CartPage } from './pages/customer/CartPage';
import { MyOrders } from './pages/customer/MyOrders';
import { CustomerProfile } from './pages/customer/CustomerProfile';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Admin Route Guard
const AdminLayout: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xs font-mono">
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login?role=admin" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto max-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

// Customer Layout Wrapper
const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 no-print">
        <p>© 2026 QuickBill Retail POS & Order Management System. Optimized for 4-inch Thermal Receipt Printers.</p>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      {/* Root Route: Display Logo Animation Intro first, then transition to Sign In (/login) */}
      <Route
        path="/"
        element={
          <SplashScreen
            redirectPath={
              isAuthenticated
                ? isAdmin
                  ? '/admin/dashboard'
                  : '/customer/products'
                : '/login'
            }
          />
        }
      />
      <Route path="/splash" element={<SplashScreen redirectPath="/login" />} />

      {/* Auth Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="billing" element={<Billing />} />
        <Route path="products" element={<Products />} />
        <Route path="stock" element={<Stock />} />
        <Route path="orders" element={<Orders />} />
        <Route path="bills" element={<DailyBills />} />
        <Route path="customers" element={<Customers />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Customer Shop Routes */}
      <Route path="/customer" element={<CustomerLayout />}>
        <Route index element={<Navigate to="/customer/products" replace />} />
        <Route path="products" element={<CustomerCatalog />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="profile" element={<CustomerProfile />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
