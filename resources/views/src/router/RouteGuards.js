import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const PUBLIC_USER_PATHS = [
  '/user/login',
  '/user/register',
  '/user/otp',
  '/user/basic-details',
  '/user/terms',
];

function isValidUser(user) {
  return !!(user && (user.id != null || user.phone));
}

export function UserProtectedRoute({ children }) {
  const { activeUser } = useApp();
  const location = useLocation();

  const isPublic = PUBLIC_USER_PATHS.some((path) => location.pathname.startsWith(path));

  if (!isValidUser(activeUser) && !isPublic) {
    return <Navigate to="/user/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function ProviderProtectedRoute({ children }) {
  const { activeProvider } = useApp();
  const location = useLocation();
  const isAuth =
    location.pathname.startsWith('/provider/login') ||
    location.pathname.startsWith('/provider/register');

  if (!activeProvider && !isAuth) {
    return <Navigate to="/provider/login" replace />;
  }
  return children;
}

export function AdminProtectedRoute({ children }) {
  const { adminUser } = useApp();
  const location = useLocation();
  const isLogin = location.pathname.startsWith('/admin/login');

  if (!adminUser && !isLogin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
