import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';

export default function BookingConfirmation({
  booking,
  onViewBooking,
  onGoHome,
}) {
  if (!booking) return null;
  const id = booking.booking_id || booking.id;
  const service = booking.service_name || booking.service || 'Service';
  const date = booking.scheduledDate || booking.scheduled_date || booking.schedule || '—';
  const time = booking.scheduledTime || booking.scheduled_time || '';
  const address = booking.address_text || booking.address || '—';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.badge}>
        <Text style={styles.check}>✓</Text>
      </View>
      <Text style={styles.title}>Booking Confirmed</Text>
      <Text style={styles.subtitle}>
        Your {service} has been successfully booked.
      </Text>

      <View style={styles.card}>
        <Text style={styles.idLabel}>Booking ID</Text>
        <Text style={styles.idValue}>{id}</Text>
      </View>

      <View style={styles.card}>
        <Row label="Service" value={service} />
        <Row label="Date" value={date} />
        {!!time && <Row label="Time" value={time} />}
        <Row label="Location" value={address} />
        {!!booking.applianceName && <Row label="Appliance" value={booking.applianceName} />}
        {!!(booking.issue || booking.issue_description) && (
          <Row label="Issue" value={booking.issue || booking.issue_description} />
        )}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onViewBooking} activeOpacity={0.9}>
        <Text style={styles.primaryBtnText}>View Booking</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={onGoHome} activeOpacity={0.9}>
        <Text style={styles.secondaryBtnText}>Go to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 14,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  check: { color: '#fff', fontSize: 36, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  card: {
    width: '100%',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    gap: 10,
  },
  idLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  idValue: { fontSize: 18, fontWeight: '800', color: '#2563eb' },
  row: { gap: 2 },
  rowLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' },
  rowValue: { fontSize: 14, color: '#0f172a', fontWeight: '600', lineHeight: 20 },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  secondaryBtnText: { color: '#334155', fontWeight: '700', fontSize: 15 },
});
