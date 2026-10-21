import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { SERVICE_IMAGES } from '../../utils/bundledImages';

const OTP_LENGTH = 4;
const REG_DRAFT_KEY = 'zevota_reg_draft';
const OTP_PHONE_KEY = 'zevota_otp_phone';
const OTP_IS_NEW_KEY = 'zevota_otp_is_new';

const SLIDE_CONFIGS = [
  { url: SERVICE_IMAGES.loginSlide1, bg: '#0c5d98' },
  { url: SERVICE_IMAGES.loginSlide2, bg: '#fffdf9' },
  { url: SERVICE_IMAGES.loginSlide3, bg: '#d8cdc5' },
  { url: SERVICE_IMAGES.loginSlide4, bg: '#edebed' },
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
  const { findUserByPhone, registerUser, loginUser, loginGuestUser, skipAuth, activeUser, setActiveUser } = useApp();

  const handleSkipLogin = () => {
    if (typeof skipAuth === 'function') {
      skipAuth();
    } else {
      const anonUser = {
        id: 0,
        isGuest: true,
        isAnonymous: true,
        guestId: null,
        name: '',
        email: '',
        phone: '',
        wallet_balance: 0.0,
        wallet_original_balance: 0.0,
        subscription_plan: null,
        subscription_status: 'INACTIVE',
        property_verification_status: 'PENDING',
        address: '',
        saved_addresses: [],
      };
      setActiveUser(anonUser);
      try {
        localStorage.setItem('zevota_active_user', JSON.stringify(anonUser));
        sessionStorage.removeItem('zevota_guest_session_id');
      } catch (e) {}
    }
    navigate('/user/home', { replace: true });
  };

  const enterAsGuest = (guestPhone = '') => {
    if (typeof loginGuestUser === 'function') {
      loginGuestUser(guestPhone || phone);
    }
    navigate('/user/home', { replace: true });
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

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  useEffect(() => {
    if (SLIDE_CONFIGS.length <= 1) return;
    const slideInterval = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % SLIDE_CONFIGS.length);
    }, 3500);
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
      navigate('/user/home', { replace: true });
    }
  }, [activeUser, page, navigate]);

  useEffect(() => {
    if (page === 'otp') {
      try {
        const savedPhone = sessionStorage.getItem(OTP_PHONE_KEY);
        if (savedPhone) setPhone(savedPhone);
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
    if (phone.length < 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    // Always send to OTP — whether registered or not.
    // handleVerifyOtp will log in the user if registered, or enter as guest if not.
    try {
      sessionStorage.setItem(OTP_PHONE_KEY, phone);
      sessionStorage.setItem(OTP_IS_NEW_KEY, 'false');
    } catch (e) {}
    setOtp('');
    setTimer(60);
    setCanResend(false);
    setError('');
    navigate('/user/otp');
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
    navigate('/user/otp');
  };

  const handleVerifyOtp = () => {
    const code = otp?.trim();
    if (code !== '4829' || code.length !== OTP_LENGTH) {
      setError('Invalid OTP. Use 4829 for demo.');
      return;
    }
    setError('');

    let isNew = false;
    try {
      isNew = sessionStorage.getItem(OTP_IS_NEW_KEY) === 'true';
    } catch (e) {}

    const existing = findUserByPhone(phone);
    if (existing && !isNew) {
      loginUser(phone);
      navigate('/user/home');
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
        address: '',
      });
      try {
        sessionStorage.removeItem(REG_DRAFT_KEY);
        sessionStorage.removeItem(OTP_IS_NEW_KEY);
      } catch (e) {}
      navigate('/user/add-property');
      return;
    }

    if (existing) {
      loginUser(phone);
      navigate('/user/home');
    } else {
      // Not registered — enter as guest
      enterAsGuest();
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
    navigate(isNew ? '/user/register' : '/user/login');
  };

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
              padding: 0,
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
                width: activeSlideIndex === idx ? 18 : 6,
                backgroundColor: activeSlideIndex === idx ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
              }}
            />
          ))}
        </div>

        {/* Floating Top-Right Skip Button (Only on Login page) */}
        {page === 'login' && (
          <button
            type="button"
            onClick={handleSkipLogin}
            aria-label="Skip login"
            style={css.topSkipButton}
          >
            <span>Skip</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>→</span>
          </button>
        )}
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
              <h1 style={css.welcomeTitle}>Enter your mobile number</h1>
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
                icon={<SvgPhone active={phoneFocused} />}
                label="Mobile Number"
                focused={phoneFocused}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
              >
                <div style={css.phoneRow}>
                  <span style={css.dialBadge}>+91 ▾</span>
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
                <span className="zc-link-hover" style={css.switchBlue} onClick={() => navigate('/user/register')}>
                  Create account
                </span>
              </div>

              <TrustBadges
                style={css.loginBadges}
                items={[
                  { icon: <SvgPerson />, lines: ['Skilled', 'Professionals'] },
                  { icon: <SvgBadgeCheck />, lines: ['Quality', 'Service'] },
                  { icon: <SvgShieldCheck />, lines: ['Safe &', 'Trusted'] },
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
                  <span style={css.dialBadge}>+91 ▾</span>
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
                <span className="zc-link-hover" style={css.switchBlue} onClick={() => navigate('/user/login')}>
                  Login
                </span>
              </div>

              <TrustBadges
                style={css.loginBadges}
                items={[
                  { icon: <SvgShieldCheck />, lines: ['Secure', 'account'] },
                  { icon: <SvgBadgeCheck />, lines: ['Verified', 'professionals'] },
                  { icon: <SvgStarIcon />, lines: ['Reliable', 'service'] },
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
                <span style={css.loginBtnTxt}>Verify & Continue</span>
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

      <style>{`
        .zc-btn-premium { transition: all 0.2s ease-in-out !important; }
        .zc-btn-premium:hover {
          background-color: #0045c2 !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 8px 24px rgba(0, 82, 224, 0.25) !important;
        }
        .zc-link-hover { transition: color 0.15s ease-in-out; cursor: pointer; }
        .zc-link-hover:hover { color: #0036a3 !important; text-decoration: underline; }

        @media (min-width: 992px) {
          .zc-auth-screen {
            flex-direction: row !important;
            min-height: 100vh !important;
            height: 100vh !important;
            background-color: #f8fafc !important;
            overflow: hidden !important;
          }
          .zc-auth-hero {
            flex: 1 1 50% !important;
            max-height: 100vh !important;
            height: 100vh !important;
            aspect-ratio: auto !important;
            border-radius: 0 !important;
          }
          .zc-auth-card-area {
            flex: 1 1 50% !important;
            max-width: 480px !important;
            margin: auto !important;
            border-radius: 28px !important;
            padding: 40px !important;
            box-shadow: 0 20px 48px rgba(15, 23, 42, 0.08) !important;
            border: 1.5px solid #e2e8f0 !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
          }
        }
      `}</style>
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
    aspectRatio: '1492 / 1054',
    maxHeight: 285,
    overflow: 'hidden',
    flexShrink: 0,
    zIndex: 1,
    transition: 'background-color 0.8s ease-in-out',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center center',
    display: 'block',
    border: 'none',
    margin: 0,
    padding: 0,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 10,
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
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
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
    color: '#64748b',
    fontSize: 12.5,
    lineHeight: '16px',
    margin: 0,
    fontWeight: 400,
  },
  cardArea: {
    marginTop: 0,
    backgroundColor: '#ffffff',
    borderRadius: '24px 24px 0 0',
    padding: '16px 16px 14px',
    position: 'relative',
    zIndex: 10,
    overflow: 'visible',
    isolation: 'isolate',
    boxShadow: '0 -6px 24px rgba(3, 13, 58, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  card: { display: 'flex', flexDirection: 'column', gap: 10 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 8, padding: 8, textAlign: 'center' },
  errorTxt: { color: '#dc2626', fontSize: 11, fontWeight: 700 },
  field: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    border: '1.5px solid #cbd5e1',
    borderRadius: 12,
    padding: '9px 12px',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease-in-out',
    boxSizing: 'border-box',
    width: '100%',
  },
  fieldIcon: { display: 'flex', alignItems: 'center', flexShrink: 0 },
  fieldBody: { flex: 1, display: 'flex', flexDirection: 'column', gap: 1, width: '100%', minWidth: 0 },
  fieldLabel: { fontSize: 10, fontWeight: 500, color: '#8898aa', fontFamily: "'Outfit', sans-serif" },
  phoneRow: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 5, width: '100%' },
  dialBadge: { fontSize: 13.5, fontWeight: 600, color: '#1d2129', flexShrink: 0 },
  phoneInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 13.5,
    fontWeight: 500,
    color: '#1d2129',
    backgroundColor: 'transparent',
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
  topSkipButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    padding: '5px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    zIndex: 10,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
  skipRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  skipBtn: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '8px 16px',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
  },
  skipBtnText: {
    color: '#475569',
    fontSize: 12.5,
    fontWeight: 600,
  },
  skipBtnArrow: {
    color: '#0052e0',
    fontSize: 13,
    fontWeight: 700,
  },
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
