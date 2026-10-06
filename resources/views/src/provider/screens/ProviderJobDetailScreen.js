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

  const targetBookingId = routeBookingId || propsBookingId;
  const bk = bookings.find((b) => b.booking_id === targetBookingId);

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
    PROVIDER_ARRIVED: 'ARRIVED ON SITE',
    ISSUE_INSPECTED: 'INSPECTION COMPLETED',
    ASSIGNED_TO_ADMIN: 'INSPECTION SENT TO ADMIN',
    AWAITING_USER_APPROVAL: 'AWAITING CUSTOMER APPROVAL',
    SERVICE_IN_PROGRESS: 'WORK IN PROGRESS',
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
          <TouchableOpacity style={styles.actionBtn} onPress={() => setInspectModal(true)}>
            <ProviderIcon name="flash" color="#ffffff" size={16} />
            <Text style={styles.actionBtnText}>START SERVICES & FIELD REPORT</Text>
          </TouchableOpacity>
        )}

        {(currentStatus === 'ISSUE_INSPECTED' || currentStatus === 'ASSIGNED_TO_ADMIN') && (
          <View style={styles.waitBox}>
            <ProviderIcon name="clock" color="#d97706" size={16} />
            <Text style={styles.waitText}>Inspection Submitted! Assigned to Admin for estimate bill calculation...</Text>
          </View>
        )}

        {currentStatus === 'AWAITING_USER_APPROVAL' && (
          <View style={styles.waitBox}>
            <ProviderIcon name="clock" color="#d97706" size={16} />
            <Text style={styles.waitText}>Estimate Sent! Waiting for Customer to Approve Bill...</Text>
          </View>
        )}

        {currentStatus === 'SERVICE_IN_PROGRESS' && (
          <View style={{ gap: 10 }}>
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

      {/* INSPECTION MODAL WITH IMAGE UPLOAD FIELD */}
      <Modal visible={inspectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start Services & Issue Report</Text>
            <Text style={styles.modalSub}>Work Order: {bk?.booking_id}</Text>

            <ScrollView style={{ width: '100%', maxHeight: 420 }} contentContainerStyle={{ paddingHorizontal: 2, paddingBottom: 6 }} showsVerticalScrollIndicator={true}>
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Explain Technical Findings & Required Work *</Text>
                <TextInput style={[styles.textInput, { height: 60 }]} multiline value={findings} onChangeText={setFindings} />
              </View>

              <ImageUploadField
                label="Diagnostic Media / Video Attachment"
                value={mediaUrl}
                onChange={setMediaUrl}
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleInspectionSubmit}>
                <ProviderIcon name="send" color="#ffffff" size={15} />
                <Text style={styles.primaryBtnText}>Submit & Assign to Admin</Text>
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
});
