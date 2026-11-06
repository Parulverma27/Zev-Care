import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useApp } from '../../context/AppContext';
import UserProfileModal from '../components/UserProfileModal';
import { exportToCSV } from '../../utils/exportUtils';

export function AdminFinanceScreen() {
  const { wallet, users, providers } = useApp() || {};
  const [activeTab, setActiveTab] = useState('PAYOUTS'); // 'PAYOUTS' | 'WALLET'
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);

  // Partner Weekly Settlements State
  const [partnerPayouts, setPartnerPayouts] = useState(() => {
    try {
      const saved = localStorage.getItem('zevota_partner_payouts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        payout_id: 'PAY-2026-W44-01',
        provider_id: 1,
        provider_name: 'Rajesh Sharma',
        provider_phone: '+91 99887 76655',
        upi_id: 'rajesh.sharma@okaxis',
        period: '28 Oct – 03 Nov 2026',
        jobs_count: 8,
        total_earnings: 12450,
        status: 'PENDING_APPROVAL',
        utr_ref: '',
        processed_at: null,
      },
      {
        payout_id: 'PAY-2026-W43-02',
        provider_id: 1,
        provider_name: 'Rajesh Sharma',
        provider_phone: '+91 99887 76655',
        upi_id: 'rajesh.sharma@okaxis',
        period: '21 Oct – 27 Oct 2026',
        jobs_count: 12,
        total_earnings: 18900,
        status: 'SETTLED',
        utr_ref: 'HDFC009283719482',
        processed_at: '2026-10-28T10:30:00.000Z',
      },
      {
        payout_id: 'PAY-2026-W44-03',
        provider_id: 2,
        provider_name: 'Suresh Kumar',
        provider_phone: '+91 98989 12345',
        upi_id: 'suresh.plumber@paytm',
        period: '28 Oct – 03 Nov 2026',
        jobs_count: 6,
        total_earnings: 8750,
        status: 'PENDING_APPROVAL',
        utr_ref: '',
        processed_at: null,
      },
    ];
  });

  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [targetPayout, setTargetPayout] = useState(null);
  const [utrInput, setUtrInput] = useState('');
  const [payoutFormError, setPayoutFormError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('zevota_partner_payouts', JSON.stringify(partnerPayouts));
    } catch (e) {}
  }, [partnerPayouts]);

  const handleOpenApproveModal = (payout) => {
    setTargetPayout(payout);
    setUtrInput(payout.utr_ref || `ZEV-UTR-${Date.now().toString().slice(-8)}`);
    setPayoutFormError('');
    setPayoutModalVisible(true);
  };

  const handleConfirmPayout = () => {
    if (!targetPayout) return;
    if (!utrInput.trim()) {
      setPayoutFormError('Please enter Bank Reference / UTR Number.');
      return;
    }

    const updated = partnerPayouts.map((p) =>
      p.payout_id === targetPayout.payout_id
        ? {
            ...p,
            status: 'SETTLED',
            utr_ref: utrInput.trim(),
            processed_at: new Date().toISOString(),
          }
        : p
    );

    setPartnerPayouts(updated);
    setPayoutModalVisible(false);
    setTargetPayout(null);
  };

  const resolveUserObj = (tx) => {
    if (tx.userId || tx.user_id) {
      const u = (users || []).find((usr) => usr.id === (tx.userId || tx.user_id));
      if (u) return u;
    }
    if (tx.user_phone) {
      const clean = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');
      const u = (users || []).find((usr) => clean(usr.phone) === clean(tx.user_phone));
      if (u) return u;
    }
    return {
      id: tx.userId || null,
      name: tx.user_name || tx.userName || '—',
      phone: tx.user_phone || '—',
      email: '',
      subscription_plan: null,
      wallet_balance: tx.balance_after ?? 0,
      property_verification_status: 'PENDING',
    };
  };

  const getUserName = (tx) => {
    if (tx.user_name) return tx.user_name;
    if (tx.userName) return tx.userName;
    const u = resolveUserObj(tx);
    return u?.name || '—';
  };

  const getUserSubtext = (tx) => {
    if (tx.user_phone) return tx.user_phone;
    const u = resolveUserObj(tx);
    return u?.phone || u?.email || 'VIP Member';
  };

  const handleOpenUserModal = (tx) => {
    const u = resolveUserObj(tx);
    setSelectedUser(u);
    setUserModalVisible(true);
  };

  const transactionsList = wallet?.transactions || [];

  const pendingPayoutTotal = partnerPayouts
    .filter((p) => p.status === 'PENDING_APPROVAL')
    .reduce((sum, p) => sum + Number(p.total_earnings || 0), 0);

  const settledPayoutTotal = partnerPayouts
    .filter((p) => p.status === 'SETTLED')
    .reduce((sum, p) => sum + Number(p.total_earnings || 0), 0);

  const handleExportFinance = () => {
    if (activeTab === 'PAYOUTS') {
      const columns = [
        { label: 'Payout ID', accessor: (p) => p.payout_id },
        { label: 'Partner Name', accessor: (p) => p.provider_name },
        { label: 'Partner Phone', accessor: (p) => p.provider_phone },
        { label: 'UPI / Bank ID', accessor: (p) => p.upi_id },
        { label: 'Cycle Period', accessor: (p) => p.period },
        { label: 'Jobs Done', accessor: (p) => p.jobs_count },
        { label: 'Payout Amount (INR)', accessor: (p) => p.total_earnings },
        { label: 'Status', accessor: (p) => p.status },
        { label: 'UTR Reference', accessor: (p) => p.utr_ref || 'N/A' },
      ];
      exportToCSV('Zevota_Partner_Payouts_Report', columns, partnerPayouts);
      return;
    }

    const columns = [
      { label: 'Transaction ID', accessor: (tx) => tx.transaction_id },
      { label: 'User Name', accessor: (tx) => getUserName(tx) },
      { label: 'User Phone', accessor: (tx) => getUserSubtext(tx) },
      { label: 'Transaction Type', accessor: (tx) => tx.type },
      { label: 'Description', accessor: (tx) => tx.description },
      { label: 'Amount (INR)', accessor: (tx) => tx.amount || 0 },
      { label: 'Wallet Balance After (INR)', accessor: (tx) => tx.balance_after || 0 },
      { label: 'Timestamp', accessor: (tx) => tx.created_at || 'N/A' },
    ];
    exportToCSV('Zevota_Financial_Transactions_Report', columns, transactionsList);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Finance, Settlements & Wallet Audit</Text>
          <Text style={styles.subtitle}>Manage technician payout settlements, audit wallet credits and inspection revenue.</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Active Tab Switcher */}
          <View style={{ flexDirection: 'row', backgroundColor: '#e2e8f0', padding: 3, borderRadius: 8 }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: activeTab === 'PAYOUTS' ? '#ffffff' : 'transparent',
              }}
              onPress={() => setActiveTab('PAYOUTS')}
              activeOpacity={0.8}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'PAYOUTS' ? '#0f172a' : '#64748b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: activeTab === 'PAYOUTS' ? '#0f172a' : '#64748b' }}>
                Partner Settlements
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: activeTab === 'WALLET' ? '#ffffff' : 'transparent',
              }}
              onPress={() => setActiveTab('WALLET')}
              activeOpacity={0.8}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'WALLET' ? '#2563eb' : '#64748b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: activeTab === 'WALLET' ? '#2563eb' : '#64748b' }}>
                Customer Wallet Logs
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={{ backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 }}
            onPress={handleExportFinance}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12.5 }}>Export (CSV)</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'PAYOUTS' ? (
        <>
          {/* Payout Summary Tiles */}
          <View style={styles.payoutSummaryRow}>
            <View style={[styles.payoutSummaryCard, { borderColor: '#fde68a' }]}>
              <Text style={[styles.summaryLabel, { color: '#b45309' }]}>PENDING DISBURSEMENT</Text>
              <Text style={[styles.summaryVal, { color: '#b45309' }]}>₹{pendingPayoutTotal.toLocaleString('en-IN')}</Text>
              <Text style={styles.summarySub}>{partnerPayouts.filter((p) => p.status === 'PENDING_APPROVAL').length} payouts pending approval</Text>
            </View>

            <View style={[styles.payoutSummaryCard, { borderColor: '#a7f3d0' }]}>
              <Text style={[styles.summaryLabel, { color: '#047857' }]}>SETTLED THIS MONTH</Text>
              <Text style={[styles.summaryVal, { color: '#047857' }]}>₹{settledPayoutTotal.toLocaleString('en-IN')}</Text>
              <Text style={styles.summarySub}>{partnerPayouts.filter((p) => p.status === 'SETTLED').length} payouts processed via NEFT/UPI</Text>
            </View>

            <View style={[styles.payoutSummaryCard, { borderColor: '#bfdbfe' }]}>
              <Text style={[styles.summaryLabel, { color: '#1d4ed8' }]}>REGISTERED PARTNERS</Text>
              <Text style={[styles.summaryVal, { color: '#1d4ed8' }]}>{(providers || []).length || 2}</Text>
              <Text style={styles.summarySub}>Auto Tuesday weekly settlement</Text>
            </View>
          </View>

          {/* Partner Payouts Table */}
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1.1 }]}>Payout ID</Text>
              <Text style={[styles.th, { flex: 1.4 }]}>Partner Name</Text>
              <Text style={[styles.th, { flex: 1.3 }]}>UPI / Bank Account</Text>
              <Text style={[styles.th, { flex: 1.2 }]}>Cycle Period</Text>
              <Text style={[styles.th, { flex: 0.8 }]}>Jobs Done</Text>
              <Text style={[styles.th, { flex: 1.1 }]}>Earnings</Text>
              <Text style={[styles.th, { flex: 1.1 }]}>Status</Text>
              <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>Action</Text>
            </View>

            {partnerPayouts.map((p, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tdBold, { flex: 1.1 }]}>{p.payout_id}</Text>
                <View style={{ flex: 1.4 }}>
                  <Text style={[styles.tdBold, { color: '#7c3aed' }]}>{p.provider_name}</Text>
                  <Text style={styles.subText}>{p.provider_phone}</Text>
                </View>
                <View style={{ flex: 1.3 }}>
                  <Text style={[styles.td, { fontWeight: '600' }]}>{p.upi_id}</Text>
                  {p.utr_ref ? <Text style={{ fontSize: 10, color: '#059669', fontWeight: '700' }}>UTR: {p.utr_ref}</Text> : null}
                </View>
                <Text style={[styles.td, { flex: 1.2 }]}>{p.period}</Text>
                <Text style={[styles.td, { flex: 0.8 }]}>{p.jobs_count} Jobs</Text>
                <Text style={[styles.td, { flex: 1.1, color: '#059669', fontWeight: '900', fontSize: 14 }]}>
                  ₹{Number(p.total_earnings).toLocaleString('en-IN')}
                </Text>
                <View style={{ flex: 1.1 }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: p.status === 'SETTLED' ? '#ecfdf5' : '#fffbeb',
                      borderColor: p.status === 'SETTLED' ? '#a7f3d0' : '#fde68a',
                      borderWidth: 1,
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color: p.status === 'SETTLED' ? '#047857' : '#b45309',
                      }}
                    >
                      {p.status}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                  {p.status === 'PENDING_APPROVAL' ? (
                    <TouchableOpacity
                      style={styles.approvePayoutBtn}
                      onPress={() => handleOpenApproveModal(p)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.approvePayoutBtnText}>Release Payout</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.paidPill, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <Text style={styles.paidPillText}>Disbursed</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </>
      ) : (
        /* Customer Wallet Audit Logs Table */
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 1.2 }]}>Transaction ID</Text>
            <Text style={[styles.th, { flex: 1.4 }]}>User Name</Text>
            <Text style={[styles.th, { flex: 1.1 }]}>Type</Text>
            <Text style={[styles.th, { flex: 1.8 }]}>Description</Text>
            <Text style={[styles.th, { flex: 1.1 }]}>Amount</Text>
            <Text style={[styles.th, { flex: 1.1 }]}>Wallet After</Text>
          </View>

          {transactionsList.map((tx, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tdBold, { flex: 1.2 }]}>{tx.transaction_id}</Text>
              <TouchableOpacity style={{ flex: 1.4 }} onPress={() => handleOpenUserModal(tx)} activeOpacity={0.7}>
                <Text style={[styles.tdBold, { color: '#2563eb', textDecorationLine: 'underline' }]}>{getUserName(tx)}</Text>
                <Text style={styles.subText}>{getUserSubtext(tx)}</Text>
              </TouchableOpacity>
              <Text style={[styles.td, { flex: 1.1, color: '#2563eb', fontWeight: '800' }]}>{tx.type}</Text>
              <Text style={[styles.td, { flex: 1.8 }]}>{tx.description}</Text>
              <Text style={[styles.td, { flex: 1.1, color: tx.type === 'PLAN_PURCHASE' ? '#059669' : '#2563eb', fontWeight: '900' }]}>
                ₹{tx.amount?.toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.td, { flex: 1.1, fontWeight: '700', color: '#0f172a' }]}>
                ₹{tx.balance_after?.toLocaleString('en-IN')}
              </Text>
            </View>
          ))}

          {transactionsList.length === 0 && (
            <View style={styles.emptyStateBox}>
              <Text style={styles.emptyStateText}>No financial transactions logged yet.</Text>
            </View>
          )}
        </View>
      )}

      {/* Payout Approval Modal */}
      <Modal visible={payoutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.payoutModalCard}>
            <Text style={styles.modalTitle}>Approve & Release Partner Payout</Text>
            <Text style={styles.modalSub}>
              Confirm disbursement for {targetPayout?.provider_name} ({targetPayout?.payout_id})
            </Text>

            <View style={styles.modalDetailBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={styles.detailLbl}>Technician:</Text>
                <Text style={styles.detailVal}>{targetPayout?.provider_name} ({targetPayout?.provider_phone})</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={styles.detailLbl}>Settlement Cycle:</Text>
                <Text style={styles.detailVal}>{targetPayout?.period}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={styles.detailLbl}>Jobs Completed:</Text>
                <Text style={styles.detailVal}>{targetPayout?.jobs_count} Orders</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderTopWidth: 1, borderTopColor: '#e2e8f0', marginTop: 4 }}>
                <Text style={[styles.detailLbl, { fontWeight: '800' }]}>Net Payout Amount:</Text>
                <Text style={[styles.detailVal, { color: '#059669', fontWeight: '900', fontSize: 16 }]}>
                  ₹{Number(targetPayout?.total_earnings || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                <Text style={styles.detailLbl}>Beneficiary UPI / Bank:</Text>
                <Text style={[styles.detailVal, { color: '#2563eb', fontWeight: '700' }]}>{targetPayout?.upi_id}</Text>
              </View>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>
                Bank UTR / Transaction Reference Number *
              </Text>
              <TextInput
                style={styles.utrInput}
                value={utrInput}
                onChangeText={setUtrInput}
                placeholder="e.g. HDFC009283719482 or UPI/628492019482"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {!!payoutFormError && (
              <Text style={{ color: '#dc2626', fontSize: 11.5, fontWeight: '700' }}>{payoutFormError}</Text>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
              <TouchableOpacity
                style={styles.confirmPayoutBtn}
                onPress={handleConfirmPayout}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmPayoutBtnText}>Confirm & Mark Settled</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelPayoutBtn}
                onPress={() => { setPayoutModalVisible(false); setTargetPayout(null); }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelPayoutBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  header: { gap: 4 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b' },

  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  th: { color: '#475569', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  tdBold: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  td: { fontSize: 13, color: '#334155' },
  subText: { fontSize: 11, color: '#64748b', marginTop: 2 },

  emptyStateBox: { padding: 24, alignItems: 'center' },
  emptyStateText: { color: '#64748b', fontSize: 13 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#059669' },
  cardSub: { fontSize: 13, color: '#64748b' },

  payoutSummaryRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  payoutSummaryCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  summaryVal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 4,
  },
  summarySub: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },

  approvePayoutBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  approvePayoutBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  paidPill: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  paidPillText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  payoutModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    gap: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
  },
  modalDetailBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 2,
  },
  detailLbl: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  utrInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  confirmPayoutBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmPayoutBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  cancelPayoutBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelPayoutBtnText: {
    color: '#475569',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
