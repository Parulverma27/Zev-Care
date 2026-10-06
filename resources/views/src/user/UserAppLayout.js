import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { VectorTabIcon } from '../components/TabIcons';

export default function UserAppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const isAuthPage = ['/login', '/register', '/otp', '/add-property', '/basic-details', '/terms'].some(
    (segment) => path.includes(segment)
  );

  // Hide chrome on multi-step / detail flows; keep tabs on main destinations
  const isBookingDetail = /\/user\/bookings\/[^/]+/.test(path);
  const isBookingFlow = path.includes('/bookings/new');
  const isImmersive =
    path.includes('/property-verification') ||
    path.includes('/saved-addresses') ||
    path.includes('/support') ||
    path.includes('/rate');

  const showBottomNav = !isAuthPage && !isBookingFlow && !isBookingDetail && !isImmersive;
  const isBookingsTab = path.includes('/bookings') && !path.includes('/new') && !isBookingDetail;

  return (
    <View style={styles.container}>
      <View style={[styles.contentContainer, isAuthPage && styles.contentContainerAuth]}>
        <Outlet />
      </View>

      {showBottomNav && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigate('/user/my-amc')} activeOpacity={0.8}>
            <View style={[styles.tabPill, (path.includes('/my-amc') || path.includes('/wallet') || path.includes('/plans')) && styles.activeAmcTabPill]}>
              <VectorTabIcon
                name="amc"
                active={path.includes('/my-amc') || path.includes('/wallet') || path.includes('/plans')}
                activeColor="#d4af37"
                inactiveColor="#64748b"
              />
              <Text style={[styles.tabLabel, (path.includes('/my-amc') || path.includes('/wallet') || path.includes('/plans')) && styles.activeAmcLabel]}>My AMC</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigate('/user/bookings')}
            activeOpacity={0.8}
          >
            <View style={[styles.tabPill, isBookingsTab && styles.activeTabPill]}>
              <VectorTabIcon
                name="bookings"
                active={isBookingsTab}
                activeColor="#2563eb"
                inactiveColor="#64748b"
              />
              <Text style={[styles.tabLabel, isBookingsTab && styles.activeLabel]}>Bookings</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => navigate('/user/profile')} activeOpacity={0.8}>
            <View style={[styles.tabPill, path.includes('/profile') && styles.activeTabPill]}>
              <VectorTabIcon
                name="profile"
                active={path.includes('/profile')}
                activeColor="#2563eb"
                inactiveColor="#64748b"
              />
              <Text style={[styles.tabLabel, path.includes('/profile') && styles.activeLabel]}>Profile</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', width: '100%', overflow: 'hidden' },
  contentContainer: { flex: 1, width: '100%', overflow: 'hidden' },
  contentContainerAuth: { overflow: 'auto', WebkitOverflowScrolling: 'touch' },

  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    paddingBottom: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  tabItem: { alignItems: 'center', flex: 1, position: 'relative' },
  tabPill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    width: '100%',
    maxWidth: 78,
  },
  activeTabPill: {
    backgroundColor: '#eff6ff',
  },
  activeAmcTabPill: {
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
  },
  tabLabel: { fontSize: 11, color: '#64748b', fontWeight: '500', marginTop: 1, whiteSpace: 'nowrap' },
  activeLabel: { color: '#2563eb', fontWeight: '800' },
  activeAmcLabel: { color: '#b45309', fontWeight: '800' },
});
