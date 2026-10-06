import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Modal, Platform } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { searchAllServices } from '../../config/serviceCatalogUtils';
import { resolveImageUri, DEFAULT_BANNERS } from '../../utils/imageUtils';
import { SERVICE_IMAGES } from '../../utils/bundledImages';
import { AppIcon } from '../../components/AppIcons';
import ZevotaLogo from '../../components/ZevotaLogo';
import GoogleMapsLocationPicker from '../../components/GoogleMapsLocationPicker';
import { upsertDefaultAddress } from '../../utils/savedAddresses';

const profilePic = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120';

const TRUST_FEATURES = [
  {
    label: 'Verified\nprofessionals',
    route: '/user/bookings/new',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 11 11 13 15 9" />
      </svg>
    ),
  },
  {
    label: 'Transparent\nservice',
    route: '/user/bookings/new',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  },
  {
    label: 'Secure\nbooking',
    route: '/user/bookings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    label: 'Service\nsupport',
    route: '/user/support',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
        <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
  },
];

const AMC_HOME_ACTIONS = [
  {
    key: 'plans',
    title: 'AMC Plans',
    subtitle: 'Cover your home with complete peace of mind',
    route: '/user/plans',
    cardBg: 'linear-gradient(90deg, #ffffff 50%, #eff6ff 100%)',
    borderColor: '#dbeafe',
    iconBg: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
    iconBoxShadow: '0 3px 10px rgba(37, 99, 235, 0.22)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    watermark: (
      <svg width="76" height="76" viewBox="0 0 24 24" fill="#2563eb" fillOpacity="0.06">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    key: 'complaints',
    title: 'AMC Complaints',
    subtitle: 'Repair any appliance or issue at your home',
    route: '/user/complains',
    cardBg: 'linear-gradient(90deg, #ffffff 50%, #eff6ff 100%)',
    borderColor: '#dbeafe',
    iconBg: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    iconBoxShadow: '0 3px 10px rgba(37, 99, 235, 0.22)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
    watermark: (
      <svg width="76" height="76" viewBox="0 0 24 24" fill="#2563eb" fillOpacity="0.05">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    key: 'consultation',
    title: 'AMC Consultation',
    subtitle: 'Free for logged-in users',
    badge: 'FREE',
    route: '/user/consultation',
    cardBg: 'linear-gradient(90deg, #ffffff 50%, #ecfdf5 100%)',
    borderColor: '#d1fae5',
    iconBg: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
    iconBoxShadow: '0 3px 10px rgba(13, 148, 136, 0.22)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    watermark: (
      <svg width="76" height="76" viewBox="0 0 24 24" fill="#0d9488" fillOpacity="0.06">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export default function HomeScreen({ onNavigate }) {
  const { activeUser, updateProfile, banners } = useApp();
  const navigate = useNavigate();

  const defaultAddr =
    (activeUser?.saved_addresses || []).find((a) => a.isDefault)?.address ||
    activeUser?.address ||
    'Select your location';
  const [selectedLocation, setSelectedLocation] = useState(defaultAddr);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const activeBannersList = React.useMemo(() => {
    const heroBanners = (banners || []).filter(
      (b) => (b.type === 'hero' || b.type === 'HERO') && b.status !== 'INACTIVE'
    );
    if (heroBanners.length > 0) return heroBanners;
    return DEFAULT_BANNERS;
  }, [banners]);

  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);
  const [touchStartPos, setTouchStartPos] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const handlePrevSlide = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (activeBannersList.length <= 1) return;
    setCurrentHeroIdx((prev) => (prev === 0 ? activeBannersList.length - 1 : prev - 1));
  };

  const handleNextSlide = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (activeBannersList.length <= 1) return;
    setCurrentHeroIdx((prev) => (prev + 1) % activeBannersList.length);
  };

  const onTouchStartHandler = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setTouchStartPos(clientX);
    setIsSwiping(false);
  };

  const onTouchMoveHandler = (e) => {
    if (touchStartPos === null) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    if (Math.abs(clientX - touchStartPos) > 8) {
      setIsSwiping(true);
    }
  };

  const onTouchEndHandler = (e) => {
    if (touchStartPos === null) return;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = clientX - touchStartPos;
    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        handlePrevSlide();
      } else {
        handleNextSlide();
      }
    }
    setTimeout(() => {
      setTouchStartPos(null);
      setIsSwiping(false);
    }, 60);
  };

  useEffect(() => {
    if (activeBannersList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentHeroIdx((prev) => (prev + 1) % activeBannersList.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeBannersList, currentHeroIdx]);

  const isAnonymous = Boolean(
    !activeUser ||
    activeUser.isAnonymous ||
    (activeUser.isGuest && !activeUser.phone) ||
    (!activeUser.phone && !activeUser.guestId)
  );

  const isGuest = Boolean(
    activeUser?.isGuest ||
    activeUser?.id === 0 ||
    activeUser?.name === 'Guest User' ||
    isAnonymous
  );

  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => {
    if (isGuest) {
      setSelectedLocation('Select your location');
      return;
    }
    const saved =
      (activeUser?.saved_addresses || []).find((a) => a.isDefault)?.address ||
      activeUser?.address;
    const resolved = saved && saved.trim() ? saved.trim() : 'Select your location';
    setSelectedLocation(resolved);
  }, [activeUser?.address, activeUser?.saved_addresses, isGuest, activeUser?.id]);

  const activeHeroBanner = activeBannersList[currentHeroIdx % activeBannersList.length] || activeBannersList[0];

  const filteredSuggestions = searchQuery.trim()
    ? searchAllServices(searchQuery).slice(0, 8)
    : [];

  const handleNav = (path, paramObj) => {
    if (navigate) {
      navigate(path, paramObj);
    } else if (onNavigate) {
      onNavigate(path, paramObj);
    }
  };

  const selectLocation = (loc, extraCoords = {}) => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    const cleanAddr = String(loc || '').trim();
    if (!cleanAddr) return;
    setSelectedLocation(cleanAddr);
    if (updateProfile && activeUser && (activeUser.id != null || activeUser.phone)) {
      const updatedAddresses = upsertDefaultAddress(
        activeUser.saved_addresses || [],
        cleanAddr,
        {
          latitude: extraCoords.latitude ?? extraCoords.lat,
          longitude: extraCoords.longitude ?? extraCoords.lng,
        }
      );
      updateProfile({
        ...activeUser,
        address: cleanAddr,
        saved_addresses: updatedAddresses,
        ...(extraCoords.latitude != null || extraCoords.lat != null
          ? { latitude: extraCoords.latitude ?? extraCoords.lat }
          : {}),
        ...(extraCoords.longitude != null || extraCoords.lng != null
          ? { longitude: extraCoords.longitude ?? extraCoords.lng }
          : {}),
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      <View style={styles.headerRow}>
        <View style={styles.searchWrapper}>
          <View style={styles.searchBox}>
            <span style={styles.searchIconSvg}><SvgSearch /></span>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowSuggestions(text.trim().length > 0);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setShowSuggestions(true);
              }}
              placeholder="What do you need help with?"
              placeholderTextColor="#94a3b8"
            />
            {searchQuery.trim().length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                style={{ padding: 6, marginRight: 4 }}
              >
                <AppIcon name="x" size={14} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {showSuggestions && filteredSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {filteredSuggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                    const navPayload = {
                      state: {
                        preSelectedCategory: item.category_name,
                        preSelectedSubCategory: item.sub_category_name || item.name,
                        preSelectedService: item.name,
                        bookingMode: 'complaint',
                      },
                    };
                    if (navigate) navigate('/user/bookings/new', navPayload);
                    else if (onNavigate) onNavigate('/user/bookings/new', navPayload);
                  }}
                >
                  <View style={styles.suggestionItemPin}>
                    <AppIcon name="search" size={14} color="#64748b" />
                  </View>
                  <View style={{ flexDirection: 'column', flex: 1 }}>
                    <Text style={styles.suggestionItemText}>{item.name}</Text>
                    <Text style={styles.suggestionItemCat}>{item.category_name}</Text>
                  </View>
                  <Text style={styles.suggestionItemArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.heroCardContainer}>
        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => {
            if (!isSwiping) {
              handleNav(activeHeroBanner?.redirect_url || '/user/bookings/new', { state: {} });
            }
          }}
          activeOpacity={0.95}
        >
          {Platform.OS === 'web' ? (
            <div
              style={heroBannerWebCss.slidesWrapper}
              onTouchStart={onTouchStartHandler}
              onTouchMove={onTouchMoveHandler}
              onTouchEnd={onTouchEndHandler}
              onMouseDown={onTouchStartHandler}
              onMouseMove={onTouchMoveHandler}
              onMouseUp={onTouchEndHandler}
              onMouseLeave={() => {
                if (touchStartPos !== null) {
                  setTouchStartPos(null);
                  setIsSwiping(false);
                }
              }}
            >
              <div
                style={{
                  ...heroBannerWebCss.sliderTrack,
                  width: `${activeBannersList.length * 100}%`,
                  transform: `translateX(-${(currentHeroIdx % activeBannersList.length) * (100 / activeBannersList.length)}%)`,
                }}
              >
                {activeBannersList.map((banner, idx) => {
                  const bannerUri = resolveImageUri(banner?.image_url, SERVICE_IMAGES.homeHeroBanner);
                  return (
                    <div
                      key={banner.id || idx}
                      style={{
                        ...heroBannerWebCss.slideItem,
                        width: `${100 / activeBannersList.length}%`,
                      }}
                    >
                      <img
                        src={bannerUri}
                        alt={banner.title || 'Hero Banner'}
                        style={heroBannerWebCss.slideImage}
                        draggable={false}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <Image
              source={{ uri: resolveImageUri(activeHeroBanner?.image_url, SERVICE_IMAGES.homeHeroBanner) }}
              style={styles.heroBannerImage}
              resizeMode="fill"
            />
          )}
        </TouchableOpacity>

        {activeBannersList.length > 1 && (
          <View style={styles.heroDotsContainer}>
            {activeBannersList.map((_, idx) => {
              const isActive = idx === (currentHeroIdx % activeBannersList.length);
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    setCurrentHeroIdx(idx);
                  }}
                  style={[
                    styles.heroDot,
                    isActive ? styles.heroDotActive : styles.heroDotInactive,
                  ]}
                />
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.amcSection}>
        <View style={styles.amcHeaderBlock}>
          <View style={styles.kickerRow}>
            <View style={styles.kickerLine} />
            <Text style={styles.kickerText}>GET STARTED</Text>
          </View>
          <Text style={styles.amcSectionTitle}>How can we help?</Text>
          <Text style={styles.amcSectionSub}>Choose a service to get started</Text>
        </View>

        <View style={styles.amcStack}>
          {AMC_HOME_ACTIONS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.amcCardNew,
                {
                  backgroundImage: item.cardBg,
                  borderColor: item.borderColor,
                },
              ]}
              onPress={() => handleNav(item.route, { state: {} })}
              activeOpacity={0.88}
            >
              {/* Subtle background icon watermark */}
              <View style={styles.amcWatermarkWrap} pointerEvents="none">
                {item.watermark}
              </View>

              {/* Left Squircle Gradient Icon */}
              <View
                style={[
                  styles.amcIconBox,
                  {
                    backgroundImage: item.iconBg,
                    boxShadow: item.iconBoxShadow,
                  },
                ]}
              >
                {item.icon}
              </View>

              {/* Middle Title & Subtitle */}
              <View style={styles.amcCardTextWrap}>
                <View style={styles.amcTitleBadgeRow}>
                  <Text style={styles.amcCardHeading}>{item.title}</Text>
                  {item.badge ? (
                    <View style={styles.amcFreeBadgeBlue}>
                      <Text style={styles.amcFreeBadgeBlueText}>{item.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.amcCardDescription}>{item.subtitle}</Text>
              </View>

              {/* Right Circular Arrow Button */}
              <View style={styles.amcArrowCircle}>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.trustBanner}>
        <Text style={styles.trustTitle}>Trusted professionals for your home</Text>
        <View style={styles.trustRow}>
          {TRUST_FEATURES.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.trustItem}
              onPress={() => handleNav(item.route, { state: {} })}
              activeOpacity={0.75}
            >
              <View style={styles.trustIconWrap}>{item.icon}</View>
              <Text style={styles.trustLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Interactive Map API Picker Modal */}
      {showMapPicker && (
        <Modal visible={true} animationType="slide" transparent>
          <View style={styles.fullMapModalOverlay}>
            <View style={styles.fullMapContainer}>
              <View style={styles.mapModalHeader}>
                <Text style={styles.mapModalHeaderTitle}>Select Location on Map</Text>
                <TouchableOpacity style={styles.mapModalCloseBtn} onPress={() => setShowMapPicker(false)}>
                  <Text style={styles.mapModalCloseText}>✕ Close</Text>
                </TouchableOpacity>
              </View>
              <GoogleMapsLocationPicker
                initialAddress={selectedLocation}
                onClose={() => setShowMapPicker(false)}
                onSelectLocation={(loc) => {
                  const addr = loc?.address || loc?.formatted_address || '';
                  if (addr) {
                    selectLocation(addr, { lat: loc?.lat, lng: loc?.lng });
                  }
                  setShowMapPicker(false);
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Registration Required Modal for Guests */}
      <Modal
        visible={showGuestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGuestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.guestModalCard}>
            <TouchableOpacity
              style={styles.guestCloseBtn}
              onPress={() => setShowGuestModal(false)}
              accessibilityLabel="Close modal"
            >
              <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>

            <View style={styles.guestIconCircle}>
              <AppIcon name="lock" size={26} color="#B45309" strokeWidth={2.2} />
            </View>

            <Text style={styles.guestModalTitle}>
              {isAnonymous ? 'Register First' : 'Complete Your Profile First'}
            </Text>
            <Text style={styles.guestModalSub}>
              {isAnonymous
                ? 'Please register your account first to set your delivery address and book services.'
                : 'Please complete your profile to set and save your delivery address and book services.'}
            </Text>

            <TouchableOpacity
              style={styles.guestPrimaryBtn}
              onPress={() => {
                setShowGuestModal(false);
                handleNav('/user/register');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.guestPrimaryBtnText}>
                {isAnonymous ? 'Register First →' : 'Complete Your Profile →'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestOutlineBtn}
              onPress={() => {
                setShowGuestModal(false);
                handleNav('/user/login');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.guestOutlineBtnText}>Already have an account? Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', width: '100%' },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100, gap: 14, width: '100%', boxSizing: 'border-box' },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    gap: 10,
    zIndex: 1000,
  },
  headerLogoBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  headerProfileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#eff6ff',
  },
  headerProfileImg: {
    width: '100%',
    height: '100%',
  },

  heroCardContainer: {
    position: 'relative',
    width: '100%',
    marginVertical: 4,
  },
  heroCard: {
    width: '100%',
    height: 152,
    borderRadius: 14,
    overflow: 'hidden',
    alignSelf: 'center',
    position: 'relative',
  },
  heroBannerImage: {
    width: '100%',
    height: 152,
    display: 'block',
    ...(Platform.OS === 'web' ? { objectFit: 'fill', objectPosition: 'center' } : {}),
  },
  heroDotsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 20,
  },
  heroDot: {
    height: 6,
    borderRadius: 3,
  },
  heroDotActive: {
    width: 22,
    backgroundColor: '#ffffff',
  },
  heroDotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },

  amcSection: {
    width: '100%',
    gap: 9,
    marginTop: 2,
    marginBottom: 4,
  },
  amcHeaderBlock: {
    gap: 2,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 1,
  },
  kickerLine: {
    width: 14,
    height: 2,
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  kickerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.8,
  },
  amcSectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  amcSectionSub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  amcStack: {
    flexDirection: 'column',
    gap: 9,
    width: '100%',
  },
  amcCardNew: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
  },
  amcWatermarkWrap: {
    position: 'absolute',
    right: -8,
    top: -8,
    bottom: -8,
    justifyContent: 'center',
    alignItems: 'flex-end',
    opacity: 0.8,
    zIndex: 0,
  },
  amcIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
  },
  amcCardTextWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    zIndex: 1,
  },
  amcTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
  },
  amcCardHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    letterSpacing: -0.2,
  },
  amcFreeBadgeBlue: {
    backgroundColor: '#2563eb',
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  amcFreeBadgeBlueText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  amcCardDescription: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 15,
  },
  amcArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f7ff',
    borderWidth: 1,
    borderColor: '#e0effe',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
  },

  trustBanner: {
    width: '100%',
    backgroundColor: '#0f1f3d',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: 4,
    gap: 14,
  },
  trustTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
  },
  trustIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustLabel: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
    fontFamily: 'Inter, sans-serif',
  },

  searchWrapper: {
    position: 'relative',
    zIndex: 1000,
    flex: 1,
    minWidth: 0,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgb(208, 209, 210)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    height: 44,
  },
  searchIconSvg: { display: 'flex', alignItems: 'center', marginRight: 8, flexShrink: 0 },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0f172a',
    outlineStyle: 'none',
    fontFamily: 'Inter, sans-serif',
  },

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
  allServicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allServicesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002574',
    fontFamily: 'Inter, sans-serif',
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '90%',
    maxWidth: 320,
    gap: 12,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    boxSizing: 'border-box',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', letterSpacing: -0.5 },
  modalSub: { fontSize: 12.5, color: '#475569', marginTop: -4 },

  locList: { display: 'flex', flexDirection: 'column', gap: 6, marginVertical: 4 },
  locListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    gap: 10,
    cursor: 'pointer',
    position: 'relative',
    boxSizing: 'border-box',
  },
  locListItemActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
    borderWidth: 2,
  },
  pinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCircleActive: {
    backgroundColor: '#bfdbfe',
  },
  pinText: { fontSize: 12 },
  locListText: { fontSize: 13, color: '#334155', fontWeight: '600', fontFamily: 'Inter, sans-serif' },
  locListTextActive: { color: '#1e40af' },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
  },
  checkText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },

  customLocBox: { flexDirection: 'column', gap: 8, marginTop: 4, width: '100%', boxSizing: 'border-box' },
  customLocInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    outlineStyle: 'none',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
  },
  customLocBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
    boxSizing: 'border-box',
  },
  customLocBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600', fontFamily: 'Inter, sans-serif' },

  closeModalBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    marginTop: 2,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  closeModalBtnText: { color: '#475569', fontWeight: '600', fontSize: 13, fontFamily: 'Inter, sans-serif' },

  mapBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 8,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
  },
  mapBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
  },

  fullMapModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fullMapContainer: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  mapModalHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif',
  },
  mapModalCloseBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
  },
  mapModalCloseText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },

  suggestionsContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 6,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    zIndex: 9999,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  suggestionItemPin: {
    fontSize: 13,
    color: '#94a3b8',
  },
  suggestionItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif',
  },
  suggestionItemCat: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: 'Inter, sans-serif',
    marginTop: 1,
  },
  suggestionItemArrow: {
    fontSize: 16,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 99999,
  },
  guestModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: 14,
    position: 'relative',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
  },
  guestCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  guestIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  guestModalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter, sans-serif',
  },
  guestPrimaryBtn: {
    backgroundColor: '#0052E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  guestPrimaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13.5,
    fontFamily: 'Inter, sans-serif',
  },
  guestOutlineBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestOutlineBtnText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
  },
});

const heroBannerWebCss = {
  slidesWrapper: {
    position: 'relative',
    width: '100%',
    height: '152px',
    borderRadius: '14px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    cursor: 'grab',
    userSelect: 'none',
    touchAction: 'pan-y',
  },
  sliderTrack: {
    display: 'flex',
    flexDirection: 'row',
    height: '152px',
    transition: 'transform 500ms cubic-bezier(0.25, 1, 0.5, 1)',
    willChange: 'transform',
    userSelect: 'none',
  },
  slideItem: {
    height: '152px',
    flexShrink: 0,
    borderRadius: '14px',
    overflow: 'hidden',
    userSelect: 'none',
  },
  slideImage: {
    width: '100%',
    height: '152px',
    objectFit: 'fill',
    display: 'block',
    borderRadius: '14px',
    userSelect: 'none',
    pointerEvents: 'none',
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

function SvgSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

