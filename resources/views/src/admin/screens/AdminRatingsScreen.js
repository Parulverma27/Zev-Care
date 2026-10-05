import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import UserProfileModal from '../components/UserProfileModal';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'rated', label: 'Rated' },
  { key: 'awaiting', label: 'Awaiting' },
  { key: 'skipped', label: 'Skipped' },
];

const issueResolvedLabel = (value) => {
  if (value === 'yes') return 'Yes, completely';
  if (value === 'partial') return 'Partially';
  if (value === 'no') return 'No';
  return null;
};

const formatWhen = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminRatingsScreen() {
  const { bookings = [], users = [] } = useApp() || {};
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);

  const ratingRows = useMemo(() => {
    return (bookings || [])
      .filter((b) => b.status === 'BOOKING_COMPLETED' || b.user_rating || b.rating_skipped)
      .map((b) => {
        const status = b.user_rating
          ? 'rated'
          : b.rating_skipped
            ? 'skipped'
            : b.status === 'BOOKING_COMPLETED'
              ? 'awaiting'
              : null;
        return { ...b, _ratingStatus: status };
      })
      .filter((b) => b._ratingStatus)
      .sort((a, b) => {
        const ta = new Date(a.rating_submitted_at || a.rating_skipped_at || a.updated_at || 0).getTime();
        const tb = new Date(b.rating_submitted_at || b.rating_skipped_at || b.updated_at || 0).getTime();
        return tb - ta;
      });
  }, [bookings]);

  const stats = useMemo(() => {
    const rated = ratingRows.filter((r) => r._ratingStatus === 'rated');
    const skipped = ratingRows.filter((r) => r._ratingStatus === 'skipped').length;
    const awaiting = ratingRows.filter((r) => r._ratingStatus === 'awaiting').length;
    const avg =
      rated.length > 0
        ? rated.reduce((sum, r) => sum + Number(r.user_rating || 0), 0) / rated.length
        : 0;
    return {
      total: ratingRows.length,
      rated: rated.length,
      skipped,
      awaiting,
      avg: rated.length ? avg.toFixed(1) : '—',
    };
  }, [ratingRows]);

  const filtered = useMemo(() => {
    if (filter === 'all') return ratingRows;
    return ratingRows.filter((r) => r._ratingStatus === filter);
  }, [ratingRows, filter]);

  const resolveUser = (b) => {
    if (b.user_id != null) {
      const u = users.find((usr) => usr.id === b.user_id);
      if (u) return u;
    }
    const clean = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');
    if (b.user_phone) {
      const u = users.find((usr) => clean(usr.phone) === clean(b.user_phone));
      if (u) return u;
    }
    return {
      id: b.user_id || null,
      name: b.user_name || 'Customer',
      phone: b.user_phone || '—',
      email: '',
      property_verification_status: 'PENDING',
    };
  };

  const openDetail = (row) => {
    setSelected(row);
    setDetailOpen(true);
  };

  const statusBadge = (status) => {
    if (status === 'rated') return { bg: '#fffbeb', border: '#fde68a', color: '#b45309', label: 'Rated' };
    if (status === 'skipped') return { bg: '#f1f5f9', border: '#e2e8f0', color: '#64748b', label: 'Skipped' };
    return { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', label: 'Awaiting' };
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Customer Ratings & Reviews</Text>
        <Text style={styles.subtitle}>
          All post-service ratings submitted by customers — stars, feedback, issue resolution, and photos.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: '#fde68a', backgroundColor: '#fffbeb' }]}>
          <Text style={[styles.statVal, { color: '#b45309' }]}>{stats.avg}</Text>
          <Text style={styles.statLabel}>Avg rating</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{stats.rated}</Text>
          <Text style={styles.statLabel}>Submitted</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: '#1d4ed8' }]}>{stats.awaiting}</Text>
          <Text style={styles.statLabel}>Awaiting</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: '#64748b' }]}>{stats.skipped}</Text>
          <Text style={styles.statLabel}>Skipped</Text>
        </View>
      </View>

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

      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.1 }]}>Booking</Text>
          <Text style={[styles.th, { flex: 1.3 }]}>Customer</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Service / Partner</Text>
          <Text style={[styles.th, { flex: 0.9 }]}>Rating</Text>
          <Text style={[styles.th, { flex: 1.4 }]}>Feedback</Text>
          <Text style={[styles.th, { flex: 0.9 }]}>Status</Text>
          <Text style={[styles.th, { flex: 0.8 }]}>Action</Text>
        </View>

        {filtered.map((row) => {
          const badge = statusBadge(row._ratingStatus);
          const resolved = issueResolvedLabel(row.issue_resolved);
          return (
            <View key={row.booking_id} style={styles.tableRow}>
              <View style={{ flex: 1.1 }}>
                <Text style={styles.tdBold}>{row.booking_id}</Text>
                <Text style={styles.subText}>
                  {formatWhen(row.rating_submitted_at || row.rating_skipped_at)}
                </Text>
              </View>

              <TouchableOpacity
                style={{ flex: 1.3 }}
                onPress={() => {
                  setModalUser(resolveUser(row));
                  setUserModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.tdBold, { color: '#2563eb', textDecorationLine: 'underline' }]}>
                  {row.user_name || 'Customer'}
                </Text>
                <Text style={styles.subText}>{row.user_phone || '—'}</Text>
              </TouchableOpacity>

              <View style={{ flex: 1.2 }}>
                <Text style={styles.td}>{row.service_name || 'Service'}</Text>
                <Text style={styles.subText}>{row.provider_name || 'Unassigned'}</Text>
              </View>

              <View style={{ flex: 0.9 }}>
                {row.user_rating ? (
                  <Text style={styles.stars}>
                    {'★'.repeat(row.user_rating)}
                    <Text style={styles.starMeta}> {row.user_rating}/5</Text>
                  </Text>
                ) : (
                  <Text style={styles.tdMuted}>—</Text>
                )}
                {resolved ? <Text style={styles.subText}>{resolved}</Text> : null}
              </View>

              <View style={{ flex: 1.4 }}>
                <Text style={styles.td} numberOfLines={2}>
                  {row.user_feedback || (row._ratingStatus === 'skipped' ? 'Customer skipped rating' : 'No feedback yet')}
                </Text>
                {Array.isArray(row.rating_photos) && row.rating_photos.length > 0 ? (
                  <Text style={styles.subText}>{row.rating_photos.length} photo(s)</Text>
                ) : null}
              </View>

              <View style={{ flex: 0.9 }}>
                <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                  <Text style={[styles.badgeTxt, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>

              <View style={{ flex: 0.8, gap: 6 }}>
                <TouchableOpacity style={styles.viewBtn} onPress={() => openDetail(row)} activeOpacity={0.85}>
                  <Text style={styles.viewBtnTxt}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.linkBtn}
                  onPress={() => navigate(`/admin/bookings/${row.booking_id}`)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.linkBtnTxt}>Order</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No ratings in this filter</Text>
            <Text style={styles.emptySub}>Completed bookings with customer ratings will appear here.</Text>
          </View>
        )}
      </View>

      <Modal visible={detailOpen} transparent animationType="fade" onRequestClose={() => setDetailOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Customer review</Text>
            <Text style={styles.modalSub}>
              {selected?.booking_id} · {selected?.service_name}
            </Text>
            <Text style={styles.modalMeta}>
              {selected?.user_name || 'Customer'} · Partner: {selected?.provider_name || '—'}
            </Text>

            {selected?.user_rating ? (
              <View style={{ gap: 10, marginTop: 8 }}>
                <Text style={styles.modalStars}>
                  {'★'.repeat(selected.user_rating)} ({selected.user_rating}/5)
                </Text>
                {issueResolvedLabel(selected.issue_resolved) ? (
                  <Text style={styles.modalBody}>
                    Issue resolved:{' '}
                    <Text style={{ fontWeight: '700' }}>{issueResolvedLabel(selected.issue_resolved)}</Text>
                  </Text>
                ) : null}
                {selected.user_feedback ? (
                  <Text style={styles.quote}>&ldquo;{selected.user_feedback}&rdquo;</Text>
                ) : (
                  <Text style={styles.modalMuted}>No written feedback.</Text>
                )}
                {Array.isArray(selected.feedback_tags) && selected.feedback_tags.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {selected.feedback_tags.map((t) => (
                      <View key={t} style={styles.tag}>
                        <Text style={styles.tagTxt}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {Array.isArray(selected.rating_photos) && selected.rating_photos.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {selected.rating_photos.map((uri, i) => (
                      <Image
                        key={`rr-${i}`}
                        source={{ uri }}
                        style={styles.photo}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                )}
                {selected.rating_submitted_at ? (
                  <Text style={styles.modalMuted}>Submitted {formatWhen(selected.rating_submitted_at)}</Text>
                ) : null}
              </View>
            ) : selected?.rating_skipped ? (
              <Text style={[styles.modalMuted, { marginTop: 12 }]}>
                Customer skipped rating
                {selected.rating_skipped_at ? ` · ${formatWhen(selected.rating_skipped_at)}` : ''}.
              </Text>
            ) : (
              <Text style={[styles.modalMuted, { marginTop: 12 }]}>No customer rating yet — still awaiting.</Text>
            )}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setDetailOpen(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.closeBtnTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  header: { gap: 4 },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  subtitle: { fontSize: 13, color: '#64748b', lineHeight: 18, fontFamily: 'Inter, sans-serif' },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flexGrow: 1,
    minWidth: 120,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statVal: { fontSize: 22, fontWeight: '800', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'Inter, sans-serif' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    cursor: 'pointer',
  },
  tabActive: { backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' },
  tabTxt: { fontSize: 13, fontWeight: '600', color: '#64748b', fontFamily: 'Inter, sans-serif' },
  tabTxtActive: { color: '#0f172a' },

  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontFamily: 'Inter, sans-serif',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 8,
    alignItems: 'flex-start',
  },
  td: { fontSize: 13, color: '#334155', fontFamily: 'Inter, sans-serif' },
  tdBold: { fontSize: 13, fontWeight: '700', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  tdMuted: { fontSize: 13, color: '#94a3b8', fontFamily: 'Inter, sans-serif' },
  subText: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontFamily: 'Inter, sans-serif' },
  stars: { fontSize: 14, color: '#d97706', fontWeight: '800', fontFamily: 'Inter, sans-serif' },
  starMeta: { fontSize: 11, color: '#92400e', fontWeight: '700' },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeTxt: { fontSize: 10, fontWeight: '800', fontFamily: 'Inter, sans-serif' },

  viewBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    cursor: 'pointer',
  },
  viewBtnTxt: { color: '#ffffff', fontSize: 11, fontWeight: '700', fontFamily: 'Inter, sans-serif' },
  linkBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    cursor: 'pointer',
  },
  linkBtnTxt: { color: '#1d4ed8', fontSize: 11, fontWeight: '700', fontFamily: 'Inter, sans-serif' },

  empty: { padding: 36, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  emptySub: { fontSize: 13, color: '#64748b', textAlign: 'center', fontFamily: 'Inter, sans-serif' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  modalSub: { fontSize: 13, color: '#64748b', marginTop: 4, fontFamily: 'Inter, sans-serif' },
  modalMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontFamily: 'Inter, sans-serif' },
  modalStars: { fontSize: 22, color: '#d97706', fontWeight: '800', fontFamily: 'Inter, sans-serif' },
  modalBody: { fontSize: 13, color: '#334155', fontFamily: 'Inter, sans-serif' },
  modalMuted: { fontSize: 13, color: '#64748b', fontFamily: 'Inter, sans-serif' },
  quote: {
    fontSize: 14,
    color: '#0f172a',
    fontStyle: 'italic',
    lineHeight: 20,
    fontFamily: 'Inter, sans-serif',
  },
  tag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagTxt: { fontSize: 11, fontWeight: '700', color: '#1d4ed8', fontFamily: 'Inter, sans-serif' },
  photo: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#e2e8f0' },
  closeBtn: {
    marginTop: 16,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    cursor: 'pointer',
  },
  closeBtnTxt: { color: '#ffffff', fontWeight: '700', fontSize: 14, fontFamily: 'Inter, sans-serif' },
});
