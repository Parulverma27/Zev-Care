import React from 'react';
import { AppIcon } from '../../components/AppIcons';

function formatPhoneNumber(phone) {
  if (!phone) return '';
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return trimmed;
}

export default function ProfileDesktopWebView({
  activeUser,
  isAnonymous,
  isGuest,
  guestIdDisplay,
  hasPlan,
  userPlanTheme,
  userInitials,
  onNavigate,
  onOpenEditModal,
  onLogout,
  editModalVisible,
  setEditModalVisible,
  editName,
  setEditName,
  editEmail,
  setEditEmail,
  editPhone,
  setEditPhone,
  errorMsg,
  setErrorMsg,
  successMsg,
  handleSavePersonalDetails,
  showGuestModal,
  setShowGuestModal,
}) {
  const walletBalance = Number(activeUser?.wallet_balance || 0);
  const savedAddrs = Array.isArray(activeUser?.saved_addresses) ? activeUser.saved_addresses : [];
  const defaultAddr = savedAddrs.find((a) => a.isDefault) || savedAddrs[0];

  return (
    <div className="profile-desktop-web-wrap" style={wrapperStyle}>
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div style={headerRowStyle}>
        <div style={headerLeftColStyle}>
          <button
            type="button"
            className="zc-desktop-btn-secondary"
            style={backBtnStyle}
            onClick={() => onNavigate('/user/home')}
            title="Back to Home"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Home</span>
          </button>
          <div style={{ marginTop: '12px' }}>
            <h1 style={pageTitleStyle}>My Profile & Account</h1>
            <p style={pageSubtextStyle}>
              Manage your verified personal details, active AMC membership coverage, wallet balance, and delivery addresses.
            </p>
          </div>
        </div>

        <div style={headerRightColStyle}>
          <div style={memberStatusPillStyle}>
            <span style={statusDotStyle} />
            <span style={{ fontWeight: 800, color: hasPlan ? '#92400e' : '#0878f8' }}>
              {isAnonymous ? 'Guest Visitor' : hasPlan ? `${activeUser?.subscription_plan} Member` : 'Free Tier Member'}
            </span>
            <span style={{ color: '#94a3b8' }}>•</span>
            <span style={{ color: '#475569', fontWeight: 600 }}>Verified Account</span>
          </div>
        </div>
      </div>

      {/* 2. TOP METRICS / QUICK ACCESS KPI CARDS (4-Column Ribbon) */}
      <div style={kpiGridStyle}>
        {/* KPI 1: AMC Pass */}
        <div
          className="zc-profile-kpi-card"
          style={kpiCardStyle}
          onClick={() => onNavigate('/user/my-amc')}
          role="button"
          tabIndex={0}
        >
          <div style={kpiHeaderStyle}>
            <span style={kpiIconWrapStyle('#fffbeb', '#fef3c7')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </span>
            <span style={kpiCategoryTagStyle}>AMC PASS</span>
          </div>
          <div style={kpiValueStyle}>
            {hasPlan ? `${activeUser?.subscription_plan} Pass` : 'No Active Pass'}
          </div>
          <div style={kpiDescStyle}>
            {hasPlan ? '₹0 Inspection on all repairs' : 'Protect home appliances 365 days'}
          </div>
          <div style={kpiLinkStyle}>
            <span>View Benefits</span>
            <span style={{ fontSize: '14px' }}>→</span>
          </div>
        </div>

        {/* KPI 2: Wallet Balance */}
        <div
          className="zc-profile-kpi-card"
          style={kpiCardStyle}
          onClick={() => onNavigate('/user/my-amc')}
          role="button"
          tabIndex={0}
        >
          <div style={kpiHeaderStyle}>
            <span style={kpiIconWrapStyle('#eff6ff', '#dbeafe')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0878f8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <line x1="2" y1="10" x2="22" y2="10" />
                <circle cx="16" cy="15" r="1.5" fill="#0878f8" />
              </svg>
            </span>
            <span style={kpiCategoryTagStyle}>WALLET CREDITS</span>
          </div>
          <div style={kpiValueStyle}>
            ₹{walletBalance.toLocaleString('en-IN')}
          </div>
          <div style={kpiDescStyle}>
            Prepaid Zevota AMC service credits
          </div>
          <div style={kpiLinkStyle}>
            <span>Recharge & Pass</span>
            <span style={{ fontSize: '14px' }}>→</span>
          </div>
        </div>

        {/* KPI 3: Bookings & History */}
        <div
          className="zc-profile-kpi-card"
          style={kpiCardStyle}
          onClick={() => onNavigate('/user/bookings')}
          role="button"
          tabIndex={0}
        >
          <div style={kpiHeaderStyle}>
            <span style={kpiIconWrapStyle('#f5f3ff', '#ede9fe')}>
              <AppIcon name="file-text" size={17} color="#7c3aed" strokeWidth={2.2} />
            </span>
            <span style={kpiCategoryTagStyle}>SERVICE BOOKINGS</span>
          </div>
          <div style={kpiValueStyle}>
            Track Orders
          </div>
          <div style={kpiDescStyle}>
            Live technician GPS dispatch & history
          </div>
          <div style={kpiLinkStyle}>
            <span>View All Bookings</span>
            <span style={{ fontSize: '14px' }}>→</span>
          </div>
        </div>

        {/* KPI 4: Primary Address */}
        <div
          className="zc-profile-kpi-card"
          style={kpiCardStyle}
          onClick={() => onNavigate('/user/saved-addresses')}
          role="button"
          tabIndex={0}
        >
          <div style={kpiHeaderStyle}>
            <span style={kpiIconWrapStyle('#ecfdf5', '#d1fae5')}>
              <AppIcon name="map-pin" size={17} color="#059669" strokeWidth={2.4} />
            </span>
            <span style={kpiCategoryTagStyle}>PRIMARY ADDRESS</span>
          </div>
          <div style={kpiValueStyle} title={defaultAddr?.address || 'No address saved'}>
            {defaultAddr?.tag ? `${defaultAddr.tag} Location` : 'Saved Location'}
          </div>
          <div style={kpiDescStyle} title={defaultAddr?.address || 'No address saved'}>
            {defaultAddr?.address ? `${defaultAddr.address.slice(0, 32)}...` : 'No saved address added yet'}
          </div>
          <div style={kpiLinkStyle}>
            <span>Manage Addresses</span>
            <span style={{ fontSize: '14px' }}>→</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT (2-Column Architecture) */}
      <div style={mainGridStyle}>
        {/* LEFT COLUMN: User Identity, Security, & Credentials */}
        <div style={leftColStyle}>
          {/* Identity Card */}
          <div style={glassCardStyle}>
            <div style={avatarRowStyle}>
              <div style={avatarLargeWrapStyle(hasPlan ? userPlanTheme.badgeBorder : '#bfdbfe')}>
                <span style={avatarInitialsStyle}>{userInitials || 'U'}</span>
                {hasPlan && (
                  <span style={verifiedBadgePipStyle(userPlanTheme.badgeBorder)}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={userNameHeadingStyle}>
                    {isAnonymous ? 'Welcome' : isGuest ? 'Guest User' : (activeUser?.name || 'Rahul Sharma')}
                  </h2>
                  {hasPlan && (
                    <span style={planBadgePillStyle(userPlanTheme.badgeBg, userPlanTheme.badgeBorder, userPlanTheme.badgeTextColor)}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span>{activeUser?.subscription_plan} Member</span>
                    </span>
                  )}
                </div>

                <div style={contactListStyle}>
                  {Boolean(activeUser?.phone) && (
                    <div style={contactItemStyle}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0878f8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span style={contactTextStyle}>{formatPhoneNumber(activeUser.phone)}</span>
                      <span style={verifiedTickStyle}>Verified ✓</span>
                    </div>
                  )}

                  {Boolean(activeUser?.email) && (
                    <div style={contactItemStyle}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span style={contactTextStyle}>{activeUser.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="zc-desktop-btn-primary"
                style={editProfileBtnStyle}
                onClick={onOpenEditModal}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit Profile Information</span>
              </button>
            </div>
          </div>

          {/* Account Details & Security Summary */}
          <div style={glassCardStyle}>
            <div style={cardHeaderRowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AppIcon name="lock" size={16} color="#0878f8" strokeWidth={2.2} />
                <h3 style={cardTitleStyle}>Account Security & Verification</h3>
              </div>
            </div>

            <div style={securityListStyle}>
              <div style={securityRowStyle}>
                <span style={securityLabelStyle}>Property Verification</span>
                <span style={securityBadgeGreenStyle}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Approved Resident</span>
                </span>
              </div>

              <div style={securityRowStyle}>
                <span style={securityLabelStyle}>Two-Factor Authentication</span>
                <span style={securityBadgeBlueStyle}>Phone OTP Active</span>
              </div>

              <div style={securityRowStyle}>
                <span style={securityLabelStyle}>Zevota Account ID</span>
                <span style={securityValueStyle}>
                  {isGuest ? guestIdDisplay : `ZC-${String(activeUser?.id || 1).padStart(5, '0')}`}
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            className="zc-profile-logout-btn"
            style={logoutBtnStyle}
            onClick={onLogout}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Log Out Account</span>
          </button>
        </div>

        {/* RIGHT COLUMN: AMC Spotlight & Service Modules */}
        <div style={rightColStyle}>
          {/* AMC Spotlight Card */}
          <div style={amcSpotlightCardStyle}>
            <div style={amcSpotlightOverlayStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={amcSpotlightBadgeStyle}>
                  <span style={amcSpotlightDotStyle} />
                  <span>365-DAY ANNUAL MAINTENANCE COVERAGE</span>
                </div>
                <div style={{ fontSize: '13px', color: '#fef3c7', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                  {hasPlan ? `CURRENT PLAN: ${activeUser?.subscription_plan?.toUpperCase()}` : 'PLAN AVAILABLE'}
                </div>
              </div>

              <h3 style={amcSpotlightTitleStyle}>
                Complete peace of mind for every appliance in your home.
              </h3>

              <p style={amcSpotlightSubStyle}>
                Unlimited ₹0 service visits, free appliance health inspections, and priority emergency technician response 365 days a year.
              </p>

              <div style={amcPerksRowStyle}>
                <div style={amcPerkItemStyle}>
                  <div style={amcPerkIconStyle}>✓</div>
                  <span>₹0 Inspection Charge</span>
                </div>
                <div style={amcPerkItemStyle}>
                  <div style={amcPerkIconStyle}>✓</div>
                  <span>15-Minute Guaranteed Arrival</span>
                </div>
                <div style={amcPerkItemStyle}>
                  <div style={amcPerkIconStyle}>✓</div>
                  <span>Genuine OEM Spare Parts Warranty</span>
                </div>
              </div>

              <div style={amcActionsRowStyle}>
                <button
                  type="button"
                  className="zc-desktop-btn-primary"
                  style={amcPrimaryActionBtnStyle}
                  onClick={() => onNavigate('/user/my-amc')}
                >
                  <span>Manage AMC Pass</span>
                  <span style={{ fontSize: '14px' }}>→</span>
                </button>
                <button
                  type="button"
                  className="zc-desktop-btn-secondary"
                  style={amcSecondaryActionBtnStyle}
                  onClick={() => onNavigate('/user/plans')}
                >
                  <span>Explore All Plans & Tiers</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2-Module Subgrid: Saved Addresses & Live Support */}
          <div style={subgridStyle}>
            {/* Card 1: Saved Addresses Overview */}
            <div style={glassCardStyle}>
              <div style={cardHeaderRowStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AppIcon name="map-pin" size={16} color="#059669" strokeWidth={2.4} />
                  <h3 style={cardTitleStyle}>Saved Service Addresses</h3>
                </div>
                <span style={addressCountBadgeStyle}>{savedAddrs.length} Saved</span>
              </div>

              <div style={addressListStyle}>
                {savedAddrs.length > 0 ? (
                  savedAddrs.map((item) => (
                    <div key={item.id || item.address} style={addressRowItemStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={addressTagPillStyle(item.tag)}>
                          {item.tag || 'Address'}
                        </span>
                        {item.isDefault && (
                          <span style={defaultAddressBadgeStyle}>Default</span>
                        )}
                      </div>
                      <p style={addressRowTextStyle}>{item.address}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>
                    No saved addresses yet.
                  </div>
                )}
              </div>

              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  className="zc-desktop-btn-secondary"
                  style={moduleActionBtnStyle}
                  onClick={() => onNavigate('/user/saved-addresses')}
                >
                  <span>+ Manage & Add New Address</span>
                  <span style={{ fontSize: '13px' }}>→</span>
                </button>
              </div>
            </div>

            {/* Card 2: Live Support Console */}
            <div style={glassCardStyle}>
              <div style={cardHeaderRowStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <h3 style={cardTitleStyle}>24/7 Priority Operations Desk</h3>
                </div>
              </div>

              <div style={supportStatusRowStyle}>
                <span style={pulseGreenDotStyle} />
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#059669' }}>
                  Dispatcher Desk Online
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>• Avg Response &lt; 2 mins</span>
              </div>

              <p style={supportCardDescStyle}>
                Direct priority escalation channel with our dedicated Mumbai operations hub. Get instant support for live bookings, reschedule requests, or billing inquiries.
              </p>

              <div style={supportChannelsGridStyle}>
                <div style={supportChannelPillStyle}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0878f8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>1800-ZEVOTA</span>
                </div>
                <div style={supportChannelPillStyle}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  <span>Priority WhatsApp</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  className="zc-desktop-btn-primary"
                  style={moduleActionBtnPrimaryStyle}
                  onClick={() => onNavigate('/user/support')}
                >
                  <span>Open Live Support Console</span>
                  <span style={{ fontSize: '13px' }}>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. EDIT PERSONAL DETAILS MODAL DIALOG */}
      {editModalVisible && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={modalHeaderRowStyle}>
              <div>
                <h3 style={modalTitleStyle}>Edit Personal Details</h3>
                <p style={modalSubStyle}>Update profile information associated with your account.</p>
              </div>
              <button
                type="button"
                style={modalCloseBtnStyle}
                onClick={() => setEditModalVisible(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {errorMsg ? (
              <div style={errorAlertStyle}>
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            ) : null}

            {successMsg ? (
              <div style={successAlertStyle}>
                <span>✓</span>
                <span>{successMsg}</span>
              </div>
            ) : null}

            <div style={formGroupStyle}>
              <label style={formLabelStyle}>Full Name *</label>
              <input
                type="text"
                style={formInputStyle}
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Enter full name"
              />
            </div>

            <div style={formGroupStyle}>
              <label style={formLabelStyle}>Email Address *</label>
              <input
                type="email"
                style={formInputStyle}
                value={editEmail}
                onChange={(e) => {
                  setEditEmail(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="name@example.com"
              />
            </div>

            <div style={formGroupStyle}>
              <label style={formLabelStyle}>Mobile Number *</label>
              <div style={phoneInputRowStyle}>
                <span style={phoneCodeBadgeStyle}>+91</span>
                <input
                  type="tel"
                  style={phoneInputFieldStyle}
                  value={editPhone}
                  onChange={(e) => {
                    setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                    setErrorMsg('');
                  }}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
              </div>
            </div>

            <div style={modalFooterRowStyle}>
              <button
                type="button"
                style={modalCancelBtnStyle}
                onClick={() => setEditModalVisible(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="zc-desktop-btn-primary"
                style={modalSaveBtnStyle}
                onClick={handleSavePersonalDetails}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. GUEST ACTION MODAL */}
      {showGuestModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContentStyle, maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', border: '1px solid #bfdbfe' }}>
              <AppIcon name="lock" size={22} color="#0878f8" strokeWidth={2.4} />
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif", marginBottom: '8px' }}>
              Registration Required
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
              Please sign in or create an account to edit personal details and access saved addresses.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                style={modalCancelBtnStyle}
                onClick={() => setShowGuestModal(false)}
              >
                Continue Browsing
              </button>
              <button
                type="button"
                className="zc-desktop-btn-primary"
                style={modalSaveBtnStyle}
                onClick={() => {
                  setShowGuestModal(false);
                  onNavigate('/user/login');
                }}
              >
                Sign In / Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   STYLES: Modern Luxury Desktop Profile Web View
   ============================================================ */

const wrapperStyle = {
  width: '100%',
  paddingTop: '24px',
  paddingBottom: '48px',
  fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
  boxSizing: 'border-box',
};

const headerRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '24px',
  marginBottom: '28px',
  flexWrap: 'wrap',
};

const headerLeftColStyle = {
  flex: 1,
  minWidth: '320px',
};

const headerRightColStyle = {
  display: 'flex',
  alignItems: 'center',
  paddingTop: '8px',
};

const backBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#ffffff',
  color: '#0878f8',
  border: '1px solid #bfdbfe',
  borderRadius: '12px',
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  boxShadow: '0 2px 6px rgba(8, 120, 248, 0.08)',
};

const pageTitleStyle = {
  fontSize: '32px',
  fontWeight: 800,
  color: '#0f172a',
  letterSpacing: '-0.8px',
  margin: '0 0 6px 0',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

const pageSubtextStyle = {
  fontSize: '14.5px',
  color: '#64748b',
  lineHeight: 1.5,
  margin: 0,
  maxWidth: '680px',
};

const memberStatusPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#ffffff',
  border: '1.2px solid #e2e8f0',
  borderRadius: '30px',
  padding: '8px 18px',
  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
  fontSize: '13px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const statusDotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '4px',
  backgroundColor: '#10b981',
  boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
};

/* KPI Summary Cards */
const kpiGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '20px',
  marginBottom: '32px',
};

const kpiCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  padding: '20px 22px',
  border: '1.5px solid rgba(226, 232, 240, 0.85)',
  boxShadow: '0 10px 28px -6px rgba(15, 23, 42, 0.05), 0 2px 6px rgba(15, 23, 42, 0.02)',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: 'transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.24s ease, border-color 0.2s ease',
  boxSizing: 'border-box',
};

const kpiHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '14px',
};

const kpiIconWrapStyle = (bg, border) => ({
  width: '38px',
  height: '38px',
  borderRadius: '12px',
  backgroundColor: bg,
  border: `1px solid ${border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const kpiCategoryTagStyle = {
  fontSize: '11px',
  fontWeight: 800,
  color: '#64748b',
  letterSpacing: '0.6px',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

const kpiValueStyle = {
  fontSize: '18px',
  fontWeight: 900,
  color: '#0f172a',
  lineHeight: 1.25,
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  marginBottom: '4px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const kpiDescStyle = {
  fontSize: '12px',
  color: '#64748b',
  lineHeight: 1.4,
  marginBottom: '14px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const kpiLinkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12.5px',
  fontWeight: 700,
  color: '#0878f8',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

/* Main Grid Layout */
const mainGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1.05fr 1.95fr',
  gap: '28px',
  alignItems: 'start',
};

const leftColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const rightColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

/* Glass Card */
const glassCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '22px',
  padding: '24px 26px',
  border: '1.5px solid rgba(226, 232, 240, 0.85)',
  boxShadow: '0 12px 32px -8px rgba(15, 23, 42, 0.05), 0 2px 8px rgba(15, 23, 42, 0.02)',
  boxSizing: 'border-box',
};

/* Avatar & Identity */
const avatarRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '18px',
};

const avatarLargeWrapStyle = (borderColor) => ({
  width: '74px',
  height: '74px',
  borderRadius: '37px',
  backgroundColor: '#0878f8',
  background: 'linear-gradient(135deg, #0878f8 0%, #034bb0 100%)',
  border: `3px solid ${borderColor || '#bfdbfe'}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  boxShadow: '0 8px 20px rgba(8, 120, 248, 0.28)',
  flexShrink: 0,
});

const avatarInitialsStyle = {
  fontSize: '24px',
  fontWeight: 900,
  color: '#ffffff',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

const verifiedBadgePipStyle = (badgeColor) => ({
  position: 'absolute',
  bottom: '-2px',
  right: '-2px',
  width: '22px',
  height: '22px',
  borderRadius: '11px',
  backgroundColor: badgeColor || '#f59e0b',
  border: '2px solid #ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const userNameHeadingStyle = {
  fontSize: '22px',
  fontWeight: 900,
  color: '#0f172a',
  margin: 0,
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  letterSpacing: '-0.3px',
};

const planBadgePillStyle = (bg, border, text) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  backgroundColor: bg || '#fef3c7',
  border: `1px solid ${border || '#fde68a'}`,
  borderRadius: '20px',
  padding: '3px 10px',
  fontSize: '11px',
  fontWeight: 800,
  color: text || '#92400e',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
});

const contactListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginTop: '10px',
};

const contactItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const contactTextStyle = {
  fontSize: '13px',
  color: '#334155',
  fontWeight: 600,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const verifiedTickStyle = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#059669',
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '10px',
  padding: '1px 7px',
};

const editProfileBtnStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  backgroundColor: '#0878f8',
  color: '#ffffff',
  border: 'none',
  borderRadius: '14px',
  padding: '12px 20px',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  boxShadow: '0 6px 18px rgba(8, 120, 248, 0.3)',
};

/* Security Card */
const cardHeaderRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '16px',
};

const cardTitleStyle = {
  fontSize: '15.5px',
  fontWeight: 800,
  color: '#0f172a',
  margin: 0,
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

const securityListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const securityRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
};

const securityLabelStyle = {
  fontSize: '12.5px',
  color: '#64748b',
  fontWeight: 600,
};

const securityBadgeGreenStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '14px',
  padding: '3px 10px',
  fontSize: '11.5px',
  fontWeight: 700,
  color: '#059669',
};

const securityBadgeBlueStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '14px',
  padding: '3px 10px',
  fontSize: '11.5px',
  fontWeight: 700,
  color: '#0878f8',
};

const securityValueStyle = {
  fontSize: '12.5px',
  fontWeight: 700,
  color: '#0f172a',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

const logoutBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  backgroundColor: '#fef2f2',
  color: '#dc2626',
  border: '1.2px solid #fecaca',
  borderRadius: '16px',
  padding: '13px 24px',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.06)',
};

/* AMC Spotlight Card */
const amcSpotlightCardStyle = {
  position: 'relative',
  borderRadius: '24px',
  overflow: 'hidden',
  background: 'linear-gradient(135deg, #091e48 0%, #03102e 55%, #05163f 100%)',
  border: '2px solid rgba(191, 219, 254, 0.45)',
  boxShadow: '0 20px 48px -10px rgba(9, 30, 72, 0.45), 0 4px 16px rgba(15, 23, 42, 0.1)',
  boxSizing: 'border-box',
};

const amcSpotlightOverlayStyle = {
  padding: '32px 34px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const amcSpotlightBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: 'rgba(255, 255, 255, 0.12)',
  border: '1px solid rgba(255, 255, 255, 0.22)',
  borderRadius: '20px',
  padding: '4px 14px',
  fontSize: '11px',
  fontWeight: 800,
  color: '#93c5fd',
  letterSpacing: '0.8px',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

const amcSpotlightDotStyle = {
  width: '6px',
  height: '6px',
  borderRadius: '3px',
  backgroundColor: '#38bdf8',
  boxShadow: '0 0 8px #38bdf8',
};

const amcSpotlightTitleStyle = {
  fontSize: '26px',
  fontWeight: 900,
  color: '#ffffff',
  lineHeight: 1.25,
  letterSpacing: '-0.4px',
  margin: 0,
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  maxWidth: '680px',
};

const amcSpotlightSubStyle = {
  fontSize: '14px',
  color: 'rgba(226, 232, 240, 0.9)',
  lineHeight: 1.55,
  margin: 0,
  maxWidth: '640px',
};

const amcPerksRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
  margin: '6px 0 10px 0',
};

const amcPerkItemStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 600,
};

const amcPerkIconStyle = {
  width: '18px',
  height: '18px',
  borderRadius: '9px',
  backgroundColor: 'rgba(56, 189, 248, 0.22)',
  color: '#38bdf8',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  fontWeight: 800,
};

const amcActionsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  flexWrap: 'wrap',
};

const amcPrimaryActionBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#0878f8',
  color: '#ffffff',
  border: 'none',
  borderRadius: '14px',
  padding: '13px 26px',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  boxShadow: '0 8px 24px rgba(8, 120, 248, 0.45)',
};

const amcSecondaryActionBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
  border: '1.2px solid rgba(255, 255, 255, 0.28)',
  borderRadius: '14px',
  padding: '13px 22px',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

/* Subgrid for Addresses & Support */
const subgridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '24px',
};

const addressCountBadgeStyle = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#059669',
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '12px',
  padding: '2px 8px',
};

const addressListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  minHeight: '120px',
};

const addressRowItemStyle = {
  padding: '12px 14px',
  backgroundColor: '#f8fafc',
  borderRadius: '14px',
  border: '1px solid #e2e8f0',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const addressTagPillStyle = (tag) => ({
  fontSize: '11px',
  fontWeight: 800,
  color: tag === 'Office' ? '#059669' : '#0878f8',
  backgroundColor: tag === 'Office' ? '#ecfdf5' : '#eff6ff',
  border: `1px solid ${tag === 'Office' ? '#a7f3d0' : '#bfdbfe'}`,
  borderRadius: '8px',
  padding: '2px 8px',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
});

const defaultAddressBadgeStyle = {
  fontSize: '10.5px',
  fontWeight: 700,
  color: '#059669',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3px',
};

const addressRowTextStyle = {
  fontSize: '12.5px',
  color: '#334155',
  lineHeight: 1.4,
  margin: 0,
};

const moduleActionBtnStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  backgroundColor: '#f8fafc',
  color: '#0878f8',
  border: '1px dashed #93c5fd',
  borderRadius: '12px',
  padding: '11px 18px',
  fontSize: '13.5px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

const supportStatusRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '10px',
};

const pulseGreenDotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '4px',
  backgroundColor: '#10b981',
  boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)',
};

const supportCardDescStyle = {
  fontSize: '12.5px',
  color: '#64748b',
  lineHeight: 1.5,
  margin: '0 0 14px 0',
};

const supportChannelsGridStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap',
  marginBottom: '10px',
};

const supportChannelPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '6px 12px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#334155',
};

const moduleActionBtnPrimaryStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  backgroundColor: '#6366f1',
  color: '#ffffff',
  border: 'none',
  borderRadius: '12px',
  padding: '11px 18px',
  fontSize: '13.5px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  boxShadow: '0 6px 18px rgba(99, 102, 241, 0.28)',
};

/* Modals */
const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  padding: '20px',
  boxSizing: 'border-box',
};

const modalContentStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '24px',
  padding: '32px',
  width: '100%',
  maxWidth: '520px',
  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.25)',
  border: '1.5px solid rgba(191, 219, 254, 0.8)',
  boxSizing: 'border-box',
};

const modalHeaderRowStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '16px',
  marginBottom: '20px',
};

const modalTitleStyle = {
  fontSize: '20px',
  fontWeight: 800,
  color: '#0f172a',
  margin: '0 0 4px 0',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

const modalSubStyle = {
  fontSize: '13px',
  color: '#64748b',
  margin: 0,
};

const modalCloseBtnStyle = {
  background: '#f1f5f9',
  border: 'none',
  borderRadius: '50%',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  color: '#64748b',
  cursor: 'pointer',
};

const formGroupStyle = {
  marginBottom: '16px',
};

const formLabelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 700,
  color: '#334155',
  marginBottom: '6px',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

const formInputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1.5px solid #cbd5e1',
  fontSize: '14px',
  color: '#0f172a',
  outline: 'none',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  boxSizing: 'border-box',
};

const phoneInputRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const phoneCodeBadgeStyle = {
  backgroundColor: '#f1f5f9',
  border: '1.5px solid #cbd5e1',
  borderRadius: '12px',
  padding: '12px 14px',
  fontSize: '14px',
  fontWeight: 700,
  color: '#334155',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

const phoneInputFieldStyle = {
  flex: 1,
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1.5px solid #cbd5e1',
  fontSize: '14px',
  color: '#0f172a',
  outline: 'none',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  boxSizing: 'border-box',
};

const modalFooterRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '12px',
  marginTop: '24px',
  paddingTop: '18px',
  borderTop: '1px solid #e2e8f0',
};

const modalCancelBtnStyle = {
  backgroundColor: '#f8fafc',
  color: '#475569',
  border: '1.2px solid #cbd5e1',
  borderRadius: '12px',
  padding: '11px 20px',
  fontSize: '13.5px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
};

const modalSaveBtnStyle = {
  backgroundColor: '#0878f8',
  color: '#ffffff',
  border: 'none',
  borderRadius: '12px',
  padding: '11px 24px',
  fontSize: '13.5px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
  boxShadow: '0 6px 18px rgba(8, 120, 248, 0.35)',
};

const errorAlertStyle = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  color: '#dc2626',
  borderRadius: '12px',
  padding: '10px 14px',
  fontSize: '13px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '16px',
};

const successAlertStyle = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  color: '#059669',
  borderRadius: '12px',
  padding: '10px 14px',
  fontSize: '13px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '16px',
};
