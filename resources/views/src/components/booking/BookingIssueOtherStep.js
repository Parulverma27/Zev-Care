import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
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
  const photos = issueMedia?.photos || [];
  const videos = issueMedia?.videos || [];

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

      <Text style={styles.title}>Tell us what&apos;s wrong</Text>
      <Text style={styles.subtitle}>Describe the problem in your own words.</Text>

      <TextInput
        style={styles.textarea}
        value={description}
        onChangeText={(t) => onChangeDescription?.(t.slice(0, 300))}
        placeholder="Example: AC starts normally but stops cooling after 10 minutes."
        placeholderTextColor="#94a3b8"
        multiline
        accessibilityLabel="Issue description"
      />
      <Text style={styles.counter}>{(description || '').length}/300</Text>

      <Text style={styles.sectionTitle}>Record live video (Optional)</Text>
      <MediaCapturePanel
        value={panelValue}
        emptyTitle="Record live video"
        emptyDescription="A quick live video helps technicians understand your requirement."
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
      <Text style={styles.limitHint}>Up to 5 photos + 1 video.</Text>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.primaryBtn, !(description || '').trim() && styles.primaryBtnDisabled]}
        onPress={onContinue}
        disabled={!(description || '').trim()}
        activeOpacity={(description || '').trim() ? 0.9 : 1}
      >
        <Text style={[styles.primaryBtnText, !(description || '').trim() && styles.primaryBtnTextDisabled]}>
          Continue
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, gap: 10, maxWidth: 720, width: '100%', alignSelf: 'center' },
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
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: -4 },
  textarea: {
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: '#0f172a',
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  counter: { fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: -4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 8 },
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
  limitHint: { fontSize: 12, color: '#64748b' },
  error: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: '#cbd5e1',
    opacity: 0.7,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  primaryBtnTextDisabled: { color: '#94a3b8' },
});
