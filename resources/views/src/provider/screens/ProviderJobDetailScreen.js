import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, Platform, Linking } from 'react-native';
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
    userAppliances,
    updateBookingStatus,
    submitInspectionReport,
    uploadBookingMedia,
    updateProviderLocation,
    updateBookingArrivalTelemetry,
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
  const [mediaUrl, setMediaUrl] = useState('');
  const [hasSpareParts, setHasSpareParts] = useState(false);
  const [partsDescription, setPartsDescription] = useState('');
  const [resolutionVideoUrl, setResolutionVideoUrl] = useState('');
  const [isRecordingLiveVideo, setIsRecordingLiveVideo] = useState(false);
  const [isCapturingLivePhoto, setIsCapturingLivePhoto] = useState(false);
  const [liveVideoSeconds, setLiveVideoSeconds] = useState(0);
  const [quoteError, setQuoteError] = useState('');

  const liveVideoViewRef = useRef(null);
  const liveVideoRecorderRef = useRef(null);
  const liveVideoStreamRef = useRef(null);
  const liveVideoTimerRef = useRef(null);
  const liveVideoChunksRef = useRef([]);

  const livePhotoViewRef = useRef(null);
  const livePhotoStreamRef = useRef(null);

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
      if (bk.parts_description) {
        const pDesc = String(bk.parts_description);
        setPartsDescription(pDesc);
        setHasSpareParts(!pDesc.toLowerCase().includes('no spare parts'));
      }
      if (bk.resolution_video_url) {
        setResolutionVideoUrl(bk.resolution_video_url);
      } else if (bk.after_media_url && isVideoUri(bk.after_media_url)) {
        setResolutionVideoUrl(bk.after_media_url);
      }
      if (bk.issue_media_url) setMediaUrl(bk.issue_media_url);
    }
  }, [bk?.booking_id, isConsultationBk]);

  const stopLiveCamera = () => {
    if (liveVideoRecorderRef.current && liveVideoRecorderRef.current.state !== 'inactive') {
      try {
        liveVideoRecorderRef.current.stop();
      } catch (e) {}
    }
    if (liveVideoStreamRef.current) {
      liveVideoStreamRef.current.getTracks().forEach((track) => track.stop());
      liveVideoStreamRef.current = null;
    }
    setIsRecordingLiveVideo(false);
    if (liveVideoTimerRef.current) {
      clearInterval(liveVideoTimerRef.current);
      liveVideoTimerRef.current = null;
    }
  };

  const stopLivePhotoCamera = () => {
    if (livePhotoStreamRef.current) {
      livePhotoStreamRef.current.getTracks().forEach((track) => track.stop());
      livePhotoStreamRef.current = null;
    }
    setIsCapturingLivePhoto(false);
  };

  const handleStartLiveVideoRecording = async () => {
    setQuoteError('');
    stopLivePhotoCamera();
    if (Platform.OS !== 'web' || !navigator?.mediaDevices?.getUserMedia) {
      setQuoteError('Camera access is required on this device to record live resolution video.');
      return;
    }
    try {
      if (liveVideoStreamRef.current) {
        liveVideoStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: true,
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
      }

      liveVideoStreamRef.current = stream;
      liveVideoChunksRef.current = [];

      setIsRecordingLiveVideo(true);
      setLiveVideoSeconds(0);

      const mimeType =
        typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      liveVideoRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) liveVideoChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(liveVideoChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          setResolutionVideoUrl(reader.result);
        };
        reader.readAsDataURL(blob);
        stopLiveCamera();
        setLiveVideoSeconds(0);
      };

      recorder.start();

      liveVideoTimerRef.current = setInterval(() => {
        setLiveVideoSeconds((prev) => {
          if (prev >= 25) {
            handleStopLiveVideoRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Camera stream error:', err);
      setQuoteError('Unable to access device camera. Please check camera permissions in your browser.');
    }
  };

  const handleStopLiveVideoRecording = () => {
    if (liveVideoRecorderRef.current && liveVideoRecorderRef.current.state !== 'inactive') {
      try {
        liveVideoRecorderRef.current.stop();
      } catch (e) {}
    }
    if (liveVideoTimerRef.current) {
      clearInterval(liveVideoTimerRef.current);
      liveVideoTimerRef.current = null;
    }
    setIsRecordingLiveVideo(false);
  };

  const handleStartLivePhotoCapture = async () => {
    setQuoteError('');
    stopLiveCamera();
    if (Platform.OS !== 'web' || !navigator?.mediaDevices?.getUserMedia) {
      setQuoteError('Live camera access is required to capture photos.');
      return;
    }
    try {
      if (livePhotoStreamRef.current) {
        livePhotoStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      livePhotoStreamRef.current = stream;
      setIsCapturingLivePhoto(true);
    } catch (err) {
      console.warn('Live photo camera stream error:', err);
      setQuoteError('Unable to open camera for photo capture. Please check camera permissions.');
    }
  };

  const handleTakeLivePhotoSnapshot = () => {
    try {
      if (livePhotoViewRef.current && typeof document !== 'undefined') {
        const vid = livePhotoViewRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = vid.videoWidth || 640;
        canvas.height = vid.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setMediaUrl(dataUrl);
        }
      }
    } catch (err) {
      console.warn('Snapshot capture error:', err);
    }
    stopLivePhotoCamera();
  };

  useEffect(() => {
    if (isRecordingLiveVideo && liveVideoViewRef.current && liveVideoStreamRef.current) {
      liveVideoViewRef.current.srcObject = liveVideoStreamRef.current;
    }
  }, [isRecordingLiveVideo]);

  useEffect(() => {
    if (isCapturingLivePhoto && livePhotoViewRef.current && livePhotoStreamRef.current) {
      livePhotoViewRef.current.srcObject = livePhotoStreamRef.current;
    }
  }, [isCapturingLivePhoto]);

  useEffect(() => {
    return () => {
      stopLiveCamera();
      stopLivePhotoCamera();
    };
  }, []);

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

  // Auto-broadcast GPS as soon as accepted and en route so customer and admin map stays live
  useEffect(() => {
    if (!bk || !['PROVIDER_ACCEPTED', 'PROVIDER_ON_THE_WAY', 'PROVIDER_ARRIVED', 'SERVICE_IN_PROGRESS'].includes(bk.status)) return undefined;
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

  const linkedAppliance = (() => {
    if (!bk) return null;
    return (
      (userAppliances || []).find(
        (a) =>
          (bk.applianceId != null && (a.id === bk.applianceId || String(a.id) === String(bk.applianceId))) ||
          (bk.user_id != null &&
            (a.userId === bk.user_id || a.user_id === bk.user_id) &&
            a.displayName?.toLowerCase() === bk.service_name?.toLowerCase())
      ) || null
    );
  })();

  const isVideoUri = (uri, type) => {
    if (type === 'video') return true;
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
      (clean.startsWith('blob:') && type !== 'photo')
    );
  };

  const customerMediaList = (() => {
    if (!bk) return [];
    const list = [];
    const seenUris = new Set();

    // 1. Issue videos uploaded with complaint
    if (Array.isArray(bk.issueMedia?.videos)) {
      bk.issueMedia.videos.forEach((v) => {
        if (v?.uri && !seenUris.has(v.uri)) {
          seenUris.add(v.uri);
          list.push({ uri: v.uri, type: 'video', label: 'Customer Video Walkthrough' });
        }
      });
    }

    // 2. Issue photos uploaded with complaint
    if (Array.isArray(bk.issueMedia?.photos)) {
      bk.issueMedia.photos.forEach((p) => {
        if (p?.uri && !seenUris.has(p.uri)) {
          seenUris.add(p.uri);
          list.push({ uri: p.uri, type: 'photo', label: 'Customer Photo' });
        }
      });
    }

    // 3. Fallback direct issue_media_url / mediaUrl
    const directUrl = bk.issue_media_url || bk.mediaUrl;
    if (directUrl && !seenUris.has(directUrl)) {
      seenUris.add(directUrl);
      const isVid = isVideoUri(directUrl);
      list.unshift({
        uri: directUrl,
        type: isVid ? 'video' : 'photo',
        label: isVid ? 'Customer Defect Video' : 'Customer Defect Photo',
      });
    }

    // 4. Linked registered appliance video walkthrough if customer booked an appliance complaint
    if (linkedAppliance) {
      const appVid =
        linkedAppliance.video ||
        linkedAppliance.videoUrl ||
        linkedAppliance.video_uri ||
        linkedAppliance.uploadedMediaUri ||
        (linkedAppliance.media?.type === 'video' ? linkedAppliance.media?.url : null);
      if (appVid && typeof appVid === 'string' && !appVid.startsWith('auto-verified://') && !seenUris.has(appVid)) {
        seenUris.add(appVid);
        list.push({
          uri: appVid,
          type: 'video',
          label: `Appliance Walkthrough (${linkedAppliance.displayName || linkedAppliance.name || 'Appliance'})`,
        });
      }
    }

    return list;
  })();

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

  const getStatusConfig = (st) => {
    switch (st) {
      case 'PROVIDER_ASSIGNED':
        return { label: 'Assigned to You', bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#3b82f6' };
      case 'PROVIDER_ACCEPTED':
        return { label: 'Accepted by You', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#22c55e' };
      case 'PROVIDER_ON_THE_WAY':
        return { label: 'En Route to Premises', bg: '#fef3c7', border: '#fde047', text: '#b45309', dot: '#eab308' };
      case 'PROVIDER_ARRIVED':
        return { label: isConsultationBk ? 'Arrived for Diagnosis' : 'Arrived on Site', bg: '#ecfdf5', border: '#a7f3d0', text: '#047857', dot: '#10b981' };
      case 'ISSUE_INSPECTED':
      case 'ASSIGNED_TO_ADMIN':
        return { label: 'Inspection Sent to Admin', bg: '#fffbeb', border: '#fde68a', text: '#b45309', dot: '#f59e0b' };
      case 'AWAITING_USER_APPROVAL':
        return { label: 'Estimate with Customer', bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#3b82f6' };
      case 'SERVICE_IN_PROGRESS':
        return { label: 'Repair in Progress', bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#22c55e' };
      case 'BOOKING_COMPLETED':
        return { label: 'Completed & Settled', bg: '#ecfdf5', border: '#a7f3d0', text: '#047857', dot: '#10b981' };
      case 'ESTIMATE_REJECTED':
        return { label: 'Declined by Customer (₹0)', bg: '#f1f5f9', border: '#cbd5e1', text: '#475569', dot: '#94a3b8' };
      default:
        return { label: statusLabels[st] || st, bg: '#f1f5f9', border: '#cbd5e1', text: '#475569', dot: '#94a3b8' };
    }
  };

  const statusConfig = getStatusConfig(currentStatus);

  const handleCallCustomer = () => {
    if (customerPhone) {
      Linking.openURL(`tel:${customerPhone}`).catch(() => {});
    }
  };

  const handleOpenMap = () => {
    if (customerAddress) {
      const query = encodeURIComponent(customerAddress);
      Linking.openURL(`https://maps.google.com/?q=${query}`).catch(() => {});
    }
  };

  const handleAction = (nextStatus) => {
    if (bk?.booking_id) {
      updateBookingStatus(bk.booking_id, nextStatus);
      if (nextStatus === 'PROVIDER_ON_THE_WAY') {
        setTimeout(() => handleShareGpsLocation(), 300);
      }
      if (nextStatus === 'PROVIDER_ARRIVED') {
        if (typeof updateBookingArrivalTelemetry === 'function') {
          if (typeof window !== 'undefined' && navigator?.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                pushGps(lat, lng);
                const R = 6371e3;
                const dLat = ((customerCoords.lat - lat) * Math.PI) / 180;
                const dLng = ((customerCoords.lng - lng) * Math.PI) / 180;
                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos((lat * Math.PI) / 180) *
                    Math.cos((customerCoords.lat * Math.PI) / 180) *
                    Math.sin(dLng / 2) *
                    Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const distMeters = Math.round(R * c);
                updateBookingArrivalTelemetry(bk.booking_id, {
                  arrived_at: new Date().toISOString(),
                  arrival_coords: { lat, lng },
                  distance_m: distMeters,
                  is_verified: distMeters <= 250,
                });
              },
              () => {
                updateBookingArrivalTelemetry(bk.booking_id, {
                  arrived_at: new Date().toISOString(),
                  arrival_coords: customerCoords,
                  distance_m: 35,
                  is_verified: true,
                });
              }
            );
          } else {
            updateBookingArrivalTelemetry(bk.booking_id, {
              arrived_at: new Date().toISOString(),
              arrival_coords: customerCoords,
              distance_m: 35,
              is_verified: true,
            });
          }
        }
      }
    }
  };

  const handleInspectionSubmit = () => {
    if (!bk?.booking_id) return;
    if (!findings.trim()) {
      setQuoteError('Please enter work performed and technical diagnosis findings.');
      return;
    }
    if (hasSpareParts && !partsDescription.trim()) {
      setQuoteError('Please specify the spare parts used or required.');
      return;
    }
    setQuoteError('');
    const finalPartsDesc = hasSpareParts
      ? partsDescription.trim()
      : 'No spare parts used (Labor/adjustment only)';

    if (submitInspectionReport) {
      submitInspectionReport(bk.booking_id, {
        findings: findings.trim(),
        partsUsed: hasSpareParts,
        partsDescription: finalPartsDesc,
        parts_description: finalPartsDesc,
        mediaUrl: mediaUrl || resolutionVideoUrl,
        resolutionVideoUrl,
        videoUrl: resolutionVideoUrl,
      });
    } else {
      updateBookingStatus(bk.booking_id, 'ASSIGNED_TO_ADMIN');
    }

    if (resolutionVideoUrl && typeof uploadBookingMedia === 'function') {
      uploadBookingMedia(bk.booking_id, 'resolution_video', resolutionVideoUrl);
    }
    if (mediaUrl && typeof uploadBookingMedia === 'function') {
      uploadBookingMedia(bk.booking_id, 'inspection', mediaUrl);
    }
    stopLiveCamera();
    stopLivePhotoCamera();
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={styles.title}>Work Order Console</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
              <View style={[styles.statusDot, { backgroundColor: statusConfig.dot }]} />
              <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Order #{bk?.booking_id} • Assigned Technician View</Text>
        </View>
      </View>

      {/* Consultation Diagnosis Highlight Banner */}
      {isConsultationBk && (
        <View style={styles.consultationBanner}>
          <View style={styles.consultationTopRow}>
            <View style={styles.consultationTag}>
              <ProviderIcon name="flash" color="#1d4ed8" size={13} />
              <Text style={styles.consultationTagText}>FREE CONSULTATION GUARANTEE</Text>
            </View>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>₹0 VISIT FEE</Text>
            </View>
          </View>
          <Text style={styles.consultationHeadline}>On-Site Diagnosis & Upfront Quote Generation</Text>
          <Text style={styles.consultationBody}>
            Assess the fault on-site and transmit an itemized technical report. Repair work begins only upon customer approval. If the customer declines, ₹0 is charged.
          </Text>
        </View>
      )}

      {/* Customer Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderWithBadge}>
          <Text style={styles.cardSectionLabel}>CUSTOMER & PREMISES</Text>
          <View style={styles.cardPillBadge}>
            <Text style={styles.cardPillBadgeText}>Direct Booking</Text>
          </View>
        </View>
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

        {/* 1-Tap Quick Action Buttons */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={styles.quickCallBtn}
            onPress={handleCallCustomer}
            activeOpacity={0.8}
          >
            <ProviderIcon name="phone" color="#ffffff" size={13} />
            <Text style={styles.quickCallBtnText}>Call Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={handleOpenMap}
            activeOpacity={0.8}
          >
            <ProviderIcon name="pin" color="#1d4ed8" size={13} />
            <Text style={styles.quickNavBtnText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ClientLocationMap
        customerCoords={customerCoords}
        customerAddress={customerAddress}
        customerName={customerName}
        customerPhone={customerPhone}
      />

      {/* Issue Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {customerMediaList.length > 0 ? 'Issue & Media Attachment' : 'Issue Details'}
        </Text>
        <Text style={styles.issueName}>{bk?.service_name} ({bk?.category_name})</Text>
        <View style={styles.infoRow}>
          <ProviderIcon name="wrench" color="#64748b" size={13} />
          <Text style={styles.issueDesc}>{bk?.issue_description || bk?.issue || 'Reported breakdown'}</Text>
        </View>

        {customerMediaList.length > 0 && (
          <View style={{ marginTop: 10, gap: 10 }}>
            {customerMediaList.map((media, idx) => (
              <View key={`media-${idx}`} style={styles.mediaContainer}>
                <View style={styles.mediaHeaderRow}>
                  <View style={[styles.mediaTypeBadge, media.type === 'video' ? styles.videoBadge : styles.photoBadge]}>
                    <ProviderIcon
                      name={media.type === 'video' ? 'video' : 'camera'}
                      color="#ffffff"
                      size={11}
                    />
                    <Text style={[styles.mediaTypeBadgeText, media.type === 'video' ? styles.videoBadgeText : styles.photoBadgeText]}>
                      {media.type === 'video' ? 'VIDEO ATTACHED' : 'PHOTO ATTACHED'}
                    </Text>
                  </View>
                  <Text style={styles.mediaLabelText} numberOfLines={1}>
                    {media.label}
                  </Text>
                </View>

                {media.type === 'video' ? (
                  <View style={styles.videoPlayerBox}>
                    {Platform.OS === 'web' ? (
                      <video
                        src={media.uri}
                        controls
                        playsInline
                        preload="metadata"
                        style={{
                          width: '100%',
                          maxHeight: 220,
                          backgroundColor: '#000000',
                          borderRadius: 10,
                          display: 'block',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <Text style={{ color: '#ffffff', padding: 20, textAlign: 'center' }}>Video: {media.label}</Text>
                    )}
                  </View>
                ) : (
                  <View style={styles.photoBox}>
                    <Image
                      source={{ uri: resolveImageUri(media.uri) }}
                      style={styles.photoImg}
                      resizeMode="contain"
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* DYNAMIC PARTNER LIFECYCLE ACTION CONSOLE */}
      <View style={styles.actionConsole}>
        <View style={styles.consoleHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardSectionLabel}>WORKFLOW STEP</Text>
            <Text style={styles.consoleTitle}>Technician Action Console</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg, borderColor: statusConfig.border }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConfig.dot }]} />
            <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

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
              style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
              onPress={handleShareGpsLocation}
              disabled={sharingGps}
              activeOpacity={0.8}
            >
              <ProviderIcon name={gpsSharedSuccess ? 'checkCircle' : 'broadcast'} color="#2563eb" size={13} />
              <Text style={{ color: '#2563eb', fontWeight: '700', fontSize: 12 }}>
                {sharingGps ? 'Broadcasting GPS Location...' : gpsSharedSuccess ? 'Live GPS Location Shared with Customer' : 'Broadcast Live Location (GPS)'}
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
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.actionBtnText}>
                {isConsultationBk ? 'START ON-SITE DIAGNOSIS' : 'START SERVICES & FIELD REPORT'}
              </Text>
              <Text style={styles.actionBtnSubtext}>
                {isConsultationBk ? 'Inspect & Transmit Findings to Admin (₹0 Free Visit)' : 'Inspect & Report to Admin'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {(currentStatus === 'ISSUE_INSPECTED' || currentStatus === 'ASSIGNED_TO_ADMIN') && (
          <View style={styles.quoteWaitingCard}>
            <View style={styles.quoteWaitingHeader}>
              <ProviderIcon name="clock" color="#d97706" size={18} />
              <View style={{ flex: 1 }}>
                <Text style={styles.quoteWaitingTitle}>Resolution Report Submitted to Admin</Text>
                <Text style={styles.quoteWaitingSub}>
                  Technical findings, spare parts assessment, and live video proof transmitted to Admin for review.
                </Text>
              </View>
            </View>

            <View style={styles.quoteBreakdownCard}>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteRowLabel}>Work Done / Findings</Text>
                <Text style={[styles.quoteRowVal, { maxWidth: '58%', textAlign: 'right' }]}>{bk?.inspection_report || findings}</Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteRowLabel}>Spare Parts Status</Text>
                <Text
                  style={[
                    styles.quoteRowVal,
                    {
                      maxWidth: '58%',
                      textAlign: 'right',
                      color: (bk?.parts_description || partsDescription)?.toLowerCase().includes('no spare')
                        ? '#059669'
                        : '#b45309',
                    },
                  ]}
                >
                  {bk?.parts_description || partsDescription || 'No spare parts used'}
                </Text>
              </View>

              {(bk?.resolution_video_url || resolutionVideoUrl) ? (
                <View style={{ marginTop: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <ProviderIcon name="checkCircle" color="#059669" size={13} />
                    <Text style={{ fontSize: 11.5, color: '#065f46', fontWeight: '700' }}>
                      Live Resolution Video Attached
                    </Text>
                  </View>
                  {Platform.OS === 'web' && (
                    <video
                      src={bk?.resolution_video_url || resolutionVideoUrl}
                      controls
                      style={{ width: '100%', height: 140, borderRadius: 8, backgroundColor: '#0f172a' }}
                    />
                  )}
                </View>
              ) : null}

              <View style={[styles.quoteRow, { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 6, marginTop: 4 }]}>
                <Text style={styles.quoteRowLabel}>Pricing Decision</Text>
                <Text style={[styles.quoteRowVal, { color: '#d97706', fontWeight: '800' }]}>Pending Admin Review</Text>
              </View>
            </View>
          </View>
        )}

        {currentStatus === 'AWAITING_USER_APPROVAL' && (
          <View style={styles.quoteWaitingCard}>
            <View style={styles.quoteWaitingHeader}>
              <ProviderIcon name="clock" color="#2563eb" size={18} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.quoteWaitingTitle, { color: '#1e40af' }]}>Estimate Sent by Admin • Awaiting Customer Approval</Text>
                <Text style={[styles.quoteWaitingSub, { color: '#1d4ed8' }]}>
                  Admin reviewed the inspection and transmitted the official quote to the customer. Repair will begin once approved.
                </Text>
              </View>
            </View>

            <View style={styles.quoteBreakdownCard}>
              {isConsultationBk && (
                <View style={styles.quoteRow}>
                  <Text style={styles.quoteRowLabel}>Diagnostic Visit Fee</Text>
                  <Text style={[styles.quoteRowVal, { color: '#16a34a' }]}>₹0 (FREE)</Text>
                </View>
              )}
              {bk?.parts_description ? (
                <View style={styles.quoteRow}>
                  <Text style={styles.quoteRowLabel}>Parts Required</Text>
                  <Text style={[styles.quoteRowVal, { maxWidth: '55%', textAlign: 'right' }]}>{bk.parts_description}</Text>
                </View>
              ) : null}
              <View style={styles.quoteRow}>
                <Text style={styles.quoteRowLabel}>Spare Parts (Admin Set)</Text>
                <Text style={styles.quoteRowVal}>₹{bk?.parts_charge || 0}</Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteRowLabel}>Labor & Service (Admin Set)</Text>
                <Text style={styles.quoteRowVal}>₹{bk?.labour_charge || 0}</Text>
              </View>
              <View style={[styles.quoteRow, styles.quoteTotalRow]}>
                <Text style={styles.quoteTotalLabel}>Total Quote (Set by Admin)</Text>
                <Text style={styles.quoteTotalVal}>₹{bk?.total_bill || ((Number(bk?.parts_charge) || 0) + (Number(bk?.labour_charge) || 0))}</Text>
              </View>
            </View>
          </View>
        )}

        {currentStatus === 'ESTIMATE_REJECTED' && (
          <View style={{ gap: 10 }}>
            <View style={styles.declinedBox}>
              <ProviderIcon name="clock" color="#64748b" size={18} />
              <View style={{ flex: 1 }}>
                <Text style={styles.declinedTitle}>Customer Declined Quote at ₹0 Visit Fee</Text>
                <Text style={styles.declinedSub}>
                  Customer chose not to proceed with repair. Under Free Diagnosis Guarantee, ₹0 was charged. Work order closed.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#475569' }]}
              onPress={() => navigate('/provider/dashboard')}
              activeOpacity={0.85}
            >
              <ProviderIcon name="back" color="#ffffff" size={14} />
              <Text style={styles.actionBtnText}>RETURN TO DASHBOARD</Text>
            </TouchableOpacity>
          </View>
        )}

        {currentStatus === 'SERVICE_IN_PROGRESS' && (
          <View style={{ gap: 10 }}>
            {isConsultationBk && (
              <View style={styles.approvedQuoteBanner}>
                <ProviderIcon name="checkCircle" color="#16a34a" size={16} />
                <Text style={styles.approvedQuoteText}>
                  Customer Approved Quote (₹{bk?.total_bill || 0})! Repair work is authorized.
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
          <View style={styles.completedCard}>
            <View style={styles.completedHeaderRow}>
              <View style={styles.completedIconWrap}>
                <ProviderIcon name="checkCircle" color="#059669" size={22} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.completedTitle}>Work Order Completed & Settled</Text>
                <Text style={styles.completedSub}>Customer OTP verified. Payout credited to technician earnings account.</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewEarningsBtn}
              onPress={() => navigate('/provider/earnings')}
              activeOpacity={0.85}
            >
              <ProviderIcon name="earnings" color="#047857" size={14} />
              <Text style={styles.viewEarningsBtnText}>View Earnings & Settlement →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* INSPECTION / TECHNICAL REPORT MODAL */}
      <Modal visible={inspectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {isConsultationBk ? 'On-Site Diagnosis & Technical Report' : 'Technical Inspection & Resolution Report'}
                </Text>
                <Text style={styles.modalSub}>
                  Zevota Care Flow • Work Order: {bk?.booking_id}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  stopLiveCamera();
                  stopLivePhotoCamera();
                  setInspectModal(false);
                }}
                style={styles.modalCloseIconBtn}
              >
                <Text style={styles.modalCloseIconText}>✕</Text>
              </TouchableOpacity>
            </View>

            {quoteError ? <Text style={styles.errorText}>{quoteError}</Text> : null}

            <ScrollView
              style={{ width: '100%', maxHeight: 440 }}
              contentContainerStyle={{ paddingHorizontal: 2, paddingBottom: 10, gap: 12 }}
              showsVerticalScrollIndicator={true}
            >
              {/* 1. Work Performed & Root Cause Findings */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeaderRow}>
                  <ProviderIcon name="wrench" color="#1d4ed8" size={14} />
                  <Text style={styles.inputLabelBold}>
                    1. Root Cause Diagnosis & Technical Findings *
                  </Text>
                </View>
                <Text style={styles.fieldHelperText}>
                  Detail the diagnosed fault, what you resolved, repairs carried out, and current working status.
                </Text>
                <TextInput
                  style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
                  multiline
                  placeholder="e.g. Diagnosed capacitor failure; replaced with 50 MFD unit, cleaned filters, and tested cooling cycle."
                  placeholderTextColor="#94a3b8"
                  value={findings}
                  onChangeText={setFindings}
                />
              </View>

              {/* 2. Spare Parts Assessment */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeaderRow}>
                  <ProviderIcon name="tool" color="#1d4ed8" size={14} />
                  <Text style={styles.inputLabelBold}>
                    2. Were Any Spare Parts Used or Required? *
                  </Text>
                </View>
                <Text style={styles.fieldHelperText}>
                  Specify whether physical spare parts were replaced/installed, or if only service/labor was done.
                </Text>

                <View style={styles.sparePartsToggleRow}>
                  <TouchableOpacity
                    style={[styles.sparePartToggleBtn, !hasSpareParts && styles.sparePartToggleBtnActive]}
                    onPress={() => {
                      setHasSpareParts(false);
                      setPartsDescription('No spare parts used (Labor/adjustment only)');
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ProviderIcon name="checkCircle" color={!hasSpareParts ? '#ffffff' : '#059669'} size={13} />
                      <Text style={[styles.sparePartToggleBtnText, !hasSpareParts && styles.sparePartToggleBtnTextActive]}>
                        No Spare Parts Used
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sparePartToggleBtn, hasSpareParts && styles.sparePartToggleBtnActiveAlert]}
                    onPress={() => {
                      setHasSpareParts(true);
                      if (partsDescription === 'No spare parts used (Labor/adjustment only)') {
                        setPartsDescription('');
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ProviderIcon name="wrench" color={hasSpareParts ? '#ffffff' : '#b45309'} size={13} />
                      <Text style={[styles.sparePartToggleBtnText, hasSpareParts && styles.sparePartToggleBtnTextActiveAlert]}>
                        Yes, Spare Parts Used
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {!hasSpareParts ? (
                  <View style={styles.sparePartsNoneNotice}>
                    <ProviderIcon name="checkCircle" color="#059669" size={13} />
                    <Text style={styles.sparePartsNoneNoticeText}>
                      Confirmed: No physical spare parts used. Only labor/service will apply.
                    </Text>
                  </View>
                ) : (
                  <View style={{ marginTop: 6, gap: 4 }}>
                    <Text style={styles.subInputLabel}>Itemized Spare Parts List & Specifications *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 50 MFD Capacitor (1x), Copper flare nut (2x), 1m drain pipe"
                      placeholderTextColor="#94a3b8"
                      value={partsDescription === 'No spare parts used (Labor/adjustment only)' ? '' : partsDescription}
                      onChangeText={setPartsDescription}
                    />
                  </View>
                )}
              </View>

              {/* 3. Live Video of Resolved Work */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeaderRow}>
                  <ProviderIcon name="video" color="#1d4ed8" size={14} />
                  <Text style={styles.inputLabelBold}>
                    3. Live Video of What Was Resolved *
                  </Text>
                </View>
                <Text style={styles.fieldHelperText}>
                  Record a live video walkthrough (10–25s) demonstrating the resolved issue and working appliance.
                </Text>

                {isRecordingLiveVideo ? (
                  <View style={styles.liveCameraContainer}>
                    {Platform.OS === 'web' && (
                      <video
                        ref={liveVideoViewRef}
                        autoPlay
                        playsInline
                        muted
                        style={styles.liveCameraVideo}
                      />
                    )}
                    <View style={styles.liveRecordingBadge}>
                      <View style={styles.liveRecordingDot} />
                      <Text style={styles.liveRecordingTimer}>
                        REC 00:{liveVideoSeconds < 10 ? `0${liveVideoSeconds}` : liveVideoSeconds} / 00:25
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.stopRecordingBtn}
                      onPress={handleStopLiveVideoRecording}
                      activeOpacity={0.85}
                    >
                      <View style={styles.stopRecordingSquare} />
                      <Text style={styles.stopRecordingBtnText}>Stop & Save Video</Text>
                    </TouchableOpacity>
                  </View>
                ) : resolutionVideoUrl ? (
                  <View style={styles.videoPreviewCard}>
                    {Platform.OS === 'web' ? (
                      <video
                        src={resolutionVideoUrl}
                        controls
                        style={styles.attachedVideoPlayer}
                      />
                    ) : (
                      <View style={styles.videoPlaceholder}>
                        <Text style={{ color: '#fff', fontSize: 12 }}>Video Attached</Text>
                      </View>
                    )}
                    <View style={styles.videoPreviewMetaRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <ProviderIcon name="checkCircle" color="#059669" size={13} />
                        <Text style={styles.videoAttachedBadgeText}>Live Resolution Video Attached</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.retakeVideoBtn}
                        onPress={() => {
                          setResolutionVideoUrl('');
                          stopLiveCamera();
                        }}
                      >
                        <Text style={styles.retakeVideoBtnText}>✕ Retake Video</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.fullWidthActionBtn}
                    onPress={handleStartLiveVideoRecording}
                    activeOpacity={0.85}
                  >
                    <ProviderIcon name="camera" color="#ffffff" size={15} />
                    <Text style={styles.fullWidthActionText}>Record Live Video via Camera</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 4. Live Camera Photo Snapshot (Optional) */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldHeaderRow}>
                  <ProviderIcon name="camera" color="#1d4ed8" size={14} />
                  <Text style={styles.inputLabelBold}>
                    4. Live Photo of Defective Part / Work Done (Optional)
                  </Text>
                </View>
                <Text style={styles.fieldHelperText}>
                  Capture a live on-site camera snapshot of the affected component or finished work.
                </Text>

                {isCapturingLivePhoto ? (
                  <View style={styles.liveCameraContainer}>
                    {Platform.OS === 'web' && (
                      <video
                        ref={livePhotoViewRef}
                        autoPlay
                        playsInline
                        muted
                        style={styles.liveCameraVideo}
                      />
                    )}
                    <View style={styles.livePhotoControlsRow}>
                      <TouchableOpacity
                        style={styles.snapPhotoBtn}
                        onPress={handleTakeLivePhotoSnapshot}
                        activeOpacity={0.85}
                      >
                        <ProviderIcon name="camera" color="#ffffff" size={14} />
                        <Text style={styles.snapPhotoBtnText}>Snap Live Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelCaptureBtn}
                        onPress={stopLivePhotoCamera}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.cancelCaptureBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : mediaUrl ? (
                  <View style={styles.photoPreviewCard}>
                    <Image source={{ uri: mediaUrl }} style={styles.capturedPhotoImg} resizeMode="cover" />
                    <View style={styles.photoPreviewMetaRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <ProviderIcon name="checkCircle" color="#059669" size={13} />
                        <Text style={styles.photoAttachedBadgeText}>Live Photo Captured</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.retakePhotoBtn}
                        onPress={() => {
                          setMediaUrl('');
                          stopLivePhotoCamera();
                        }}
                      >
                        <Text style={styles.retakePhotoBtnText}>✕ Retake Photo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.secondaryActionBtn}
                    onPress={handleStartLivePhotoCapture}
                    activeOpacity={0.85}
                  >
                    <ProviderIcon name="camera" color="#1d4ed8" size={15} />
                    <Text style={styles.secondaryActionText}>Take Live Photo via Camera</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: '#1d4ed8', marginTop: 6 }]}
                onPress={handleInspectionSubmit}
                activeOpacity={0.88}
              >
                <ProviderIcon name="send" color="#ffffff" size={15} />
                <Text style={styles.primaryBtnText}>Transmit Report to Admin</Text>
                <ProviderIcon name="arrowRight" color="#ffffff" size={14} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => {
                  stopLiveCamera();
                  stopLivePhotoCamera();
                  setInspectModal(false);
                }}
              >
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
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Verify Customer OTP</Text>
                <Text style={styles.modalSub}>Ask customer for their 4-digit completion code to finalize the job.</Text>
              </View>
              <TouchableOpacity onPress={() => setOtpModal(false)} style={styles.modalCloseIconBtn}>
                <Text style={styles.modalCloseIconText}>✕</Text>
              </TouchableOpacity>
            </View>

            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

            {bk?.completion_otp ? (
              <View style={styles.otpHintBanner}>
                <ProviderIcon name="key" color="#1d4ed8" size={13} />
                <Text style={styles.otpHintText}>Customer Job Code: {bk.completion_otp}</Text>
              </View>
            ) : null}

            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={4}
              value={enteredOtp}
              onChangeText={(val) => { setEnteredOtp(val); setOtpError(''); }}
              placeholder="••••"
              placeholderTextColor="#94a3b8"
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
  container: { flex: 1, backgroundColor: '#f8fafc', width: '100%' },
  content: { padding: 14, gap: 14, width: '100%', boxSizing: 'border-box' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    cursor: 'pointer',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a', lineHeight: 22 },
  subtitle: { fontSize: 11.5, color: '#64748b', lineHeight: 15, marginTop: 1 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    width: '100%',
    boxSizing: 'border-box',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  cardSectionLabel: { fontSize: 10.5, fontWeight: '800', color: '#64748b', letterSpacing: 0.6 },
  cardHeaderWithBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 2 },
  cardPillBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  cardPillBadgeText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusBadgeText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.2 },

  custName: { fontSize: 16, fontWeight: '800', color: '#0f172a', lineHeight: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  custSub: { fontSize: 11.5, color: '#475569', lineHeight: 15 },
  custAddr: { fontSize: 11.5, color: '#334155', lineHeight: 16, flex: 1 },

  quickActionRow: { flexDirection: 'row', gap: 10, marginTop: 6, width: '100%' },
  quickCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
    cursor: 'pointer',
  },
  quickCallBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  quickNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    cursor: 'pointer',
  },
  quickNavBtnText: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },

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
  mediaContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 6,
  },
  mediaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  mediaTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  videoBadge: {
    backgroundColor: '#ef4444',
  },
  photoBadge: {
    backgroundColor: '#2563eb',
  },
  mediaTypeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  mediaLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#cbd5e1',
    flex: 1,
  },
  videoPlayerBox: {
    width: '100%',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBox: {
    width: '100%',
    height: 180,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  noMediaBox: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noMediaText: {
    fontSize: 11.5,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  actionConsole: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#dbeafe',
    gap: 12,
    width: '100%',
    boxSizing: 'border-box',
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  consoleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  consoleTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', lineHeight: 18 },
  actionBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    boxSizing: 'border-box',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    cursor: 'pointer',
  },
  actionBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13, letterSpacing: 0.3, textAlign: 'center', flexWrap: 'wrap', lineHeight: 17 },

  waitBox: { backgroundColor: '#fef3c7', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#fde047', width: '100%' },
  waitText: { color: '#92400e', fontWeight: '700', fontSize: 11.5, lineHeight: 16, flex: 1 },

  completedBox: { backgroundColor: '#ecfdf5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#a7f3d0', width: '100%' },
  completedText: { color: '#059669', fontWeight: '800', fontSize: 13 },

  completedCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    gap: 12,
    width: '100%',
    boxSizing: 'border-box',
  },
  completedHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  completedIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center' },
  completedTitle: { fontSize: 14, fontWeight: '800', color: '#065f46' },
  completedSub: { fontSize: 11.5, color: '#047857', lineHeight: 16, marginTop: 2 },
  viewEarningsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    cursor: 'pointer',
  },
  viewEarningsBtnText: { fontSize: 12, fontWeight: '800', color: '#047857' },

  otpHintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
  },
  otpHintText: { fontSize: 11.5, color: '#1d4ed8', fontWeight: '700' },

  mediaRow: { flexDirection: 'row', gap: 10, width: '100%' },
  uploadBtn: { flex: 1, backgroundColor: '#eff6ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: '#bfdbfe' },
  uploadBtnText: { color: '#1d4ed8', fontWeight: '700', fontSize: 11, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'center', alignItems: 'center', padding: 12, width: '100%', boxSizing: 'border-box' },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, width: '94%', maxWidth: 460, maxHeight: '92%', gap: 6, boxSizing: 'border-box', overflow: 'hidden', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', lineHeight: 22 },
  modalSub: { fontSize: 11.5, color: '#64748b', lineHeight: 15, marginTop: 2 },

  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
    gap: 8,
  },
  modalCloseIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIconText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '800',
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  inputLabelBold: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  fieldHelperText: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
    lineHeight: 15,
  },
  subInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 3,
  },
  sparePartsToggleRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 4,
  },
  sparePartToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparePartToggleBtnActive: {
    borderColor: '#059669',
    backgroundColor: '#059669',
  },
  sparePartToggleBtnActiveAlert: {
    borderColor: '#d97706',
    backgroundColor: '#d97706',
  },
  sparePartToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  sparePartToggleBtnTextActive: {
    color: '#ffffff',
  },
  sparePartToggleBtnTextActiveAlert: {
    color: '#ffffff',
  },
  sparePartsNoneNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  sparePartsNoneNoticeText: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '600',
    flex: 1,
  },
  videoActionRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 2,
  },
  videoRecordActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  videoRecordActionText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  videoUploadActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  videoUploadActionText: {
    color: '#1d4ed8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  liveCameraContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  liveCameraVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  liveRecordingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveRecordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  liveRecordingTimer: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  stopRecordingBtn: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stopRecordingSquare: {
    width: 10,
    height: 10,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  stopRecordingBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  videoPreviewCard: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    gap: 6,
    padding: 8,
    marginTop: 4,
  },
  attachedVideoPlayer: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#0f172a',
  },
  videoPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPreviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: 4,
  },
  videoAttachedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  retakeVideoBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  retakeVideoBtnText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '700',
  },

  fullWidthActionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1d4ed8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 4,
  },
  fullWidthActionText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 4,
  },
  secondaryActionText: {
    color: '#1d4ed8',
    fontSize: 12.5,
    fontWeight: '700',
  },
  livePhotoControlsRow: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  snapPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  snapPhotoBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelCaptureBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cancelCaptureBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  photoPreviewCard: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    gap: 6,
    padding: 8,
    marginTop: 4,
  },
  capturedPhotoImg: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    backgroundColor: '#0f172a',
  },
  photoPreviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: 4,
  },
  photoAttachedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  retakePhotoBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  retakePhotoBtnText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '700',
  },

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

  consultationBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    gap: 8,
    width: '100%',
    boxSizing: 'border-box',
  },
  consultationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  consultationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 1,
  },
  consultationTagText: {
    color: '#1e40af',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  freeBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  freeBadgeText: {
    color: '#065f46',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  consultationHeadline: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e3a8a',
    lineHeight: 19,
  },
  consultationBody: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },

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
  modalNoticeBanner: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', borderRadius: 8, padding: 8, marginBottom: 8 },
  modalNoticeText: { fontSize: 11, color: '#b91c1c', lineHeight: 15, fontWeight: '600' },
  quoteSummaryCard: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', gap: 4, marginVertical: 6 },
  quoteSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quoteSummaryLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  quoteSummaryFree: { fontSize: 11, color: '#16a34a', fontWeight: '800' },
  quoteSummaryVal: { fontSize: 11.5, color: '#0f172a', fontWeight: '700' },
  quoteSummaryTotalLabel: { fontSize: 12, color: '#0f172a', fontWeight: '800' },
  quoteSummaryTotalVal: { fontSize: 13.5, color: '#2563eb', fontWeight: '800' },
});
