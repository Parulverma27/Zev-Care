import React, { useState, useEffect, useMemo } from 'react';
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
import {
  checkProviderAvailability,
  normalizeCategoryName,
  getProviderCanonicalCategory,
  extractBookingTimeRange,
  formatDecimalToTime,
  formatDateKey,
} from '../../utils/scheduleUtils';

export default function AdminConsultationsScreen() {
  const { bookings, users, providers, acceptBooking, rejectBooking, assignProvider, generateBill, isCategoryAllowedForAdmin, adminUser } = useApp();
  const { bookingId: routeBookingId } = useParams();
  const navigate = useNavigate();

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [liveTrackingBooking, setLiveTrackingBooking] = useState(null);
  const [assignModal, setAssignModal] = useState(false);
  const [assignCategoryFilter, setAssignCategoryFilter] = useState('MATCHING'); // 'MATCHING' | 'ALL'
  const [assignDispatchSlotMode, setAssignDispatchSlotMode] = useState('TODAY'); // 'TODAY' | 'TOMORROW_10' | 'TOMORROW_14'
  const [conflictModalData, setConflictModalData] = useState(null); // { provider, avail }
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
  const [modalProviderTab, setModalProviderTab] = useState('overview');

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

  // Local state tracking accepted / rejected bookings
  const [acceptedState, setAcceptedState] = useState({});
  const [rejectedState, setRejectedState] = useState({});

  // Quote / Bill Builder Form State (Diagnostic visit charge is strictly ₹0 Free Guarantee)
  const [partsCharge, setPartsCharge] = useState('');
  const [labourCharge, setLabourCharge] = useState('');
  const [discount, setDiscount] = useState('0');
  const [billFormError, setBillFormError] = useState('');

  // Filter only My Mechanic / ₹0 Consultation Work Orders
  const isConsultationBk = (b) => Boolean(
    b?.isConsultation ||
    b?.is_consultation ||
    b?.booking_mode === 'consultation' ||
    b?.bookingMode === 'consultation' ||
    (b?.service_name && b.service_name.toLowerCase().includes('consultation')) ||
    (b?.service_name && b.service_name.toLowerCase().includes('diagnosis')) ||
    (b?.description && b.description.toLowerCase().includes('consultation'))
  );

  const activeConsultations = (bookings || []).filter((b) => {
    if (!isConsultationBk(b)) return false;
    if (typeof isCategoryAllowedForAdmin === 'function') {
      const cat = b.category_name || b.category || b.service_name || '';
      if (!isCategoryAllowedForAdmin(cat)) return false;
    }
    return true;
  });

  const availableCandidateProviders = (providers || []).filter((p) => {
    if (!adminUser || adminUser.role === 'SUPER_ADMIN') return true;
    if (typeof isCategoryAllowedForAdmin === 'function') {
      let pCats = Array.isArray(p.categories) ? [...p.categories] : (p.category ? [p.category] : []);
      if (pCats.length === 0 && p.categories_json) {
        try {
          const parsed = JSON.parse(p.categories_json);
          if (Array.isArray(parsed)) pCats = parsed;
        } catch (e) {}
      }
      return pCats.some((c) => isCategoryAllowedForAdmin(c));
    }
    return true;
  });

  const bookingCanonicalCategory = useMemo(() => {
    if (!selectedBooking) return null;
    return normalizeCategoryName(selectedBooking.category_name || selectedBooking.service_name);
  }, [selectedBooking]);

  const bookingTargetRange = useMemo(() => {
    if (!selectedBooking) return null;
    return extractBookingTimeRange(selectedBooking);
  }, [selectedBooking]);

  const selectedDispatchSlot = useMemo(() => {
    if (!selectedBooking) return null;
    const origRange = extractBookingTimeRange(selectedBooking);
    if (!origRange) return null;

    const now = new Date();
    const todayKey = formatDateKey(now);
    const nowDecimal = now.getHours() + now.getMinutes() / 60;

    if (origRange.isOverdue) {
      if (assignDispatchSlotMode === 'TOMORROW_10') {
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        const tomKey = formatDateKey(tom);
        return {
          dateKey: tomKey,
          startHour: 10.0,
          endHour: 10.0 + origRange.duration,
          duration: origRange.duration,
          timeLabel: `10:00 AM - ${formatDecimalToTime(10.0 + origRange.duration)}`,
          displayLabel: 'Tomorrow (10:00 AM)',
          isOverdueResolved: true,
          dateFormatted: `Tomorrow, 10:00 AM`,
          originalRange: origRange,
        };
      }
      if (assignDispatchSlotMode === 'TOMORROW_14') {
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        const tomKey = formatDateKey(tom);
        return {
          dateKey: tomKey,
          startHour: 14.0,
          endHour: 14.0 + origRange.duration,
          duration: origRange.duration,
          timeLabel: `02:00 PM - ${formatDecimalToTime(14.0 + origRange.duration)}`,
          displayLabel: 'Tomorrow (02:00 PM)',
          isOverdueResolved: true,
          dateFormatted: `Tomorrow, 02:00 PM`,
          originalRange: origRange,
        };
      }
      // Default: TODAY immediate
      const nearestHour = Math.min(19, Math.max(8, Math.ceil(nowDecimal * 2) / 2));
      return {
        dateKey: todayKey,
        startHour: nearestHour,
        endHour: nearestHour + origRange.duration,
        duration: origRange.duration,
        timeLabel: `${formatDecimalToTime(nearestHour)} - ${formatDecimalToTime(nearestHour + origRange.duration)}`,
        displayLabel: `Today (${formatDecimalToTime(nearestHour)})`,
        isOverdueResolved: true,
        dateFormatted: `Today, ${formatDecimalToTime(nearestHour)}`,
        originalRange: origRange,
      };
    }

    return origRange;
  }, [selectedBooking, assignDispatchSlotMode]);

  const candidateProvidersWithAvail = useMemo(() => {
    if (!assignModal || !selectedBooking) return [];
    return availableCandidateProviders.map((p) => {
      const pCat = getProviderCanonicalCategory(p);
      const avail = checkProviderAvailability(p, selectedBooking, bookings || [], selectedDispatchSlot);
      const matchesCategory = bookingCanonicalCategory ? pCat === bookingCanonicalCategory : true;
      return {
        ...p,
        providerCategory: pCat,
        matchesCategory,
        avail,
      };
    });
  }, [assignModal, selectedBooking, availableCandidateProviders, bookings, bookingCanonicalCategory, selectedDispatchSlot]);

  const displayedCandidateProviders = useMemo(() => {
    let list = candidateProvidersWithAvail;
    if (assignCategoryFilter === 'MATCHING' && bookingCanonicalCategory) {
      const matching = list.filter((p) => p.matchesCategory);
      if (matching.length > 0) {
        list = matching;
      }
    }
    return [...list].sort((a, b) => {
      const scoreA = (a.is_online !== false ? 10 : 0) + (a.avail?.isAvailable ? 5 : 0);
      const scoreB = (b.is_online !== false ? 10 : 0) + (b.avail?.isAvailable ? 5 : 0);
      return scoreB - scoreA;
    });
  }, [candidateProvidersWithAvail, assignCategoryFilter, bookingCanonicalCategory]);

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookings = activeConsultations.filter((b) => {
    if (categoryFilter !== 'ALL') {
      const cat = (b.category_name || b.category || '').toLowerCase();
      const sName = (b.service_name || '').toLowerCase();
      const subCat = (b.sub_category_name || '').toLowerCase();
      const combined = `${cat} ${sName} ${subCat}`;

      const f = categoryFilter.toLowerCase();
      if (f === 'electrical' || f === 'electrician') {
        if (!combined.includes('electr') && !combined.includes('mcb') && !combined.includes('switch') && !combined.includes('fan') && !combined.includes('wiring') && !combined.includes('geyser')) {
          return false;
        }
      } else if (f === 'plumbing') {
        if (!combined.includes('plumb') && !combined.includes('pipe') && !combined.includes('drain') && !combined.includes('tap') && !combined.includes('leak') && !combined.includes('tank')) {
          return false;
        }
      } else if (f === 'carpentry') {
        if (!combined.includes('carpent') && !combined.includes('wood') && !combined.includes('door') && !combined.includes('cupboard') && !combined.includes('furniture')) {
          return false;
        }
      } else if (f === 'pest control') {
        if (!combined.includes('pest') && !combined.includes('termite') && !combined.includes('cockroach') && !combined.includes('bedbug') && !combined.includes('spray')) {
          return false;
        }
      } else if (f === 'dry cleaning') {
        if (!combined.includes('clean') && !combined.includes('sofa') && !combined.includes('curtain') && !combined.includes('carpet') && !combined.includes('fabric')) {
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

  // Deep-link check
  useEffect(() => {
    if (!routeBookingId) return;
    const match = activeConsultations.find((b) => b.booking_id === routeBookingId);
    if (!match) return;
    setSelectedBooking(match);
    if (match.status === 'ASSIGNED_TO_ADMIN' || match.inspection_report) {
      setReportModal(true);
    } else {
      setReviewModal(true);
    }
  }, [routeBookingId, activeConsultations]);

  const closeBookingModals = () => {
    setReviewModal(false);
    setReportModal(false);
    setAssignModal(false);
    setBillModal(false);
    setViewBillModal(false);
    setSelectedBooking(null);
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
    const newScheduledDate = selectedDispatchSlot?.isOverdueResolved ? selectedDispatchSlot.dateFormatted : null;
    await assignProvider(selectedBooking.booking_id, providerId, newScheduledDate);
    setSubmitting(false);
    setAssignModal(false);
  };

  const openBillModalWithReport = (b) => {
    setSelectedBooking(b);
    setPartsCharge(b.parts_charge ? String(b.parts_charge) : '');
    setLabourCharge(b.labour_charge ? String(b.labour_charge) : '');
    setDiscount(String(b.discount_amount || 0));
    setBillFormError('');
    setBillModal(true);
  };

  const handleGenerateBillAction = async () => {
    if (!selectedBooking) return;

    const sCharge = 0; // Strictly ₹0 Free Diagnostic Inspection Guarantee
    const pCharge = Number(partsCharge || 0);
    const lCharge = Number(labourCharge || 0);
    const dAmount = Number(discount || 0);
    const total = sCharge + pCharge + lCharge - dAmount;

    if (![pCharge, lCharge, dAmount].every(Number.isFinite) || total < 0) {
      setBillFormError('Enter valid amounts (Parts & Labour). Total cannot be negative.');
      return;
    }
    setBillFormError('');
    setSubmitting(true);
    const payout = Math.round(total * 0.8);
    const isZeroFree = total === 0;
    const nextStatus = isZeroFree ? 'BOOKING_COMPLETED' : 'AWAITING_USER_APPROVAL';

    await generateBill(selectedBooking.booking_id, {
      service_charge: 0,
      parts_charge: pCharge,
      labour_charge: lCharge,
      discount: dAmount,
      total_bill: total,
      status: nextStatus,
      bill_status: isZeroFree ? 'PAID' : 'UNPAID',
      isConsultation: true,
      notes: isZeroFree
        ? 'Consultation concluded under Free ₹0 Diagnosis Guarantee (No parts or repairs required)'
        : 'Itemized Repair Quote for My Mechanic On-Site Inspection (Free ₹0 Diagnosis Guarantee)',
      parts_description: selectedBooking.parts_description,
    });

    const updatedBooking = {
      ...selectedBooking,
      service_charge: 0,
      parts_charge: pCharge,
      labour_charge: lCharge,
      discount_amount: dAmount,
      total_bill: total,
      payout_amount: payout,
      bill_status: isZeroFree ? 'PAID' : (selectedBooking.bill_status === 'PAID' ? 'PAID' : 'UNPAID'),
      bill_sent: true,
      bill_generated: true,
      status: nextStatus,
    };

    setSelectedBooking(updatedBooking);
    setSubmitting(false);
    setBillModal(false);
    setViewBillModal(true);
  };

  // Find all bookings with inspection reports
  const reportedBookings = activeConsultations.filter(
    (b) => b.status === 'ASSIGNED_TO_ADMIN' || b.inspection_report || b.resolution_video_url
  );

  const handleExportBookings = () => {
    const columns = [
      { label: 'Work Order ID', accessor: (b) => b.booking_id },
      { label: 'Customer Name', accessor: (b) => b.user_name || 'N/A' },
      { label: 'Customer Phone', accessor: (b) => b.user_phone || 'N/A' },
      { label: 'Service / Trade', accessor: (b) => b.service_name },
      { label: 'Field Technician', accessor: (b) => b.provider_name || 'Unassigned' },
      { label: 'Scheduled Date', accessor: (b) => b.scheduled_date || 'N/A' },
      { label: 'Status', accessor: (b) => b.status },
      { label: 'Diagnostic Visit Charge', accessor: () => '₹0 (Free Guarantee)' },
      { label: 'Parts Charge (INR)', accessor: (b) => (hasGeneratedBill(b) ? b.parts_charge || 0 : '') },
      { label: 'Labour Charge (INR)', accessor: (b) => (hasGeneratedBill(b) ? b.labour_charge || 0 : '') },
      { label: 'Total Quote (INR)', accessor: (b) => (hasGeneratedBill(b) ? b.total_bill || 0 : '') },
    ];
    exportToCSV(filteredBookings, columns, 'zevota_my_mechanic_orders');
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Text style={styles.title}>My Mechanic Orders & Free Inspections</Text>
            <View style={styles.zeroGuaranteeBadge}>
              <Text style={styles.zeroGuaranteeText}>₹0 Free Visit Guarantee • Not Under Plan</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Review on-site diagnostic inspection orders, audit technician field reports (live video walkthrough/photos/parts), dispatch certified technicians, and transmit upfront repair quotes.
          </Text>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExportBookings} activeOpacity={0.8}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <Text style={styles.exportBtnText}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      {/* METRICS / KPI SUMMARY BAR */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeConsultations.length}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#d97706' }]}>
            {activeConsultations.filter((b) => !b.is_accepted && b.status === 'PENDING_ADMIN_REVIEW').length}
          </Text>
          <Text style={styles.statLabel}>Pending Review</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#2563eb' }]}>
            {activeConsultations.filter((b) => ['PROVIDER_ASSIGNED', 'PROVIDER_ACCEPTED', 'PROVIDER_ON_THE_WAY', 'PROVIDER_ARRIVED', 'SERVICE_IN_PROGRESS'].includes(b.status)).length}
          </Text>
          <Text style={styles.statLabel}>Tech Dispatched</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#059669' }]}>
            {reportedBookings.length}
          </Text>
          <Text style={styles.statLabel}>Reports Received</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#7c3aed' }]}>
            {activeConsultations.filter((b) => b.status === 'AWAITING_USER_APPROVAL').length}
          </Text>
          <Text style={styles.statLabel}>Quotes Sent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#16a34a' }]}>
            {activeConsultations.filter((b) => b.status === 'BOOKING_COMPLETED' || b.bill_status === 'PAID').length}
          </Text>
          <Text style={styles.statLabel}>Repairs Completed</Text>
        </View>
      </View>

      {/* SEARCH AND CATEGORY FILTER BAR */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search work order ID, customer name, phone, trade, technician..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
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
        </ScrollView>
      </View>

      {/* WORK ORDERS TABLE */}
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.1 }]}>WORK ORDER</Text>
          <Text style={[styles.th, { flex: 1.4 }]}>CUSTOMER</Text>
          <Text style={[styles.th, { flex: 1.4 }]}>SERVICE & ISSUE</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>TECHNICIAN</Text>
          <Text style={[styles.th, { flex: 1.0 }]}>SCHEDULE</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>STATUS</Text>
          <Text style={[styles.th, { flex: 2.2 }]}>ACTIONS</Text>
        </View>

        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No My Mechanic Orders Found</Text>
            <Text style={styles.emptyStateSub}>No diagnostic requests match your filters or search keywords.</Text>
          </View>
        ) : (
          filteredBookings.map((b, idx) => {
            const isRejected = Boolean(rejectedState[b.booking_id] || b.status === 'ADMIN_REJECTED' || b.status === 'ESTIMATE_REJECTED');
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
              PROVIDER_ASSIGNED: 'TECH ASSIGNED',
              PROVIDER_ACCEPTED: 'TECH ACCEPTED',
              PROVIDER_ON_THE_WAY: 'EN ROUTE',
              PROVIDER_ARRIVED: 'ON SITE',
              ISSUE_INSPECTED: 'INSPECTED',
              ASSIGNED_TO_ADMIN: 'REPORT RECEIVED',
              AWAITING_USER_APPROVAL: 'QUOTE SENT',
              SERVICE_IN_PROGRESS: 'REPAIR IN PROGRESS',
              BOOKING_COMPLETED: 'COMPLETED',
              ADMIN_REJECTED: 'REJECTED',
              ESTIMATE_REJECTED: 'DECLINED (₹0)',
            };

            const displayStatus = statusLabels[b.status] || b.status?.replace(/_/g, ' ') || 'CONFIRMED';

            const statusStyles = {
              'PENDING REVIEW': { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
              ACCEPTED: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
              'TECH ASSIGNED': { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
              'TECH ACCEPTED': { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' },
              'EN ROUTE': { bg: '#fdf4ff', text: '#a21caf', border: '#f5d0fe' },
              'ON SITE': { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
              INSPECTED: { bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe' },
              'REPORT RECEIVED': { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
              'QUOTE SENT': { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
              'REPAIR IN PROGRESS': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
              COMPLETED: { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
              REJECTED: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
              'DECLINED (₹0)': { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
            };

            const pillStyle = statusStyles[displayStatus] || { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };

            const matchedUser = (users || []).find((u) => u.id === b.user_id || u.phone === b.user_phone) || {
              id: b.user_id || null,
              name: b.user_name || 'Customer',
              phone: b.user_phone || '—',
              address: b.address_text || b.address || '—',
            };

            const matchedProvider = (providers || []).find((p) => p.id === b.provider_id || p.name === b.provider_name) || {
              id: b.provider_id || null,
              name: b.provider_name || 'Unassigned',
              phone: '—',
              rating: null,
            };

            const hasBill = hasGeneratedBill(b);
            const isPaid = isBillPaid(b);

            return (
              <View key={idx} style={styles.tableRowContainer}>
                <View style={styles.tableRow}>
                  {/* WORK ORDER ID */}
                  <View style={{ flex: 1.1 }}>
                    <Text style={styles.tdBold}>{b.booking_id}</Text>
                    <View style={styles.zeroPillSmall}>
                      <Text style={styles.zeroPillSmallText}>₹0 Free Visit</Text>
                    </View>
                  </View>

                  {/* CUSTOMER */}
                  <TouchableOpacity
                    style={{ flex: 1.4 }}
                    onPress={() => { setModalUser(matchedUser); setModalUserVisible(true); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tdBold, { color: '#2563eb', textDecorationLine: 'underline' }]}>
                      {matchedUser.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>{matchedUser.phone}</Text>
                  </TouchableOpacity>

                  {/* SERVICE & ISSUE */}
                  <View style={{ flex: 1.4 }}>
                    <Text style={styles.tdBold}>{b.service_name || 'On-Site Diagnosis'}</Text>
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
                          View Media ({getAllBookingMediaItems(b).length})
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* TECHNICIAN */}
                  <TouchableOpacity
                    style={{ flex: 1.2 }}
                    onPress={() => { setModalProvider(matchedProvider); setModalProviderVisible(true); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.td, { color: '#7c3aed', fontWeight: '700' }]}>{matchedProvider.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <Text style={{ fontSize: 10.5, color: '#64748b' }}>{matchedProvider.rating || '5.0'}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* SCHEDULE */}
                  <Text style={[styles.td, { flex: 1.0 }]}>{b.scheduled_date || b.schedule || 'Today'}</Text>

                  {/* STATUS */}
                  <View style={{ flex: 1.2 }}>
                    <View style={[styles.statusPill, { backgroundColor: pillStyle.bg, borderColor: pillStyle.border, borderWidth: 1 }]}>
                      <Text style={[styles.statusPillText, { color: pillStyle.text }]}>
                        {displayStatus}
                      </Text>
                    </View>

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
                          {b.arrival_distance_m != null ? `On-Site (${b.arrival_distance_m}m)` : 'Doorstep Verified'}
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
                          Quote: ₹{Number(b.total_bill || 0).toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* ACTIONS */}
                  <View style={{ flex: 2.2, flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
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

                    {isAccepted && !isRejected && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionBtn, { backgroundColor: isAssigned ? '#4f46e5' : '#2563eb' }]}
                          onPress={() => {
                            setSelectedBooking(b);
                            setAssignModal(true);
                          }}
                        >
                          <Text style={styles.actionBtnText}>{isAssigned ? 'Reassign Tech' : 'Assign Tech'}</Text>
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
                            <Text style={styles.actionBtnText}>Create Quote</Text>
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
                              <Text style={styles.actionBtnText}>View Quote</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.actionBtn, { backgroundColor: '#7c3aed' }]}
                              onPress={() => openBillModalWithReport(b)}
                            >
                              <Text style={styles.actionBtnText}>Edit Quote</Text>
                            </TouchableOpacity>

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
                            <Text style={styles.actionBtnText}>Generate Quote</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>
                            Waiting for technician diagnosis
                          </Text>
                        )}
                      </>
                    )}

                    {isRejected && (
                      <Text style={styles.rejectedLabel}>
                        {b.status === 'ESTIMATE_REJECTED' ? 'Customer Declined Quote at ₹0 Visit Fee' : 'Order Rejected'}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* PROVIDER REPORT AUDIT MODAL (WITH NO OVERLAPPING ELEMENTS) */}
      <Modal visible={reportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 560, maxHeight: '90%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <View>
                <Text style={styles.modalTitle}>Technician On-Site Report & Video Audit</Text>
                <Text style={styles.modalSub}>
                  Work Order: {selectedBooking?.booking_id} • Assigned: {selectedBooking?.provider_name || 'Assigned Partner'}
                </Text>
              </View>
              <TouchableOpacity onPress={closeBookingModals} style={{ padding: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
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
                <View style={{ gap: 6, marginTop: 4 }}>
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
                <View style={{ gap: 6, marginTop: 8 }}>
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
                <Text style={styles.sendBillBtnText}>{hasGeneratedBill(selectedBooking) ? 'Edit Repair Quote' : 'Proceed to Create Quote'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeModalBtn} onPress={closeBookingModals}>
                <Text style={styles.closeModalBtnText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DISPATCH FIELD TECHNICIAN MODAL WITH SMART DISPATCH & TIMETABLE CONFLICT CHECK */}
      <Modal visible={assignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 660 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ gap: 3 }}>
                <Text style={styles.modalTitle}>Dispatch Field Technician</Text>
                <Text style={styles.modalSub}>
                  Work Order #{selectedBooking?.booking_id || '—'} • {bookingCanonicalCategory || 'General'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAssignModal(false)} activeOpacity={0.7} style={{ padding: 4 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </TouchableOpacity>
            </View>

            {/* If the original booking schedule is overdue / delayed */}
            {bookingTargetRange?.isOverdue && (
              <View style={{
                backgroundColor: '#fff7ed',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#fdba74',
                padding: 10,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
                marginTop: 10,
              }}>
                <View style={{ marginTop: 2 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#c2410c' }}>
                    Schedule Delayed / Overdue ({bookingTargetRange.dateKey})
                  </Text>
                  <Text style={{ fontSize: 11, color: '#9a3412', lineHeight: 16 }}>
                    Customer's requested slot was <Text style={{ fontWeight: '700' }}>{bookingTargetRange.dateKey} ({bookingTargetRange.timeLabel})</Text> ({bookingTargetRange.overdueDays} day{bookingTargetRange.overdueDays > 1 ? 's' : ''} ago). Technician dispatch will activate for the slot selected below.
                  </Text>
                </View>
              </View>
            )}

            {/* Target Window & Category Header Strip */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#f8fafc',
              padding: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              marginTop: 10,
              flexWrap: 'wrap',
              gap: 8,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <Text style={{ fontSize: 12, color: '#334155', fontWeight: '600' }}>
                  Dispatch Slot: <Text style={{ color: '#0f172a', fontWeight: '800' }}>
                    {selectedDispatchSlot ? `${selectedDispatchSlot.dateKey} (${selectedDispatchSlot.timeLabel})` : (selectedBooking?.scheduled_date || 'Standard Slot')}
                  </Text>
                  {selectedDispatchSlot?.isOverdueResolved && (
                    <Text style={{ color: '#2563eb', fontWeight: '700', fontSize: 11 }}> [Rescheduled]</Text>
                  )}
                </Text>
              </View>

              {/* Filter Switch Chips */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: assignCategoryFilter === 'MATCHING' ? '#7c3aed' : '#ffffff',
                    borderWidth: 1,
                    borderColor: assignCategoryFilter === 'MATCHING' ? '#7c3aed' : '#cbd5e1',
                  }}
                  onPress={() => setAssignCategoryFilter('MATCHING')}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: assignCategoryFilter === 'MATCHING' ? '#ffffff' : '#475569' }}>
                    {bookingCanonicalCategory} ({candidateProvidersWithAvail.filter((p) => p.matchesCategory).length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: assignCategoryFilter === 'ALL' ? '#7c3aed' : '#ffffff',
                    borderWidth: 1,
                    borderColor: assignCategoryFilter === 'ALL' ? '#7c3aed' : '#cbd5e1',
                  }}
                  onPress={() => setAssignCategoryFilter('ALL')}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: assignCategoryFilter === 'ALL' ? '#ffffff' : '#475569' }}>
                    All Categories ({candidateProvidersWithAvail.length})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Reschedule Strip if Overdue */}
            {bookingTargetRange?.isOverdue && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#ffffff',
                padding: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                marginTop: 6,
                flexWrap: 'wrap',
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Assign Window:</Text>
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: assignDispatchSlotMode === 'TODAY' ? '#0f172a' : '#f1f5f9',
                    borderWidth: 1,
                    borderColor: assignDispatchSlotMode === 'TODAY' ? '#0f172a' : '#e2e8f0',
                  }}
                  onPress={() => setAssignDispatchSlotMode('TODAY')}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 10.5, fontWeight: '700', color: assignDispatchSlotMode === 'TODAY' ? '#ffffff' : '#475569' }}>
                    Today (Immediate)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: assignDispatchSlotMode === 'TOMORROW_10' ? '#0f172a' : '#f1f5f9',
                    borderWidth: 1,
                    borderColor: assignDispatchSlotMode === 'TOMORROW_10' ? '#0f172a' : '#e2e8f0',
                  }}
                  onPress={() => setAssignDispatchSlotMode('TOMORROW_10')}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 10.5, fontWeight: '700', color: assignDispatchSlotMode === 'TOMORROW_10' ? '#ffffff' : '#475569' }}>
                    Tomorrow 10:00 AM
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: assignDispatchSlotMode === 'TOMORROW_14' ? '#0f172a' : '#f1f5f9',
                    borderWidth: 1,
                    borderColor: assignDispatchSlotMode === 'TOMORROW_14' ? '#0f172a' : '#e2e8f0',
                  }}
                  onPress={() => setAssignDispatchSlotMode('TOMORROW_14')}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 10.5, fontWeight: '700', color: assignDispatchSlotMode === 'TOMORROW_14' ? '#ffffff' : '#475569' }}>
                    Tomorrow 02:00 PM
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Candidate Providers List */}
            <ScrollView style={{ maxHeight: 380, marginTop: 12 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 10 }}>
                {displayedCandidateProviders.length > 0 ? (
                  displayedCandidateProviders.map((p) => {
                    const avail = p.avail;
                    const isBusy = avail?.statusLabel === 'BUSY';
                    const isAvail = avail?.isAvailable;
                    const isOff = avail?.isOffline;

                    return (
                      <View
                        key={p.id}
                        style={{
                          backgroundColor: isBusy ? '#fffaf5' : '#ffffff',
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: isBusy ? '#fed7aa' : '#e2e8f0',
                          padding: 12,
                          gap: 8,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                          <View style={{ flex: 1, gap: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <Text style={styles.candName}>{p.name}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                                <Text style={[styles.candName, { fontSize: 11, color: '#64748b' }]}>{p.rating ?? '—'}</Text>
                              </View>

                              {/* Canonical Category Badge */}
                              <View style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                                backgroundColor: '#f1f5f9',
                                borderWidth: 1,
                                borderColor: '#e2e8f0',
                              }}>
                                <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#475569' }}>
                                  {p.providerCategory}
                                </Text>
                              </View>

                              {/* Online / Offline status */}
                              <View style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                                backgroundColor: p.is_online !== false ? '#ecfdf5' : '#f1f5f9',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                              }}>
                                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: p.is_online !== false ? '#10b981' : '#94a3b8' }} />
                                <Text style={{ fontSize: 9, fontWeight: '700', color: p.is_online !== false ? '#047857' : '#64748b' }}>
                                  {p.is_online !== false ? 'ONLINE' : 'OFFLINE'}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.candSub}>{p.location || 'Hub Center'} · {p.phone || '—'}</Text>
                          </View>

                          {/* Action Buttons: Timetable & Dispatch */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <TouchableOpacity
                              style={{
                                paddingHorizontal: 9,
                                paddingVertical: 7,
                                borderRadius: 8,
                                backgroundColor: '#f5f3ff',
                                borderWidth: 1,
                                borderColor: '#ddd6fe',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                cursor: 'pointer',
                              }}
                              onPress={() => {
                                setModalProvider(p);
                                setModalProviderTab('schedule');
                                setModalProviderVisible(true);
                              }}
                              activeOpacity={0.8}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#7c3aed' }}>Timetable</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.assignSelectBtn,
                                isBusy && { backgroundColor: '#ea580c' },
                              ]}
                              onPress={() => {
                                if (isBusy) {
                                  setConflictModalData({ provider: p, avail });
                                } else {
                                  handleAssignAction(p.id);
                                }
                              }}
                              disabled={submitting}
                              activeOpacity={0.85}
                            >
                              <Text style={styles.assignSelectBtnText}>
                                {submitting
                                  ? 'Dispatching...'
                                  : isBusy
                                  ? 'Assign (Conflict)'
                                  : selectedDispatchSlot?.isOverdueResolved
                                  ? `Assign for ${selectedDispatchSlot.displayLabel ? selectedDispatchSlot.displayLabel.split(' ')[0] : 'Today'}`
                                  : 'Assign Technician'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Real-Time Timetable Availability Banner */}
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                          borderRadius: 6,
                          backgroundColor: isBusy ? '#fff7ed' : isAvail ? '#f0fdf4' : '#f8fafc',
                          borderWidth: 1,
                          borderColor: isBusy ? '#fed7aa' : isAvail ? '#bbf7d0' : '#e2e8f0',
                        }}>
                          {isBusy ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                          ) : isAvail ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                            </svg>
                          )}
                          <Text style={{
                            fontSize: 11,
                            fontWeight: '600',
                            color: isBusy ? '#c2410c' : isAvail ? '#15803d' : '#64748b',
                            flex: 1,
                          }}>
                            {isBusy
                              ? `Schedule Conflict: Booked on #${avail.conflictBooking?.booking_id || 'another job'} (${avail.timeRange?.timeLabel || 'overlapping time'})`
                              : selectedDispatchSlot?.isOverdueResolved
                              ? `✓ Overdue Resolved: Technician is Free for ${selectedDispatchSlot?.displayLabel || 'Today'}`
                              : isAvail
                              ? 'Free & Ready: No scheduling conflicts found for this slot'
                              : 'Technician currently off-duty'}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={{ padding: 24, alignItems: 'center', gap: 6 }}>
                    <Text style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                      No {assignCategoryFilter === 'MATCHING' ? bookingCanonicalCategory : ''} technicians found.
                    </Text>
                    {assignCategoryFilter === 'MATCHING' && (
                      <TouchableOpacity onPress={() => setAssignCategoryFilter('ALL')}>
                        <Text style={{ color: '#7c3aed', fontWeight: '700', fontSize: 12 }}>
                          View all registered technicians across categories
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.closeModalBtn, { marginTop: 14 }]} onPress={() => setAssignModal(false)}>
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SCHEDULING CONFLICT CONFIRMATION MODAL */}
      <Modal visible={!!conflictModalData} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 440, padding: 20 }]}>
            <View style={{ alignItems: 'center', gap: 8 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>
                Scheduling Conflict Detected
              </Text>
              <Text style={{ fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 18 }}>
                <Text style={{ fontWeight: '700', color: '#0f172a' }}>{conflictModalData?.provider?.name}</Text> is already booked for{' '}
                <Text style={{ fontWeight: '700', color: '#c2410c' }}>
                  #{conflictModalData?.avail?.conflictBooking?.booking_id || 'another job'}
                </Text>{' '}
                during this time window ({conflictModalData?.avail?.timeRange?.timeLabel || 'overlapping'}).
              </Text>
              <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                Assigning anyway will double-book this technician for two overlapping tasks.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#ea580c',
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                onPress={() => {
                  const provId = conflictModalData?.provider?.id;
                  setConflictModalData(null);
                  if (provId) handleAssignAction(provId);
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12.5 }}>Assign Anyway</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#f1f5f9',
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                onPress={() => setConflictModalData(null)}
              >
                <Text style={{ color: '#475569', fontWeight: '700', fontSize: 12.5 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BILL / QUOTE BUILDER MODAL WITH EMBEDDED TECHNICIAN REPORT */}
      <Modal visible={billModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 520 }]}>
            <Text style={styles.modalTitle}>Generate My Mechanic Repair Quote</Text>
            <Text style={styles.modalSub}>Build itemized quote for {selectedBooking?.booking_id || '—'}</Text>

            {/* EMBEDDED TECHNICIAN REPORT SUMMARY BOX */}
            <View style={styles.modalReportBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.modalReportTag}>TECHNICIAN INSPECTION REPORT</Text>
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
                  <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#1d4ed8' }}>Live Video Attached</Text>
                  </View>
                )}
                {Boolean(selectedBooking?.issue_media_url) && (
                  <Image source={{ uri: selectedBooking.issue_media_url }} style={styles.modalReportImg} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalReportItem}>Technician: <Text style={styles.boldText}>{selectedBooking?.provider_name || 'Assigned Partner'}</Text></Text>
                  <Text style={styles.modalReportItem}>Status: <Text style={styles.boldGreen}>{selectedBooking?.status}</Text></Text>
                </View>
              </View>
            </View>

            {/* Diagnostic Visit Fee Banner */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text style={styles.inputLabel}>Diagnostic Visit Fee</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#16a34a' }}>₹0 Visit Guarantee (Free Diagnostic Visit)</Text>
            </View>
            <TextInput style={[styles.textInput, { backgroundColor: '#f1f5f9' }]} value="₹0 (Free Guarantee • Not under any plan)" editable={false} />

            <Text style={styles.inputLabel}>Spare Parts Charge (₹)</Text>
            <TextInput style={styles.textInput} keyboardType="number-pad" value={partsCharge} onChangeText={setPartsCharge} placeholder="0" placeholderTextColor="#94a3b8" />

            <Text style={styles.inputLabel}>Labour & Workmanship Charge (₹)</Text>
            <TextInput style={styles.textInput} keyboardType="number-pad" value={labourCharge} onChangeText={setLabourCharge} placeholder="0" placeholderTextColor="#94a3b8" />

            <Text style={styles.inputLabel}>Discount (₹)</Text>
            <TextInput style={styles.textInput} keyboardType="number-pad" value={discount} onChangeText={setDiscount} placeholder="0" placeholderTextColor="#94a3b8" />

            <View style={styles.totalPreviewBox}>
              <Text style={styles.totalPreviewLabel}>TOTAL QUOTE SENT TO CUSTOMER:</Text>
              <Text style={styles.totalPreviewVal}>
                ₹{(Number(partsCharge || 0) + Number(labourCharge || 0) - Number(discount || 0)).toLocaleString()}
              </Text>
            </View>

            {!!billFormError && (
              <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '600', marginTop: 4 }}>{billFormError}</Text>
            )}

            <TouchableOpacity style={styles.sendBillBtn} onPress={handleGenerateBillAction} disabled={submitting}>
              <Text style={styles.sendBillBtnText}>
                {submitting
                  ? 'Processing...'
                  : (Number(partsCharge || 0) + Number(labourCharge || 0) - Number(discount || 0)) <= 0
                  ? 'Conclude Free Consultation (₹0 Due)'
                  : 'Send Quote to Customer'}
              </Text>
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
            <View style={{ backgroundColor: '#0f172a', padding: 20, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ backgroundColor: '#2563eb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>ZEVOTA CARE</Text>
                  </View>
                  <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>MY MECHANIC TAX INVOICE</Text>
                </View>
                <View style={{ backgroundColor: selectedBooking?.bill_status === 'PAID' ? '#166534' : '#1e3a8a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {selectedBooking?.bill_status === 'PAID' && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>
                    {selectedBooking?.bill_status === 'PAID' ? 'SETTLED & PAID' : 'PENDING APPROVAL'}
                  </Text>
                </View>
              </View>
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800', marginTop: 6 }}>
                Work Order #{selectedBooking?.booking_id}
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>
                Customer: {selectedBooking?.user_name} • Phone: {selectedBooking?.user_phone}
              </Text>
            </View>

            <ScrollView style={{ padding: 20, maxHeight: 420 }} contentContainerStyle={{ gap: 14 }}>
              <View style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#1d4ed8' }}>
                  ₹0 Free Diagnostic Visit Applied (No Subscription Required)
                </Text>
              </View>

              <View style={{ borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10, gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>ITEMIZED CHARGES</Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: '#334155' }}>Diagnostic Visit & Inspection</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#16a34a' }}>₹0 (Free Guarantee)</Text>
                </View>

                {Boolean(selectedBooking?.parts_charge) && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, color: '#334155' }}>Replacement Spare Parts</Text>
                      {Boolean(selectedBooking?.parts_description) && (
                        <Text style={{ fontSize: 11, color: '#64748b' }}>{selectedBooking.parts_description}</Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
                      ₹{Number(selectedBooking.parts_charge).toLocaleString()}
                    </Text>
                  </View>
                )}

                {Boolean(selectedBooking?.labour_charge) && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: '#334155' }}>Technician Labour & Workmanship</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
                      ₹{Number(selectedBooking.labour_charge).toLocaleString()}
                    </Text>
                  </View>
                )}

                {Boolean(selectedBooking?.discount_amount) && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: '#059669' }}>Promotional Discount</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669' }}>
                      -₹{Number(selectedBooking.discount_amount).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>TOTAL QUOTE:</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#2563eb' }}>
                  ₹{Number(selectedBooking?.total_bill || 0).toLocaleString()}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#0284c7', paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }]}
                onPress={() => downloadInvoicePDF(selectedBooking)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <Text style={[styles.actionBtnText, { fontSize: 13 }]}>Download Official PDF Quote / Bill</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setViewBillModal(false)}>
                <Text style={styles.closeModalBtnText}>Close Receipt</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Customer Detail Modal */}
      <UserProfileModal
        visible={modalUserVisible}
        user={modalUser}
        onClose={() => { setModalUserVisible(false); setModalUser(null); }}
      />

      {/* Field Partner Detail Modal */}
      <ProviderProfileModal
        visible={modalProviderVisible}
        provider={modalProvider}
        initialTab={modalProviderTab}
        onClose={() => { setModalProviderVisible(false); setModalProvider(null); setModalProviderTab('overview'); }}
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
                {mediaBooking?.service_name} ({mediaBooking?.category_name || 'General'})
              </Text>
              {mediaBooking?.issue ? (
                <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#2563eb' }}>
                  Issue: {mediaBooking.issue}
                </Text>
              ) : null}
            </View>

            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a', marginTop: 6 }}>Attached Media (Photos / Videos)</Text>
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 12 }}>
              {getAllBookingMediaItems(mediaBooking).length > 0 ? (
                getAllBookingMediaItems(mediaBooking).map((item, mIdx) => (
                  <View key={mIdx} style={{ gap: 6, backgroundColor: '#0f172a', padding: 8, borderRadius: 12, overflow: 'hidden' }}>
                    {item.type === 'video' ? (
                      <AdminVideoPlayer
                        src={item.uri}
                        label="Original Customer Video"
                        style={{ width: '100%', borderRadius: 8 }}
                      />
                    ) : (
                      <>
                        <Image source={{ uri: item.uri }} style={{ width: '100%', height: 260, borderRadius: 8 }} resizeMode="contain" />
                        <Text style={{ color: '#94a3b8', fontSize: 10.5, textAlign: 'center' }}>
                          Captured Photo {mIdx + 1}
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
              <View style={{ gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: liveTrackingBooking?.status === 'PROVIDER_ARRIVED' ? '#0e7490' : '#10b981' }} />
                  <Text style={styles.modalTitle}>Field Technician Real-Time Tracking</Text>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', gap: 3 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Assigned Technician</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#7c3aed' }}>
                  {liveTrackingBooking?.provider_name || 'Field Technician'}
                </Text>
                <Text style={{ fontSize: 11, color: '#475569' }}>
                  {liveTrackingBooking?.provider_phone || '+91 99887 76655'}
                </Text>
                {liveTrackingBooking?.status === 'PROVIDER_ARRIVED' ? (
                  <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#047857' }}>Doorstep Arrived</Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#1d4ed8' }}>En Route • GPS Active</Text>
                  </View>
                )}
              </View>

              <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', gap: 3 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Customer Destination</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
                  {liveTrackingBooking?.user_name || 'Customer'}
                </Text>
                <Text style={{ fontSize: 11, color: '#475569' }}>
                  {liveTrackingBooking?.user_phone || '—'}
                </Text>
                <Text style={{ fontSize: 10.5, color: '#64748b' }} numberOfLines={1}>
                  {liveTrackingBooking?.address_text || liveTrackingBooking?.address || 'Service Destination'}
                </Text>
              </View>
            </View>

            {liveTrackingBooking?.status === 'PROVIDER_ARRIVED' ? (
              <View style={{ backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', padding: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
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

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }}>
              <TouchableOpacity
                onPress={() => setLiveTrackingBooking(null)}
                style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
              >
                <Text style={{ color: '#475569', fontWeight: '700', fontSize: 12 }}>Close Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* RATING & REVIEW MODAL */}
      <Modal visible={reviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 440 }]}>
            <Text style={styles.modalTitle}>Customer Review & Rating</Text>
            <Text style={styles.modalSub}>Work Order: {selectedBooking?.booking_id}</Text>

            <View style={{ alignItems: 'center', marginVertical: 12, gap: 4 }}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {[1, 2, 3, 4, 5].map((s) => {
                  const filled = s <= (selectedBooking?.user_rating || 5);
                  return (
                    <svg key={s} width="22" height="22" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  );
                })}
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
                {selectedBooking?.user_rating || 5} out of 5 Stars
              </Text>
            </View>

            <Text style={styles.inputLabel}>Customer Feedback</Text>
            <Text style={styles.modalNotes}>
              {selectedBooking?.user_review || 'No written comment left by customer.'}
            </Text>

            <TouchableOpacity style={styles.closeModalBtn} onPress={closeBookingModals}>
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4, fontFamily: 'Inter, sans-serif', maxWidth: 740 },
  zeroGuaranteeBadge: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  zeroGuaranteeText: { fontSize: 11, fontWeight: '800', color: '#047857', fontFamily: 'Inter, sans-serif' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  exportBtnText: { color: '#2563eb', fontWeight: '700', fontSize: 12, fontFamily: 'Inter, sans-serif' },

  statsContainer: { flexDirection: 'row', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 130, backgroundColor: '#ffffff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  statLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2, fontFamily: 'Inter, sans-serif' },

  filterSection: { marginBottom: 16, gap: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#0f172a', fontFamily: 'Inter, sans-serif', outlineStyle: 'none' },
  filterScroll: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  filterPillActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterPillText: { fontSize: 12, color: '#64748b', fontWeight: '600', fontFamily: 'Inter, sans-serif' },
  filterPillTextActive: { color: '#ffffff', fontWeight: '700' },

  tableCard: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', marginBottom: 30 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  th: { fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' },
  tableRowContainer: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableRow: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  td: { fontSize: 12, color: '#334155', fontFamily: 'Inter, sans-serif' },
  tdBold: { fontSize: 13, fontWeight: '700', color: '#0f172a', fontFamily: 'Inter, sans-serif' },

  zeroPillSmall: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4, alignSelf: 'flex-start', marginTop: 3 },
  zeroPillSmallText: { fontSize: 9.5, fontWeight: '800', color: '#047857' },

  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  statusPillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' },

  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  actionBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '700', fontFamily: 'Inter, sans-serif' },
  rejectedLabel: { fontSize: 11, color: '#dc2626', fontWeight: '700' },

  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyStateTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  emptyStateSub: { fontSize: 12.5, color: '#64748b' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  modalSub: { fontSize: 12, color: '#64748b', marginTop: 2, marginBottom: 16, fontFamily: 'Inter, sans-serif' },
  modalNotes: { fontSize: 13, color: '#334155', backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', lineHeight: 18 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginTop: 10, marginBottom: 4, fontFamily: 'Inter, sans-serif' },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, fontSize: 13, color: '#0f172a', width: '100%', boxSizing: 'border-box' },

  modalReportBox: { backgroundColor: '#eff6ff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#bfdbfe', gap: 6, marginBottom: 12 },
  modalReportTag: { fontSize: 10.5, fontWeight: '800', color: '#1d4ed8', letterSpacing: 0.5 },
  modalReportNotes: { fontSize: 12, color: '#1e293b', lineHeight: 16 },
  boldText: { fontWeight: '700', color: '#0f172a' },
  boldGreen: { fontWeight: '700', color: '#16a34a' },
  modalReportRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalReportImg: { width: 50, height: 50, borderRadius: 6, backgroundColor: '#e2e8f0' },
  modalReportItem: { fontSize: 11, color: '#475569' },

  totalPreviewBox: { backgroundColor: '#f0fdf4', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0', marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalPreviewLabel: { fontSize: 11, fontWeight: '800', color: '#166534' },
  totalPreviewVal: { fontSize: 18, fontWeight: '800', color: '#166534' },

  sendBillBtn: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 14 },
  sendBillBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  closeModalBtn: { paddingVertical: 10, alignItems: 'center', marginTop: 6 },
  closeModalBtnText: { color: '#64748b', fontWeight: '600', fontSize: 12 },

  candidateList: { gap: 8, marginVertical: 10, maxHeight: 300 },
  candidateCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12 },
  candName: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  candSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  assignSelectBtn: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  assignSelectBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
});
