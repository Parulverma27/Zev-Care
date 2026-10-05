import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import UserProfileModal from '../components/UserProfileModal';
import { exportToCSV } from '../../utils/exportUtils';

const FILTERS = [
  { key: 'all', label: 'All paid' },
  { key: 'completed', label: 'Completed' },
  { key: 'in_progress', label: 'In progress (paid)' },
];

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const cleanPhone = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');

const formatWhen = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Paid services: wallet deducted / bill marked PAID */
const isPaidService = (b) =>
  b?.bill_status === 'PAID' || Number(b?.wallet_deducted) > 0;

export default function AdminUserServicesScreen() {
  const { bookings = [], users = [], wallet = {} } = useApp() || {};
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [selectedUserKey, setSelectedUserKey] = useState(null); // null = all users
  const [expandedUserKey, setExpandedUserKey] = useState(null);
  const [modalUser, setModalUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);

  const resolveUser = (b) => {
    if (b.user_id != null) {
      const u = users.find((usr) => usr.id === b.user_id);
      if (u) return u;
    }
    if (b.user_phone) {
      const u = users.find((usr) => cleanPhone(usr.phone) === cleanPhone(b.user_phone));
      if (u) return u;
    }
    return {
      id: b.user_id || null,
      name: b.user_name || 'Customer',
      phone: b.user_phone || '—',
      email: '',
      property_verification_status: 'PENDING',
      wallet_balance: 0,
    };
  };

  const userKeyFor = (b) => {
    if (b.user_id != null) return `id:${b.user_id}`;
    const phone = cleanPhone(b.user_phone);
    if (phone) return `ph:${phone}`;
    return `name:${(b.user_name || 'unknown').toLowerCase()}`;
  };

  const paidBookings = useMemo(() => {
    return (bookings || [])
      .filter(isPaidService)
      .map((b) => {
        const amount = Number(
          b.wallet_deducted != null
            ? b.wallet_deducted
            : b.total_bill != null
              ? b.total_bill
              : (Number(b.service_charge || 0) +
                  Number(b.parts_charge || 0) +
                  Number(b.labour_charge || 0) -
                  Number(b.discount_amount || 0))
        );
        return { ...b, _paidAmount: amount, _userKey: userKeyFor(b) };
      })
      .sort((a, b) => {
        const ta = new Date(a.rating_submitted_at || a.scheduled_date || a.created_at || 0).getTime();
        const tb = new Date(b.rating_submitted_at || b.scheduled_date || b.created_at || 0).getTime();
        return tb - ta;
      });
  }, [bookings]);

  /** Full customer directory from paid jobs (for name picker) */
  const customerDirectory = useMemo(() => {
    const map = new Map();
    paidBookings.forEach((b) => {
      const key = b._userKey;
      if (!map.has(key)) {
        const user = resolveUser(b);
        map.set(key, {
          key,
          user,
          name: user.name || b.user_name || 'Customer',
          phone: user.phone || b.user_phone || '—',
          visitCount: 0,
          totalPaid: 0,
        });
      }
      const row = map.get(key);
      row.visitCount += 1;
      row.totalPaid += Number(b._paidAmount || 0);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [paidBookings, users]);

  const userSuggestions = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return customerDirectory;
    return customerDirectory.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        cleanPhone(c.phone).includes(q.replace(/\D/g, ''))
    );
  }, [customerDirectory, userQuery]);

  const filteredBookings = useMemo(() => {
    let list = paidBookings;
    if (selectedUserKey) {
      list = list.filter((b) => b._userKey === selectedUserKey);
    }
    if (filter === 'completed') {
      list = list.filter((b) => b.status === 'BOOKING_COMPLETED');
    } else if (filter === 'in_progress') {
      list = list.filter((b) => b.status !== 'BOOKING_COMPLETED');
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => {
      const hay = [
        b.user_name,
        b.user_phone,
        b.service_name,
        b.category_name,
        b.booking_id,
        b.provider_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [paidBookings, filter, search, selectedUserKey]);

  const byUser = useMemo(() => {
    const map = new Map();
    filteredBookings.forEach((b) => {
      const key = b._userKey;
      if (!map.has(key)) {
        const user = resolveUser(b);
        map.set(key, {
          key,
          user,
          name: user.name || b.user_name || 'Customer',
          phone: user.phone || b.user_phone || '—',
          services: [],
          totalPaid: 0,
        });
      }
      const row = map.get(key);
      row.services.push(b);
      row.totalPaid += Number(b._paidAmount || 0);
    });

    return Array.from(map.values())
      .map((u) => {
        const mix = new Map();
        u.services.forEach((b) => {
          const name = b.service_name || 'Service';
          if (!mix.has(name)) mix.set(name, { name, count: 0, total: 0 });
          const m = mix.get(name);
          m.count += 1;
          m.total += Number(b._paidAmount || 0);
        });
        return {
          ...u,
          serviceMix: Array.from(mix.values()).sort((a, b) => b.count - a.count),
        };
      })
      .sort((a, b) => b.totalPaid - a.totalPaid);
  }, [filteredBookings, users]);

  const selectedCustomer = useMemo(
    () => customerDirectory.find((c) => c.key === selectedUserKey) || null,
    [customerDirectory, selectedUserKey]
  );

  const serviceTotals = useMemo(() => {
    const map = new Map();
    filteredBookings.forEach((b) => {
      const name = b.service_name || 'Service';
      if (!map.has(name)) {
        map.set(name, { name, count: 0, total: 0 });
      }
      const row = map.get(name);
      row.count += 1;
      row.total += Number(b._paidAmount || 0);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredBookings]);

  const stats = useMemo(() => {
    const totalPaid = filteredBookings.reduce((s, b) => s + Number(b._paidAmount || 0), 0);
    const walletPaid = (wallet.transactions || [])
      .filter((tx) => tx.type === 'SERVICE_PAYMENT')
      .reduce((s, tx) => s + Number(tx.amount || 0), 0);
    return {
      users: byUser.length,
      jobs: filteredBookings.length,
      totalPaid,
      walletPaid,
    };
  }, [filteredBookings, byUser, wallet.transactions]);

  const selectUser = (key) => {
    setSelectedUserKey(key);
    setExpandedUserKey(key);
    setUserQuery('');
  };

  const clearUser = () => {
    setSelectedUserKey(null);
    setExpandedUserKey(null);
    setUserQuery('');
  };

  const handleExport = () => {
    const flat = [];
    byUser.forEach((u) => {
      u.services.forEach((b, idx) => {
        flat.push({
          user_name: u.name,
          user_phone: u.phone,
          visit_no: idx + 1,
          booking_id: b.booking_id,
          service_name: b.service_name,
          category_name: b.category_name,
          provider_name: b.provider_name,
          service_charge: b.service_charge,
          parts_charge: b.parts_charge,
          labour_charge: b.labour_charge,
          discount_amount: b.discount_amount,
          amount_paid: b._paidAmount,
          bill_status: b.bill_status,
          status: b.status,
          scheduled_date: b.scheduled_date || b.scheduledDate,
        });
      });
    });
    exportToCSV('Zevota_User_Service_Payments', [
      { label: 'User Name', accessor: (r) => r.user_name },
      { label: 'User Phone', accessor: (r) => r.user_phone },
      { label: 'Visit #', accessor: (r) => r.visit_no },
      { label: 'Booking ID', accessor: (r) => r.booking_id },
      { label: 'Service', accessor: (r) => r.service_name },
      { label: 'Category', accessor: (r) => r.category_name },
      { label: 'Partner', accessor: (r) => r.provider_name },
      { label: 'Service Charge (INR)', accessor: (r) => r.service_charge || 0 },
      { label: 'Parts (INR)', accessor: (r) => r.parts_charge || 0 },
      { label: 'Labour (INR)', accessor: (r) => r.labour_charge || 0 },
      { label: 'Discount (INR)', accessor: (r) => r.discount_amount || 0 },
      { label: 'Amount Paid (INR)', accessor: (r) => r.amount_paid || 0 },
      { label: 'Bill Status', accessor: (r) => r.bill_status },
      { label: 'Job Status', accessor: (r) => r.status },
      { label: 'Scheduled', accessor: (r) => r.scheduled_date },
    ], flat);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <View style={styles.header}>
          <Text style={styles.title}>User Service Payments</Text>
          <Text style={styles.subtitle}>
            Look up any customer by name — one user can book the same or different services many times; each visit is listed with the amount paid.
          </Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.85}>
          <Text style={styles.exportBtnTxt}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{stats.users}</Text>
          <Text style={styles.statLabel}>{selectedUserKey ? 'Selected customer' : 'Customers'}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{stats.jobs}</Text>
          <Text style={styles.statLabel}>Paid visits</Text>
        </View>
        <View style={[styles.statCard, styles.statHighlight]}>
          <Text style={[styles.statVal, { color: '#15803d' }]}>{money(stats.totalPaid)}</Text>
          <Text style={styles.statLabel}>Total paid</Text>
        </View>
      </View>

      {/* Check by user name */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Check by user name</Text>
        <Text style={styles.sectionSub}>
          Type a name (or phone) and select the customer to see all their paid services — including repeat bookings.
        </Text>

        <TextInput
          value={userQuery}
          onChangeText={setUserQuery}
          placeholder="Type customer name or phone…"
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
        />

        {selectedCustomer ? (
          <View style={styles.selectedUserBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedUserName}>{selectedCustomer.name}</Text>
              <Text style={styles.subText}>
                {selectedCustomer.phone} · {selectedCustomer.visitCount} paid visit
                {selectedCustomer.visitCount === 1 ? '' : 's'} · {money(selectedCustomer.totalPaid)} total
              </Text>
            </View>
            <TouchableOpacity style={styles.clearUserBtn} onPress={clearUser} activeOpacity={0.85}>
              <Text style={styles.clearUserBtnTxt}>Show all users</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.userChipWrap}>
            {(userQuery.trim() ? userSuggestions : customerDirectory.slice(0, 12)).map((c) => (
              <TouchableOpacity
                key={c.key}
                style={styles.userChip}
                onPress={() => selectUser(c.key)}
                activeOpacity={0.85}
              >
                <Text style={styles.userChipName}>{c.name}</Text>
                <Text style={styles.userChipMeta}>
                  {c.visitCount}× · {money(c.totalPaid)}
                </Text>
              </TouchableOpacity>
            ))}
            {!userQuery.trim() && customerDirectory.length > 12 ? (
              <Text style={styles.moreHint}>Type a name to find more of {customerDirectory.length} customers…</Text>
            ) : null}
            {userQuery.trim() && userSuggestions.length === 0 ? (
              <Text style={styles.emptyInline}>No customer matches “{userQuery.trim()}”.</Text>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.searchRow}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Filter services / booking ID within results…"
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
        />
        <View style={styles.tabs}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabTxt, active && styles.tabTxtActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Service-type rollup (scoped to selected user when set) */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {selectedCustomer ? `Services taken by ${selectedCustomer.name}` : 'By service type'}
        </Text>
        <Text style={styles.sectionSub}>
          {selectedCustomer
            ? 'Same service can appear multiple times if they booked it again'
            : 'How much was paid across each service name'}
        </Text>
        {serviceTotals.length === 0 ? (
          <Text style={styles.emptyInline}>No paid services yet.</Text>
        ) : (
          serviceTotals.map((s) => (
            <View key={s.name} style={styles.serviceRollupRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rollupName}>{s.name}</Text>
                <Text style={styles.subText}>
                  Booked {s.count} time{s.count === 1 ? '' : 's'}
                </Text>
              </View>
              <Text style={styles.rollupAmt}>{money(s.total)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Per-user accordion */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {selectedCustomer ? `${selectedCustomer.name} — visit history` : 'By customer'}
        </Text>
        <Text style={styles.sectionSub}>
          Each row is one paid visit. Expand to see charges for every booking.
        </Text>

        {byUser.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No paid services found</Text>
            <Text style={styles.emptySub}>
              When a customer approves a bill, the deduction appears here with the service and amount.
            </Text>
          </View>
        ) : (
          byUser.map((u) => {
            const open = expandedUserKey === u.key || selectedUserKey === u.key;
            return (
              <View key={u.key} style={styles.userBlock}>
                <TouchableOpacity
                  style={styles.userHeader}
                  onPress={() => setExpandedUserKey(open && selectedUserKey !== u.key ? null : u.key)}
                  activeOpacity={0.85}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        setModalUser(u.user);
                        setUserModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.userName}>{u.name}</Text>
                    </TouchableOpacity>
                    <Text style={styles.subText}>
                      {u.phone} · {u.services.length} visit{u.services.length === 1 ? '' : 's'}
                    </Text>
                    <Text style={styles.mixLine} numberOfLines={2}>
                      {u.serviceMix.map((m) => `${m.name} ×${m.count}`).join(' · ')}
                    </Text>
                  </View>
                  <View style={styles.userRightMeta}>
                    <Text style={styles.userTotal}>{money(u.totalPaid)}</Text>
                    <Text style={styles.expandHint}>{open ? 'Hide' : 'Show'} visits</Text>
                    {!selectedUserKey ? (
                      <TouchableOpacity
                        style={styles.focusUserBtn}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          selectUser(u.key);
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.focusUserBtnTxt}>View only this user</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </TouchableOpacity>

                {open && (
                  <View style={styles.detailTable}>
                    <View style={styles.detailHeader}>
                      <Text style={[styles.th, { flex: 0.55 }]}>#</Text>
                      <Text style={[styles.th, { flex: 1.0 }]}>Booking</Text>
                      <Text style={[styles.th, { flex: 1.4 }]}>Service</Text>
                      <Text style={[styles.th, { flex: 1.0 }]}>Charges</Text>
                      <Text style={[styles.th, { flex: 0.9 }]}>Paid</Text>
                      <Text style={[styles.th, { flex: 0.8 }]}>Status</Text>
                      <Text style={[styles.th, { flex: 0.7 }]} />
                    </View>
                    {u.services.map((b, visitIdx) => (
                      <View key={b.booking_id} style={styles.detailRow}>
                        <View style={{ flex: 0.55 }}>
                          <Text style={styles.visitNo}>{visitIdx + 1}</Text>
                        </View>
                        <View style={{ flex: 1.0 }}>
                          <Text style={styles.tdBold}>{b.booking_id}</Text>
                          <Text style={styles.subText}>{formatWhen(b.scheduled_date || b.scheduledDate)}</Text>
                        </View>
                        <View style={{ flex: 1.4 }}>
                          <Text style={styles.td}>{b.service_name || 'Service'}</Text>
                          <Text style={styles.subText}>
                            {[b.category_name, b.provider_name].filter(Boolean).join(' · ') || '—'}
                          </Text>
                        </View>
                        <View style={{ flex: 1.0 }}>
                          <Text style={styles.chargeLine}>Svc {money(b.service_charge)}</Text>
                          {Number(b.parts_charge) > 0 && (
                            <Text style={styles.chargeLine}>Parts {money(b.parts_charge)}</Text>
                          )}
                          {Number(b.labour_charge) > 0 && (
                            <Text style={styles.chargeLine}>Labour {money(b.labour_charge)}</Text>
                          )}
                          {Number(b.discount_amount) > 0 && (
                            <Text style={styles.chargeLine}>Disc −{money(b.discount_amount)}</Text>
                          )}
                        </View>
                        <View style={{ flex: 0.9 }}>
                          <Text style={styles.paidAmt}>{money(b._paidAmount)}</Text>
                          <Text style={styles.subText}>{b.bill_status || 'PAID'}</Text>
                        </View>
                        <View style={{ flex: 0.8 }}>
                          <Text style={styles.statusChip}>
                            {b.status === 'BOOKING_COMPLETED' ? 'Completed' : b.status?.replace(/_/g, ' ') || '—'}
                          </Text>
                        </View>
                        <View style={{ flex: 0.7 }}>
                          <TouchableOpacity
                            style={styles.linkBtn}
                            onPress={() => navigate(`/admin/bookings/${b.booking_id}`)}
                            activeOpacity={0.85}
                          >
                            <Text style={styles.linkBtnTxt}>Order</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      <UserProfileModal
        visible={userModalVisible}
        user={modalUser}
        onClose={() => {
          setUserModalVisible(false);
          setModalUser(null);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' },
  header: { gap: 4, flex: 1, minWidth: 220 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  subtitle: { fontSize: 13, color: '#64748b', lineHeight: 18, fontFamily: 'Inter, sans-serif' },
  exportBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    cursor: 'pointer',
  },
  exportBtnTxt: { color: '#ffffff', fontWeight: '700', fontSize: 13, fontFamily: 'Inter, sans-serif' },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statHighlight: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  statVal: { fontSize: 20, fontWeight: '800', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'Inter, sans-serif' },

  searchRow: { gap: 10 },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif',
    outlineStyle: 'none',
  },
  userChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  userChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    cursor: 'pointer',
    minWidth: 140,
  },
  userChipName: { fontSize: 13, fontWeight: '700', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  userChipMeta: { fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'Inter, sans-serif' },
  moreHint: { fontSize: 12, color: '#94a3b8', alignSelf: 'center', fontFamily: 'Inter, sans-serif' },
  selectedUserBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 12,
  },
  selectedUserName: { fontSize: 15, fontWeight: '800', color: '#1d4ed8', fontFamily: 'Inter, sans-serif' },
  clearUserBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    cursor: 'pointer',
  },
  clearUserBtnTxt: { fontSize: 12, fontWeight: '700', color: '#1d4ed8', fontFamily: 'Inter, sans-serif' },
  mixLine: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 4,
    fontFamily: 'Inter, sans-serif',
  },
  focusUserBtn: {
    marginTop: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    cursor: 'pointer',
  },
  focusUserBtnTxt: { fontSize: 10, fontWeight: '700', color: '#1d4ed8', fontFamily: 'Inter, sans-serif' },
  visitNo: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    fontFamily: 'Inter, sans-serif',
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, cursor: 'pointer' },
  tabActive: { backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' },
  tabTxt: { fontSize: 12.5, fontWeight: '600', color: '#64748b', fontFamily: 'Inter, sans-serif' },
  tabTxtActive: { color: '#0f172a' },

  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  sectionSub: { fontSize: 12, color: '#64748b', marginBottom: 4, fontFamily: 'Inter, sans-serif' },
  emptyInline: { fontSize: 13, color: '#94a3b8', paddingVertical: 8, fontFamily: 'Inter, sans-serif' },

  serviceRollupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  rollupName: { fontSize: 13.5, fontWeight: '700', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  rollupAmt: { fontSize: 14, fontWeight: '800', color: '#15803d', fontFamily: 'Inter, sans-serif' },
  subText: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontFamily: 'Inter, sans-serif' },

  userBlock: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 6,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f8fafc',
    gap: 12,
    cursor: 'pointer',
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563eb',
    textDecorationLine: 'underline',
    fontFamily: 'Inter, sans-serif',
  },
  userRightMeta: { alignItems: 'flex-end' },
  userTotal: { fontSize: 16, fontWeight: '800', color: '#15803d', fontFamily: 'Inter, sans-serif' },
  expandHint: { fontSize: 11, color: '#64748b', marginTop: 2, fontFamily: 'Inter, sans-serif' },

  detailTable: { borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  detailHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  th: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontFamily: 'Inter, sans-serif',
  },
  detailRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    alignItems: 'flex-start',
  },
  td: { fontSize: 13, color: '#334155', fontFamily: 'Inter, sans-serif' },
  tdBold: { fontSize: 12.5, fontWeight: '700', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  chargeLine: { fontSize: 11, color: '#64748b', fontFamily: 'Inter, sans-serif' },
  paidAmt: { fontSize: 14, fontWeight: '800', color: '#15803d', fontFamily: 'Inter, sans-serif' },
  statusChip: { fontSize: 10, fontWeight: '700', color: '#475569', fontFamily: 'Inter, sans-serif' },
  linkBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    cursor: 'pointer',
  },
  linkBtnTxt: { color: '#1d4ed8', fontSize: 11, fontWeight: '700', fontFamily: 'Inter, sans-serif' },

  empty: { paddingVertical: 28, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  emptySub: { fontSize: 13, color: '#64748b', textAlign: 'center', fontFamily: 'Inter, sans-serif', maxWidth: 420 },
});
