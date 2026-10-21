import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import ZevotaLogo from '../../components/ZevotaLogo';
import { AppIcon } from '../../components/AppIcons';

function getShortLocationLabel(fullAddress) {
  if (!fullAddress || fullAddress === 'Select location' || fullAddress === 'Select your location') {
    return 'Select Location';
  }
  const clean = String(fullAddress).trim();
  const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const locality = parts[1];
    if (locality.length <= 16 && !/^\d+$/.test(locality)) return locality;
    if (parts[0].length <= 16) return parts[0];
  }
  if (parts[0] && parts[0].length <= 16) {
    return parts[0];
  }
  return clean.length > 16 ? `${clean.slice(0, 14)}...` : clean;
}

export default function DesktopUserHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const { activeUser, logoutUser, updateProfile } = useApp();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const dropdownRef = useRef(null);
  const locationRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setLocationOpen(false);
      }
    }
    if (dropdownOpen || locationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen, locationOpen]);

  // Close dropdowns on route change
  useEffect(() => {
    setDropdownOpen(false);
    setLocationOpen(false);
  }, [path]);

  // Close dropdowns on Escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setLocationOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const shortLocation = getShortLocationLabel(currentAddress);

  const walletBalance = Number(activeUser?.wallet_balance || 0);
  const hasWallet = !isGuest && walletBalance > 0;

  // Streamlined 4-link primary navigation (Services label used consistently)
  const navLinks = [
    { label: 'Home', route: '/user/home', active: path === '/user/home' || path === '/user' || path === '/user/' },
    { label: 'Services', route: '/user/categories', active: path.includes('/categories') },
    { label: 'My Bookings', route: '/user/bookings', active: path.includes('/bookings') && !path.includes('/new') },
    { label: 'AMC Plans', route: '/user/plans', active: path.includes('/plans') },
  ];

  const handleNavClick = (item) => {
    if (item.label === 'Services') {
      const section = typeof document !== 'undefined' ? document.getElementById('explore-services-section') : null;
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      navigate('/user/home#explore-services-section');
      return;
    }
    navigate(item.route);
  };

  const handleSignOut = () => {
    setDropdownOpen(false);
    if (typeof logoutUser === 'function') {
      logoutUser();
    }
    navigate('/user/login');
  };

  const handleSelectSavedAddress = (addr) => {
    if (!addr || !activeUser || !updateProfile) return;
    const cleanAddr = String(addr.address || '').trim();
    const updatedList = (activeUser.saved_addresses || []).map((a) => ({
      ...a,
      isDefault: String(a.address || '').trim().toLowerCase() === cleanAddr.toLowerCase(),
    }));
    updateProfile({
      ...activeUser,
      address: cleanAddr,
      saved_addresses: updatedList,
      ...(addr.latitude != null ? { latitude: addr.latitude } : {}),
      ...(addr.longitude != null ? { longitude: addr.longitude } : {}),
    });
    setLocationOpen(false);
  };

  const userInitial = (activeUser?.name || 'U').charAt(0).toUpperCase();
  const userFirstName = (activeUser?.name || 'Account').split(' ')[0];

  return (
    <header className="desktop-web-header" style={headerStyle}>
      <div style={innerWrapStyle}>
        {/* GROUP A: BRAND (Compact & Recognizable) */}
        <div style={brandSectionStyle}>
          <button
            type="button"
            style={brandBtnStyle}
            onClick={() => navigate('/user/home')}
            title="Zevota Care - Home"
          >
            <ZevotaLogo size="header" />
            <div style={brandTextWrapStyle}>
              <span style={brandNameStyle}>ZEVOTA CARE</span>
              <span style={brandTaglineStyle}>Home & Appliance Care</span>
            </div>
          </button>
        </div>

        {/* GROUP B: PRIMARY NAVIGATION (Clean Typography, No Grey Boxes) */}
        <nav style={navCenterStyle} aria-label="Desktop Navigation">
          {navLinks.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`zc-desktop-nav-link ${item.active ? 'zc-nav-active' : ''}`}
              style={item.active ? activeNavLinkStyle : navLinkStyle}
              onClick={() => handleNavClick(item)}
            >
              <span>{item.label}</span>
              {item.active && <span style={activeUnderlineStyle} />}
            </button>
          ))}
        </nav>

        {/* GROUP C: UTILITY CONTROLS (Compact, Harmonized 36px Height) */}
        <div style={rightSectionStyle}>
          {/* 1. Compact Location Selector with Popover */}
          <div ref={locationRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="zc-header-util-btn"
              style={locationChipStyle}
              onClick={() => {
                setLocationOpen((prev) => !prev);
                setDropdownOpen(false);
              }}
              title={currentAddress}
              aria-expanded={locationOpen}
            >
              <div style={liveLocationDotWrapStyle}>
                <AppIcon name="map-pin" size={14} color="#0878f8" strokeWidth={2.4} />
                <span style={livePulseDotStyle} />
              </div>
              <span style={locationTextStyle}>{shortLocation}</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: locationOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.18s ease',
                  flexShrink: 0,
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Location Selection Popover */}
            {locationOpen && (
              <div style={locationPopoverStyle}>
                <div style={locationPopoverHeaderStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AppIcon name="map-pin" size={14} color="#0878f8" strokeWidth={2.4} />
                    <span style={locationPopoverTitleStyle}>Delivery Location</span>
                  </div>
                  <button
                    type="button"
                    style={locationCloseBtnStyle}
                    onClick={() => setLocationOpen(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <div style={locationCurrentBoxStyle}>
                  <span style={locationCurrentLabelStyle}>CURRENT ADDRESS</span>
                  <p style={locationCurrentTextStyle}>{currentAddress}</p>
                </div>

                {/* Saved addresses switch (if available) */}
                {Array.isArray(activeUser?.saved_addresses) && activeUser.saved_addresses.length > 1 && (
                  <div style={savedAddressesWrapStyle}>
                    <span style={savedAddressesHeaderStyle}>SWITCH SAVED ADDRESS</span>
                    {activeUser.saved_addresses.map((addr) => {
                      const isSelected = String(addr.address || '').trim().toLowerCase() === currentAddress.toLowerCase();
                      return (
                        <button
                          key={addr.id || addr.address}
                          type="button"
                          style={isSelected ? savedAddressItemActiveStyle : savedAddressItemStyle}
                          onClick={() => handleSelectSavedAddress(addr)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                            <span style={addressTagPillStyle}>{addr.tag || 'Address'}</span>
                            <span style={savedAddressItemTextStyle}>{addr.address}</span>
                          </div>
                          {isSelected && (
                            <span style={{ color: '#0878f8', fontWeight: 800, fontSize: '13px' }}>✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div style={locationPopoverFooterStyle}>
                  <button
                    type="button"
                    style={changeAddressBtnStyle}
                    onClick={() => {
                      setLocationOpen(false);
                      navigate('/user/saved-addresses');
                    }}
                  >
                    <span>Change or Add Address</span>
                    <span style={{ fontSize: '12px' }}>→</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Compact AMC Wallet Chip (Subtle, readable, non-intrusive) */}
          {hasWallet && (
            <button
              type="button"
              className="zc-header-util-btn"
              style={walletCompactChipStyle}
              onClick={() => navigate('/user/my-amc')}
              title={`Care Wallet Balance: ₹${walletBalance.toLocaleString('en-IN')} - Click to view pass`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0878f8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <span style={walletCompactValueStyle}>₹{walletBalance.toLocaleString('en-IN')}</span>
            </button>
          )}

          {/* 3. Compact Live Support Action (Headset Icon Button) */}
          <button
            type="button"
            className="zc-header-util-btn"
            style={supportIconBtnStyle}
            onClick={() => navigate('/user/support')}
            title="Help & Live Support"
            aria-label="Help and Live Support"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
              <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </button>

          {/* 4. Compact Profile / Account Control */}
          {isGuest ? (
            <button
              type="button"
              className="zc-desktop-btn-primary"
              style={loginBtnStyle}
              onClick={() => navigate('/user/login')}
            >
              Sign In
            </button>
          ) : (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className="zc-header-util-btn"
                style={profileCompactChipStyle}
                onClick={() => {
                  setDropdownOpen((prev) => !prev);
                  setLocationOpen(false);
                }}
                aria-expanded={dropdownOpen}
                title="Account Menu"
              >
                <div style={avatarCircleStyle}>
                  {userInitial}
                </div>
                <span style={profileNameTextStyle}>{userFirstName}</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.18s ease',
                    flexShrink: 0,
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Clean Account Dropdown Card */}
              {dropdownOpen && (
                <div style={dropdownCardStyle}>
                  <div style={dropdownHeaderStyle}>
                    <div style={dropdownAvatarBigStyle}>
                      {userInitial}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={dropdownHeaderNameStyle}>{activeUser?.name || 'User Profile'}</div>
                      <div style={dropdownHeaderPhoneStyle}>{activeUser?.phone || activeUser?.email || 'Registered User'}</div>
                      <div style={dropdownHeaderBadgeStyle}>
                        {activeUser?.subscription_plan ? `✓ ${activeUser.subscription_plan} AMC Pass` : 'Standard Account'}
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
                      <AppIcon name="lock" size={14} color="#0878f8" strokeWidth={2.2} />
                      <span>My Profile & Account</span>
                    </button>

                    <button
                      type="button"
                      style={dropdownItemBtnStyle}
                      onClick={() => navigate('/user/bookings')}
                    >
                      <AppIcon name="file-text" size={14} color="#7c3aed" strokeWidth={2.2} />
                      <span>My Bookings & Orders</span>
                    </button>

                    <button
                      type="button"
                      style={dropdownItemBtnStyle}
                      onClick={() => navigate('/user/plans')}
                    >
                      <AppIcon name="check" size={14} color="#059669" strokeWidth={2.4} />
                      <span>AMC Plans & Coverage</span>
                    </button>

                    <button
                      type="button"
                      style={dropdownItemBtnStyle}
                      onClick={() => navigate('/user/my-amc')}
                    >
                      <AppIcon name="star" size={14} color="#d97706" strokeWidth={2.2} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span>AMC Wallet & Pass</span>
                        {walletBalance > 0 && (
                          <span style={dropdownWalletBadgeStyle}>₹{walletBalance.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      style={dropdownItemBtnStyle}
                      onClick={() => navigate('/user/saved-addresses')}
                    >
                      <AppIcon name="map-pin" size={14} color="#0878f8" strokeWidth={2.2} />
                      <span>Saved Delivery Addresses</span>
                    </button>

                    <button
                      type="button"
                      style={dropdownItemBtnStyle}
                      onClick={() => navigate('/user/support')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
                        <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                      </svg>
                      <span>Help & Live Support</span>
                    </button>

                    <div style={dropdownDividerStyle} />

                    <button
                      type="button"
                      style={{ ...dropdownItemBtnStyle, color: '#dc2626' }}
                      onClick={handleSignOut}
                    >
                      <AppIcon name="x" size={14} color="#dc2626" strokeWidth={2.2} />
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

/* ============================================================
   STYLES: Simplified Luxury Desktop Navigation Header
   ============================================================ */

const headerStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderBottom: '1px solid #e2e8f0',
  position: 'sticky',
  top: 0,
  zIndex: 1100,
  width: '100%',
  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
  fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
};

const innerWrapStyle = {
  maxWidth: '1240px',
  margin: '0 auto',
  padding: '0 24px',
  height: '62px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
  width: '100%',
  boxSizing: 'border-box',
};

/* Group A: Brand */
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
  fontSize: '17px',
  fontWeight: 900,
  color: '#0f172a',
  letterSpacing: '0.4px',
  fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
};

const brandTaglineStyle = {
  fontSize: '10px',
  fontWeight: 600,
  color: '#0878f8',
  letterSpacing: '0.2px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

/* Group B: Primary Navigation */
const navCenterStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  flexShrink: 0,
};

const navLinkStyle = {
  position: 'relative',
  background: 'transparent',
  backgroundColor: 'transparent',
  border: 'none',
  boxShadow: 'none',
  padding: '8px 14px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#334155',
  cursor: 'pointer',
  transition: 'color 0.16s ease',
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
  background: 'transparent',
  backgroundColor: 'transparent',
};

const activeUnderlineStyle = {
  position: 'absolute',
  bottom: '-2px',
  left: '12px',
  right: '12px',
  height: '2.5px',
  borderRadius: '2px',
  backgroundColor: '#0878f8',
};

/* Group C: Utility Controls (Unified 36px height) */
const rightSectionStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexShrink: 0,
};

/* Location Selector */
const locationChipStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '9px',
  height: '36px',
  padding: '0 10px',
  cursor: 'pointer',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.16s ease, background-color 0.16s ease',
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
  width: '5px',
  height: '5px',
  borderRadius: '50%',
  backgroundColor: '#10b981',
  border: '1px solid #ffffff',
};

const locationTextStyle = {
  fontSize: '12.5px',
  fontWeight: 600,
  color: '#1e293b',
  maxWidth: '120px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

/* Location Popover */
const locationPopoverStyle = {
  position: 'absolute',
  top: '44px',
  left: 0,
  width: '290px',
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  border: '1px solid #bfdbfe',
  boxShadow: '0 14px 32px rgba(15, 23, 42, 0.12), 0 4px 10px rgba(8, 120, 248, 0.06)',
  zIndex: 1200,
  overflow: 'hidden',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const locationPopoverHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 14px',
  backgroundColor: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
};

const locationPopoverTitleStyle = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#0f172a',
  fontFamily: "'Outfit', sans-serif",
};

const locationCloseBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#94a3b8',
  cursor: 'pointer',
  padding: 0,
  fontSize: '12px',
};

const locationCurrentBoxStyle = {
  padding: '12px 14px',
  borderBottom: '1px solid #f1f5f9',
};

const locationCurrentLabelStyle = {
  fontSize: '9.5px',
  fontWeight: 700,
  color: '#64748b',
  letterSpacing: '0.4px',
  display: 'block',
  marginBottom: '4px',
};

const locationCurrentTextStyle = {
  fontSize: '12.5px',
  color: '#1e293b',
  lineHeight: 1.4,
  margin: 0,
  fontWeight: 500,
};

const savedAddressesWrapStyle = {
  padding: '8px 10px',
  maxHeight: '140px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const savedAddressesHeaderStyle = {
  fontSize: '9.5px',
  fontWeight: 700,
  color: '#64748b',
  letterSpacing: '0.4px',
  padding: '2px 4px',
};

const savedAddressItemStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '7px 8px',
  borderRadius: '8px',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  boxSizing: 'border-box',
};

const savedAddressItemActiveStyle = {
  ...savedAddressItemStyle,
  borderColor: '#93c5fd',
  backgroundColor: '#eff6ff',
};

const addressTagPillStyle = {
  fontSize: '9.5px',
  fontWeight: 700,
  backgroundColor: '#f1f5f9',
  color: '#475569',
  padding: '2px 6px',
  borderRadius: '4px',
  flexShrink: 0,
};

const savedAddressItemTextStyle = {
  fontSize: '11.5px',
  color: '#334155',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const locationPopoverFooterStyle = {
  padding: '10px 14px',
  backgroundColor: '#f8fafc',
  borderTop: '1px solid #e2e8f0',
};

const changeAddressBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  backgroundColor: '#ffffff',
  border: '1px solid #bfdbfe',
  borderRadius: '8px',
  padding: '8px 12px',
  color: '#0878f8',
  fontSize: '12.5px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Outfit', sans-serif",
};

/* Compact AMC Wallet */
const walletCompactChipStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: 'rgba(8, 120, 248, 0.05)',
  border: '1px solid rgba(8, 120, 248, 0.22)',
  borderRadius: '9px',
  height: '36px',
  padding: '0 10px',
  cursor: 'pointer',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'background-color 0.16s ease, border-color 0.16s ease',
};

const walletCompactValueStyle = {
  fontSize: '12.5px',
  fontWeight: 700,
  color: '#0878f8',
  fontFamily: "'Outfit', sans-serif",
};

/* Support Icon Button */
const supportIconBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  borderRadius: '9px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#475569',
  cursor: 'pointer',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'all 0.16s ease',
};

/* Compact Profile Control */
const profileCompactChipStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '9px',
  height: '36px',
  padding: '0 8px 0 5px',
  cursor: 'pointer',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.16s ease',
};

const avatarCircleStyle = {
  width: '26px',
  height: '26px',
  borderRadius: '13px',
  backgroundColor: 'rgba(8, 120, 248, 0.12)',
  color: '#0878f8',
  fontWeight: 800,
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(8, 120, 248, 0.25)',
  flexShrink: 0,
  fontFamily: "'Outfit', sans-serif",
};

const profileNameTextStyle = {
  fontSize: '12.5px',
  fontWeight: 700,
  color: '#1e293b',
  maxWidth: '70px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const loginBtnStyle = {
  backgroundColor: '#0878f8',
  color: '#ffffff',
  border: 'none',
  borderRadius: '9px',
  height: '36px',
  padding: '0 16px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  outline: 'none',
  boxShadow: '0 2px 8px rgba(8, 120, 248, 0.25)',
  fontFamily: "'Outfit', sans-serif",
  transition: 'background-color 0.16s ease',
};

/* Profile Dropdown Card */
const dropdownCardStyle = {
  position: 'absolute',
  top: '44px',
  right: 0,
  width: '240px',
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  border: '1px solid #bfdbfe',
  boxShadow: '0 14px 32px rgba(15, 23, 42, 0.12), 0 4px 10px rgba(8, 120, 248, 0.06)',
  zIndex: 1200,
  overflow: 'hidden',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const dropdownHeaderStyle = {
  padding: '12px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  backgroundColor: '#f8fafc',
};

const dropdownAvatarBigStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '18px',
  backgroundColor: 'rgba(8, 120, 248, 0.12)',
  color: '#0878f8',
  fontWeight: 800,
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1.2px solid rgba(8, 120, 248, 0.25)',
  flexShrink: 0,
};

const dropdownHeaderNameStyle = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#0f172a',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const dropdownHeaderPhoneStyle = {
  fontSize: '11px',
  color: '#64748b',
  marginTop: '1px',
};

const dropdownHeaderBadgeStyle = {
  fontSize: '9.5px',
  fontWeight: 700,
  color: '#059669',
  marginTop: '2px',
};

const dropdownDividerStyle = {
  height: '1px',
  backgroundColor: '#f1f5f9',
};

const dropdownMenuLinksStyle = {
  padding: '5px',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
};

const dropdownItemBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  padding: '8px 10px',
  borderRadius: '7px',
  background: 'none',
  border: 'none',
  fontSize: '12.5px',
  fontWeight: 600,
  color: '#334155',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  transition: 'background-color 0.12s ease',
};

const dropdownWalletBadgeStyle = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#0878f8',
  backgroundColor: 'rgba(8, 120, 248, 0.08)',
  padding: '1px 6px',
  borderRadius: '10px',
};
