import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import UserProfileModal from '../components/UserProfileModal';
import { exportToCSV } from '../../utils/exportUtils';
import { getPlanTheme } from '../../config/planTheme';

export default function AdminUsersScreen() {
  const { users } = useApp();
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);

  const activeUsers = users;

  const handleOpenUserModal = (u) => {
    setSelectedUser(u);
    setUserModalVisible(true);
  };

  const handleExportUsers = () => {
    const columns = [
      { label: 'User ID', accessor: (u) => u.id },
      { label: 'Customer Name', accessor: (u) => u.name },
      { label: 'Phone Number', accessor: (u) => u.phone },
      { label: 'Email Address', accessor: (u) => u.email },
      { label: 'Subscription Plan', accessor: (u) => u.subscription_plan || 'Free' },
      { label: 'Wallet Balance (INR)', accessor: (u) => u.wallet_balance || 0 },
      { label: 'Status', accessor: (u) => u.subscription_status || (u.subscription_plan ? 'ACTIVE' : 'INACTIVE') },
    ];
    exportToCSV('Zevota_Users_Report', columns, activeUsers);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={styles.header}>
          <Text style={styles.title}>Customers & Users</Text>
          <Text style={styles.subtitle}>Review registered customer profiles, subscriptions, appliances, and wallet credits.</Text>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExportUsers} activeOpacity={0.85}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <Text style={styles.exportBtnText}>Export Users (Excel/CSV)</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Users Table */}
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.8 }]}>Customer Details</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Phone</Text>
          <Text style={[styles.th, { flex: 1.0 }]}>Plan Tier</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Wallet Credit</Text>
          <Text style={[styles.th, { flex: 1.0 }]}>Status</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Action</Text>
        </View>

        {activeUsers.map((u, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.tableRow}
            onPress={() => handleOpenUserModal(u)}
            activeOpacity={0.8}
          >
            <View style={{ flex: 1.8 }}>
              <Text style={styles.tdBold}>{u.name}</Text>
              <Text style={styles.tdSub}>{u.email}</Text>
            </View>
            <Text style={[styles.td, { flex: 1.2 }]}>{u.phone}</Text>
            <View style={{ flex: 1.0, justifyContent: 'center' }}>
              {(() => {
                const planName = u.subscription_plan;
                if (!planName || String(planName).trim().toLowerCase() === 'free') {
                  return (
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>Free</Text>
                    </View>
                  );
                }
                const pTheme = getPlanTheme(planName);
                return (
                  <View style={[styles.planTierBadge, { backgroundColor: pTheme.badgeBg, borderColor: pTheme.badgeBorder }]}>
                    {pTheme.icon}
                    <Text style={[styles.planTierBadgeText, { color: pTheme.badgeTextColor }]}>
                      {planName}
                    </Text>
                  </View>
                );
              })()}
            </View>
            <Text style={[styles.td, { flex: 1.2, color: '#059669', fontWeight: '800' }]}>₹{Number(u.wallet_balance || 0).toLocaleString('en-IN')}</Text>

            <View style={{ flex: 1.0 }}>
              <View style={[styles.statusPill, (u.subscription_status === 'ACTIVE' || u.subscription_plan) ? styles.greenPill : styles.yellowPill]}>
                <Text style={[styles.statusPillText, (u.subscription_status === 'ACTIVE' || u.subscription_plan) ? styles.greenPillText : styles.yellowPillText]}>
                  {u.subscription_status || (u.subscription_plan ? 'ACTIVE' : 'INACTIVE')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.reviewVideoBtn}
              onPress={() => handleOpenUserModal(u)}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <Text style={styles.reviewVideoBtnText}>Review Profile</Text>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      <UserProfileModal
        visible={userModalVisible}
        user={selectedUser}
        onClose={() => { setUserModalVisible(false); setSelectedUser(null); }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24, gap: 20 },
  header: { gap: 6 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  subtitle: { fontSize: 13.5, color: '#64748b', lineHeight: 20 },

  tableCard: { backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(15,23,42,0.02)' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0f172a', padding: 16 },
  th: { color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  tdBold: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  tdSub: { fontSize: 11.5, color: '#64748b', marginTop: 1 },
  td: { fontSize: 13.5, color: '#334155', fontWeight: '500' },

  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start' },
  greenPill: { backgroundColor: '#ecfdf5' },
  yellowPill: { backgroundColor: '#fef3c7' },
  statusPillText: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  greenPillText: { color: '#047857' },
  yellowPillText: { color: '#b45309' },

  reviewVideoBtn: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, boxShadow: '0 2px 6px rgba(37,99,235,0.15)' },
  reviewVideoBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 11.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 28, padding: 28, width: '100%', maxWidth: 560, gap: 18, boxShadow: '0 12px 36px rgba(0,0,0,0.15)' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  modalSub: { fontSize: 14, color: '#64748b', fontWeight: '400' },

  modalHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalCloseX: { padding: 6, borderRadius: 8, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },

  userIdentityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatarText: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  userIdentityName: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  userIdentitySub: { fontSize: 12, color: '#64748b', fontWeight: '500' },

  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  verifiedBadge: { backgroundColor: '#ecfdf5' },
  pendingBadge: { backgroundColor: '#fef3c7' },
  verificationBadgeText: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },

  planWalletRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  planWalletBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  planWalletDivider: { width: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  planWalletIconBox: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  planWalletLabel: { fontSize: 10, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.3 },
  planWalletValue: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginTop: 1 },

  addrIconBox: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  emptyInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyInfoText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },

  sectionDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.5 },

  addressListScroll: { maxHeight: 110, gap: 8 },
  addrRow: { flexDirection: 'row', gap: 10, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#ffffff', marginBottom: 6 },
  addrRowDefault: { borderColor: '#bfdbfe', backgroundColor: '#f5f9ff' },
  addrEmoji: { fontSize: 16, marginTop: 1 },
  addrTag: { fontSize: 12, fontWeight: '850', color: '#334155', textTransform: 'uppercase' },
  defaultBadge: { backgroundColor: '#2563eb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  defaultBadgeText: { color: '#ffffff', fontSize: 8.5, fontWeight: '800', textTransform: 'uppercase' },
  addrText: { fontSize: 11.5, color: '#475569', marginTop: 2, lineHeight: 16, fontWeight: '500' },
  noAddrText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },

  videoPlayerBox: { height: 260, borderRadius: 16, overflow: 'hidden', position: 'relative', backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#e2e8f0' },
  thumbnail: { width: '100%', height: '100%', opacity: 0.65 },
  playOverlay: { position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center', gap: 12 },
  playCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  playIcon: { color: '#ffffff', fontSize: 20, marginLeft: 2 },
  videoLabel: { color: '#ffffff', fontSize: 14, fontWeight: '600', fontFamily: 'Inter, sans-serif' },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  approveBtn: { flex: 1, backgroundColor: '#059669', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(5,150,105,0.2)' },
  approveBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 13.5, fontFamily: 'Inter, sans-serif' },
  rejectBtn: { flex: 1, backgroundColor: '#dc2626', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(220,38,38,0.2)' },
  rejectBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 13.5, fontFamily: 'Inter, sans-serif' },

  closeModalBtn: { paddingVertical: 8, alignItems: 'center' },
  closeModalBtnText: { color: '#475569', fontWeight: '600', fontSize: 14, fontFamily: 'Inter, sans-serif' },

  modalScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  applianceReviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 10,
    marginBottom: 10,
  },
  applianceReviewHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  applianceReviewName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  applianceReviewMeta: { fontSize: 11.5, color: '#64748b', marginTop: 2 },
  applianceMediaPreview: { gap: 6 },
  applianceMediaThumb: { width: '100%', height: 120, borderRadius: 10, backgroundColor: '#0f172a' },
  mediaTapHint: { fontSize: 10.5, color: '#64748b', fontWeight: '500' },
  noMediaText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
  applianceReviewActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  fullMediaPreview: { width: '100%', height: 320, borderRadius: 12, backgroundColor: '#f1f5f9' },

  exportBtn: { backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, boxShadow: '0 2px 8px rgba(5,150,105,0.2)' },
  exportBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

  planTierBadge: {
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  planTierBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  freeBadge: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
    alignSelf: 'flex-start',
  },
  freeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
});
