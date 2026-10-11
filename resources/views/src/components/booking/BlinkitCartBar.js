import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function BlinkitCartBar({
  count = 0,
  items = [],
  actionLabel = 'Proceed',
  onProceed = () => {},
  onViewCart = null,
  bottomOffset = null,
}) {
  if (count <= 0) return null;

  // Compute bottom positioning so it never gets covered by the bottom navigation bar
  const hasBottomNav =
    typeof window !== 'undefined' &&
    !window.location.pathname.includes('/bookings/new') &&
    !window.location.pathname.includes('/login') &&
    !window.location.pathname.includes('/register');

  const computedBottom = bottomOffset != null ? bottomOffset : (hasBottomNav ? 82 : 20);

  // Generate concise items preview (e.g. "Tap Mixer, Cockroach...")
  const itemNames = (items || []).map((i) => i.name || i.serviceName || 'Item');
  const previewText =
    itemNames.length > 2
      ? `${itemNames.slice(0, 2).join(', ')} +${itemNames.length - 2} more`
      : itemNames.join(', ') || `${count} service${count > 1 ? 's' : ''} selected`;

  return (
    <View style={[styles.floatingWrapper, { bottom: computedBottom }]}>
      <View style={styles.barCard}>
        {/* Left Side: Cart Icon & Item Count */}
        <TouchableOpacity
          style={styles.infoCol}
          onPress={onViewCart || onProceed}
          activeOpacity={0.85}
        >
          <View style={styles.cartIconCircle}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <View style={styles.badgePip}>
              <Text style={styles.badgePipText}>{count}</Text>
            </View>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.countHeading}>
              {count} {count === 1 ? 'Item' : 'Items'} Added
            </Text>
            <Text style={styles.itemNamesPreview} numberOfLines={1}>
              {previewText}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right Side: Proceed Action Button */}
        <TouchableOpacity
          style={styles.proceedBtn}
          onPress={onProceed}
          activeOpacity={0.88}
        >
          <Text style={styles.proceedBtnText}>{actionLabel}</Text>
          <View style={styles.arrowCircle}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: 'fixed',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  barCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.45), 0 4px 12px rgba(0, 0, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  infoCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    cursor: 'pointer',
  },
  cartIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  badgePip: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#10b981',
    borderRadius: 99,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  badgePipText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
  },
  countHeading: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    letterSpacing: 0.1,
  },
  itemNamesPreview: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  proceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(255, 255, 255, 0.2)',
  },
  proceedBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  arrowCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
