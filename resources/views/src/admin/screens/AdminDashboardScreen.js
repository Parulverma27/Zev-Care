import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  BellIcon,
  BookingsIcon,
  CameraIcon,
  VideoIcon,
  ClockIcon,
  CheckCircleIcon,
  UsersIcon,
  ProvidersIcon,
  FinanceIcon,
} from '../components/AdminIcons';

export default function AdminDashboardScreen({ onNavigate }) {
  const { bookings, users, providers, categories, userAppliances, wallet } = useApp();
  const navigate = useNavigate();

  const handleNav = (path) => {
    if (navigate) navigate(path);
    else if (onNavigate) onNavigate(path);
  };

  const getPlatformRevenue = () => {
    const txs = wallet?.transactions || [];
    const planRevenue = txs
      .filter((tx) => tx.type === 'PLAN_PURCHASE')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    return planRevenue;
  };

  const isConsultation = (b) => Boolean(b?.isConsultation || b?.booking_mode === 'consultation');
  const regularBookings = (bookings || []).filter((b) => !isConsultation(b));
  const consultationBookings = (bookings || []).filter((b) => isConsultation(b));

  const stats = [
    { title: 'Total Registered Users', val: (users || []).length, color: '#2563eb', bg: '#eff6ff', icon: UsersIcon, path: '/admin/users' },
    { title: 'Approved Partners', val: (providers || []).length, color: '#059669', bg: '#ecfdf5', icon: ProvidersIcon, path: '/admin/providers' },
    { title: 'Work Orders & Bookings', val: regularBookings.length, color: '#7c3aed', bg: '#f5f3ff', icon: BookingsIcon, path: '/admin/bookings' },
    { title: 'My Mechanic (₹0 Visits)', val: consultationBookings.length, color: '#0284c7', bg: '#f0f9ff', icon: BookingsIcon, path: '/admin/consultations' },
    { title: 'Total Platform Revenue', val: `₹${getPlatformRevenue().toLocaleString('en-IN')}`, color: '#d97706', bg: '#fffbe6', icon: FinanceIcon, path: '/admin/finance' },
  ];

  const reportedBookings = (bookings || []).filter((b) => b.status === 'ASSIGNED_TO_ADMIN' || b.inspection_report);
  const pendingApplianceUploads = (userAppliances || []).filter((a) => a.mediaStatus === 'PENDING_REVIEW');

  const getCategoryStats = () => {
    const statsMap = {};
    (categories || []).forEach((cat) => {
      statsMap[cat.name] = { name: cat.name, count: 0, revenue: 0 };
    });

    (bookings || []).forEach((b) => {
      const catName = b.category_name || 'Electrical';
      if (!statsMap[catName]) {
        statsMap[catName] = { name: catName, count: 0, revenue: 0 };
      }
      statsMap[catName].count += 1;
      statsMap[catName].revenue += b.total_bill || 0;
    });

    const list = Object.values(statsMap);
    const grandTotalRevenue = list.reduce((acc, item) => acc + item.revenue, 0);

    if (grandTotalRevenue === 0) {
      return [
        { cat: 'Electrical Services', jobs: `${(bookings || []).filter((b) => b.category_name === 'Electrical').length} Bookings`, total: '₹8,000', pct: '100% share' },
        { cat: 'Plumbing Services', jobs: '0 Bookings', total: '₹0', pct: '0% share' },
        { cat: 'AC Services', jobs: '0 Bookings', total: '₹0', pct: '0% share' },
      ];
    }

    return list
      .filter((item) => item.count > 0 || item.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .map((item) => {
        const pct = Math.round((item.revenue / grandTotalRevenue) * 100);
        return {
          cat: item.name,
          jobs: `${item.count} Bookings`,
          total: `₹${item.revenue.toLocaleString('en-IN')}`,
          pct: `${pct}% share`,
        };
      });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Operational Analytics & Dispatch Dashboard</Text>
        <Text style={styles.subtitle}>
          Real-time monitoring of provider field inspection reports, subscription wallets & partner performance.
        </Text>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.statsGrid}>
        {stats.map((st, idx) => {
          const IconComp = st.icon;
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.statCard, { backgroundColor: '#ffffff', borderColor: '#e2e8f0' }]}
              onPress={() => st.path && handleNav(st.path)}
              activeOpacity={0.85}
            >
              <View style={styles.statHeaderRow}>
                <Text style={styles.statTitle}>{st.title}</Text>
                <View style={[styles.statIconBox, { backgroundColor: st.bg }]}>
                  <IconComp color={st.color} size={18} />
                </View>
              </View>
              <Text style={[styles.statVal, { color: st.color }]}>{st.val}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Dispatch Action Center */}
      <View style={styles.actionCenterCard}>
        <View style={styles.actionCenterHeaderRow}>
          <BellIcon color="#2563eb" size={20} />
          <View style={{ flex: 1 }}>
            <Text style={styles.actionCenterTitle}>Dispatch Action Center & Alerts</Text>
            <Text style={styles.actionCenterSub}>Urgent field operations requiring immediate administrative response.</Text>
          </View>
        </View>

        <View style={styles.alertList}>
          {reportedBookings.map((b, idx) => (
            <View key={idx} style={styles.alertRow}>
              <View style={[styles.alertIconCircle, { backgroundColor: '#eff6ff' }]}>
                <BookingsIcon color="#2563eb" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>Inspection Report Received: {b.booking_id}</Text>
                <Text style={styles.alertText}>
                  Provider <Text style={styles.alertBold}>{b.provider_name}</Text> submitted field report for {b.service_name}{isConsultation(b) ? ' (My Mechanic Consultation)' : ''}.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.alertActionBtn}
                onPress={() => handleNav(isConsultation(b) ? '/admin/consultations' : `/admin/bookings/${b.booking_id}`)}
              >
                <Text style={styles.alertActionBtnText}>Review & Bill</Text>
              </TouchableOpacity>
            </View>
          ))}

          {pendingApplianceUploads.map((appliance, idx) => {
            const owner = (users || []).find((u) => u.id === appliance.userId || u.id === appliance.user_id);
            return (
              <View key={`appliance-${appliance.id}-${idx}`} style={styles.alertRow}>
                <View style={[styles.alertIconCircle, { backgroundColor: '#fffbe6' }]}>
                  <CameraIcon color="#d97706" size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>Appliance Media Pending: {appliance.name}</Text>
                  <Text style={styles.alertText}>
                    {owner?.name || 'User'} uploaded {appliance.media?.type || 'media'} for {appliance.category} ({appliance.location}).
                  </Text>
                </View>
                <TouchableOpacity style={[styles.alertActionBtn, { backgroundColor: '#059669' }]} onPress={() => handleNav('/admin/users')}>
                  <Text style={styles.alertActionBtnText}>Review Media</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          {(bookings || []).filter((b) => b.status === 'PENDING_ADMIN_REVIEW').map((b, idx) => (
            <View key={idx} style={styles.alertRow}>
              <View style={[styles.alertIconCircle, { backgroundColor: '#eff6ff' }]}>
                <ClockIcon color="#2563eb" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>New Booking Request: {b.booking_id}</Text>
                <Text style={styles.alertText}>Awaiting admin review and partner assignment for {b.service_name}.</Text>
              </View>
              <TouchableOpacity style={[styles.alertActionBtn, { backgroundColor: '#2563eb' }]} onPress={() => handleNav('/admin/bookings')}>
                <Text style={styles.alertActionBtnText}>Assign Partner</Text>
              </TouchableOpacity>
            </View>
          ))}

          {reportedBookings.length === 0 &&
            pendingApplianceUploads.length === 0 &&
            (bookings || []).filter((b) => b.status === 'PENDING_ADMIN_REVIEW').length === 0 && (
              <View style={styles.allClearBox}>
                <CheckCircleIcon color="#059669" size={20} />
                <Text style={styles.allClearText}>All operations running smoothly. No pending actions.</Text>
              </View>
            )}
        </View>
      </View>

      {/* Category Performance Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Category Performance & Revenue Share</Text>
        {getCategoryStats().map((item, idx) => (
          <View key={idx} style={styles.catRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.catName}>{item.cat}</Text>
              <Text style={styles.catSub}>{item.jobs}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.catTotal}>{item.total}</Text>
              <Text style={styles.catPct}>{item.pct}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24, gap: 24 },
  header: { gap: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  statCard: {
    flex: 1,
    minWidth: 220,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  statHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statVal: { fontSize: 26, fontWeight: '800' },

  actionCenterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    gap: 16,
  },
  actionCenterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionCenterTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  actionCenterSub: { fontSize: 12, color: '#64748b', marginTop: 1 },
  alertList: { gap: 10 },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  alertIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: { fontSize: 13.5, fontWeight: '700', color: '#0f172a' },
  alertText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  alertBold: { fontWeight: '700', color: '#0f172a' },
  alertActionBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  alertActionBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 11 },
  allClearBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    justifyContent: 'center',
  },
  allClearText: { color: '#15803d', fontWeight: '700', fontSize: 13 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    gap: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  catName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  catSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  catTotal: { fontSize: 14, fontWeight: '700', color: '#059669' },
  catPct: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
});
