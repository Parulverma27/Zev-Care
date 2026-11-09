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
import { SPARE_PARTS_CATALOG, ZEVOTA_PARTS_GUARANTEE_PRICE, getApplicablePartsForService } from '../../config/sparePartsCatalog';
import {
  checkProviderAvailability,
  normalizeCategoryName,
  getProviderCanonicalCategory,
  extractBookingTimeRange,
  formatDecimalToTime,
  formatDateKey,
} from '../../utils/scheduleUtils';

export default function AdminBookingsScreen() {
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

  const isVideoMedia = (uri, typeHint) => {
    if (typeHint === 'video') return true;
    if (!uri || typeof uri !== 'string') return false;
    const clean = uri.trim().toLowerCase();
    if (clean.startsWith('auto-verified://')) return false;
    return (
      clean.startsWith('data:video/') ||
      clean.includes('.webm') ||
      clean.includes('.mp4') ||
      clean.includes('.mov') ||
      clean.includes('.mkv') ||
      clean.includes('video') ||
      (clean.startsWith('blob:') && typeHint !== 'photo')
    );
  };

  const getAllBookingMediaItems = (b) => {
    if (!b) return [];
    const items = [];
    const seenUris = new Set();

    if (Array.isArray(b.issueMedia?.videos)) {
      b.issueMedia.videos.forEach((v) => {
        if (v?.uri && !seenUris.has(v.uri)) {
          seenUris.add(v.uri);
          items.push({ type: 'video', uri: v.uri });
        }
      });
    }
    if (Array.isArray(b.issueMedia?.photos)) {
      b.issueMedia.photos.forEach((p) => {
        if (p?.uri && !seenUris.has(p.uri)) {
          seenUris.add(p.uri);
          items.push({ type: isVideoMedia(p.uri, p.type) ? 'video' : 'photo', uri: p.uri });
        }
      });
    }
    const fallbackUrl = b.issue_media_url || b.mediaUrl || b.media_url;
    if (items.length === 0 && fallbackUrl && !seenUris.has(fallbackUrl)) {
      seenUris.add(fallbackUrl);
      const isVideo = isVideoMedia(fallbackUrl, b.issue_media_type || b.media_type || b.type);
      items.push({ type: isVideo ? 'video' : 'photo', uri: fallbackUrl });
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
  const [partsGuaranteeActive, setPartsGuaranteeActive] = useState(false);
  const [selectedPartName, setSelectedPartName] = useState('');

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
  const [slaFilter, setSlaFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 60-Minute SLA Tracker calculation
  const getSlaStatus = (b) => {
    if (!b) return null;
    if (['ADMIN_REJECTED', 'ESTIMATE_REJECTED'].includes(b.status)) return null;

    if (['PROVIDER_ARRIVED', 'SERVICE_IN_PROGRESS', 'BOOKING_COMPLETED', 'COMPLETED'].includes(b.status)) {
      return {
        label: '60m SLA Met',
        status: 'MET',
        bg: '#ecfdf5',
        text: '#047857',
        border: '#a7f3d0',
      };
    }

    let startMs = b.created_at ? new Date(b.created_at).getTime() : null;
    if (!startMs || isNaN(startMs)) {
      const num = parseInt((b.booking_id || '').replace(/\D/g, '').slice(-2), 10) || 20;
      startMs = Date.now() - (num % 55) * 60 * 1000;
    }

    const elapsedMins = Math.floor((Date.now() - startMs) / 60000);
    const remainingMins = 60 - elapsedMins;

    if (remainingMins <= 0) {
      return {
        label: `Overdue (${Math.abs(remainingMins)}m)`,
        status: 'BREACHED',
        bg: '#fef2f2',
        text: '#dc2626',
        border: '#fecaca',
        remainingMins,
      };
    } else if (remainingMins <= 25) {
      return {
        label: `${remainingMins}m left`,
        status: 'URGENT',
        bg: '#fffbeb',
        text: '#b45309',
        border: '#fde68a',
        remainingMins,
      };
    } else {
      return {
        label: `${remainingMins}m left`,
        status: 'ON_TRACK',
        bg: '#eff6ff',
        text: '#1d4ed8',
        border: '#bfdbfe',
        remainingMins,
      };
    }
  };

  const slaStats = useMemo(() => {
    let urgent = 0;
    let breached = 0;
    let onTrack = 0;
    let unassigned = 0;

    activeBookings.forEach((b) => {
      if (!b.provider_id && !b.provider_name && !['BOOKING_COMPLETED', 'ADMIN_REJECTED'].includes(b.status)) {
        unassigned++;
      }
      const s = getSlaStatus(b);
      if (s) {
        if (s.status === 'URGENT') urgent++;
        else if (s.status === 'BREACHED') breached++;
        else if (s.status === 'ON_TRACK') onTrack++;
      }
    });

    return { urgent, breached, onTrack, unassigned, total: activeBookings.length };
  }, [activeBookings]);

  const filteredBookings = activeBookings.filter((b) => {
    if (slaFilter === 'URGENT') {
      const s = getSlaStatus(b);
      if (!s || s.status !== 'URGENT') return false;
    } else if (slaFilter === 'BREACHED') {
      const s = getSlaStatus(b);
      if (!s || s.status !== 'BREACHED') return false;
    } else if (slaFilter === 'UNASSIGNED') {
      if (b.provider_id || b.provider_name || ['BOOKING_COMPLETED', 'ADMIN_REJECTED'].includes(b.status)) return false;
    } else if (slaFilter === 'ON_TRACK') {
      const s = getSlaStatus(b);
      if (!s || (s.status !== 'ON_TRACK' && s.status !== 'MET')) return false;
    }

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
    const newScheduledDate = selectedDispatchSlot?.isOverdueResolved ? selectedDispatchSlot.dateFormatted : null;
    await assignProvider(selectedBooking.booking_id, providerId, newScheduledDate);
    setSubmitting(false);
    setAssignModal(false);
  };

  const openBillModalWithReport = (b) => {
    setSelectedBooking(b);
    // Pre-fill only with what the provider reported / admin previously billed — never invented defaults.
    const is22Guarantee = Number(b.parts_charge) === ZEVOTA_PARTS_GUARANTEE_PRICE;
    setPartsGuaranteeActive(is22Guarantee);
    setSelectedPartName(b.parts_name || '');
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

    const partsNote = selectedPartName
      ? `Part: ${selectedPartName} (${partsGuaranteeActive ? '₹22 Guarantee Applied' : 'Standard Rate'})`
      : 'Itemized Zevota Estimate based on Provider Inspection Report';

    await generateBill(selectedBooking.booking_id, {
      service_charge: sCharge,
      parts_charge: pCharge,
      labour_charge: lCharge,
      discount: dAmount,
      parts_name: selectedPartName || 'Replaced Spare Part',
      is_parts_guarantee: partsGuaranteeActive,
      warranty_policy: 'Lifetime Warranty (T&C Apply)',
      notes: partsNote,
    });

    const updatedBooking = {
      ...selectedBooking,
      service_charge: sCharge,
      parts_charge: pCharge,
      labour_charge: lCharge,
      discount_amount: dAmount,
      parts_name: selectedPartName || 'Replaced Spare Part',
      is_parts_guarantee: partsGuaranteeActive,
      warranty_policy: 'Lifetime Warranty (T&C Apply)',
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

      {/* 60-Minute SLA Command Bar */}
      <View style={styles.slaBannerRow}>
        <TouchableOpacity
          style={[styles.slaStatCard, slaFilter === 'ALL' && styles.slaStatCardActive]}
          onPress={() => setSlaFilter('ALL')}
          activeOpacity={0.8}
        >
          <Text style={styles.slaStatLabel}>TOTAL ORDERS</Text>
          <Text style={styles.slaStatVal}>{slaStats.total}</Text>
          <Text style={styles.slaStatSub}>All active orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.slaStatCard, { borderColor: '#fde68a' }, slaFilter === 'URGENT' && { backgroundColor: '#fffbeb', borderColor: '#d97706' }]}
          onPress={() => setSlaFilter(slaFilter === 'URGENT' ? 'ALL' : 'URGENT')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#b45309" stroke="#b45309" strokeWidth="1">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <Text style={[styles.slaStatLabel, { color: '#b45309' }]}>URGENT SLA (&lt; 25M)</Text>
            </View>
            {slaStats.urgent > 0 && <View style={styles.slaPulseDotAmber} />}
          </View>
          <Text style={[styles.slaStatVal, { color: '#b45309' }]}>{slaStats.urgent}</Text>
          <Text style={styles.slaStatSub}>Needs fast dispatch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.slaStatCard, { borderColor: '#fecaca' }, slaFilter === 'BREACHED' && { backgroundColor: '#fef2f2', borderColor: '#dc2626' }]}
          onPress={() => setSlaFilter(slaFilter === 'BREACHED' ? 'ALL' : 'BREACHED')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <Text style={[styles.slaStatLabel, { color: '#dc2626' }]}>SLA BREACHED</Text>
            </View>
            {slaStats.breached > 0 && <View style={styles.slaPulseDotRed} />}
          </View>
          <Text style={[styles.slaStatVal, { color: '#dc2626' }]}>{slaStats.breached}</Text>
          <Text style={styles.slaStatSub}>Over 60 min limit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.slaStatCard, { borderColor: '#ddd6fe' }, slaFilter === 'UNASSIGNED' && { backgroundColor: '#f5f3ff', borderColor: '#7c3aed' }]}
          onPress={() => setSlaFilter(slaFilter === 'UNASSIGNED' ? 'ALL' : 'UNASSIGNED')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <Text style={[styles.slaStatLabel, { color: '#7c3aed' }]}>UNASSIGNED</Text>
          </View>
          <Text style={[styles.slaStatVal, { color: '#7c3aed' }]}>{slaStats.unassigned}</Text>
          <Text style={styles.slaStatSub}>Awaiting partner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.slaStatCard, { borderColor: '#a7f3d0' }, slaFilter === 'ON_TRACK' && { backgroundColor: '#ecfdf5', borderColor: '#059669' }]}
          onPress={() => setSlaFilter(slaFilter === 'ON_TRACK' ? 'ALL' : 'ON_TRACK')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <Text style={[styles.slaStatLabel, { color: '#059669' }]}>ON TRACK</Text>
          </View>
          <Text style={[styles.slaStatVal, { color: '#059669' }]}>{slaStats.onTrack}</Text>
          <Text style={styles.slaStatSub}>Within 60 min target</Text>
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
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
          const sla = getSlaStatus(b);
          const isLiveTrackable =
            b.status !== 'COMPLETED' &&
            b.status !== 'CANCELLED' &&
            b.status !== 'REJECTED' &&
            ['PROVIDER_ACCEPTED', 'PROVIDER_ON_THE_WAY', 'PROVIDER_ARRIVED', 'SERVICE_IN_PROGRESS', 'IN_PROGRESS'].includes(b.status);

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
                  {getAllBookingMediaItems(b).length > 0 && (() => {
                    const mediaItems = getAllBookingMediaItems(b);
                    const videoCount = mediaItems.filter((m) => m.type === 'video').length;
                    const photoCount = mediaItems.filter((m) => m.type === 'photo').length;
                    const hasOnlyVideo = videoCount > 0 && photoCount === 0;
                    const hasBoth = videoCount > 0 && photoCount > 0;
                    const labelText = hasOnlyVideo
                      ? `View Video (${videoCount})`
                      : hasBoth
                        ? `View Photo & Video (${mediaItems.length})`
                        : `View Photo (${photoCount})`;

                    return (
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
                        {hasOnlyVideo || hasBoth ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        )}
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#1d4ed8' }}>
                          {labelText}
                        </Text>
                      </TouchableOpacity>
                    );
                  })()}
                </View>

                {/* Clickable Provider Name */}
                <View style={{ flex: 1.2 }}>
                  <TouchableOpacity
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

                  {/* One-Click Live Track Pill directly under Partner (Only when accepted & service not completed) */}
                  {isLiveTrackable && (
                    <TouchableOpacity
                      onPress={() => setLiveTrackingBooking(b)}
                      style={{
                        marginTop: 4,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: '#f5f3ff',
                        borderWidth: 1,
                        borderColor: '#ddd6fe',
                        paddingHorizontal: 7,
                        paddingVertical: 3,
                        borderRadius: 6,
                        alignSelf: 'flex-start',
                        cursor: 'pointer',
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} />
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                        <line x1="8" y1="2" x2="8" y2="18" />
                        <line x1="16" y1="6" x2="16" y2="22" />
                      </svg>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#7c3aed' }}>Live Track</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={{ flex: 1.0, gap: 4 }}>
                  <Text style={styles.td}>{b.scheduled_date || 'Today'}</Text>
                  {sla ? (
                    <View style={{
                      backgroundColor: sla.bg,
                      borderColor: sla.border,
                      borderWidth: 1,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      {sla.status === 'MET' && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={sla.text} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {sla.status === 'BREACHED' && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={sla.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        </svg>
                      )}
                      {sla.status === 'URGENT' && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill={sla.text} stroke={sla.text} strokeWidth="1">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                      )}
                      {sla.status === 'ON_TRACK' && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={sla.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      )}
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: sla.text }}>
                        {sla.label}
                      </Text>
                    </View>
                  ) : null}
                </View>

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
                      style={{ marginTop: 4, backgroundColor: '#fffbeb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#fde68a', alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <View style={{ flexDirection: 'row', gap: 1 }}>
                        {[1, 2, 3, 4, 5].slice(0, b.user_rating).map((_, i) => (
                          <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </View>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#b45309' }}>
                        ({b.user_rating}/5) · View review
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

                      {/* LIVE TRACK BUTTON (Only when technician has accepted & service is not completed) */}
                      {isLiveTrackable && (
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

      {/* PROVIDER ASSIGNMENT MODAL WITH SMART DISPATCH & TIMETABLE CONFLICT CHECK */}
      <Modal visible={assignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 660 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ gap: 3 }}>
                <Text style={styles.modalTitle}>Dispatch Field Partner</Text>
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
                    Customer's requested slot was <Text style={{ fontWeight: '700' }}>{bookingTargetRange.dateKey} ({bookingTargetRange.timeLabel})</Text> ({bookingTargetRange.overdueDays} day{bookingTargetRange.overdueDays > 1 ? 's' : ''} ago). Partner dispatch will activate for the slot selected below.
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
                                  : 'Assign Partner'}
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
                              ? `✓ Overdue Resolved: Partner is Free for ${selectedDispatchSlot?.displayLabel || 'Today'}`
                              : isAvail
                              ? 'Free & Ready: No scheduling conflicts found for this slot'
                              : 'Partner currently off-duty'}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={{ padding: 24, alignItems: 'center', gap: 6 }}>
                    <Text style={{ textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                      No {assignCategoryFilter === 'MATCHING' ? bookingCanonicalCategory : ''} providers found.
                    </Text>
                    {assignCategoryFilter === 'MATCHING' && (
                      <TouchableOpacity onPress={() => setAssignCategoryFilter('ALL')}>
                        <Text style={{ color: '#7c3aed', fontWeight: '700', fontSize: 12 }}>
                          View all registered providers across categories
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
                Assigning anyway will double-book this partner for two overlapping tasks.
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

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={styles.inputLabel}>Spare Parts Charge (₹)</Text>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: partsGuaranteeActive ? '#ecfdf5' : '#eff6ff',
                  borderColor: partsGuaranteeActive ? '#10b981' : '#bfdbfe',
                  borderWidth: 1.2,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}
                onPress={() => {
                  const nextState = !partsGuaranteeActive;
                  setPartsGuaranteeActive(nextState);
                  if (nextState) {
                    setPartsCharge('22');
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {partsGuaranteeActive ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#1d4ed8" stroke="#1d4ed8" strokeWidth="1">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  )}
                  <Text style={{ fontSize: 10, fontWeight: '800', color: partsGuaranteeActive ? '#047857' : '#1d4ed8' }}>
                    {partsGuaranteeActive ? '₹22 PARTS GUARANTEE ACTIVE' : 'APPLY ₹22 GUARANTEE'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Quick-Pick Spare Parts Chips from Price Master */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginVertical: 3 }}>
              {getApplicablePartsForService(selectedBooking?.service_name, selectedBooking?.category_name).map((part) => (
                <TouchableOpacity
                  key={part.id}
                  style={{
                    backgroundColor: selectedPartName === part.name ? '#e0e7ff' : '#f8fafc',
                    borderColor: selectedPartName === part.name ? '#6366f1' : '#cbd5e1',
                    borderWidth: 1,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                  onPress={() => {
                    setSelectedPartName(part.name);
                    const finalPrice = partsGuaranteeActive ? part.guaranteePrice : part.standardPrice;
                    setPartsCharge(String(finalPrice));
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 9.5, fontWeight: '700', color: selectedPartName === part.name ? '#4338ca' : '#475569' }}>
                    + {part.name} (₹{partsGuaranteeActive ? part.guaranteePrice : part.standardPrice})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {[1, 2, 3, 4, 5].slice(0, selectedBooking.user_rating).map((_, i) => (
                      <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </View>
                  <Text style={{ fontSize: 16, color: '#d97706', fontWeight: '800' }}>
                    ({selectedBooking.user_rating}/5)
                  </Text>
                </View>
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
                    {item.type === 'video' || isVideoMedia(item.uri, item.type) ? (
                      <AdminVideoPlayer
                        src={item.uri}
                        label={getAllBookingMediaItems(mediaBooking).filter((m) => m.type === 'video').length > 1 ? `Original Customer Video ${index + 1}` : 'Original Customer Video'}
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
                  No media (photo/video) attached for this booking.
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
      {(() => {
        const activeTrackedBooking = (bookings || []).find((x) => x.booking_id === liveTrackingBooking?.booking_id) || liveTrackingBooking;
        return (
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
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeTrackedBooking?.status === 'PROVIDER_ARRIVED' ? '#0e7490' : '#10b981' }} />
                      <Text style={styles.modalTitle}>Field Partner Real-Time Tracking</Text>
                    </View>
                    <Text style={styles.modalSub}>
                      Work Order #{activeTrackedBooking?.booking_id} • Service: {activeTrackedBooking?.service_name}
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

                {/* Telemetry Summary Cards */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  {/* Technician Card */}
                  <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', gap: 3 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Assigned Technician</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#7c3aed' }}>
                      {activeTrackedBooking?.provider_name || 'Rajesh Sharma'}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#475569' }}>
                      {activeTrackedBooking?.provider_phone || '+91 99887 76655'}
                    </Text>
                    {activeTrackedBooking?.status === 'PROVIDER_ARRIVED' ? (
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

                  {/* Customer Destination Card */}
                  <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', gap: 3 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Customer Destination</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
                      {activeTrackedBooking?.user_name || activeTrackedBooking?.userName || 'Customer'}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#475569' }}>
                      {activeTrackedBooking?.user_phone || '—'}
                    </Text>
                    <Text style={{ fontSize: 10.5, color: '#64748b' }} numberOfLines={1}>
                      {activeTrackedBooking?.address_text || activeTrackedBooking?.address || 'DLF Phase 2, Gurugram'}
                    </Text>
                  </View>
                </View>

                {/* Geofence Check-in Banner */}
                {activeTrackedBooking?.status === 'PROVIDER_ARRIVED' ? (
                  <View style={{ backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', padding: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
                        Technician verified within {activeTrackedBooking?.arrival_distance_m || 35} meters of customer doorstep.
                      </Text>
                    </View>
                  </View>
                ) : null}

                {/* Live Google Maps Tracking Component */}
                <View style={{ width: '100%', marginTop: 2 }}>
                  <LiveProviderTrackingMap
                    customerCoords={{
                      lat: Number(activeTrackedBooking?.customer_lat || activeTrackedBooking?.lat || 28.4986),
                      lng: Number(activeTrackedBooking?.customer_lng || activeTrackedBooking?.lng || 77.0878),
                    }}
                    customerAddress={activeTrackedBooking?.address_text || activeTrackedBooking?.address || 'Service Destination'}
                    providerName={activeTrackedBooking?.provider_name || 'Technician'}
                    providerPhone={activeTrackedBooking?.provider_phone || ''}
                    providerCoords={
                      activeTrackedBooking?.provider_coords || (activeTrackedBooking?.provider_lat && activeTrackedBooking?.provider_lng ? { lat: Number(activeTrackedBooking.provider_lat), lng: Number(activeTrackedBooking.provider_lng) } : null)
                    }
                    bookingStatus={activeTrackedBooking?.status || 'PROVIDER_ON_THE_WAY'}
                    lastUpdatedAt={activeTrackedBooking?.last_location_update || null}
                    mapHeight={320}
                  />
                </View>

                {/* Footer Actions */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      const pLat = activeTrackedBooking?.provider_coords?.lat || activeTrackedBooking?.provider_lat || 28.4986;
                      const pLng = activeTrackedBooking?.provider_coords?.lng || activeTrackedBooking?.provider_lng || 77.0878;
                      const cLat = activeTrackedBooking?.customer_lat || activeTrackedBooking?.lat || 28.4986;
                      const cLng = activeTrackedBooking?.customer_lng || activeTrackedBooking?.lng || 77.0878;
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
        );
      })()}
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

  slaBannerRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 14,
    flexWrap: 'wrap',
  },
  slaStatCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    cursor: 'pointer',
  },
  slaStatCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  slaStatLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  slaStatVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 4,
  },
  slaStatSub: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  slaPulseDotAmber: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d97706',
  },
  slaPulseDotRed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
  },

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
