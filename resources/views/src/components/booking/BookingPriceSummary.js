import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function formatINR(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function BookingPriceSummary({ pricing, showRegistration = true }) {
  if (!pricing) return null;
  const {
    serviceCharge = 0,
    extraApplianceServiceCharge = 0,
    applianceRegistrationFee = 0,
    discount = 0,
    total = 0,
  } = pricing;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Charges</Text>
      <Row label="Service charge" value={formatINR(serviceCharge)} />
      {extraApplianceServiceCharge > 0 && (
        <Row label="Extra service units" value={formatINR(extraApplianceServiceCharge)} />
      )}
      {showRegistration && applianceRegistrationFee > 0 && (
        <Row label="New appliance registration" value={formatINR(applianceRegistrationFee)} highlight />
      )}
      {discount > 0 && <Row label="Discount" value={`−${formatINR(discount)}`} />}
      <View style={styles.divider} />
      <Row label="Total" value={formatINR(total)} bold />
    </View>
  );
}

function Row({ label, value, bold, highlight }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, bold && styles.bold, highlight && styles.highlight]}>{label}</Text>
      <Text style={[styles.value, bold && styles.bold, highlight && styles.highlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    gap: 8,
  },
  title: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, color: '#64748b' },
  value: { fontSize: 13, color: '#0f172a', fontWeight: '600' },
  bold: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  highlight: { color: '#c2410c' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 4 },
});
