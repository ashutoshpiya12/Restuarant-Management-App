import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user || !user.is_staff) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
