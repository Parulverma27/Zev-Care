import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWindowDimensions } from 'react-native';
import { useApp } from '../../context/AppContext';
import { SERVICE_IMAGES } from '../../utils/bundledImages';
import ZevotaLogo from '../../components/ZevotaLogo';
import { AppIcon } from '../../components/AppIcons';

const OTP_LENGTH = 4;
const REG_DRAFT_KEY = 'zevota_reg_draft';
const OTP_PHONE_KEY = 'zevota_otp_phone';
const OTP_IS_NEW_KEY = 'zevota_otp_is_new';

const SLIDE_CONFIGS = [
  {
    url: SERVICE_IMAGES.loginSlide1,
    bg: '#f0f6ff',
    tag: 'ALL-IN-ONE HOME SERVICES',
    caption: 'Verified Home Experts at Your Doorstep',
    sub: 'Electrician, plumber, carpenter, pest control & deep cleaning in 15 minutes.',
  },
  {
    url: SERVICE_IMAGES.loginSlide4,
    bg: '#f8fafc',
    tag: 'ELECTRICAL & APPLIANCES',
    caption: 'Certified Electricians for Fast Diagnostics',
    sub: 'Safe wiring, switchboard repairs, MCB diagnostics, and appliance troubleshooting.',
  },
  {
    url: SERVICE_IMAGES.loginSlide5,
    bg: '#f8fafc',
    tag: 'PLUMBING & LEAK REPAIRS',
    caption: 'Expert Bathroom & Kitchen Plumbing',
    sub: 'Taps, diverter valves, pipeline leaks & drain blockages resolved promptly.',
  },
  {
    url: SERVICE_IMAGES.loginSlide6,
    bg: '#f8fafc',
    tag: 'CARPENTRY & FURNITURE EXPERTS',
    caption: 'Master Carpentry & Custom Fittings',
    sub: 'Furniture repair, door locks, hinges, modular fittings & wooden restoration.',
  },
  {
    url: SERVICE_IMAGES.loginSlide2,
    bg: '#f8fafc',
    tag: 'DEEP CLEANING & UPHOLSTERY',
    caption: 'Professional Sofa, Carpet & Bed Cleaning',
    sub: 'Powerful deep-extraction steam cleaning and fabric sanitization.',
  },
  {
    url: SERVICE_IMAGES.loginSlide3,
    bg: '#f8fafc',
    tag: 'PEST CONTROL SPECIALISTS',
    caption: '100% Pest-Free Guarantee for Your Home',
    sub: 'Safe, odorless cockroach, termite & bedbug treatments with lasting protection.',
  },
].filter((s) => Boolean(s.url));

function getPage(pathname) {
  if (pathname.includes('/register')) return 'register';
  if (pathname.includes('/otp')) return 'otp';
  return 'login';
}

