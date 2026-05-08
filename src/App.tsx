/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Auth from './pages/Auth';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderHistory from './pages/OrderHistory';
import SellerDashboard from './pages/SellerDashboard';
import SellerProducts from './pages/SellerProducts';
import SellerOrders from './pages/SellerOrders';
import Chat from './pages/Chat';
import Profile from './pages/Profile';

import AdminProducts from './pages/AdminProducts';
import AdminPromotions from './pages/AdminPromotions';
import AdminCoupons from './pages/AdminCoupons';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string | string[] }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  
  if (role) {
     const roles = Array.isArray(role) ? role : [role];
     if (!roles.includes(user.role)) return <Navigate to="/" />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/cart" element={<Cart />} />
      
      {/* Protected Routes */}
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/chat/:otherId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      
      {/* Seller Routes */}
      <Route path="/seller" element={<ProtectedRoute role={['seller', 'admin']}><SellerDashboard /></ProtectedRoute>} />
      <Route path="/seller/products" element={<ProtectedRoute role={['seller', 'admin']}><SellerProducts /></ProtectedRoute>} />
      <Route path="/seller/orders" element={<ProtectedRoute role={['seller', 'admin']}><SellerOrders /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/approvals" element={<ProtectedRoute role="admin"><AdminProducts /></ProtectedRoute>} />
      <Route path="/admin/promotions" element={<ProtectedRoute role="admin"><AdminPromotions /></ProtectedRoute>} />
      <Route path="/admin/coupons" element={<ProtectedRoute role="admin"><AdminCoupons /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute role="admin"><AdminOrders /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <AppRoutes />
            </main>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
