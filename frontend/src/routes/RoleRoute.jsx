import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const RoleRoute = ({ allowedRoles = [] }) => {
  const { user } = useAuth();
  const userRole = user?.role || 'employee';

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
