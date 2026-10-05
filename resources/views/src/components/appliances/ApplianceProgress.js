import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/** Unit progress: currentIndex is 0-based, total is quantity. */
export default function ApplianceProgress({ currentIndex = 0, total = 1, labelPrefix = 'Step' }) {
  const step = Math.min(currentIndex + 1, total);
  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityValue={{ now: step, min: 1, max: total }}>
      <View style={styles.dotsRow}>
        {Array.from({ length: total }).map((_, i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={[styles.line, i <= currentIndex && styles.lineDone]} />}
            <View
              style={[
                styles.dot,
                i < currentIndex && styles.dotDone,
                i === currentIndex && styles.dotActive,
              ]}
            />
          </React.Fragment>
        ))}
      </View>
      <Text style={styles.label}>
        {labelPrefix} {step} of {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8, marginBottom: 8 },
  dotsRow: { flexDirection: 'row', alignItems: 'center' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e2e8f0',
  },
  dotDone: { backgroundColor: '#2563eb' },
  dotActive: {
    backgroundColor: '#2563eb',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 28,
    height: 2,
    backgroundColor: '#e2e8f0',
  },
  lineDone: { backgroundColor: '#2563eb' },
  label: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
});
