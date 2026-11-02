import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { AppIcon } from '../AppIcons';
import { resolveApplianceImage, getApplianceVideoUri } from '../../utils/applianceMediaHelper';

const CATEGORY_ICONS = {
  ALL: (color) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Electrician: (color) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Plumbing: (color) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  Carpentry: (color) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  'Pest Control': (color) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  'Dry Cleaning': (color) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 1.912 5.885h6.188l-5.008 3.637 1.913 5.885L12 14.77l-5.005 3.637 1.913-5.885-5.008-3.637h6.188z" />
    </svg>
  ),
  Other: (color) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  ),
};

const SERVICE_TO_CATEGORY_MAP = {
  // Pest Control
  'bedbugs': 'Pest Control',
  'bedbug': 'Pest Control',
  'bedbug control': 'Pest Control',
  'bedbugs_control': 'Pest Control',
  'termite': 'Pest Control',
  'termite control': 'Pest Control',
  'cockroach': 'Pest Control',

  // Plumbing
  'bath & shower': 'Plumbing',
  'tap mixer': 'Plumbing',
  'toilet': 'Plumbing',
  'basins & sinks': 'Plumbing',
  'drainage & blockage': 'Plumbing',
  'leakages & connections': 'Plumbing',
  'water tanks & motors': 'Plumbing',

  // Dry Cleaning
  'sofa fabric': 'Dry Cleaning',
  'leather sofa': 'Dry Cleaning',
  'carpets': 'Dry Cleaning',
  'carpet': 'Dry Cleaning',
  'fabric headboards': 'Dry Cleaning',
  'leather headboards': 'Dry Cleaning',
  'dining tables & chairs': 'Dry Cleaning',
  'curtains': 'Dry Cleaning',
  'large chairs': 'Dry Cleaning',

  // Carpentry
  'bed': 'Carpentry',
  'sofa': 'Carpentry',
  'table': 'Carpentry',
  'chair': 'Carpentry',
  'door repair': 'Carpentry',
  'drawer': 'Carpentry',
  'cupboard lock': 'Carpentry',
  'cupboard': 'Carpentry',
  'door mesh': 'Carpentry',
  'door closer': 'Carpentry',
  'door lock': 'Carpentry',
  'cabinet hinges': 'Carpentry',
  'pull out drawer': 'Carpentry',
  'cabinet hydraulic': 'Carpentry',

  // Electrician
  'ac': 'Electrician',
  'washing machine': 'Electrician',
  'tv': 'Electrician',
  'air cooler': 'Electrician',
  'cooler': 'Electrician',
  'geyser': 'Electrician',
  'fans': 'Electrician',
  'fan': 'Electrician',
  'switch boards': 'Electrician',
  'switch board': 'Electrician',
  'plugs & sockets': 'Electrician',
  'plug': 'Electrician',
  'exhaust fan': 'Electrician',
  'fan regulator': 'Electrician',
  'fancy lights': 'Electrician',
  'fancy light': 'Electrician',
  'bulbs & tubelights': 'Electrician',
  'bulb': 'Electrician',
  'chandelier': 'Electrician',
  'doorbell': 'Electrician',
  'cctv': 'Electrician',
  'mcb & main switch': 'Electrician',
  'mcb': 'Electrician',
  'home theatre': 'Electrician',
  'inverters & batteries': 'Electrician',
  'inverter': 'Electrician',
  'stabilisers': 'Electrician',
  'stabiliser': 'Electrician',
  'iron': 'Electrician',
  'vacuum cleaner': 'Electrician',
  'trimmer': 'Electrician',
  'projector': 'Electrician',
  'desktops': 'Electrician',
  'desktop': 'Electrician',
  'refrigerator': 'Electrician',
  'fridge': 'Electrician',
  'stove': 'Electrician',
  'coffee machine': 'Electrician',
  'microwave': 'Electrician',
  'water purifiers': 'Electrician',
  'water purifier': 'Electrician',
  'ro': 'Electrician',
  'juicer & mixer': 'Electrician',
};

