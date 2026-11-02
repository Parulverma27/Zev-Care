import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import ZevotaLogo from '../components/ZevotaLogo';
import { useApp } from '../context/AppContext';
import {
  DashboardIcon,
  BookingsIcon,
  ConsultationsIcon,
  UsersIcon,
  ProvidersIcon,
  CategoriesIcon,
  FinanceIcon,
  BannersIcon,
  ChatIcon,
  RatingsIcon,
  UserServicesIcon,
  LogoutIcon,
  BellIcon,
  SearchIcon,
} from './components/AdminIcons';

export default function AdminPanelLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminUser, logoutAdmin, subAdmins = [], switchAdminAccount } = useApp() || {};
  const [showRoleSwitcher, setShowRoleSwitcher] = React.useState(false);

  const isSubAdmin = adminUser?.role === 'SUB_ADMIN';

  const allMenuItems = [
    { path: '/admin/dashboard', icon: DashboardIcon, label: 'Dashboard & Analytics' },
    { path: '/admin/subadmins', icon: UsersIcon, label: 'Sub-Admin Managers', superAdminOnly: true },
    { path: '/admin/bookings', icon: BookingsIcon, label: 'Work Orders & Bookings' },
    { path: '/admin/consultations', icon: ConsultationsIcon, label: 'My Mechanic (₹0 Diagnosis)' },
    { path: '/admin/ratings', icon: RatingsIcon, label: 'Ratings & Reviews' },
    { path: '/admin/user-services', icon: UserServicesIcon, label: 'User Service Payments' },
    { path: '/admin/users', icon: UsersIcon, label: 'Customers & Users' },
    { path: '/admin/providers', icon: ProvidersIcon, label: 'Field Partners' },
    { path: '/admin/categories', icon: CategoriesIcon, label: 'Category Catalog' },
    { path: '/admin/service-areas', icon: CategoriesIcon, label: 'Service Coverage Zones' },
    { path: '/admin/finance', icon: FinanceIcon, label: 'Wallet Audit Logs' },
    { path: '/admin/plans', icon: FinanceIcon, label: 'Subscription Plans' },
    { path: '/admin/banners', icon: BannersIcon, label: 'Marketing Banners' },
    { path: '/admin/chat', icon: ChatIcon, label: 'Live Support Console' },
  ];

  const menuItems = allMenuItems.filter((item) => {
    if (item.superAdminOnly && isSubAdmin) return false;
    return true;
  });

  const isAuthPage = location.pathname.includes('/login');

  const handleAdminLogout = () => {
    if (typeof logoutAdmin === 'function') logoutAdmin();
    navigate('/admin/login');
  };

  const handleSwitchToSuperAdmin = () => {
    if (typeof switchAdminAccount === 'function') {
      switchAdminAccount({
        id: 0,
        name: 'SUPER ADMIN',
        email: 'admin@zevotacare.com',
        role: 'SUPER_ADMIN',
        assigned_categories: [],
      });
      setShowRoleSwitcher(false);
    }
  };

  const handleSelectSubAdmin = (sa) => {
    if (typeof switchAdminAccount === 'function') {
      switchAdminAccount(sa);
      setShowRoleSwitcher(false);
      navigate('/admin/bookings');
    }
  };

  const getPageTitle = () => {
    // Prefer longest matching path so /admin/bookings/:id still resolves correctly
    const sorted = [...allMenuItems].sort((a, b) => b.path.length - a.path.length);
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
              <Text style={styles.sidebarSub}>
                {isSubAdmin
                  ? `Department: ${(adminUser?.assigned_categories || []).join(', ')}`
                  : 'Operations & Financials'}
              </Text>
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
              <View style={[styles.adminAvatarBox, isSubAdmin && { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
                <Text style={[styles.adminInitials, isSubAdmin && { color: '#b45309' }]}>
                  {(adminUser?.name || 'ADMIN').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.adminInfoCol}>
                <Text style={styles.adminNameText} numberOfLines={1}>
                  {adminUser?.name || 'SUPER ADMIN'}
                </Text>
                <Text style={styles.adminRoleText} numberOfLines={1}>
                  {isSubAdmin
                    ? `Manager (${(adminUser?.assigned_categories || []).join(', ')})`
                    : 'Super Admin'}
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
                {/* Department / Role Switcher */}
                <View style={{ position: 'relative' }}>
                  {isSubAdmin ? (
                    <View style={styles.activeSubAdminHeaderBadge}>
                      <Text style={styles.activeSubAdminBadgeText}>
                        📁 {adminUser?.name} ({(adminUser?.assigned_categories || []).join(', ')})
                      </Text>
                      <TouchableOpacity
                        style={styles.switchBackSuperAdminBtn}
                        onPress={handleSwitchToSuperAdmin}
                      >
                        <Text style={styles.switchBackSuperAdminBtnText}>↩ Switch to Super Admin</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.roleSwitcherBtn}
                      onPress={() => setShowRoleSwitcher((p) => !p)}
                    >
                      <Text style={styles.roleSwitcherBtnText}>
                        👑 Super Admin (All Categories) ▾
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Dropdown Menu when Super Admin clicks Switcher */}
                  {showRoleSwitcher && !isSubAdmin && (
                    <View style={styles.roleSwitcherDropdown}>
                      <Text style={styles.roleDropdownHeader}>TEST AS CATEGORY MANAGER:</Text>
                      <ScrollView style={{ maxHeight: 220 }}>
                        {subAdmins.map((sa) => (
                          <TouchableOpacity
                            key={sa.id}
                            style={styles.roleDropdownItem}
                            onPress={() => handleSelectSubAdmin(sa)}
                          >
                            <Text style={styles.roleDropdownName}>{sa.name}</Text>
                            <Text style={styles.roleDropdownCats}>
                              {(sa.assigned_categories || []).join(', ')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TouchableOpacity
                        style={styles.roleDropdownManageBtn}
                        onPress={() => {
                          setShowRoleSwitcher(false);
                          navigate('/admin/subadmins');
                        }}
                      >
                        <Text style={styles.roleDropdownManageText}>⚙ Manage All Sub-Admins</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

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
  roleSwitcherBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleSwitcherBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  roleSwitcherDropdown: {
    position: 'absolute',
    top: 36,
    right: 0,
    width: 260,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    zIndex: 100,
  },
  roleDropdownHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  roleDropdownItem: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginVertical: 2,
    backgroundColor: '#f8fafc',
  },
  roleDropdownName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  roleDropdownCats: {
    fontSize: 10,
    color: '#2563eb',
    marginTop: 1,
  },
  roleDropdownManageBtn: {
    marginTop: 6,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  roleDropdownManageText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  activeSubAdminHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeSubAdminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  switchBackSuperAdminBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  switchBackSuperAdminBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },
});
