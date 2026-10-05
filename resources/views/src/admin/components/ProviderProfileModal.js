import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';

export default function ProviderProfileModal({ visible, provider, onClose, onEdit }) {
  if (!provider) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.modalContent}>

            {/* Modal Header Bar */}
            <View style={styles.modalHeaderBar}>
              <Text style={styles.modalTitle}>Field Partner Profile</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.modalCloseX}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </TouchableOpacity>
            </View>

            {/* ── PROVIDER IDENTITY CARD ── */}
            <View style={styles.providerCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(provider?.name || 'P').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.providerName}>{provider?.name || '—'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.91 6.91l.82-.82a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <Text style={styles.providerSub}>{provider?.phone || '—'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  <Text style={styles.providerSub}>{provider?.location || 'Bandra West, Mumbai'}</Text>
                </View>
              </View>
              {/* Status Badge */}
              <View style={[styles.statusPill, provider?.is_online !== false ? styles.onlinePill : styles.offlinePill]}>
                <Text style={[styles.statusPillText, provider?.is_online !== false ? styles.onlineText : styles.offlineText]}>
                  {provider?.is_online !== false ? 'ACTIVE' : 'OFFLINE'}
                </Text>
              </View>
            </View>

            {/* ── METRICS GRID ── */}
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Rating</Text>
                <Text style={[styles.metricValue, { color: '#d97706' }]}>★ {provider?.rating || '5.0'}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Completed Jobs</Text>
                <Text style={[styles.metricValue, { color: '#2563eb' }]}>{provider?.total_jobs || 0} Jobs</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Total Revenue</Text>
                <Text style={[styles.metricValue, { color: '#059669' }]}>₹{(provider?.earnings || 0).toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* ── ACTIONS ── */}
            <View style={styles.actionsRow}>
              {onEdit && (
                <TouchableOpacity style={styles.editBtn} onPress={() => { onClose(); onEdit(provider); }}>
                  <Text style={styles.editBtnText}>Edit Field Partner</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 28, padding: 28, width: '100%', maxWidth: 500, gap: 20, boxShadow: '0 12px 36px rgba(0,0,0,0.15)' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  modalHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalCloseX: { padding: 6, borderRadius: 8, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', cursor: 'pointer' },

  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  providerName: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  providerSub: { fontSize: 12, color: '#64748b', fontWeight: '500' },

  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' },
  onlinePill: { backgroundColor: '#ecfdf5' },
  offlinePill: { backgroundColor: '#f1f5f9' },
  statusPillText: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  onlineText: { color: '#047857' },
  offlineText: { color: '#64748b' },

  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  metricBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 14, gap: 4 },
  metricDivider: { width: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  metricLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.3 },
  metricValue: { fontSize: 15, fontWeight: '800' },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  editBtn: { flex: 1, backgroundColor: '#7c3aed', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  editBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  closeBtn: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  closeBtnText: { color: '#475569', fontWeight: '600', fontSize: 13 },
});