const resolveCategoryName = (appliance) => {
  if (!appliance) return 'Other';

  const rawCat = String(appliance?.category || '').trim();
  const c = rawCat.toLowerCase();
  const n = String(appliance?.displayName || appliance?.name || '').trim().toLowerCase();
  const s = String(appliance?.serviceName || '').trim().toLowerCase();
  const t = String(appliance?.applianceTypeId || appliance?.type || '').trim().toLowerCase();

  // 1. Direct Category Match if already canonical
  if (c === 'pest control' || c === 'pest_control' || c === 'pest') return 'Pest Control';
  if (c === 'plumbing' || c === 'plumber') return 'Plumbing';
  if (c === 'carpentry' || c === 'carpenter') return 'Carpentry';
  if (c === 'dry cleaning' || c === 'dry_cleaning' || c === 'cleaning') return 'Dry Cleaning';
  if (c === 'electrician' || c === 'electrical' || c === 'home appliance' || c === 'home appliances' || c === 'kitchen appliances') return 'Electrician';

  // 2. Exact match against service catalog dictionary
  if (SERVICE_TO_CATEGORY_MAP[s]) return SERVICE_TO_CATEGORY_MAP[s];
  if (SERVICE_TO_CATEGORY_MAP[n]) return SERVICE_TO_CATEGORY_MAP[n];
  if (SERVICE_TO_CATEGORY_MAP[t]) return SERVICE_TO_CATEGORY_MAP[t];

  const hay = ` ${c} ${n} ${s} ${t} `;

  // 3. Pest Control (High priority to avoid collision with bed/fabric)
  if (
    hay.includes('pest') ||
    hay.includes('cockroach') ||
    hay.includes('termite') ||
    hay.includes('bedbug') ||
    hay.includes('bed bug') ||
    hay.includes('insect') ||
    hay.includes('rodent')
  ) {
    return 'Pest Control';
  }

  // 4. Plumbing
  if (
    hay.includes('plumb') ||
    hay.includes('tap') ||
    hay.includes('shower') ||
    hay.includes('sink') ||
    hay.includes('basin') ||
    hay.includes('toilet') ||
    hay.includes('commode') ||
    hay.includes('drain') ||
    hay.includes('leak') ||
    hay.includes('pipe') ||
    hay.includes('valve') ||
    hay.includes('faucet') ||
    hay.includes('water tank') ||
    hay.includes('water pump')
  ) {
    return 'Plumbing';
  }

  // 5. Dry Cleaning
  if (
    hay.includes('dry clean') ||
    hay.includes('dryclean') ||
    hay.includes('carpet') ||
    hay.includes('curtain') ||
    hay.includes('upholstery') ||
    hay.includes('sofa fabric') ||
    hay.includes('leather sofa') ||
    hay.includes('headboard') ||
    hay.includes('laundry')
  ) {
    return 'Dry Cleaning';
  }

  // 6. Carpentry (Whole-word bed to avoid bedbug collision, exclude doorbell)
  if (
    hay.includes('carpent') ||
    hay.includes('wood') ||
    hay.includes('furnitur') ||
    hay.includes('sofa') ||
    hay.includes('table') ||
    hay.includes('chair') ||
    hay.includes('cupboard') ||
    hay.includes('cabinet') ||
    hay.includes('drawer') ||
    hay.includes('wardrobe') ||
    hay.includes('almirah') ||
    /\bbed\b/.test(hay) ||
    (hay.includes('door') && !hay.includes('doorbell')) ||
    hay.includes('lock') ||
    hay.includes('hinge')
  ) {
    return 'Carpentry';
  }

  // 7. Electrician
  if (
    hay.includes('elect') ||
    hay.includes('switch') ||
    hay.includes('socket') ||
    hay.includes('plug') ||
    hay.includes('light') ||
    hay.includes('bulb') ||
    hay.includes('chandelier') ||
    hay.includes('doorbell') ||
    hay.includes('cctv') ||
    hay.includes('mcb') ||
    hay.includes('inverter') ||
    hay.includes('battery') ||
    hay.includes('stabiliser') ||
    hay.includes('iron') ||
    hay.includes('vacuum') ||
    hay.includes('trimmer') ||
    hay.includes('fan') ||
    hay.includes('cooler') ||
    hay.includes('geyser') ||
    hay.includes('refrigerat') ||
    hay.includes('fridge') ||
    hay.includes('washing machine') ||
    hay.includes('microwave') ||
    hay.includes('oven') ||
    hay.includes('purifier') ||
    hay.includes('stove') ||
    hay.includes('juicer') ||
    hay.includes('mixer') ||
    /\bac\b/.test(hay) ||
    /\btv\b/.test(hay)
  ) {
    return 'Electrician';
  }

  return 'Other';
};

