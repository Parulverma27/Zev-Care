import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProtectedRoute, ProviderProtectedRoute, AdminProtectedRoute } from './RouteGuards';
import {
  RootRedirect,
  UserIndexRedirect,
  ProviderIndexRedirect,
  AdminIndexRedirect,
  CatchAllRedirect,
} from './Redirects';

import UserAppLayout from '../user/UserAppLayout';
import ProviderAppLayout from '../provider/ProviderAppLayout';
import AdminPanelLayout from '../admin/AdminPanelLayout';

import AuthScreen from '../user/screens/AuthScreen';
import HomeScreen from '../user/screens/HomeScreen';
import SubscriptionPlansScreen from '../user/screens/SubscriptionPlansScreen';
import PropertyVerificationScreen from '../user/screens/PropertyVerificationScreen';
import AddPropertyScreen from '../user/screens/AddPropertyScreen';
import BookingFlowScreen from '../user/screens/BookingFlowScreen';
import BookingDetailScreen from '../user/screens/BookingDetailScreen';
import RateProviderScreen from '../user/screens/RateProviderScreen';
import UserBookingsScreen from '../user/screens/UserBookingsScreen';
import WalletScreen from '../user/screens/WalletScreen';
import MyAmcScreen from '../user/screens/MyAmcScreen';
import UserProfileScreen from '../user/screens/UserProfileScreen';
import SavedAddressesScreen from '../user/screens/SavedAddressesScreen';
import LiveSupportScreen from '../user/screens/LiveSupportScreen';
import ServiceBrowseScreen from '../user/screens/ServiceBrowseScreen';
import ConsultationScreen from '../user/screens/ConsultationScreen';
import TermsAndConditionsScreen from '../user/screens/TermsAndConditionsScreen';

import ProviderAuthScreen from '../provider/screens/ProviderAuthScreen';
import ProviderDashboardScreen from '../provider/screens/ProviderDashboardScreen';
import ProviderJobDetailScreen from '../provider/screens/ProviderJobDetailScreen';
import ProviderWorkOrdersScreen from '../provider/screens/ProviderWorkOrdersScreen';
import ProviderProfileScreen from '../provider/screens/ProviderProfileScreen';

import AdminLoginScreen from '../admin/screens/AdminLoginScreen';
import AdminDashboardScreen from '../admin/screens/AdminDashboardScreen';
import AdminBookingsScreen from '../admin/screens/AdminBookingsScreen';
import AdminConsultationsScreen from '../admin/screens/AdminConsultationsScreen';
import AdminRatingsScreen from '../admin/screens/AdminRatingsScreen';
import AdminUserServicesScreen from '../admin/screens/AdminUserServicesScreen';
import AdminUsersScreen from '../admin/screens/AdminUsersScreen';
import AdminServiceAreasScreen from '../admin/screens/AdminServiceAreasScreen';
import { AdminProvidersScreen, AdminServicesScreen } from '../admin/screens/AdminProvidersScreen';
import { AdminFinanceScreen, AdminDisputesScreen } from '../admin/screens/AdminFinanceScreen';
import { AdminBannersScreen, AdminChatScreen } from '../admin/screens/AdminBannersScreen';
import { AdminSubscriptionPlansScreen } from '../admin/screens/AdminSubscriptionPlansScreen';
import AdminSubAdminsScreen from '../admin/screens/AdminSubAdminsScreen';

function Protected({ children }) {
  return <UserProtectedRoute>{children}</UserProtectedRoute>;
}

function ProviderProtected({ children }) {
  return <ProviderProtectedRoute>{children}</ProviderProtectedRoute>;
}

