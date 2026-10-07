import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { resolveCategoryImageUri } from '../../utils/imageUtils';

const exploreGridCss = {
  wrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px 14px',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: 10,
  },
};

export default function HomeExploreServices({
  categories = [],
  title = 'Explore Services',
  viewAllLabel = 'View all',
  onViewAll,
  onSelectCategory,
  isComplaint = false,
}) {
  return (
    <>
      <View style={styles.exploreHeader}>
        <Text style={styles.exploreTitle}>{title}</Text>
        {onViewAll ? (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllText}>{viewAllLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <div style={exploreGridCss.wrapper}>
        {(categories || []).map((cat) => (
          <TouchableOpacity
            key={cat.id || cat.name}
            style={styles.gridCardContainer}
            onPress={() => onSelectCategory?.(cat)}
            activeOpacity={0.85}
          >
            <View style={styles.gridImgWrap}>
              <Image
                source={{ uri: resolveCategoryImageUri(cat.name, cat.image_url, isComplaint) }}
                style={styles.gridImg}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.gridCardTitleUnder} numberOfLines={1}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </div>
    </>
  );
}

const styles = StyleSheet.create({
  exploreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 0,
  },
  exploreTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#002574',
    fontFamily: 'Inter, sans-serif',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
    fontFamily: 'Inter, sans-serif',
  },
  gridCardContainer: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
  },
  gridImgWrap: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.07)',
  },
  gridImg: {
    width: '100%',
    height: '100%',
  },
  gridCardTitleUnder: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});
