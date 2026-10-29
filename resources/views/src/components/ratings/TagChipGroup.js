import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * TagChipGroup
 * Selectable tag pills for quick aspect & compliment selections.
 *
 * @param {Object} props
 * @param {Array<string>} props.tags - List of available tag strings
 * @param {Array<string>} props.selected - Currently selected tags
 * @param {function} props.onToggle - (tag: string) => void
 * @param {string} [props.activeColor='#0f172a'] - Active border/text color
 * @param {string} [props.activeBg='#f8fafc'] - Active background color
 * @param {boolean} [props.readOnly=false]
 */
export default function TagChipGroup({
  tags = [],
  selected = [],
  onToggle,
  activeColor = '#0f172a',
  activeBg = '#f1f5f9',
  readOnly = false,
}) {
  const selectedSet = new Set(selected || []);

  return (
    <View style={styles.container}>
      {tags.map((tag) => {
        const isSelected = selectedSet.has(tag);
        return (
          <TouchableOpacity
            key={tag}
            activeOpacity={readOnly ? 1 : 0.75}
            disabled={readOnly}
            onPress={() => onToggle && onToggle(tag)}
            style={[
              styles.chip,
              isSelected && {
                backgroundColor: activeBg,
                borderColor: activeColor,
              },
            ]}
          >
            {isSelected && <Text style={[styles.check, { color: activeColor }]}>✓ </Text>}
            <Text
              style={[
                styles.chipText,
                isSelected && {
                  color: activeColor,
                  fontWeight: '700',
                },
              ]}
            >
              {tag}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  check: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 2,
  },
  chipText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '500',
  },
});
