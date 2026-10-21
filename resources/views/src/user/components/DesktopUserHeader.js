import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import ZevotaLogo from '../../components/ZevotaLogo';
import { AppIcon } from '../../components/AppIcons';

export default function DesktopUserHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const { activeUser, logoutUser } = useApp();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [path]);

  const isGuest = Boolean(
    !activeUser ||
    activeUser.id == null ||
    activeUser.id === 0 ||
    activeUser.isGuest ||
    activeUser.isAnonymous
  );

  const currentAddress =
    (activeUser?.saved_addresses || []).find((a) => a.isDefault)?.address ||
    activeUser?.address ||
    'Select location';

  const walletBalance = Number(activeUser?.wallet_balance || 0);
  const hasWallet = !isGuest && walletBalance > 0;

  const navLinks = [
    { label: 'Home', route: '/user/home', active: path === '/user/home' || path === '/user' || path === '/user/' },
    { label: 'Categories', route: '/user/categories', active: path.includes('/categories') },
    { label: 'My Bookings', route: '/user/bookings', active: path.includes('/bookings') && !path.includes('/new') },
    { label: 'AMC Plans', route: '/user/plans', active: path.includes('/plans') },
    { label: 'Live Support', route: '/user/support', active: path.includes('/support') },
  ];

  const handleSignOut = () => {
    setDropdownOpen(false);
    if (typeof logoutUser === 'function') {
      logoutUser();
    }
    navigate('/user/login');
  };

  return (
    <header className="desktop-web-header" style={headerStyle}>
      <div style={innerWrapStyle}>
        {/* LEFT: Brand Identity */}
        <div style={brandSectionStyle}>
          <button
            type="button"
            style={brandBtnStyle}
            onClick={() => navigate('/user/home')}
            title="Zevota Care - Home"
          >
            <ZevotaLogo size="small" />
            <div style={brandTextWrapStyle}>
              <span style={brandNameStyle}>ZEVOTA CARE</span>
              <span style={brandTaglineStyle}>Home & Appliance Care</span>
            </div>
          </button>
        </div>

        {/* CENTER: Main Desktop Navigation (Urban Company style underline & pill indicator) */}
        <nav style={navCenterStyle} aria-label="Desktop Navigation">
          {navLinks.map((item) => (
            <button
              key={item.label}
              type="button"
              className="zc-desktop-nav-link"
              style={item.active ? activeNavLinkStyle : navLinkStyle}
              onClick={() => navigate(item.route)}
            >
              <span>{item.label}</span>
              {item.active && <span style={activeUnderlineStyle} />}
            </button>
          ))}
        </nav>

        {/* RIGHT: Harmonized Action Chips (Height 38px, Radius 10px) */}
        <div style={rightSectionStyle}>
          {/* Location Selector */}
          <button
            type="button"
            style={actionChipStyle}
            onClick={() => navigate('/user/saved-addresses')}
            title={`Current Address: ${currentAddress}`}
          >
            <div style={liveLocationDotWrapStyle}>
              <AppIcon name="map-pin" size={15} color="#0878f8" strokeWidth={2.4} />
              <span style={livePulseDotStyle} />
            </div>
            <span style={locationTextStyle}>{currentAddress}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* AMC Wallet Balance Chip */}
          {hasWallet && (
            <button
              type="button"
              style={walletChipStyle}
              onClick={() => navigate('/user/my-amc')}
              title="View Care Wallet"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0878f8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <div style={walletInfoWrapStyle}>
                <span style={walletLabelStyle}>AMC WALLET</span>
                <span style={walletValueStyle}>₹{walletBalance.toLocaleString('en-IN')}</span>
              </div>
            </button>
          )}

          {/* User Account Controls */}
          {isGuest ? (
            <button
              type="button"
              style={loginBtnStyle}
              onClick={() => navigate('/user/login')}
            >
              Sign In
            </button>
          ) : (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                style={profileChipStyle}
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                title="Account Menu"
              >
                <div style={avatarCircleStyle}>
                  {(activeUser?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={profileNameWrapStyle}>
                  <span style={profileNameTextStyle}>{activeUser?.name || 'Account'}</span>
                  <span style={profileBadgeTextStyle}>
                    {activeUser?.subscription_plan ? `${activeUser.subscription_plan} Pass` : 'Standard'}
                  </span>
                </div>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Account Dropdown Card */}
              {dropdownOpen && (
                <div style={dropdownCardStyle}>
                  <div style={dropdownHeaderStyle}>
                    <div style={dropdownAvatarBigStyle}>
                      {(activeUser?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={dropdownHeaderNameStyle}>{activeUser?.name || 'User Profile'}</div>
                      <div style={dropdownHeaderPhoneStyle}>{activeUser?.phone || activeUser?.email || 'Registered User'}</div>
                      <div style={dropdownHeaderBadgeStyle}>
                        {activeUser?.subscription_plan ? `✓ ${activeUser.subscription_plan} AMC Plan` : 'Regular Home Account'}
                      </div>
                    </div>
                  </div>

                  <div style={dropdownDividerStyle} />

                  <div style={dropdownMenuLinksStyle}>
                    <button
                      type="button"
                      style={dropdownItemBtnStyle}
                      onClick={() => navigate('/user/profile')}
                    >
                      <AppIcon name="lock" size={15} color="#0878f8" strokeWidth={2.2} />
                      <span>My Profile & Account</span>
                    </button>

                    <button
                      type="button"
                      style={dropdownItemBtnStyle}
                      onClick={() => navigate('/user/saved-addresses')}
                    >
                      <AppIcon name="map-pin" size={15} color="#059669" strokeWidth={2.2} />
                      <span>Saved Delivery Addresses</span>
                    </button>

                    <button
                      type="button"
                      style={dropdownItemBtnStyle}
                      onClick={() => navigate('/user/my-amc')}
                    >
                      <AppIcon name="star" size={15} color="#d97706" strokeWidth={2.2} />
                      <span>My AMC Pass & Wallet</span>
                    </button>

                    <button
                      type="button"
                      style={dropdownItemBtnStyle}
                      onClick={() => navigate('/user/bookings')}
                    >
                      <AppIcon name="file-text" size={15} color="#7c3aed" strokeWidth={2.2} />
                      <span>My Bookings & Orders</span>
                    </button>

                    <div style={dropdownDividerStyle} />

                    <button
                      type="button"
                      style={{ ...dropdownItemBtnStyle, color: '#dc2626' }}
                      onClick={handleSignOut}
                    >
                      <AppIcon name="x" size={15} color="#dc2626" strokeWidth={2.2} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const headerStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.94)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  borderBottom: '1px solid #e2e8f0',
  position: 'sticky',
  top: 0,
  zIndex: 1100,
  width: '100%',
  boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
  fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
};

const innerWrapStyle = {
  maxWidth: '1240px',
  margin: '0 auto',
  padding: '0 24px',
  height: '70px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  width: '100%',
  boxSizing: 'border-box',
};

const brandSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  flexShrink: 0,
};

const brandBtnStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  outline: 'none',
  textAlign: 'left',
};

const brandTextWrapStyle = {
  display: 'flex',
  flexDirection: 'column',
  marginLeft: '10px',
  lineHeight: 1.15,
};

const brandNameStyle = {
  fontSize: '19px',
  fontWeight: 900,
  color: '#0f172a',
  letterSpacing: '0.6px',
  fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
};

const brandTaglineStyle = {
  fontSize: '10.5px',
  fontWeight: 700,
  color: '#0878f8',
  letterSpacing: '0.3px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const navCenterStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  flexShrink: 0,
};

const navLinkStyle = {
  position: 'relative',
  background: 'transparent',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#475569',
  cursor: 'pointer',
  transition: 'all 0.18s ease',
  outline: 'none',
  whiteSpace: 'nowrap',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const activeNavLinkStyle = {
  ...navLinkStyle,
  color: '#0878f8',
  fontWeight: 700,
  backgroundColor: 'rgba(8, 120, 248, 0.05)',
};

const activeUnderlineStyle = {
  position: 'absolute',
  bottom: '3px',
  left: '14px',
  right: '14px',
  height: '3px',
  borderRadius: '3px',
  backgroundColor: '#0878f8',
};

const liveLocationDotWrapStyle = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const livePulseDotStyle = {
  position: 'absolute',
  top: '-1px',
  right: '-3px',
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: '#10b981',
  border: '1.5px solid #ffffff',
};

const rightSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexShrink: 0,
};

/* Unified 38px height action chips */
const actionChipStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#f8fafc',
  border: '1.5px solid #e2e8f0',
  borderRadius: '11px',
  height: '38px',
  padding: '0 12px',
  cursor: 'pointer',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.18s ease, background-color 0.18s ease, transform 0.18s ease',
  boxShadow: '0 2px 5px rgba(15, 23, 42, 0.03)',
};

const locationTextStyle = {
  fontSize: '12.5px',
  fontWeight: 600,
  color: '#1e293b',
  maxWidth: '150px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const walletChipStyle = {
  ...actionChipStyle,
  backgroundColor: 'rgba(8, 120, 248, 0.06)',
  borderColor: 'rgba(8, 120, 248, 0.22)',
  gap: '8px',
};

const walletInfoWrapStyle = {
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'right',
  lineHeight: 1.1,
};

const walletLabelStyle = {
  fontSize: '8.5px',
  fontWeight: 700,
  color: '#64748b',
  letterSpacing: '0.4px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const walletValueStyle = {
  fontSize: '12.5px',
  fontWeight: 800,
  color: '#0878f8',
  fontFamily: "'Outfit', sans-serif",
};

const profileChipStyle = {
  ...actionChipStyle,
  gap: '8px',
  padding: '0 10px 0 5px',
};

const avatarCircleStyle = {
  width: '28px',
  height: '28px',
  borderRadius: '14px',
  backgroundColor: 'rgba(8, 120, 248, 0.12)',
  color: '#0878f8',
  fontWeight: 800,
  fontSize: '13px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(8, 120, 248, 0.25)',
  flexShrink: 0,
  fontFamily: "'Outfit', sans-serif",
};

const profileNameWrapStyle = {
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'left',
  lineHeight: 1.15,
};

const profileNameTextStyle = {
  fontSize: '12.5px',
  fontWeight: 700,
  color: '#0f172a',
  maxWidth: '100px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const profileBadgeTextStyle = {
  fontSize: '9.5px',
  fontWeight: 600,
  color: '#059669',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const loginBtnStyle = {
  backgroundColor: '#0878f8',
  color: '#ffffff',
  border: 'none',
  borderRadius: '11px',
  height: '38px',
  padding: '0 18px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  outline: 'none',
  boxShadow: '0 4px 12px rgba(8, 120, 248, 0.3)',
  fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  transition: 'transform 0.16s ease, background-color 0.16s ease',
};

const dropdownCardStyle = {
  position: 'absolute',
  top: '48px',
  right: 0,
  width: '250px',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: '1.5px solid #bfdbfe',
  boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.14), 0 4px 12px rgba(8, 120, 248, 0.08)',
  zIndex: 1200,
  overflow: 'hidden',
  animation: 'zevotaFadeUp 0.15s ease-out',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const dropdownHeaderStyle = {
  padding: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  backgroundColor: '#f8fafc',
};

const dropdownAvatarBigStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '19px',
  backgroundColor: 'rgba(8, 120, 248, 0.12)',
  color: '#0878f8',
  fontWeight: 800,
  fontSize: '15px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1.2px solid rgba(8, 120, 248, 0.25)',
  flexShrink: 0,
};

const dropdownHeaderNameStyle = {
  fontSize: '13.5px',
  fontWeight: 700,
  color: '#0f172a',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const dropdownHeaderPhoneStyle = {
  fontSize: '11.5px',
  color: '#64748b',
  marginTop: '1px',
};

const dropdownHeaderBadgeStyle = {
  fontSize: '10px',
  fontWeight: 600,
  color: '#059669',
  marginTop: '3px',
};

const dropdownDividerStyle = {
  height: '1px',
  backgroundColor: '#f1f5f9',
};

const dropdownMenuLinksStyle = {
  padding: '6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const dropdownItemBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '9px 10px',
  borderRadius: '8px',
  background: 'none',
  border: 'none',
  fontSize: '12.5px',
  fontWeight: 600,
  color: '#334155',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: "'Inter', sans-serif",
  transition: 'background-color 0.12s ease',
};
