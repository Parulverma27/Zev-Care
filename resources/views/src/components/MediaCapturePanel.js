/**
 * Reusable photo/video capture panel.
 * Gallery is disabled by default (live capture only). Pass allowGallery for legacy booking if needed later.
 * value: { type: 'photo'|'video', uri: string, fileName?: string } | null
 */
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { AppIcon } from './AppIcons';

export default function MediaCapturePanel({
  value = null,
  onChange,
  emptyTitle = 'Record Live Video',
  emptyDescription = 'A live video walkthrough (10–20s) helps us verify and diagnose your appliance.',
  maxVideoSeconds = 20,
}) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const objectUrlRef = useRef(null);

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      try {
        URL.revokeObjectURL(objectUrlRef.current);
      } catch (e) {}
      objectUrlRef.current = null;
    }
  };

  const stopCamera = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const startCamera = async () => {
    if (Platform.OS !== 'web' || !navigator?.mediaDevices?.getUserMedia) {
      setCameraPermissionDenied(true);
      return;
    }
    try {
      setCameraPermissionDenied(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      revokeObjectUrl();
      onChange?.(null);
      setIsRecording(false);
    } catch (e) {
      setCameraActive(false);
      setCameraPermissionDenied(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);
  };

  const startRecording = async () => {
    if (!streamRef.current) {
      await startCamera();
    }
    if (!streamRef.current || typeof MediaRecorder === 'undefined') return;

    try {
      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        revokeObjectUrl();
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        onChange?.({ type: 'video', uri: url, fileName: 'Appliance_Live_Video.webm' });
        stopCamera();
        setIsRecording(false);
        setRecordingSeconds(0);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      const maxSec = Math.max(5, Number(maxVideoSeconds) || 20);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= maxSec - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e) {
      setIsRecording(false);
    }
  };

  const handleRecordVideoPress = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    await startRecording();
  };

  const handleRetake = async () => {
    revokeObjectUrl();
    onChange?.(null);
    setCameraPermissionDenied(false);
    stopCamera();
    await startCamera();
  };

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  useEffect(
    () => () => {
      stopCamera();
      revokeObjectUrl();
    },
    []
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.dashedMediaUploadArea}>
        {value && value.type === 'video' ? (
          Platform.OS === 'web' ? (
            <video
              src={value.uri}
              controls
              style={{ width: '100%', height: '100%', borderRadius: 16, objectFit: 'cover' }}
            />
          ) : (
            <View style={styles.videoFallback}>
              <Text style={styles.cameraLabelText}>Live Video attached</Text>
            </View>
          )
        ) : cameraActive && Platform.OS === 'web' ? (
          <View style={styles.mediaPreview}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }}
            />
            {isRecording ? (
              <View style={styles.recordingOverlay}>
                <View style={styles.blinkingDot} />
                <Text style={styles.recordingText}>
                  REC 00:{String(recordingSeconds).padStart(2, '0')}
                </Text>
              </View>
            ) : (
              <View style={styles.cameraLiveBadge}>
                <Text style={styles.cameraLiveBadgeText}>LIVE CAMERA READY</Text>
              </View>
            )}
          </View>
        ) : cameraPermissionDenied ? (
          <View style={styles.emptyState}>
            <AppIcon name="lock" size={32} color="#dc2626" strokeWidth={2} />
            <Text style={styles.emptyTitle}>Camera Access Required</Text>
            <Text style={styles.emptyDesc}>
              Please allow camera access in your browser to record a live video. Photos and gallery uploads are not permitted.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.uploadAreaCircle}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </View>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyDesc}>{emptyDescription}</Text>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedBadgeText}>Live Video (10–20s)</Text>
            </View>
          </View>
        )}
      </View>

      {value && value.type === 'video' ? (
        <View style={styles.retakeActionRow}>
          <TouchableOpacity
            style={styles.retakeActionBtn}
            onPress={handleRetake}
            activeOpacity={0.85}
            accessibilityLabel="Retake or re-record live video"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            <Text style={styles.retakeActionBtnText}>Retake / Re-record Live Video</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.uploadActionRow}>
          <TouchableOpacity
            style={[styles.uploadActionBtn, isRecording && styles.uploadActionBtnRecording]}
            onPress={handleRecordVideoPress}
            activeOpacity={0.85}
            accessibilityLabel={isRecording ? 'Stop recording' : 'Record live video'}
          >
            <View style={styles.uploadActionIconBox}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isRecording ? '#dc2626' : '#2563eb'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </View>
            <Text style={styles.uploadActionText}>
              {isRecording ? `Stop (${recordingSeconds}s)` : 'Record Live Video'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, width: '100%' },
  dashedMediaUploadArea: {
    width: '100%',
    aspectRatio: 1.25,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    borderStyle: 'dashed',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    overflow: 'hidden',
  },
  mediaPreview: { width: '100%', height: '100%', position: 'relative' },
  mediaFill: { width: '100%', height: '100%', borderRadius: 16 },
  videoFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
  },
  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', fontFamily: 'Inter, sans-serif' },
  emptyDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Inter, sans-serif',
  },
  uploadAreaCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendedBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  recommendedBadgeText: { fontSize: 10.5, color: '#64748b', fontWeight: '500', fontFamily: 'Inter, sans-serif' },
  uploadActionRow: { flexDirection: 'row', gap: 8 },
  uploadActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 4,
    minHeight: 72,
  },
  uploadActionBtnRecording: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  uploadActionIconBox: { alignItems: 'center', justifyContent: 'center' },
  uploadActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  retakeActionRow: { width: '100%', alignItems: 'center', marginTop: 4 },
  retakeActionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
  },
  retakeActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d4ed8',
    fontFamily: 'Inter, sans-serif',
  },
  cameraLabelOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cameraLabelText: { color: '#ffffff', fontSize: 11, fontWeight: '600', fontFamily: 'Inter, sans-serif' },
  cameraLiveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(220,38,38,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cameraLiveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', fontFamily: 'Inter, sans-serif' },
  recordingOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  blinkingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  recordingText: { color: '#fff', fontSize: 11, fontWeight: '700', fontFamily: 'Inter, sans-serif' },
});
