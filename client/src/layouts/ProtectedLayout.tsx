import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAdminAuthStore } from '../store/adminAuthStore';

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAdminAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default ProtectedLayout;

