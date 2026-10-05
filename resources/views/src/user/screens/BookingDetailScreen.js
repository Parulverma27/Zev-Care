import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useApp } from '../../context/AppContext';
import { AppIcon } from '../../components/AppIcons';
import { resolveImageUri } from '../../utils/imageUtils';
import { downloadInvoicePDF } from '../../utils/pdfInvoiceGenerator';
import LiveProviderTrackingMap from '../../components/LiveProviderTrackingMap';

export default function BookingDetailScreen() {
  const { getUserBookings, activeUser, approveBill, rejectBill, providers } = useApp();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [approving, setApproving] = useState(false);
  const [billError, setBillError] = useState('');

  const userBookings = getUserBookings(activeUser);
  const bk = userBookings.find((b) => b.booking_id === bookingId);

  const assignedProvider = (() => {
    if (!bk) return null;
    if (bk.provider_id != null) {
      const byId = (providers || []).find((p) => p.id === bk.provider_id);
      if (byId) return byId;
    }
    if (bk.provider_name) {
      return (providers || []).find((p) => p.name === bk.provider_name) || null;
    }
    return null;
  })();

  const providerName = bk?.provider_name || assignedProvider?.name || null;
  const providerPhone = bk?.provider_phone || assignedProvider?.phone || null;
  const providerRating = bk?.provider_rating ?? assignedProvider?.rating ?? null;
  const providerTrade =
    bk?.provider_trade || assignedProvider?.trade || assignedProvider?.specialty || 'Certified Technician';
  const hasProvider = !!(bk?.provider_id || providerName);

  const customerCoords = (() => {
    const lat = Number(bk?.latitude);
    const lng = Number(bk?.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng };
    }
    return { lat: 19.0596, lng: 72.8295 };
  })();

  const providerLiveCoords = (() => {
    const lat = Number(bk?.provider_lat);
    const lng = Number(bk?.provider_lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng };
    }
    return null;
  })();

  const trackingStatus = (() => {
    switch (bk?.status) {
      case 'PROVIDER_ON_THE_WAY':
        return 'ON_THE_WAY';
      case 'PROVIDER_ARRIVED':
        return 'ARRIVED';
      case 'SERVICE_IN_PROGRESS':
      case 'ISSUE_INSPECTED':
      case 'ASSIGNED_TO_ADMIN':
      case 'AWAITING_USER_APPROVAL':
        return 'IN_PROGRESS';
      case 'BOOKING_COMPLETED':
        return 'COMPLETED';
      case 'PROVIDER_ASSIGNED':
      case 'PROVIDER_ACCEPTED':
        return 'ASSIGNED';
      default:
        return 'ASSIGNED';
    }
  })();

  useEffect(() => {
    if (!bk?.booking_id) return;
    if (bk.status !== 'BOOKING_COMPLETED') return;
    if (bk.user_rating || bk.rating_skipped) return;
    const key = `zevota_rate_prompted_${bk.booking_id}`;
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch (e) {}
    navigate(`/user/bookings/${bk.booking_id}/rate`, { replace: false });
  }, [bk?.booking_id, bk?.status, bk?.user_rating, bk?.rating_skipped, navigate]);

  if (!bk) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Booking not found</Text>
        <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
          This work order is missing or does not belong to your account.
        </Text>
        <TouchableOpacity
          onPress={() => navigate('/user/bookings')}
          style={{ backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Back to My Bookings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stages = [
    {
      key: 'PENDING_ADMIN_REVIEW',
      title: 'Booking Created & Admin Review',
      detail: 'Work order registered and queued in Zevota-Care dispatch system.',
      time: '10 mins ago',
    },
    {
      key: 'PROVIDER_ASSIGNED',
      title: 'Technician Assigned',
      detail: `Certified Technician ${bk?.provider_name || 'Not yet assigned'} assigned to your work order.`,
      time: '8 mins ago',
    },
    {
      key: 'PROVIDER_ACCEPTED',
      title: 'Technician Accepted Work Order',
      detail: 'Technician confirmed work order schedule and details.',
      time: '6 mins ago',
    },
    {
      key: 'PROVIDER_ON_THE_WAY',
      title: 'Technician On The Way',
      detail: `Technician en route to premises (${bk?.address_text || 'Bandra West'}). Live ETA 15 Mins.`,
      time: '4 mins ago',
    },
    {
      key: 'PROVIDER_ARRIVED',
      title: 'Technician Arrived At Premises',
      detail: 'Technician arrived on site and initiated diagnostic inspection.',
      time: '2 mins ago',
    },
    {
      key: 'ISSUE_INSPECTED',
      title: 'Inspection Completed & Estimate Built',
      detail: 'Inspection complete. Parts required & estimate bill prepared by technician.',
      time: 'Just now',
    },
    {
      key: 'ASSIGNED_TO_ADMIN',
      title: 'Inspection Sent to Admin',
      detail: 'Estimate sent to Admin for price verification & membership discount calculation.',
      time: 'Just now',
    },
    {
      key: 'AWAITING_USER_APPROVAL',
      title: 'Estimate Sent — Awaiting User Approval',
      detail: 'Estimate bill verified by Admin. Please review breakdown and approve below.',
      time: 'Action Required',
    },
    {
      key: 'SERVICE_IN_PROGRESS',
      title: 'Bill Approved & Service In Progress',
      detail: 'Estimate approved & payment deducted. Technician currently executing repair work.',
      time: 'In Progress',
    },
    {
      key: 'BOOKING_COMPLETED',
      title: 'Completion OTP Verified & Completed',
      detail: `Work completed and verified via OTP. 30-Day warranty active.`,
      time: 'Completed',
    },
  ];

  const currentIdx = stages.findIndex((s) => s.key === bk?.status);
  const activeStageIndex = currentIdx === -1 ? 0 : currentIdx;

  const handleApproveBillAction = () => {
    setBillError('');
    setApproving(true);
    setTimeout(() => {
      const result = approveBill(bk.booking_id);
      setApproving(false);
      if (result && result.ok === false) {
        setBillError(result.error || 'Could not approve bill.');
      }
    }, 400);
  };

  const handleRejectBillAction = () => {
    if (typeof rejectBill === 'function') {
      rejectBill(bk.booking_id);
    }
  };

  const getStatusBadge = () => {
    if (bk.status === 'BOOKING_COMPLETED') return { text: 'COMPLETED', bg: '#dcfce7', color: '#15803d' };
    if (bk.status === 'AWAITING_USER_APPROVAL') return { text: 'ACTION REQUIRED', bg: '#fef3c7', color: '#b45309' };
    return { text: 'IN PROGRESS', bg: '#dbeafe', color: '#1d4ed8' };
  };

  const isBillSent = Boolean(
    bk?.bill_sent ||
    ['AWAITING_USER_APPROVAL', 'SERVICE_IN_PROGRESS', 'BOOKING_COMPLETED'].includes(bk?.status) ||
    bk?.bill_status === 'PAID' ||
    bk?.bill_status === 'APPROVED' ||
    bk?.bill_generated
  );

  const statusBadge = getStatusBadge();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => navigate('/user/home')} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.title}>Live Work Order Tracking</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>{statusBadge.text}</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>ID: {bk?.booking_id} • Service: {bk?.service_name}</Text>
          </View>
        </View>
      </View>

      {/* Field Provider & Live ETA Card */}
      {hasProvider ? (
        <View style={styles.providerCard}>
          <View style={styles.provHeaderRow}>
            <Text style={styles.provHeader}>ASSIGNED FIELD TECHNICIAN</Text>
            <View style={styles.gpsPill}>
              <View style={styles.greenPulseDot} />
              <Text style={styles.gpsPillText}>
                {providerLiveCoords ? 'Live GPS' : 'Tracking'}
              </Text>
            </View>
          </View>

          <View style={styles.provRow}>
            <Image
              source={{
                uri:
                  assignedProvider?.photo ||
                  assignedProvider?.avatar ||
                  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
              }}
              style={styles.provAvatar}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.provNameRow}>
                <Text style={styles.provName}>{providerName}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.provRating}>★ {providerRating != null ? providerRating : '—'}</Text>
                </View>
              </View>
              <Text style={styles.provSub}>{providerTrade}</Text>
              {providerPhone ? (
                <Text style={styles.provPhone}>{providerPhone}</Text>
              ) : null}
              <Text style={styles.provEta}>
                {trackingStatus === 'ON_THE_WAY'
                  ? '⏱ En route to your premises'
                  : trackingStatus === 'ARRIVED'
                    ? '📍 Arrived at your location'
                    : trackingStatus === 'COMPLETED'
                      ? '✓ Job completed'
                      : 'Technician assigned to your work order'}
              </Text>
            </View>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => {
                if (providerPhone && typeof window !== 'undefined') {
                  window.open(`tel:${String(providerPhone).replace(/\s/g, '')}`);
                }
              }}
              activeOpacity={0.85}
            >
              <AppIcon name="phone" size={14} color="#ffffff" />
              <Text style={styles.callBtnText}>Call Technician</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => navigate('/user/support')}
              activeOpacity={0.85}
            >
              <AppIcon name="message-square" size={14} color="#2563eb" />
              <Text style={styles.chatBtnText}>Chat Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.providerCard}>
          <Text style={styles.provHeader}>FIELD TECHNICIAN</Text>
          <Text style={styles.provSub}>A technician will be assigned shortly.</Text>
        </View>
      )}

      {/* Live Provider Tracking Google Map */}
      {hasProvider ? (
        <LiveProviderTrackingMap
          customerCoords={customerCoords}
          customerAddress={bk?.address_text || ''}
          providerName={providerName || 'Technician'}
          providerPhone={providerPhone || ''}
          providerCoords={providerLiveCoords}
          bookingStatus={trackingStatus}
          lastUpdatedAt={bk?.last_location_update || null}
        />
      ) : null}

      {/* ESTIMATE APPROVAL CARD (If Status == AWAITING_USER_APPROVAL) */}
      {bk?.status === 'AWAITING_USER_APPROVAL' && (
        <View style={styles.estimateCard}>
          <View style={styles.estimateHeader}>
            <View style={styles.estimateIconCircle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.estimateTitle}>Estimate Bill Sent for Approval</Text>
              <Text style={styles.estimateSub}>Technician inspected premises & generated work cost estimate.</Text>
            </View>
          </View>

          {Boolean(activeUser?.subscription_plan && activeUser?.subscription_status === 'ACTIVE') && (
            <View style={{ backgroundColor: '#0a192f', borderWidth: 1.2, borderColor: '#d4af37', borderRadius: 12, padding: 10, marginHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 18 }}>🛡️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#fbbf24' }}>
                  Covered under {activeUser.subscription_plan}
                </Text>
                <Text style={{ fontSize: 10.5, color: '#cbd5e1', lineHeight: 14 }}>
                  Inspection fees and breakdown labor are covered under your 365-day AMC Contract.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.billBreakdownTable}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Service Visit & Inspection Fee</Text>
              <Text style={styles.billVal}>₹{(bk?.service_charge ?? 0).toLocaleString()}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Replacement Spare Parts</Text>
              <Text style={styles.billVal}>₹{(bk?.parts_charge ?? 0).toLocaleString()}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Labour & Workmanship</Text>
              <Text style={styles.billVal}>₹{(bk?.labour_charge ?? 0).toLocaleString()}</Text>
            </View>
            {bk?.discount_amount > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billDiscountLabel}>Active Membership Plan Discount</Text>
                <Text style={styles.billDiscountVal}>-₹{(bk?.discount_amount ?? 0).toLocaleString()}</Text>
              </View>
            )}
            <View style={styles.billDivider} />
            <View style={styles.billTotalRow}>
              <Text style={styles.billTotalLabel}>NET PAYABLE AMOUNT</Text>
              <Text style={styles.billTotalVal}>₹{(bk?.total_bill ?? 0).toLocaleString()}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.approveBillBtn, Boolean(activeUser?.subscription_plan) && { backgroundColor: '#0a192f', borderWidth: 1.5, borderColor: '#d4af37' }]}
            onPress={handleApproveBillAction}
            disabled={approving}
            activeOpacity={0.85}
          >
            <Text style={[styles.approveBillBtnText, Boolean(activeUser?.subscription_plan) && { color: '#fbbf24' }]}>
              {approving
                ? 'Processing Approval...'
                : Boolean(activeUser?.subscription_plan && activeUser?.subscription_status === 'ACTIVE')
                ? `Approve & Confirm Service (${activeUser.subscription_plan})`
                : 'Approve & Pay Bill from Wallet'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectBillBtn}
            onPress={handleRejectBillAction}
            disabled={approving}
            activeOpacity={0.85}
          >
            <Text style={styles.rejectBillBtnText}>Reject Estimate</Text>
          </TouchableOpacity>
          {!!billError && <Text style={styles.billErrorText}>{billError}</Text>}
        </View>
      )}

      {/* JOB COMPLETION SECURITY OTP CARD (If In Progress or Completed) */}
      {(bk?.status === 'SERVICE_IN_PROGRESS' || bk?.status === 'BOOKING_COMPLETED') && (
        <View style={styles.otpCard}>
          <View style={styles.otpHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.otpTitle}>Job Completion Security OTP</Text>
              <Text style={styles.otpSub}>Share this 4-digit code with technician ONLY after job completion.</Text>
            </View>
            <View style={styles.otpBox}>
              <Text style={styles.otpCode}>{bk?.completion_otp || '—'}</Text>
            </View>
          </View>
        </View>
      )}

      {/* DOWNLOAD PDF INVOICE CARD (Only shown when service is fully completed) */}
      {bk?.status === 'BOOKING_COMPLETED' && (
        <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#bfdbfe', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e3a8a' }}>Official Tax Invoice</Text>
            <Text style={{ fontSize: 11, color: '#64748b' }}>Download official PDF invoice for completed work order & GST claims.</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 }}
            onPress={() => downloadInvoicePDF(bk)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <polyline points="9 15 12 18 15 15" />
              </svg>
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12 }}>PDF Invoice</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* POST-SERVICE RATINGS & FEEDBACK */}
      {bk?.status === 'BOOKING_COMPLETED' && (
        <View style={ratingStyles.ratingCard}>
          {bk?.user_rating ? (
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={ratingStyles.cardTitle}>Your Submitted Rating & Feedback</Text>
                <Text style={ratingStyles.starVal}>{'★'.repeat(bk.user_rating)} ({bk.user_rating}/5)</Text>
              </View>
              {bk.issue_resolved ? (
                <Text style={ratingStyles.cardSub}>
                  Issue resolved:{' '}
                  {bk.issue_resolved === 'yes'
                    ? 'Yes, completely'
                    : bk.issue_resolved === 'partial'
                      ? 'Partially'
                      : 'No'}
                </Text>
              ) : null}
              {bk.user_feedback ? (
                <Text style={ratingStyles.userReviewText}>&ldquo;{bk.user_feedback}&rdquo;</Text>
              ) : null}
              {Array.isArray(bk.feedback_tags) && bk.feedback_tags.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {bk.feedback_tags.map((t) => (
                    <View key={t} style={ratingStyles.tagChipBadge}>
                      <Text style={ratingStyles.tagChipText}>✓ {t}</Text>
                    </View>
                  ))}
                </View>
              )}
              {Array.isArray(bk.rating_photos) && bk.rating_photos.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  {bk.rating_photos.map((uri, i) => (
                    <Image
                      key={`rp-${i}`}
                      source={{ uri: resolveImageUri(uri) }}
                      style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: '#e2e8f0' }}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              )}
            </View>
          ) : bk?.rating_skipped ? (
            <Text style={ratingStyles.cardSub}>You skipped rating this service.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={ratingStyles.iconCircle}>
                  <Text style={{ fontSize: 18 }}>⭐</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ratingStyles.cardTitle}>Rate your service</Text>
                  <Text style={ratingStyles.cardSub}>
                    How was your experience with {bk?.provider_name || 'your provider'}?
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={ratingStyles.openRatingBtn}
                onPress={() => navigate(`/user/bookings/${bk.booking_id}/rate`)}
                activeOpacity={0.85}
              >
                <Text style={ratingStyles.openRatingBtnText}>Rate us</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Work Order Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{bk?.service_name}</Text>
        <Text style={styles.infoSub}>{bk?.category_name} › {bk?.sub_category_name}</Text>
        
        <View style={styles.infoRow}>
          <AppIcon name="map-pin" size={14} color="#2563eb" />
          <Text style={styles.infoAddr}>Location: {bk?.address_text}</Text>
        </View>
        {(bk?.scheduledDate || bk?.scheduled_date || bk?.scheduledTime || bk?.schedule) && (
          <View style={styles.infoRow}>
            <AppIcon name="clock" size={14} color="#2563eb" />
            <Text style={styles.infoDesc}>
              Schedule:{' '}
              {[bk.scheduledDateLabel || bk.scheduledDate || bk.scheduled_date, bk.scheduledTime || bk.scheduled_time]
                .filter(Boolean)
                .join(' · ') || bk.schedule}
            </Text>
          </View>
        )}
        {bk?.applianceName || bk?.applianceDetails ? (
          <View style={styles.infoRow}>
            <AppIcon name="wrench" size={14} color="#2563eb" />
            <Text style={styles.infoDesc}>
              Appliance:{' '}
              {[
                bk.applianceName,
                bk.applianceDetails?.brand,
                bk.applianceDetails?.capacity,
                bk.applianceDetails?.location,
              ]
                .filter(Boolean)
                .join(' · ') || 'Not specified'}
            </Text>
          </View>
        ) : null}
        <View style={styles.infoRow}>
          <AppIcon name="file-text" size={14} color="#2563eb" />
          <Text style={styles.infoDesc}>
            Reported Issue: {bk?.issue || bk?.issue_description || 'Not specified'}
          </Text>
        </View>
        {!!bk?.issueDescription && bk.issueDescription !== bk.issue && (
          <Text style={[styles.infoDesc, { marginLeft: 22, marginTop: -4 }]}>{bk.issueDescription}</Text>
        )}

        {isBillSent && (bk?.applianceRegistrationFee > 0 || bk?.pricing?.applianceRegistrationFee > 0) ? (
          <Text style={[styles.infoDesc, { marginTop: 8, color: '#c2410c', fontWeight: '700' }]}>
            New appliance registration: ₹
            {bk.applianceRegistrationFee || bk.pricing?.applianceRegistrationFee}
          </Text>
        ) : null}
        {isBillSent && (bk?.total_bill != null || bk?.totalAmount != null || bk?.pricing?.total != null) ? (
          <Text style={[styles.infoDesc, { marginTop: 4, fontWeight: '700', color: '#0f172a' }]}>
            Total: ₹
            {Number(bk.total_bill ?? bk.totalAmount ?? bk.pricing?.total ?? 0).toLocaleString('en-IN')}
          </Text>
        ) : null}

        {bk?.issue_media_url && (
          <View style={styles.mediaBox}>
            <Image source={{ uri: resolveImageUri(bk.issue_media_url) }} style={styles.mediaImg} resizeMode="cover" />
          </View>
        )}
        {(bk?.issueMedia?.photos || []).slice(0, 3).map((p, i) => (
          <View key={`im-${i}`} style={styles.mediaBox}>
            <Image source={{ uri: resolveImageUri(p.uri) }} style={styles.mediaImg} resizeMode="cover" />
          </View>
        ))}
      </View>

      {/* 10-Stage Connected Visual Timeline */}
      <View style={styles.timelineCard}>
        <View style={styles.timelineHeaderRow}>
          <Text style={styles.timelineTitle}>Work Order Lifecycle Progress</Text>
          <Text style={styles.timelineMeta}>Stage {activeStageIndex + 1} of 10</Text>
        </View>

        <View style={styles.timelineList}>
          {stages.map((st, idx) => {
            const isDone = idx < activeStageIndex;
            const isCurrent = idx === activeStageIndex;
            const isLast = idx === stages.length - 1;

            return (
              <View key={idx} style={styles.timelineStepRow}>
                {/* Left Node & Vertical Connector Line */}
                <View style={styles.nodeColumn}>
                  <View style={[
                    styles.nodeDot,
                    isDone && styles.nodeDotDone,
                    isCurrent && styles.nodeDotCurrent
                  ]}>
                    {isDone ? (
                      <Text style={styles.checkIcon}>✓</Text>
                    ) : isCurrent ? (
                      <View style={styles.currentInnerDot} />
                    ) : null}
                  </View>
                  {!isLast && (
                    <View style={[styles.connectingLine, isDone && styles.connectingLineDone]} />
                  )}
                </View>

                {/* Right Step Details */}
                <View style={styles.stepContent}>
                  <View style={styles.stepHeader}>
                    <Text style={[
                      styles.stepTitle,
                      isDone && styles.stepTitleDone,
                      isCurrent && styles.stepTitleCurrent
                    ]}>
                      {st.title}
                    </Text>
                    {isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>ACTIVE NOW</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.stepDetail, isCurrent && styles.stepDetailCurrent]}>
                    {st.detail}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', width: '100%' },
  content: { padding: 16, gap: 14, width: '100%', boxSizing: 'border-box' },
  header: { gap: 4, width: '100%' },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  subtitle: { fontSize: 11.5, color: '#64748b', marginTop: 2 },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  providerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
    boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
  },
  provHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  provHeader: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  gpsPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  provRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  provAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
  },
  provNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  provName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  ratingRow: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  provRating: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  provSub: {
    fontSize: 11.5,
    color: '#475569',
  },
  provPhone: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
    marginTop: 1,
  },
  provEta: {
    fontSize: 11.5,
    color: '#059669',
    fontWeight: '700',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 10,
    cursor: 'pointer',
  },
  callBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 10,
    borderRadius: 10,
    cursor: 'pointer',
  },
  chatBtnText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  supportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 10,
    borderRadius: 10,
    cursor: 'pointer',
  },
  supportBtnText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },

  estimateCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    gap: 14,
    boxShadow: '0 6px 18px rgba(245, 158, 11, 0.08)',
  },
  estimateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  estimateIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  estimateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400e',
  },
  estimateSub: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 1,
  },
  billBreakdownTable: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 12,
    color: '#475569',
  },
  billVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  billDiscountLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  billDiscountVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  billTotalVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2563eb',
  },
  approveBillBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(5,150,105,0.25)',
    cursor: 'pointer',
  },
  approveBillBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  rejectBillBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    cursor: 'pointer',
  },
  rejectBillBtnText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '700',
  },
  billErrorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },

  otpCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  otpTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  otpSub: {
    fontSize: 11,
    color: '#15803d',
    marginTop: 2,
    lineHeight: 15,
  },
  otpBox: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#86efac',
  },
  otpCode: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803d',
    letterSpacing: 2,
  },

  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  infoSub: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  infoAddr: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
  },
  infoDesc: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
  },
  mediaBox: {
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 6,
  },
  mediaImg: {
    width: '100%',
    height: '100%',
  },

  timelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
    boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  timelineMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timelineList: {
    gap: 0,
  },
  timelineStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    position: 'relative',
    minHeight: 52,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 24,
  },
  nodeDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeDotDone: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  nodeDotCurrent: {
    backgroundColor: '#ffffff',
    borderColor: '#2563eb',
    borderWidth: 3,
    boxShadow: '0 0 0 3px rgba(37,99,235,0.2)',
  },
  checkIcon: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  currentInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  connectingLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 2,
    minHeight: 28,
  },
  connectingLineDone: {
    backgroundColor: '#10b981',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 14,
    gap: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94a3b8',
  },
  stepTitleDone: {
    color: '#0f172a',
    fontWeight: '700',
  },
  stepTitleCurrent: {
    color: '#2563eb',
    fontWeight: '800',
    fontSize: 13.5,
  },
  currentBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.5,
  },
  stepDetail: {
    fontSize: 11.5,
    color: '#94a3b8',
    lineHeight: 16,
  },
  stepDetailCurrent: {
    color: '#334155',
    fontWeight: '500',
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    cursor: 'pointer',
  },
  backArrow: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyActionBtn: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyActionText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});