export default function AuthScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const page = getPage(location.pathname);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const returnTarget = location.state?.from || '/user/home';

  const { findUserByPhone, registerUser, loginUser, loginGuestUser, activeUser, setActiveUser, updateProfile } = useApp();

  const enterAsGuest = (guestPhone = '', guestName = '') => {
    let preloginLoc = '';
    try {
      preloginLoc = sessionStorage.getItem('zevota_prelogin_location') || '';
    } catch (e) {}

    let resolvedName = (guestName || fullName || '').trim();
    if (!resolvedName) {
      try {
        const saved = sessionStorage.getItem(REG_DRAFT_KEY);
        if (saved) {
          const d = JSON.parse(saved);
          if (d?.name) resolvedName = d.name.trim();
        }
      } catch (e) {}
    }

    if (typeof loginGuestUser === 'function') {
      loginGuestUser(guestPhone || phone, resolvedName);
    }
    if (preloginLoc || resolvedName) {
      try {
        const u = JSON.parse(localStorage.getItem('zevota_active_user') || '{}');
        if (u && typeof u === 'object') {
          if (preloginLoc) u.address = preloginLoc;
          if (resolvedName) u.name = resolvedName;
          localStorage.setItem('zevota_active_user', JSON.stringify(u));
          setActiveUser({ ...u });
        }
      } catch (e) {}
    }
    navigate(returnTarget, { replace: true });
  };

  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [otpFocused, setOtpFocused] = useState(false);

  const [phoneFocused, setPhoneFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Doorstep Location Detection for Pre-Login & Login
  const [detectedLocation, setDetectedLocation] = useState(() => {
    try {
      const saved = sessionStorage.getItem('zevota_prelogin_location') || '';
      if (/[\u0900-\u097F]/.test(saved)) {
        sessionStorage.removeItem('zevota_prelogin_location');
        return '';
      }
      return saved;
    } catch (e) {
      return '';
    }
  });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locFeedback, setLocFeedback] = useState('');

  const handleUseCurrentLocation = () => {
    setLocFeedback('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocFeedback('Geolocation is not supported by your browser or device.');
      return;
    }

    setDetectingLocation(true);
    setLocFeedback('Detecting your GPS location...');

    const fallbackOsm = (lat, lng) => {
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`, {
        headers: { 'Accept-Language': 'en' },
      })
        .then((r) => r.json())
        .then((data) => {
          setDetectingLocation(false);
          if (data && (data.display_name || data.name)) {
            const addr = data.address || {};
            const parts = [
              addr.road || addr.suburb || addr.neighbourhood || addr.residential,
              addr.city_district || addr.city || addr.town || addr.village || addr.county,
              addr.state,
              addr.postcode,
            ].filter(Boolean);
            const englishName = parts.length > 0 ? parts.join(', ') : (data.display_name || '');
            setDetectedLocation(englishName);
            setLocFeedback('✓ Current GPS location detected & linked!');
            try {
              sessionStorage.setItem('zevota_prelogin_location', englishName);
            } catch (e) {}
          } else {
            setLocFeedback('Unable to reverse-geocode coordinates. You can continue.');
          }
        })
        .catch(() => {
          setDetectingLocation(false);
          setLocFeedback('Unable to reverse-geocode coordinates.');
        });
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (window.google?.maps?.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng }, language: 'en' }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              const formatted = results[0].formatted_address;
              if (/[\u0900-\u097F]/.test(formatted)) {
                fallbackOsm(lat, lng);
                return;
              }
              setDetectingLocation(false);
              setDetectedLocation(formatted);
              setLocFeedback('✓ Current GPS location detected & linked!');
              try {
                sessionStorage.setItem('zevota_prelogin_location', formatted);
              } catch (e) {}
            } else {
              fallbackOsm(lat, lng);
            }
          });
        } else {
          fallbackOsm(lat, lng);
        }
      },
      (err) => {
        setDetectingLocation(false);
        if (err.code === 1) {
          setLocFeedback('Location permission was denied. Please allow location access in your browser.');
        } else {
          setLocFeedback('Unable to retrieve location. Please check your GPS permissions.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleClearLocation = () => {
    setDetectedLocation('');
    setLocFeedback('');
    try {
      sessionStorage.removeItem('zevota_prelogin_location');
    } catch (e) {}
  };

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    if (SLIDE_CONFIGS.length <= 1) return;
    const slideInterval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % SLIDE_CONFIGS.length);
    }, 3200);
    return () => clearInterval(slideInterval);
  }, []);

  useEffect(() => {
    const isGuest = Boolean(
      activeUser?.isGuest ||
      activeUser?.id === 0 ||
      activeUser?.name === 'Guest User' ||
      !activeUser?.phone ||
      activeUser?.phone === '+91 00000 00000'
    );
    if (activeUser && !isGuest && (page === 'login' || page === 'register')) {
      navigate(returnTarget, { replace: true });
    }
  }, [activeUser, page, navigate, returnTarget]);

  useEffect(() => {
    if (page === 'otp') {
      try {
        const savedPhone = sessionStorage.getItem(OTP_PHONE_KEY);
        if (savedPhone) setPhone(savedPhone);
        const savedDraft = sessionStorage.getItem(REG_DRAFT_KEY);
        if (savedDraft) {
          const d = JSON.parse(savedDraft);
          if (d?.name) setFullName(d.name);
        }
      } catch (e) {}
    }
  }, [page]);

  useEffect(() => {
    let iv = null;
    if (page === 'otp' && timer > 0) iv = setInterval(() => setTimer((p) => p - 1), 1000);
    else if (timer === 0) setCanResend(true);
    return () => clearInterval(iv);
  }, [page, timer]);

  const formattedPhone =
    phone.length >= 10 ? phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1XXXXXX$3') : phone;

  const handleLogin = () => {
    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions to continue.');
      return;
    }
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (phone.length < 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    try {
      sessionStorage.setItem(OTP_PHONE_KEY, phone);
      sessionStorage.setItem(OTP_IS_NEW_KEY, 'false');
      sessionStorage.setItem(REG_DRAFT_KEY, JSON.stringify({ name: fullName.trim(), phone }));
    } catch (e) {}
    setOtp('');
    setTimer(60);
    setCanResend(false);
    setError('');
    navigate('/user/otp', { state: location.state });
  };

  const handleRegister = () => {
    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions to continue.');
      return;
    }
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (phone.length < 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (email.trim() && !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    const draft = { name: fullName.trim(), email: email.trim(), phone };
    try {
      sessionStorage.setItem(REG_DRAFT_KEY, JSON.stringify(draft));
      sessionStorage.setItem(OTP_PHONE_KEY, phone);
      sessionStorage.setItem(OTP_IS_NEW_KEY, 'true');
    } catch (e) {}
    setTimer(60);
    setCanResend(false);
    setOtp('');
    navigate('/user/otp', { state: location.state });
  };

  const handleVerifyOtp = () => {
    const code = otp?.trim();
    if (code !== '4829' || code.length !== OTP_LENGTH) {
      setError('Invalid OTP. Use demo code 4829.');
      return;
    }
    setError('');

    let isNew = false;
    try {
      isNew = sessionStorage.getItem(OTP_IS_NEW_KEY) === 'true';
    } catch (e) {}

    let preloginLoc = detectedLocation;
    try {
      if (!preloginLoc) preloginLoc = sessionStorage.getItem('zevota_prelogin_location') || '';
    } catch (e) {}

    const existing = findUserByPhone(phone);
    let enteredName = fullName.trim();
    if (!enteredName) {
      try {
        const saved = sessionStorage.getItem(REG_DRAFT_KEY);
        if (saved) {
          const d = JSON.parse(saved);
          if (d?.name) enteredName = d.name;
        }
      } catch (e) {}
    }

    if (existing && !isNew) {
      loginUser(phone);
      if (typeof updateProfile === 'function') {
        const profileUpdates = { ...existing };
        if (enteredName && existing.name !== enteredName) {
          profileUpdates.name = enteredName;
        }
        if (preloginLoc) {
          profileUpdates.address = preloginLoc;
        }
        updateProfile(profileUpdates);
      }
      navigate(returnTarget, { replace: true });
      return;
    }

    if (isNew) {
      let draft = { name: fullName, email, phone };
      try {
        const saved = sessionStorage.getItem(REG_DRAFT_KEY);
        if (saved) draft = JSON.parse(saved);
      } catch (e) {}
      registerUser({
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        address: preloginLoc || '',
      });
      try {
        sessionStorage.removeItem(REG_DRAFT_KEY);
        sessionStorage.removeItem(OTP_IS_NEW_KEY);
      } catch (e) {}
      navigate(returnTarget !== '/user/home' ? returnTarget : '/user/add-property', { replace: true });
      return;
    }

    if (existing) {
      loginUser(phone);
      if (typeof updateProfile === 'function') {
        const profileUpdates = { ...existing };
        if (enteredName && existing.name !== enteredName) {
          profileUpdates.name = enteredName;
        }
        if (preloginLoc) {
          profileUpdates.address = preloginLoc;
        }
        updateProfile(profileUpdates);
      }
      navigate(returnTarget, { replace: true });
    } else {
      enterAsGuest(phone, enteredName);
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setTimer(60);
    setCanResend(false);
    setOtp('');
  };

  const handleChangeNumber = () => {
    setOtp('');
    setError('');
    let isNew = false;
    try {
      isNew = sessionStorage.getItem(OTP_IS_NEW_KEY) === 'true';
      sessionStorage.removeItem(OTP_IS_NEW_KEY);
    } catch (e) {}
    navigate(isNew ? '/user/register' : '/user/login', { state: location.state });
  };

  // ==============================================================
  // DESKTOP REDESIGNED VIEW (Web View Only: >= 768px)
  // ==============================================================
  if (isDesktop) {
    const currentSlide = SLIDE_CONFIGS[activeSlideIndex % SLIDE_CONFIGS.length] || SLIDE_CONFIGS[0];

    return (
      <div className="zc-desktop-auth-root" style={desktopStyles.root}>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" />

        {/* Minimal Luxury Top Bar */}
        <header style={desktopStyles.topBar}>
          <div style={desktopStyles.topBarInner}>
            <button
              type="button"
              style={desktopStyles.brandBtn}
              onClick={() => navigate('/user/home')}
              title="Return to Zevota Care Home"
            >
              <ZevotaLogo size="header" />
              <div style={desktopStyles.brandTextWrap}>
                <span style={desktopStyles.brandTitle}>ZEVOTA CARE</span>
                <span style={desktopStyles.brandSubtitle}>Home &amp; Appliance Care</span>
              </div>
            </button>

            <div style={desktopStyles.topBarRight}>
              <button
                type="button"
                style={desktopStyles.backHomeBtn}
                onClick={() => navigate(returnTarget, { replace: true })}
                title="Return to browsing without logging in"
              >
                <span>← Back to Website</span>
              </button>

            </div>
          </div>
        </header>

        {/* Main Centered 2-Column Luxury Split Card */}
        <main style={desktopStyles.mainWrap}>
          <div style={desktopStyles.cardContainer}>
            {/* Left Column: Full-Bleed Showcase Carousel (Option A) */}
            <div style={desktopStyles.leftHeroPane}>
              {SLIDE_CONFIGS.map((slide, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    opacity: activeSlideIndex === idx ? 1 : 0,
                    transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: activeSlideIndex === idx ? 2 : 1,
                    overflow: 'hidden',
                    backgroundColor: slide.bg,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '54px 24px 112px',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Full Image Display - Contain ensures 100% of the graphic is visible */}
                  <img
                    src={slide.url}
                    alt={slide.caption}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      display: 'block',
                    }}
                  />

                  {/* Top Frosted Pill Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '20px',
                      left: '22px',
                      zIndex: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(2, 132, 199, 0.22)',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.1)',
                      borderRadius: '20px',
                      padding: '6px 14px',
                      color: '#0369a1',
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.8px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#0284c7', boxShadow: '0 0 8px #0284c7' }} />
                    <span>{slide.tag || 'ZEVOTA CARE'}</span>
                  </div>

                  {/* Clean Bottom Banner & Typography */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '20px 28px 38px',
                      background: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.92) 28%, rgba(255, 255, 255, 0.98) 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      boxSizing: 'border-box',
                      zIndex: 5,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: 800,
                        color: '#0a1633',
                        lineHeight: 1.25,
                        fontFamily: "'Outfit', 'Inter', sans-serif",
                        letterSpacing: '-0.3px',
                      }}
                    >
                      {slide.caption}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        color: '#475569',
                        lineHeight: 1.45,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {slide.sub}
                    </p>
                  </div>
                </div>
              ))}

              {/* Glowing Indicator Dots Overlaid at Bottom */}
              <div style={desktopStyles.desktopDotsOverlay}>
                {SLIDE_CONFIGS.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlideIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    style={{
                      ...desktopStyles.desktopDotBtn,
                      width: activeSlideIndex === idx ? 28 : 8,
                      backgroundColor: activeSlideIndex === idx ? '#0284c7' : 'rgba(15, 23, 42, 0.22)',
                      boxShadow: activeSlideIndex === idx ? '0 2px 8px rgba(2, 132, 199, 0.45)' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Right Column: High-End Auth Form Pane */}
            <div style={desktopStyles.rightFormPane}>
              {/* Segmented Switcher (Login / Create Account) */}
              {(page === 'login' || page === 'register') && (
                <div style={desktopStyles.segmentedTabWrap}>
                  <button
                    type="button"
                    style={page === 'login' ? desktopStyles.tabActive : desktopStyles.tabInactive}
                    onClick={() => {
                      setError('');
                      navigate('/user/login', { state: location.state });
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    style={page === 'register' ? desktopStyles.tabActive : desktopStyles.tabInactive}
                    onClick={() => {
                      setError('');
                      navigate('/user/register', { state: location.state });
                    }}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Form Title & Subtitle */}
              <div style={desktopStyles.formHeaderWrap}>
                <h1 style={desktopStyles.formTitle}>
                  {page === 'login' && 'Sign in to your account'}
                  {page === 'register' && 'Create your new account'}
                  {page === 'otp' && 'Verify mobile number'}
                </h1>
                <p style={desktopStyles.formSubtitle}>
                  {page === 'login' && 'Enter your mobile number to receive an instant verification code.'}
                  {page === 'register' && 'Register in seconds to manage appliances, bookings, and AMC pass.'}
                  {page === 'otp' && `Enter the 4-digit code sent to +91 ${formattedPhone || phone}.`}
                </p>
              </div>

              {/* Error Callout Banner */}
              {!!error && (
                <div style={desktopStyles.errorBanner}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* ---------------- LOGIN FORM ---------------- */}
              {page === 'login' && (
                <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} style={desktopStyles.formBody}>
                  <div style={desktopStyles.inputGroup}>
                    <label style={desktopStyles.inputLabel}>Full Name</label>
                    <div
                      style={{
                        ...desktopStyles.inputContainer,
                        borderColor: nameFocused ? '#0878f8' : '#cbd5e1',
                        boxShadow: nameFocused ? '0 0 0 3px rgba(8, 120, 248, 0.12)' : 'none',
                      }}
                    >
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setError('');
                        }}
                        onFocus={() => setNameFocused(true)}
                        onBlur={() => setNameFocused(false)}
                        placeholder="Enter full name"
                        style={desktopStyles.mainInput}
                      />
                    </div>
                  </div>

                  <div style={desktopStyles.inputGroup}>
                    <label style={desktopStyles.inputLabel}>Mobile Number</label>
                    <div
                      style={{
                        ...desktopStyles.inputContainer,
                        borderColor: phoneFocused ? '#0878f8' : '#cbd5e1',
                        boxShadow: phoneFocused ? '0 0 0 3px rgba(8, 120, 248, 0.12)' : 'none',
                      }}
                    >
                      <span style={desktopStyles.countryPrefix}>🇮🇳 +91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                          setError('');
                        }}
                        onFocus={() => setPhoneFocused(true)}
                        onBlur={() => setPhoneFocused(false)}
                        placeholder="Enter 10-digit mobile number"
                        style={desktopStyles.mainInput}
                      />
                    </div>
                  </div>

                  {/* Use Current Location Option */}
                  <div style={desktopStyles.locationContainer}>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={detectingLocation}
                      style={{
                        ...desktopStyles.locationBtn,
                        backgroundColor: detectedLocation ? '#f0fdf4' : '#eff6ff',
                        borderColor: detectedLocation ? '#86efac' : '#bfdbfe',
                        color: detectedLocation ? '#15803d' : '#0878f8',
                      }}
                    >
                      <SvgLocationPin active={Boolean(detectedLocation)} color={detectedLocation ? '#16a34a' : '#0878f8'} size={15} />
                      <span>
                        {detectingLocation
                          ? 'Detecting GPS Location...'
                          : detectedLocation
                          ? 'Current Location Detected'
                          : 'Use My Current Location'}
                      </span>
                    </button>
                    {detectedLocation ? (
                      <div style={desktopStyles.locationBadgeRow}>
                        <span style={desktopStyles.locationBadgeText} title={detectedLocation}>
                          📍 {detectedLocation}
                        </span>
                        <button
                          type="button"
                          onClick={handleClearLocation}
                          style={desktopStyles.clearLocBtn}
                          title="Clear Location"
                        >
                          ✕
                        </button>
                      </div>
                    ) : locFeedback ? (
                      <span style={{ fontSize: 11.5, color: locFeedback.includes('✓') ? '#15803d' : '#dc2626', marginTop: 2, display: 'block' }}>
                        {locFeedback}
                      </span>
                    ) : null}
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div style={desktopStyles.termsRow}>
                    <input
                      id="tc-desktop-login"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => { setTermsAccepted(e.target.checked); setError(''); }}
                      style={desktopStyles.termsCheckbox}
                    />
                    <label htmlFor="tc-desktop-login" style={desktopStyles.termsLabel}>
                      I agree to Zevota Care&apos;s{' '}
                      <span
                        onClick={(e) => { e.preventDefault(); navigate('/user/terms'); }}
                        style={desktopStyles.termsLink}
                      >
                        Terms &amp; Conditions
                      </span>{' '}
                      and Privacy Policy.
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="zc-desktop-btn-primary"
                    style={desktopStyles.submitBtn}
                    onClick={handleLogin}
                  >
                    <span>Send Verification OTP</span>
                    <span style={{ fontSize: 16 }}>→</span>
                  </button>

                  <div style={desktopStyles.switchLinkRow}>
                    <span style={{ color: '#64748b', fontSize: 13 }}>Don&apos;t have an account yet?</span>
                    <button
                      type="button"
                      style={desktopStyles.inlineLinkBtn}
                      onClick={() => {
                        setError('');
                        navigate('/user/register', { state: location.state });
                      }}
                    >
                      Create account
                    </button>
                  </div>
                </form>
              )}

              {/* ---------------- REGISTER FORM ---------------- */}
              {page === 'register' && (
                <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} style={desktopStyles.formBody}>
                  <div style={desktopStyles.inputGroup}>
                    <label style={desktopStyles.inputLabel}>Full Name</label>
                    <div
                      style={{
                        ...desktopStyles.inputContainer,
                        borderColor: nameFocused ? '#0878f8' : '#cbd5e1',
                        boxShadow: nameFocused ? '0 0 0 3px rgba(8, 120, 248, 0.12)' : 'none',
                      }}
                    >
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => { setFullName(e.target.value); setError(''); }}
                        onFocus={() => setNameFocused(true)}
                        onBlur={() => setNameFocused(false)}
                        placeholder="e.g. Rahul Sharma"
                        style={desktopStyles.mainInput}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div style={desktopStyles.inputGroup}>
                    <label style={desktopStyles.inputLabel}>Mobile Number</label>
                    <div
                      style={{
                        ...desktopStyles.inputContainer,
                        borderColor: phoneFocused ? '#0878f8' : '#cbd5e1',
                        boxShadow: phoneFocused ? '0 0 0 3px rgba(8, 120, 248, 0.12)' : 'none',
                      }}
                    >
                      <span style={desktopStyles.countryPrefix}>🇮🇳 +91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                          setError('');
                        }}
                        onFocus={() => setPhoneFocused(true)}
                        onBlur={() => setPhoneFocused(false)}
                        placeholder="Enter 10-digit mobile number"
                        style={desktopStyles.mainInput}
                      />
                    </div>
                  </div>

                  <div style={desktopStyles.inputGroup}>
                    <label style={desktopStyles.inputLabel}>Email Address (Optional)</label>
                    <div
                      style={{
                        ...desktopStyles.inputContainer,
                        borderColor: emailFocused ? '#0878f8' : '#cbd5e1',
                        boxShadow: emailFocused ? '0 0 0 3px rgba(8, 120, 248, 0.12)' : 'none',
                      }}
                    >
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        placeholder="e.g. rahul@example.com"
                        style={desktopStyles.mainInput}
                      />
                    </div>
                  </div>

                  {/* Use Current Location Option */}
                  <div style={desktopStyles.locationContainer}>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={detectingLocation}
                      style={{
                        ...desktopStyles.locationBtn,
                        backgroundColor: detectedLocation ? '#f0fdf4' : '#eff6ff',
                        borderColor: detectedLocation ? '#86efac' : '#bfdbfe',
                        color: detectedLocation ? '#15803d' : '#0878f8',
                      }}
                    >
                      <SvgLocationPin active={Boolean(detectedLocation)} color={detectedLocation ? '#16a34a' : '#0878f8'} size={15} />
                      <span>
                        {detectingLocation
                          ? 'Detecting GPS Location...'
                          : detectedLocation
                          ? 'Current Location Detected'
                          : 'Use My Current Location'}
                      </span>
                    </button>
                    {detectedLocation ? (
                      <div style={desktopStyles.locationBadgeRow}>
                        <span style={desktopStyles.locationBadgeText} title={detectedLocation}>
                          📍 {detectedLocation}
                        </span>
                        <button
                          type="button"
                          onClick={handleClearLocation}
                          style={desktopStyles.clearLocBtn}
                          title="Clear Location"
                        >
                          ✕
                        </button>
                      </div>
                    ) : locFeedback ? (
                      <span style={{ fontSize: 11.5, color: locFeedback.includes('✓') ? '#15803d' : '#dc2626', marginTop: 2, display: 'block' }}>
                        {locFeedback}
                      </span>
                    ) : null}
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div style={desktopStyles.termsRow}>
                    <input
                      id="tc-desktop-reg"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => { setTermsAccepted(e.target.checked); setError(''); }}
                      style={desktopStyles.termsCheckbox}
                    />
                    <label htmlFor="tc-desktop-reg" style={desktopStyles.termsLabel}>
                      I agree to Zevota Care&apos;s{' '}
                      <span
                        onClick={(e) => { e.preventDefault(); navigate('/user/terms'); }}
                        style={desktopStyles.termsLink}
                      >
                        Terms &amp; Conditions
                      </span>{' '}
                      and Privacy Policy.
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="zc-desktop-btn-primary"
                    style={desktopStyles.submitBtn}
                    onClick={handleRegister}
                  >
                    <span>Create Account &amp; Continue</span>
                    <span style={{ fontSize: 16 }}>→</span>
                  </button>

                  <div style={desktopStyles.switchLinkRow}>
                    <span style={{ color: '#64748b', fontSize: 13 }}>Already registered?</span>
                    <button
                      type="button"
                      style={desktopStyles.inlineLinkBtn}
                      onClick={() => {
                        setError('');
                        navigate('/user/login', { state: location.state });
                      }}
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* ---------------- OTP FORM ---------------- */}
              {page === 'otp' && (
                <div style={desktopStyles.formBody}>
                  {/* Demo Helper Pill */}
                  <div style={desktopStyles.demoOtpBanner}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13 }}>⚡</span>
                      <span style={{ fontSize: 12.5, color: '#1e40af', fontWeight: 600 }}>Demo Mode: Use OTP <b>4829</b></span>
                    </div>
                    <button
                      type="button"
                      style={desktopStyles.demoAutofillBtn}
                      onClick={() => {
                        setOtp('4829');
                        setError('');
                      }}
                    >
                      Click to Auto-fill
                    </button>
                  </div>

                  {/* 4 Large Digit Input Boxes */}
                  <div style={desktopStyles.otpContainer}>
                    <input
                      type="tel"
                      maxLength={OTP_LENGTH}
                      value={otp}
                      onFocus={() => setOtpFocused(true)}
                      onBlur={() => setOtpFocused(false)}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH));
                        setError('');
                      }}
                      style={desktopStyles.otpNativeInput}
                      autoFocus
                    />
                    {[0, 1, 2, 3].map((index) => {
                      const char = otp[index] || '';
                      const isCurrent = otp.length === index && otpFocused;
                      return (
                        <div
                          key={index}
                          style={{
                            ...desktopStyles.otpDigitBox,
                            borderColor: isCurrent ? '#0878f8' : char ? '#0f172a' : '#cbd5e1',
                            boxShadow: isCurrent ? '0 0 0 3px rgba(8, 120, 248, 0.15)' : 'none',
                            backgroundColor: char ? '#f8fafc' : '#ffffff',
                          }}
                        >
                          {char}
                        </div>
                      );
                    })}
                  </div>

                  {/* Countdown & Change Number */}
                  <div style={desktopStyles.otpActionRow}>
                    <span style={{ fontSize: 12.5, color: '#64748b' }}>
                      {timer > 0 ? (
                        <>Expires in <b style={{ color: '#0878f8' }}>00:{timer < 10 ? `0${timer}` : timer}</b></>
                      ) : (
                        <button
                          type="button"
                          style={desktopStyles.resendBtn}
                          onClick={handleResend}
                        >
                          Resend Code Now
                        </button>
                      )}
                    </span>

                    <button
                      type="button"
                      style={desktopStyles.changeNumberBtn}
                      onClick={handleChangeNumber}
                    >
                      Change Number
                    </button>
                  </div>

                  <button
                    type="button"
                    className="zc-desktop-btn-primary"
                    style={desktopStyles.submitBtn}
                    onClick={handleVerifyOtp}
                  >
                    <span>Verify &amp; Enter</span>
                    <span style={{ fontSize: 16 }}>→</span>
                  </button>
                </div>
              )}

              {/* Security Trust Footnote */}
              <div style={desktopStyles.formTrustFooter}>
                <AppIcon name="lock" size={13} color="#64748b" strokeWidth={2.2} />
                <span>256-bit bank-grade encryption · No spam · Instant verified entry</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==============================================================
  // MOBILE APPS VIEW (< 768px - 100% UNTOUCHED / ORIGINAL BEHAVIOR)
  // ==============================================================
  return (
    <div className="zc-auth-screen" style={css.screen}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap" />

      {/* Top Hero Banner Slideshow */}
      <div className="zc-auth-hero" style={{ ...css.hero, backgroundColor: SLIDE_CONFIGS[activeSlideIndex % SLIDE_CONFIGS.length]?.bg || '#f1f5f9' }}>
        {SLIDE_CONFIGS.map((slide, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              padding: '8px 12px 26px',
              margin: 0,
              boxSizing: 'border-box',
              backgroundColor: slide.bg,
              opacity: activeSlideIndex === idx ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              zIndex: activeSlideIndex === idx ? 2 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={slide.url}
              alt={`Slide ${idx + 1}`}
              style={css.heroImage}
            />
          </div>
        ))}

        {/* Slide Indicator Dots */}
        <div style={css.dotsContainer}>
          {SLIDE_CONFIGS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveSlideIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              style={{
                ...css.dot,
                width: activeSlideIndex === idx ? 20 : 6,
                backgroundColor: activeSlideIndex === idx ? '#0284c7' : 'rgba(15, 23, 42, 0.22)',
              }}
            />
          ))}
        </div>

      </div>

      {/* Main Form Area */}
      <div className="zc-auth-card-area" style={css.cardArea}>
        <div style={css.card}>
          {page === 'register' && (
            <div style={css.otpHeader}>
              <span style={css.otpTitle}>Let&apos;s get started</span>
              <span style={css.otpSubtitle}>Create your Zevota Care account and take better care of your home.</span>
            </div>
          )}

          {page === 'otp' && (
            <div style={css.otpHeader}>
              <span style={css.otpTitle}>
                Verify your
                <br />
                mobile number
              </span>
              <span style={css.otpSubtitle}>
                Enter the 4-digit code sent to
                <br />
                <b style={{ color: '#0f172a', fontWeight: 600 }}>+91 {formattedPhone || phone}</b>
              </span>
            </div>
          )}

          {page === 'login' && (
            <div style={css.loginHeader}>
              <h1 style={css.welcomeTitle}>Enter your details</h1>
              <p style={css.welcomeSub}>We'll verify your number with a one-time code.</p>
            </div>
          )}

          {!!error && (
            <div style={css.errorBox}>
              <span style={css.errorTxt}>⚠ {error}</span>
            </div>
          )}

          {page === 'login' && (
            <>
              <Field
                icon={<SvgPersonIcon active={nameFocused} />}
                label="Full Name"
                focused={nameFocused}
              >
                <input
                  value={fullName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter full name"
                  style={css.phoneInput}
                />
              </Field>

              <Field
                icon={<SvgPhone active={phoneFocused} />}
                label="Mobile Number"
                focused={phoneFocused}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
              >
                <div style={css.phoneRow}>
                  <span style={css.dialBadge}>🇮🇳 +91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setError('');
                    }}
                    placeholder="Enter mobile number"
                    style={css.phoneInput}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                  />
                </div>
              </Field>

              <p style={css.loginHelperText}>
                Registered? You&apos;ll get an OTP. New here? You&apos;ll enter as a guest.
              </p>

              {/* Use Current Location Option */}
              <div style={css.locContainer}>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={detectingLocation}
                  style={detectedLocation ? css.locBtnActive : css.locBtn}
                >
                  <SvgLocationPin active={Boolean(detectedLocation)} color={detectedLocation ? '#16a34a' : '#0052e0'} size={14} />
                  <span>
                    {detectingLocation
                      ? 'Detecting GPS Location...'
                      : detectedLocation
                      ? 'Current Location Linked'
                      : 'Use My Current Location'}
                  </span>
                </button>
                {detectedLocation ? (
                  <div style={css.locBadgeRow}>
                    <span style={css.locBadgeText} title={detectedLocation}>
                      📍 {detectedLocation}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearLocation}
                      style={css.clearLocBtn}
                      title="Clear location"
                    >
                      ✕
                    </button>
                  </div>
                ) : locFeedback ? (
                  <span style={{ fontSize: 11, color: locFeedback.includes('✓') ? '#15803d' : '#dc2626', marginTop: 2, display: 'block' }}>
                    {locFeedback}
                  </span>
                ) : null}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '8px 0 12px' }}>
                <input
                  id="tc-login"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => { setTermsAccepted(e.target.checked); setError(''); }}
                  style={{ marginTop: 3, accentColor: '#0052e0', cursor: 'pointer', width: 16, height: 16, flexShrink: 0 }}
                />
                <label htmlFor="tc-login" style={{ fontSize: 12, color: '#64748b', lineHeight: '1.5', cursor: 'pointer' }}>
                  I agree to Zevota Care&apos;s{' '}
                  <span
                    onClick={(e) => { e.preventDefault(); navigate('/user/terms'); }}
                    style={{ color: '#0052e0', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Terms &amp; Conditions
                  </span>
                </label>
              </div>

              <button className="zc-btn-premium" style={css.loginBtn} onClick={handleLogin}>
                <span style={css.loginBtnTxt}>Send OTP</span>
                <span style={css.loginBtnArrow}>→</span>
              </button>

              <div style={css.switchRow}>
                <span style={css.switchGray}>New to Zevota Care?</span>
                <span className="zc-link-hover" style={css.switchBlue} onClick={() => navigate('/user/register', { state: location.state })}>
                  Create account
                </span>
              </div>

              <TrustBadges
                style={css.loginBadges}
                items={[
                  { icon: <SvgPerson />, lines: ['Certified', 'Specialists'] },
                  { icon: <SvgBadgeCheck />, lines: ['Trusted', 'Quality'] },
                  { icon: <SvgShieldCheck />, lines: ['Fast &', 'Reliable'] },
                ]}
              />
            </>
          )}

          {page === 'register' && (
            <>
              <Field
                icon={<SvgPersonIcon active={nameFocused} />}
                label="Full Name"
                focused={nameFocused}
              >
                <input
                  value={fullName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter full name"
                  style={css.phoneInput}
                />
              </Field>

              <Field
                icon={<SvgPhone active={phoneFocused} />}
                label="Mobile Number"
                focused={phoneFocused}
              >
                <div style={css.phoneRow}>
                  <span style={css.dialBadge}>🇮🇳 +91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setError('');
                    }}
                    placeholder="Enter mobile number"
                    style={css.phoneInput}
                  />
                </div>
              </Field>

              <Field icon={<SvgEmail active={emailFocused} />} label="Email Address (Optional)" focused={emailFocused}>
                <input
                  type="email"
                  value={email}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter email address (optional)"
                  style={css.phoneInput}
                />
              </Field>

              {/* Use Current Location Option */}
              <div style={css.locContainer}>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={detectingLocation}
                  style={detectedLocation ? css.locBtnActive : css.locBtn}
                >
                  <SvgLocationPin active={Boolean(detectedLocation)} color={detectedLocation ? '#16a34a' : '#0052e0'} size={14} />
                  <span>
                    {detectingLocation
                      ? 'Detecting GPS Location...'
                      : detectedLocation
                      ? 'Current Location Linked'
                      : 'Use My Current Location'}
                  </span>
                </button>
                {detectedLocation ? (
                  <div style={css.locBadgeRow}>
                    <span style={css.locBadgeText} title={detectedLocation}>
                      📍 {detectedLocation}
                    </span>
                    <button
                      type="button"
                      onClick={handleClearLocation}
                      style={css.clearLocBtn}
                      title="Clear location"
                    >
                      ✕
                    </button>
                  </div>
                ) : locFeedback ? (
                  <span style={{ fontSize: 11, color: locFeedback.includes('✓') ? '#15803d' : '#dc2626', marginTop: 2, display: 'block' }}>
                    {locFeedback}
                  </span>
                ) : null}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '8px 0 12px' }}>
                <input
                  id="tc-register"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => { setTermsAccepted(e.target.checked); setError(''); }}
                  style={{ marginTop: 3, accentColor: '#0052e0', cursor: 'pointer', width: 16, height: 16, flexShrink: 0 }}
                />
                <label htmlFor="tc-register" style={{ fontSize: 12, color: '#64748b', lineHeight: '1.5', cursor: 'pointer' }}>
                  I agree to Zevota Care&apos;s{' '}
                  <span
                    onClick={(e) => { e.preventDefault(); navigate('/user/terms'); }}
                    style={{ color: '#0052e0', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Terms &amp; Conditions
                  </span>
                </label>
              </div>

              <button className="zc-btn-premium" style={css.loginBtn} onClick={handleRegister}>
                <span style={css.loginBtnTxt}>Create Account</span>
                <span style={css.loginBtnArrow}>→</span>
              </button>

              <div style={css.switchRow}>
                <span style={css.switchGray}>Already have an account?</span>
                <span className="zc-link-hover" style={css.switchBlue} onClick={() => navigate('/user/login', { state: location.state })}>
                  Login
                </span>
              </div>

              <TrustBadges
                style={css.loginBadges}
                items={[
                  { icon: <SvgBadgeCheck />, lines: ['Certified', 'Specialists'] },
                  { icon: <SvgShieldCheck />, lines: ['Trusted', 'Quality'] },
                  { icon: <SvgStarIcon />, lines: ['Fast &', 'Reliable'] },
                ]}
              />
            </>
          )}

          {page === 'otp' && (
            <>
              <div style={css.otpInputsContainer}>
                <input
                  type="tel"
                  maxLength={OTP_LENGTH}
                  value={otp}
                  onFocus={() => setOtpFocused(true)}
                  onBlur={() => setOtpFocused(false)}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH));
                    setError('');
                  }}
                  style={css.otpInvisibleInput}
                  autoFocus
                />
                {[0, 1, 2, 3].map((index) => {
                  const char = otp[index] || '';
                  const isCurrent = otp.length === index && otpFocused;
                  return (
                    <div
                      key={index}
                      style={{
                        ...css.otpBox,
                        borderColor: isCurrent ? '#0052e0' : '#cbd5e1',
                        boxShadow: isCurrent ? '0 0 0 3px rgba(0, 82, 224, 0.08)' : 'none',
                      }}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>

              <div style={css.expiresRow}>
                <span style={css.expiresTxt}>
                  Code expires in{' '}
                  <b style={{ color: '#0052e0', fontWeight: 600 }}>
                    00:{timer < 10 ? `0${timer}` : timer}
                  </b>
                </span>
              </div>

              <div style={css.linksRow}>
                <span className="zc-link-hover" style={css.linkItem} onClick={handleResend}>
                  Resend OTP
                </span>
                <div style={css.linkSep} />
                <span className="zc-link-hover" style={css.linkItem} onClick={handleChangeNumber}>
                  Change number
                </span>
              </div>

              <div style={css.demoLabelBox}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0052e0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                  </svg>
                  Demo OTP: <b style={{ color: '#0052e0' }}>4829</b>
                </span>
              </div>

              <button className="zc-btn-premium" style={css.loginBtn} onClick={handleVerifyOtp}>
                <span style={css.loginBtnTxt}>Verify &amp; Continue</span>
                <span style={css.loginBtnArrow}>→</span>
              </button>

              <div style={css.securePanelOtp}>
                <SvgSecureLock />
                <span style={css.secureTxt}>
                  Your information is secure
                  <br />
                  and encrypted
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, focused, children }) {
  return (
    <div
      style={{
        ...css.field,
        borderColor: focused ? '#0052e0' : '#94a3b8',
        borderWidth: '1.5px',
        boxShadow: focused ? '0 0 0 3.5px rgba(0, 82, 224, 0.12)' : '0 1px 3px rgba(15, 23, 42, 0.03)',
      }}
    >
      <span style={css.fieldIcon}>{icon}</span>
      <div style={css.fieldBody}>
        <span style={css.fieldLabel}>{label}</span>
        {children}
      </div>
    </div>
  );
}

function TrustBadges({ items, style }) {
  return (
    <div style={{ ...css.badges, ...style }}>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <div style={css.badgeSep} />}
          <div style={css.badge}>
            {item.icon}
            <span style={css.badgeTxt}>
              {item.lines[0]}
              <br />
              {item.lines[1]}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ==============================================================
// DESKTOP STYLES (Urban Company / Luxury Web Aesthetic)
// ==============================================================
const desktopStyles = {
  root: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: 'relative',
    backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(8, 120, 248, 0.04) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.03) 0%, transparent 40%)',
  },
  topBar: {
    width: '100%',
    height: '66px',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  topBarInner: {
    maxWidth: '1280px',
    width: '100%',
    margin: '0 auto',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandBtn: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    outline: 'none',
  },
  brandTextWrap: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: 10,
    lineHeight: 1.15,
    textAlign: 'left',
  },
  brandTitle: {
    fontSize: 16.5,
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.025em',
    fontFamily: "'Inter', sans-serif",
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: 600,
    color: '#0878f8',
    letterSpacing: '0.2px',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  backHomeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    border: '1.5px solid #e2e8f0',
    color: '#334155',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.15s ease',
  },
  mainWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    boxSizing: 'border-box',
  },
  cardContainer: {
    maxWidth: '1080px',
    width: '100%',
    minHeight: '620px',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    border: '1.5px solid #e2e8f0',
    boxShadow: '0 24px 60px -12px rgba(8, 120, 248, 0.14), 0 12px 32px rgba(15, 23, 42, 0.05)',
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  leftHeroPane: {
    width: '50%',
    minWidth: '450px',
    backgroundColor: '#f8fafc',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRight: '1px solid #e2e8f0',
  },
  desktopDotsOverlay: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  desktopDotBtn: {
    height: 7,
    borderRadius: 3.5,
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    transition: 'all 0.3s ease-in-out',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
  },
  heroTrustStats: {
    fontSize: 12,
    fontWeight: 600,
    color: '#cbd5e1',
  },
  rightFormPane: {
    flex: 1,
    padding: '48px 48px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
  },
  segmentedTabWrap: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    width: '100%',
    boxSizing: 'border-box',
  },
  tabActive: {
    flex: 1,
    padding: '10px 0',
    backgroundColor: '#ffffff',
    color: '#0878f8',
    fontSize: 13.5,
    fontWeight: 700,
    border: 'none',
    borderRadius: 9,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  },
  tabInactive: {
    flex: 1,
    padding: '10px 0',
    backgroundColor: 'transparent',
    color: '#64748b',
    fontSize: 13.5,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
  },
  formHeaderWrap: {
    marginBottom: 22,
  },
  formTitle: {
    fontSize: 23,
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 6px',
    letterSpacing: '-0.025em',
    fontFamily: "'Inter', sans-serif",
  },
  formSubtitle: {
    fontSize: 13.5,
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5,
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    backgroundColor: '#fef2f2',
    border: '1.5px solid #fecaca',
    borderRadius: 10,
    color: '#b91c1c',
    fontSize: 12.5,
    fontWeight: 600,
    marginBottom: 16,
  },
  formBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: 700,
    color: '#334155',
    fontFamily: "'Inter', sans-serif",
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1.5px solid #cbd5e1',
    borderRadius: 12,
    padding: '0 14px',
    height: '46px',
    boxSizing: 'border-box',
    transition: 'all 0.15s ease',
  },
  countryPrefix: {
    fontSize: 14,
    fontWeight: 700,
    color: '#0f172a',
    paddingRight: 10,
    borderRight: '1px solid #e2e8f0',
    marginRight: 10,
    userSelect: 'none',
  },
  mainInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 14,
    color: '#0f172a',
    fontWeight: 600,
    backgroundColor: 'transparent',
    fontFamily: "'Inter', sans-serif",
  },
  termsRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  termsCheckbox: {
    width: 16,
    height: 16,
    accentColor: '#0878f8',
    cursor: 'pointer',
    marginTop: 2,
    flexShrink: 0,
  },
  termsLabel: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 1.5,
    cursor: 'pointer',
  },
  termsLink: {
    color: '#0878f8',
    fontWeight: 600,
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    height: '46px',
    backgroundColor: '#0878f8',
    color: '#ffffff',
    border: 'none',
    borderRadius: 12,
    fontSize: 14.5,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(8, 120, 248, 0.28)',
    marginTop: 6,
    transition: 'all 0.15s ease',
    fontFamily: "'Inter', sans-serif",
  },
  switchLinkRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  inlineLinkBtn: {
    background: 'none',
    border: 'none',
    color: '#0878f8',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
    fontFamily: "'Inter', sans-serif",
  },
  demoOtpBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '9px 12px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 10,
  },
  demoAutofillBtn: {
    background: '#ffffff',
    border: '1px solid #93c5fd',
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: 11,
    fontWeight: 700,
    color: '#0878f8',
    cursor: 'pointer',
  },
  otpContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    position: 'relative',
    margin: '12px 0 8px',
  },
  otpNativeInput: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    zIndex: 10,
  },
  otpDigitBox: {
    width: 52,
    height: 56,
    borderRadius: 12,
    border: '1.5px solid #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    fontWeight: 800,
    color: '#0f172a',
    transition: 'all 0.15s ease',
  },
  otpActionRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 4px',
  },
  resendBtn: {
    background: 'none',
    border: 'none',
    color: '#0878f8',
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
  },
  changeNumberBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
  },
  formTrustFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
    paddingTop: 16,
    borderTop: '1px solid #f1f5f9',
    fontSize: 11.5,
    color: '#64748b',
  },
  locationContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    margin: '4px 0 10px',
  },
  locationBtn: {
    width: '100%',
    padding: '9.5px 14px',
    borderRadius: 10,
    borderWidth: '1.5px',
    borderStyle: 'solid',
    fontSize: 12.5,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: "'Inter', sans-serif",
  },
  locationBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 8,
    padding: '6px 10px',
    gap: 8,
  },
  locationBadgeText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  clearLocBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0 4px',
  },
  locationHelper: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 1.35,
  },
};

// ==============================================================
// MOBILE FALLBACK CSS (100% Matching Original App)
// ==============================================================
const css = {
  screen: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    overflowY: 'auto',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
    boxSizing: 'border-box',
    paddingBottom: 0,
  },
  hero: {
    position: 'relative',
    width: '100%',
    height: 310,
    maxHeight: '40vh',
    overflow: 'hidden',
    flexShrink: 0,
    zIndex: 1,
    transition: 'background-color 0.8s ease-in-out',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center top',
    display: 'block',
    border: 'none',
    margin: 0,
    padding: 0,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 22,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    zIndex: 5,
    pointerEvents: 'auto',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    transition: 'all 0.3s ease-in-out',
    outline: 'none',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
  },
  loginHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 4,
    position: 'relative',
    zIndex: 2,
  },
  welcomeTitle: {
    color: '#0a1633',
    fontSize: 20,
    fontWeight: 700,
    lineHeight: '24px',
    margin: 0,
    letterSpacing: -0.3,
  },
  welcomeSub: {
    color: '#707e94',
    fontSize: 13,
    lineHeight: '18px',
    margin: '0 0 10px',
  },
  cardArea: {
    position: 'relative',
    zIndex: 2,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: '16px 20px 24px',
    boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.05)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    marginTop: -16,
  },
  card: { display: 'flex', flexDirection: 'column', gap: 10 },
  errorBox: {
    backgroundColor: '#fff0f0',
    border: '1px solid #ffd0d0',
    borderRadius: 10,
    padding: '8px 12px',
    marginBottom: 2,
  },
  errorTxt: { color: '#d92d20', fontSize: 12.5, fontWeight: 500 },
  field: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderStyle: 'solid',
    borderRadius: 12,
    padding: '8px 14px',
    backgroundColor: '#ffffff',
    gap: 12,
    transition: 'all 0.2s ease-in-out',
  },
  fieldIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fieldBody: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  phoneRow: { display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' },
  dialBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13.5,
    fontWeight: 700,
    color: '#0a1633',
    paddingRight: 8,
    borderRight: '1.5px solid #cbd5e1',
    marginRight: 8,
    userSelect: 'none',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  phoneInput: {
    border: 'none',
    outline: 'none',
    fontSize: 14.5,
    fontWeight: 500,
    color: '#0a1633',
    backgroundColor: 'transparent',
    padding: 0,
    minWidth: 0,
    width: '100%',
    fontFamily: "'Outfit', sans-serif",
    boxSizing: 'border-box',
  },
  loginHelperText: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: '16px',
    margin: '1px 2px 2px',
  },
  loginBtn: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0052e0',
    border: 'none',
    borderRadius: 12,
    padding: '12px 0',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 12px rgba(0, 82, 224, 0.15)',
    marginTop: 4,
  },
  loginBtnTxt: { color: '#fff', fontSize: 14, fontWeight: 600 },
  loginBtnArrow: { color: '#fff', fontSize: 15, fontWeight: 700 },
  switchRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 4 },
  switchGray: { color: '#8898aa', fontSize: 12.5 },
  switchBlue: { color: '#0052e0', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' },
  badges: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    border: '1px solid #dbeafe',
    borderRadius: 14,
    padding: '12px 6px',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
  },
  loginBadges: {
    marginTop: 10,
    marginBottom: 0,
  },
  badge: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  badgeTxt: { fontSize: 11, fontWeight: 600, color: '#1e40af', textAlign: 'center', lineHeight: '14px' },
  badgeSep: { width: 1, height: 36, backgroundColor: '#bfdbfe', flexShrink: 0 },
  otpHeader: { display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, marginBottom: 2 },
  otpTitle: { fontSize: 19, fontWeight: 700, color: '#0a1633', lineHeight: '24px', letterSpacing: -0.2 },
  otpSubtitle: { fontSize: 12.5, color: '#64748b', lineHeight: '17px' },
  otpInputsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    position: 'relative',
    marginTop: 6,
    marginBottom: 4,
  },
  otpInvisibleInput: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    zIndex: 10,
    border: 'none',
    outline: 'none',
  },
  otpBox: {
    width: 38,
    height: 44,
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 700,
    color: '#0a1633',
    backgroundColor: '#ffffff',
    transition: 'all 0.15s ease-in-out',
    boxSizing: 'border-box',
  },
  expiresRow: { display: 'flex', justifyContent: 'flex-start' },
  expiresTxt: { fontSize: 11.5, color: '#64748b' },
  linksRow: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 1, marginBottom: 4 },
  linkItem: { fontSize: 12, fontWeight: 600, color: '#0052e0' },
  linkSep: { width: 1, height: 12, backgroundColor: '#e2e8f0' },
  demoLabelBox: { display: 'flex', justifyContent: 'center', padding: '2px 0', fontSize: 11.5, color: '#94a3b8' },
  securePanelOtp: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf2fc',
    borderRadius: 12,
    padding: '12px 14px',
    gap: 10,
    marginTop: 10,
    border: '1px solid #e2edf9',
    flexShrink: 0,
  },
  secureTxt: { fontSize: 12, color: '#102a63', lineHeight: '16px' },
  locContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    margin: '6px 0 10px',
  },
  locBtn: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#eff6ff',
    border: '1.2px solid #bfdbfe',
    borderRadius: 10,
    padding: '9px 12px',
    color: '#0052e0',
    fontSize: 12,
    fontWeight: 650,
    cursor: 'pointer',
    width: '100%',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  locBtnActive: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#f0fdf4',
    border: '1.2px solid #86efac',
    borderRadius: 10,
    padding: '9px 12px',
    color: '#15803d',
    fontSize: 12,
    fontWeight: 650,
    cursor: 'pointer',
    width: '100%',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  locBadgeRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '5px 8px',
    gap: 6,
  },
  locBadgeText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  clearLocBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
    padding: '0 4px',
  },
};

function SvgPhone({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? '#0052e0' : '#64748b'}>
      <path d="M20.01 15.38c-1.23-.13-2.42-.4-3.53-.78-.35-.12-.74-.03-1.01.24l-1.57 1.57c-2.78-1.41-5.08-3.71-6.49-6.49l1.57-1.57c.27-.27.36-.66.24-1.01-.38-1.11-.65-2.3-.78-3.53-.08-.72-.69-1.27-1.42-1.27H3.59c-.78 0-1.43.68-1.39 1.46.33 6.01 2.85 11.66 7.02 15.83s9.82 6.69 15.83 7.02c.78.04 1.46-.61 1.46-1.39v-3.03c0-.73-.55-1.34-1.27-1.42z" />
    </svg>
  );
}

function SvgPersonIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#0052e0' : '#64748b'} strokeWidth="2.2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SvgEmail({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#0052e0' : '#64748b'} strokeWidth="2.2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function SvgPerson() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SvgBadgeCheck() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78 4 4 0 0 1 0-6.75z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function SvgShieldCheck() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function SvgStarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SvgSecureLock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0052e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function SvgLocationPin({ active, color, size = 15 }) {
  const strokeColor = color || (active ? '#16a34a' : '#0052e0');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.8" fill={active ? strokeColor : 'none'} stroke={strokeColor} strokeWidth="2" />
    </svg>
  );
}
