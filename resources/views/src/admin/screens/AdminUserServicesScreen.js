import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import UserProfileModal from '../components/UserProfileModal';
import { exportToCSV } from '../../utils/exportUtils';
import { AppIcon } from '../../components/AppIcons';

const STATUS_FILTERS = [
  { key: 'all', label: 'All Paid' },
  { key: 'completed', label: 'Completed' },
  { key: 'in_progress', label: 'In Progress (Paid)' },
];

const VIEW_TABS = [
  { key: 'ledger', label: 'Work Orders Ledger', icon: 'file-text' },
  { key: 'customers', label: 'Customer Statements', icon: 'user' },
  { key: 'services', label: 'Revenue by Service', icon: 'wrench' },
];

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const cleanPhone = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');

const formatWhen = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getInitials = (name) => {
  if (!name) return 'C';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/** Paid services: wallet deducted / bill marked PAID */
const isPaidService = (b) =>
  b?.bill_status === 'PAID' || Number(b?.wallet_deducted) > 0;

export default function AdminUserServicesScreen() {
  const { bookings = [], users = [], wallet = {} } = useApp() || {};
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('ledger'); // 'ledger' | 'customers' | 'services'
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
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
        map.set(name, { name, count: 0, total: 0, category: b.category_name });
      }
      const row = map.get(name);
      row.count += 1;
      row.total += Number(b._paidAmount || 0);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredBookings]);

  const stats = useMemo(() => {
    const totalPaid = filteredBookings.reduce((s, b) => s + Number(b._paidAmount || 0), 0);
    const avgTicket = filteredBookings.length > 0 ? Math.round(totalPaid / filteredBookings.length) : 0;
    const avgCustomerSpend = byUser.length > 0 ? Math.round(totalPaid / byUser.length) : 0;
    return {
      users: byUser.length,
      jobs: filteredBookings.length,
      totalPaid,
      avgTicket,
      avgCustomerSpend,
    };
  }, [filteredBookings, byUser]);

  const countsByStatus = useMemo(() => {
    let list = paidBookings;
    if (selectedUserKey) list = list.filter((b) => b._userKey === selectedUserKey);
    const all = list.length;
    const completed = list.filter((b) => b.status === 'BOOKING_COMPLETED').length;
    const inProgress = list.filter((b) => b.status !== 'BOOKING_COMPLETED').length;
    return { all, completed, inProgress };
  }, [paidBookings, selectedUserKey]);

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
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.header}>
          <Text style={styles.title}>Customer Billing &amp; Spend</Text>
          <Text style={styles.subtitle}>
            Monitor customer transactions, breakdown of work order charges, and real-time revenue collection across home services.
          </Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.85}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <Text style={styles.exportBtnTxt}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      {/* 4 Enhanced KPI Summary Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: '#10b981' }]}>
          <View style={styles.statHead}>
            <Text style={styles.statLabel}>TOTAL REVENUE</Text>
            <View style={[styles.statBadge, { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }]}>
              <Text style={[styles.statBadgeTxt, { color: '#15803d' }]}>Paid</Text>
            </View>
          </View>
          <Text style={[styles.statVal, { color: '#0f172a' }]}>{money(stats.totalPaid)}</Text>
          <Text style={styles.statFoot}>Settled through bills &amp; wallet</Text>
        </View>

        <View style={[styles.statCard, { borderTopColor: '#2563eb' }]}>
          <View style={styles.statHead}>
            <Text style={styles.statLabel}>PAID VISITS</Text>
            <View style={[styles.statBadge, { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' }]}>
              <Text style={[styles.statBadgeTxt, { color: '#1d4ed8' }]}>Orders</Text>
            </View>
          </View>
          <Text style={styles.statVal}>{stats.jobs}</Text>
          <Text style={styles.statFoot}>Completed &amp; in-progress visits</Text>
        </View>

        <View style={[styles.statCard, { borderTopColor: '#8b5cf6' }]}>
          <View style={styles.statHead}>
            <Text style={styles.statLabel}>ACTIVE CUSTOMERS</Text>
            <View style={[styles.statBadge, { backgroundColor: '#f3e8ff', borderColor: '#e9d5ff' }]}>
              <Text style={[styles.statBadgeTxt, { color: '#7e22ce' }]}>Users</Text>
            </View>
          </View>
          <Text style={styles.statVal}>{stats.users}</Text>
          <Text style={styles.statFoot}>{selectedCustomer ? 'Filtered to 1 customer' : 'Unique paying customers'}</Text>
        </View>

        <View style={[styles.statCard, { borderTopColor: '#f59e0b' }]}>
          <View style={styles.statHead}>
            <Text style={styles.statLabel}>AVG SPEND / USER</Text>
            <View style={[styles.statBadge, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
              <Text style={[styles.statBadgeTxt, { color: '#b45309' }]}>ARPU</Text>
            </View>
          </View>
          <Text style={styles.statVal}>{money(stats.avgCustomerSpend)}</Text>
          <Text style={styles.statFoot}>Avg ticket: {money(stats.avgTicket)}</Text>
        </View>
      </View>

      {/* Unified Search & Customer Filter Card */}
      <View style={styles.filterCard}>
        {/* Search Input Row + Status Pills */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchBox}>
            <AppIcon name="search" size={17} color="#94a3b8" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search customer, phone, booking ID, service name, partner…"
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearIconBtn}>
                <AppIcon name="x" size={14} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Status Tabs */}
          <View style={styles.statusTabs}>
            {STATUS_FILTERS.map((f) => {
              const active = filter === f.key;
              const count = f.key === 'all' ? countsByStatus.all : f.key === 'completed' ? countsByStatus.completed : countsByStatus.inProgress;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.statusTab, active && styles.statusTabActive]}
                  onPress={() => setFilter(f.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.statusTabTxt, active && styles.statusTabTxtActive]}>
                    {f.label} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Customer Avatar Quick Filter Chips */}
        <View style={styles.customerChipsSection}>
          <View style={styles.customerChipHeader}>
            <Text style={styles.customerChipTitle}>Filter by Customer:</Text>
            {selectedUserKey && (
              <TouchableOpacity onPress={() => setSelectedUserKey(null)} style={styles.resetFilterBtn}>
                <Text style={styles.resetFilterBtnTxt}>Reset to all</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.customerChipsScroll}>
            {/* "All Customers" Pill */}
            <TouchableOpacity
              style={[styles.customerChip, !selectedUserKey && styles.customerChipActive]}
              onPress={() => setSelectedUserKey(null)}
              activeOpacity={0.85}
            >
              <View style={[styles.avatarCircle, !selectedUserKey && styles.avatarCircleActive]}>
                <Text style={[styles.avatarTxt, !selectedUserKey && styles.avatarTxtActive]}>ALL</Text>
              </View>
              <View>
                <Text style={[styles.customerChipName, !selectedUserKey && styles.customerChipNameActive]}>All Customers</Text>
                <Text style={[styles.customerChipMeta, !selectedUserKey && styles.customerChipMetaActive]}>
                  {customerDirectory.length} users · {money(paidBookings.reduce((s, b) => s + (b._paidAmount || 0), 0))}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Individual Customer Pills */}
            {customerDirectory.map((c) => {
              const active = selectedUserKey === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.customerChip, active && styles.customerChipActive]}
                  onPress={() => setSelectedUserKey(active ? null : c.key)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.avatarCircle, active && styles.avatarCircleActive]}>
                    <Text style={[styles.avatarTxt, active && styles.avatarTxtActive]}>{getInitials(c.name)}</Text>
                  </View>
                  <View>
                    <Text style={[styles.customerChipName, active && styles.customerChipNameActive]}>{c.name}</Text>
                    <Text style={[styles.customerChipMeta, active && styles.customerChipMetaActive]}>
                      {c.visitCount}x · {money(c.totalPaid)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Main View Segmented Switcher */}
      <View style={styles.viewTabsRow}>
        {VIEW_TABS.map((tab) => {
          const active = activeView === tab.key;
          const count =
            tab.key === 'ledger'
              ? filteredBookings.length
              : tab.key === 'customers'
                ? byUser.length
                : serviceTotals.length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.viewTab, active && styles.viewTabActive]}
              onPress={() => setActiveView(tab.key)}
              activeOpacity={0.85}
            >
              <AppIcon name={tab.icon} size={16} color={active ? '#1d4ed8' : '#64748b'} />
              <Text style={[styles.viewTabTxt, active && styles.viewTabTxtActive]}>
                {tab.label}
              </Text>
              <View style={[styles.viewTabCountBadge, active && styles.viewTabCountBadgeActive]}>
                <Text style={[styles.viewTabCountTxt, active && styles.viewTabCountTxtActive]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ========================================================= */}
      {/* VIEW 1: WORK ORDERS LEDGER (Column-Aligned High-Density) */}
      {/* ========================================================= */}
      {activeView === 'ledger' && (
        <View style={styles.tableCard}>
          <View style={styles.tableHeadRow}>
            <View style={{ flex: 1.1 }}><Text style={styles.th}>Date &amp; Time</Text></View>
            <View style={{ flex: 1.2 }}><Text style={styles.th}>Booking ID</Text></View>
            <View style={{ flex: 1.5 }}><Text style={styles.th}>Customer</Text></View>
            <View style={{ flex: 1.6 }}><Text style={styles.th}>Service</Text></View>
            <View style={{ flex: 1.4 }}><Text style={styles.th}>Field Partner</Text></View>
            <View style={{ flex: 1.5 }}><Text style={styles.th}>Charges Breakdown</Text></View>
            <View style={{ flex: 1.2 }}><Text style={styles.th}>Total Paid</Text></View>
            <View style={{ flex: 1.0 }}><Text style={styles.th}>Status</Text></View>
            <View style={{ flex: 0.9, alignItems: 'center' }}><Text style={styles.th}>Action</Text></View>
          </View>

          {filteredBookings.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No paid work orders found</Text>
              <Text style={styles.emptySub}>
                {search || selectedUserKey || filter !== 'all'
                  ? 'Try clearing the search query or customer filter above.'
                  : 'Paid services and settled bills will appear here automatically.'}
              </Text>
            </View>
          ) : (
            filteredBookings.map((b) => {
              const isCompleted = b.status === 'BOOKING_COMPLETED';
              return (
                <View key={b.booking_id} style={styles.tableRow}>
                  {/* Date & Time */}
                  <View style={{ flex: 1.1 }}>
                    <Text style={styles.dateMain}>{formatWhen(b.scheduled_date || b.scheduledDate || b.created_at)}</Text>
                    <Text style={styles.subText}>{b.scheduled_time || 'General Slot'}</Text>
                  </View>

                  {/* Booking ID */}
                  <View style={{ flex: 1.2 }}>
                    <TouchableOpacity
                      onPress={() => navigate(`/admin/bookings/${b.booking_id}`)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.bookingIdLink}>{b.booking_id}</Text>
                    </TouchableOpacity>
                    <Text style={styles.subText}>Verified Service</Text>
                  </View>

                  {/* Customer */}
                  <View style={{ flex: 1.5 }}>
                    <TouchableOpacity
                      onPress={() => {
                        const usr = resolveUser(b);
                        setModalUser(usr);
                        setUserModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.customerNameLink}>{b.user_name || 'Customer'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.subText}>{b.user_phone || '—'}</Text>
                  </View>

                  {/* Service */}
                  <View style={{ flex: 1.6 }}>
                    <Text style={styles.serviceTitle}>{b.service_name || 'Service'}</Text>
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillTxt}>{b.category_name || 'Home Care'}</Text>
                    </View>
                  </View>

                  {/* Field Partner */}
                  <View style={{ flex: 1.4 }}>
                    <Text style={styles.partnerName}>{b.provider_name || 'Unassigned'}</Text>
                    <Text style={styles.subText}>{b.provider_phone || 'Assigned Partner'}</Text>
                  </View>

                  {/* Charges Breakdown */}
                  <View style={{ flex: 1.5 }}>
                    <Text style={styles.breakdownItem}>Base: {money(b.service_charge)}</Text>
                    {Number(b.parts_charge) > 0 && (
                      <Text style={styles.breakdownItem}>Parts: {money(b.parts_charge)}</Text>
                    )}
                    {Number(b.labour_charge) > 0 && (
                      <Text style={styles.breakdownItem}>Labour: {money(b.labour_charge)}</Text>
                    )}
                    {Number(b.discount_amount) > 0 && (
                      <Text style={[styles.breakdownItem, { color: '#059669' }]}>Disc: −{money(b.discount_amount)}</Text>
                    )}
                  </View>

                  {/* Total Paid */}
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.paidPrice}>{money(b._paidAmount)}</Text>
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidBadgeTxt}>{b.bill_status || 'PAID'}</Text>
                    </View>
                  </View>

                  {/* Status */}
                  <View style={{ flex: 1.0 }}>
                    <View style={[styles.jobStatusPill, isCompleted ? styles.jobStatusDone : styles.jobStatusProg]}>
                      <Text style={[styles.jobStatusTxt, isCompleted ? styles.jobStatusTxtDone : styles.jobStatusTxtProg]}>
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </Text>
                    </View>
                  </View>

                  {/* Action */}
                  <View style={{ flex: 0.9, alignItems: 'center' }}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => navigate(`/admin/bookings/${b.booking_id}`)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.actionBtnTxt}>View Order</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: CUSTOMER STATEMENTS (Accordion / Spend Profile)   */}
      {/* ========================================================= */}
      {activeView === 'customers' && (
        <View style={styles.customerCardsWrap}>
          {byUser.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No customer spend records found</Text>
              <Text style={styles.emptySub}>Matching customer statements will appear here.</Text>
            </View>
          ) : (
            byUser.map((u) => {
              const open = expandedUserKey === u.key || selectedUserKey === u.key;
              return (
                <View key={u.key} style={styles.userCard}>
                  <TouchableOpacity
                    style={styles.userCardHeader}
                    onPress={() => setExpandedUserKey(open && selectedUserKey !== u.key ? null : u.key)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.userCardLeft}>
                      <View style={styles.cardAvatar}>
                        <Text style={styles.cardAvatarTxt}>{getInitials(u.name)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e?.stopPropagation?.();
                              setModalUser(u.user);
                              setUserModalVisible(true);
                            }}
                          >
                            <Text style={styles.userCardName}>{u.name}</Text>
                          </TouchableOpacity>
                          <View style={styles.visitCountBadge}>
                            <Text style={styles.visitCountBadgeTxt}>{u.services.length} {u.services.length === 1 ? 'Visit' : 'Visits'}</Text>
                          </View>
                        </View>
                        <Text style={styles.userCardPhone}>{u.phone}</Text>
                        <Text style={styles.userCardServices} numberOfLines={1}>
                          {u.serviceMix.map((m) => `${m.name} ×${m.count}`).join(' · ')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.userCardRight}>
                      <Text style={styles.userCardSpendLabel}>LIFETIME SPEND</Text>
                      <Text style={styles.userCardSpendAmt}>{money(u.totalPaid)}</Text>
                      <Text style={styles.userCardExpand}>{open ? '▲ Hide visits' : '▼ View visits'}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Visit History Breakdown */}
                  {open && (
                    <View style={styles.expandedVisitsWrap}>
                      <View style={styles.expandedHeader}>
                        <Text style={[styles.expandedTh, { flex: 0.6 }]}>#</Text>
                        <Text style={[styles.expandedTh, { flex: 1.2 }]}>Booking ID</Text>
                        <Text style={[styles.expandedTh, { flex: 1.6 }]}>Service</Text>
                        <Text style={[styles.expandedTh, { flex: 1.4 }]}>Breakdown</Text>
                        <Text style={[styles.expandedTh, { flex: 1.1 }]}>Amount Paid</Text>
                        <Text style={[styles.expandedTh, { flex: 1.0 }]}>Status</Text>
                        <Text style={[styles.expandedTh, { flex: 0.9, textAlign: 'center' }]}>Action</Text>
                      </View>

                      {u.services.map((b, idx) => (
                        <View key={b.booking_id} style={styles.expandedRow}>
                          <Text style={[styles.expandedTd, { flex: 0.6, fontWeight: '700', color: '#64748b' }]}>
                            #{idx + 1}
                          </Text>
                          <View style={{ flex: 1.2 }}>
                            <Text style={styles.expandedBookingId}>{b.booking_id}</Text>
                            <Text style={styles.subText}>{formatWhen(b.scheduled_date || b.scheduledDate)}</Text>
                          </View>
                          <View style={{ flex: 1.6 }}>
                            <Text style={styles.expandedServiceName}>{b.service_name || 'Service'}</Text>
                            <Text style={styles.subText}>{b.category_name || 'Home Service'}</Text>
                          </View>
                          <View style={{ flex: 1.4 }}>
                            <Text style={styles.breakdownItem}>Service: {money(b.service_charge)}</Text>
                            {Number(b.parts_charge) > 0 && <Text style={styles.breakdownItem}>Parts: {money(b.parts_charge)}</Text>}
                            {Number(b.discount_amount) > 0 && <Text style={[styles.breakdownItem, { color: '#059669' }]}>Disc: −{money(b.discount_amount)}</Text>}
                          </View>
                          <View style={{ flex: 1.1 }}>
                            <Text style={styles.expandedPaidAmt}>{money(b._paidAmount)}</Text>
                            <Text style={styles.subText}>{b.bill_status || 'PAID'}</Text>
                          </View>
                          <View style={{ flex: 1.0 }}>
                            <Text style={[styles.jobStatusTxtDone, { fontSize: 11 }]}>
                              {b.status === 'BOOKING_COMPLETED' ? 'Completed' : 'In Progress'}
                            </Text>
                          </View>
                          <View style={{ flex: 0.9, alignItems: 'center' }}>
                            <TouchableOpacity
                              style={styles.actionBtnSmall}
                              onPress={() => navigate(`/admin/bookings/${b.booking_id}`)}
                            >
                              <Text style={styles.actionBtnSmallTxt}>Order</Text>
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
      )}

      {/* ========================================================= */}
      {/* VIEW 3: REVENUE BY SERVICE (Visual Progress Bars & Stats)  */}
      {/* ========================================================= */}
      {activeView === 'services' && (
        <View style={styles.servicesCard}>
          <View style={styles.servicesHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCustomer ? `Services Booked by ${selectedCustomer.name}` : 'Service Revenue Distribution'}
            </Text>
            <Text style={styles.sectionSub}>
              Aggregated earnings, order volume, and contribution to total revenue across verified catalog items.
            </Text>
          </View>

          {serviceTotals.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No service sales found</Text>
            </View>
          ) : (
            serviceTotals.map((s, idx) => {
              const totalPlatform = stats.totalPaid || 1;
              const percent = Math.min(100, Math.round((s.total / totalPlatform) * 100));
              return (
                <View key={s.name} style={styles.serviceRow}>
                  <View style={styles.serviceRankCircle}>
                    <Text style={styles.serviceRankTxt}>#{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 160 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={styles.serviceRowName}>{s.name}</Text>
                      <Text style={styles.serviceRowAmt}>{money(s.total)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={styles.subText}>
                        {s.count} {s.count === 1 ? 'paid visit' : 'paid visits'} {s.category ? `· ${s.category}` : ''}
                      </Text>
                      <Text style={styles.percentTxt}>{percent}% of total spend</Text>
                    </View>
                    {/* Visual Progress Bar */}
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* User Profile Modal */}
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
  content: { padding: 24, gap: 18, paddingBottom: 50 },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
  },
  header: { gap: 4, flex: 1, minWidth: 260 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  subtitle: { fontSize: 13, color: '#64748b', lineHeight: 19, fontFamily: 'Inter, sans-serif' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
  },
  exportBtnTxt: { color: '#ffffff', fontWeight: '700', fontSize: 13, fontFamily: 'Inter, sans-serif' },

  /* 4 KPI Cards */
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopWidth: 3,
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
    gap: 4,
  },
  statHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 0.6, fontFamily: 'Inter, sans-serif' },
  statBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  statBadgeTxt: { fontSize: 10, fontWeight: '700', fontFamily: 'Inter, sans-serif' },
  statVal: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginTop: 4, fontFamily: 'Inter, sans-serif' },
  statFoot: { fontSize: 11.5, color: '#94a3b8', marginTop: 2, fontFamily: 'Inter, sans-serif' },

  /* Filter Card */
  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 14,
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 280,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif',
    outlineStyle: 'none',
  },
  clearIconBtn: { padding: 4, cursor: 'pointer' },
  statusTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  statusTab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    cursor: 'pointer',
  },
  statusTabActive: {
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
  },
  statusTabTxt: { fontSize: 12, fontWeight: '600', color: '#64748b', fontFamily: 'Inter, sans-serif' },
  statusTabTxtActive: { color: '#0f172a', fontWeight: '700' },

  /* Customer Quick Chips */
  customerChipsSection: { gap: 8 },
  customerChipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerChipTitle: { fontSize: 12, fontWeight: '700', color: '#475569', fontFamily: 'Inter, sans-serif' },
  resetFilterBtn: { cursor: 'pointer' },
  resetFilterBtnTxt: { fontSize: 11.5, color: '#2563eb', fontWeight: '700', fontFamily: 'Inter, sans-serif' },
  customerChipsScroll: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  customerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    cursor: 'pointer',
    minWidth: 150,
  },
  customerChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    boxShadow: '0 2px 6px rgba(59, 130, 246, 0.15)',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircleActive: { backgroundColor: '#3b82f6' },
  avatarTxt: { fontSize: 10, fontWeight: '800', color: '#475569', fontFamily: 'Inter, sans-serif' },
  avatarTxtActive: { color: '#ffffff' },
  customerChipName: { fontSize: 12.5, fontWeight: '700', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  customerChipNameActive: { color: '#1d4ed8' },
  customerChipMeta: { fontSize: 10.5, color: '#64748b', marginTop: 1, fontFamily: 'Inter, sans-serif' },
  customerChipMetaActive: { color: '#2563eb', fontWeight: '600' },

  /* View Switcher */
  viewTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 4,
    gap: 6,
    alignSelf: 'flex-start',
  },
  viewTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    cursor: 'pointer',
  },
  viewTabActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  viewTabTxt: { fontSize: 13, fontWeight: '600', color: '#64748b', fontFamily: 'Inter, sans-serif' },
  viewTabTxtActive: { color: '#1d4ed8', fontWeight: '800' },
  viewTabCountBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  viewTabCountBadgeActive: { backgroundColor: '#dbeafe' },
  viewTabCountTxt: { fontSize: 11, fontWeight: '700', color: '#64748b', fontFamily: 'Inter, sans-serif' },
  viewTabCountTxtActive: { color: '#1d4ed8' },

  /* Table Card (View 1: Ledger) */
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
  },
  tableHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 10,
  },
  th: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Inter, sans-serif',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  dateMain: { fontSize: 12.5, fontWeight: '700', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  bookingIdLink: { fontSize: 12.5, fontWeight: '800', color: '#2563eb', fontFamily: 'Inter, sans-serif' },
  customerNameLink: { fontSize: 13, fontWeight: '800', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  serviceTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  categoryPillTxt: { fontSize: 10, color: '#475569', fontWeight: '700', fontFamily: 'Inter, sans-serif' },
  partnerName: { fontSize: 12.5, fontWeight: '700', color: '#334155', fontFamily: 'Inter, sans-serif' },
  breakdownItem: { fontSize: 11, color: '#64748b', fontFamily: 'Inter, sans-serif' },
  paidPrice: { fontSize: 14, fontWeight: '800', color: '#15803d', fontFamily: 'Inter, sans-serif' },
  paidBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginTop: 3,
  },
  paidBadgeTxt: { fontSize: 9.5, fontWeight: '800', color: '#15803d', fontFamily: 'Inter, sans-serif' },
  jobStatusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  jobStatusDone: { backgroundColor: '#dcfce7' },
  jobStatusProg: { backgroundColor: '#dbeafe' },
  jobStatusTxt: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter, sans-serif' },
  jobStatusTxtDone: { color: '#15803d' },
  jobStatusTxtProg: { color: '#1d4ed8' },
  actionBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    cursor: 'pointer',
  },
  actionBtnTxt: { color: '#1d4ed8', fontSize: 11.5, fontWeight: '700', fontFamily: 'Inter, sans-serif' },

  /* Customer Statements (View 2) */
  customerCardsWrap: { gap: 12 },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8fafc',
    gap: 14,
    cursor: 'pointer',
  },
  userCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarTxt: { fontSize: 14, fontWeight: '800', color: '#ffffff', fontFamily: 'Inter, sans-serif' },
  userCardName: { fontSize: 15, fontWeight: '800', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  visitCountBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  visitCountBadgeTxt: { fontSize: 10.5, fontWeight: '700', color: '#1d4ed8', fontFamily: 'Inter, sans-serif' },
  userCardPhone: { fontSize: 12, color: '#64748b', marginTop: 1, fontFamily: 'Inter, sans-serif' },
  userCardServices: { fontSize: 12, color: '#475569', marginTop: 3, fontFamily: 'Inter, sans-serif' },
  userCardRight: { alignItems: 'flex-end', gap: 2 },
  userCardSpendLabel: { fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 0.5, fontFamily: 'Inter, sans-serif' },
  userCardSpendAmt: { fontSize: 18, fontWeight: '800', color: '#15803d', fontFamily: 'Inter, sans-serif' },
  userCardExpand: { fontSize: 11, color: '#2563eb', fontWeight: '700', marginTop: 3, fontFamily: 'Inter, sans-serif' },

  expandedVisitsWrap: { borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#ffffff' },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 8,
  },
  expandedTh: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontFamily: 'Inter, sans-serif',
  },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 8,
  },
  expandedTd: { fontSize: 12.5, color: '#334155', fontFamily: 'Inter, sans-serif' },
  expandedBookingId: { fontSize: 12, fontWeight: '800', color: '#2563eb', fontFamily: 'Inter, sans-serif' },
  expandedServiceName: { fontSize: 12.5, fontWeight: '700', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  expandedPaidAmt: { fontSize: 13.5, fontWeight: '800', color: '#15803d', fontFamily: 'Inter, sans-serif' },
  actionBtnSmall: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    cursor: 'pointer',
  },
  actionBtnSmallTxt: { color: '#1d4ed8', fontSize: 10.5, fontWeight: '700', fontFamily: 'Inter, sans-serif' },

  /* Revenue by Service (View 3) */
  servicesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    gap: 14,
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
  },
  servicesHeader: { gap: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  sectionSub: { fontSize: 12.5, color: '#64748b', fontFamily: 'Inter, sans-serif' },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  serviceRankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceRankTxt: { fontSize: 12, fontWeight: '800', color: '#475569', fontFamily: 'Inter, sans-serif' },
  serviceRowName: { fontSize: 14, fontWeight: '700', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  serviceRowAmt: { fontSize: 15, fontWeight: '800', color: '#15803d', fontFamily: 'Inter, sans-serif' },
  percentTxt: { fontSize: 11, fontWeight: '700', color: '#2563eb', fontFamily: 'Inter, sans-serif' },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#3b82f6',
  },

  /* Empty State */
  emptyWrap: { paddingVertical: 40, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  emptySub: { fontSize: 13, color: '#64748b', textAlign: 'center', fontFamily: 'Inter, sans-serif', maxWidth: 460 },
  subText: { fontSize: 11, color: '#94a3b8', marginTop: 1, fontFamily: 'Inter, sans-serif' },
});
