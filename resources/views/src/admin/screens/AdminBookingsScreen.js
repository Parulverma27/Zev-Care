import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Image } from 'react-native';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import UserProfileModal from '../components/UserProfileModal';
import ProviderProfileModal from '../components/ProviderProfileModal';
import AdminVideoPlayer from '../components/AdminVideoPlayer';
import { downloadInvoicePDF } from '../../utils/pdfInvoiceGenerator';
import { exportToCSV } from '../../utils/exportUtils';
import { hasGeneratedBill, isBillPaid } from '../../utils/billing';
import LiveProviderTrackingMap from '../../components/LiveProviderTrackingMap';

export default function AdminBookingsScreen() {
  const { bookings, users, providers, acceptBooking, rejectBooking, assignProvider, generateBill, isCategoryAllowedForAdmin, adminUser } = useApp();
  const { bookingId: routeBookingId } = useParams();
  const navigate = useNavigate();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [liveTrackingBooking, setLiveTrackingBooking] = useState(null);
  const [assignModal, setAssignModal] = useState(false);
  const [billModal, setBillModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [viewBillModal, setViewBillModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // User & Provider detail modal states
  const [modalUser, setModalUser] = useState(null);
  const [modalUserVisible, setModalUserVisible] = useState(false);
  const [modalProvider, setModalProvider] = useState(null);
  const [modalProviderVisible, setModalProviderVisible] = useState(false);

  // Customer Media Modal state
  const [customerMediaModal, setCustomerMediaModal] = useState(false);
  const [mediaBooking, setMediaBooking] = useState(null);

  const getAllBookingMediaItems = (b) => {
    if (!b) return [];
    const items = [];
    if (Array.isArray(b.issueMedia?.photos)) {
      b.issueMedia.photos.forEach((p) => {
        if (p?.uri) items.push({ type: 'photo', uri: p.uri });
      });
    }
    if (Array.isArray(b.issueMedia?.videos)) {
      b.issueMedia.videos.forEach((v) => {
        if (v?.uri) items.push({ type: 'video', uri: v.uri });
      });
    }
    const fallbackUrl = b.issue_media_url || b.mediaUrl || b.media_url;
    if (items.length === 0 && fallbackUrl) {
      items.push({ type: 'photo', uri: fallbackUrl });
    }
    return items;
  };

  // Local state tracking accepted bookings
  const [acceptedState, setAcceptedState] = useState({});
  const [rejectedState, setRejectedState] = useState({});

  // Bill Builder Form State
  const [serviceCharge, setServiceCharge] = useState('');
  const [partsCharge, setPartsCharge] = useState('');
  const [labourCharge, setLabourCharge] = useState('');
  const [discount, setDiscount] = useState('0');
  const [billFormError, setBillFormError] = useState('');

  // Strictly filter out "My Mechanic" / Free Consultations so Booking Operations only manages standard work orders
  // and scope by sub-admin assigned category if logged in as sub-admin
  const isConsultationBk = (b) => Boolean(b?.isConsultation || b?.is_consultation || b?.booking_mode === 'consultation' || b?.bookingMode === 'consultation');
  const activeBookings = (bookings || []).filter((b) => {
    if (isConsultationBk(b)) return false;
    if (typeof isCategoryAllowedForAdmin === 'function') {
      const cat = b.category_name || b.category || b.service_name || '';
      if (!isCategoryAllowedForAdmin(cat)) return false;
    }
    return true;
  });

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookings = activeBookings.filter((b) => {
    if (categoryFilter !== 'ALL') {
      const cat = (b.category_name || b.category || '').toLowerCase();
      const sName = (b.service_name || '').toLowerCase();
      const subCat = (b.sub_category_name || '').toLowerCase();
      const combined = `${cat} ${sName} ${subCat}`;

      const f = categoryFilter.toLowerCase();
      if (f === 'electrician' || f === 'electrical') {
        if (
          !combined.includes('electr') &&
          !combined.includes('mcb') &&
          !combined.includes('switch') &&
          !combined.includes('fan') &&
          !combined.includes('light') &&
          !combined.includes('wiring') &&
          !combined.includes('chandelier') &&
          !combined.includes('ac') &&
          !combined.includes('cooler') &&
          !combined.includes('geyser') &&
          !combined.includes('inverter') &&
          !combined.includes('appliance') &&
          !combined.includes('mixer')
        ) {
          return false;
        }
      } else if (f === 'plumbing') {
        if (
          !combined.includes('plumb') &&
          !combined.includes('pipe') &&
          !combined.includes('drain') &&
          !combined.includes('tap') &&
          !combined.includes('sink') &&
          !combined.includes('shower') &&
          !combined.includes('leak') &&
          !combined.includes('toilet') &&
          !combined.includes('tank')
        ) {
          return false;
        }
      } else if (f === 'carpentry') {
        if (
          !combined.includes('carpent') &&
          !combined.includes('wood') &&
          !combined.includes('door') &&
          !combined.includes('cupboard') &&
          !combined.includes('furniture') &&
          !combined.includes('bed') &&
          !combined.includes('chair') &&
          !combined.includes('table') &&
          !combined.includes('drawer')
        ) {
          return false;
        }
      } else if (f === 'pest control') {
        if (
          !combined.includes('pest') &&
          !combined.includes('termite') &&
          !combined.includes('cockroach') &&
          !combined.includes('bedbug') &&
          !combined.includes('rodent') &&
          !combined.includes('insect') &&
          !combined.includes('mosquito')
        ) {
          return false;
        }
      } else if (f === 'dry cleaning') {
        if (
          !combined.includes('dry clean') &&
          !combined.includes('cleaning') &&
          !combined.includes('sofa') &&
          !combined.includes('carpet') &&
          !combined.includes('mattress') &&
          !combined.includes('curtain') &&
          !combined.includes('deep clean')
        ) {
          return false;
        }
      } else if (!combined.includes(f)) {
        return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = (b.booking_id || '').toLowerCase().includes(q);
      const matchName = (b.user_name || '').toLowerCase().includes(q);
      const matchPhone = (b.user_phone || '').toLowerCase().includes(q);
      const matchService = (b.service_name || '').toLowerCase().includes(q);
      const matchCat = (b.category_name || '').toLowerCase().includes(q);
      const matchProv = (b.provider_name || '').toLowerCase().includes(q);
      const matchAddr = (b.address_text || b.address || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchPhone && !matchService && !matchCat && !matchProv && !matchAddr) {
        return false;
      }
    }
    return true;
  });

  // Deep-link: /admin/bookings/:bookingId opens that work order
  useEffect(() => {
    if (!routeBookingId) return;
    const match = activeBookings.find((b) => b.booking_id === routeBookingId);
    if (!match) return;
    setSelectedBooking(match);
    if (match.status === 'ASSIGNED_TO_ADMIN' || match.inspection_report) {
      setReportModal(true);
    } else {
      setReviewModal(true);
    }
  }, [routeBookingId, activeBookings]);

  const closeBookingModals = () => {
    setReviewModal(false);
    setReportModal(false);
    setAssignModal(false);
    setBillModal(false);
    setViewBillModal(false);
    setSelectedBooking(null);
    if (routeBookingId) {
      if (window?.history?.state && window.history.state.idx > 0) {
        navigate(-1);
      } else {
        navigate('/admin/bookings', { replace: true });
      }
    }
  };

  const handleAcceptClick = (b) => {
    setAcceptedState((prev) => ({ ...prev, [b.booking_id]: true }));
    setRejectedState((prev) => ({ ...prev, [b.booking_id]: false }));
    if (acceptBooking) acceptBooking(b.booking_id);
  };

  const handleRejectClick = (b) => {
    setRejectedState((prev) => ({ ...prev, [b.booking_id]: true }));
    setAcceptedState((prev) => ({ ...prev, [b.booking_id]: false }));
    if (rejectBooking) rejectBooking(b.booking_id);
  };

  const handleAssignAction = async (providerId) => {
    if (!selectedBooking) return;
    setSubmitting(true);
    await assignProvider(selectedBooking.booking_id, providerId);
    setSubmitting(false);
    setAssignModal(false);
  };

  const openBillModalWithReport = (b) => {
    setSelectedBooking(b);
    // Pre-fill only with what the provider reported / admin previously billed — never invented defaults.
    setPartsCharge(b.parts_charge ? String(b.parts_charge) : '');
    setLabourCharge(b.labour_charge ? String(b.labour_charge) : '');
    setServiceCharge(b.service_charge ? String(b.service_charge) : '');
    setDiscount(String(b.discount_amount || 0));
    setBillFormError('');
    setBillModal(true);
  };

  const handleGenerateBillAction = async () => {
    if (!selectedBooking) return;

    const sCharge = Number(serviceCharge || 0);
    const pCharge = Number(partsCharge || 0);
    const lCharge = Number(labourCharge || 0);
    const dAmount = Number(discount || 0);
    const total = sCharge + pCharge + lCharge - dAmount;
    if (![sCharge, pCharge, lCharge, dAmount].every(Number.isFinite) || total <= 0) {
      setBillFormError('Enter the bill amounts. Total must be greater than ₹0.');
      return;
    }
    setBillFormError('');
    setSubmitting(true);
    const payout = Math.round(total * 0.8);

    await generateBill(selectedBooking.booking_id, {
      service_charge: sCharge,
      parts_charge: pCharge,
      labour_charge: lCharge,
      discount: dAmount,
      notes: 'Itemized Zevota Estimate based on Provider Inspection Report',
    });

    const updatedBooking = {
      ...selectedBooking,
      service_charge: sCharge,
      parts_charge: pCharge,
      labour_charge: lCharge,
      discount_amount: dAmount,
      total_bill: total,
      payout_amount: payout,
      bill_status: selectedBooking.bill_status === 'PAID' ? 'PAID' : 'UNPAID',
      bill_sent: true,
      bill_generated: true,
      status: 'AWAITING_USER_APPROVAL',
    };

    setSelectedBooking(updatedBooking);
    setSubmitting(false);
    setBillModal(false);
    setViewBillModal(true);
  };

  // Find all bookings with inspection reports
  const reportedBookings = activeBookings.filter(
    (b) => b.status === 'ASSIGNED_TO_ADMIN' || b.inspection_report
  );

  const handleExportBookings = () => {
    const columns = [
      { label: 'Booking ID', accessor: (b) => b.booking_id },
      { label: 'Customer Name', accessor: (b) => b.user_name || 'N/A' },
      { label: 'Customer Phone', accessor: (b) => b.user_phone || 'N/A' },
      { label: 'Service Name', accessor: (b) => b.service_name },
      { label: 'Category', accessor: (b) => b.category_name || 'N/A' },
      { label: 'Field Partner', accessor: (b) => b.provider_name || 'Unassigned' },
      { label: 'Scheduled Date', accessor: (b) => b.scheduled_date || 'N/A' },
      { label: 'Status', accessor: (b) => b.status },
      { label: 'Service Charge (INR)', accessor: (b) => (hasGeneratedBill(b) ? b.service_charge || 0 : '') },
      { label: 'Parts Charge (INR)', accessor: (b) => (hasGeneratedBill(b) ? b.parts_charge || 0 : '') },
      { label: 'Labour Charge (INR)', accessor: (b) => (hasGeneratedBill(b) ? b.labour_charge || 0 : '') },
      { label: 'Discount (INR)', accessor: (b) => (hasGeneratedBill(b) ? b.discount_amount || 0 : '') },
      { label: 'Total Bill (INR)', accessor: (b) => (hasGeneratedBill(b) ? b.total_bill || 0 : '') },
      { label: 'Partner Payout (INR)', accessor: (b) => (hasGeneratedBill(b) ? b.payout_amount || Math.round((b.total_bill || 0) * 0.8) : '') },
      { label: 'Payment Status', accessor: (b) => (hasGeneratedBill(b) ? b.bill_status || 'UNPAID' : 'NOT BILLED') },
    ];
    exportToCSV('Zevota_Bookings_Report', columns, filteredBookings);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={styles.header}>
          <Text style={styles.title}>Booking Operations & Field Management</Text>
          <Text style={styles.subtitle}>Review work orders, inspect provider field reports (video/photos), assign field partners, and generate estimate bills.</Text>
        </View>

        <TouchableOpacity
          style={{ backgroundColor: '#059669', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}
          onPress={handleExportBookings}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Export Work Orders (CSV)</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Filter Toolbar with Category Pills and Search */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer, phone, booking ID, trade..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7} style={{ padding: 4 }}>
              <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Filter Pills */}
        <View style={styles.filterPillsRow}>
          {['ALL', 'Electrician', 'Plumbing', 'Carpentry', 'Pest Control', 'Dry Cleaning'].map((trade) => {
            const isActive = categoryFilter === trade;
            return (
              <TouchableOpacity
                key={trade}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setCategoryFilter(trade)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {trade}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bookings Table */}
      <View style={styles.tableCard}>
        {filteredBookings.length === 0 && (
          <View style={styles.emptyState}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            <Text style={styles.emptyStateTitle}>No work orders found</Text>
            <Text style={styles.emptyStateSub}>
              {searchQuery || categoryFilter !== 'ALL'
                ? 'Try adjusting your trade filters or search keywords.'
                : 'Service bookings placed by users will appear here for review & dispatch.'}
            </Text>
          </View>
        )}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.1 }]}>Booking ID</Text>
          <Text style={[styles.th, { flex: 1.4 }]}>Customer</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Service</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Field Partner</Text>
          <Text style={[styles.th, { flex: 1.0 }]}>Scheduled</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Status</Text>
          <Text style={[styles.th, { flex: 2.0 }]}>Actions & Field Reports</Text>
        </View>

        {filteredBookings.map((b, idx) => {
          const isRejected = Boolean(rejectedState[b.booking_id] || b.status === 'ADMIN_REJECTED');
          const isAccepted = Boolean(
            acceptedState[b.booking_id] ||
            b.is_accepted ||
            (b.status !== 'PENDING_ADMIN_REVIEW' && b.status !== 'ADMIN_REJECTED')
          );
          const hasInspection = b.status === 'ASSIGNED_TO_ADMIN' || Boolean(b.inspection_report) || Boolean(b.resolution_video_url) || Boolean(b.parts_description);
          const isAssigned = Boolean(b.provider_id || b.provider_name || (b.status !== 'PENDING_ADMIN_REVIEW' && b.status !== 'ADMIN_ACCEPTED'));

          const statusLabels = {
            PENDING_ADMIN_REVIEW: 'PENDING REVIEW',
            ADMIN_ACCEPTED: 'ACCEPTED',
            PROVIDER_ASSIGNED: 'PARTNER ASSIGNED',
            PROVIDER_ACCEPTED: 'PARTNER ACCEPTED',
            PROVIDER_ON_THE_WAY: 'EN ROUTE',
            PROVIDER_ARRIVED: 'ON SITE',
            ISSUE_INSPECTED: 'INSPECTED',
            ASSIGNED_TO_ADMIN: 'INSPECTION RECEIVED',
            AWAITING_USER_APPROVAL: 'AWAITING APPROVAL',
            SERVICE_IN_PROGRESS: 'IN PROGRESS',
            BOOKING_COMPLETED: 'COMPLETED',
            ADMIN_REJECTED: 'REJECTED',
          };

          let displayStatus = statusLabels[b.status] || b.status;
          if (isAccepted && b.status === 'PENDING_ADMIN_REVIEW') displayStatus = 'ACCEPTED';
          if (isRejected) displayStatus = 'REJECTED';

          const getStatusPillStyle = (status, accepted, rejected) => {
            if (rejected || status === 'ADMIN_REJECTED') {
              return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' };
            }
            switch (status) {
              case 'PENDING_ADMIN_REVIEW':
                return accepted
                  ? { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' }
                  : { bg: '#fffbeb', border: '#fde68a', text: '#b45309' };
              case 'ADMIN_ACCEPTED':
                return { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' };
              case 'PROVIDER_ASSIGNED':
              case 'PROVIDER_ACCEPTED':
                return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' };
              case 'PROVIDER_ON_THE_WAY':
                return { bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9' };
              case 'PROVIDER_ARRIVED':
                return { bg: '#ecfeff', border: '#a5f3fc', text: '#0e7490' };
              case 'ISSUE_INSPECTED':
              case 'ASSIGNED_TO_ADMIN':
                return { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857' };
              case 'AWAITING_USER_APPROVAL':
                return { bg: '#fff7ed', border: '#ffedd5', text: '#c2410c' };
              case 'SERVICE_IN_PROGRESS':
                return { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' };
              case 'BOOKING_COMPLETED':
                return { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534' };
              default:
                return { bg: '#f1f5f9', border: '#e2e8f0', text: '#475569' };
            }
          };

          const pillStyle = getStatusPillStyle(b.status, isAccepted, isRejected);

          // Resolve user & provider
          const cleanPhone = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');
          const matchedUser = (users || []).find((u) => u.id === b.user_id || (b.user_phone && cleanPhone(u.phone) === cleanPhone(b.user_phone))) || {
            id: b.user_id,
            name: b.user_name || b.userName || '—',
            phone: b.user_phone || '—',
            email: '',
            subscription_plan: null,
            wallet_balance: 0,
            property_verification_status: 'PENDING',
          };

          const matchedProvider = (providers || []).find((p) => p.id === b.provider_id || p.name === b.provider_name) || {
            id: b.provider_id || null,
            name: b.provider_name || 'Unassigned',
            phone: '—',
            rating: null,
            total_jobs: 0,
            earnings: 0,
            location: '—',
            is_online: false,
          };

          const hasBill = hasGeneratedBill(b);
          const isPaid = isBillPaid(b);

          return (
            <View key={idx} style={styles.tableRowContainer}>
              <View style={styles.tableRow}>
                <TouchableOpacity
                  style={{ flex: 1.1 }}
                  onPress={() => navigate(`/admin/bookings/${b.booking_id}`)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tdBold, { color: '#2563eb', textDecorationLine: 'underline' }]}>
                    {b.booking_id}
                  </Text>
                </TouchableOpacity>
                
                {/* Clickable Customer Name */}
                <TouchableOpacity
                  style={{ flex: 1.4 }}
                  onPress={() => { setModalUser(matchedUser); setModalUserVisible(true); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tdBold, { color: '#2563eb', textDecorationLine: 'underline' }]}>{matchedUser.name}</Text>
                  <Text style={{ fontSize: 11, color: '#64748b' }}>{matchedUser.phone}</Text>
                </TouchableOpacity>

                <View style={{ flex: 1.4 }}>
                  <Text style={styles.tdBold}>{b.service_name}</Text>
                  {Boolean(b.isConsultation || b.booking_mode === 'consultation') && (
                    <View style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1, alignSelf: 'flex-start', marginVertical: 2 }}>
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#1d4ed8' }}>₹0 FREE CONSULTATION</Text>
                    </View>
                  )}
                  {Boolean(b.applianceName) && (
                    <Text style={{ fontSize: 10.5, color: '#64748b' }}>Appliance: {b.applianceName}</Text>
                  )}
                  {Boolean(b.issue || b.issue_description) && (
                    <Text style={{ fontSize: 10.5, color: '#475569', fontStyle: 'italic' }} numberOfLines={1}>
                      {b.issue || b.issue_description}
                    </Text>
                  )}
                  {getAllBookingMediaItems(b).length > 0 && (
                    <TouchableOpacity
                      style={{
                        marginTop: 4,
                        backgroundColor: '#eff6ff',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: '#bfdbfe',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        alignSelf: 'flex-start',
                      }}
                      onPress={() => {
                        setMediaBooking(b);
                        setCustomerMediaModal(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#1d4ed8' }}>
                        View Photo ({getAllBookingMediaItems(b).length})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Clickable Provider Name */}
                <TouchableOpacity
                  style={{ flex: 1.2 }}
                  onPress={() => { setModalProvider(matchedProvider); setModalProviderVisible(true); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.td, { color: '#7c3aed', fontWeight: '700' }]}>{matchedProvider.name}</Text>
                  <Text style={{ fontSize: 10.5, color: '#64748b' }}>★ {matchedProvider.rating || '5.0'}</Text>
                </TouchableOpacity>

                <Text style={[styles.td, { flex: 1.0 }]}>{b.scheduled_date}</Text>

                <View style={{ flex: 1.2 }}>
                  <View style={[styles.statusPill, { backgroundColor: pillStyle.bg, borderColor: pillStyle.border, borderWidth: 1 }]}>
                    <Text style={[styles.statusPillText, { color: pillStyle.text }]}>
                      {displayStatus}
                    </Text>
                  </View>

                  {/* Geofence Doorstep Arrival Telemetry Badge */}
                  {b.status === 'PROVIDER_ARRIVED' && (
                    <TouchableOpacity
                      onPress={() => setLiveTrackingBooking(b)}
                      style={{ marginTop: 4, backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#a7f3d0', flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}
                      activeOpacity={0.8}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#047857' }}>
                        {b.arrival_distance_m != null ? `On-Site (${b.arrival_distance_m}m doorstep)` : 'Doorstep Verified'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {b.status === 'PROVIDER_ON_THE_WAY' && (
                    <TouchableOpacity
                      onPress={() => setLiveTrackingBooking(b)}
                      style={{ marginTop: 4, backgroundColor: '#f5f3ff', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#ddd6fe', flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}
                      activeOpacity={0.8}
                    >
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} />
                      <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#6d28d9' }}>
                        En Route • Live GPS
                      </Text>
                    </TouchableOpacity>
                  )}

                  {hasBill && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedBooking(b);
                        setViewBillModal(true);
                      }}
                      style={{ marginTop: 4, backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#bbf7d0', alignSelf: 'flex-start' }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#166534' }}>
                        Bill: ₹{Number(b.total_bill || 0).toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {Boolean(b.user_rating) && (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedBooking(b);
                        setReviewModal(true);
                      }}
                      style={{ marginTop: 4, backgroundColor: '#fffbeb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#fde68a', alignSelf: 'flex-start' }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#b45309' }}>
                        {'★'.repeat(b.user_rating)} ({b.user_rating}/5) · View review
                      </Text>
                    </TouchableOpacity>
                  )}
                  {!b.user_rating && b.rating_skipped && (
                    <View style={{ marginTop: 4, backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0', alignSelf: 'flex-start' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b' }}>Rating skipped</Text>
                    </View>
                  )}
                  {b.status === 'BOOKING_COMPLETED' && !b.user_rating && !b.rating_skipped && (
                    <View style={{ marginTop: 4, backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#bfdbfe', alignSelf: 'flex-start' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#1d4ed8' }}>Awaiting customer rating</Text>
                    </View>
                  )}
                </View>

                <View style={{ flex: 2.2, flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* STAGE 1: ACCEPT / REJECT BUTTONS */}
                  {!isAccepted && !isRejected && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#059669' }]}
                        onPress={() => handleAcceptClick(b)}
                      >
                        <Text style={styles.actionBtnText}>Accept</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#dc2626' }]}
                        onPress={() => handleRejectClick(b)}
                      >
                        <Text style={styles.actionBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* STAGE 2: AFTER ACCEPTANCE -> ASSIGN / REASSIGN PARTNER & GENERATE BILL */}
                  {isAccepted && !isRejected && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: isAssigned ? '#4f46e5' : '#2563eb' }]}
                        onPress={() => {
                          setSelectedBooking(b);
                          setAssignModal(true);
                        }}
                      >
                        <Text style={styles.actionBtnText}>{isAssigned ? 'Reassign Partner' : 'Assign Partner'}</Text>
                      </TouchableOpacity>

                      {/* LIVE TRACK BUTTON */}
                      {['PROVIDER_ASSIGNED', 'PROVIDER_ACCEPTED', 'PROVIDER_ON_THE_WAY', 'PROVIDER_ARRIVED', 'SERVICE_IN_PROGRESS'].includes(b.status) && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#7c3aed', flexDirection: 'row', alignItems: 'center', gap: 5 }]}
                          onPress={() => setLiveTrackingBooking(b)}
                          activeOpacity={0.8}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                            <line x1="8" y1="2" x2="8" y2="18" />
                            <line x1="16" y1="6" x2="16" y2="22" />
                          </svg>
                          <Text style={styles.actionBtnText}>
                            {b.status === 'PROVIDER_ARRIVED' ? 'Arrived (Map)' : 'Live Track'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {hasInspection && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#059669' }]}
                          onPress={() => {
                            setSelectedBooking(b);
                            setReportModal(true);
                          }}
                        >
                          <Text style={styles.actionBtnText}>View Report</Text>
                        </TouchableOpacity>
                      )}

                      {!hasBill && isAssigned && (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#7c3aed' }]}
                          onPress={() => openBillModalWithReport(b)}
                        >
                          <Text style={styles.actionBtnText}>Create Bill</Text>
                        </TouchableOpacity>
                      )}

                      {hasBill ? (
                        <>
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#059669' }]}
                            onPress={() => {
                              setSelectedBooking(b);
                              setViewBillModal(true);
                            }}
                          >
                            <Text style={styles.actionBtnText}>View Bill</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#7c3aed' }]}
                            onPress={() => openBillModalWithReport(b)}
                          >
                            <Text style={styles.actionBtnText}>Edit Bill</Text>
                          </TouchableOpacity>

                          {/* Download Bill button - only when paid */}
                          {isPaid && (
                            <TouchableOpacity
                              style={[styles.actionBtn, { backgroundColor: '#0284c7' }]}
                              onPress={() => downloadInvoicePDF(b)}
                              activeOpacity={0.8}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="7 10 12 15 17 10" />
                                  <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <Text style={styles.actionBtnText}>Download Bill</Text>
                              </View>
                            </TouchableOpacity>
                          )}
                        </>
                      ) : hasInspection ? (
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: '#7c3aed' }]}
                          onPress={() => openBillModalWithReport(b)}
                        >
                          <Text style={styles.actionBtnText}>Generate Bill</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>
                          Waiting for inspection report
                        </Text>
                      )}
                    </>
                  )}

                  {/* REJECTED BADGE */}
                  {isRejected && (
                    <Text style={styles.rejectedLabel}>Booking Rejected by Admin</Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* PROVIDER REPORT AUDIT MODAL */}
      <Modal visible={reportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 560, maxHeight: '90%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View>
                <Text style={styles.modalTitle}>Field Provider Inspection & Technical Report</Text>
                <Text style={styles.modalSub}>
                  Work Order: {selectedBooking?.booking_id} • Assigned: {selectedBooking?.provider_name || 'Assigned Partner'}
                </Text>
              </View>
              <TouchableOpacity onPress={closeBookingModals} style={{ padding: 6 }}>
                <Text style={{ fontSize: 18, color: '#64748b', fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ width: '100%' }} contentContainerStyle={{ gap: 12, paddingBottom: 12 }} showsVerticalScrollIndicator={true}>
              {/* 1. Root Cause & Technical Findings */}
              <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#1e40af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  1. Root Cause Diagnosis & Work Performed
                </Text>
                <Text style={{ fontSize: 13, color: '#0f172a', lineHeight: 18 }}>
                  {selectedBooking?.inspection_report || 'No technical report submitted yet.'}
                </Text>
              </View>

              {/* 2. Spare Parts Assessment */}
              <View style={{ backgroundColor: selectedBooking?.parts_used ? '#fffbeb' : '#ecfdf5', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: selectedBooking?.parts_used ? '#fde68a' : '#a7f3d0', gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: selectedBooking?.parts_used ? '#b45309' : '#047857', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    2. Spare Parts Assessment
                  </Text>
                  <View style={{ backgroundColor: selectedBooking?.parts_used ? '#f59e0b' : '#10b981', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#ffffff' }}>
                      {selectedBooking?.parts_used ? 'SPARE PARTS USED' : 'NO PARTS USED (SERVICE ONLY)'}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 12.5, color: '#0f172a', fontWeight: '600' }}>
                  {selectedBooking?.parts_description || (selectedBooking?.parts_used ? 'Spare parts required/installed' : 'No spare parts used. Only labor & service inspection performed.')}
                </Text>
              </View>

              {/* 3. Live Resolution Video Player */}
              {Boolean(selectedBooking?.resolution_video_url || (selectedBooking?.after_media_url && String(selectedBooking.after_media_url).includes('data:video/'))) && (
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#1e40af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    3. Live Resolution Video Walkthrough (10–25s)
                  </Text>
                  <AdminVideoPlayer
                    src={selectedBooking?.resolution_video_url || selectedBooking?.after_media_url}
                    label="Live Resolution Video Proof"
                    style={{ width: '100%', borderRadius: 10 }}
                  />
                </View>
              )}

              {/* 4. Live Defective Part / Work Done Photo Snapshot */}
              {Boolean(selectedBooking?.issue_media_url && !String(selectedBooking.issue_media_url).includes('data:video/')) && (
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#1e40af', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    4. Defective Part / On-Site Snapshot
                  </Text>
                  <View style={{ width: '100%', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#000000' }}>
                    <Image
                      source={{ uri: selectedBooking.issue_media_url }}
                      style={{ width: '100%', height: 200 }}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.sendBillBtn} onPress={() => { setReportModal(false); openBillModalWithReport(selectedBooking); }}>
                <Text style={styles.sendBillBtnText}>{hasGeneratedBill(selectedBooking) ? 'Edit Estimate Bill' : 'Proceed to Create Bill'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeModalBtn} onPress={closeBookingModals}>
                <Text style={styles.closeModalBtnText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PROVIDER ASSIGNMENT MODAL */}
      <Modal visible={assignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Field Partner</Text>
            <Text style={styles.modalSub}>Select best candidate for Work Order {selectedBooking?.booking_id}</Text>

            <View style={styles.candidateList}>
              {providers.length > 0 ? providers.map((p, idx) => (
                <View key={idx} style={styles.candidateCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.candName}>{p.name}  ★ {p.rating ?? '—'}</Text>
                    <Text style={styles.candSub}>{p.location || '—'} · {p.phone || '—'}</Text>
                  </View>
                  <TouchableOpacity style={styles.assignSelectBtn} onPress={() => handleAssignAction(p.id)} disabled={submitting}>
                    <Text style={styles.assignSelectBtnText}>{submitting ? 'Dispatching...' : 'Assign Partner'}</Text>
                  </TouchableOpacity>
                </View>
              )) : (
                <Text style={{ textAlign: 'center', color: '#64748b', padding: 12 }}>No providers available.</Text>
              )}
            </View>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setAssignModal(false)}>
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BILL BUILDER MODAL WITH EMBEDDED PROVIDER INSPECTION SUMMARY */}
      <Modal visible={billModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 520 }]}>
            <Text style={styles.modalTitle}>Generate Estimate Bill Builder</Text>
            <Text style={styles.modalSub}>Build itemized estimate for {selectedBooking?.booking_id || '—'}</Text>

            {/* EMBEDDED PROVIDER REPORT SUMMARY BOX INSIDE BILL BUILDER */}
            <View style={styles.modalReportBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.modalReportTag}>PROVIDER FIELD INSPECTION REPORT</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: selectedBooking?.parts_used ? '#b45309' : '#047857' }}>
                  {selectedBooking?.parts_used ? 'Spare Parts Used' : 'No Parts Used'}
                </Text>
              </View>
              <Text style={styles.modalReportNotes}>
                <Text style={styles.boldText}>Diagnosis:</Text> {selectedBooking?.inspection_report || 'No inspection report submitted yet.'}
              </Text>
              {Boolean(selectedBooking?.parts_description) && (
                <Text style={[styles.modalReportNotes, { marginTop: 3 }]}>
                  <Text style={styles.boldText}>Parts Detail:</Text> {selectedBooking?.parts_description}
                </Text>
              )}
              <View style={[styles.modalReportRow, { marginTop: 6, alignItems: 'center' }]}>
                {Boolean(selectedBooking?.resolution_video_url) && (
                  <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe' }}>
                    <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#1d4ed8' }}>📹 Live Video Attached</Text>
                  </View>
                )}
                {Boolean(selectedBooking?.issue_media_url) && (
                  <Image source={{ uri: selectedBooking.issue_media_url }} style={styles.modalReportImg} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalReportItem}>Provider: <Text style={styles.boldText}>{selectedBooking?.provider_name || 'Assigned Partner'}</Text></Text>
                  <Text style={styles.modalReportItem}>Status: <Text style={styles.boldGreen}>{selectedBooking?.status}</Text></Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text style={styles.inputLabel}>Service & Inspection Charge (₹)</Text>
              {Boolean(selectedBooking?.isConsultation || selectedBooking?.booking_mode === 'consultation') && (
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#16a34a' }}>₹0 Visit Guarantee (Free Diagnostic Visit)</Text>
              )}
            </View>
            <TextInput style={styles.textInput} keyboardType="number-pad" value={serviceCharge} onChangeText={setServiceCharge} placeholder="0" placeholderTextColor="#94a3b8" />

            <Text style={styles.inputLabel}>Spare Parts Charge (₹)</Text>
            <TextInput style={styles.textInput} keyboardType="number-pad" value={partsCharge} onChangeText={setPartsCharge} placeholder="0" placeholderTextColor="#94a3b8" />

            <Text style={styles.inputLabel}>Labour Charge (₹)</Text>
            <TextInput style={styles.textInput} keyboardType="number-pad" value={labourCharge} onChangeText={setLabourCharge} placeholder="0" placeholderTextColor="#94a3b8" />

            <Text style={styles.inputLabel}>Discount (₹)</Text>
            <TextInput style={styles.textInput} keyboardType="number-pad" value={discount} onChangeText={setDiscount} placeholder="0" placeholderTextColor="#94a3b8" />

            <View style={styles.totalPreviewBox}>
              <Text style={styles.totalPreviewLabel}>TOTAL BILL SENT TO USER:</Text>
              <Text style={styles.totalPreviewVal}>
                ₹{(Number(serviceCharge || 0) + Number(partsCharge || 0) + Number(labourCharge || 0) - Number(discount || 0)).toLocaleString()}
              </Text>
            </View>

            {!!billFormError && (
              <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '600', marginTop: 4 }}>{billFormError}</Text>
            )}

            <TouchableOpacity style={styles.sendBillBtn} onPress={handleGenerateBillAction} disabled={submitting}>
              <Text style={styles.sendBillBtnText}>{submitting ? 'Sending...' : 'Send Bill to User'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setBillModal(false)}>
              <Text style={styles.closeModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ITEMIZED GENERATED BILL INVOICE MODAL */}
      <Modal visible={viewBillModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 540, padding: 0, overflow: 'hidden' }]}>
            {/* Luxury Header */}
            <View style={{ backgroundColor: '#0f172a', padding: 20, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: '#2563eb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>ZEVOTA CARE</Text>
                  </View>
                  <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>TAX INVOICE / ESTIMATE RECEIPT</Text>
                </View>
                <View style={{ backgroundColor: selectedBooking?.bill_status === 'PAID' ? '#166534' : '#1e3a8a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>
                    {selectedBooking?.bill_status === 'PAID' ? 'PAID VIA WALLET' : 'AWAITING USER APPROVAL'}
                  </Text>
                </View>
              </View>
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800', marginTop: 6 }}>
                Invoice #{selectedBooking?.booking_id?.replace('BK-', 'INV-') || 'INV-2026-000125'}
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 11 }}>Work Order: {selectedBooking?.booking_id} • Service: {selectedBooking?.service_name}</Text>
            </View>

            <ScrollView style={{ padding: 20, maxHeight: 440 }} contentContainerStyle={{ gap: 16 }}>
              {/* Success Banner */}
              <View style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>✓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#166534' }}>Estimate Bill Generated & Sent Successfully</Text>
                  <Text style={{ fontSize: 11, color: '#15803d' }}>Itemized breakdown is now visible to customer for approval & wallet payment.</Text>
                </View>
              </View>

              {/* Customer & Partner Info Grid */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Customer Details</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 4 }}>{selectedBooking?.user_name || selectedBooking?.userName || '—'}</Text>
                  <Text style={{ fontSize: 11, color: '#475569' }}>{selectedBooking?.user_phone || '—'}</Text>
                  <Text style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }} numberOfLines={2}>{selectedBooking?.address_text || '—'}</Text>
                </View>

                <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Assigned Field Partner</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 4 }}>{selectedBooking?.provider_name || 'Unassigned'}</Text>
                  <Text style={{ fontSize: 11, color: '#475569' }}>Category: {selectedBooking?.category_name || '—'}</Text>
                  <Text style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>Field Inspection Complete</Text>
                </View>
              </View>

              {/* Itemized Table */}
              <View style={{ backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' }}>
                <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>ITEM & DESCRIPTION</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>AMOUNT</Text>
                </View>

                <View style={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#0f172a' }}>Service Visit & Field Inspection</Text>
                      <Text style={{ fontSize: 10.5, color: '#64748b' }}>Standard diagnostic & visit charges</Text>
                    </View>
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#0f172a' }}>₹{Number(selectedBooking?.service_charge || 0).toLocaleString()}</Text>
                  </View>

                  <View style={{ height: 1, backgroundColor: '#f1f5f9' }} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#0f172a' }}>Replacement Spare Parts</Text>
                      <Text style={{ fontSize: 10.5, color: '#64748b' }}>Original manufacturer components</Text>
                    </View>
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#0f172a' }}>₹{Number(selectedBooking?.parts_charge || 0).toLocaleString()}</Text>
                  </View>

                  <View style={{ height: 1, backgroundColor: '#f1f5f9' }} />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#0f172a' }}>Technician Labour & Workmanship</Text>
                      <Text style={{ fontSize: 10.5, color: '#64748b' }}>Field technician installation & testing</Text>
                    </View>
                    <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#0f172a' }}>₹{Number(selectedBooking?.labour_charge || 0).toLocaleString()}</Text>
                  </View>

                  {Number(selectedBooking?.discount_amount || 0) > 0 && (
                    <>
                      <View style={{ height: 1, backgroundColor: '#f1f5f9' }} />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#16a34a' }}>Special Discount Applied</Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#16a34a' }}>-₹{Number(selectedBooking?.discount_amount || 0).toLocaleString()}</Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Grand Total Box */}
                <View style={{ backgroundColor: '#1e3a8a', padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: '#bfdbfe', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>TOTAL ESTIMATE BILL AMOUNT</Text>
                    <Text style={{ color: '#ffffff', fontSize: 11 }}>Includes taxes and service charges</Text>
                  </View>
                  <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '900' }}>
                    ₹{Number(selectedBooking?.total_bill || 0).toLocaleString()}
                  </Text>
                </View>
              </View>


              {/* Actions */}
              <View style={{ gap: 10, marginTop: 4, marginBottom: 8 }}>
                {isBillPaid(selectedBooking) ? (
                  <TouchableOpacity
                    style={{ backgroundColor: '#2563eb', paddingVertical: 13, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                    onPress={() => downloadInvoicePDF(selectedBooking)}
                    activeOpacity={0.8}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <polyline points="9 15 12 18 15 15" />
                    </svg>
                    <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13.5 }}>Download Tax Invoice / Bill (PDF)</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ backgroundColor: '#f1f5f9', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: '#cbd5e1' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 11.5 }}>
                      Official Tax Invoice downloadable once customer approves & pays for service
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#7c3aed', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                    onPress={() => {
                      setViewBillModal(false);
                      openBillModalWithReport(selectedBooking);
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Edit / Modify Bill</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#0f172a', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                    onPress={() => setViewBillModal(false)}
                  >
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Done & Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Customer Rating Review Modal */}
      <Modal visible={reviewModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 480 }]}>
            <Text style={styles.modalTitle}>Customer review</Text>
            <Text style={styles.modalSub}>
              {selectedBooking?.booking_id} · {selectedBooking?.service_name}
            </Text>

            {selectedBooking?.user_rating ? (
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 22, color: '#d97706', fontWeight: '800' }}>
                  {'★'.repeat(selectedBooking.user_rating)} ({selectedBooking.user_rating}/5)
                </Text>
                {selectedBooking.issue_resolved ? (
                  <Text style={{ fontSize: 13, color: '#334155' }}>
                    Issue resolved:{' '}
                    <Text style={{ fontWeight: '700' }}>
                      {selectedBooking.issue_resolved === 'yes'
                        ? 'Yes, completely'
                        : selectedBooking.issue_resolved === 'partial'
                          ? 'Partially'
                          : 'No'}
                    </Text>
                  </Text>
                ) : null}
                {selectedBooking.user_feedback ? (
                  <Text style={{ fontSize: 14, color: '#0f172a', fontStyle: 'italic', lineHeight: 20 }}>
                    &ldquo;{selectedBooking.user_feedback}&rdquo;
                  </Text>
                ) : (
                  <Text style={{ fontSize: 13, color: '#64748b' }}>No written feedback.</Text>
                )}
                {Array.isArray(selectedBooking.feedback_tags) && selectedBooking.feedback_tags.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {selectedBooking.feedback_tags.map((t) => (
                      <View key={t} style={{ backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#1d4ed8' }}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {Array.isArray(selectedBooking.rating_photos) && selectedBooking.rating_photos.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {selectedBooking.rating_photos.map((uri, i) => (
                      <Image
                        key={`ar-${i}`}
                        source={{ uri }}
                        style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#e2e8f0' }}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                )}
                {selectedBooking.rating_submitted_at ? (
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                    Submitted {new Date(selectedBooking.rating_submitted_at).toLocaleString()}
                  </Text>
                ) : null}
              </View>
            ) : selectedBooking?.rating_skipped ? (
              <Text style={{ fontSize: 14, color: '#64748b' }}>Customer skipped rating.</Text>
            ) : (
              <Text style={{ fontSize: 14, color: '#64748b' }}>No customer rating yet.</Text>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#0f172a', marginTop: 16, alignSelf: 'stretch' }]}
              onPress={closeBookingModals}
            >
              <Text style={styles.actionBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Customer Profile Detail Modal */}
      <UserProfileModal
        visible={modalUserVisible}
        user={modalUser}
        onClose={() => { setModalUserVisible(false); setModalUser(null); }}
      />

      {/* Field Partner Detail Modal */}
      <ProviderProfileModal
        visible={modalProviderVisible}
        provider={modalProvider}
        onClose={() => { setModalProviderVisible(false); setModalProvider(null); }}
      />

      {/* Customer Uploaded Photo & Media Modal */}
      <Modal visible={customerMediaModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 540 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ gap: 2 }}>
                <Text style={styles.modalTitle}>Customer Uploaded Photo & Media</Text>
                <Text style={styles.modalSub}>
                  Work Order: {mediaBooking?.booking_id} • Customer: {mediaBooking?.user_name || '—'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCustomerMediaModal(false)}>
                <Text style={{ fontSize: 22, color: '#64748b', fontWeight: '700' }}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', gap: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Service & Issue Details</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                {mediaBooking?.service_name} ({mediaBooking?.category_name})
              </Text>
              {mediaBooking?.applianceName ? (
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569' }}>
                  Appliance: {mediaBooking.applianceName}
                </Text>
              ) : null}
              {mediaBooking?.issue ? (
                <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#2563eb' }}>
                  Issue: {mediaBooking.issue}
                </Text>
              ) : null}
              {mediaBooking?.issue_description || mediaBooking?.issueDescription ? (
                <Text style={{ fontSize: 12, color: '#334155', fontStyle: 'italic', marginTop: 2 }}>
                  "{mediaBooking?.issue_description || mediaBooking?.issueDescription}"
                </Text>
              ) : null}
            </View>

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a', marginTop: 6 }}>Attached Media (Photos / Videos)</Text>
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 12 }}>
              {getAllBookingMediaItems(mediaBooking).length > 0 ? (
                getAllBookingMediaItems(mediaBooking).map((item, index) => (
                  <View key={index} style={{ gap: 6, backgroundColor: '#0f172a', padding: 8, borderRadius: 12, overflow: 'hidden' }}>
                    {item.type === 'video' ? (
                      <AdminVideoPlayer
                        src={item.uri}
                        label="Original Customer Video"
                      />
                    ) : (
                      <>
                        <Image source={{ uri: item.uri }} style={{ width: '100%', height: 260, borderRadius: 8 }} resizeMode="contain" />
                        <Text style={{ color: '#94a3b8', fontSize: 10.5, textAlign: 'center' }}>
                          Captured Photo {index + 1}
                        </Text>
                      </>
                    )}
                  </View>
                ))
              ) : (
                <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: 20 }}>
                  No photo attached for this booking.
                </Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#0f172a', marginTop: 8, paddingVertical: 12, alignSelf: 'stretch' }]}
              onPress={() => setCustomerMediaModal(false)}
            >
              <Text style={styles.actionBtnText}>Close Media Viewer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* LIVE DISPATCH & GOOGLE MAPS TRACKING MODAL */}
      <Modal
        visible={Boolean(liveTrackingBooking)}
        transparent
        animationType="fade"
        onRequestClose={() => setLiveTrackingBooking(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 680, padding: 20 }]}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
              <View style={{ gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: liveTrackingBooking?.status === 'PROVIDER_ARRIVED' ? '#0e7490' : '#10b981' }} />
                  <Text style={styles.modalTitle}>Field Partner Real-Time Tracking</Text>
                </View>
                <Text style={styles.modalSub}>
                  Work Order #{liveTrackingBooking?.booking_id} • Service: {liveTrackingBooking?.service_name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setLiveTrackingBooking(null)}
                style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#64748b' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Telemetry Summary Cards */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              {/* Technician Card */}
              <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', gap: 3 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Assigned Technician</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#7c3aed' }}>
                  {liveTrackingBooking?.provider_name || 'Rajesh Sharma'}
                </Text>
                <Text style={{ fontSize: 11, color: '#475569' }}>
                  {liveTrackingBooking?.provider_phone || '+91 99887 76655'}
                </Text>
                {liveTrackingBooking?.status === 'PROVIDER_ARRIVED' ? (
                  <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#047857' }}>✓ Doorstep Arrived</Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#1d4ed8' }}>En Route • GPS Active</Text>
                  </View>
                )}
              </View>

              {/* Customer Destination Card */}
              <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', gap: 3 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Customer Destination</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
                  {liveTrackingBooking?.user_name || liveTrackingBooking?.userName || 'Customer'}
                </Text>
                <Text style={{ fontSize: 11, color: '#475569' }}>
                  {liveTrackingBooking?.user_phone || '—'}
                </Text>
                <Text style={{ fontSize: 10.5, color: '#64748b' }} numberOfLines={1}>
                  {liveTrackingBooking?.address_text || liveTrackingBooking?.address || 'DLF Phase 2, Gurugram'}
                </Text>
              </View>
            </View>

            {/* Geofence Check-in Banner */}
            {liveTrackingBooking?.status === 'PROVIDER_ARRIVED' ? (
              <View style={{ backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', padding: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>✓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#065f46' }}>
                    Doorstep Arrival Verified via GPS Geofence
                  </Text>
                  <Text style={{ fontSize: 11, color: '#047857' }}>
                    Technician verified within {liveTrackingBooking?.arrival_distance_m || 35} meters of customer doorstep.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Live Google Maps Tracking Component */}
            <View style={{ width: '100%', marginTop: 2 }}>
              <LiveProviderTrackingMap
                customerCoords={{
                  lat: Number(liveTrackingBooking?.customer_lat || liveTrackingBooking?.lat || 28.4986),
                  lng: Number(liveTrackingBooking?.customer_lng || liveTrackingBooking?.lng || 77.0878),
                }}
                customerAddress={liveTrackingBooking?.address_text || liveTrackingBooking?.address || 'Service Destination'}
                providerName={liveTrackingBooking?.provider_name || 'Technician'}
                providerPhone={liveTrackingBooking?.provider_phone || ''}
                providerCoords={
                  liveTrackingBooking?.provider_coords || (liveTrackingBooking?.provider_lat && liveTrackingBooking?.provider_lng ? { lat: Number(liveTrackingBooking.provider_lat), lng: Number(liveTrackingBooking.provider_lng) } : null)
                }
                bookingStatus={liveTrackingBooking?.status || 'PROVIDER_ON_THE_WAY'}
                lastUpdatedAt={liveTrackingBooking?.last_location_update || null}
                mapHeight={320}
              />
            </View>

            {/* Footer Actions */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  const pLat = liveTrackingBooking?.provider_coords?.lat || liveTrackingBooking?.provider_lat || 28.4986;
                  const pLng = liveTrackingBooking?.provider_coords?.lng || liveTrackingBooking?.provider_lng || 77.0878;
                  const cLat = liveTrackingBooking?.customer_lat || liveTrackingBooking?.lat || 28.4986;
                  const cLng = liveTrackingBooking?.customer_lng || liveTrackingBooking?.lng || 77.0878;
                  const url = `https://www.google.com/maps/dir/?api=1&origin=${pLat},${pLng}&destination=${cLat},${cLng}`;
                  if (typeof window !== 'undefined') window.open(url, '_blank');
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, cursor: 'pointer' }}
                activeOpacity={0.8}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#2563eb' }}>Open Full Google Maps Route</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setLiveTrackingBooking(null)}
                style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, cursor: 'pointer' }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>Close Tracking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, gap: 16 },
  header: { gap: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b' },

  topReportCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 18, borderWidth: 2, borderColor: '#059669', gap: 12 },
  topReportHeader: { gap: 2, borderBottomWidth: 1, borderBottomColor: '#ecfdf5', pb: 8 },
  topReportTitle: { fontSize: 14, fontWeight: '600', color: '#047857' },
  topReportSub: { fontSize: 12, color: '#64748b' },

  reportRowCard: { backgroundColor: '#f0fdf4', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#a7f3d0', gap: 8 },
  reportCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportWorkId: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  reportCust: { fontSize: 12, color: '#475569', marginTop: 2 },
  boldGreen: { color: '#059669', fontWeight: '600' },

  viewFullBtn: { backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  viewFullBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },

  reportNotes: { fontSize: 13, color: '#1e293b', backgroundColor: '#ffffff', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  boldText: { fontWeight: '700', color: '#0f172a' },

  reportCardBottom: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  mediaThumbBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mediaThumbImg: { width: 48, height: 48, borderRadius: 8 },
  mediaLabel: { fontSize: 10, color: '#047857', fontWeight: '600' },

  costBoxInline: { flex: 1, backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#a7f3d0' },
  costItemInline: { fontSize: 11, color: '#475569' },
  costTotalInline: { fontSize: 12, fontWeight: '600', color: '#15803d', marginTop: 2 },

  generateBillQuickBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  generateBillQuickBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 12 },

  tableCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0f172a', padding: 14 },
  th: { color: '#94a3b8', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  tableRowContainer: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableRow: { flexDirection: 'row', padding: 14, alignItems: 'center' },
  tdBold: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  td: { fontSize: 13, color: '#334155' },

  emptyState: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyStateTitle: { fontSize: 16, fontWeight: '700', color: '#64748b' },
  emptyStateSub: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 18, maxWidth: 320 },

  statusPill: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  statusPillText: { fontSize: 10, fontWeight: '600', color: '#1d4ed8' },
  acceptedPill: { backgroundColor: '#f0fdf4' },
  acceptedPillText: { color: '#15803d' },
  rejectedPill: { backgroundColor: '#fef2f2' },
  rejectedPillText: { color: '#dc2626' },

  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  actionBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 11 },

  rejectedLabel: { fontSize: 12, color: '#dc2626', fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, width: '100%', maxWidth: 480, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  modalSub: { fontSize: 12, color: '#64748b' },
  modalNotes: { fontSize: 13, color: '#334155', backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },

  modalReportBox: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#a7f3d0', gap: 6, marginVertical: 4 },
  modalReportTag: { fontSize: 10, fontWeight: '600', color: '#166534' },
  modalReportNotes: { fontSize: 12, color: '#1e293b' },
  modalReportRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  modalReportImg: { width: 44, height: 44, borderRadius: 6 },
  modalReportItem: { fontSize: 11, color: '#334155' },

  modalMediaBox: { height: 160, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#cbd5e1' },
  modalMediaImg: { width: '100%', height: '100%' },

  candidateList: { gap: 10, marginVertical: 8 },
  candidateCard: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', flexDirection: 'row', alignItems: 'center' },
  candName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  candSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  assignSelectBtn: { backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  assignSelectBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 11 },

  inputLabel: { fontSize: 11, fontWeight: '600', color: '#475569' },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 13, color: '#0f172a' },

  totalPreviewBox: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  totalPreviewLabel: { fontSize: 11, fontWeight: '600', color: '#166534' },
  totalPreviewVal: { fontSize: 20, fontWeight: '700', color: '#15803d' },

  sendBillBtn: { backgroundColor: '#7c3aed', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  sendBillBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },

  closeModalBtn: { paddingVertical: 8, alignItems: 'center' },
  closeModalBtnText: { color: '#64748b', fontWeight: '600', fontSize: 13 },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0f172a',
    outlineStyle: 'none',
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    cursor: 'pointer',
  },
  filterPillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterPillText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