const ratingStyles = StyleSheet.create({
  ratingCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fef08a', backgroundColor: '#fffbeb', gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#78350f' },
  cardSub: { fontSize: 11.5, color: '#92400e' },
  starVal: { fontSize: 13, fontWeight: '800', color: '#b45309' },
  userReviewText: { fontSize: 12, color: '#451a03', fontStyle: 'italic' },
  tagChipBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#fde68a' },
  tagChipText: { fontSize: 10.5, fontWeight: '700', color: '#92400e' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  openRatingBtn: { backgroundColor: '#b45309', paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  openRatingBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxWidth: 440, backgroundColor: '#ffffff', borderRadius: 16, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalSub: { fontSize: 12, color: '#64748b' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 8 },
  starIcon: { fontSize: 32, color: '#cbd5e1' },
  starIconActive: { color: '#f59e0b' },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#334155', marginTop: 4 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  chipActive: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  chipText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#2563eb', fontWeight: '700' },
  reviewInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 10, fontSize: 13, height: 75, color: '#0f172a' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  submitBtn: { flex: 1.5, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2563eb', alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
});

const mapTrackingStyles = StyleSheet.create({
  mapBox: { marginTop: 10, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#0f172a' },
  mapCanvas: { height: 140, position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  gridOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '16px 16px' },
  markerBox: { position: 'absolute', alignItems: 'center', gap: 2 },
  providerPin: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#2563eb' },
  customerPin: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#dc2626' },
  markerBadge: { backgroundColor: 'rgba(15, 23, 42, 0.85)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  markerBadgeText: { color: '#ffffff', fontSize: 9.5, fontWeight: '700' },
  mapMetaFooter: { backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#334155' },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  metaText: { color: '#e2e8f0', fontSize: 11, fontWeight: '600' },
  etaVal: { color: '#38bdf8', fontSize: 11.5, fontWeight: '800' },
});
