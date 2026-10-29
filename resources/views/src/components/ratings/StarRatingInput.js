import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { STAR_LABELS } from '../../config/ratingConfig';

/**
 * StarRatingInput
 * Interactive 1-5 star selector with live label and customizable star sizing.
 *
 * @param {Object} props
 * @param {number} props.value - Selected rating (1-5)
 * @param {function} props.onChange - Rating change handler (rating: number) => void
 * @param {number} [props.size=38] - Font size of the stars
 * @param {boolean} [props.showLabel=true] - Whether to show the descriptive label below
 * @param {boolean} [props.readOnly=false] - Whether interactions are disabled
 * @param {Object} [props.customLabels] - Optional override map of star labels
 */
export default function StarRatingInput({
  value = 5,
  onChange,
  size = 38,
  showLabel = true,
  readOnly = false,
  customLabels = STAR_LABELS,
}) {
  const currentRating = Math.max(0, Math.min(5, Number(value) || 0));

  return (
    <View style={styles.wrapper}>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = currentRating >= star;
          return (
            <TouchableOpacity
              key={star}
              activeOpacity={readOnly ? 1 : 0.7}
              disabled={readOnly}
              onPress={() => onChange && onChange(star)}
              style={styles.starTouch}
              accessibilityLabel={`${star} stars`}
              accessibilityRole={readOnly ? 'text' : 'button'}
            >
              <Text
                style={[
                  styles.starChar,
                  { fontSize: size, lineHeight: size + 4 },
                  isFilled ? styles.starFilled : styles.starEmpty,
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {showLabel && currentRating > 0 && (
        <View style={styles.labelBadge}>
          <Text style={styles.labelText}>{customLabels[currentRating] || ''}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  starTouch: {
    padding: 4,
  },
  starChar: {
    letterSpacing: -1,
  },
  starFilled: {
    color: '#f59e0b',
    textShadowColor: 'rgba(245, 158, 11, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  starEmpty: {
    color: '#e2e8f0',
  },
  labelBadge: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  labelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
    letterSpacing: 0.3,
  },
});
