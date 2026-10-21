import React, { useState, useEffect } from 'react';
import { AppIcon } from '../../components/AppIcons';
import { SERVICE_IMAGES } from '../../utils/bundledImages';
import { resolveImageUri } from '../../utils/imageUtils';

const banner1Uri = resolveImageUri(SERVICE_IMAGES.heroBanner1, '/assets/hero-banner-1.png');
const banner2Uri = resolveImageUri(SERVICE_IMAGES.heroBanner2, '/assets/hero-banner-2.png');
const banner3Uri = resolveImageUri(SERVICE_IMAGES.heroBanner3, '/assets/hero-banner-3.png');
const homeHeaderBgUri = resolveImageUri(SERVICE_IMAGES.homeHeaderBg, '/assets/home-header-bg.jpg');
const wordmarkUri = resolveImageUri(SERVICE_IMAGES.zevotaCareWordmark, '/assets/zevota-care-wordmark.png');

const PROMO_SLIDES = [
  { id: 1, image: banner1Uri, alt: 'Zevota Care Annual Maintenance Plans' },
  { id: 2, image: banner2Uri, alt: 'Specialist Home Maintenance & Repair' },
  { id: 3, image: banner3Uri, alt: 'Verified Home Technicians & AMC' },
];

const EXPLORE_SERVICES = [
  {
    id: 'elec',
    name: 'Electrician',
    category: 'Electrician',
    desc: 'Wiring, switches & appliances',
    icon: resolveImageUri(SERVICE_IMAGES.electrician, '/assets/services/catalog/electrician.png'),
    accent: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
  },
  {
    id: 'plumb',
    name: 'Plumbing',
    category: 'Plumber',
    desc: 'Pipes, taps & leak fixes',
    icon: resolveImageUri(SERVICE_IMAGES.plumber, '/assets/services/catalog/plumbing.png'),
    accent: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
  },
  {
    id: 'carp',
    name: 'Carpentry',
    category: 'Carpenter',
    desc: 'Furniture repair & fittings',
    icon: resolveImageUri(SERVICE_IMAGES.carpenter, '/assets/services/catalog/carpenter.png'),
    accent: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
  },
  {
    id: 'clean',
    name: 'Dry Cleaning',
    category: 'Dry Cleaning',
    desc: 'Sofa, carpet & upholstery',
    icon: resolveImageUri(SERVICE_IMAGES.dryCleaning, '/assets/services/catalog/dry-cleaning.png'),
    accent: 'linear-gradient(90deg, #10b981, #34d399)',
  },
  {
    id: 'pest',
    name: 'Pest Control',
    category: 'Pest Control',
    desc: 'Cockroach, termite & bedbugs',
    icon: resolveImageUri(SERVICE_IMAGES.pestControl, '/assets/services/catalog/pest-control.png'),
    accent: 'linear-gradient(90deg, #ef4444, #f87171)',
  },
];

/* ========================================================================= */
/* LUXURY 3D AMC VECTOR ICONS (Matches Mobile App Exactly)                   */
/* ========================================================================= */

function Luxury3DShieldIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="shieldRimGrad_desktop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="40%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="shieldFacetLeft_desktop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="shieldFacetRight_desktop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="60%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="shieldSheen_desktop" x1="0%" y1="0%" x2="70%" y2="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="shieldShadow_desktop" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="#0f172a" floodOpacity="0.35" />
        </filter>
      </defs>
      <g filter="url(#shieldShadow_desktop)">
        <path
          d="M16 2.5L6.5 6.8V14.8C6.5 21.2 10.6 27.2 16 29C21.4 27.2 25.5 21.2 25.5 14.8V6.8L16 2.5Z"
          fill="url(#shieldRimGrad_desktop)"
        />
        <path
          d="M16 4.2L8 7.8V14.8C8 20.3 11.4 25.4 16 27V4.2Z"
          fill="url(#shieldFacetLeft_desktop)"
        />
        <path
          d="M16 4.2L24 7.8V14.8C24 20.3 20.6 25.4 16 27V4.2Z"
          fill="url(#shieldFacetRight_desktop)"
        />
        <path
          d="M16 4.2L8 7.8V14.8C8 17.5 9 20.2 10.8 22.4L20 8.5L16 4.2Z"
          fill="url(#shieldSheen_desktop)"
        />
        <line x1="16" y1="4.2" x2="16" y2="27" stroke="#60a5fa" strokeWidth="0.8" opacity="0.6" />
        <path
          d="M11.5 15.2L14.6 18.3L20.8 11.8"
          stroke="#ffffff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function Luxury3DWrenchIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="wrenchLuxGrad_desktop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        stroke="url(#wrenchLuxGrad_desktop)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(249, 115, 22, 0.15)"
      />
    </svg>
  );
}

