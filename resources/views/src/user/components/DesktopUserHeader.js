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

  // Streamlined primary navigation
  const navLinks = [
    { label: 'Home', route: '/user/home', active: path === '/user/home' || path === '/user' || path === '/user/' },
    { label: 'My Bookings', route: '/user/bookings', active: path.includes('/bookings') && !path.includes('/new') },
    { label: 'AMC Plans', route: '/user/plans', active: path.includes('/plans') },
  ];

  const handleNavClick = (item) => {
    navigate(item.route);
  };

  const handleSignOut = () => {
    setDropdownOpen(false);
    if (typeof logoutUser === 'function') {
      logoutUser();
    }
    // Desktop web behaves like a normal website: back to Home as a guest.
    navigate('/user/home', { replace: true });
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
  const userPlanRaw = activeUser?.subscription_plan;
  const userPlanLabel = userPlanRaw
    ? (/pass$/i.test(userPlanRaw.trim())
        ? userPlanRaw.trim()
        : /amc$/i.test(userPlanRaw.trim())
          ? `${userPlanRaw.trim()} Pass`
          : `${userPlanRaw.trim()} AMC Pass`)
    : 'Standard Account';

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
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                id="desktop-header-guest-profile"
                className="zc-header-util-btn"
                style={profileCompactChipStyle}
                onClick={() => {
                  setDropdownOpen((prev) => !prev);
                  setLocationOpen(false);
                }}
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
                title="Login or create an account"
              >
                <div style={guestAvatarCircleStyle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <span style={profileNameTextStyle}>Login</span>
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

              {dropdownOpen && (
                <div style={{ ...dropdownCardStyle, width: '272px' }} role="menu">
                  <div style={guestDropdownHeroStyle}>
                    <span style={guestDropdownTitleStyle}>Welcome to Zevota Care</span>
                    <span style={guestDropdownSubStyle}>
                      Log in to book services, track visits and manage your AMC plan.
                    </span>
                    <button
                      type="button"
                      id="desktop-header-login-btn"
                      className="zc-desktop-btn-primary"
                      style={guestLoginBtnStyle}
                      onClick={() => navigate('/user/login', { state: { from: path } })}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      id="desktop-header-register-btn"
                      style={guestRegisterBtnStyle}
                      onClick={() => navigate('/user/register', { state: { from: path } })}
                    >
                      Create Account
                    </button>
                  </div>

                  <div style={dropdownDividerStyle} />

                  <div style={dropdownMenuLinksStyle}>
                    <button
                      type="button"
                      style={dropdownItemBtnStyle}
                      onClick={() => navigate('/user/plans')}
                    >
                      <AppIcon name="check" size={14} color="#059669" strokeWidth={2.4} />
                      <span>AMC Plans &amp; Coverage</span>
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
                      <span>Help &amp; Live Support</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                      <div style={dropdownPlanBadgeStyle}>
                        <span style={dropdownPlanDotStyle} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          ✓ {userPlanLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={dropdownDividerStyle} />

                  <div style={dropdownMenuLinksStyle}>
                    <button
                      type="button"
                      className="zc-dropdown-item"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/user/profile');
                      }}
                    >
                      <div className="zc-dropdown-icon-box" style={{ backgroundColor: '#eff6ff', border: '1px solid #dbeafe' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <span>My Profile & Account</span>
                      <svg className="zc-dropdown-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="zc-dropdown-item"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/user/bookings');
                      }}
                    >
                      <div className="zc-dropdown-icon-box" style={{ backgroundColor: '#f5f3ff', border: '1px solid #ede9fe' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </div>
                      <span>My Bookings & Orders</span>
                      <svg className="zc-dropdown-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="zc-dropdown-item"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/user/plans');
                      }}
                    >
                      <div className="zc-dropdown-icon-box" style={{ backgroundColor: '#ecfdf5', border: '1px solid #d1fae5' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      </div>
                      <span>AMC Plans & Coverage</span>
                      <svg className="zc-dropdown-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="zc-dropdown-item"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/user/my-amc');
                      }}
                    >
                      <div className="zc-dropdown-icon-box" style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="#d97706" stroke="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, minWidth: 0 }}>
                        <span>AMC Wallet & Pass</span>
                        {walletBalance > 0 && (
                          <span style={dropdownWalletBadgeStyle}>₹{walletBalance.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                      <svg className="zc-dropdown-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="zc-dropdown-item"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/user/saved-addresses');
                      }}
                    >
                      <div className="zc-dropdown-icon-box" style={{ backgroundColor: '#f0f9ff', border: '1px solid #e0f2fe' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <span>Saved Delivery Addresses</span>
                      <svg className="zc-dropdown-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="zc-dropdown-item"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/user/support');
                      }}
                    >
                      <div className="zc-dropdown-icon-box" style={{ backgroundColor: '#ecfeff', border: '1px solid #cffafe' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
                          <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                        </svg>
                      </div>
                      <span>Help & Live Support</span>
                      <svg className="zc-dropdown-chevron" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>

                    <div style={dropdownDividerStyle} />

                    <button
                      type="button"
                      className="zc-dropdown-item zc-dropdown-item-danger"
                      onClick={handleSignOut}
                    >
                      <div className="zc-dropdown-icon-box" style={{ backgroundColor: '#fef2f2', border: '1px solid #fee2e2' }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                      </div>
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
  maxWidth: '1420px',
  margin: '0 auto',
  padding: '0 32px',
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
  fontWeight: 800,
  color: '#0f172a',
  letterSpacing: '-0.025em',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
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
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
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
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
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
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
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
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
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

const guestAvatarCircleStyle = {
  ...avatarCircleStyle,
  backgroundColor: '#f1f5f9',
  color: '#475569',
  border: '1px solid #e2e8f0',
};

const guestDropdownHeroStyle = {
  padding: '16px 16px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  background: 'linear-gradient(160deg, #eff6ff 0%, #ffffff 70%)',
};

const guestDropdownTitleStyle = {
  fontSize: '14.5px',
  fontWeight: 800,
  color: '#0f172a',
  letterSpacing: '-0.01em',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

const guestDropdownSubStyle = {
  fontSize: '12px',
  color: '#64748b',
  lineHeight: 1.5,
  marginBottom: '4px',
};

const guestLoginBtnStyle = {
  width: '100%',
  height: '38px',
  backgroundColor: '#0878f8',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  fontSize: '13.5px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(8, 120, 248, 0.25)',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

const guestRegisterBtnStyle = {
  width: '100%',
  height: '38px',
  backgroundColor: '#ffffff',
  color: '#0878f8',
  border: '1.5px solid #bfdbfe',
  borderRadius: '10px',
  fontSize: '13.5px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

/* Profile Dropdown Card */
const dropdownCardStyle = {
  position: 'absolute',
  top: '46px',
  right: 0,
  width: '286px',
  backgroundColor: '#ffffff',
  borderRadius: '18px',
  border: '1px solid rgba(203, 213, 225, 0.85)',
  boxShadow: '0 20px 48px -10px rgba(15, 23, 42, 0.16), 0 8px 18px -4px rgba(8, 120, 248, 0.08)',
  zIndex: 1200,
  overflow: 'hidden',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  animation: 'dropdownFadeIn 0.16s ease-out',
};

const dropdownHeaderStyle = {
  padding: '15px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  background: 'linear-gradient(135deg, #f8faff 0%, #edf4fe 100%)',
  borderBottom: '1px solid #eef2f6',
};

const dropdownAvatarBigStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '22px',
  background: 'linear-gradient(135deg, #0878f8 0%, #0353c7 100%)',
  color: '#ffffff',
  fontWeight: 800,
  fontSize: '17px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid #ffffff',
  boxShadow: '0 4px 12px rgba(8, 120, 248, 0.28)',
  flexShrink: 0,
};

const dropdownHeaderNameStyle = {
  fontSize: '14.5px',
  fontWeight: 800,
  color: '#0f172a',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  letterSpacing: '-0.2px',
};

const dropdownHeaderPhoneStyle = {
  fontSize: '11.5px',
  color: '#64748b',
  marginTop: '2px',
  fontWeight: 500,
};

const dropdownPlanBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  marginTop: '4px',
  padding: '2.5px 8px',
  borderRadius: '12px',
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  color: '#047857',
  fontSize: '10.5px',
  fontWeight: 700,
  maxWidth: '100%',
  boxSizing: 'border-box',
};

const dropdownPlanDotStyle = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: '#10b981',
  flexShrink: 0,
};

const dropdownDividerStyle = {
  height: '1px',
  backgroundColor: '#f1f5f9',
  margin: '4px 6px',
};

const dropdownMenuLinksStyle = {
  padding: '8px 6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
};

const dropdownWalletBadgeStyle = {
  fontSize: '11px',
  fontWeight: 800,
  color: '#1d4ed8',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  padding: '2px 8px',
  borderRadius: '10px',
  letterSpacing: '0.2px',
};
