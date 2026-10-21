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

const AMC_CARDS = [
  {
    key: 'plan',
    title: 'My AMC Plan',
    subtitle: 'Explore maintenance plans for your home and eligible appliances.',
    actionLabel: 'Explore Plans',
    route: '/user/plans',
    badge: 'Protection',
    iconImage: resolveImageUri(SERVICE_IMAGES.amcShield3d, '/assets/amc-shield-3d.jpg'),
    borderColor: '#bfdbfe',
    badgeBg: '#eff6ff',
    badgeColor: '#1d4ed8',
    accentGradient: 'linear-gradient(90deg, #2563eb, #38bdf8)',
    iconBg: '#eff6ff',
  },
  {
    key: 'complaint',
    title: 'AMC Complaints',
    subtitle: 'Raise a complaint and manage your existing maintenance requests.',
    actionLabel: 'Raise a Complaint',
    route: '/user/complains',
    badge: 'Priority Support',
    iconImage: resolveImageUri(SERVICE_IMAGES.amcWrench3d, '/assets/amc-wrench-3d.jpg'),
    borderColor: '#fed7aa',
    badgeBg: '#fff7ed',
    badgeColor: '#c2410c',
    accentGradient: 'linear-gradient(90deg, #f59e0b, #f97316)',
    iconBg: '#fff7ed',
  },
  {
    key: 'mechanic',
    title: 'My Mechanic',
    subtitle: 'Access the technician or inspection services available to your account.',
    actionLabel: 'Book a Visit',
    route: '/user/consultation',
    badge: 'Dedicated Visit',
    iconImage: resolveImageUri(SERVICE_IMAGES.amcMechanic3d, '/assets/amc-mechanic-3d.jpg'),
    borderColor: '#bbf7d0',
    badgeBg: '#f0fdf4',
    badgeColor: '#15803d',
    accentGradient: 'linear-gradient(90deg, #10b981, #059669)',
    iconBg: '#f0fdf4',
  },
];

const TRUST_PILLARS = [
  {
    iconName: 'check',
    stat: '1,000+',
    statLabel: 'Verified Pros',
    title: 'Background-Checked',
    desc: 'Certified and identity-verified home technicians for safe service.',
    iconBg: '#eff6ff',
    iconBorder: '#bfdbfe',
    iconColor: '#0878f8',
  },
  {
    iconName: 'star',
    stat: '₹0 Hidden',
    statLabel: 'Transparent Rates',
    title: 'Upfront Pricing',
    desc: 'Clear rate cards with fixed pricing and zero surprise charges.',
    iconBg: '#fff7ed',
    iconBorder: '#fed7aa',
    iconColor: '#f97316',
  },
  {
    iconName: 'lock',
    stat: '256-Bit',
    statLabel: 'Bank Grade',
    title: 'Secure Booking',
    desc: 'Encrypted transactions with easy, hassle-free rescheduling.',
    iconBg: '#f0fdf4',
    iconBorder: '#bbf7d0',
    iconColor: '#10b981',
  },
  {
    iconName: 'clock',
    stat: '< 2 Hrs',
    statLabel: 'Quick Response',
    title: 'Dedicated Support',
    desc: 'Fast resolution with comprehensive AMC service warranty.',
    iconBg: '#f5f3ff',
    iconBorder: '#ddd6fe',
    iconColor: '#8b5cf6',
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

      {/* 3. EXPLORE HOME SERVICES (8-Column Balanced Grid) */}
      <section style={sectionWrapStyle} aria-label="Explore Home Services">
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Explore Home Services</h2>
            <p style={sectionSubtitleStyle}>Professional help for repairs and maintenance.</p>
          </div>
          <button
            type="button"
            className="zc-desktop-btn-secondary"
            style={viewAllPillBtnStyle}
            onClick={() => onNavigate('/user/categories')}
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
              style={{ ...amcCardStyle, borderColor: card.borderColor }}
              onClick={() => onNavigate(card.route)}
              role="button"
              tabIndex={0}
            >
              {/* Colored top accent line */}
              <div style={{ ...amcAccentBarStyle, background: card.accentGradient }} />

              <div style={amcCardContentStyle}>
                <div style={amcCardTopStyle}>
                  <div style={{ ...amcIconBoxStyle, backgroundColor: card.iconBg, borderColor: card.borderColor }}>
                    <img
                      src={card.iconImage}
                      alt={card.title}
                      className="zc-amc-icon-art"
                      style={amcIconImgStyle}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/hero-banner-1.png';
                      }}
                    />
                  </div>
                  <span style={{ ...amcBadgeStyle, backgroundColor: card.badgeBg, color: card.badgeColor, borderColor: card.borderColor }}>
                    {card.badge}
                  </span>
                </div>

                <div style={amcCardBodyStyle}>
                  <h3 style={amcCardTitleStyle}>{card.title}</h3>
                  <p style={amcCardDescStyle}>{card.subtitle}</p>
                </div>

                <div className="zc-desktop-btn-primary" style={amcCardBtnStyle}>
                  <span>{card.actionLabel}</span>
                  <span style={amcArrowCircleStyle}>›</span>
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
              <span style={eyebrowDotStyle} />
              <span>THE ZEVOTA CARE PROMISE</span>
            </div>
            <h3 style={trustHeadingStyle}>Why Choose Zevota Care?</h3>
            <p style={trustSubheadingStyle}>Premium home maintenance engineered for safety, speed, and complete peace of mind.</p>
          </div>

          <div style={trustGridStyle}>
            {TRUST_PILLARS.map((pillar) => (
              <div key={pillar.title} className="zc-desktop-trust-card" style={trustColStyle}>
                <div style={{ ...trustIconBoxStyle, backgroundColor: pillar.iconBg, borderColor: pillar.iconBorder }}>
                  <AppIcon name={pillar.iconName} size={22} color={pillar.iconColor} strokeWidth={2.4} />
                </div>
                <div style={trustStatRowStyle}>
                  <span style={trustStatValueStyle}>{pillar.stat}</span>
                  <span style={trustStatLabelStyle}>{pillar.statLabel}</span>
                </div>
                <h4 style={trustPillarTitleStyle}>{pillar.title}</h4>
                <p style={trustPillarDescStyle}>{pillar.desc}</p>
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
  borderRadius: '20px',
  padding: '24px 18px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
};

const trustIconBoxStyle = {
  width: '56px',
  height: '56px',
  borderRadius: '16px',
  border: '1.5px solid #dbeafe',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '10px',
  flexShrink: 0,
};

const trustStatRowStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1px',
  marginBottom: '6px',
};

const trustStatValueStyle = {
  fontSize: '20px',
  fontWeight: 900,
  color: '#0f172a',
  fontFamily: "'Outfit', sans-serif",
};

const trustStatLabelStyle = {
  fontSize: '10.5px',
  fontWeight: 700,
  color: '#0878f8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  fontFamily: "'Outfit', sans-serif",
};

const trustPillarTitleStyle = {
  fontSize: '14.5px',
  fontWeight: 800,
  color: '#0f172a',
  margin: '0 0 4px 0',
  fontFamily: "'Outfit', sans-serif",
};

const trustPillarDescStyle = {
  fontSize: '12px',
  color: '#64748b',
  lineHeight: 1.45,
  margin: 0,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};
