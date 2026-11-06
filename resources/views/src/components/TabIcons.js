import React from 'react';
import { View, StyleSheet } from 'react-native';

export function VectorTabIcon({ name, active, activeColor = '#2563eb', inactiveColor = '#64748b', theme = 'light' }) {
  const color = active ? activeColor : inactiveColor;

  const renderIconContent = () => {
    switch (name) {
      case 'home':
        if (active) {
          return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="homeGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
              <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" stroke="url(#homeGrad)" fill="rgba(37, 99, 235, 0.16)" />
              <polyline points="9 22 9 12 15 12 15 22" stroke="url(#homeGrad)" strokeWidth="2.2" />
            </svg>
          );
        }
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );

      case 'bookings':
        if (active) {
          return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="bookGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
              <rect x="3" y="4" width="18" height="17" rx="3" ry="3" stroke="url(#bookGrad)" fill="rgba(37, 99, 235, 0.16)" />
              <line x1="16" y1="2" x2="16" y2="6" stroke="url(#bookGrad)" strokeWidth="2.4" />
              <line x1="8" y1="2" x2="8" y2="6" stroke="url(#bookGrad)" strokeWidth="2.4" />
              <line x1="3" y1="10" x2="21" y2="10" stroke="url(#bookGrad)" strokeWidth="2" />
              <circle cx="8" cy="14.5" r="1.2" fill="#2563eb" />
              <circle cx="12" cy="14.5" r="1.2" fill="#2563eb" />
              <circle cx="16" cy="14.5" r="1.2" fill="#2563eb" />
            </svg>
          );
        }
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="17" rx="3" ry="3" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" strokeWidth="1.6" />
            <circle cx="8" cy="14.5" r="1" fill={color} />
            <circle cx="12" cy="14.5" r="1" fill={color} />
            <circle cx="16" cy="14.5" r="1" fill={color} />
          </svg>
        );

      case 'amc':
      case 'wallet':
        if (active) {
          return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="amcGoldGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="url(#amcGoldGrad)" fill="rgba(245, 158, 11, 0.22)" />
              <path d="m9 12 2 2 4-4" stroke="url(#amcGoldGrad)" strokeWidth="2.4" />
            </svg>
          );
        }
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" strokeWidth="1.9" />
          </svg>
        );

      case 'profile':
        if (active) {
          return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="profGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
              </defs>
              <path d="M20 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-7A4.5 4.5 0 0 0 4 19.5V21" stroke="url(#profGrad)" fill="rgba(37, 99, 235, 0.16)" />
              <circle cx="12" cy="7" r="4" stroke="url(#profGrad)" fill="rgba(37, 99, 235, 0.16)" />
            </svg>
          );
        }
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-7A4.5 4.5 0 0 0 4 19.5V21" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );

      // Provider screen SVGs
      case 'provider-today':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill={active ? "rgba(37, 99, 235, 0.16)" : "none"} />
          </svg>
        );
      case 'provider-work':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill={active ? "rgba(37, 99, 235, 0.16)" : "none"} />
          </svg>
        );
      case 'provider-earnings':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case 'provider-profile':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill={active ? "rgba(37, 99, 235, 0.16)" : "none"} />
            <circle cx="12" cy="7" r="4" fill={active ? "rgba(37, 99, 235, 0.16)" : "none"} />
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
