import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import ProviderIcon from '../ProviderIcons';

export default function ProviderEarningsScreen() {
  const { bookings } = useApp();

  // Only count real completed bookings assigned to this provider
  const completedBookings = bookings.filter((b) => b.status === 'BOOKING_COMPLETED');

  const displaySettlements = completedBookings.map((b) => {
    const amount = Number(b.total_bill || 0);
    const payout = Number(b.payout_amount || Math.round(amount * 0.8));
    return {
      booking_id: b.booking_id,
      service: b.service_name,
      customer: b.user_name,
      amount,
      payout,
      date: b.completed_date || b.scheduled_date || 'N/A',
    };
  });

  // Compute real total from actual completed bookings only — no fallback hardcoded values
  const totalEarned = displaySettlements.reduce((sum, s) => sum + s.payout, 0);
  const totalCompletedJobs = completedBookings.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Partner Earnings & Settlements</Text>
          <ProviderIcon name="wallet" color="#2563eb" size={20} />
        </View>
        <Text style={styles.subtitle}>Track direct partner payouts, completed work order revenue, and settlements.</Text>
      </View>

      {/* Main Total Earnings Card */}
      <View style={styles.earnCard}>
        <Text style={styles.earnLabel}>Total Partner Revenue Earned (80%)</Text>
        <Text style={styles.earnVal}>₹{totalEarned.toLocaleString()}</Text>

        <View style={styles.statsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statSub}>Completed Jobs</Text>
            <Text style={styles.statBold}>{totalCompletedJobs} Jobs</Text>
          </View>

          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.statSub}>Partner Commission Share</Text>
            <Text style={styles.statBold}>80% Direct Payout</Text>
          </View>
        </View>
      </View>

      {/* Completed Settlements Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Work Order Payouts</Text>

        {displaySettlements.map((s, idx) => (
          <View key={idx} style={styles.settleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settleService}>{s.service} ({s.booking_id})</Text>
              <Text style={styles.settleCustomer}>Customer: {s.customer}</Text>
              <Text style={styles.settleDate}>{s.date} • Total Bill: ₹{s.amount.toLocaleString()}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.settlePayout}>+ ₹{s.payout.toLocaleString()}</Text>
              <View style={styles.settledBadge}>
                <ProviderIcon name="checkCircle" color="#1d4ed8" size={10} />
                <Text style={styles.settleStatus}>SETTLED</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eff6ff' },
  content: { padding: 16, gap: 16 },
  header: { gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b' },

  earnCard: { backgroundColor: '#1e3a8a', borderRadius: 20, padding: 20, gap: 14, shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  earnLabel: { color: '#93c5fd', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  earnVal: { color: '#ffffff', fontSize: 34, fontWeight: '900' },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 12 },
  statSub: { color: '#bfdbfe', fontSize: 11 },
  statBold: { color: '#ffffff', fontSize: 14, fontWeight: '900', marginTop: 2 },

  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#bfdbfe', gap: 10, shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: '900', color: '#0f172a' },

  settleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  settleService: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  settleCustomer: { fontSize: 11, color: '#2563eb', fontWeight: '600', marginTop: 1 },
  settleDate: { fontSize: 11, color: '#64748b', marginTop: 2 },
  settlePayout: { fontSize: 15, fontWeight: '900', color: '#1d4ed8' },
  settledBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#dbeafe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  settleStatus: { fontSize: 9, color: '#1d4ed8', fontWeight: '800' },
});
