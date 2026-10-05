import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function isValidUser(user) {
  return !!(user && (user.id != null || user.phone));
}

/** `/` → home if logged in, else login */
export function RootRedirect() {
  const { activeUser } = useApp();
  return <Navigate to={isValidUser(activeUser) ? '/user/home' : '/user/login'} replace />;
}

export function UserIndexRedirect() {
  const { activeUser } = useApp();
  return <Navigate to={isValidUser(activeUser) ? '/user/home' : '/user/login'} replace />;
}

export function ProviderIndexRedirect() {
  const { activeProvider } = useApp();
  return <Navigate to={activeProvider ? '/provider/dashboard' : '/provider/login'} replace />;
}

export function AdminIndexRedirect() {
  const { adminUser } = useApp();
  return <Navigate to={adminUser ? '/admin/dashboard' : '/admin/login'} replace />;
}

/** Unknown URLs land on the matching app's login/home */
export function CatchAllRedirect() {
  const location = useLocation();
  const { activeUser, activeProvider, adminUser } = useApp();
  const path = location.pathname || '';

  if (path.startsWith('/admin')) {
    return <Navigate to={adminUser ? '/admin/dashboard' : '/admin/login'} replace />;
  }
  if (path.startsWith('/provider')) {
    return <Navigate to={activeProvider ? '/provider/dashboard' : '/provider/login'} replace />;
  }
  return <Navigate to={isValidUser(activeUser) ? '/user/home' : '/user/login'} replace />;
}
