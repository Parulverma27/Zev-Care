import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import HomeExploreServices from './HomeExploreServices';

export default function ServiceBrowseScreen({ onNavigate }) {
  const { categories } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const isConsultation = (location.pathname || '').includes('consultation');

  const goHome = () => {
    if (onNavigate) {
      try {
        onNavigate('HOME');
        onNavigate('/user/home');
      } catch (e) {}
    }
    if (navigate) {
      try {
        navigate('/user/home');
        return;
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/user/home';
    }
  };

  const openBooking = (cat) => {
    navigate('/user/bookings/new', {
      state: {
        preSelectedCategory: cat?.name,
        bookingMode: isConsultation ? 'consultation' : 'complaint',
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={goHome}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0F1F3D"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: 'none' }}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.title} numberOfLines={1}>
            {isConsultation ? 'AMC Consultation' : 'AMC Complains'}
          </Text>
        </View>
      </View>

      {isConsultation ? (
        <View style={styles.freeBanner}>
          <View style={styles.freePill}>
            <Text style={styles.freePillText}>FREE</Text>
          </View>
          <Text style={styles.freeBannerText}>Consultation is complimentary for logged-in users.</Text>
        </View>
      ) : null}

      <HomeExploreServices
        categories={categories}
        title={isConsultation ? 'Select appliance or service' : 'Explore Services'}
        onSelectCategory={openBooking}
        isComplaint={!isConsultation}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', width: '100%' },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100, gap: 14, width: '100%', boxSizing: 'border-box' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    cursor: 'pointer',
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a192f',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  freePill: {
    backgroundColor: '#059669',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  freePillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  freeBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#065f46',
    fontWeight: '600',
    lineHeight: 16,
  },
});
