import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * AttributeRatingRow
 * Evaluates a specific provider attribute (e.g. punctuality, skill) with 1-5 compact stars.
 *
 * @param {Object} props
 * @param {string} props.label - Attribute title
 * @param {string} [props.hint] - Helpful explanatory hint
 * @param {number} props.value - Selected stars (1-5)
 * @param {function} props.onChange - (val: number) => void
 * @param {boolean} [props.readOnly=false]
 */
export default function AttributeRatingRow({
  label,
  hint,
  value = 5,
  onChange,
  readOnly = false,
}) {
  const currentVal = Math.max(1, Math.min(5, Number(value) || 5));

  return (
    <View style={styles.container}>
      <View style={styles.infoCol}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>

      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((s) => {
          const isFilled = currentVal >= s;
          return (
            <TouchableOpacity
              key={s}
              activeOpacity={readOnly ? 1 : 0.7}
              disabled={readOnly}
              onPress={() => onChange && onChange(s)}
              style={styles.starBtn}
              accessibilityLabel={`${label} ${s} stars`}
            >
              <Text style={[styles.starChar, isFilled ? styles.starFilled : styles.starEmpty]}>
                ★
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  hint: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  starBtn: {
    padding: 3,
  },
  starChar: {
    fontSize: 22,
    lineHeight: 24,
  },
  starFilled: {
    color: '#f59e0b',
  },
  starEmpty: {
    color: '#e2e8f0',
  },
});
