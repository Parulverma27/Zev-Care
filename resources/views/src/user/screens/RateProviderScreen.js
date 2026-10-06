import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const STAR_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent!',
};

const RESOLVED_OPTIONS = [
  { id: 'yes', label: 'Yes, completely' },
  { id: 'partial', label: 'Partially' },
  { id: 'no', label: 'No' },
];

export default function RateProviderScreen() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { getUserBookings, activeUser, providers, submitBookingRating, skipBookingRating } = useApp();

  const booking = useMemo(() => {
    const list = getUserBookings(activeUser) || [];
    return list.find((b) => b.booking_id === bookingId) || null;
  }, [getUserBookings, activeUser, bookingId]);

  const provider = useMemo(() => {
    if (!booking) return null;
    return (
      (providers || []).find(
        (p) =>
          p.id === booking.provider_id ||
          p.name === booking.provider_name
      ) || null
    );
  }, [providers, booking]);

  const [rating, setRating] = useState(5);
  const [issueResolved, setIssueResolved] = useState('yes');
  const [feedback, setFeedback] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const goBack = () => {
    if (window?.history?.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (navigate) {
      navigate(`/user/bookings/${bookingId}`);
    }
  };

  const pickPhotos = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files || []).slice(0, 3 - photos.length);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const url = reader.result;
          if (typeof url === 'string') {
            setPhotos((prev) => [...prev, url].slice(0, 3));
          }
        };
        reader.readAsDataURL(file);
      });
    };
    input.click();
  };

  const handleSubmit = () => {
    if (!rating) {
      setError('Please select a star rating.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      submitBookingRating(bookingId, {
        rating,
        feedback: feedback.trim(),
        issueResolved,
        ratingPhotos: photos,
        tags: [],
      });
      navigate(`/user/bookings/${bookingId}`);
    } catch (e) {
      setError('Could not submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    skipBookingRating(bookingId);
    navigate(`/user/bookings/${bookingId}`);
  };

  if (!booking) {
    return (
      <View style={styles.container}>
        <Text style={styles.missing}>Booking not found.</Text>
        <TouchableOpacity onPress={() => navigate('/user/bookings')}>
          <Text style={styles.link}>Back to bookings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (booking.user_rating) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Thanks for your feedback</Text>
        <Text style={styles.subtitle}>You already rated this service.</Text>
        <Text style={styles.starBig}>{'★'.repeat(booking.user_rating)}</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={goBack}>
          <Text style={styles.primaryBtnText}>Back to booking</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const providerName = booking.provider_name || provider?.name || 'Your technician';
  const providerRating = provider?.rating || booking.provider_rating || '4.8';
  const jobs = provider?.total_jobs ?? booking.provider_jobs ?? '—';
  const avatar =
    provider?.avatar ||
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} accessibilityLabel="Go back">
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>How was your service?</Text>
          <Text style={styles.subtitle}>Your feedback helps us serve you better.</Text>
        </View>
      </View>

      <View style={styles.providerCard}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.providerName}>{providerName}</Text>
          <View style={styles.providerMetaRow}>
            <Text style={styles.providerStar}>★ {providerRating}</Text>
            <View style={styles.verified}>
              <Text style={styles.verifiedText}>✓ Verified Professional</Text>
            </View>
          </View>
          <Text style={styles.jobsText}>{jobs} services completed</Text>
        </View>
      </View>

      <Text style={styles.section}>Rate your experience</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)} accessibilityLabel={`${star} stars`}>
            <Text style={[styles.star, rating >= star && styles.starOn]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.starLabel}>{STAR_LABELS[rating] || ''}</Text>

      <Text style={styles.section}>Was the issue resolved?</Text>
      <View style={styles.resolveRow}>
        {RESOLVED_OPTIONS.map((opt) => {
          const on = issueResolved === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.resolveChip, on && styles.resolveChipOn]}
              onPress={() => setIssueResolved(opt.id)}
            >
              <Text style={[styles.resolveText, on && styles.resolveTextOn]}>
                {on && opt.id === 'yes' ? '✓ ' : ''}
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.section}>Tell us about your experience</Text>
      <TextInput
        style={styles.textarea}
        value={feedback}
        onChangeText={(t) => setFeedback(t.slice(0, 300))}
        placeholder="Share your feedback..."
        placeholderTextColor="#94a3b8"
        multiline
      />
      <Text style={styles.counter}>{feedback.length}/300</Text>

      <Text style={styles.section}>Add Photos (Optional)</Text>
      <View style={styles.photoRow}>
        {photos.map((uri, i) => (
          <View key={`p-${i}`} style={styles.photoWrap}>
            <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
            <TouchableOpacity
              style={styles.photoX}
              onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
            >
              <Text style={styles.photoXText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < 3 && (
          <TouchableOpacity style={styles.addPhoto} onPress={pickPhotos}>
            <Text style={styles.addPhotoIcon}>📷</Text>
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.photoHint}>You can add up to 3 photos</Text>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
        disabled={submitting}
        onPress={handleSubmit}
        activeOpacity={0.9}
      >
        <Text style={styles.primaryBtnText}>{submitting ? 'Submitting…' : 'Submit Feedback'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.8}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 12,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
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
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  providerCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#e2e8f0' },
  providerName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  providerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  providerStar: { fontSize: 13, fontWeight: '700', color: '#d97706' },
  verified: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  verifiedText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  jobsText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  section: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginTop: 8 },
  starRow: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 36, color: '#cbd5e1' },
  starOn: { color: '#f59e0b' },
  starLabel: { fontSize: 14, fontWeight: '700', color: '#059669', marginTop: -4 },
  starBig: { fontSize: 28, color: '#f59e0b', textAlign: 'center' },
  resolveRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  resolveChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  resolveChipOn: { backgroundColor: '#059669', borderColor: '#059669' },
  resolveText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  resolveTextOn: { color: '#fff' },
  textarea: {
    minHeight: 100,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    textAlignVertical: 'top',
  },
  counter: { fontSize: 11, color: '#94a3b8', textAlign: 'right', marginTop: -6 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoWrap: { width: 88, height: 88, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  photo: { width: '100%', height: '100%', backgroundColor: '#e2e8f0' },
  photoX: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15,23,42,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoXText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  addPhoto: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoIcon: { fontSize: 20 },
  addPhotoText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  photoHint: { fontSize: 12, color: '#94a3b8', textAlign: 'center' },
  error: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: { backgroundColor: '#94a3b8' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  skipBtn: { paddingVertical: 12, alignItems: 'center' },
  skipText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  missing: { padding: 24, textAlign: 'center', color: '#64748b' },
  link: { color: '#2563eb', fontWeight: '700', textAlign: 'center' },
});
