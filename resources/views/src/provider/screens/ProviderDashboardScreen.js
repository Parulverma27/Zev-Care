import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, TextInput, Platform } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import ImageUploadField from '../../admin/components/ImageUploadField';
import ProviderIcon from '../ProviderIcons';

export default function ProviderDashboardScreen({ onNavigate }) {
  const { activeProvider, setActiveProvider, updateProviderProfile, bookings, submitInspectionReport } = useApp();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(activeProvider?.is_online ?? true);
  const [inspectModal, setInspectModal] = useState(false);

  // Inspection Form State
  const [findings, setFindings] = useState('Armature coil burnt due to jar overload. Requires replacement jar coupler.');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&q=80&w=600');

  const statusLabels = {
    PENDING_ADMIN_REVIEW: 'PENDING REVIEW',
    ADMIN_ACCEPTED: 'ACCEPTED BY ADMIN',
    PROVIDER_ASSIGNED: 'PARTNER ASSIGNED',
    PROVIDER_ACCEPTED: 'ACCEPTED BY YOU',
    PROVIDER_ON_THE_WAY: 'EN ROUTE',
    PROVIDER_ARRIVED: 'ARRIVED ON SITE',
    ISSUE_INSPECTED: 'INSPECTED',
    ASSIGNED_TO_ADMIN: 'INSPECTION SENT TO ADMIN',
    AWAITING_USER_APPROVAL: 'AWAITING APPROVAL',
    SERVICE_IN_PROGRESS: 'IN PROGRESS',
    ESTIMATE_REJECTED: 'DECLINED (₹0)',
    BOOKING_COMPLETED: 'COMPLETED & SETTLED',
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'BOOKING_COMPLETED':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'PROVIDER_ON_THE_WAY':
      case 'PROVIDER_ARRIVED':
      case 'SERVICE_IN_PROGRESS':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      case 'ESTIMATE_REJECTED':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
    }
  };

  const cleanPhone = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');
  const provIdStr = activeProvider?.id != null ? String(activeProvider.id) : '';
  const provPhone = cleanPhone(activeProvider?.phone);
  const provName = (activeProvider?.name || '').trim().toLowerCase();

  const myJobs = (bookings || []).filter((b) => {
    if (!activeProvider) return false;
    if (provIdStr && b.provider_id != null && String(b.provider_id) === provIdStr) return true;
    if (provPhone && b.provider_phone && cleanPhone(b.provider_phone) === provPhone) return true;
    if (provName && b.provider_name && b.provider_name.trim().toLowerCase() === provName) return true;
    return false;
  });

  const activeJob = myJobs.find((b) => b.status !== 'BOOKING_COMPLETED') || null;
  const completedCount = myJobs.filter((b) => b.status === 'BOOKING_COMPLETED').length;
  const pendingCount = myJobs.filter((b) => b.status !== 'BOOKING_COMPLETED').length;

  const handleNav = (path, paramObj) => {
    if (navigate) navigate(path);
    else if (onNavigate) onNavigate(path, paramObj);
  };

  const handleToggleOnline = (val) => {
    setIsOnline(val);
    if (updateProviderProfile && activeProvider) {
      updateProviderProfile({ ...activeProvider, is_online: val });
    } else if (setActiveProvider && activeProvider) {
      setActiveProvider((prev) => ({ ...prev, is_online: val }));
    }
  };

  const handleInspectionSubmit = () => {
    if (activeJob && submitInspectionReport) {
      submitInspectionReport(activeJob.booking_id, {
        findings,
        mediaUrl,
      });
    }
    setInspectModal(false);
  };

  const callCustomer = (phone) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(`tel:${phone}`);
    }
  };

  const navigateToAddress = (address) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const query = encodeURIComponent(address || 'Mumbai');
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 1. Partner Profile & Quick Status Card */}
      <View style={styles.partnerCard}>
        <View style={styles.partnerHeaderRow}>
          <View style={styles.partnerAvatarCircle}>
            <Text style={styles.partnerAvatarText}>
              {activeProvider?.name ? activeProvider.name.charAt(0).toUpperCase() : 'P'}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.partnerNameRow}>
              <Text style={styles.partnerName} numberOfLines={1}>{activeProvider?.name || 'Technician'}</Text>
              <View style={[styles.verifiedBadge, { flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.partnerSpec}>{activeProvider?.trade || 'Field Specialist'}</Text>
            <View style={styles.ratingRow}>
              <ProviderIcon name="star" color="#f59e0b" size={13} />
              <Text style={styles.ratingText}>
                {activeProvider?.rating ?? '4.9'} • {activeProvider?.total_jobs ?? myJobs.length} Jobs Completed
              </Text>
            </View>
          </View>

          <View style={styles.onlineSwitchBox}>
            <View style={[styles.onlineStatusChip, isOnline ? styles.onlineChipActive : styles.onlineChipInactive]}>
              <View style={[styles.pulseDot, isOnline ? styles.pulseDotActive : styles.pulseDotInactive]} />
              <Text style={[styles.onlineText, isOnline ? styles.onlineTextActive : styles.onlineTextInactive]}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: '#cbd5e1', true: '#2563eb' }}
              thumbColor={Platform.OS === 'android' ? (isOnline ? '#1d4ed8' : '#f1f5f9') : undefined}
            />
          </View>
        </View>

        {/* Metric Badges Row */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricTile, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
            <Text style={[styles.metricLabel, { color: '#166534' }]}>Completed Today</Text>
            <Text style={[styles.metricValue, { color: '#15803d' }]}>{completedCount}</Text>
          </View>
          <View style={[styles.metricTile, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <Text style={[styles.metricLabel, { color: '#1e40af' }]}>Active / In Queue</Text>
            <Text style={[styles.metricValue, { color: '#2563eb' }]}>{pendingCount}</Text>
          </View>
          <TouchableOpacity
            style={[styles.metricTile, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}
            onPress={() => handleNav('/provider/earnings')}
            activeOpacity={0.8}
          >
            <Text style={styles.metricLabel}>View Payouts</Text>
            <Text style={[styles.metricValue, { fontSize: 15, color: '#0f172a' }]}>80% Share →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Hero Active Work Order Card */}
      {activeJob ? (
        <View style={styles.activeJobHeroCard}>
          <View style={styles.heroTopBar}>
            <View style={styles.heroStatusChip}>
              <View style={styles.heroStatusDot} />
              <Text style={styles.heroStatusText}>
                {statusLabels[activeJob.status] || activeJob.status}
              </Text>
            </View>
            <Text style={styles.heroBookingId}>#{activeJob.booking_id}</Text>
          </View>

          <Text style={styles.heroServiceTitle}>{activeJob.service_name}</Text>

          {Boolean(activeJob.isConsultation || activeJob.booking_mode === 'consultation') && (
            <View style={[styles.consultationPill, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#047857" stroke="#047857" strokeWidth="1">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <Text style={styles.consultationPillText}>Free Diagnosis & Upfront Quote (₹0 Visit)</Text>
            </View>
          )}

          {/* Customer & Address Quick Action Block */}
          <View style={styles.customerBox}>
            <View style={styles.customerRow}>
              <View style={styles.iconSquare}>
                <ProviderIcon name="user" color="#2563eb" size={14} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{activeJob.user_name || 'Customer'}</Text>
                <Text style={styles.customerPhone}>{activeJob.user_phone || 'Phone not available'}</Text>
              </View>
              {activeJob.user_phone ? (
                <TouchableOpacity
                  style={styles.actionCallBtn}
                  onPress={() => callCustomer(activeJob.user_phone)}
                  activeOpacity={0.8}
                >
                  <ProviderIcon name="phone" color="#ffffff" size={12} />
                  <Text style={styles.actionCallBtnText}>Call</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.customerDivider} />

            <View style={styles.customerRow}>
              <View style={[styles.iconSquare, { backgroundColor: '#ecfdf5' }]}>
                <ProviderIcon name="pin" color="#059669" size={14} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressText} numberOfLines={2}>{activeJob.address_text || 'Address not specified'}</Text>
              </View>
              <TouchableOpacity
                style={styles.actionNavBtn}
                onPress={() => navigateToAddress(activeJob.address_text)}
                activeOpacity={0.8}
              >
                <ProviderIcon name="car" color="#047857" size={12} />
                <Text style={styles.actionNavBtnText}>Map</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Big Thumb-Friendly Console Button */}
          <TouchableOpacity
            style={styles.heroWorkflowBtn}
            onPress={() => handleNav(`/provider/bookings/${activeJob.booking_id}`)}
            activeOpacity={0.88}
          >
            <ProviderIcon name="flash" color="#ffffff" size={16} />
            <Text style={styles.heroWorkflowBtnText}>Open Work Order Console</Text>
            <ProviderIcon name="arrowRight" color="#ffffff" size={15} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noActiveJobCard}>
          <View style={styles.noActiveIconWrap}>
            <ProviderIcon name="check" color="#10b981" size={24} />
          </View>
          <Text style={styles.noActiveTitle}>All Caught Up!</Text>
          <Text style={styles.noActiveSubtitle}>
            No active work orders right now. Stay online to receive instant nearby service dispatches.
          </Text>
        </View>
      )}

      {/* 3. Today's Schedule Timeline */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        <View style={styles.jobCountBadge}>
          <Text style={styles.jobCountBadgeText}>{myJobs.length} Orders</Text>
        </View>
      </View>

      {myJobs.length === 0 ? (
        <View style={styles.emptyListCard}>
          <Text style={styles.emptyListText}>No jobs scheduled for today yet.</Text>
        </View>
      ) : (
        myJobs.map((b, idx) => {
          const colors = getStatusColor(b.status);
          const isDone = b.status === 'BOOKING_COMPLETED';
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.timelineCard, isDone && styles.timelineCardDone]}
              onPress={() => handleNav(`/provider/bookings/${b.booking_id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineStatusPill, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                  <Text style={[styles.timelineStatusText, { color: colors.text }]}>
                    {statusLabels[b.status] || b.status}
                  </Text>
                </View>
                <Text style={styles.timelineServiceTitle} numberOfLines={1}>
                  {b.service_name}
                </Text>
                <Text style={styles.timelineCustomerSub}>
                  {b.user_name} • {b.scheduled_date || 'Today'}
                </Text>
              </View>

              <View style={styles.timelineRight}>
                <Text style={styles.timelineId}>#{b.booking_id}</Text>
                <View style={styles.timelineArrowCircle}>
                  <ProviderIcon name="arrowRight" color="#2563eb" size={12} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {/* START SERVICES & FIELD INSPECTION FORM MODAL */}
      <Modal visible={inspectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start Services & Issue Report</Text>
            <Text style={styles.modalSub}>Work Order: {activeJob?.booking_id} • {activeJob?.user_name}</Text>

            <ScrollView style={{ width: '100%', maxHeight: 420 }} contentContainerStyle={{ paddingHorizontal: 2, paddingBottom: 6 }} showsVerticalScrollIndicator={true}>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Explain Technical Findings & Required Work *</Text>
                <TextInput
                  style={[styles.textInput, { height: 60 }]}
                  multiline
                  value={findings}
                  onChangeText={setFindings}
                  placeholder="Explain technical issue in detail..."
                />
              </View>

              <ImageUploadField
                label="Diagnostic Media / Photo Attachment"
                value={mediaUrl}
                onChange={setMediaUrl}
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleInspectionSubmit}>
                <ProviderIcon name="flash" color="#ffffff" size={15} />
                <Text style={styles.primaryBtnText}>Submit & Assign to Admin</Text>
                <ProviderIcon name="arrowRight" color="#ffffff" size={14} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setInspectModal(false)}>
                <Text style={styles.closeModalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', width: '100%' },
  content: { padding: 16, gap: 16, width: '100%', boxSizing: 'border-box', paddingBottom: 36 },

  /* 1. Partner Profile Card */
  partnerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
    width: '100%',
    boxSizing: 'border-box',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' }
      : { elevation: 3 }),
  },
  partnerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  partnerAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  partnerAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  partnerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  verifiedBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  verifiedBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  partnerSpec: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },

  onlineSwitchBox: {
    alignItems: 'flex-end',
    gap: 4,
  },
  onlineStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  onlineChipActive: { backgroundColor: '#ecfdf5' },
  onlineChipInactive: { backgroundColor: '#f1f5f9' },
  pulseDot: { width: 6, height: 6, borderRadius: 3 },
  pulseDotActive: { backgroundColor: '#10b981' },
  pulseDotInactive: { backgroundColor: '#94a3b8' },
  onlineText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 },
  onlineTextActive: { color: '#059669' },
  onlineTextInactive: { color: '#64748b' },

  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  metricTile: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  /* 2. Hero Active Work Order Card */
  activeJobHeroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    gap: 12,
    width: '100%',
    boxSizing: 'border-box',
    ...(Platform.OS === 'web'
      ? {
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.12)',
        }
      : { elevation: 4 }),
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  heroStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563eb',
  },
  heroStatusText: {
    color: '#1d4ed8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroBookingId: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  heroServiceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 22,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  consultationPill: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  consultationPillText: {
    color: '#92400e',
    fontSize: 10.5,
    fontWeight: '800',
  },

  customerBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    gap: 8,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconSquare: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  customerName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 16,
  },
  customerPhone: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  addressText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 15,
  },
  customerDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  actionCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  actionCallBtnText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
  },
  actionNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  actionNavBtnText: {
    color: '#047857',
    fontSize: 10.5,
    fontWeight: '800',
  },

  heroWorkflowBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    width: '100%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)' }
      : { elevation: 3 }),
  },
  heroWorkflowBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13.5,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  noActiveJobCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)' } : {}),
  },
  noActiveIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  noActiveTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  noActiveSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },

  /* 3. Today's Schedule Section */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  jobCountBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  jobCountBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  emptyListCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyListText: {
    fontSize: 12,
    color: '#64748b',
  },

  timelineCard: {
    backgroundColor: '#ffffff',
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    boxSizing: 'border-box',
    gap: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)' }
      : { elevation: 1 }),
  },
  timelineCardDone: {
    opacity: 0.75,
  },
  timelineLeft: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  timelineStatusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 2,
  },
  timelineStatusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  timelineServiceTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  timelineCustomerSub: {
    fontSize: 11,
    color: '#64748b',
  },
  timelineRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  timelineId: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  timelineArrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Inspection Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    width: '100%',
    boxSizing: 'border-box',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    width: '94%',
    maxWidth: 400,
    maxHeight: '90%',
    gap: 8,
    boxSizing: 'border-box',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)' } : {}),
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', lineHeight: 22 },
  modalSub: { fontSize: 11.5, color: '#64748b', lineHeight: 16, marginBottom: 8 },

  fieldGroup: { marginBottom: 10 },
  inputLabel: { fontSize: 11.5, fontWeight: '700', color: '#334155', marginTop: 4, marginBottom: 6 },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    fontSize: 12.5,
    color: '#0f172a',
    width: '100%',
    boxSizing: 'border-box',
    lineHeight: 16,
  },

  primaryBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  closeModalBtn: { paddingVertical: 10, alignItems: 'center', width: '100%' },
  closeModalBtnText: { color: '#64748b', fontWeight: '700', fontSize: 12 },
});
