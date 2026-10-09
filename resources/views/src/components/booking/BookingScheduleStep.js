import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import BookingProgress from './BookingProgress';

export const DEFAULT_TIME_SLOTS = [
  '10:00 AM - 12:00 PM',
  '12:00 PM - 2:00 PM',
  '2:00 PM - 4:00 PM',
  '4:00 PM - 6:00 PM',
  '6:00 PM - 8:00 PM',
];

function buildDateOptions(count = 7) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const label =
      i === 0
        ? `Today, ${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`
        : i === 1
          ? `Tomorrow, ${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`
          : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    out.push({ key, label, dateObj: d });
  }
  return out;
}

export default function BookingScheduleStep({
  scheduledDate,
  scheduledTime,
  onChangeDate,
  onChangeTime,
  timeSlots = DEFAULT_TIME_SLOTS,
  onBack,
  onContinue,
  serviceLabel = 'Service',
  applianceSummary = '',
  isConsultation = false,
}) {
  const dates = useMemo(() => buildDateOptions(7), []);

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <BookingProgress activeIndex={2} />
        </View>
      </View>

      <Text style={styles.title}>{isConsultation ? 'Schedule free inspection' : 'Schedule your service'}</Text>
      <Text style={styles.subtitle}>
        {isConsultation ? 'Choose when you want the expert to visit your doorstep.' : 'Pick a preferred date and time slot.'}
      </Text>

      <View style={styles.serviceCard}>
        <Text style={styles.serviceTitle}>{serviceLabel}</Text>
        {!!applianceSummary && <Text style={styles.serviceSub}>{applianceSummary}</Text>}
      </View>

      <Text style={styles.section}>Preferred date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
        {dates.map((d) => {
          const on = scheduledDate === d.key;
          return (
            <TouchableOpacity
              key={d.key}
              style={[styles.dateChip, on && styles.dateChipOn]}
              onPress={() => onChangeDate?.(d.key, d.label)}
            >
              <Text style={[styles.dateChipText, on && styles.dateChipTextOn]}>{d.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.section}>Preferred time slot</Text>
      <View style={styles.slotList}>
        {timeSlots.map((slot) => {
          const on = scheduledTime === slot;
          return (
            <TouchableOpacity
              key={slot}
              style={[styles.slot, on && styles.slotOn]}
              onPress={() => onChangeTime?.(slot)}
            >
              <Text style={[styles.slotText, on && styles.slotTextOn]}>{slot}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, (!scheduledDate || !scheduledTime) && styles.primaryBtnDisabled]}
        disabled={!scheduledDate || !scheduledTime}
        onPress={onContinue}
        activeOpacity={0.9}
      >
        <Text style={styles.primaryBtnText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, gap: 12, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: { fontSize: 28, color: '#0f172a', marginTop: -2 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: -4 },
  serviceCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    gap: 4,
  },
  serviceTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  serviceSub: { fontSize: 13, color: '#64748b' },
  section: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  dateRow: { gap: 8, paddingVertical: 4 },
  dateChip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  dateChipOn: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  dateChipText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  dateChipTextOn: { color: '#fff' },
  slotList: { gap: 8 },
  slot: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  slotOn: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  slotText: { fontSize: 14, fontWeight: '600', color: '#334155', textAlign: 'center' },
  slotTextOn: { color: '#fff' },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: { backgroundColor: '#94a3b8' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
