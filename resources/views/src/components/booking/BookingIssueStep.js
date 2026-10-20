import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import MediaCapturePanel from '../MediaCapturePanel';
import BookingProgress from './BookingProgress';
import LiveSupportOptionCard from './LiveSupportOptionCard';
import {
  applyPanelValueToIssueMedia,
  removeMediaItem,
  setPrimaryPanelValue,
} from '../../utils/bookingMedia';

export default function BookingIssueStep({
  displayName = 'appliance',
  issues = [],
  selectedIssueId,
  onSelect,
  onBack,
  onContinue,
  issueMedia,
  onChangeIssueMedia,
  isComplaint = false,
  isConsultation = false,
  onLiveSupport,
}) {
  const [panelValue, setPanelValue] = useState(() => setPrimaryPanelValue(issueMedia));
  const [validationError, setValidationError] = useState('');
  const [touched, setTouched] = useState(false);

  const videos = issueMedia?.videos || [];
  const hasVideo = videos.length > 0 || (panelValue && panelValue.type === 'video' && Boolean(panelValue.uri));
  const isFormValid = Boolean(selectedIssueId) && hasVideo;

  useEffect(() => {
    setPanelValue(setPrimaryPanelValue(issueMedia));
  }, [issueMedia]);

  const handlePanelChange = (val) => {
    setPanelValue(val);
    setValidationError('');
    if (!val) return;
    onChangeIssueMedia?.(applyPanelValueToIssueMedia(issueMedia, val));
  };

  const handleContinuePress = () => {
    setTouched(true);
    if (!selectedIssueId) {
      setValidationError('Please select the symptom or problem noticed above.');
      return;
    }
    if (!hasVideo) {
      setValidationError('A live video recording of the issue is compulsory to proceed.');
      return;
    }
    setValidationError('');
    onContinue?.();
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <BookingProgress activeIndex={1} />
        </View>
      </View>

      {/* Mode Banners */}
      {isConsultation ? (
        <View style={styles.consultationBanner}>
          <View style={styles.bannerTagRow}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <Text style={styles.consultationBannerTag}>₹0 FREE ON-SITE INSPECTION</Text>
          </View>
          <Text style={styles.consultationBannerSub}>
            Select the symptom or issue you need diagnosed by an expert technician at your doorstep.
          </Text>
        </View>
      ) : isComplaint ? (
        <View style={styles.complaintBanner}>
          <View style={styles.bannerTagRow}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <Text style={styles.complaintBannerTag}>PRIORITY COMPLAINT</Text>
          </View>
          <Text style={styles.complaintBannerSub}>
            Select the problem below for expedited technician diagnosis & dispatch.
          </Text>
        </View>
      ) : null}

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>
          {isConsultation ? 'What needs to be diagnosed?' : isComplaint ? "What's the problem?" : "What's the issue?"}
        </Text>
        <Text style={styles.subtitle}>
          {isConsultation
            ? `Tell us what symptoms you have noticed with your ${displayName}.`
            : isComplaint
            ? `Tell us what's wrong with your ${displayName}.`
            : `Tell us what's happening with your ${displayName}.`}
        </Text>
      </View>

      {/* Issue Symptoms Grid */}
      <View style={styles.grid}>
        {issues.map((item) => {
          const selected = selectedIssueId === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, selected && styles.cardOn]}
              onPress={() => {
                setValidationError('');
                onSelect?.(item);
              }}
              activeOpacity={0.85}
            >
              {selected && (
                <View style={styles.cardSelectedDot}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </View>
              )}
              <Text style={[styles.cardLabel, selected && styles.cardLabelOn]} numberOfLines={3}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.hint}>
        <Text style={styles.hintTitle}>Not sure what&apos;s wrong?</Text>
        <Text style={styles.hintSub}>Choose &quot;Other&quot; and our experts will help diagnose your requirement.</Text>
      </View>

      {/* Compulsory Live Video Section (shown once issue/symptom is selected) */}
      {selectedIssueId && selectedIssueId !== 'other' && (
        <View style={styles.videoSectionCard}>
          {/* Responsive Header Row */}
          <View style={styles.videoHeaderTop}>
            <View style={styles.videoTitleLeft}>
              <View style={styles.videoIconCircle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.videoTitle} numberOfLines={1}>
                  Live Video of Issue
                </Text>
              </View>
            </View>

            <View style={[styles.statusBadge, hasVideo ? styles.statusBadgeOk : styles.statusBadgeReq]}>
              {hasVideo ? (
                <View style={styles.badgeContentRow}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <Text style={styles.statusBadgeOkText}>RECORDED</Text>
                </View>
              ) : (
                <Text style={styles.statusBadgeReqText}>COMPULSORY</Text>
              )}
            </View>
          </View>

          <Text style={styles.videoSubtitle}>
            A quick live video (10–20s) is mandatory so our technician arrives with the right tools & genuine parts.
          </Text>

          {/* Interactive Media Capture Panel */}
          <MediaCapturePanel
            value={panelValue}
            emptyTitle="Record Live Video of Issue"
            emptyDescription="Capture a quick 10–20s video showing the appliance problem"
            onChange={handlePanelChange}
          />

          {/* Video Preview thumbnail if recorded */}
          {videos.length > 0 && (
            <View style={styles.previews}>
              {videos.map((v, i) => (
                <View key={`v-${i}`} style={styles.thumbWrap}>
                  {Platform.OS === 'web' ? (
                    <video src={v.uri} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <View style={[styles.thumb, styles.videoFallback]}>
                      <Text style={{ color: '#fff', fontSize: 11 }}>Live Video</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.thumbX}
                    onPress={() => onChangeIssueMedia?.(removeMediaItem(issueMedia, 'video', i))}
                    activeOpacity={0.8}
                    accessibilityLabel="Remove video"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Reassurance strip */}
          <View style={styles.reassuranceRow}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <Text style={styles.reassuranceText}>
              Live video ensures accurate diagnosis & fast same-day resolution.
            </Text>
          </View>

          {/* Validation Banner if missing video */}
          {validationError ? (
            <View style={styles.errorBanner}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <Text style={styles.errorBannerText}>{validationError}</Text>
            </View>
          ) : !hasVideo && touched ? (
            <View style={styles.warningBanner}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <Text style={styles.warningBannerText}>
                Live video recording is compulsory to continue.
              </Text>
            </View>
          ) : null}

          {/* Continue CTA */}
          <TouchableOpacity
            style={[styles.primaryBtn, !isFormValid && styles.primaryBtnDisabled]}
            onPress={handleContinuePress}
            activeOpacity={0.88}
          >
            <Text style={[styles.primaryBtnText, !isFormValid && styles.primaryBtnTextDisabled]}>
              {!hasVideo
                ? 'Record Video to Continue'
                : isConsultation
                ? 'Continue to Select Date & Time'
                : 'Continue'}
            </Text>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={!isFormValid ? '#94a3b8' : '#ffffff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </TouchableOpacity>
        </View>
      )}

      {/* Live Support */}
      {onLiveSupport && (
        <View style={{ marginTop: 8 }}>
          <LiveSupportOptionCard onPress={onLiveSupport} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 14,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    boxSizing: 'border-box',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
    cursor: 'pointer',
  },
  complaintBanner: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.2,
    borderColor: '#fde68a',
    gap: 4,
  },
  bannerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  complaintBannerTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
    letterSpacing: 0.5,
  },
  complaintBannerSub: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
    lineHeight: 16,
  },
  consultationBanner: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    borderWidth: 1.2,
    borderColor: '#bfdbfe',
    gap: 4,
  },
  consultationBannerTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: 0.5,
  },
  consultationBannerSub: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '500',
    lineHeight: 16,
  },
  titleSection: {
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 16,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '31%',
    minWidth: 96,
    flexGrow: 1,
    minHeight: 80,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)',
    position: 'relative',
    cursor: 'pointer',
  },
  cardOn: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.1)',
  },
  cardSelectedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 15,
  },
  cardLabelOn: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  hint: {
    flexDirection: 'column',
    gap: 4,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hintTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  hintSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  videoSectionCard: {
    marginTop: 6,
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
    boxSizing: 'border-box',
    width: '100%',
  },
  videoHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  videoTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  videoIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  videoTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  statusBadgeReq: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  statusBadgeReqText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 0.4,
  },
  statusBadgeOk: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  statusBadgeOkText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.4,
  },
  badgeContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    fontWeight: '500',
  },
  reassuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  reassuranceText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  previews: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  thumbWrap: {
    width: 84,
    height: 84,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#2563eb',
  },
  thumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e2e8f0',
  },
  videoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  thumbX: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15,23,42,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 10,
    borderRadius: 10,
  },
  errorBannerText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 10,
    borderRadius: 10,
  },
  warningBannerText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  primaryBtn: {
    width: '100%',
    boxSizing: 'border-box',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    boxShadow: '0 6px 18px rgba(37, 99, 235, 0.28)',
    cursor: 'pointer',
    marginTop: 6,
  },
  primaryBtnDisabled: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  primaryBtnTextDisabled: {
    color: '#94a3b8',
    fontWeight: '700',
  },
});
