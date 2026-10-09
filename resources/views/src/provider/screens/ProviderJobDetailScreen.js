import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput } from 'react-native';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import ImageUploadField from '../../admin/components/ImageUploadField';
import { resolveImageUri } from '../../utils/imageUtils';
import ProviderIcon from '../ProviderIcons';
import ClientLocationMap from '../../components/ClientLocationMap';

export default function ProviderJobDetailScreen({ bookingId: propsBookingId }) {
  const { bookingId: routeBookingId } = useParams();
  const navigate = useNavigate();
  const {
    bookings,
    users,
    updateBookingStatus,
    submitInspectionReport,
    uploadBookingMedia,
    updateProviderLocation,
    generateBill,
  } = useApp();
  const [sharingGps, setSharingGps] = useState(false);
  const [gpsSharedSuccess, setGpsSharedSuccess] = useState(false);
  const [inspectModal, setInspectModal] = useState(false);
  const [otpModal, setOtpModal] = useState(false);
  const [mediaUploadModal, setMediaUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('before');
  const [mediaUploadUrl, setMediaUploadUrl] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [findings, setFindings] = useState('Armature coil burnt due to jar overload. Requires replacement jar coupler.');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&q=80&w=600');
  const [partsCost, setPartsCost] = useState('');
  const [labourCost, setLabourCost] = useState('');
  const [partsDescription, setPartsDescription] = useState('');
  const [quoteError, setQuoteError] = useState('');

  const targetBookingId = routeBookingId || propsBookingId;
  const bk = bookings.find((b) => b.booking_id === targetBookingId);
  const isConsultationBk = Boolean(bk?.isConsultation || bk?.booking_mode === 'consultation');

  useEffect(() => {
    if (bk) {
      if (bk.inspection_report) {
        setFindings(bk.inspection_report);
      } else if (isConsultationBk) {
        setFindings(`Diagnosed issue for ${bk.service_name || 'appliance'}: `);
      }
      if (bk.parts_charge != null && bk.parts_charge !== 0) setPartsCost(String(bk.parts_charge));
      if (bk.labour_charge != null && bk.labour_charge !== 0) setLabourCost(String(bk.labour_charge));
      if (bk.parts_description) setPartsDescription(String(bk.parts_description));
      if (bk.issue_media_url) setMediaUrl(bk.issue_media_url);
    }
  }, [bk?.booking_id, isConsultationBk]);

  const pushGps = (lat, lng) => {
    if (typeof updateProviderLocation === 'function' && bk?.booking_id) {
      updateProviderLocation(bk.booking_id, lat, lng);
    }
  };

  const handleShareGpsLocation = () => {
    if (!bk?.booking_id) return;
    setSharingGps(true);
    setGpsSharedSuccess(false);
    if (typeof window !== 'undefined' && navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSharingGps(false);
          setGpsSharedSuccess(true);
          pushGps(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setSharingGps(false);
          pushGps(19.0596, 72.8295);
          setGpsSharedSuccess(true);
        }
      );
    } else {
      setSharingGps(false);
      pushGps(19.0596, 72.8295);
      setGpsSharedSuccess(true);
    }
  };

  // Auto-broadcast GPS while en route so customer map stays live
  useEffect(() => {
    if (!bk || bk.status !== 'PROVIDER_ON_THE_WAY') return undefined;
    handleShareGpsLocation();
    const id = setInterval(() => {
      if (typeof window !== 'undefined' && navigator?.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => pushGps(pos.coords.latitude, pos.coords.longitude),
          () => {}
        );
      }
    }, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bk?.booking_id, bk?.status]);

  const handleGoBack = () => {
    if (window?.history?.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/provider/bookings');
    }
  };

  if (!bk) {
    return (
      <View style={{ flex: 1, backgroundColor: '#eff6ff', padding: 24, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Job not found</Text>
        <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
          This work order ID is invalid or no longer available.
        </Text>
        <TouchableOpacity
          onPress={handleGoBack}
          style={{ backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Back to Work Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const customerUser = (() => {
    if (!bk) return null;
    if (bk.user_id != null) {
      const byId = (users || []).find((u) => u.id === bk.user_id);
      if (byId) return byId;
    }
    const clean = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');
    return (users || []).find((u) => clean(u.phone) === clean(bk.user_phone)) || null;
  })();

  const customerName = bk?.user_name || customerUser?.name || 'Customer';
  const customerPhone = bk?.user_phone || customerUser?.phone || '';
  const customerAddress =
    bk?.address_text ||
    customerUser?.property?.address ||
    customerUser?.address ||
    customerUser?.saved_addresses?.find((a) => a.isDefault)?.address ||
    customerUser?.saved_addresses?.[0]?.address ||
    '';

  const customerCoords = (() => {
    const lat = Number(bk?.latitude ?? customerUser?.latitude);
    const lng = Number(bk?.longitude ?? customerUser?.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng };
    }
    const addr = (customerUser?.saved_addresses || []).find((a) => a.isDefault) ||
      (customerUser?.saved_addresses || [])[0];
    const alat = Number(addr?.latitude);
    const alng = Number(addr?.longitude);
    if (Number.isFinite(alat) && Number.isFinite(alng)) return { lat: alat, lng: alng };
    return { lat: 19.0596, lng: 72.8295 };
  })();

  const currentStatus = bk?.status || 'PROVIDER_ASSIGNED';

  const statusLabels = {
    PENDING_ADMIN_REVIEW: 'PENDING REVIEW',
    ADMIN_ACCEPTED: 'ACCEPTED BY ADMIN',
    PROVIDER_ASSIGNED: 'ASSIGNED TO YOU',
    PROVIDER_ACCEPTED: 'ACCEPTED BY YOU',
    PROVIDER_ON_THE_WAY: 'EN ROUTE TO PREMISES',
    PROVIDER_ARRIVED: isConsultationBk ? 'ARRIVED FOR DIAGNOSIS' : 'ARRIVED ON SITE',
    ISSUE_INSPECTED: 'INSPECTION COMPLETED',
    ASSIGNED_TO_ADMIN: 'INSPECTION SENT TO ADMIN',
    AWAITING_USER_APPROVAL: isConsultationBk ? 'QUOTE SENT TO CUSTOMER' : 'AWAITING CUSTOMER APPROVAL',
    SERVICE_IN_PROGRESS: isConsultationBk ? 'REPAIR IN PROGRESS' : 'WORK IN PROGRESS',
    ESTIMATE_REJECTED: 'DECLINED BY CUSTOMER (₹0)',
    BOOKING_COMPLETED: 'COMPLETED & SETTLED',
  };

  const handleAction = (nextStatus) => {
    if (bk?.booking_id) {
      updateBookingStatus(bk.booking_id, nextStatus);
      if (nextStatus === 'PROVIDER_ON_THE_WAY') {
        setTimeout(() => handleShareGpsLocation(), 300);
      }
    }
  };

  const handleInspectionSubmit = () => {
    if (bk?.booking_id) {
      if (submitInspectionReport) {
        submitInspectionReport(bk.booking_id, {
          findings,
          mediaUrl,
        });
      } else {
        updateBookingStatus(bk.booking_id, 'ASSIGNED_TO_ADMIN');
      }
    }
    setInspectModal(false);
  };

  const handleConsultationQuoteSubmit = () => {
    if (!bk?.booking_id) return;
    if (!findings.trim()) {
      setQuoteError('Please enter diagnostic findings and root cause explanation.');
      return;
    }
    const parts = parseFloat(partsCost) || 0;
    const labour = parseFloat(labourCost) || 0;
    if (parts === 0 && labour === 0) {
      setQuoteError('Please enter an estimated labor or spare parts charge for the repair.');
      return;
    }
    setQuoteError('');

    if (typeof generateBill === 'function') {
      generateBill(bk.booking_id, {
        service_charge: 0,
        parts_charge: parts,
        labour_charge: labour,
        discount: 0,
        total_bill: parts + labour,
        notes: findings.trim(),
        findings: findings.trim(),
        parts_description: partsDescription.trim(),
      });
    } else {
      updateBookingStatus(bk.booking_id, 'AWAITING_USER_APPROVAL');
    }

    if (mediaUrl && typeof uploadBookingMedia === 'function') {
      uploadBookingMedia(bk.booking_id, 'inspection', mediaUrl);
    }

    setInspectModal(false);
  };

  const handleVerifyOtpSubmit = () => {
    const rawCode = String(enteredOtp || '').replace(/\D/g, '').trim();
    const expected = String(bk?.completion_otp || '').replace(/\D/g, '').trim();

    if (expected && rawCode === expected) {
      setOtpError('');
      if (bk?.booking_id) {
        updateBookingStatus(bk.booking_id, 'BOOKING_COMPLETED');
      }
      setOtpModal(false);
      setEnteredOtp('');
    } else {
      setOtpError(`Invalid OTP. Please ask the customer for their 4-digit job completion code.`);
    }
  };

  const handleSaveWorkMedia = () => {
    if (bk?.booking_id && mediaUploadUrl) {
      uploadBookingMedia(bk.booking_id, uploadType, mediaUploadUrl);
    }
    setMediaUploadModal(false);
    setMediaUploadUrl('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <ProviderIcon name="back" color="#0f172a" size={16} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Field Work Order Console</Text>
          <Text style={styles.subtitle}>ID: {bk?.booking_id} • Status: {statusLabels[currentStatus] || currentStatus}</Text>
        </View>
      </View>

      {/* Consultation Diagnosis Highlight Banner */}
      {isConsultationBk && (
        <View style={styles.consultationBanner}>
          <View style={styles.consultationTopRow}>
            <View style={styles.consultationTag}>
              <ProviderIcon name="flash" color="#1d4ed8" size={13} />
              <Text style={styles.consultationTagText}>URBAN COMPANY CONSULTATION FLOW</Text>
            </View>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>₹0 FREE VISIT</Text>
            </View>
          </View>
          <Text style={styles.consultationHeadline}>On-Site Diagnosis & Upfront Quote Generation</Text>
          <Text style={styles.consultationBody}>
            As a technician, assess the fault on-site and transmit an itemized quote (parts + labor). Repair begins only upon customer approval. If the customer declines, ₹0 is charged.
          </Text>
        </View>
      )}

      {/* Customer Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Customer & Premises</Text>
        <Text style={styles.custName}>{customerName}</Text>
        <View style={styles.infoRow}>
          <ProviderIcon name="phone" color="#64748b" size={13} />
          <Text style={styles.custSub}>{customerPhone || '—'}</Text>
        </View>
        {customerUser?.email ? (
          <View style={styles.infoRow}>
            <ProviderIcon name="user" color="#64748b" size={13} />
            <Text style={styles.custSub}>{customerUser.email}</Text>
          </View>
        ) : null}
        <View style={styles.infoRow}>
          <ProviderIcon name="pin" color="#2563eb" size={13} />
          <Text style={styles.custAddr}>{customerAddress || '—'}</Text>
        </View>
        <TouchableOpacity
          style={styles.callCustomerBtn}
          onPress={() => {
            if (customerPhone && typeof window !== 'undefined') {
              window.open(`tel:${String(customerPhone).replace(/\s/g, '')}`);
            }
          }}
          activeOpacity={0.85}
        >
          <ProviderIcon name="phone" color="#ffffff" size={14} />
          <Text style={styles.callCustomerBtnTxt}>Call Customer</Text>
        </TouchableOpacity>
      </View>

      <ClientLocationMap
        customerCoords={customerCoords}
        customerAddress={customerAddress}
        customerName={customerName}
        customerPhone={customerPhone}
      />

      {/* Issue Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Issue & Media Attachment</Text>
        <Text style={styles.issueName}>{bk?.service_name} ({bk?.category_name})</Text>
        <View style={styles.infoRow}>
          <ProviderIcon name="wrench" color="#64748b" size={13} />
          <Text style={styles.issueDesc}>{bk?.issue_description}</Text>
        </View>

        {bk?.issue_media_url && (
          <View style={styles.mediaBox}>
            <Image source={{ uri: resolveImageUri(bk.issue_media_url) }} style={styles.mediaImg} resizeMode="cover" />
          </View>
        )}
      </View>

      {/* DYNAMIC PARTNER LIFECYCLE ACTION CONSOLE */}
      <View style={styles.actionConsole}>
        <Text style={styles.consoleTitle}>Partner Lifecycle Workflow Action</Text>

        {currentStatus === 'PROVIDER_ASSIGNED' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('PROVIDER_ACCEPTED')}>
            <ProviderIcon name="checkCircle" color="#ffffff" size={16} />
            <Text style={styles.actionBtnText}>ACCEPT WORK ORDER</Text>
          </TouchableOpacity>
        )}

        {currentStatus === 'PROVIDER_ACCEPTED' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('PROVIDER_ON_THE_WAY')}>
            <ProviderIcon name="car" color="#ffffff" size={16} />
            <Text style={styles.actionBtnText}>START VISIT (ON THE WAY)</Text>
          </TouchableOpacity>
        )}

        {currentStatus === 'PROVIDER_ON_THE_WAY' && (
          <View style={{ gap: 8 }}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('PROVIDER_ARRIVED')}>
              <ProviderIcon name="pin" color="#ffffff" size={16} />
              <Text style={styles.actionBtnText}>MARK ARRIVED AT PREMISES</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingVertical: 10, borderRadius: 10, alignItems: 'center' }}
              onPress={handleShareGpsLocation}
              disabled={sharingGps}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#2563eb', fontWeight: '700', fontSize: 12 }}>
                {sharingGps ? 'Broadcasting GPS Location...' : gpsSharedSuccess ? '✓ Live GPS Location Shared with Customer' : '📡 Broadcast Live Location (GPS)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStatus === 'PROVIDER_ARRIVED' && (
          <TouchableOpacity
            style={[styles.actionBtn, isConsultationBk && { backgroundColor: '#1d4ed8' }]}
            onPress={() => setInspectModal(true)}
            activeOpacity={0.85}
          >
            <ProviderIcon name="flash" color="#ffffff" size={16} />
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.actionBtnText}>
                {isConsultationBk ? 'START ON-SITE DIAGNOSIS & BUILD QUOTE' : 'START SERVICES & FIELD REPORT'}
              </Text>
              {isConsultationBk ? (
                <Text style={styles.actionBtnSubtext}>Urban Company ₹0 Free Diagnostic Inspection</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        )}

        {(currentStatus === 'ISSUE_INSPECTED' || currentStatus === 'ASSIGNED_TO_ADMIN') && (
          <View style={styles.waitBox}>
            <ProviderIcon name="clock" color="#d97706" size={16} />
            <Text style={styles.waitText}>Inspection Submitted! Assigned to Admin for estimate bill calculation...</Text>
          </View>
        )}

        {currentStatus === 'AWAITING_USER_APPROVAL' && (
          isConsultationBk ? (
            <View style={styles.quoteWaitingCard}>
              <View style={styles.quoteWaitingHeader}>
                <ProviderIcon name="clock" color="#d97706" size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.quoteWaitingTitle}>Quote Transmitted • Awaiting Customer Approval</Text>
                  <Text style={styles.quoteWaitingSub}>
                    Itemized repair quote sent to customer's app. Work will begin once approved.
                  </Text>
                </View>
              </View>

              <View style={styles.quoteBreakdownCard}>
                <View style={styles.quoteRow}>
                  <Text style={styles.quoteRowLabel}>Diagnostic Visit Fee</Text>
                  <Text style={[styles.quoteRowVal, { color: '#16a34a' }]}>₹0 (FREE)</Text>
                </View>
                {bk?.parts_description ? (
                  <View style={styles.quoteRow}>
                    <Text style={styles.quoteRowLabel}>Parts Required</Text>
                    <Text style={[styles.quoteRowVal, { maxWidth: '55%', textAlign: 'right' }]}>{bk.parts_description}</Text>
                  </View>
                ) : null}
                <View style={styles.quoteRow}>
                  <Text style={styles.quoteRowLabel}>Spare Parts Charge</Text>
                  <Text style={styles.quoteRowVal}>₹{bk?.parts_charge || 0}</Text>
                </View>
                <View style={styles.quoteRow}>
                  <Text style={styles.quoteRowLabel}>Labor & Service Charge</Text>
                  <Text style={styles.quoteRowVal}>₹{bk?.labour_charge || 0}</Text>
                </View>
                <View style={[styles.quoteRow, styles.quoteTotalRow]}>
                  <Text style={styles.quoteTotalLabel}>Total Quote</Text>
                  <Text style={styles.quoteTotalVal}>₹{bk?.total_bill || ((Number(bk?.parts_charge) || 0) + (Number(bk?.labour_charge) || 0))}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.reviseQuoteBtn}
                onPress={() => setInspectModal(true)}
                activeOpacity={0.8}
              >
                <ProviderIcon name="wrench" color="#2563eb" size={14} />
                <Text style={styles.reviseQuoteBtnText}>Edit / Revise Quote Details</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.waitBox}>
              <ProviderIcon name="clock" color="#d97706" size={16} />
              <Text style={styles.waitText}>Estimate Sent! Waiting for Customer to Approve Bill...</Text>
            </View>
          )
        )}

        {currentStatus === 'ESTIMATE_REJECTED' && (
          <View style={styles.declinedBox}>
            <ProviderIcon name="clock" color="#64748b" size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.declinedTitle}>Customer Declined Quote at ₹0 Visit Fee</Text>
              <Text style={styles.declinedSub}>
                Customer chose not to proceed with repair. Per policy, ₹0 was charged. Work order closed.
              </Text>
            </View>
          </View>
        )}

        {currentStatus === 'SERVICE_IN_PROGRESS' && (
          <View style={{ gap: 10 }}>
            {isConsultationBk && (
              <View style={styles.approvedQuoteBanner}>
                <ProviderIcon name="checkCircle" color="#16a34a" size={16} />
                <Text style={styles.approvedQuoteText}>
                  ✓ Customer Approved Quote (₹{bk?.total_bill || 0})! Repair work is authorized.
                </Text>
              </View>
            )}
            <View style={styles.mediaRow}>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => { setUploadType('before'); setMediaUploadUrl(bk?.before_media_url || ''); setMediaUploadModal(true); }}
              >
                <ProviderIcon name="camera" color="#2563eb" size={14} />
                <Text style={styles.uploadBtnText}>{bk?.before_media_url ? 'Before Photo Uploaded' : 'Upload Before Photo'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => { setUploadType('after'); setMediaUploadUrl(bk?.after_media_url || ''); setMediaUploadModal(true); }}
              >
                <ProviderIcon name="camera" color="#2563eb" size={14} />
                <Text style={styles.uploadBtnText}>{bk?.after_media_url ? 'After Photo Uploaded' : 'Upload After Photo'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1d4ed8' }]} onPress={() => { setOtpError(''); setEnteredOtp(''); setOtpModal(true); }}>
              <ProviderIcon name="key" color="#ffffff" size={16} />
              <Text style={styles.actionBtnText}>Request Customer Completion OTP</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStatus === 'BOOKING_COMPLETED' && (
          <View style={styles.completedBox}>
            <ProviderIcon name="checkCircle" color="#1d4ed8" size={18} />
            <Text style={styles.completedText}>WORK ORDER COMPLETED & SETTLED</Text>
          </View>
        )}
      </View>

      {/* INSPECTION / QUOTE BUILDER MODAL */}
      <Modal visible={inspectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isConsultationBk ? 'On-Site Diagnosis & Quote Builder' : 'Start Services & Issue Report'}
            </Text>
            <Text style={styles.modalSub}>
              {isConsultationBk ? 'Urban Company Flow • Work Order: ' : 'Work Order: '}{bk?.booking_id}
            </Text>

            {isConsultationBk && (
              <View style={styles.modalNoticeBanner}>
                <Text style={styles.modalNoticeText}>
                  💡 Free On-Site Inspection (₹0). Customer reviews and approves this quote on their app before repair begins.
                </Text>
              </View>
            )}

            {quoteError ? <Text style={styles.errorText}>{quoteError}</Text> : null}

            <ScrollView style={{ width: '100%', maxHeight: 420 }} contentContainerStyle={{ paddingHorizontal: 2, paddingBottom: 6 }} showsVerticalScrollIndicator={true}>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>
                  {isConsultationBk ? '1. Root Cause Diagnosis & Findings *' : 'Explain Technical Findings & Required Work *'}
                </Text>
                <TextInput
                  style={[styles.textInput, { height: 60 }]}
                  multiline
                  placeholder="e.g. Capacitor burnt, gas leak in copper tubing, PCB burnt..."
                  placeholderTextColor="#94a3b8"
                  value={findings}
                  onChangeText={setFindings}
                />
              </View>

              {isConsultationBk && (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>2. Spare Parts Required (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 50 MFD Capacitor, Copper flare nut"
                      placeholderTextColor="#94a3b8"
                      value={partsDescription}
                      onChangeText={setPartsDescription}
                    />
                  </View>

                  <View style={styles.rowTwo}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Spare Parts (₹)</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        value={partsCost}
                        onChangeText={setPartsCost}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Labor / Work (₹)</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                        value={labourCost}
                        onChangeText={setLabourCost}
                      />
                    </View>
                  </View>

                  <View style={styles.quoteSummaryCard}>
                    <View style={styles.quoteSummaryRow}>
                      <Text style={styles.quoteSummaryLabel}>Diagnostic Visit Fee:</Text>
                      <Text style={styles.quoteSummaryFree}>₹0 (FREE)</Text>
                    </View>
                    <View style={styles.quoteSummaryRow}>
                      <Text style={styles.quoteSummaryLabel}>Spare Parts:</Text>
                      <Text style={styles.quoteSummaryVal}>₹{parseFloat(partsCost) || 0}</Text>
                    </View>
                    <View style={styles.quoteSummaryRow}>
                      <Text style={styles.quoteSummaryLabel}>Labor / Service:</Text>
                      <Text style={styles.quoteSummaryVal}>₹{parseFloat(labourCost) || 0}</Text>
                    </View>
                    <View style={[styles.quoteSummaryRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 6, marginTop: 4 }]}>
                      <Text style={styles.quoteSummaryTotalLabel}>Total Customer Estimate:</Text>
                      <Text style={styles.quoteSummaryTotalVal}>
                        ₹{(parseFloat(partsCost) || 0) + (parseFloat(labourCost) || 0)}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              <ImageUploadField
                label={isConsultationBk ? '3. Photo / Video of Defective Part (Optional)' : 'Diagnostic Media / Video Attachment'}
                value={mediaUrl}
                onChange={setMediaUrl}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, isConsultationBk && { backgroundColor: '#1d4ed8' }]}
                onPress={isConsultationBk ? handleConsultationQuoteSubmit : handleInspectionSubmit}
              >
                <ProviderIcon name={isConsultationBk ? 'checkCircle' : 'send'} color="#ffffff" size={15} />
                <Text style={styles.primaryBtnText}>
                  {isConsultationBk
                    ? `TRANSMIT QUOTE (₹${(parseFloat(partsCost) || 0) + (parseFloat(labourCost) || 0)})`
                    : 'Submit & Assign to Admin'}
                </Text>
                <ProviderIcon name="arrowRight" color="#ffffff" size={14} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setInspectModal(false)}>
                <Text style={styles.closeModalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* VERIFY OTP MODAL */}
      <Modal visible={otpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify Customer OTP Code</Text>
            <Text style={styles.modalSub}>Ask the customer for their 4-digit completion code to finalize the job.</Text>

            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={4}
              value={enteredOtp}
              onChangeText={(val) => { setEnteredOtp(val); setOtpError(''); }}
              placeholder="Enter customer's OTP"
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtpSubmit}>
              <ProviderIcon name="checkCircle" color="#ffffff" size={15} />
              <Text style={styles.primaryBtnText}>Verify OTP & Complete Job</Text>
              <ProviderIcon name="arrowRight" color="#ffffff" size={14} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setOtpModal(false)}>
              <Text style={styles.closeModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* UPLOAD BEFORE/AFTER WORK MEDIA MODAL */}
      <Modal visible={mediaUploadModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload {uploadType === 'before' ? 'Before Work' : 'After Work'} Photo</Text>
            <Text style={styles.modalSub}>Work Order: {bk?.booking_id}</Text>

            <ImageUploadField
              label={`${uploadType === 'before' ? 'Before Work' : 'After Completion'} Media Attachment`}
              value={mediaUploadUrl}
              onChange={setMediaUploadUrl}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveWorkMedia}>
              <Text style={styles.primaryBtnText}>Save Photo Attachment</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setMediaUploadModal(false)}>
              <Text style={styles.closeModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eff6ff', width: '100%' },
  content: { padding: 14, gap: 14, width: '100%', boxSizing: 'border-box' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    cursor: 'pointer',
  },
  title: { fontSize: 19, fontWeight: '800', color: '#0f172a', lineHeight: 22 },
  subtitle: { fontSize: 11.5, color: '#64748b', lineHeight: 15 },

  card: { backgroundColor: '#ffffff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#bfdbfe', gap: 6, width: '100%', boxSizing: 'border-box', shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  custName: { fontSize: 15, fontWeight: '800', color: '#0f172a', lineHeight: 18 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  custSub: { fontSize: 11, color: '#475569', lineHeight: 15 },
  custAddr: { fontSize: 11, color: '#334155', lineHeight: 15, flex: 1 },
  callCustomerBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 11,
    borderRadius: 10,
    cursor: 'pointer',
  },
  callCustomerBtnTxt: { color: '#ffffff', fontWeight: '800', fontSize: 12.5 },

  issueName: { fontSize: 15, fontWeight: '800', color: '#0f172a', lineHeight: 18 },
  issueDesc: { fontSize: 11, color: '#475569', fontStyle: 'italic', lineHeight: 15, flex: 1 },
  mediaBox: { height: 100, borderRadius: 8, overflow: 'hidden', marginTop: 4, width: '100%' },
  mediaImg: { width: '100%', height: '100%' },

  actionConsole: { backgroundColor: '#ffffff', borderRadius: 20, padding: 18, borderWidth: 1.5, borderColor: '#bfdbfe', gap: 12, width: '100%', boxSizing: 'border-box', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  consoleTitle: { fontSize: 13.5, fontWeight: '800', color: '#0f172a', lineHeight: 18, marginBottom: 2 },
  actionBtn: { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, width: '100%', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  actionBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13, letterSpacing: 0.2, textAlign: 'center' },

  waitBox: { backgroundColor: '#fef3c7', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#fde047', width: '100%' },
  waitText: { color: '#92400e', fontWeight: '700', fontSize: 11.5, lineHeight: 16, flex: 1 },

  completedBox: { backgroundColor: '#dbeafe', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#93c5fd', width: '100%' },
  completedText: { color: '#1d4ed8', fontWeight: '800', fontSize: 13 },

  mediaRow: { flexDirection: 'row', gap: 10, width: '100%' },
  uploadBtn: { flex: 1, backgroundColor: '#eff6ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe' },
  uploadBtnText: { color: '#1d4ed8', fontWeight: '700', fontSize: 11, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'center', alignItems: 'center', padding: 12, width: '100%', boxSizing: 'border-box' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 18, padding: 18, width: '92%', maxWidth: 380, maxHeight: '90%', gap: 6, boxSizing: 'border-box', overflow: 'hidden' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', lineHeight: 22 },
  modalSub: { fontSize: 11, color: '#64748b', lineHeight: 15, marginBottom: 8 },

  fieldGroup: { marginBottom: 8 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#334155', marginTop: 4, marginBottom: 4, lineHeight: 15 },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 8, fontSize: 12, color: '#0f172a', width: '100%', boxSizing: 'border-box', lineHeight: 16 },
  previewBox: { height: 75, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#bfdbfe', width: '100%', marginTop: 6 },
  previewImg: { width: '100%', height: '100%' },

  rowTwo: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 6 },

  otpInput: { backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#2563eb', borderRadius: 10, padding: 10, fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: 6, width: '100%' },

  errorText: { color: '#dc2626', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  primaryBtn: { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 8, marginTop: 8, width: '100%' },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  closeModalBtn: { paddingVertical: 8, alignItems: 'center', width: '100%' },
  closeModalBtnText: { color: '#64748b', fontWeight: '600', fontSize: 11 },

  consultationBanner: { backgroundColor: '#eff6ff', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: '#93c5fd', gap: 6, width: '100%', boxSizing: 'border-box' },
  consultationTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  consultationTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  consultationTagText: { color: '#1e40af', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5 },
  freeBadge: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  freeBadgeText: { color: '#065f46', fontSize: 10.5, fontWeight: '800' },
  consultationHeadline: { fontSize: 13.5, fontWeight: '800', color: '#1e3a8a' },
  consultationBody: { fontSize: 11.5, color: '#1e40af', lineHeight: 16 },

  quoteWaitingCard: { backgroundColor: '#fffbeb', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#fde68a', gap: 10, width: '100%', boxSizing: 'border-box' },
  quoteWaitingHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  quoteWaitingTitle: { fontSize: 13, fontWeight: '800', color: '#92400e' },
  quoteWaitingSub: { fontSize: 11, color: '#b45309', lineHeight: 15, marginTop: 2 },
  quoteBreakdownCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#fef3c7', gap: 6 },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quoteRowLabel: { fontSize: 11.5, color: '#64748b', fontWeight: '500' },
  quoteRowVal: { fontSize: 12, color: '#0f172a', fontWeight: '700' },
  quoteTotalRow: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 6, marginTop: 4 },
  quoteTotalLabel: { fontSize: 12.5, color: '#0f172a', fontWeight: '800' },
  quoteTotalVal: { fontSize: 14, color: '#2563eb', fontWeight: '800' },
  reviseQuoteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#bfdbfe', paddingVertical: 9, borderRadius: 8 },
  reviseQuoteBtnText: { fontSize: 12, fontWeight: '700', color: '#2563eb' },

  declinedBox: { backgroundColor: '#f1f5f9', flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', width: '100%', boxSizing: 'border-box' },
  declinedTitle: { fontSize: 13, fontWeight: '800', color: '#475569' },
  declinedSub: { fontSize: 11, color: '#64748b', lineHeight: 15, marginTop: 2 },

  approvedQuoteBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ecfdf5', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#a7f3d0' },
  approvedQuoteText: { fontSize: 11.5, fontWeight: '700', color: '#065f46', flex: 1 },

  actionBtnSubtext: { color: '#bfdbfe', fontSize: 10.5, fontWeight: '600', marginTop: 2 },
  modalNoticeBanner: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 8, padding: 8, marginBottom: 8 },
  modalNoticeText: { fontSize: 11, color: '#1e40af', lineHeight: 15, fontWeight: '600' },
  quoteSummaryCard: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', gap: 4, marginVertical: 6 },
  quoteSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quoteSummaryLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  quoteSummaryFree: { fontSize: 11, color: '#16a34a', fontWeight: '800' },
  quoteSummaryVal: { fontSize: 11.5, color: '#0f172a', fontWeight: '700' },
  quoteSummaryTotalLabel: { fontSize: 12, color: '#0f172a', fontWeight: '800' },
  quoteSummaryTotalVal: { fontSize: 13.5, color: '#2563eb', fontWeight: '800' },
});
