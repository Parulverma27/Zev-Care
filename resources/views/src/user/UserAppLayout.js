import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { VectorTabIcon } from '../components/TabIcons';
import DesktopUserHeader from './components/DesktopUserHeader';
import DesktopUserFooter from './components/DesktopUserFooter';

export default function UserAppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

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
  const isHomeTab = path === '/user/home' || path === '/user' || path === '/user/' || path.includes('/categories');
  const isBookingsTab = path.includes('/bookings') && !path.includes('/new') && !isBookingDetail;
  const isProfileTab = path.includes('/profile');

  // Desktop Web Layout (Urban Company style framing) - strictly active on desktop viewports
  if (isDesktop && !isAuthPage) {
    return (
      <div className="user-desktop-layout-root" style={desktopLayoutRootStyle}>
        <DesktopUserHeader />
        <main style={desktopMainContentStyle}>
          <div style={desktopContainerStyle}>
            <Outlet />
          </div>
        </main>
        <DesktopUserFooter />
      </div>
    );
  }

  // 100% UNTOUCHED Mobile App Layout (Phones & small screens)
  return (
    <View style={styles.container}>
      <View style={[styles.contentContainer, isAuthPage && styles.contentContainerAuth]}>
        <Outlet />
      </View>

      {showBottomNav && (
        <View style={styles.bottomBar}>
          {/* Top Hairline Gloss Accent */}
          <View style={styles.topHairline} />

          {/* TAB 0: Home */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigate('/user/home')}
            activeOpacity={0.78}
          >
            {isHomeTab && <View style={styles.homeActiveTopPip} />}
            <View style={[styles.tabPill, isHomeTab && styles.activeHomeTabPill]}>
              <VectorTabIcon
                name="home"
                active={isHomeTab}
                activeColor="#2563eb"
                inactiveColor="#64748b"
              />
            </View>
            <Text style={[styles.tabLabel, isHomeTab && styles.activeHomeLabel]}>Home</Text>
          </TouchableOpacity>

          {/* TAB 1: Bookings */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigate('/user/bookings')}
            activeOpacity={0.78}
          >
            {isBookingsTab && <View style={styles.bookingsActiveTopPip} />}
            <View style={[styles.tabPill, isBookingsTab && styles.activeBookingsTabPill]}>
              <VectorTabIcon
                name="bookings"
                active={isBookingsTab}
                activeColor="#2563eb"
                inactiveColor="#64748b"
              />
            </View>
            <Text style={[styles.tabLabel, isBookingsTab && styles.activeBookingsLabel]}>Bookings</Text>
          </TouchableOpacity>

          {/* TAB 3: Profile */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigate('/user/profile')}
            activeOpacity={0.78}
          >
            {isProfileTab && <View style={styles.profileActiveTopPip} />}
            <View style={[styles.tabPill, isProfileTab && styles.activeProfileTabPill]}>
              <VectorTabIcon
                name="profile"
                active={isProfileTab}
                activeColor="#0f172a"
                inactiveColor="#64748b"
              />
            </View>
            <Text style={[styles.tabLabel, isProfileTab && styles.activeProfileLabel]}>Profile</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.85)',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 14,
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
    boxShadow: '0 -10px 30px rgba(15, 23, 42, 0.08), 0 -2px 6px rgba(15, 23, 42, 0.03)',
    ...(typeof window !== 'undefined'
      ? {
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }
      : {}),
  },
  topHairline: {
    position: 'absolute',
    top: 0,
    left: '12%',
    right: '12%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
    paddingVertical: 2,
    cursor: 'pointer',
  },
  tabPill: {
    width: 50,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  activeHomeTabPill: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    boxShadow: '0 2px 10px rgba(37, 99, 235, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
  },
  activeAmcTabPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    boxShadow: '0 2px 10px rgba(217, 119, 6, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.28)',
  },
  activeBookingsTabPill: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    boxShadow: '0 2px 10px rgba(37, 99, 235, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
  },
  activeProfileTabPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.18)',
  },
  homeActiveTopPip: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#2563eb',
    boxShadow: '0 1px 6px rgba(37, 99, 235, 0.45)',
  },
  amcActiveTopPip: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#d97706',
    boxShadow: '0 1px 6px rgba(217, 119, 6, 0.45)',
  },
  bookingsActiveTopPip: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#2563eb',
    boxShadow: '0 1px 6px rgba(37, 99, 235, 0.45)',
  },
  profileActiveTopPip: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#0f172a',
    boxShadow: '0 1px 6px rgba(15, 23, 42, 0.35)',
  },
  tabLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
    whiteSpace: 'nowrap',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  activeHomeLabel: {
    color: '#1d4ed8',
    fontWeight: '800',
  },
  activeAmcLabel: {
    color: '#92400e',
    fontWeight: '800',
  },
  activeBookingsLabel: {
    color: '#1d4ed8',
    fontWeight: '800',
  },
  activeProfileLabel: {
    color: '#0f172a',
    fontWeight: '800',
  },
});

const desktopLayoutRootStyle = {
  minHeight: '100vh',
  height: 'auto',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#f8fafc',
  width: '100%',
  position: 'relative',
  overflowX: 'hidden',
};

const desktopMainContentStyle = {
  flex: 1,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  zIndex: 1,
};

const desktopContainerStyle = {
  maxWidth: '1420px',
  width: '100%',
  margin: '0 auto',
  padding: '0 32px',
  boxSizing: 'border-box',
  flex: 1,
};
