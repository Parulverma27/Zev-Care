import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { isDesktopWeb } from '../utils/isDesktopWeb';

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

/** Desktop web only: start a guest session silently, then render the page. */
function DesktopGuestBootstrap({ children }) {
  const { activeUser, skipAuth } = useApp();
  const hasUser = isValidUser(activeUser);

  useEffect(() => {
    if (!hasUser && typeof skipAuth === 'function') {
      skipAuth();
    }
  }, [hasUser, skipAuth]);

  return hasUser ? children : null;
}

export function UserProtectedRoute({ children }) {
  const { activeUser } = useApp();
  const location = useLocation();

  const isPublic = PUBLIC_USER_PATHS.some((path) => location.pathname.startsWith(path));

  if (!isValidUser(activeUser) && !isPublic) {
    if (isDesktopWeb()) {
      return <DesktopGuestBootstrap>{children}</DesktopGuestBootstrap>;
    }
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

  // Super-admin only routes protection: Sub-Admin management is strictly Super Admin
  const isSuper =
    adminUser?.role === 'SUPER_ADMIN' ||
    adminUser?.role === 'Super Admin' ||
    adminUser?.email === 'admin@zevotacare.com';

  if (adminUser && !isSuper) {
    if (location.pathname.startsWith('/admin/subadmins')) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
}
