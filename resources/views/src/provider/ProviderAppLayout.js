import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ZevotaLogo from '../components/ZevotaLogo';
import { VectorTabIcon } from '../components/TabIcons';

export default function ProviderAppLayout() {
  const { activeProvider } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname.includes('/login') || location.pathname.includes('/register');

  const providerTabs = [
    { key: 'today', label: 'Today', path: '/provider/dashboard', icon: 'provider-today' },
    { key: 'work', label: 'Work Orders', path: '/provider/bookings', icon: 'provider-work' },
    { key: 'earnings', label: 'Earnings', path: '/provider/earnings', icon: 'provider-earnings' },
    { key: 'profile', label: 'Profile', path: '/provider/profile', icon: 'provider-profile' },
  ];

  // Hide bottom tabs on job detail for full focus; keep on list/dashboard/profile
  const isJobDetail = /\/provider\/bookings\/[^/]+/.test(location.pathname);
  const showChrome = !isAuthPage;

  return (
    <View style={styles.container}>
      {showChrome && (
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={() => navigate('/provider/dashboard')}>
            <ZevotaLogo size="header" light />
          </TouchableOpacity>

          <TouchableOpacity style={styles.statusBox} onPress={() => navigate('/provider/profile')} activeOpacity={0.8}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>{activeProvider?.name || '\u2014'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.contentContainer}>
        <Outlet />
      </View>

      {showChrome && !isJobDetail && (
        <View style={styles.bottomBar}>
          {providerTabs.map((tab) => {
            let isActive = false;
            if (tab.key === 'today' && location.pathname.includes('/dashboard')) isActive = true;
            else if (tab.key === 'work' && location.pathname.includes('/bookings')) isActive = true;
            else if (tab.key === 'earnings' && location.pathname.includes('/earnings')) isActive = true;
            else if (tab.key === 'profile' && location.pathname.includes('/profile')) isActive = true;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isActive && styles.activeTabItem]}
                onPress={() => navigate(tab.path)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconPill, isActive && styles.activeIconPill]}>
                  <VectorTabIcon name={tab.icon} active={isActive} theme="provider" />
                  <Text style={[styles.tabLabel, isActive && styles.activeLabel]} numberOfLines={1}>
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eff6ff', width: '100%', overflow: 'hidden' },
  topHeader: {
    backgroundColor: '#1e3a8a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 6,
    width: '100%',
  },

  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3b82f6',
    cursor: 'pointer',
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#60a5fa' },
  statusText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },

  contentContainer: { flex: 1, width: '100%', overflow: 'hidden' },

  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(59, 130, 246, 0.3)',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    width: '100%',
    boxSizing: 'border-box',
  },
  tabItem: { alignItems: 'center', flex: 1, minWidth: 0, paddingHorizontal: 2 },
  iconPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 14,
    width: '100%',
    maxWidth: 110,
  },
  activeIconPill: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: { fontSize: 11, color: '#93c5fd', fontWeight: '600', marginTop: 2, textAlign: 'center' },
  activeLabel: { color: '#ffffff', fontWeight: '800' },
});
