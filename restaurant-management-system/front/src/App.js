import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './api/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import TrackOrder from './pages/TrackOrder';

import AdminLogin from './admin/AdminLogin';
import AdminRegister from './admin/AdminRegister';
import Dashboard from './admin/Dashboard';
import Categories from './admin/Categories';
import MenuItems from './admin/MenuItems';
import Orders from './admin/Orders';
import Tables from './admin/Tables';
import Users from './admin/Users';
import Reports from './admin/Reports';

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public restaurant site */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/menu" element={<PublicLayout><Menu /></PublicLayout>} />
          <Route path="/track-order" element={<PublicLayout><TrackOrder /></PublicLayout>} />

          {/* Admin panel */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/admin/menu-items" element={<ProtectedRoute><MenuItems /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/admin/tables" element={<ProtectedRoute><Tables /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
