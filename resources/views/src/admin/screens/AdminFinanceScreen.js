import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '../../context/AppContext';
import UserProfileModal from '../components/UserProfileModal';
import { exportToCSV } from '../../utils/exportUtils';

export function AdminFinanceScreen() {
  const { wallet, users } = useApp() || {};
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);

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

  const handleExportFinance = () => {
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={styles.header}>
          <Text style={styles.title}>Wallet Audit Logs & Financial Transactions</Text>
          <Text style={styles.subtitle}>Audit every subscription credit, work order payment deduction, and refund.</Text>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}
          onPress={handleExportFinance}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Export Financials (Excel/CSV)</Text>
          </View>
        </TouchableOpacity>
      </View>

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

      <UserProfileModal
        visible={userModalVisible}
        user={selectedUser}
        onClose={() => { setUserModalVisible(false); setSelectedUser(null); }}
      />
    </ScrollView>
  );
}

export function AdminDisputesScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Dispute Resolution Center</Text>
        <Text style={styles.subtitle}>Review customer dispute tickets, bill grievances, and partner arbitrations.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>No Active Disputes</Text>
        <Text style={styles.cardSub}>All work order estimates, wallet deductions, and completions are operating smoothly.</Text>
      </View>
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
});
