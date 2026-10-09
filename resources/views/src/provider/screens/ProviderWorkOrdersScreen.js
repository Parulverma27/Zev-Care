import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import ProviderIcon from '../ProviderIcons';

export default function ProviderWorkOrdersScreen() {
  const { activeProvider, bookings } = useApp();
  const navigate = useNavigate();

  // Filter tab state: 'ALL' | 'ACTIVE' | 'COMPLETED'
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const statusLabels = {
    PENDING_ADMIN_REVIEW: 'PENDING REVIEW',
    ADMIN_ACCEPTED: 'ACCEPTED BY ADMIN',
    PROVIDER_ASSIGNED: 'PARTNER ASSIGNED',
    PROVIDER_ACCEPTED: 'ACCEPTED BY YOU',
    PROVIDER_ON_THE_WAY: 'EN ROUTE TO PREMISES',
    PROVIDER_ARRIVED: 'ARRIVED ON SITE',
    ISSUE_INSPECTED: 'INSPECTED',
    ASSIGNED_TO_ADMIN: 'INSPECTION SENT TO ADMIN',
    AWAITING_USER_APPROVAL: 'AWAITING APPROVAL',
    SERVICE_IN_PROGRESS: 'IN PROGRESS',
    ESTIMATE_REJECTED: 'DECLINED (₹0)',
    BOOKING_COMPLETED: 'COMPLETED & SETTLED',
  };

  // Filter bookings for current active provider only
  const providerBookings = bookings.filter((b) => {
    if (!activeProvider) return false;
    if (b.provider_id != null && b.provider_id === activeProvider.id) return true;
    if (b.provider_name && b.provider_name === activeProvider.name) return true;
    return false;
  });

  const activeJobs = providerBookings.filter((b) => b.status !== 'BOOKING_COMPLETED');
  const completedJobs = providerBookings.filter((b) => b.status === 'BOOKING_COMPLETED');

  const filteredList = providerBookings.filter((b) => {
    // Filter by tab
    if (filter === 'ACTIVE' && b.status === 'BOOKING_COMPLETED') return false;
    if (filter === 'COMPLETED' && b.status !== 'BOOKING_COMPLETED') return false;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = b.booking_id?.toLowerCase().includes(q);
      const matchSvc = b.service_name?.toLowerCase().includes(q);
      const matchCust = b.user_name?.toLowerCase().includes(q);
      return matchId || matchSvc || matchCust;
    }
    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Work Orders & Job History</Text>
          <ProviderIcon name="briefcase" color="#2563eb" size={20} />
        </View>
        <Text style={styles.subtitle}>
          View all assigned dispatches, active service calls & historical completed job reports.
        </Text>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchRow}>
        <ProviderIcon name="wrench" color="#64748b" size={15} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ID, customer name, or service..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearchText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'ALL' && styles.filterChipActive]}
          onPress={() => setFilter('ALL')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterChipText, filter === 'ALL' && styles.filterChipTextActive]}>
            All Orders ({providerBookings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'ACTIVE' && styles.filterChipActive]}
          onPress={() => setFilter('ACTIVE')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterChipText, filter === 'ACTIVE' && styles.filterChipTextActive]}>
            Active ({activeJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'COMPLETED' && styles.filterChipActive]}
          onPress={() => setFilter('COMPLETED')}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterChipText, filter === 'COMPLETED' && styles.filterChipTextActive]}>
            Completed History ({completedJobs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Work Orders List */}
      {filteredList.length === 0 ? (
        <View style={styles.emptyCard}>
          <ProviderIcon name="clock" color="#94a3b8" size={32} />
          <Text style={styles.emptyTitle}>No Work Orders Found</Text>
          <Text style={styles.emptySub}>There are no work orders matching your current filter criteria.</Text>
        </View>
      ) : (
        filteredList.map((job) => {
          const isCompleted = job.status === 'BOOKING_COMPLETED';

          return (
            <View key={job.booking_id} style={[styles.jobCard, isCompleted ? styles.completedCard : styles.activeCard]}>
              {/* Card Top Header */}
              <View style={styles.jobHeader}>
                <View style={[styles.statusBadge, isCompleted ? styles.completedBadge : styles.activeBadge]}>
                  <ProviderIcon name={isCompleted ? 'checkCircle' : 'flash'} color={isCompleted ? '#1d4ed8' : '#2563eb'} size={12} />
                  <Text style={[styles.statusText, isCompleted ? styles.completedStatusText : styles.activeStatusText]}>
                    {statusLabels[job.status] || job.status}
                  </Text>
                </View>
                <Text style={styles.jobId}>{job.booking_id}</Text>
              </View>

              {/* Service & Category */}
              <Text style={styles.serviceName}>{job.service_name}</Text>
              <Text style={styles.categoryTag}>{job.category_name} • {job.sub_category_name || 'General'}</Text>

              {Boolean(job.isConsultation || job.booking_mode === 'consultation') && (
                <View style={styles.consultationBadge}>
                  <Text style={styles.consultationBadgeText}>⚡ ₹0 Free Diagnosis & Upfront Quote</Text>
                </View>
              )}

              {/* Customer & Address Details */}
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <ProviderIcon name="user" color="#64748b" size={13} />
                  <Text style={styles.infoText}>Customer: <Text style={styles.boldText}>{job.user_name}</Text> ({job.user_phone})</Text>
                </View>

                <View style={styles.infoRow}>
                  <ProviderIcon name="pin" color="#2563eb" size={13} />
                  <Text style={styles.infoText}>{job.address_text}</Text>
                </View>

                <View style={styles.infoRow}>
                  <ProviderIcon name="clock" color="#64748b" size={13} />
                  <Text style={styles.infoText}>
                    {isCompleted ? `Completed: ${job.completed_date || job.scheduled_date}` : `Scheduled: ${job.scheduled_date}`}
                  </Text>
                </View>
              </View>

              {/* Technical Inspection Report Snippet (if available) */}
              {job.inspection_report ? (
                <View style={styles.reportBox}>
                  <Text style={styles.reportTitle}>Technical Report:</Text>
                  <Text style={styles.reportText}>{job.inspection_report}</Text>
                </View>
              ) : null}



              {/* Console Navigation Action */}
              <TouchableOpacity
                style={styles.consoleBtn}
                onPress={() => navigate(`/provider/bookings/${job.booking_id}`)}
                activeOpacity={0.85}
              >
                <Text style={styles.consoleBtnText}>Open Work Order Console</Text>
                <ProviderIcon name="arrowRight" color="#ffffff" size={14} />
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eff6ff', width: '100%' },
  content: { padding: 14, gap: 14, width: '100%', boxSizing: 'border-box' },

  header: { gap: 4, width: '100%' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 11.5, color: '#64748b', lineHeight: 16 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    width: '100%',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 12, color: '#0f172a', padding: 0 },
  clearSearchText: { fontSize: 11, color: '#2563eb', fontWeight: '700' },

  filterBar: { flexDirection: 'row', gap: 6, width: '100%', flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    cursor: 'pointer',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: { fontSize: 11, color: '#64748b', fontWeight: '700' },
  filterChipTextActive: { color: '#ffffff', fontWeight: '800' },

  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 12,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center' },

  jobCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    width: '100%',
    boxSizing: 'border-box',
    borderWidth: 1,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  activeCard: { borderColor: '#2563eb', borderLeftWidth: 4, borderLeftColor: '#2563eb' },
  completedCard: { borderColor: '#bfdbfe' },

  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 },
  activeBadge: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  completedBadge: { backgroundColor: '#dbeafe', borderWidth: 1, borderColor: '#93c5fd' },
  statusText: { fontSize: 9.5, fontWeight: '800' },
  activeStatusText: { color: '#2563eb' },
  completedStatusText: { color: '#1d4ed8' },
  jobId: { fontSize: 11, fontWeight: '800', color: '#64748b' },

  serviceName: { fontSize: 16, fontWeight: '900', color: '#0f172a', lineHeight: 20 },
  categoryTag: { fontSize: 11, color: '#2563eb', fontWeight: '700', marginTop: -4 },

  infoSection: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, gap: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 11.5, color: '#334155', flex: 1, lineHeight: 16 },
  boldText: { fontWeight: '800', color: '#0f172a' },

  reportBox: { backgroundColor: '#eff6ff', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe', gap: 2 },
  reportTitle: { fontSize: 10, fontWeight: '800', color: '#1d4ed8', textTransform: 'uppercase' },
  reportText: { fontSize: 11, color: '#1e3a8a', lineHeight: 15 },

  billSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 },
  billLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  billVal: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginTop: 1 },
  payoutLabel: { fontSize: 10, color: '#1d4ed8', fontWeight: '700' },
  payoutVal: { fontSize: 15, fontWeight: '900', color: '#1d4ed8', marginTop: 1 },

  consoleBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 2,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  consoleBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  consultationBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  consultationBadgeText: {
    color: '#1d4ed8',
    fontSize: 10.5,
    fontWeight: '800',
  },
});
