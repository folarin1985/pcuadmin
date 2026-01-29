import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from './Spinner';

const RoleGuard = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  // --- ROLE EXTRACTION (Same robust logic as Sidebar) ---
  const userRole = (() => {
    if (!user) return '';
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles[0].name;
    }
    // Fallback for string/object formats
    if (typeof user.role === 'string') return user.role;
    if (user.role?.name) return user.role.name;
    return '';
  })();

  // 1. Check if User is Logged In
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Check if User has Permission
  // If allowedRoles is empty, we assume ANY logged-in user can access.
  // We also always allow 'Super Admin' to pass through any guard.
  if (allowedRoles && allowedRoles.length > 0) {
    if (userRole !== 'Super Admin' && !allowedRoles.includes(userRole)) {
      // User is logged in but NOT authorized for this specific route
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  // 3. Authorized? Render the Route
  return <Outlet />;
};

export default RoleGuard;