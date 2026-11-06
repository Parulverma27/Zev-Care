import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useApp } from '../../context/AppContext';
import ProviderIcon from '../ProviderIcons';

export default function ProviderEarningsScreen() {
  const { bookings, activeProvider } = useApp();

  const isAssigned = (b) => {
    if (!activeProvider) return false;
    const providerIdMatches = b.provider_id != null && String(b.provider_id) === String(activeProvider.id);
    const cleanProviderPhone = (activeProvider.phone || '').replace(/\D/g, '').slice(-10);
    const cleanBookingProviderPhone = (b.provider_phone || '').replace(/\D/g, '').slice(-10);
    const phoneMatches = Boolean(cleanProviderPhone && cleanBookingProviderPhone && cleanProviderPhone === cleanBookingProviderPhone);
    const nameMatches = Boolean(
      activeProvider.name &&
      b.provider_name &&
      activeProvider.name.trim().toLowerCase() === b.provider_name.trim().toLowerCase()
    );
    return providerIdMatches || phoneMatches || nameMatches;
  };

  // Only count real completed bookings assigned to this provider
  const completedBookings = bookings.filter((b) => b.status === 'BOOKING_COMPLETED' && isAssigned(b));

  const displaySettlements = completedBookings.map((b) => {
    const amount = Number(b.total_bill || 0);
    const payout = Number(b.payout_amount || Math.round(amount * 0.8));
    const formattedDate = b.completed_date || b.completed_at
      ? new Date(b.completed_date || b.completed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : (b.scheduled_date || 'N/A');
    return {
      booking_id: b.booking_id,
      service: b.service_name,
      customer: b.user_name,
      amount,
      payout,
      date: formattedDate,
    };
  });

  // Compute real total from actual completed bookings only — no fallback hardcoded values
  const totalEarned = displaySettlements.reduce((sum, s) => sum + s.payout, 0);
  const totalCompletedJobs = completedBookings.length;
  const avgPayout = totalCompletedJobs > 0 ? Math.round(totalEarned / totalCompletedJobs) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Partner Earnings & Settlements</Text>
          <ProviderIcon name="wallet" color="#2563eb" size={20} />
        </View>
        <Text style={styles.subtitle}>
          Track your direct technician payouts, verified job revenue, and automated weekly settlements.
        </Text>
      </View>

      {/* Main Hero Total Earnings Card */}
      <View style={styles.earnCard}>
        <View style={styles.earnCardHeader}>
          <Text style={styles.earnLabel}>NET ACCUMULATED EARNINGS</Text>
          <View style={styles.verifiedPayoutBadge}>
            <ProviderIcon name="checkCircle" color="#10b981" size={11} />
            <Text style={styles.verifiedPayoutText}>Direct Payout Active</Text>
          </View>
        </View>

        <Text style={styles.earnVal}>₹{totalEarned.toLocaleString()}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.statSub}>Completed Jobs</Text>
            <Text style={styles.statBold}>{totalCompletedJobs}</Text>
          </View>

          <View style={styles.statTile}>
            <Text style={styles.statSub}>Technician Share</Text>
            <Text style={styles.statBold}>80% Direct</Text>
          </View>

          <View style={[styles.statTile, { borderRightWidth: 0 }]}>
            <Text style={styles.statSub}>Avg. Per Job</Text>
            <Text style={styles.statBold}>₹{avgPayout.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Settlement Policy Info Banner */}
      <View style={styles.policyBanner}>
        <View style={styles.policyIconCircle}>
          <ProviderIcon name="briefcase" color="#1d4ed8" size={14} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.policyTitle}>Weekly Automatic Direct Transfer</Text>
          <Text style={styles.policySub}>
            Earnings are deposited every Monday into your verified bank account. Zero service fee is deducted on ₹0 diagnostic visits.
          </Text>
        </View>
      </View>

      {/* Completed Settlements Breakdown */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Recent Work Order Settlements</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{displaySettlements.length} Settled</Text>
          </View>
        </View>

        {displaySettlements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <ProviderIcon name="wallet" color="#2563eb" size={26} />
            </View>
            <Text style={styles.emptyTitle}>No Settled Payouts Yet</Text>
            <Text style={styles.emptySubtitle}>
              Completed work orders with approved customer OTP will appear here with your 80% direct partner settlement.
            </Text>
          </View>
        ) : (
          displaySettlements.map((s, idx) => (
            <View key={idx} style={[styles.settleRow, idx === displaySettlements.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.settleService}>{s.service}</Text>
                  <View style={styles.orderIdBadge}>
                    <Text style={styles.orderIdBadgeText}>#{s.booking_id}</Text>
                  </View>
                </View>
                <Text style={styles.settleCustomer}>Customer: <Text style={{ color: '#0f172a', fontWeight: '700' }}>{s.customer || 'Customer'}</Text></Text>
                <Text style={styles.settleDate}>{s.date} • Total Job Bill: ₹{s.amount.toLocaleString()}</Text>
              </View>

              <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                <Text style={styles.settlePayout}>+₹{s.payout.toLocaleString()}</Text>
                <View style={styles.settledBadge}>
                  <ProviderIcon name="checkCircle" color="#059669" size={10} />
                  <Text style={styles.settleStatus}>SETTLED</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', width: '100%' },
  content: { padding: 14, gap: 14, width: '100%', boxSizing: 'border-box' },
  header: { gap: 4, width: '100%' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 19, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 11.5, color: '#64748b', lineHeight: 16 },

  earnCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 18,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  earnCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  earnLabel: { color: '#94a3b8', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6 },
  verifiedPayoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  verifiedPayoutText: { color: '#34d399', fontSize: 10, fontWeight: '800' },
  earnVal: { color: '#ffffff', fontSize: 32, fontWeight: '900', lineHeight: 36 },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 12,
    gap: 8,
  },
  statTile: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    paddingRight: 6,
  },
  statSub: { color: '#64748b', fontSize: 10.5, fontWeight: '600' },
  statBold: { color: '#ffffff', fontSize: 13.5, fontWeight: '800', marginTop: 2 },

  policyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    boxSizing: 'border-box',
  },
  policyIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  policyTitle: { fontSize: 12, fontWeight: '800', color: '#1e40af' },
  policySub: { fontSize: 11, color: '#2563eb', lineHeight: 15, marginTop: 2 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    width: '100%',
    boxSizing: 'border-box',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  countBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  countBadgeText: { fontSize: 10.5, fontWeight: '700', color: '#475569' },

  settleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settleService: { fontSize: 13.5, fontWeight: '800', color: '#0f172a' },
  orderIdBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderIdBadgeText: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  settleCustomer: { fontSize: 11, color: '#475569', marginTop: 3 },
  settleDate: { fontSize: 10.5, color: '#64748b', marginTop: 2 },
  settlePayout: { fontSize: 15, fontWeight: '900', color: '#059669' },
  settledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  settleStatus: { fontSize: 9.5, color: '#065f46', fontWeight: '800', letterSpacing: 0.3 },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28, paddingHorizontal: 16, gap: 8 },
  emptyIconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  emptySubtitle: { fontSize: 11.5, color: '#64748b', textAlign: 'center', lineHeight: 16, maxWidth: 300 },
});