function AdminProtected({ children }) {
  return <AdminProtectedRoute>{children}</AdminProtectedRoute>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />

        <Route path="/user" element={<UserAppLayout />}>
          <Route index element={<UserIndexRedirect />} />
          <Route path="login" element={<AuthScreen />} />
          <Route path="register" element={<AuthScreen />} />
          <Route path="otp" element={<AuthScreen />} />
          <Route path="terms" element={<TermsAndConditionsScreen />} />
          <Route path="basic-details" element={<Navigate to="/user/add-property" replace />} />
          <Route path="add-property" element={<Protected><AddPropertyScreen /></Protected>} />
          <Route path="home" element={<Protected><HomeScreen /></Protected>} />
          <Route path="plans" element={<Protected><SubscriptionPlansScreen /></Protected>} />
          <Route path="complains" element={<Protected><ServiceBrowseScreen /></Protected>} />
          <Route path="consultation" element={<Protected><ServiceBrowseScreen /></Protected>} />
          <Route path="property-verification" element={<Protected><PropertyVerificationScreen /></Protected>} />
          <Route path="categories" element={<Protected><HomeScreen /></Protected>} />
          <Route path="bookings/new" element={<Protected><BookingFlowScreen /></Protected>} />
          <Route path="bookings" element={<Protected><UserBookingsScreen /></Protected>} />
          <Route path="bookings/:bookingId/rate" element={<Protected><RateProviderScreen /></Protected>} />
          <Route path="bookings/:bookingId" element={<Protected><BookingDetailScreen /></Protected>} />
          <Route path="my-amc" element={<Protected><MyAmcScreen /></Protected>} />
          <Route path="myamc" element={<Protected><MyAmcScreen /></Protected>} />
          <Route path="wallet" element={<Navigate to="/user/my-amc" replace />} />
          <Route path="profile" element={<Protected><UserProfileScreen /></Protected>} />
          <Route path="saved-addresses" element={<Protected><SavedAddressesScreen /></Protected>} />
          <Route path="support" element={<Protected><LiveSupportScreen /></Protected>} />
        </Route>

        <Route path="/provider" element={<ProviderAppLayout />}>
          <Route index element={<ProviderIndexRedirect />} />
          <Route path="login" element={<ProviderAuthScreen />} />
          <Route path="register" element={<Navigate to="/provider/login" replace />} />
          <Route path="dashboard" element={<ProviderProtected><ProviderDashboardScreen /></ProviderProtected>} />
          <Route path="bookings" element={<ProviderProtected><ProviderWorkOrdersScreen /></ProviderProtected>} />
          <Route path="bookings/:bookingId" element={<ProviderProtected><ProviderJobDetailScreen /></ProviderProtected>} />
          <Route path="profile" element={<ProviderProtected><ProviderProfileScreen /></ProviderProtected>} />
        </Route>

        <Route path="/admin" element={<AdminPanelLayout />}>
          <Route index element={<AdminIndexRedirect />} />
          <Route path="login" element={<AdminLoginScreen />} />
          <Route path="dashboard" element={<AdminProtected><AdminDashboardScreen /></AdminProtected>} />
          <Route path="users" element={<AdminProtected><AdminUsersScreen /></AdminProtected>} />
          <Route path="providers" element={<AdminProtected><AdminProvidersScreen /></AdminProtected>} />
          <Route path="categories" element={<AdminProtected><AdminServicesScreen /></AdminProtected>} />
          <Route path="service-areas" element={<AdminProtected><AdminServiceAreasScreen /></AdminProtected>} />
          <Route path="bookings" element={<AdminProtected><AdminBookingsScreen /></AdminProtected>} />
          <Route path="bookings/:bookingId" element={<AdminProtected><AdminBookingsScreen /></AdminProtected>} />
          <Route path="consultations" element={<AdminProtected><AdminConsultationsScreen /></AdminProtected>} />
          <Route path="ratings" element={<AdminProtected><AdminRatingsScreen /></AdminProtected>} />
          <Route path="user-services" element={<AdminProtected><AdminUserServicesScreen /></AdminProtected>} />
          <Route path="finance" element={<AdminProtected><AdminFinanceScreen /></AdminProtected>} />
          <Route path="disputes" element={<AdminProtected><AdminDisputesScreen /></AdminProtected>} />
          <Route path="banners" element={<AdminProtected><AdminBannersScreen /></AdminProtected>} />
          <Route path="chat" element={<AdminProtected><AdminChatScreen /></AdminProtected>} />
          <Route path="plans" element={<AdminProtected><AdminSubscriptionPlansScreen /></AdminProtected>} />
          <Route path="subadmins" element={<AdminProtected><AdminSubAdminsScreen /></AdminProtected>} />
        </Route>

        <Route path="/banners" element={<Navigate to="/admin/banners" replace />} />
        <Route path="*" element={<CatchAllRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
