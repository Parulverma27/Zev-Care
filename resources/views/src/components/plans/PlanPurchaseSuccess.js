import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * PlanPurchaseSuccess
 * Shown right after a plan purchase is verified.
 *
 * Props:
 *  - planName: string
 *  - contractNo: string
 *  - applianceCount: number
 *  - onGoHome(): navigate to home
 *  - onViewPlan(): go to the plans dashboard (active plan card)
 */
export default function PlanPurchaseSuccess({
  planName = 'AMC',
  contractNo = '',
  applianceCount = 0,
  onGoHome,
  onViewPlan,
}) {
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.iconRing}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>✓</Text>
          </View>
        </View>

        <Text style={styles.title}>{planName} Activated!</Text>
        <Text style={styles.sub}>
          Your appliances are now protected. You can book breakdown repairs with ₹0 labour anytime.
        </Text>

        <View style={styles.infoBox}>
          {contractNo ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contract No.</Text>
              <Text style={styles.infoVal}>{contractNo}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Covered Appliances</Text>
            <Text style={styles.infoVal}>{applianceCount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Validity</Text>
            <Text style={styles.infoVal}>12 Months</Text>
          </View>
        </View>

        <Text style={styles.note}>
          Note: booking a service for an appliance not covered under this plan costs ₹500 extra per appliance.
        </Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={onGoHome} activeOpacity={0.88}>
          <Text style={styles.primaryBtnText}>Go to Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onViewPlan} activeOpacity={0.85}>
          <Text style={styles.secondaryBtnText}>View My Plan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    gap: 16,
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: '#dbeafe',
    boxShadow: '0 20px 50px rgba(37, 99, 235, 0.12)',
  },
  iconRing: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 20px rgba(22, 163, 74, 0.35)',
  },
  iconText: { fontSize: 34, fontWeight: '900', color: '#ffffff' },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  sub: { fontSize: 14.5, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  infoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  infoVal: { fontSize: 13, color: '#0f172a', fontWeight: '800' },
  note: {
    fontSize: 11.5, color: '#92400e', backgroundColor: '#fffbeb', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#fde68a', lineHeight: 17,
  },
  primaryBtn: {
    backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)', cursor: 'pointer',
  },
  primaryBtnText: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  secondaryBtn: {
    borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff', cursor: 'pointer',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: '#1d4ed8' },
});
