import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, TextInput } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import ImageUploadField from '../../admin/components/ImageUploadField';
import ProviderIcon from '../ProviderIcons';

export default function ProviderDashboardScreen({ onNavigate }) {
  const { activeProvider, setActiveProvider, bookings, submitInspectionReport } = useApp();
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
    BOOKING_COMPLETED: 'COMPLETED & SETTLED',
  };

  const myJobs = (bookings || []).filter((b) => {
    if (!activeProvider) return false;
    if (b.provider_id != null && b.provider_id === activeProvider.id) return true;
    if (b.provider_name && b.provider_name === activeProvider.name) return true;
    return false;
  });
  const activeJob = myJobs.find((b) => b.status !== 'BOOKING_COMPLETED') || myJobs[0];
  const pendingCount = myJobs.filter((b) => b.status !== 'BOOKING_COMPLETED').length;



  const handleNav = (path, paramObj) => {
    if (navigate) navigate(path);
    else if (onNavigate) onNavigate(path, paramObj);
  };

  const handleToggleOnline = (val) => {
    setIsOnline(val);
    if (setActiveProvider && activeProvider) {
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Partner Header Stats */}
      <View style={styles.partnerCard}>
        <View style={styles.pHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pName}>{activeProvider?.name || '—'}</Text>
            <Text style={styles.pSpec}>{activeProvider?.trade || '—'}</Text>
            <View style={styles.ratingRow}>
              <ProviderIcon name="star" color="#f59e0b" size={13} />
              <Text style={styles.pRating}>{activeProvider?.rating ?? '—'} Rating ({activeProvider?.total_jobs ?? 0} Jobs Completed)</Text>
            </View>
          </View>

          <View style={styles.toggleBox}>
            <Text style={[styles.toggleLabel, { color: isOnline ? '#2563eb' : '#64748b' }]}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
            <Switch value={isOnline} onValueChange={handleToggleOnline} trackColor={{ false: '#cbd5e1', true: '#2563eb' }} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Completed Today</Text>
            <Text style={styles.statVal}>{myJobs.filter((b) => b.status === 'BOOKING_COMPLETED').length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Active / Pending Jobs</Text>
            <Text style={styles.statVal}>{pendingCount}</Text>
          </View>
        </View>
      </View>

      {/* Active Work Order Action Card */}
      {activeJob && (
        <View style={styles.activeJobCard}>
          <View style={styles.ajHeader}>
            <View style={styles.ajPill}>
              <Text style={styles.ajPillText}>ACTIVE WORK ORDER</Text>
            </View>
            <Text style={styles.ajId}>{activeJob.booking_id}</Text>
          </View>

          <Text style={styles.ajService}>{activeJob.service_name}</Text>
          <View style={styles.iconInfoRow}>
            <ProviderIcon name="user" color="#64748b" size={13} />
            <Text style={styles.ajCustomer}>Customer: {activeJob.user_name} ({activeJob.user_phone})</Text>
          </View>
          <View style={styles.iconInfoRow}>
            <ProviderIcon name="pin" color="#2563eb" size={13} />
            <Text style={styles.ajAddr}>{activeJob.address_text}</Text>
          </View>
          <Text style={styles.ajStatus}>Current State: <Text style={styles.blueBold}>{statusLabels[activeJob.status] || activeJob.status}</Text></Text>

          <TouchableOpacity
            style={styles.workflowBtn}
            onPress={() => handleNav(`/provider/bookings/${activeJob.booking_id}`)}
            activeOpacity={0.85}
          >
            <ProviderIcon name="flash" color="#ffffff" size={15} />
            <Text style={styles.workflowBtnText}>Open Work Order Console</Text>
            <ProviderIcon name="arrowRight" color="#ffffff" size={14} />
          </TouchableOpacity>
        </View>
      )}

      {/* Today's Schedule List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Work Orders Schedule</Text>
      </View>

      {myJobs.map((b, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.jobRow}
          onPress={() => handleNav(`/provider/bookings/${b.booking_id}`)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.jobService}>{b.service_name} ({b.booking_id})</Text>
            <Text style={styles.jobSub}>{b.user_name} • {b.scheduled_date}</Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{statusLabels[b.status] || b.status}</Text>
          </View>
        </TouchableOpacity>
      ))}

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
  container: { flex: 1, backgroundColor: '#eff6ff', width: '100%' },
  content: { padding: 14, gap: 14, width: '100%', boxSizing: 'border-box' },

  partnerCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#bfdbfe', gap: 12, width: '100%', boxSizing: 'border-box', shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  pHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pName: { fontSize: 18, fontWeight: '800', color: '#0f172a', lineHeight: 22 },
  pSpec: { fontSize: 11, color: '#64748b', marginTop: 2, lineHeight: 15 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  pRating: { fontSize: 11, color: '#2563eb', fontWeight: '700', lineHeight: 15 },

  toggleBox: { alignItems: 'flex-end', gap: 2 },
  toggleLabel: { fontSize: 9, fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  statBox: { flex: 1, backgroundColor: '#eff6ff', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe' },
  statLabel: { fontSize: 10, color: '#1e3a8a', fontWeight: '700' },
  statVal: { fontSize: 20, fontWeight: '800', color: '#1d4ed8', marginTop: 2 },

  activeJobCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 14, borderWidth: 2, borderColor: '#2563eb', gap: 6, width: '100%', boxSizing: 'border-box', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  ajHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ajPill: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  ajPillText: { color: '#1d4ed8', fontSize: 9, fontWeight: '800' },
  ajId: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  ajService: { fontSize: 16, fontWeight: '800', color: '#0f172a', lineHeight: 20 },
  iconInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ajCustomer: { fontSize: 12, fontWeight: '600', color: '#334155', lineHeight: 16 },
  ajAddr: { fontSize: 11, color: '#475569', lineHeight: 15, flex: 1 },
  ajStatus: { fontSize: 11, color: '#64748b', lineHeight: 15, marginTop: 2 },
  blueBold: { color: '#2563eb', fontWeight: '800' },

  workflowBtn: { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, marginTop: 4, width: '100%', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  workflowBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },

  sectionHeader: { marginTop: 4, width: '100%' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },

  jobRow: { backgroundColor: '#ffffff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' },
  jobService: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  jobSub: { fontSize: 10, color: '#64748b', marginTop: 1 },
  statusBadge: { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { color: '#1d4ed8', fontWeight: '700', fontSize: 9 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'center', alignItems: 'center', padding: 12, width: '100%', boxSizing: 'border-box' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 18, padding: 18, width: '92%', maxWidth: 380, maxHeight: '90%', gap: 6, boxSizing: 'border-box', overflow: 'hidden' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', lineHeight: 22 },
  modalSub: { fontSize: 11, color: '#64748b', lineHeight: 15, marginBottom: 8 },

  fieldGroup: { marginBottom: 8 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#334155', marginTop: 4, marginBottom: 4, lineHeight: 15 },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 12, color: '#0f172a', width: '100%', boxSizing: 'border-box', lineHeight: 16 },

  previewBox: { height: 75, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#bfdbfe', width: '100%', marginTop: 6 },
  previewImg: { width: '100%', height: '100%' },

  rowTwo: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 6 },

  primaryBtn: { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 8, marginTop: 8, width: '100%' },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },

  closeModalBtn: { paddingVertical: 8, alignItems: 'center', width: '100%' },
  closeModalBtnText: { color: '#64748b', fontWeight: '600', fontSize: 11 },
});