function Luxury3DMechanicIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="mechLuxGrad_desktop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path
        d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"
        stroke="url(#mechLuxGrad_desktop)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(37, 99, 235, 0.15)"
      />
      <path
        d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"
        stroke="url(#mechLuxGrad_desktop)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 15v-3a8 8 0 0 1 16 0v3"
        stroke="url(#mechLuxGrad_desktop)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(37, 99, 235, 0.12)"
      />
    </svg>
  );
}

const AMC_CARDS = [
  {
    key: 'plans',
    badge: 'EXCLUSIVE PASS',
    title: 'My AMC Plan',
    subtitle: 'Protect your home with premium annual coverage.',
    actionLabel: 'Explore Plans',
    route: '/user/plans',
    cardBg: 'linear-gradient(135deg, #ffffff 0%, #f8faff 45%, #eff6ff 100%)',
    borderColor: 'rgba(59, 130, 246, 0.28)',
    boxShadow: '0 8px 25px -4px rgba(37, 99, 235, 0.10), 0 2px 6px rgba(15, 23, 42, 0.04)',
    iconBg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    iconBorder: '1.5px solid rgba(59, 130, 246, 0.35)',
    titleColor: '#0f172a',
    subColor: '#475569',
    badgeBg: '#eff6ff',
    badgeBorder: '#bfdbfe',
    badgeColor: '#1d4ed8',
    pillBtnBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    pillBtnBorder: 'none',
    pillBtnColor: '#ffffff',
    pillArrowBg: 'rgba(255, 255, 255, 0.22)',
    pillArrowColor: '#ffffff',
    icon: <Luxury3DShieldIcon size={26} />,
  },
  {
    key: 'complaints',
    badge: 'PRIORITY',
    title: 'AMC Complaints',
    subtitle: 'Raise any appliance or home issue.',
    actionLabel: 'Raise Complaint',
    route: '/user/complains',
    cardBg: 'linear-gradient(145deg, #ffffff 0%, #fffdf9 45%, #fff7ed 100%)',
    borderColor: 'rgba(249, 115, 22, 0.24)',
    boxShadow: '0 8px 24px -4px rgba(234, 88, 12, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04)',
    iconBg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
    iconBorder: '1.5px solid rgba(249, 115, 22, 0.35)',
    titleColor: '#0f172a',
    subColor: '#64748b',
    badgeBg: '#fff7ed',
    badgeBorder: '#fed7aa',
    badgeColor: '#c2410c',
    pillBtnBg: '#ffffff',
    pillBtnBorder: '1.2px solid #fed7aa',
    pillBtnColor: '#ea580c',
    pillArrowBg: '#fff7ed',
    pillArrowColor: '#ea580c',
    icon: <Luxury3DWrenchIcon size={20} />,
  },
  {
    key: 'mechanic',
    badge: '₹0 FREE',
    title: 'My Mechanic',
    subtitle: 'Free on-site diagnosis & inspection.',
    actionLabel: 'Book Free',
    route: '/user/consultation',
    cardBg: 'linear-gradient(145deg, #ffffff 0%, #f8faff 45%, #eff6ff 100%)',
    borderColor: 'rgba(37, 99, 235, 0.24)',
    boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.08), 0 2px 6px rgba(15, 23, 42, 0.04)',
    iconBg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    iconBorder: '1.5px solid rgba(37, 99, 235, 0.35)',
    titleColor: '#0f172a',
    subColor: '#64748b',
    badgeBg: '#eff6ff',
    badgeBorder: '#bfdbfe',
    badgeColor: '#1d4ed8',
    pillBtnBg: '#ffffff',
    pillBtnBorder: '1.2px solid #bfdbfe',
    pillBtnColor: '#2563eb',
    pillArrowBg: '#eff6ff',
    pillArrowColor: '#2563eb',
    icon: <Luxury3DMechanicIcon size={20} />,
  },
];

