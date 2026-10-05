import React from 'react';
import { View, StyleSheet } from 'react-native';

export function VectorTabIcon({ name, active, activeColor = '#2563eb', inactiveColor = '#64748b', theme = 'light' }) {
  const color = active ? activeColor : inactiveColor;

  const renderIconContent = () => {
    switch (name) {
      case 'home':
        if (active) {
          return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563eb" stroke="#2563eb" strokeWidth="1">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          );
        }
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );

      case 'bookings':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="4" y1="10" x2="20" y2="10" />
            <line x1="8" y1="14" x2="16" y2="14" />
          </svg>
        );

      case 'amc':
      case 'wallet':
        if (active) {
          return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(212, 175, 55, 0.18)" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          );
        }
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        );

      case 'profile':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );

      // Provider screen SVGs
      case 'provider-today':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#ffffff" : "#93c5fd"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );
      case 'provider-work':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#ffffff" : "#93c5fd"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        );
      case 'provider-earnings':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#ffffff" : "#93c5fd"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case 'provider-profile':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#ffffff" : "#93c5fd"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.iconContainer}>
      {renderIconContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 36,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
