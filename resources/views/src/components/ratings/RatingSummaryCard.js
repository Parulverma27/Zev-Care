import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { PROVIDER_ATTRIBUTES, RESOLVED_OPTIONS } from '../../config/ratingConfig';

/**
 * RatingSummaryCard
 * Displays a luxury read-only breakdown of both Service and Provider ratings.
 *
 * @param {Object} props
 * @param {Object} props.serviceReview - { rating, issue_resolved, aspects, comment, photos, submitted_at }
 * @param {Object} props.providerReview - { rating, attributes, compliments, comment, submitted_at, provider_name }
 * @param {string} [props.serviceName] - Service title
 * @param {string} [props.providerName] - Provider name
 */
export default function RatingSummaryCard({
  serviceReview,
  providerReview,
  serviceName = 'Home Service',
  providerName = 'Assigned Technician',
}) {
  const resolvedOpt = (RESOLVED_OPTIONS || []).find(
    (o) => o.id === serviceReview?.issue_resolved
  ) || { label: 'Resolved', color: '#059669', badgeBg: '#ecfdf5' };

  return (
    <View style={styles.card}>
      {/* Service Review Block */}
      {serviceReview && (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionEyebrow}>SERVICE REVIEW</Text>
              <Text style={styles.sectionTitle}>{serviceName}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.starIcon}>★</Text>
              <Text style={styles.ratingNum}>{serviceReview.rating}.0</Text>
            </View>
          </View>

          {/* Issue resolved pill */}
          <View style={styles.metaRow}>
            <View
              style={[
                styles.resolutionPill,
                { backgroundColor: resolvedOpt.badgeBg, borderColor: resolvedOpt.color + '40' },
              ]}
            >
              <Text style={[styles.resolutionText, { color: resolvedOpt.color }]}>
                Issue: {resolvedOpt.label}
              </Text>
            </View>
          </View>

          {/* Aspects */}
          {Array.isArray(serviceReview.aspects) && serviceReview.aspects.length > 0 && (
            <View style={styles.tagsWrap}>
              {serviceReview.aspects.map((asp) => (
                <View key={asp} style={styles.aspectPill}>
                  <Text style={styles.aspectText}>{asp}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Comment */}
          {serviceReview.comment ? (
            <Text style={styles.commentQuote}>“{serviceReview.comment}”</Text>
          ) : null}

          {/* Photos */}
          {Array.isArray(serviceReview.photos) && serviceReview.photos.length > 0 && (
            <View style={styles.photosRow}>
              {serviceReview.photos.map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.photoThumb} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Divider */}
      {serviceReview && providerReview && <View style={styles.divider} />}

      {/* Provider Review Block */}
      {providerReview && (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionEyebrow}>PROFESSIONAL EVALUATION</Text>
              <Text style={styles.sectionTitle}>
                {providerReview.provider_name || providerName}
              </Text>
            </View>
            <View style={styles.ratingBadgeGold}>
              <Text style={styles.starIconGold}>★</Text>
              <Text style={styles.ratingNumGold}>{providerReview.rating}.0</Text>
            </View>
          </View>

          {/* Attributes breakdown */}
          {providerReview.attributes && (
            <View style={styles.attrGrid}>
              {PROVIDER_ATTRIBUTES.map((attr) => {
                const score = providerReview.attributes[attr.key] || providerReview.rating || 5;
                return (
                  <View key={attr.key} style={styles.attrCol}>
                    <Text style={styles.attrName}>{attr.label}</Text>
                    <Text style={styles.attrStars}>{'★'.repeat(score)}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Compliments */}
          {Array.isArray(providerReview.compliments) && providerReview.compliments.length > 0 && (
            <View style={styles.tagsWrap}>
              {providerReview.compliments.map((comp) => (
                <View key={comp} style={styles.complimentPill}>
                  <Text style={styles.complimentText}>✓ {comp}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Comment */}
          {providerReview.comment ? (
            <Text style={styles.commentQuote}>“{providerReview.comment}”</Text>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginVertical: 12,
  },
  sectionBlock: {
    paddingVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#94a3b8',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  starIcon: {
    color: '#f59e0b',
    fontSize: 14,
  },
  ratingNum: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  ratingBadgeGold: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  starIconGold: {
    color: '#d97706',
    fontSize: 14,
  },
  ratingNumGold: {
    color: '#92400e',
    fontWeight: '800',
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  resolutionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  resolutionText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  aspectPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aspectText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  complimentPill: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ede9fe',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  complimentText: {
    fontSize: 11.5,
    color: '#6d28d9',
    fontWeight: '600',
  },
  commentQuote: {
    marginTop: 10,
    fontSize: 13,
    fontStyle: 'italic',
    color: '#334155',
    lineHeight: 18,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  attrGrid: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    gap: 6,
  },
  attrCol: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attrName: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
  attrStars: {
    color: '#f59e0b',
    fontSize: 13,
    letterSpacing: 1,
  },
});
