import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, useWindowDimensions } from 'react-native';
import { resolveCategoryImageUri } from '../../utils/imageUtils';

export default function HomeExploreServices({
  categories = [],
  title = 'Explore Services',
  viewAllLabel = 'View all',
  onViewAll,
  onSelectCategory,
  isComplaint = false,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: isDesktop ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr 1fr',
    gap: isDesktop ? '26px' : '16px 14px',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: 14,
  };

  return (
    <>
      <View style={styles.exploreHeader}>
        <Text style={[styles.exploreTitle, isDesktop && styles.exploreTitleDesktop]}>{title}</Text>
        {onViewAll ? (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllText}>{viewAllLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <div style={gridStyle}>
        {(categories || []).map((cat) => (
          <TouchableOpacity
            key={cat.id || cat.name}
            style={[styles.gridCardContainer, isDesktop && styles.gridCardContainerDesktop]}
            className="zc-category-browse-card"
            onPress={() => onSelectCategory?.(cat)}
            activeOpacity={0.88}
          >
            <View style={[styles.gridImgWrap, isDesktop && styles.gridImgWrapDesktop]}>
              <Image
                source={{ uri: resolveCategoryImageUri(cat.name, cat.image_url, isComplaint) }}
                style={styles.gridImg}
                resizeMode="cover"
              />
            </View>
            <Text style={[styles.gridCardTitleUnder, isDesktop && styles.gridCardTitleDesktop]} numberOfLines={1}>
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
  gridCardContainerDesktop: {
    alignItems: 'center',
  },
  gridImgWrap: {
    width: '100%',
    height: 125,
    borderRadius: 12,
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
    lineHeight: 18,
  },
  exploreTitleDesktop: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  gridImgWrapDesktop: {
    height: 260,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.08), 0 4px 10px -2px rgba(15, 23, 42, 0.04)',
  },
  gridCardTitleDesktop: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    letterSpacing: -0.2,
  },
});