/* Real SVG vector icons for Trust Pillars (Zero emojis) */
const IconShieldCheck = ({ size = 26, color = '#2563eb' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" strokeWidth="2.6" />
  </svg>
);

const IconReceiptPercent = ({ size = 26, color = '#059669' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
    <line x1="16" y1="8" x2="8" y2="16" />
    <circle cx="9" cy="9.5" r="1.5" fill={color} stroke="none" />
    <circle cx="15" cy="14.5" r="1.5" fill={color} stroke="none" />
  </svg>
);

const IconClockSpeed = ({ size = 26, color = '#4f46e5' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 15 15" strokeWidth="2.4" />
  </svg>
);

const IconBadgeGuarantee = ({ size = 26, color = '#d97706' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    <path d="m9 8 2 2 4-4" strokeWidth="2.4" />
  </svg>
);

const IconMiniCheck = ({ size = 11, color = '#2563eb' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TRUST_PILLARS = [
  {
    icon: (color) => <IconShieldCheck size={26} color={color} />,
    badgeText: 'SAFETY FIRST',
    title: 'Background-Checked',
    desc: 'Certified and identity-verified home technicians equipped with proper tools for safe, reliable service.',
    chipText: 'Verified Identity',
    accentColor: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  {
    icon: (color) => <IconReceiptPercent size={26} color={color} />,
    badgeText: 'HONEST RATES',
    title: 'Upfront Fixed Pricing',
    desc: 'Standardized rate cards with clear pricing quotes before work begins. Zero surprise or hidden fees.',
    chipText: 'Clear Rate Cards',
    accentColor: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  {
    icon: (color) => <IconClockSpeed size={26} color={color} />,
    badgeText: 'PROMPT SERVICE',
    title: 'Scheduled Doorstep Arrival',
    desc: 'Convenient appointment slots with live arrival updates and timely doorstep service by dedicated professionals.',
    chipText: 'Scheduled Slots',
    accentColor: '#4f46e5',
    bgColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  {
    icon: (color) => <IconBadgeGuarantee size={26} color={color} />,
    badgeText: 'ASSURANCE',
    title: 'Post-Service Warranty',
    desc: 'Every completed repair is covered by our service warranty with free revisit and rework support if unsatisfied.',
    chipText: 'Service Warranty',
    accentColor: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
  },
];

export default function HomeDesktopWebView({
  searchQuery,
  setSearchQuery,
  filteredSuggestions,
  placeholderIdx,
  placeholders,
  onSelectSuggestion,
  onSelectCategory,
  onNavigate,
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play promo banners with pause on hover
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Smooth scroll to Explore Services section if requested via hash or categories route
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (window.location.hash === '#explore-services-section' ||
        window.location.pathname.includes('/categories'))
    ) {
      setTimeout(() => {
        const el = document.getElementById('explore-services-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, []);

  return (
    <div className="home-desktop-web-wrap" style={wrapperStyle}>
      {/* 1. HERO SECTION (Urban Company 2-Column Gateway) */}
      <section style={heroCardStyle} aria-label="Hero Gateway">
        <div style={heroGridStyle}>
          {/* Left Column: Headlines, Search & CTAs */}
          <div style={heroLeftStyle}>
            <div style={eyebrowStyle}>
              <span style={eyebrowDotStyle} />
              <span>YOUR HOME, OUR PRIORITY</span>
            </div>

            <h1 style={heroHeadlineStyle}>
              Expert care for every <span style={{ color: '#0878f8' }}>corner of your home.</span>
            </h1>

            <p style={heroSubtextStyle}>
              Book trusted professionals for appliance repairs, home maintenance,
              and comprehensive annual coverage — all in one place.
            </p>

            {/* Live Search Input with Animated Placeholder Ticker (Smooth like in the app) */}
            <div style={searchBoxWrapperStyle}>
              <div className="zc-hero-search-box" style={searchBoxInnerStyle}>
                <AppIcon name="search" size={18} color="#0878f8" strokeWidth={2.4} />

                {!searchQuery && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '48px',
                      right: '48px',
                      top: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden',
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}
                  >
                    <span
                      key={placeholderIdx}
                      className="search-ticker-item"
                      style={{
                        fontSize: '14.5px',
                        fontWeight: 500,
                        color: '#64748b',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        display: 'block',
                      }}
                    >
                      {placeholders[placeholderIdx] || 'Search electrician, plumbing, carpenter...'}
                    </span>
                  </div>
                )}

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder=""
                  style={searchInputStyle}
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={clearBtnStyle}
                  >
                    <AppIcon name="x" size={14} color="#94a3b8" />
                  </button>
                ) : null}
              </div>

              {/* Live Search Suggestions Dropdown */}
              {searchQuery && filteredSuggestions?.length > 0 && (
                <div style={suggestionsDropdownStyle}>
                  {filteredSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      style={suggestionRowStyle}
                      onClick={() => onSelectSuggestion(item)}
                    >
                      <AppIcon name="search" size={14} color="#64748b" />
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div style={ctaButtonsRowStyle}>
              <button
                type="button"
                className="zc-desktop-btn-primary"
                style={primaryCtaBtnStyle}
                onClick={() => onNavigate('/user/bookings/new')}
              >
                <span>Book a Service</span>
                <span style={{ fontSize: '15px' }}>→</span>
              </button>
              <button
                type="button"
                className="zc-desktop-btn-secondary"
                style={secondaryCtaBtnStyle}
                onClick={() => onNavigate('/user/plans')}
              >
                <span>Explore AMC Plans</span>
              </button>
            </div>

            {/* Micro Trust Bullets */}
            <div style={trustBulletsRowStyle}>
              <span style={trustPillStyle}>
                <AppIcon name="check" size={12} color="#059669" strokeWidth={3} />
                <span>Verified Professionals</span>
              </span>
              <span style={trustPillStyle}>
                <AppIcon name="check" size={12} color="#059669" strokeWidth={3} />
                <span>Transparent Pricing</span>
              </span>
              <span style={trustPillStyle}>
                <AppIcon name="check" size={12} color="#059669" strokeWidth={3} />
                <span>Fast Support</span>
              </span>
            </div>
          </div>

          {/* Right Column: Luxury Living Room Hero Graphic (Matches Brand App Identity) */}
          <div style={heroRightStyle}>
            <div style={heroArtCardStyle}>
              <img
                src={homeHeaderBgUri || '/assets/home-header-bg.jpg'}
                alt="Zevota Care - Your home, our priority"
                style={heroArtImgStyle}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/home-header-bg.jpg';
                }}
              />
              <div style={heroArtOverlayStyle}>
                <div style={heroArtWordmarkWrapStyle}>
                  <img
                    src={wordmarkUri || '/assets/zevota-care-wordmark.png'}
                    alt="Zevota Care"
                    style={{ height: '21px', objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling) {
                        e.currentTarget.nextSibling.style.display = 'block';
                      }
                    }}
                  />
                  <span style={{ display: 'none', color: '#ffffff', fontWeight: 900, fontSize: '15px', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.5px' }}>
                    ZEVOTA CARE
                  </span>
                </div>
                <div style={heroArtTitleStyle}>
                  Your home,<br />
                  <span style={{ color: '#ffffff' }}>our </span>
                  <span style={{ color: '#fbbf24', textShadow: '0 2px 10px rgba(251, 191, 36, 0.45)' }}>priority.</span>
                </div>
                <div style={heroArtSubStyle}>
                  Trusted home services & AMC for a worry-free tomorrow.
                </div>
              </div>
              <div className="zc-floating-badge" style={heroFloatingBadgeStyle}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #dbeafe' }}>
                  <AppIcon name="check" size={16} color="#0878f8" strokeWidth={3} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>Verified Experts</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Background Checked</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROMOTIONAL BANNER SLIDER (2:1 Ratio, Controlled Height, No Cropping) */}
      <section
        style={promoSectionStyle}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        aria-label="Promotional Offers"
      >
        <div style={promoSliderWrapStyle}>
          <img
            src={PROMO_SLIDES[activeSlide]?.image || `/assets/hero-banner-${activeSlide + 1}.png`}
            alt={PROMO_SLIDES[activeSlide]?.alt || 'Promotional Banner'}
            style={promoImgStyle}
            onClick={() => onNavigate('/user/plans')}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `/assets/hero-banner-${activeSlide + 1}.png`;
            }}
          />

          {/* Left Arrow */}
          <button
            type="button"
            className="zc-slider-arrow"
            style={arrowBtnLeftStyle}
            onClick={() => setActiveSlide((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length)}
            aria-label="Previous slide"
          >
            ‹
          </button>

          {/* Right Arrow */}
          <button
            type="button"
            className="zc-slider-arrow"
            style={arrowBtnRightStyle}
            onClick={() => setActiveSlide((prev) => (prev + 1) % PROMO_SLIDES.length)}
            aria-label="Next slide"
          >
            ›
          </button>

          {/* Pagination Indicators */}
          <div style={dotsWrapStyle}>
            {PROMO_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                style={idx === activeSlide ? dotActiveStyle : dotStyle}
                onClick={() => setActiveSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3. EXPLORE HOME SERVICES (5-Column Grid) */}
      <section id="explore-services-section" style={sectionWrapStyle} aria-label="Explore Home Services">
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Explore Home Services</h2>
            <p style={sectionSubtitleStyle}>Professional help for repairs and maintenance.</p>
          </div>
          <button
            type="button"
            className="zc-desktop-btn-secondary"
            style={viewAllPillBtnStyle}
            onClick={() => onNavigate('/user/bookings/new')}
          >
            <span>View All</span>
            <span style={{ fontSize: '14px' }}>→</span>
          </button>
        </div>

        <div style={servicesGridStyle}>
          {EXPLORE_SERVICES.map((srv) => (
            <div
              key={srv.id}
              className="zc-desktop-service-card"
              style={serviceCardStyle}
              onClick={() => onSelectCategory(srv.category)}
              role="button"
              tabIndex={0}
              title={`Explore ${srv.name} services`}
            >
              {/* Colored accent top bar */}
              <div style={{ ...serviceAccentBarStyle, background: srv.accent }} />
              <div className="zc-service-icon-squircle" style={serviceIconSquircleStyle}>
                <img
                  src={srv.icon}
                  alt={srv.name}
                  style={serviceIconImgStyle}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    const catMap = {
                      elec: 'electrician',
                      plumb: 'plumbing',
                      carp: 'carpenter',
                      clean: 'dry-cleaning',
                      pest: 'pest-control',
                    };
                    e.currentTarget.src = `/assets/services/catalog/${catMap[srv.id] || 'electrician'}.png`;
                  }}
                />
              </div>
              <span style={serviceNameStyle}>{srv.name}</span>
              <span style={serviceDescStyle}>{srv.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. COMPLETE CARE FOR YOUR HOME (3 Symmetrical AMC Cards) */}
      <section style={sectionWrapStyle} aria-label="Complete Care for Your Home">
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Complete Care for Your Home</h2>
            <p style={sectionSubtitleStyle}>Maintenance support designed around your home.</p>
          </div>
          <button
            type="button"
            className="zc-desktop-btn-secondary"
            style={viewAllPillBtnStyle}
            onClick={() => onNavigate('/user/plans')}
          >
            <span>Explore Plans</span>
            <span style={{ fontSize: '14px' }}>→</span>
          </button>
        </div>

        <div style={amcGridStyle}>
          {AMC_CARDS.map((card) => (
            <div
              key={card.key}
              className="zc-desktop-amc-card"
              style={{
                background: card.cardBg,
                borderColor: card.borderColor,
                boxShadow: card.boxShadow,
                borderRadius: '22px',
                borderWidth: '1.5px',
                borderStyle: 'solid',
                padding: '24px 22px 20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '235px',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
              onClick={() => onNavigate(card.route)}
              role="button"
              tabIndex={0}
            >
              {/* Top Row: Circular Icon + Symmetrical Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
                <div
                  style={{
                    background: card.iconBg,
                    border: card.iconBorder,
                    width: '42px',
                    height: '42px',
                    borderRadius: '21px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  }}
                >
                  {card.icon}
                </div>
                <div
                  style={{
                    backgroundColor: card.badgeBg,
                    border: `1px solid ${card.badgeBorder}`,
                    borderRadius: '999px',
                    padding: '3px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      color: card.badgeColor,
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.4px',
                      fontFamily: "'Outfit', sans-serif",
                    }}
                  >
                    {card.badge}
                  </span>
                </div>
              </div>

              {/* Middle: Title & Subtitle */}
              <div style={{ margin: '14px 0 18px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: card.titleColor,
                    margin: 0,
                    fontFamily: "'Outfit', sans-serif",
                    letterSpacing: '-0.2px',
                    lineHeight: 1.25,
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontSize: '12.5px',
                    color: card.subColor,
                    lineHeight: 1.5,
                    margin: 0,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {card.subtitle}
                </p>
              </div>

              {/* Bottom: Unified Pill Action Button (Matches App Exactly) */}
              <div
                style={{
                  background: card.pillBtnBg,
                  border: card.pillBtnBorder,
                  borderRadius: '999px',
                  height: '38px',
                  paddingLeft: '14px',
                  paddingRight: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  boxSizing: 'border-box',
                  boxShadow: card.key === 'plans' ? '0 4px 12px rgba(37, 99, 235, 0.22)' : '0 2px 6px rgba(15, 23, 42, 0.04)',
                }}
              >
                <span
                  style={{
                    color: card.pillBtnColor,
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    whiteSpace: 'nowrap',
                  }}
                >
                  {card.actionLabel}
                </span>
                <div
                  style={{
                    backgroundColor: card.pillArrowBg,
                    width: '24px',
                    height: '24px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginLeft: '8px',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={card.pillArrowColor} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ELEVATED TRUST PILLARS ("Why Choose Zevota Care?") */}
      <section style={trustSectionWrapStyle} aria-label="Why Choose Zevota Care">
        <div style={trustCardStyle}>
          <div style={trustHeaderStyle}>
            <div style={trustBadgeHeaderStyle}>
              <span className="zc-eyebrow-pulse-dot" style={eyebrowDotStyle} />
              <span>THE ZEVOTA CARE PROMISE</span>
            </div>
            <h3 style={trustHeadingStyle}>Why Choose Zevota Care?</h3>
            <p style={trustSubheadingStyle}>Reliable home maintenance engineered for safety, speed, and complete peace of mind.</p>
          </div>

          <div style={trustGridStyle}>
            {TRUST_PILLARS.map((pillar) => (
              <div key={pillar.title} className="zc-desktop-trust-card" style={trustColStyle}>
                <div
                  className="zc-trust-icon-box"
                  style={{
                    ...trustIconBoxStyle,
                    backgroundColor: pillar.bgColor,
                    borderColor: pillar.borderColor,
                  }}
                >
                  {pillar.icon(pillar.accentColor)}
                </div>

                <div
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: pillar.accentColor,
                    backgroundColor: pillar.bgColor,
                    border: `1px solid ${pillar.borderColor}`,
                    borderRadius: '20px',
                    padding: '3px 10px',
                    letterSpacing: '0.6px',
                    fontFamily: "'Outfit', sans-serif",
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                  }}
                >
                  {pillar.badgeText}
                </div>

                <h4 style={trustPillarTitleStyle}>{pillar.title}</h4>
                <p style={trustPillarDescStyle}>{pillar.desc}</p>

                <div className="zc-trust-chip" style={trustChipStyle}>
                  <IconMiniCheck size={11} color={pillar.accentColor} />
                  <span>{pillar.chipText}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   STYLES: Urban Company Desktop Web View (Luxury Shadows & App Fonts)
   ============================================================ */
const wrapperStyle = {
  width: '100%',
  paddingBottom: '32px',
  fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
};

const heroCardStyle = {
  width: '100%',
  background: 'radial-gradient(ellipse at 85% 15%, rgba(8, 120, 248, 0.12), transparent 55%), radial-gradient(ellipse at 15% 85%, rgba(8, 120, 248, 0.05), transparent 50%), linear-gradient(135deg, #ffffff 0%, #f8faff 50%, #eff6ff 100%)',
  border: '1.5px solid rgba(191, 219, 254, 0.75)',
  borderRadius: '24px',
  padding: '42px 46px',
  boxShadow: '0 20px 48px -12px rgba(8, 120, 248, 0.12), 0 4px 16px rgba(15, 23, 42, 0.04)',
  marginTop: '16px',
  marginBottom: '34px',
  boxSizing: 'border-box',
};

const heroGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1.2fr 0.8fr',
  gap: '36px',
  alignItems: 'center',
};

const heroLeftStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const eyebrowStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '20px',
  padding: '4px 12px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#0878f8',
  letterSpacing: '0.6px',
  width: 'fit-content',
  fontFamily: "'Outfit', sans-serif",
};

const eyebrowDotStyle = {
  width: '6px',
  height: '6px',
  borderRadius: '3px',
  backgroundColor: '#0878f8',
};

const heroHeadlineStyle = {
  fontSize: '44px',
  fontWeight: 900,
  color: '#0f172a',
  lineHeight: 1.14,
  margin: 0,
  letterSpacing: '-0.8px',
  fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  textShadow: '0 2px 8px rgba(15,23,42,0.04)',
};

const heroSubtextStyle = {
  fontSize: '15px',
  color: '#475569',
  lineHeight: 1.55,
  margin: 0,
  maxWidth: '520px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const searchBoxWrapperStyle = {
  position: 'relative',
  width: '100%',
  maxWidth: '520px',
  marginTop: '4px',
};

const searchBoxInnerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  backgroundColor: '#ffffff',
  border: '1.5px solid #bfdbfe',
  borderRadius: '14px',
  padding: '11px 18px',
  boxShadow: '0 8px 24px -4px rgba(8, 120, 248, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04)',
  position: 'relative',
  overflow: 'hidden',
};

const searchInputStyle = {
  border: 'none',
  outline: 'none',
  fontSize: '14.5px',
  color: '#0f172a',
  flex: 1,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontWeight: 500,
  backgroundColor: 'transparent',
  position: 'relative',
  zIndex: 3,
};

const clearBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  zIndex: 4,
};

const suggestionsDropdownStyle = {
  position: 'absolute',
  top: '52px',
  left: 0,
  right: 0,
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  border: '1px solid #bfdbfe',
  boxShadow: '0 14px 32px rgba(15, 23, 42, 0.12)',
  zIndex: 100,
  overflow: 'hidden',
};

const suggestionRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '11px 16px',
  width: '100%',
  border: 'none',
  background: 'none',
  fontSize: '13.5px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  color: '#1e293b',
  cursor: 'pointer',
  textAlign: 'left',
};

const ctaButtonsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginTop: '6px',
};

const primaryCtaBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  backgroundColor: '#0878f8',
  color: '#ffffff',
  border: 'none',
  borderRadius: '14px',
  padding: '14px 32px',
  fontSize: '15px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(8, 120, 248, 0.35)',
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '0.2px',
};

const secondaryCtaBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#ffffff',
  color: '#0878f8',
  border: '1.5px dashed #93c5fd',
  borderRadius: '14px',
  padding: '13px 28px',
  fontSize: '15px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '0.2px',
};

const trustBulletsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginTop: '10px',
  flexWrap: 'wrap',
};

const trustPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#065f46',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '20px',
  padding: '5px 14px',
};

const heroRightStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const heroArtCardStyle = {
  position: 'relative',
  width: '100%',
  maxWidth: '440px',
  height: '300px',
  borderRadius: '22px',
  overflow: 'hidden',
  boxShadow: '0 24px 56px -10px rgba(3, 13, 58, 0.38), 0 8px 22px rgba(8, 120, 248, 0.18)',
  border: '2px solid rgba(191, 219, 254, 0.85)',
  backgroundColor: '#03102e',
};

const heroArtImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center right',
  display: 'block',
};

const heroArtOverlayStyle = {
  position: 'absolute',
  inset: 0,
  padding: '24px 22px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  background: 'linear-gradient(90deg, rgba(3, 16, 46, 0.94) 0%, rgba(3, 16, 46, 0.76) 48%, rgba(3, 16, 46, 0.12) 100%)',
  pointerEvents: 'none',
  boxSizing: 'border-box',
};

const heroArtWordmarkWrapStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '14px',
};

const heroArtTitleStyle = {
  fontSize: '22px',
  fontWeight: 900,
  color: '#ffffff',
  lineHeight: 1.22,
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '-0.3px',
  maxWidth: '220px',
};

const heroArtSubStyle = {
  fontSize: '11.5px',
  fontWeight: 500,
  color: 'rgba(255, 255, 255, 0.85)',
  lineHeight: 1.45,
  marginTop: '8px',
  maxWidth: '200px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const heroFloatingBadgeStyle = {
  position: 'absolute',
  bottom: '18px',
  right: '18px',
  backgroundColor: 'rgba(255, 255, 255, 0.97)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRadius: '14px',
  padding: '10px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  boxShadow: '0 10px 28px rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.85)',
};

/* Promotional Banner */
const promoSectionStyle = {
  width: '100%',
  marginBottom: '28px',
};

const promoSliderWrapStyle = {
  position: 'relative',
  width: '100%',
  height: '270px',
  maxHeight: '285px',
  borderRadius: '22px',
  overflow: 'hidden',
  backgroundColor: '#091e48',
  boxShadow: '0 20px 48px -12px rgba(9, 30, 72, 0.25), 0 4px 16px rgba(15, 23, 42, 0.08)',
  border: '1.5px solid rgba(191, 219, 254, 0.6)',
};

const promoImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  cursor: 'pointer',
  display: 'block',
};

const arrowBtnStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '42px',
  height: '42px',
  borderRadius: '21px',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: 'none',
  fontSize: '22px',
  fontWeight: 700,
  color: '#0f172a',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.22)',
  zIndex: 10,
};

const arrowBtnLeftStyle = {
  ...arrowBtnStyle,
  left: '16px',
};

const arrowBtnRightStyle = {
  ...arrowBtnStyle,
  right: '16px',
};

const dotsWrapStyle = {
  position: 'absolute',
  bottom: '14px',
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: 'rgba(3, 16, 46, 0.45)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  padding: '5px 12px',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  zIndex: 10,
};

const dotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(255, 255, 255, 0.45)',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  transition: 'all 0.2s ease',
};

const dotActiveStyle = {
  width: '28px',
  height: '8px',
  borderRadius: '4px',
  backgroundColor: '#38bdf8',
  boxShadow: '0 0 10px rgba(56, 189, 248, 0.6)',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  transition: 'all 0.2s ease',
};

/* General Section Wrappers */
const sectionWrapStyle = {
  width: '100%',
  marginBottom: '36px',
};

const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  marginBottom: '18px',
};

const sectionTitleStyle = {
  fontSize: '25px',
  fontWeight: 900,
  color: '#0f172a',
  margin: '0 0 5px 0',
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '-0.4px',
};

const sectionSubtitleStyle = {
  fontSize: '14.5px',
  color: '#64748b',
  margin: 0,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  lineHeight: 1.45,
};

const viewAllBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  background: 'none',
  border: 'none',
  fontSize: '13.5px',
  fontWeight: 700,
  color: '#0878f8',
  cursor: 'pointer',
  fontFamily: "'Outfit', sans-serif",
};

const viewAllPillBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#ffffff',
  color: '#0878f8',
  border: '1.5px solid #bfdbfe',
  borderRadius: '10px',
  padding: '8px 18px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Outfit', sans-serif",
};

/* Explore Services 5-Column Grid */
const servicesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: '20px',
};

const serviceCardStyle = {
  backgroundColor: '#ffffff',
  border: '1.5px solid #e2e8f0',
  borderRadius: '20px',
  padding: '0 16px 22px 16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  textAlign: 'center',
  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
  overflow: 'hidden',
  position: 'relative',
};

const serviceAccentBarStyle = {
  width: '100%',
  height: '4px',
  borderRadius: '0 0 4px 4px',
  marginBottom: '16px',
  flexShrink: 0,
};

const serviceIconSquircleStyle = {
  width: '76px',
  height: '76px',
  borderRadius: '20px',
  backgroundColor: '#eff6ff',
  border: '1.5px solid #dbeafe',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '6px',
};

const serviceIconImgStyle = {
  width: '48px',
  height: '48px',
  objectFit: 'contain',
};

const serviceNameStyle = {
  fontSize: '15px',
  fontWeight: 800,
  color: '#0f172a',
  lineHeight: 1.25,
  fontFamily: "'Outfit', sans-serif",
};

const serviceDescStyle = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#475569',
  lineHeight: 1.35,
  margin: 0,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

/* Complete Care AMC 3-Grid */
const amcGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '22px',
};

const amcCardStyle = {
  backgroundColor: '#ffffff',
  border: '1.5px solid #e2e8f0',
  borderRadius: '22px',
  padding: '0',
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.07), 0 2px 6px rgba(8, 120, 248, 0.04)',
  overflow: 'hidden',
  minHeight: '270px',
};

