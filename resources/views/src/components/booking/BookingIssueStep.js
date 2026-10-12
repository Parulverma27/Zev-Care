import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
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
  issueDescription = '',
  onChangeIssueDescription,
  isComplaint = false,
  isConsultation = false,
  onLiveSupport,
}) {
  const [panelValue, setPanelValue] = useState(() => setPrimaryPanelValue(issueMedia));
  const photos = issueMedia?.photos || [];
  const videos = issueMedia?.videos || [];

  useEffect(() => {
    setPanelValue(setPrimaryPanelValue(issueMedia));
  }, [issueMedia]);

  const handlePanelChange = (val) => {
    setPanelValue(val);
    if (!val) return;
    onChangeIssueMedia?.(applyPanelValueToIssueMedia(issueMedia, val));
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <BookingProgress activeIndex={1} />
        </View>
      </View>

      {isConsultation ? (
        <View style={styles.consultationBanner}>
          <Text style={styles.consultationBannerTag}>₹0 FREE ON-SITE INSPECTION</Text>
          <Text style={styles.consultationBannerSub}>
            Select the symptom or issue you need diagnosed by an expert technician at your doorstep.
          </Text>
        </View>
      ) : isComplaint ? (
        <View style={styles.complaintBanner}>
          <Text style={styles.complaintBannerTag}>⚡ PRIORITY COMPLAINT</Text>
          <Text style={styles.complaintBannerSub}>
            Select the problem below for expedited technician diagnosis & dispatch.
          </Text>
        </View>
      ) : null}

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

      <View style={styles.grid}>
        {issues.map((item) => {
          const selected = selectedIssueId === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, selected && styles.cardOn]}
              onPress={() => onSelect?.(item)}
              activeOpacity={0.85}
            >
              <Text style={[styles.cardLabel, selected && styles.cardLabelOn]} numberOfLines={3}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.hint}>
        <Text style={styles.hintTitle}>Not sure what&apos;s wrong?</Text>
        <Text style={styles.hintSub}>Choose &quot;Other&quot; and our experts will help you.</Text>
      </View>

      {selectedIssueId && selectedIssueId !== 'other' && (
        <View style={styles.mediaSection}>
          <Text style={styles.sectionTitle}>Record live video of issue (Optional)</Text>
          <Text style={styles.sectionSub}>Record a quick live video of the appliance to help our technician.</Text>

          <MediaCapturePanel
            value={panelValue}
            emptyTitle="Record live video of issue"
            emptyDescription="Capture a live video of your appliance or problem area"
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
                  >
                    <Text style={styles.thumbXText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>Additional details (Optional)</Text>
          <TextInput
            style={styles.textarea}
            value={issueDescription}
            onChangeText={(t) => onChangeIssueDescription?.(t.slice(0, 300))}
            placeholder="Add any extra notes for the technician..."
            placeholderTextColor="#94a3b8"
            multiline
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={onContinue} activeOpacity={0.9}>
            <Text style={styles.primaryBtnText}>{isConsultation ? 'Select Date & Time ›' : 'Continue'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {onLiveSupport && (
        <View style={{ marginTop: 10 }}>
          <LiveSupportOptionCard onPress={onLiveSupport} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, gap: 14, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: { fontSize: 28, color: '#0f172a', marginTop: -2 },
  complaintBanner: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.2,
    borderColor: '#fde68a',
    gap: 3,
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
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1.2,
    borderColor: '#bfdbfe',
    gap: 3,
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
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: -6, lineHeight: 20 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '31%',
    minWidth: 96,
    flexGrow: 1,
    minHeight: 88,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardOn: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  cardLabel: { fontSize: 12, fontWeight: '600', color: '#334155', textAlign: 'center', lineHeight: 16 },
  cardLabelOn: { color: '#1d4ed8' },
  hint: {
    flexDirection: 'column',
    gap: 4,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hintTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  hintSub: { fontSize: 12, color: '#64748b' },
  mediaSection: { marginTop: 4, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  sectionSub: { fontSize: 13, color: '#64748b', marginTop: -6 },
  previews: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbWrap: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%', backgroundColor: '#e2e8f0' },
  videoFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  thumbX: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(15,23,42,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbXText: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 16 },
  textarea: {
    minHeight: 80,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