export default function ApplianceCartScreen({
  appliances = [],
  planName = 'AMC',
  onBack,
  onAddMore,
  onProceed,
  onRemoveAppliance,
  onInspectAppliance,
}) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [removeTarget, setRemoveTarget] = useState(null);

  const categoryCounts = useMemo(() => {
    const counts = { ALL: appliances.length };
    appliances.forEach((item) => {
      const cat = resolveCategoryName(item);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [appliances]);

  const categories = useMemo(() => {
    const keys = ['Electrician', 'Plumbing', 'Carpentry', 'Pest Control', 'Dry Cleaning', 'Other'];
    return keys.filter((k) => (categoryCounts[k] || 0) > 0);
  }, [categoryCounts]);

  const filteredAppliances = useMemo(() => {
    if (activeCategory === 'ALL') return appliances;
    return appliances.filter((item) => resolveCategoryName(item) === activeCategory);
  }, [appliances, activeCategory]);

  const handleConfirmRemove = () => {
    if (removeTarget != null && onRemoveAppliance) {
      onRemoveAppliance(removeTarget);
    }
    setRemoveTarget(null);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Back to categories"
        >
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Appliance Cart</Text>
          <Text style={styles.headerSub}>
            {planName ? `${planName} Plan Coverage` : 'AMC Protected Appliances'}
          </Text>
        </View>

        <View style={styles.headerCountBadge}>
          <Text style={styles.headerCountBadgeText}>
            {appliances.length} {appliances.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: isDesktop ? 100 : 135 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Plan Protection Summary Banner */}
        <View style={styles.planBanner}>
          <View style={styles.planBannerIconWrap}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.planBannerTitle}>
              {planName ? `${planName} Protection Activated` : 'AMC Coverage Protection'}
            </Text>
            <Text style={styles.planBannerSub}>
              All items in this cart are fully covered with ₹0 breakdown labor under your plan.
            </Text>
          </View>
        </View>

        {/* Category Filters (when items exist in cart) */}
        {appliances.length > 0 && categories.length > 1 && (
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, activeCategory === 'ALL' && styles.filterChipActive]}
              onPress={() => setActiveCategory('ALL')}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {CATEGORY_ICONS.ALL(activeCategory === 'ALL' ? '#ffffff' : '#64748b')}
                <Text style={[styles.filterChipText, activeCategory === 'ALL' && styles.filterChipTextActive]}>
                  All ({appliances.length})
                </Text>
              </View>
            </TouchableOpacity>

            {categories.map((catKey) => {
              const active = activeCategory === catKey;
              const count = categoryCounts[catKey] || 0;
              const renderIcon = CATEGORY_ICONS[catKey] || CATEGORY_ICONS.Other;

              return (
                <TouchableOpacity
                  key={catKey}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setActiveCategory(catKey)}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {renderIcon(active ? '#ffffff' : '#64748b')}
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {catKey} ({count})
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Cart Item Cards or Empty State */}
        {appliances.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </View>
            <Text style={styles.emptyTitle}>Your Appliance Cart is Empty</Text>
            <Text style={styles.emptySub}>
              You haven't added any appliances to your plan yet. Browse categories to register items under your {planName || 'AMC'} protection.
            </Text>
            <TouchableOpacity
              style={styles.emptyBrowseBtn}
              onPress={onAddMore}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyBrowseBtnText}>+ Browse & Add Appliances</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.itemList}>
            {filteredAppliances.map((appliance, idx) => {
              const name = appliance.displayName || appliance.name || appliance.category || 'Appliance';
              const catName = resolveCategoryName(appliance);
              const brand = appliance.brand || appliance.customBrand || '';
              const location = appliance.location || '';
              const condition = appliance.condition || 'Working';
              const videoUri = getApplianceVideoUri(appliance);
              const imgUrl = resolveApplianceImage(appliance);

              return (
                <View
                  key={appliance.id || `cart-item-${idx}`}
                  style={styles.itemCard}
                >
                  <View style={styles.itemTopRow}>
                    {/* Media Thumbnail */}
                    <TouchableOpacity
                      style={styles.thumbWrap}
                      onPress={() => onInspectAppliance?.(appliance)}
                      activeOpacity={0.88}
                    >
                      {videoUri && Platform.OS === 'web' ? (
                        <video
                          src={videoUri}
                          muted
                          playsInline
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 10,
                          }}
                        />
                      ) : (
                        <Image
                          source={{ uri: imgUrl }}
                          style={styles.thumbImg}
                          resizeMode="contain"
                        />
                      )}
                      {videoUri && (
                        <View style={styles.videoBadge}>
                          <Text style={styles.videoBadgeText}>▶ VIDEO</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Details Column */}
                    <View style={styles.itemInfoCol}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {name}
                        </Text>
                        {onRemoveAppliance && (
                          <TouchableOpacity
                            style={styles.trashBtn}
                            onPress={() => setRemoveTarget(appliance.id != null ? appliance.id : idx)}
                            activeOpacity={0.7}
                            accessibilityLabel="Remove appliance"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </TouchableOpacity>
                        )}
                      </View>

                      <Text style={styles.itemMeta} numberOfLines={1}>
                        {catName}
                        {brand ? ` · ${brand}` : ''}
                        {location ? ` · ${location}` : ''}
                      </Text>

                      {/* Attribute Pills */}
                      <View style={styles.chipRow}>
                        <View style={styles.coveredPill}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <Text style={styles.coveredPillText}>PLAN COVERED</Text>
                        </View>
                        <View style={styles.conditionPill}>
                          <Text style={styles.conditionPillText}>₹0 LABOR</Text>
                        </View>
                        {condition && condition !== 'Working' && (
                          <View style={[styles.conditionPill, { backgroundColor: '#fef3c7' }]}>
                            <Text style={[styles.conditionPillText, { color: '#b45309' }]}>{condition}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Video Walkthrough Status Strip */}
                  <View style={styles.itemBottomStrip}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={videoUri ? '#16a34a' : '#2563eb'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        {videoUri ? (
                          <polyline points="20 6 9 17 4 12" />
                        ) : (
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        )}
                      </svg>
                      <Text style={styles.bottomStripText}>
                        {videoUri ? 'Video Walkthrough Recorded' : 'Catalog Verified Item'}
                      </Text>
                    </View>

                    {onInspectAppliance && (
                      <TouchableOpacity
                        onPress={() => onInspectAppliance(appliance)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.viewDetailsLink}>View Details ›</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Bar (E-commerce cart checkout style) */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          {isDesktop ? (
            <View style={styles.bottomBarDesktopRow}>
              <View style={styles.bottomBarLeft}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.bottomBarCount}>
                    {appliances.length} {appliances.length === 1 ? 'Appliance' : 'Appliances'}
                  </Text>
                  {!!planName && (
                    <View style={styles.planBadgeInline}>
                      <Text style={styles.planBadgeInlineText}>{planName} Plan</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.bottomBarSub}>
                  Fully covered under plan • ₹0 Extra Labor
                </Text>
              </View>

              <View style={styles.bottomBarActions}>
                <TouchableOpacity
                  style={styles.addMoreBtn}
                  onPress={onAddMore}
                  activeOpacity={0.85}
                >
                  <Text style={styles.addMoreBtnText}>+ Add More</Text>
                </TouchableOpacity>

                {onProceed && appliances.length > 0 && (
                  <TouchableOpacity
                    style={styles.proceedBtn}
                    onPress={onProceed}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.proceedBtnText}>Proceed →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.bottomBarMobileStack}>
              {/* Row 1: Summary info bar */}
              <View style={styles.mobileSummaryRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <View style={styles.summaryDot} />
                  <Text style={styles.mobileCountText}>
                    {appliances.length} {appliances.length === 1 ? 'Appliance' : 'Appliances'}
                  </Text>
                </View>
                <View style={styles.mobilePlanPill}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <Text style={styles.mobilePlanPillText}>
                    {planName ? `${planName} Plan` : 'AMC'} • ₹0 Extra
                  </Text>
                </View>
              </View>

              {/* Row 2: Action buttons */}
              <View style={styles.mobileActionsRow}>
                <TouchableOpacity
                  style={styles.mobileAddMoreBtn}
                  onPress={onAddMore}
                  activeOpacity={0.85}
                >
                  <Text style={styles.mobileAddMoreText}>+ Add More</Text>
                </TouchableOpacity>

                {onProceed && appliances.length > 0 && (
                  <TouchableOpacity
                    style={styles.mobileProceedBtn}
                    onPress={onProceed}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.mobileProceedText}>Proceed</Text>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Remove Confirmation Modal */}
      <Modal visible={removeTarget != null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTrashIconWrap}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </View>
            <Text style={styles.modalTitle}>Remove from Plan?</Text>
            <Text style={styles.modalSub}>
              Are you sure you want to remove this appliance from your {planName || 'AMC'} plan? You can add it back anytime before purchasing.
            </Text>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRemoveTarget(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmRemoveBtn}
                onPress={handleConfirmRemove}
                activeOpacity={0.88}
              >
                <Text style={styles.modalConfirmRemoveBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 22,
    color: '#0f172a',
    fontWeight: '700',
    marginTop: -2,
    marginLeft: -1,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1,
  },
  headerCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  headerCountBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563eb',
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
    gap: 14,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    boxSizing: 'border-box',
  },

  planBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 14,
  },
  planBannerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  planBannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  planBannerSub: {
    fontSize: 11.5,
    color: '#3b82f6',
    marginTop: 2,
    lineHeight: 16,
  },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },

  itemList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 10,
    boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
  },
  itemTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImg: {
    width: '85%',
    height: '85%',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    right: 2,
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderRadius: 4,
    paddingVertical: 1,
    alignItems: 'center',
  },
  videoBadgeText: {
    color: '#ffffff',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  itemInfoCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 3,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  trashBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
  },
  itemMeta: {
    fontSize: 11.5,
    color: '#64748b',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  coveredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  coveredPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803d',
  },
  conditionPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  conditionPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
  },

  itemBottomStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  bottomStripText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  viewDetailsLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },

  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 32,
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 380,
  },
  emptyBrowseBtn: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
  },
  emptyBrowseBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    boxShadow: '0 -6px 20px rgba(15, 23, 42, 0.08)',
    zIndex: 90,
  },
  bottomBarInner: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  bottomBarDesktopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  bottomBarMobileStack: {
    gap: 10,
    width: '100%',
  },
  mobileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  mobileCountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  mobilePlanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mobilePlanPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  mobileActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  mobileAddMoreBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileAddMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  mobileProceedBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0052e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    boxShadow: '0 4px 12px rgba(0, 82, 224, 0.28)',
  },
  mobileProceedText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  planBadgeInline: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  planBadgeInlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  bottomBarLeft: {
    flex: 1,
    minWidth: 0,
  },
  bottomBarCount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  bottomBarSub: {
    fontSize: 11.5,
    color: '#15803d',
    fontWeight: '600',
    marginTop: 2,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  bottomBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addMoreBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
  },
  addMoreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  proceedBtn: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#0052e0',
    boxShadow: '0 4px 12px rgba(0, 82, 224, 0.28)',
  },
  proceedBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 22,
    maxWidth: 380,
    width: '100%',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
  },
  modalTrashIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  modalConfirmRemoveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  modalConfirmRemoveBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },
});