const amcAccentBarStyle = {
  width: '100%',
  height: '5px',
  flexShrink: 0,
};

const amcCardContentStyle = {
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  flex: 1,
  justifyContent: 'space-between',
};

const amcCardTopStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const amcIconBoxStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '18px',
  overflow: 'hidden',
  backgroundColor: '#f1f5f9',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
};

const amcIconImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const amcBadgeStyle = {
  fontSize: '11.5px',
  fontWeight: 700,
  padding: '5px 12px',
  borderRadius: '20px',
  border: '1px solid transparent',
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '0.2px',
};

const amcCardBodyStyle = {
  flex: 1,
};

const amcCardTitleStyle = {
  fontSize: '19px',
  fontWeight: 800,
  color: '#0f172a',
  margin: '0 0 6px 0',
  fontFamily: "'Outfit', sans-serif",
};

const amcCardDescStyle = {
  fontSize: '13.5px',
  color: '#475569',
  lineHeight: 1.55,
  margin: 0,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const amcCardBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#0878f8',
  color: '#ffffff',
  borderRadius: '12px',
  padding: '12px 20px',
  fontSize: '14px',
  fontWeight: 700,
  fontFamily: "'Outfit', sans-serif",
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(8, 120, 248, 0.3)',
};

const amcArrowCircleStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.25)',
  width: '22px',
  height: '22px',
  borderRadius: '11px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
};

