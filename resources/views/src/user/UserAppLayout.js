import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VectorTabIcon } from '../components/TabIcons';
import { useApp } from '../context/AppContext';
import DesktopUserHeader from './components/DesktopUserHeader';
import DesktopUserFooter from './components/DesktopUserFooter';

export default function UserAppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const insets = useSafeAreaInsets();
  const appContext = useApp() || {};
  const activeUser = appContext.activeUser;
  const getUserBookings = appContext.getUserBookings;

  const userBookings = (getUserBookings && activeUser) ? getUserBookings(activeUser) : [];
  const activeBookingsCount = (userBookings || []).filter(
    (b) => b && !['completed', 'cancelled', 'rated'].includes(String(b.status || '').toLowerCase())
  ).length;

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

  const bottomPadding = Math.max(insets?.bottom || 0, 10);

  // Mobile App Layout (Phones & small screens)
  return (
    <View style={styles.container}>
      <View style={[styles.contentContainer, isAuthPage && styles.contentContainerAuth]}>
        <Outlet />
      </View>

      {showBottomNav && (
        <View style={[styles.bottomBar, { paddingBottom: bottomPadding + 6 }]}>
          {/* Top Hairline Gloss Accent */}
          <View style={styles.topHairline} />

          {/* TAB 0: Home */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigate('/user/home')}
            activeOpacity={0.7}
          >
            <View style={[styles.tabPill, isHomeTab && styles.activeTabPill]}>
              <VectorTabIcon
                name="home"
                active={isHomeTab}
                activeColor="#2563eb"
                inactiveColor="#64748b"
              />
            </View>
            <Text style={[styles.tabLabel, isHomeTab && styles.activeTabLabel]}>Home</Text>
            {isHomeTab && <View style={styles.activeIndicatorDot} />}
          </TouchableOpacity>

          {/* TAB 1: Bookings */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigate('/user/bookings')}
            activeOpacity={0.7}
          >
            <View style={[styles.tabPill, isBookingsTab && styles.activeTabPill]}>
              <VectorTabIcon
                name="bookings"
                active={isBookingsTab}
                activeColor="#2563eb"
                inactiveColor="#64748b"
              />
              {activeBookingsCount > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {activeBookingsCount > 9 ? '9+' : activeBookingsCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, isBookingsTab && styles.activeTabLabel]}>Bookings</Text>
            {isBookingsTab && <View style={styles.activeIndicatorDot} />}
          </TouchableOpacity>

          {/* TAB 2: Profile */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigate('/user/profile')}
            activeOpacity={0.7}
          >
            <View style={[styles.tabPill, isProfileTab && styles.activeTabPill]}>
              <VectorTabIcon
                name="profile"
                active={isProfileTab}
                activeColor="#2563eb"
                inactiveColor="#64748b"
              />
            </View>
            <Text style={[styles.tabLabel, isProfileTab && styles.activeTabLabel]}>Profile</Text>
            {isProfileTab && <View style={styles.activeIndicatorDot} />}
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
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.85)',
    paddingTop: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
    boxShadow: '0 -8px 28px rgba(15, 23, 42, 0.07), 0 -1px 3px rgba(15, 23, 42, 0.02)',
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
    left: '10%',
    right: '10%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    pointerEvents: 'none',
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
    width: 52,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  activeTabPill: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    boxShadow: '0 2px 10px rgba(37, 99, 235, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
    transform: [{ translateY: -1 }],
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: 4,
    backgroundColor: '#ef4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 10,
    textAlign: 'center',
  },
  activeIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563eb',
    marginTop: 3,
    boxShadow: '0 1px 4px rgba(37, 99, 235, 0.6)',
  },
  tabLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
    whiteSpace: 'nowrap',
    fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
    transition: 'color 0.2s ease, font-weight 0.2s ease',
  },
  activeTabLabel: {
    color: '#1d4ed8',
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
