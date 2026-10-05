import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ZevotaLogo from '../components/ZevotaLogo';
import { useApp } from '../context/AppContext';
import {
  DashboardIcon,
  BookingsIcon,
  UsersIcon,
  ProvidersIcon,
  CategoriesIcon,
  FinanceIcon,
  DisputesIcon,
  BannersIcon,
  ChatIcon,
  RatingsIcon,
  UserServicesIcon,
  LogoutIcon,
  UserAppIcon,
  ProviderAppIcon,
  BellIcon,
  SearchIcon,
} from './components/AdminIcons';

export default function AdminPanelLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminUser, logoutAdmin } = useApp() || {};

  const menuItems = [
    { path: '/admin/dashboard', icon: DashboardIcon, label: 'Dashboard & Analytics' },
    { path: '/admin/bookings', icon: BookingsIcon, label: 'Work Orders & Dispatch' },
    { path: '/admin/ratings', icon: RatingsIcon, label: 'Ratings & Reviews' },
    { path: '/admin/user-services', icon: UserServicesIcon, label: 'User Service Payments' },
    { path: '/admin/users', icon: UsersIcon, label: 'Users & Video Audit' },
    { path: '/admin/providers', icon: ProvidersIcon, label: 'Field Partners' },
    { path: '/admin/categories', icon: CategoriesIcon, label: 'Category Catalog' },
    { path: '/admin/service-areas', icon: CategoriesIcon, label: 'Service Coverage Zones' },
    { path: '/admin/finance', icon: FinanceIcon, label: 'Wallet Audit Logs' },
    { path: '/admin/plans', icon: FinanceIcon, label: 'Subscription Plans' },
    { path: '/admin/disputes', icon: DisputesIcon, label: 'Dispute Resolution' },
    { path: '/admin/banners', icon: BannersIcon, label: 'Marketing Banners' },
    { path: '/admin/chat', icon: ChatIcon, label: 'Live Support Console' },
  ];

  const isAuthPage = location.pathname.includes('/login');

  const handleAdminLogout = () => {
    if (typeof logoutAdmin === 'function') logoutAdmin();
    navigate('/admin/login');
  };

  const getPageTitle = () => {
    // Prefer longest matching path so /admin/bookings/:id still resolves correctly
    const sorted = [...menuItems].sort((a, b) => b.path.length - a.path.length);
    const current = sorted.find((m) => location.pathname === m.path || location.pathname.startsWith(`${m.path}/`));
    return current ? current.label : 'Control Center';
  };

  return (
    <View style={styles.container}>
      {!isAuthPage ? (
        <View style={styles.bodyRow}>
          {/* Executive Light Sidebar */}
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <TouchableOpacity onPress={() => navigate('/admin/dashboard')} style={styles.logoBtn}>
                <ZevotaLogo size="small" />
              </TouchableOpacity>
              <Text style={styles.sidebarTitle}>Admin Control Center</Text>
              <Text style={styles.sidebarSub}>Operations & Financials</Text>
              <View style={styles.appSwitchRow}>
                <TouchableOpacity style={styles.switchPill} onPress={() => navigate('/user/home')} activeOpacity={0.85}>
                  <UserAppIcon color="#334155" size={12} />
                  <Text style={styles.switchPillText}>User App</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.switchPill} onPress={() => navigate('/provider/dashboard')} activeOpacity={0.85}>
                  <ProviderAppIcon color="#334155" size={12} />
                  <Text style={styles.switchPillText}>Provider</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
              {menuItems.map((item) => {
                const isActive =
                  location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={item.path}
                    style={[styles.menuItem, isActive && styles.activeMenuItem]}
                    onPress={() => navigate(item.path)}
                  >
                    <IconComponent color={isActive ? '#2563eb' : '#64748b'} size={18} />
                    <Text style={[styles.menuLabel, isActive && styles.activeMenuLabel]}>
                      {item.label}
                    </Text>
                    {isActive && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Admin Profile & Logout Bar */}
            <View style={styles.adminProfileFooter}>
              <View style={styles.adminAvatarBox}>
                <Text style={styles.adminInitials}>
                  {(adminUser?.name || 'ADMIN').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.adminInfoCol}>
                <Text style={styles.adminNameText} numberOfLines={1}>
                  {adminUser?.name || 'SUPER ADMIN'}
                </Text>
                <Text style={styles.adminRoleText} numberOfLines={1}>
                  {adminUser?.role || 'Super Admin'}
                </Text>
              </View>
              <TouchableOpacity style={styles.logoutIconButton} onPress={handleAdminLogout} title="Sign Out">
                <LogoutIcon color="#dc2626" size={16} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Content Area */}
          <View style={styles.mainContent}>
            {/* Executive Light Header Bar */}
            <View style={styles.topHeaderBar}>
              <View style={styles.headerLeftCol}>
                <Text style={styles.headerPageTitle}>{getPageTitle()}</Text>
                <Text style={styles.headerBreadcrumb}>Home / Admin / {getPageTitle()}</Text>
              </View>
              <View style={styles.headerRightRow}>
                <View style={styles.systemStatusPill}>
                  <View style={styles.systemStatusDot} />
                  <Text style={styles.systemStatusText}>Systems Operational</Text>
                </View>
                <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigate('/admin/chat')}>
                  <BellIcon color="#475569" size={18} />
                </TouchableOpacity>
              </View>
            </View>

            <Outlet />
          </View>
        </View>
      ) : (
        <View style={styles.mainContent}>
          <Outlet />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  bodyRow: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 250,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    zIndex: 10,
  },
  sidebarHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 6 },
  logoBtn: { marginBottom: 4 },
  sidebarTitle: { color: '#0f172a', fontWeight: '800', fontSize: 15 },
  sidebarSub: { color: '#64748b', fontSize: 11 },

  appSwitchRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  switchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 5,
  },
  switchPillText: { color: '#334155', fontSize: 11, fontWeight: '600' },

  menuList: { padding: 10, gap: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 12,
    position: 'relative',
  },
  activeMenuItem: { backgroundColor: '#eff6ff' },
  menuLabel: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  activeMenuLabel: { color: '#1d4ed8', fontWeight: '700' },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3.5,
    backgroundColor: '#2563eb',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },

  adminProfileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  adminAvatarBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  adminInitials: { color: '#2563eb', fontSize: 12, fontWeight: '800' },
  adminInfoCol: { flex: 1 },
  adminNameText: { color: '#0f172a', fontSize: 12, fontWeight: '700' },
  adminRoleText: { color: '#64748b', fontSize: 10 },
  logoutIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },

  mainContent: { flex: 1, backgroundColor: '#f8fafc' },
  topHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeftCol: { gap: 2 },
  headerPageTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  headerBreadcrumb: { fontSize: 11, color: '#94a3b8' },
  headerRightRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  systemStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  systemStatusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16a34a' },
  systemStatusText: { color: '#15803d', fontSize: 11, fontWeight: '700' },
  headerIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
});