/* Trust Bar */
const trustSectionWrapStyle = {
  width: '100%',
  marginBottom: '32px',
};

const trustCardStyle = {
  backgroundColor: '#ffffff',
  background: 'linear-gradient(135deg, #f8faff 0%, #eff6ff 50%, #ffffff 100%)',
  border: '1.5px solid rgba(191, 219, 254, 0.75)',
  borderRadius: '24px',
  padding: '36px 36px 32px 36px',
  boxShadow: '0 16px 36px -10px rgba(8, 120, 248, 0.1), 0 4px 12px rgba(15, 23, 42, 0.03)',
  boxSizing: 'border-box',
};

const trustHeaderStyle = {
  textAlign: 'center',
  marginBottom: '26px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const trustBadgeHeaderStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  backgroundColor: '#ffffff',
  border: '1px solid #bfdbfe',
  borderRadius: '20px',
  padding: '4px 14px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#0878f8',
  letterSpacing: '0.6px',
  fontFamily: "'Outfit', sans-serif",
  marginBottom: '10px',
};

const trustHeadingStyle = {
  fontSize: '24px',
  fontWeight: 900,
  color: '#0f172a',
  margin: '0 0 6px 0',
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '-0.3px',
};

const trustSubheadingStyle = {
  fontSize: '14px',
  color: '#64748b',
  margin: 0,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  maxWidth: '560px',
};

const trustGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '18px',
};

const trustColStyle = {
  backgroundColor: '#ffffff',
  border: '1.5px solid #e2e8f0',
  borderRadius: '22px',
  padding: '28px 20px 22px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
  cursor: 'default',
};

const trustIconBoxStyle = {
  width: '60px',
  height: '60px',
  borderRadius: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '14px',
  flexShrink: 0,
  borderWidth: '1.5px',
  borderStyle: 'solid',
};

const trustPillarTitleStyle = {
  fontSize: '16.5px',
  fontWeight: 800,
  color: '#0f172a',
  margin: '0 0 8px 0',
  fontFamily: "'Outfit', sans-serif",
  lineHeight: 1.25,
  minHeight: '42px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const trustPillarDescStyle = {
  fontSize: '12.5px',
  color: '#64748b',
  lineHeight: 1.5,
  margin: '0 0 16px 0',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  flex: 1,
};

const trustChipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '4px 10px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#334155',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  marginTop: 'auto',
};
