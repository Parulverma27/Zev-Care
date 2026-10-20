import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import MediaCapturePanel from '../MediaCapturePanel';
import BookingProgress from './BookingProgress';
import {
  applyPanelValueToIssueMedia,
  removeMediaItem,
  setPrimaryPanelValue,
} from '../../utils/bookingMedia';

export default function BookingIssueOtherStep({
  description = '',
  onChangeDescription,
  issueMedia,
  onChangeIssueMedia,
  onBack,
  onContinue,
  error = '',
}) {
  const [panelValue, setPanelValue] = useState(() => setPrimaryPanelValue(issueMedia));
  const [localError, setLocalError] = useState('');
  const [touched, setTouched] = useState(false);

  const videos = issueMedia?.videos || [];
  const hasVideo = videos.length > 0 || (panelValue && panelValue.type === 'video' && Boolean(panelValue.uri));
  const hasDescription = (description || '').trim().length >= 8;
  const isFormValid = hasDescription && hasVideo;

  const handlePanelChange = (val) => {
    setPanelValue(val);
    setLocalError('');
    if (!val) return;
    onChangeIssueMedia?.(applyPanelValueToIssueMedia(issueMedia, val));
  };

  const handleContinuePress = () => {
    setTouched(true);
    if (!hasDescription) {
      setLocalError('Please describe the problem reason in more detail (at least 8 characters).');
      return;
    }
    if (!hasVideo) {
      setLocalError('A live video recording of the issue is compulsory to proceed.');
      return;
    }
    setLocalError('');
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

      <Text style={styles.title}>Tell us what&apos;s wrong</Text>
      <Text style={styles.subtitle}>Describe the problem reason in your own words & capture a live video.</Text>

      {/* 1. Compulsory Reason Description */}
      <View style={styles.fieldBlock}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Problem Reason & Description</Text>
          <View style={styles.mandatoryBadge}>
            <Text style={styles.mandatoryBadgeText}>COMPULSORY</Text>
          </View>
        </View>

        <TextInput
          style={[styles.textarea, touched && !hasDescription && styles.textareaError]}
          value={description}
          onChangeText={(t) => {
            setLocalError('');
            onChangeDescription?.(t.slice(0, 300));
          }}
          placeholder="Example: AC starts normally but stops cooling after 10 minutes and fan makes noise..."
          placeholderTextColor="#94a3b8"
          multiline
          accessibilityLabel="Issue description"
        />
        <View style={styles.charRow}>
          <Text style={[styles.charHint, hasDescription && styles.charHintOk]}>
            {hasDescription ? 'Reason description provided' : 'Minimum 8 characters required'}
          </Text>
          <Text style={styles.counter}>{(description || '').length}/300</Text>
        </View>
      </View>

      {/* 2. Compulsory Video Recording */}
      <View style={styles.fieldBlock}>
        <View style={styles.videoHeaderTop}>
          <View style={styles.videoTitleLeft}>
            <View style={styles.videoIconCircle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </View>
            <Text style={styles.videoTitle} numberOfLines={1}>
              Live Video of Issue
            </Text>
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
        <Text style={styles.sectionSub}>
          A quick live video (10–20s) is mandatory so our technician arrives prepared with exact parts.
        </Text>

        <MediaCapturePanel
          value={panelValue}
          emptyTitle="Record Live Video of Issue"
          emptyDescription="Capture a quick live video of the problem area or appliance"
          onChange={handlePanelChange}
        />

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
      </View>

      {/* Validation Message */}
      {(error || localError) ? (
        <View style={styles.errorBanner}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <Text style={styles.errorText}>{error || localError}</Text>
        </View>
      ) : !isFormValid && touched ? (
        <View style={styles.warningBanner}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <Text style={styles.warningText}>
            Both the problem reason and a live video recording are compulsory to proceed.
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
          {!hasVideo ? 'Record Video to Continue' : 'Continue'}
        </Text>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={!isFormValid ? '#94a3b8' : '#ffffff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </TouchableOpacity>
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
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#64748b',
    marginTop: -4,
    lineHeight: 20,
    fontWeight: '500',
  },
  fieldBlock: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  videoTitle: {
    fontSize: 14,
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
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  mandatoryBadge: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mandatoryBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 0.4,
  },
  sectionSub: {
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 17,
    fontWeight: '500',
  },
  textarea: {
    minHeight: 100,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 14,
    fontSize: 13.5,
    color: '#0f172a',
    textAlignVertical: 'top',
    backgroundColor: '#ffffff',
    lineHeight: 20,
    fontWeight: '500',
  },
  textareaError: {
    borderColor: '#f87171',
    backgroundColor: '#fff5f5',
  },
  charRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -2,
  },
  charHint: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  charHintOk: {
    color: '#059669',
    fontWeight: '600',
  },
  counter: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
  },
  previews: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
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
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12.5,
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
    padding: 12,
    borderRadius: 12,
  },
  warningText: {
    color: '#92400e',
    fontSize: 12.5,
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
