import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STEPS = ['Appliance', 'Issue', 'Schedule', 'Location', 'Review'];

export default function BookingProgress() {
  return null;
}

const styles = StyleSheet.create({
  wrap: { gap: 6, marginBottom: 12 },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 999 },
  label: { fontSize: 12, color: '#64748b', fontWeight: '600' },
});
