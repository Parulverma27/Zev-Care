import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import ProviderDashboardScreen from './screens/ProviderDashboardScreen';
import ProviderJobDetailScreen from './screens/ProviderJobDetailScreen';
import ProviderIcon from './ProviderIcons';
import { useApp } from '../context/AppContext';

export default function ProviderAppNavigator() {
  const { bookings, activeProvider } = useApp();
  const [currentScreen, setCurrentScreen] = useState('DASHBOARD');
  const [screenParams, setScreenParams] = useState({});

  const handleNavigate = (screen, params = {}) => {
    setScreenParams(params);
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'DASHBOARD':
        return <ProviderDashboardScreen onNavigate={handleNavigate} />;
      case 'JOB_DETAIL':
        return <ProviderJobDetailScreen bookingId={screenParams.bookingId} onNavigate={handleNavigate} />;
      default:
        return <ProviderDashboardScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Provider Bottom Navigation */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.tabItem, currentScreen === 'DASHBOARD' && styles.activeTab]}
          onPress={() => handleNavigate('DASHBOARD')}
        >
          <ProviderIcon name="flash" color={currentScreen === 'DASHBOARD' ? '#ffffff' : '#a7f3d0'} size={18} />
          <Text style={[styles.tabLabel, currentScreen === 'DASHBOARD' && styles.activeLabel]}>
            Today's Jobs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, currentScreen === 'JOB_DETAIL' && styles.activeTab]}
          onPress={() => {
            const providerBookings = (bookings || []).filter(
              (b) => b.provider_id === activeProvider?.id || b.provider_name === activeProvider?.name
            );
            const firstBooking = providerBookings[0];
            handleNavigate('JOB_DETAIL', { bookingId: firstBooking?.booking_id });
          }}
        >
          <ProviderIcon name="wrench" color={currentScreen === 'JOB_DETAIL' ? '#ffffff' : '#a7f3d0'} size={18} />
          <Text style={[styles.tabLabel, currentScreen === 'JOB_DETAIL' && styles.activeLabel]}>
            Work Orders
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  screenContainer: { flex: 1 },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#064e3b',
    paddingVertical: 10,
    paddingHorizontal: 12,
    justify.content: 'space-around',
  },
  tabItem: { alignItems: 'center', flex: 1 },
  activeTab: {},
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 10, color: '#a7f3d0', fontWeight: '600', marginTop: 2 },
  activeLabel: { color: '#ffffff', fontWeight: '800' },
});
