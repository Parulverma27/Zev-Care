import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import SubscriptionPlansScreen from './screens/SubscriptionPlansScreen';
import PropertyVerificationScreen from './screens/PropertyVerificationScreen';
import BookingFlowScreen from './screens/BookingFlowScreen';
import BookingDetailScreen from './screens/BookingDetailScreen';
import WalletScreen from './screens/WalletScreen';
import MyAmcScreen from './screens/MyAmcScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import SavedAddressesScreen from './screens/SavedAddressesScreen';
import LiveSupportScreen from './screens/LiveSupportScreen';
import ServiceBrowseScreen from './screens/ServiceBrowseScreen';
import ConsultationScreen from './screens/ConsultationScreen';
import { AppIcon } from '../components/AppIcons';

export default function UserAppNavigator() {
  const [currentScreen, setCurrentScreen] = useState('HOME');
  const [screenParams, setScreenParams] = useState({});

  const handleNavigate = (screen, params = {}) => {
    let target = screen;
    if (typeof screen === 'string') {
      if (screen === '/user/home' || screen.endsWith('/home')) target = 'HOME';
      else if (screen === '/user/my-amc' || screen.endsWith('/my-amc')) target = 'WALLET';
      else if (screen === '/user/bookings' || screen.endsWith('/bookings')) target = 'BOOKING_DETAIL';
      else if (screen === '/user/profile' || screen.endsWith('/profile')) target = 'PROFILE';
      else if (screen === '/user/complains' || screen.endsWith('/complains')) target = 'COMPLAINS';
      else if (screen === '/user/consultation' || screen.endsWith('/consultation')) target = 'CONSULTATION';
    }
    setScreenParams(params);
    setCurrentScreen(target);
  };

  const handleAuthComplete = (profileData) => {
    handleNavigate('SUBSCRIPTION');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'AUTH':
        return <AuthScreen onAuthComplete={handleAuthComplete} />;
      case 'HOME':
        return <HomeScreen onNavigate={handleNavigate} />;
      case 'SUBSCRIPTION':
        return <SubscriptionPlansScreen onNavigate={handleNavigate} />;
      case 'PROPERTY_VERIFY':
        return <PropertyVerificationScreen onNavigate={handleNavigate} />;
      case 'BOOKING_FLOW':
        return <BookingFlowScreen onNavigate={handleNavigate} initialCategory={screenParams.category} />;
      case 'BOOKING_DETAIL':
        return <BookingDetailScreen bookingId={screenParams.bookingId} onNavigate={handleNavigate} />;
      case 'WALLET':
        return <MyAmcScreen onNavigate={handleNavigate} />;
      case 'PROFILE':
        return <UserProfileScreen onNavigate={handleNavigate} />;
      case 'SAVED_ADDRESSES':
        return <SavedAddressesScreen onNavigate={handleNavigate} />;
      case 'LIVE_SUPPORT':
        return <LiveSupportScreen onNavigate={handleNavigate} />;
      case 'COMPLAINS':
        return <ServiceBrowseScreen onNavigate={handleNavigate} />;
      case 'CONSULTATION':
        return <ServiceBrowseScreen onNavigate={handleNavigate} />;
      default:
        return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Mobile-First Bottom Navigation Bar */}
      {currentScreen !== 'AUTH' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.tabItem, currentScreen === 'WALLET' && styles.activeTab]}
            onPress={() => handleNavigate('WALLET')}
          >
            <AppIcon name="shield" size={18} color={currentScreen === 'WALLET' ? '#2563eb' : '#64748b'} />
            <Text style={[styles.tabLabel, currentScreen === 'WALLET' && styles.activeLabel]}>My AMC</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, currentScreen === 'BOOKING_DETAIL' && styles.activeTab]}
            onPress={() => handleNavigate('BOOKING_DETAIL', { bookingId: 'BK-2026-000125' })}
          >
            <AppIcon name="file-text" size={18} color={currentScreen === 'BOOKING_DETAIL' ? '#2563eb' : '#64748b'} />
            <Text style={[styles.tabLabel, currentScreen === 'BOOKING_DETAIL' && styles.activeLabel]}>Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, currentScreen === 'PROFILE' && styles.activeTab]}
            onPress={() => handleNavigate('PROFILE')}
          >
            <AppIcon name="user" size={18} color={currentScreen === 'PROFILE' ? '#2563eb' : '#64748b'} />
            <Text style={[styles.tabLabel, currentScreen === 'PROFILE' && styles.activeLabel]}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  screenContainer: { flex: 1 },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  tabItem: { alignItems: 'center', flex: 1, minWidth: 48 },
  activeTab: {},
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 10, color: '#64748b', fontWeight: '600', marginTop: 2 },
  activeLabel: { color: '#2563eb', fontWeight: '800' },
});
