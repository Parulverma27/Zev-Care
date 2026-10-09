import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AppIcon } from '../../components/AppIcons';

export default function UserBookingsScreen() {
  const { activeUser, getUserBookings } = useApp();
  const navigate = useNavigate();
  const userBookings = getUserBookings(activeUser);

  const handleGoBack = () => {
    if (window?.history?.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/user/home');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>My Bookings</Text>
          <Text style={styles.subtitle}>Track your service requests and work orders</Text>
        </View>
      </View>

      {userBookings.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptySub}>
            You haven&apos;t raised any service requests. Book a professional to get started.
          </Text>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => navigate('/user/bookings/new', { state: {} })}
            activeOpacity={0.88}
          >
            <Text style={styles.bookBtnText}>Book a Service</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {userBookings.map((booking) => {
            const needsRating =
              booking.status === 'BOOKING_COMPLETED' && !booking.user_rating && !booking.rating_skipped;
            return (
              <TouchableOpacity
                key={booking.booking_id}
                style={styles.card}
                onPress={() => navigate(`/user/bookings/${booking.booking_id}`)}
                activeOpacity={0.88}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardService}>{booking.service_name}</Text>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    {booking.isConsultation || booking.booking_mode === 'consultation' ? (
                      <Text style={styles.consultBadge}>FREE CONSULT</Text>
                    ) : null}
                    <Text
                      style={[
                        styles.cardStatus,
                        booking.status === 'AWAITING_USER_APPROVAL' && { backgroundColor: '#fef3c7', color: '#b45309' },
                        booking.status === 'ESTIMATE_REJECTED' && { backgroundColor: '#f1f5f9', color: '#64748b' },
                      ]}
                    >
                      {formatStatus(booking.status, booking)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>
                  {booking.category_name} › {booking.sub_category_name}
                </Text>
                <Text style={styles.cardId}>ID: {booking.booking_id}</Text>
                <View style={styles.cardScheduleRow}>
                  <AppIcon name="clock" size={13} color="#475569" />
                  <Text style={styles.cardSchedule}>{booking.scheduled_date}</Text>
                </View>

                {booking.status === 'AWAITING_USER_APPROVAL' && (
                  <View style={styles.quoteActionPill}>
                    <Text style={styles.quoteActionPillText}>
                      ⚡ Upfront Quote: ₹{(booking.total_bill ?? (Number(booking.parts_charge || 0) + Number(booking.labour_charge || 0))).toLocaleString()} • Review & Approve →
                    </Text>
                  </View>
                )}

                {Boolean(booking.status === 'SERVICE_IN_PROGRESS' && booking.completion_otp) && (
                  <View style={styles.otpPill}>
                    <Text style={styles.otpPillText}>
                      🔑 Completion OTP: <Text style={{ fontWeight: '800' }}>{booking.completion_otp}</Text>
                    </Text>
                  </View>
                )}

                {needsRating && (
                  <TouchableOpacity
                    style={styles.rateBtn}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      navigate(`/user/bookings/${booking.booking_id}/rate`);
                    }}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.rateBtnText}>Rate us ★</Text>
                  </TouchableOpacity>
                )}
                {!!booking.user_rating && (
                  <Text style={styles.ratedHint}>
                    Rated {'★'.repeat(booking.user_rating)} ({booking.user_rating}/5)
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function formatStatus(status, booking) {
  if (!status) return 'Pending';
  const isConsult = Boolean(booking?.isConsultation || booking?.booking_mode === 'consultation');
  if (status === 'AWAITING_USER_APPROVAL') {
    return isConsult ? 'Quote Ready' : 'Awaiting Approval';
  }
  if (status === 'ESTIMATE_REJECTED') {
    return isConsult ? 'Concluded (₹0)' : 'Declined';
  }
  if (status === 'SERVICE_IN_PROGRESS') {
    return isConsult ? 'Repair In Progress' : 'In Progress';
  }
  return String(status).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f6ff', width: '100%' },
  content: { padding: 16, paddingBottom: 40, gap: 14, width: '100%', boxSizing: 'border-box' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  backArrow: { fontSize: 18, color: '#0f172a', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  emptySub: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 19 },
  bookBtn: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  bookBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  list: { gap: 12 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#dbeafe',
    gap: 6,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardService: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0f172a' },
  cardStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  consultBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  cardMeta: { fontSize: 12, color: '#2563eb', fontWeight: '600' },
  cardId: { fontSize: 11, color: '#64748b' },
  cardScheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardSchedule: { fontSize: 12, color: '#475569' },
  rateBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rateBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  ratedHint: { marginTop: 4, fontSize: 12, fontWeight: '700', color: '#d97706' },

  quoteActionPill: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  quoteActionPillText: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '700',
  },

  otpPill: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 2,
  },
  otpPillText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '600',
  },
});
