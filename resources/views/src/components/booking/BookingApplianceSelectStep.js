import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import BookingApplianceCard from './BookingApplianceCard';
import BookingProgress from './BookingProgress';
import { APPLIANCE_REGISTRATION_FEE } from '../../config/applianceConstants';

export default function BookingApplianceSelectStep({
  displayName = 'Appliance',
  appliances = [],
  selectedId,
  onSelect,
  onContinue,
  onAddNew,
  onBack,
}) {
  const empty = !appliances.length;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel="Go back">
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <BookingProgress activeIndex={0} />
        </View>
      </View>

      <Text style={styles.title}>Which {displayName} would you like to service?</Text>
      <Text style={styles.subtitle}>
        Choose a registered {displayName.toLowerCase()} or add a new one.
      </Text>

      {empty ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No {displayName} added yet</Text>
          <Text style={styles.emptySub}>
            You haven&apos;t added a {displayName.toLowerCase()} to your appliances.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={onAddNew} activeOpacity={0.9}>
            <Text style={styles.primaryBtnText}>+ Add {displayName}</Text>
          </TouchableOpacity>
          <View style={styles.feeBanner}>
            <Text style={styles.feeTitle}>Additional appliance registration charge</Text>
            <Text style={styles.feeAmount}>₹{APPLIANCE_REGISTRATION_FEE}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.list}>
          {appliances.map((a) => (
            <BookingApplianceCard
              key={a.id}
              appliance={a}
              selected={String(selectedId) === String(a.id)}
              onPress={() => onSelect?.(a)}
            />
          ))}

          <TouchableOpacity style={styles.addCard} onPress={onAddNew} activeOpacity={0.88}>
            <Text style={styles.addTitle}>+ Add another {displayName}</Text>
            <Text style={styles.addSub}>
              Additional ₹{APPLIANCE_REGISTRATION_FEE} registration charge
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!empty && selectedId != null && (
        <TouchableOpacity style={styles.primaryBtn} onPress={onContinue} activeOpacity={0.9}>
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' },
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
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: '#64748b', lineHeight: 20, marginTop: -6 },
  list: { gap: 10 },
  emptyCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    backgroundColor: '#f8fafc',
    gap: 10,
    alignItems: 'stretch',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 18 },
  feeBanner: {
    marginTop: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeTitle: { fontSize: 12, color: '#9a3412', fontWeight: '600', flex: 1 },
  feeAmount: { fontSize: 16, fontWeight: '800', color: '#c2410c' },
  addCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    gap: 4,
  },
  addTitle: { fontSize: 15, fontWeight: '700', color: '#1d4ed8' },
  addSub: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
