import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ZevotaLogo from '../components/ZevotaLogo';
import { VectorTabIcon } from '../components/TabIcons';

export default function ProviderAppLayout() {
  const { activeProvider, bookings, updateProviderLocation } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Real-time GPS broadcasting from the exact moment an order is accepted
  React.useEffect(() => {
    if (!activeProvider || typeof window === 'undefined' || !navigator?.geolocation) return undefined;

    const provIdStr = activeProvider.id != null ? String(activeProvider.id) : (activeProvider.provider_id ? String(activeProvider.provider_id) : '');
    const provPhone = (activeProvider.phone || '').replace(/\D/g, '').slice(-10);
    const provName = (activeProvider.name || '').trim().toLowerCase();

    // Check all active jobs accepted by this provider
    const activeJobs = (bookings || []).filter((b) => {
      const isMine =
        (provIdStr && b.provider_id != null && String(b.provider_id) === provIdStr) ||
        (provPhone && b.provider_phone && (b.provider_phone.replace(/\D/g, '').slice(-10) === provPhone)) ||
        (provName && b.provider_name && b.provider_name.trim().toLowerCase() === provName);
      return isMine && ['PROVIDER_ACCEPTED', 'PROVIDER_ON_THE_WAY', 'PROVIDER_ARRIVED', 'SERVICE_IN_PROGRESS'].includes(b.status);
    });

    if (activeJobs.length === 0) return undefined;

    const broadcastCurrentPosition = (pos) => {
      if (!pos?.coords) return;
      const { latitude, longitude, speed, heading, accuracy } = pos.coords;
      activeJobs.forEach((job) => {
        if (typeof updateProviderLocation === 'function') {
          updateProviderLocation(job.booking_id, latitude, longitude, { speed, heading, accuracy });
        }
      });
    };

    // 1. Immediate initial ping
    navigator.geolocation.getCurrentPosition(
      broadcastCurrentPosition,
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    // 2. Continuous watchPosition
    let watchId = null;
    try {
      watchId = navigator.geolocation.watchPosition(
        broadcastCurrentPosition,
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    } catch (e) {}

    // 3. 10-second interval fallback
    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        broadcastCurrentPosition,
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
      );
    }, 10000);

    return () => {
      if (watchId != null && navigator?.geolocation) {
        try { navigator.geolocation.clearWatch(watchId); } catch (e) {}
      }
      clearInterval(intervalId);
    };
  }, [activeProvider, bookings, updateProviderLocation]);

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

  const isOnline = activeProvider?.is_online !== false;
  const firstName = activeProvider?.name ? activeProvider.name.split(' ')[0] : 'Partner';
  const initial = activeProvider?.name ? activeProvider.name.charAt(0).toUpperCase() : 'P';
  const shortTrade = activeProvider?.trade ? activeProvider.trade.split(' ')[0] : 'Expert';

  return (
    <View style={styles.container}>
      {showChrome && (
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.brandRow}
            onPress={() => navigate('/provider/dashboard')}
            activeOpacity={0.85}
          >
            <ZevotaLogo size="header" />
            <View style={styles.partnerBadge}>
              <Text style={styles.partnerBadgeText}>PARTNER</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statusBox}
            onPress={() => navigate('/provider/profile')}
            activeOpacity={0.8}
          >
            <View style={[styles.onlinePill, isOnline ? styles.onlinePillActive : styles.onlinePillInactive]}>
              <View style={[styles.onlineDot, isOnline ? styles.onlineDotActive : styles.onlineDotInactive]} />
              <Text style={[styles.onlineStatusText, isOnline ? styles.onlineTextActive : styles.onlineTextInactive]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>

            <View style={styles.partnerInfoWrap}>
              <Text style={styles.partnerName} numberOfLines={1}>{firstName}</Text>
              <Text style={styles.partnerTrade} numberOfLines={1}>{shortTrade}</Text>
            </View>

            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
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
                style={styles.tabItem}
                onPress={() => navigate(tab.path)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconPill, isActive && styles.activeIconPill]}>
                  <VectorTabIcon
                    name={tab.icon}
                    active={isActive}
                    activeColor="#2563eb"
                    inactiveColor="#64748b"
                    theme="provider"
                  />
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
  container: { flex: 1, backgroundColor: '#f8fafc', width: '100%', overflow: 'hidden' },

  topHeader: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        }
      : {
          elevation: 2,
        }),
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partnerBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  partnerBadgeText: {
    color: '#2563eb',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    cursor: 'pointer',
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  onlinePillActive: {
    backgroundColor: '#ecfdf5',
  },
  onlinePillInactive: {
    backgroundColor: '#f1f5f9',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  onlineDotActive: {
    backgroundColor: '#10b981',
  },
  onlineDotInactive: {
    backgroundColor: '#94a3b8',
  },
  onlineStatusText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  onlineTextActive: {
    color: '#059669',
  },
  onlineTextInactive: {
    color: '#64748b',
  },

  partnerInfoWrap: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  partnerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 14,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  partnerTrade: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748b',
    lineHeight: 12,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  contentContainer: { flex: 1, width: '100%', overflow: 'hidden' },

  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 -4px 16px rgba(15, 23, 42, 0.05)',
        }
      : {
          elevation: 6,
        }),
  },
  tabItem: { alignItems: 'center', flex: 1, minWidth: 0, paddingHorizontal: 3 },
  iconPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    width: '100%',
    maxWidth: 96,
  },
  activeIconPill: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  tabLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  activeLabel: {
    color: '#1d4ed8',
    fontWeight: '800',
  },
});
