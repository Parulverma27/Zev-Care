import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import AdminBookingsScreen from './screens/AdminBookingsScreen';
import AdminConsultationsScreen from './screens/AdminConsultationsScreen';
import AdminUsersScreen from './screens/AdminUsersScreen';
import { AdminProvidersScreen, AdminServicesScreen } from './screens/AdminProvidersScreen';
import { AdminFinanceScreen, AdminDisputesScreen } from './screens/AdminFinanceScreen';
import { AdminBannersScreen, AdminChatScreen } from './screens/AdminBannersScreen';
import { AdminSubscriptionPlansScreen } from './screens/AdminSubscriptionPlansScreen';

import {
  DashboardIcon,
  BookingsIcon,
  ConsultationsIcon,
  UsersIcon,
  ProvidersIcon,
  CategoriesIcon,
  FinanceIcon,
  DisputesIcon,
  BannersIcon,
  SubscriptionPlansIcon,
  ChatIcon,
} from './components/AdminIcons';

export default function AdminPanelNavigator() {
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  const menuItems = [
    { key: 'DASHBOARD', icon: DashboardIcon, label: 'Dashboard & Analytics' },
    { key: 'BOOKINGS', icon: BookingsIcon, label: 'Work Orders & Dispatch' },
    { key: 'CONSULTATIONS', icon: ConsultationsIcon, label: 'Mechanic Consultations' },
    { key: 'USERS', icon: UsersIcon, label: 'Users & Video Audit' },
    { key: 'PROVIDERS', icon: ProvidersIcon, label: 'Field Partners' },
    { key: 'SERVICES', icon: CategoriesIcon, label: 'Category Catalog' },
    { key: 'FINANCE', icon: FinanceIcon, label: 'Wallet Audit Logs' },
    { key: 'DISPUTES', icon: DisputesIcon, label: 'Dispute Resolution' },
    { key: 'BANNERS', icon: BannersIcon, label: 'Marketing Banners' },
    { key: 'PLANS', icon: SubscriptionPlansIcon, label: 'Subscription Plans' },
    { key: 'CHAT', icon: ChatIcon, label: 'Live Support Console' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'DASHBOARD':
        return <AdminDashboardScreen onNavigate={setActiveTab} />;
      case 'BOOKINGS':
        return <AdminBookingsScreen />;
      case 'CONSULTATIONS':
        return <AdminConsultationsScreen />;
      case 'USERS':
        return <AdminUsersScreen />;
      case 'PROVIDERS':
        return <AdminProvidersScreen />;
      case 'SERVICES':
        return <AdminServicesScreen />;
      case 'FINANCE':
        return <AdminFinanceScreen />;
      case 'DISPUTES':
        return <AdminDisputesScreen />;
      case 'BANNERS':
        return <AdminBannersScreen />;
      case 'PLANS':
        return <AdminSubscriptionPlansScreen />;
      case 'CHAT':
        return <AdminChatScreen />;
      default:
        return <AdminDashboardScreen onNavigate={setActiveTab} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Light Responsive Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Admin Control Center</Text>
          <Text style={styles.sidebarSub}>Operations & Financials</Text>
        </View>

        <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.menuItem, isActive && styles.activeMenuItem]}
                onPress={() => setActiveTab(item.key)}
              >
                <IconComponent color={isActive ? '#2563eb' : '#64748b'} size={18} />
                <Text style={[styles.menuLabel, isActive && styles.activeMenuLabel]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Admin View Container */}
      <View style={styles.mainContent}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f8fafc' },
  sidebar: { width: 250, backgroundColor: '#ffffff', borderRightWidth: 1, borderRightColor: '#e2e8f0' },
  sidebarHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sidebarTitle: { color: '#0f172a', fontWeight: '800', fontSize: 16 },
  sidebarSub: { color: '#64748b', fontSize: 11, marginTop: 2 },
  menuList: { padding: 10, gap: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 10 },
  activeMenuItem: { backgroundColor: '#eff6ff' },
  menuLabel: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  activeMenuLabel: { color: '#1d4ed8', fontWeight: '700' },
  mainContent: { flex: 1 },
});
