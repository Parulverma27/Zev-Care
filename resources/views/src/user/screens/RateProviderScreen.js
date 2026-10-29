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
import { AppIcon } from '../../components/AppIcons';
import {
  RESOLVED_OPTIONS,
  SERVICE_ASPECTS_POSITIVE,
  SERVICE_ASPECTS_NEGATIVE,
  PROVIDER_ATTRIBUTES,
  PROVIDER_COMPLIMENTS,
} from '../../config/ratingConfig';
import {
  StarRatingInput,
  RatingStepper,
  AttributeRatingRow,
  TagChipGroup,
  RatingSummaryCard,
} from '../../components/ratings';

export default function RateProviderScreen() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const {
    getUserBookings,
    activeUser,
    providers,
    submitServiceReview,
    submitProviderReview,
    skipBookingRating,
  } = useApp();

  const booking = useMemo(() => {
    const list = getUserBookings(activeUser) || [];
    return list.find((b) => b.booking_id === bookingId) || null;
  }, [getUserBookings, activeUser, bookingId]);

  const provider = useMemo(() => {
    if (!booking) return null;
    return (
      (providers || []).find(
        (p) =>
          (booking.provider_id != null && p.id === booking.provider_id) ||
          p.name === booking.provider_name
      ) || null
    );
  }, [providers, booking]);

  // Determine initial step
  const initialStep = useMemo(() => {
    if (!booking) return 1;
    if (booking.service_review && booking.provider_review) return 3; // already rated
    if (booking.service_review && !booking.provider_review) return 2; // step 1 done, complete step 2
    return 1;
  }, [booking]);

  const [step, setStep] = useState(initialStep);

  // Step 1: Service Review State
  const [serviceRating, setServiceRating] = useState(
    booking?.service_review?.rating || Number(booking?.user_rating) || 5
  );
  const [issueResolved, setIssueResolved] = useState(
    booking?.service_review?.issue_resolved || booking?.issue_resolved || 'yes'
  );
  const [serviceAspects, setServiceAspects] = useState(
    booking?.service_review?.aspects || booking?.feedback_tags || []
  );
  const [serviceComment, setServiceComment] = useState(
    booking?.service_review?.comment || booking?.user_feedback || ''
  );
  const [servicePhotos, setServicePhotos] = useState(
    booking?.service_review?.photos || booking?.rating_photos || []
  );

  // Step 2: Provider Review State
  const [providerRating, setProviderRating] = useState(
    booking?.provider_review?.rating || 5
  );
  const [attributes, setAttributes] = useState(
    booking?.provider_review?.attributes || {
      punctuality: 5,
      professionalism: 5,
      skill: 5,
      cleanliness: 5,
      communication: 5,
    }
  );
  const [compliments, setCompliments] = useState(
    booking?.provider_review?.compliments || ['Courteous & Respectful', 'Expert Craftsperson']
  );
  const [providerComment, setProviderComment] = useState(
    booking?.provider_review?.comment || ''
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const goBack = () => {
    if (window?.history?.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
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
      const files = Array.from(e.target.files || []).slice(0, 3 - servicePhotos.length);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const url = reader.result;
          if (typeof url === 'string') {
            setServicePhotos((prev) => [...prev, url].slice(0, 3));
          }
        };
        reader.readAsDataURL(file);
      });
    };
    input.click();
  };

  const removePhoto = (idx) => {
    setServicePhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleServiceAspect = (tag) => {
    setServiceAspects((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleCompliment = (tag) => {
    setCompliments((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const updateAttribute = (attrKey, val) => {
    setAttributes((prev) => ({
      ...prev,
      [attrKey]: val,
    }));
  };

  // Handle Step 1 -> Step 2
  const handleProceedToProvider = () => {
    if (!serviceRating) {
      setError('Please select a star rating for the service.');
      return;
    }
    setError('');
    // Save Step 1 immediately so progress is never lost
    try {
      submitServiceReview(bookingId, {
        rating: serviceRating,
        issueResolved,
        aspects: serviceAspects,
        comment: serviceComment.trim(),
        photos: servicePhotos,
      });
      setStep(2);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError('Could not save service review. Please try again.');
    }
  };

  // Handle Final Submit (Step 2)
  const handleFinalSubmit = () => {
    if (!providerRating) {
      setError('Please select an overall rating for the technician.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      submitProviderReview(bookingId, {
        rating: providerRating,
        attributes,
        compliments,
        comment: providerComment.trim(),
      });
      setStep(3);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError('Could not submit technician rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipAll = () => {
    skipBookingRating(bookingId);
    navigate(`/user/bookings/${bookingId}`);
  };

  if (!booking) {
    return (
      <View style={styles.container}>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Booking Not Found</Text>
          <Text style={styles.errorSub}>This booking order could not be located in your account.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigate('/user/bookings')}>
            <Text style={styles.primaryBtnText}>Back to My Bookings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If already rated and step is 3, show completion view
  const isFullyRated = Boolean(booking.service_review && booking.provider_review);
  if (isFullyRated && step === 3) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack} accessibilityLabel="Back">
            <Text style={styles.backChevron}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.screenEyebrow}>FEEDBACK RECORDED</Text>
            <Text style={styles.screenTitle}>Thank You!</Text>
          </View>
        </View>

        <View style={styles.successHero}>
          <View style={styles.successIconBubble}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Your Feedback Has Been Submitted</Text>
          <Text style={styles.successSubtitle}>
            Your detailed service review and technician evaluation help us maintain the highest standards of luxury home care.
          </Text>
        </View>

        <RatingSummaryCard
          serviceReview={booking.service_review}
          providerReview={booking.provider_review}
          serviceName={booking.service_name}
          providerName={booking.provider_name}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={goBack} activeOpacity={0.88}>
          <Text style={styles.primaryBtnText}>Return to Booking Details</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const providerName = booking.provider_name || provider?.name || 'Assigned Technician';
  const providerRatingScore = provider?.rating || booking.provider_rating || '4.9';
  const providerTrade = provider?.trade || booking.provider_trade || 'Certified Professional';
  const providerJobs = provider?.total_jobs ?? booking.provider_jobs ?? 24;
  const avatar =
    provider?.avatar ||
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200';

  const availableAspects =
    serviceRating >= 4 ? SERVICE_ASPECTS_POSITIVE : SERVICE_ASPECTS_NEGATIVE;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} accessibilityLabel="Go back">
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenEyebrow}>DUAL RATING SYSTEM</Text>
          <Text style={styles.screenTitle}>
            {step === 1 ? 'Rate Service Experience' : 'Rate Field Technician'}
          </Text>
        </View>
      </View>

      {/* Progress Stepper */}
      <RatingStepper currentStep={step} />

      {error ? (
        <View style={styles.alertError}>
          <Text style={styles.alertErrorText}>⚠️ {error}</Text>
        </View>
      ) : null}

      {/* STEP 1: SERVICE EXPERIENCE */}
      {step === 1 && (
        <View style={styles.stepContainer}>
          {/* Service Info Banner */}
          <View style={styles.serviceInfoCard}>
            <View style={styles.serviceInfoLeft}>
              <Text style={styles.bookingIdTag}>ORDER {booking.booking_id}</Text>
              <Text style={styles.serviceTitle}>{booking.service_name}</Text>
              <Text style={styles.serviceCategory}>
                {booking.category_name} › {booking.sub_category_name}
              </Text>
            </View>
            <View style={styles.calendarPill}>
              <AppIcon name="calendar" size={13} color="#64748b" />
              <Text style={styles.calendarText}>{booking.completed_date || booking.scheduled_date || 'Recently'}</Text>
            </View>
          </View>

          {/* Star Rating Input */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>How satisfied were you with this service?</Text>
            <StarRatingInput
              value={serviceRating}
              onChange={(s) => setServiceRating(s)}
              size={42}
            />
          </View>

          {/* Issue Resolution Segmented Control */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>Was your service issue resolved?</Text>
            <View style={styles.resolveGrid}>
              {RESOLVED_OPTIONS.map((opt) => {
                const isActive = issueResolved === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.resolveBtn,
                      isActive && {
                        backgroundColor: opt.badgeBg,
                        borderColor: opt.color,
                      },
                    ]}
                    onPress={() => setIssueResolved(opt.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.resolveBtnText,
                        isActive && { color: opt.color, fontWeight: '700' },
                      ]}
                    >
                      {opt.icon} {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Aspect Chips */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>
              {serviceRating >= 4 ? 'What did you like most?' : 'What could be improved?'}
            </Text>
            <TagChipGroup
              tags={availableAspects}
              selected={serviceAspects}
              onToggle={toggleServiceAspect}
              activeColor="#0f172a"
              activeBg="#f8fafc"
            />
          </View>

          {/* Comment */}
          <View style={styles.cardSection}>
            <View style={styles.labelCountRow}>
              <Text style={styles.sectionHeader}>Detailed Feedback (Optional)</Text>
              <Text style={styles.charCount}>{serviceComment.length}/300</Text>
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="Tell us about the repair quality, timeliness or spare parts used..."
              placeholderTextColor="#94a3b8"
              value={serviceComment}
              onChangeText={(t) => setServiceComment(t.slice(0, 300))}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Photos Upload */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>Attach Photos (Up to 3)</Text>
            <View style={styles.photosWrap}>
              {servicePhotos.map((uri, idx) => (
                <View key={idx} style={styles.photoItem}>
                  <Image source={{ uri }} style={styles.photoPreview} />
                  <TouchableOpacity
                    style={styles.photoRemoveBtn}
                    onPress={() => removePhoto(idx)}
                    accessibilityLabel="Remove photo"
                  >
                    <Text style={styles.photoRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {servicePhotos.length < 3 && (
                <TouchableOpacity style={styles.photoAddBtn} onPress={pickPhotos} activeOpacity={0.75}>
                  <Text style={styles.photoAddPlus}>+</Text>
                  <Text style={styles.photoAddText}>Upload</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Step 1 Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.primaryNextBtn}
              onPress={handleProceedToProvider}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryNextBtnText}>Next: Rate Technician →</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={() => setStep(2)}>
              <Text style={styles.skipBtnText}>Skip to Technician</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 2: FIELD PROFESSIONAL EVALUATION */}
      {step === 2 && (
        <View style={styles.stepContainer}>
          {/* Provider Hero Card */}
          <View style={styles.providerHeroCard}>
            <Image source={{ uri: avatar }} style={styles.providerAvatar} />
            <View style={styles.providerHeroInfo}>
              <View style={styles.providerNameRow}>
                <Text style={styles.providerHeroName}>{providerName}</Text>
                <View style={styles.verifiedProPill}>
                  <AppIcon name="check" size={10} color="#059669" />
                  <Text style={styles.verifiedProText}>Verified Pro</Text>
                </View>
              </View>
              <Text style={styles.providerHeroTrade}>{providerTrade}</Text>
              <View style={styles.providerMetricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricStar}>★ {providerRatingScore}</Text>
                  <Text style={styles.metricLabel}>Rating</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricNum}>{providerJobs}</Text>
                  <Text style={styles.metricLabel}>Services</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Overall Technician Star Rating */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>Overall Technician Evaluation</Text>
            <StarRatingInput
              value={providerRating}
              onChange={(s) => setProviderRating(s)}
              size={40}
            />
          </View>

          {/* Attribute Evaluation Rows */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>Rate Specific Performance Criteria</Text>
            <Text style={styles.sectionSub}>
              These ratings directly impact technician certifications and merit-based increments.
            </Text>

            <View style={styles.attributeList}>
              {PROVIDER_ATTRIBUTES.map((attr) => (
                <AttributeRatingRow
                  key={attr.key}
                  label={attr.label}
                  hint={attr.hint}
                  value={attributes[attr.key] || providerRating}
                  onChange={(val) => updateAttribute(attr.key, val)}
                />
              ))}
            </View>
          </View>

          {/* Compliments Chips */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>Technician Compliments</Text>
            <TagChipGroup
              tags={PROVIDER_COMPLIMENTS}
              selected={compliments}
              onToggle={toggleCompliment}
              activeColor="#6d28d9"
              activeBg="#f5f3ff"
            />
          </View>

          {/* Provider Private Comment */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>Private Note for Technician / Management</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Any commendation or specific coaching note for this partner..."
              placeholderTextColor="#94a3b8"
              value={providerComment}
              onChangeText={setProviderComment}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Step 2 Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.submitFinalBtn}
              onPress={handleFinalSubmit}
              disabled={submitting}
              activeOpacity={0.88}
            >
              <Text style={styles.submitFinalBtnText}>
                {submitting ? 'Submitting...' : 'Complete & Submit Review ✓'}
              </Text>
            </TouchableOpacity>

            <View style={styles.secondaryBtnRow}>
              <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(1)}>
                <Text style={styles.backStepBtnText}>← Edit Service Rating</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipBtn} onPress={handleSkipAll}>
                <Text style={styles.skipBtnText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backChevron: {
    fontSize: 24,
    color: '#0f172a',
    lineHeight: 28,
  },
  screenEyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  alertError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  alertErrorText: {
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '600',
  },
  stepContainer: {
    gap: 16,
  },
  serviceInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  serviceInfoLeft: {
    flex: 1,
    minWidth: 0,
  },
  bookingIdTag: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  serviceCategory: {
    fontSize: 12,
    color: '#64748b',
  },
  calendarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  calendarText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  cardSection: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeader: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 16,
  },
  resolveGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  resolveBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolveBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  labelCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 84,
    textAlignVertical: 'top',
    marginTop: 6,
  },
  photosWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  photoItem: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  photoAddBtn: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  photoAddPlus: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: '600',
  },
  photoAddText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  actionRow: {
    gap: 10,
    marginTop: 8,
  },
  primaryNextBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryNextBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  submitFinalBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitFinalBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  backStepBtn: {
    paddingVertical: 8,
  },
  backStepBtnText: {
    color: '#64748b',
    fontSize: 12.5,
    fontWeight: '600',
  },
  skipBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  skipBtnText: {
    color: '#94a3b8',
    fontSize: 12.5,
    fontWeight: '600',
  },
  providerHeroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  providerAvatar: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  providerHeroInfo: {
    flex: 1,
    minWidth: 0,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  providerHeroName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  verifiedProPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  verifiedProText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#065f46',
  },
  providerHeroTrade: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 6,
  },
  providerMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricStar: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
  },
  metricNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  metricDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#e2e8f0',
  },
  attributeList: {
    marginTop: 4,
  },
  successHero: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  successIconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successIconText: {
    fontSize: 26,
    color: '#059669',
    fontWeight: '800',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 440,
  },
  primaryBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
});
