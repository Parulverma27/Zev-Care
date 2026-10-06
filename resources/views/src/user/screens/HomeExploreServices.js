import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { resolveCategoryImageUri } from '../../utils/imageUtils';

const ALL_SERVICES_SLIDESHOW = [
  {
    id: 'ac_service',
    name: 'AC Service & Repair',
    bg: '#eff6ff',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h20M12 2v20M20 16l-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4" />
      </svg>
    ),
  },
  {
    id: 'electrician',
    name: 'Electrician & Wiring',
    bg: '#fffbeb',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    id: 'plumber',
    name: 'Plumbing & Leak Fix',
    bg: '#ecfeff',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    id: 'carpenter',
    name: 'Carpenter & Furniture',
    bg: '#fff7ed',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: 'washing_machine',
    name: 'Washing Machine',
    bg: '#f0fdfa',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <circle cx="12" cy="13" r="4" />
        <circle cx="12" cy="6" r="1" />
      </svg>
    ),
  },
  {
    id: 'refrigerator',
    name: 'Refrigerator Repair',
    bg: '#f0f9ff',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="5" y1="10" x2="19" y2="10" />
        <line x1="9" y1="5" x2="9" y2="8" />
        <line x1="9" y1="13" x2="9" y2="17" />
      </svg>
    ),
  },
  {
    id: 'pest_control',
    name: 'Pest & Bug Control',
    bg: '#f0fdf4',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 11 11 13 15 9" />
      </svg>
    ),
  },
  {
    id: 'tv_av',
    name: 'TV Mount & AV Fix',
    bg: '#faf5ff',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="13" rx="2" />
        <polyline points="17 2 12 7 7 2" />
      </svg>
    ),
  },
];

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

const marqueeWebCss = {
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    padding: '6px 0',
    margin: '4px 0',
    maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
    WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
    pointerEvents: 'none',
  },
  track: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '20px',
    width: 'max-content',
    animation: 'marqueeScroll 24s linear infinite',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '84px',
    flexShrink: 0,
    pointerEvents: 'none',
  },
  iconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(0, 0, 0, 0.04)',
    pointerEvents: 'none',
  },
  title: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: '14px',
    fontFamily: "'Inter', sans-serif",
    display: 'block',
    width: '100%',
    pointerEvents: 'none',
  },
};

export default function HomeExploreServices({
  categories = [],
  title = 'Explore Services',
  viewAllLabel = 'View all',
  onViewAll,
  onSelectCategory,
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
                source={{ uri: resolveCategoryImageUri(cat.name, cat.image_url) }}
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

      <View style={styles.allServicesSection} pointerEvents="none">
        <style>{`
          @keyframes marqueeScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.333%); }
          }
        `}</style>
        {Platform.OS === 'web' ? (
          <div style={marqueeWebCss.container}>
            <div style={marqueeWebCss.track}>
              {[...ALL_SERVICES_SLIDESHOW, ...ALL_SERVICES_SLIDESHOW, ...ALL_SERVICES_SLIDESHOW].map((serviceItem, idx) => (
                <div key={`${serviceItem.id}-${idx}`} style={marqueeWebCss.card}>
                  <div style={{ ...marqueeWebCss.iconCircle, backgroundColor: serviceItem.bg }}>
                    {serviceItem.icon}
                  </div>
                  <span style={marqueeWebCss.title}>{serviceItem.name}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesScrollContainer}
            pointerEvents="none"
          >
            {ALL_SERVICES_SLIDESHOW.map((serviceItem) => (
              <View key={serviceItem.id} style={styles.serviceSlideCardStatic}>
                <View style={[styles.serviceIconCircle, { backgroundColor: serviceItem.bg }]}>
                  {serviceItem.icon}
                </View>
                <Text style={styles.serviceSlideTitle} numberOfLines={2}>
                  {serviceItem.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
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
  allServicesSection: {
    marginTop: 10,
    marginBottom: 4,
    gap: 8,
  },
  servicesScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    gap: 14,
  },
  serviceSlideCardStatic: {
    width: 84,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  serviceIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  serviceSlideTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 14,
    fontFamily: 'Inter, sans-serif',
  },
});
