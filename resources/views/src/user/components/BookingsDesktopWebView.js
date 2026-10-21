import React, { useState, useMemo } from 'react';

function getStatusBadgeStyle(status, isConsult) {
  switch (status) {
    case 'BOOKING_COMPLETED':
      return {
        bg: '#ecfdf5',
        color: '#065f46',
        border: '#a7f3d0',
        label: isConsult ? 'Consultation Completed' : 'Completed',
        icon: '✓',
      };
    case 'SERVICE_IN_PROGRESS':
      return {
        bg: '#eff6ff',
        color: '#1d4ed8',
        border: '#bfdbfe',
        label: isConsult ? 'Diagnosis In Progress' : 'In Progress',
        icon: '⚙',
      };
    case 'AWAITING_USER_APPROVAL':
      return {
        bg: '#fffbeb',
        color: '#b45309',
        border: '#fde68a',
        label: isConsult ? 'Quote Ready' : 'Awaiting Approval',
        icon: '⚠',
      };
    case 'PROVIDER_EN_ROUTE':
      return {
        bg: '#f0fdf4',
        color: '#15803d',
        border: '#bbf7d0',
        label: 'Technician En Route',
        icon: '🚗',
      };
    case 'PROVIDER_ASSIGNED':
      return {
        bg: '#f8fafc',
        color: '#334155',
        border: '#cbd5e1',
        label: 'Technician Assigned',
        icon: '👤',
      };
    case 'ESTIMATE_REJECTED':
      return {
        bg: '#f1f5f9',
        color: '#64748b',
        border: '#e2e8f0',
        label: isConsult ? 'Concluded (₹0)' : 'Estimate Declined',
        icon: '✕',
      };
    case 'CANCELLED':
      return {
        bg: '#fef2f2',
        color: '#991b1b',
        border: '#fecaca',
        label: 'Cancelled',
        icon: '✕',
      };
    default:
      return {
        bg: '#eff6ff',
        color: '#2563eb',
        border: '#bfdbfe',
        label: 'Confirmed',
        icon: '•',
      };
  }
}

export default function BookingsDesktopWebView({ bookings = [], onNavigate, formatStatus }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. KPI Counts
  const stats = useMemo(() => {
    let total = bookings.length;
    let active = 0;
    let awaitingApproval = 0;
    let completed = 0;

    bookings.forEach((b) => {
      const s = b.status;
      if (s === 'AWAITING_USER_APPROVAL') {
        awaitingApproval++;
        active++;
      } else if (
        s === 'BOOKING_CREATED' ||
        s === 'PROVIDER_ASSIGNED' ||
        s === 'PROVIDER_EN_ROUTE' ||
        s === 'SERVICE_IN_PROGRESS'
      ) {
        active++;
      } else if (s === 'BOOKING_COMPLETED') {
        completed++;
      }
    });

    return { total, active, awaitingApproval, completed };
  }, [bookings]);

  // 2. Filter & Search
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const isConsult = Boolean(b.isConsultation || b.booking_mode === 'consultation');
      const s = b.status;

      // Status filter
      if (activeFilter === 'ACTIVE') {
        if (
          s !== 'BOOKING_CREATED' &&
          s !== 'PROVIDER_ASSIGNED' &&
          s !== 'PROVIDER_EN_ROUTE' &&
          s !== 'SERVICE_IN_PROGRESS' &&
          s !== 'AWAITING_USER_APPROVAL'
        ) {
          return false;
        }
      } else if (activeFilter === 'APPROVAL') {
        if (s !== 'AWAITING_USER_APPROVAL') return false;
      } else if (activeFilter === 'COMPLETED') {
        if (s !== 'BOOKING_COMPLETED') return false;
      } else if (activeFilter === 'CONSULTATION') {
        if (!isConsult) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = (b.booking_id || '').toLowerCase().includes(q);
        const serviceMatch = (b.service_name || '').toLowerCase().includes(q);
        const catMatch = (b.category_name || '').toLowerCase().includes(q);
        const subCatMatch = (b.sub_category_name || '').toLowerCase().includes(q);
        const provMatch = (b.provider_name || '').toLowerCase().includes(q);
        if (!idMatch && !serviceMatch && !catMatch && !subCatMatch && !provMatch) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, activeFilter, searchQuery]);

  return (
    <div className="bookings-desktop-web-wrap" style={wrapperStyle}>
      {/* 1. TOP HEADER & ACTION */}
      <div style={headerRowStyle}>
        <div>
          <button
            type="button"
            className="zc-desktop-btn-secondary"
            style={backBtnStyle}
            onClick={() => onNavigate('/user/home')}
            title="Back to Home"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Home</span>
          </button>
          <h1 style={pageTitleStyle}>My Bookings & Requests</h1>
          <p style={pageSubtextStyle}>
            Track real-time technician arrival, review upfront quotes, and inspect your service history.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            className="zc-desktop-btn-primary"
            style={newBookingBtnStyle}
            onClick={() => onNavigate('/user/bookings/new', { state: {} })}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Book New Service</span>
          </button>
        </div>
      </div>

      {/* 2. KPI METRICS RIBBON */}
      <div style={kpiGridStyle}>
        <div style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiIconWrapStyle('#eff6ff', '#dbeafe')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </span>
            <span style={kpiBadgeStyle('#f1f5f9', '#475569')}>All Time</span>
          </div>
          <div style={kpiValueStyle}>{stats.total}</div>
          <div style={kpiLabelStyle}>Total Service Requests</div>
        </div>

        <div style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiIconWrapStyle('#f0fdf4', '#bbf7d0')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <span style={kpiBadgeStyle('#dcfce7', '#15803d')}>Live</span>
          </div>
          <div style={kpiValueStyle}>{stats.active}</div>
          <div style={kpiLabelStyle}>Active & Dispatched</div>
        </div>

        <div style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiIconWrapStyle('#fffbeb', '#fde68a')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            {stats.awaitingApproval > 0 ? (
              <span style={kpiBadgeStyle('#fef3c7', '#b45309')}>Action Needed</span>
            ) : (
              <span style={kpiBadgeStyle('#f8fafc', '#64748b')}>0 Pending</span>
            )}
          </div>
          <div style={kpiValueStyle}>{stats.awaitingApproval}</div>
          <div style={kpiLabelStyle}>Quotes Awaiting Approval</div>
        </div>

        <div style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiIconWrapStyle('#ecfdf5', '#a7f3d0')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </span>
            <span style={kpiBadgeStyle('#d1fae5', '#065f46')}>Done</span>
          </div>
          <div style={kpiValueStyle}>{stats.completed}</div>
          <div style={kpiLabelStyle}>Completed Repairs</div>
        </div>
      </div>

      {/* 3. FILTER TABS & SEARCH BAR */}
      <div style={filterBarWrapStyle}>
        <div style={tabsRowStyle}>
          {[
            { id: 'ALL', label: 'All Bookings', count: stats.total },
            { id: 'ACTIVE', label: 'Active', count: stats.active },
            { id: 'APPROVAL', label: 'Awaiting Quote', count: stats.awaitingApproval },
            { id: 'COMPLETED', label: 'Completed', count: stats.completed },
            { id: 'CONSULTATION', label: 'Free Consultations' },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className="zc-tab-btn"
                style={tabBtnStyle(isActive)}
                onClick={() => setActiveFilter(tab.id)}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span style={tabCountStyle(isActive)}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={searchBoxStyle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by ID, appliance, or technician..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={searchClearBtnStyle}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 4. BOOKINGS CARDS GRID */}
      {filteredBookings.length === 0 ? (
        <div style={emptyCardStyle}>
          <div style={emptyIconWrapStyle}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h3 style={emptyTitleStyle}>
            {searchQuery || activeFilter !== 'ALL'
              ? 'No matching service bookings found'
              : 'You have no bookings yet'}
          </h3>
          <p style={emptyDescStyle}>
            {searchQuery || activeFilter !== 'ALL'
              ? 'Try adjusting your search terms or filter selection to view your requests.'
              : 'Keep your home running effortlessly. Schedule an expert repair technician, breakdown diagnostic, or annual maintenance service.'}
          </p>
          <button
            type="button"
            className="zc-desktop-btn-primary"
            style={{ ...newBookingBtnStyle, alignSelf: 'center', marginTop: '8px' }}
            onClick={() => onNavigate('/user/bookings/new', { state: {} })}
          >
            Explore Services & Book
          </button>
        </div>
      ) : (
        <div style={cardsGridStyle}>
          {filteredBookings.map((booking) => {
            const isConsult = Boolean(
              booking.isConsultation || booking.booking_mode === 'consultation'
            );
            const badge = getStatusBadgeStyle(booking.status, isConsult);
            const needsRating =
              booking.status === 'BOOKING_COMPLETED' &&
              !booking.user_rating &&
              !booking.rating_skipped;

            const totalQuote =
              booking.total_bill ??
              Number(booking.parts_charge || 0) + Number(booking.labour_charge || 0);

            return (
              <div
                key={booking.booking_id}
                className="zc-booking-desktop-card"
                style={bookingCardStyle}
                onClick={() => onNavigate(`/user/bookings/${booking.booking_id}`)}
                role="button"
                tabIndex={0}
              >
                {/* Card Top: Service Title & Badge */}
                <div style={cardHeaderRowStyle}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={categoryBreadcrumbStyle}>
                      <span>{booking.category_name || 'Home Service'}</span>
                      {booking.sub_category_name && (
                        <>
                          <span style={{ color: '#cbd5e1' }}>›</span>
                          <span>{booking.sub_category_name}</span>
                        </>
                      )}
                    </div>
                    <h3 style={serviceNameStyle} title={booking.service_name}>
                      {booking.service_name}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    {isConsult && (
                      <span style={freeConsultBadgeStyle}>FREE DIAGNOSIS @ ₹0</span>
                    )}
                    <span style={statusPillStyle(badge.bg, badge.color, badge.border)}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                  </div>
                </div>

                {/* Card Meta Row: ID & Schedule */}
                <div style={cardMetaRowStyle}>
                  <div style={bookingIdPillStyle}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>ID: {booking.booking_id}</span>
                  </div>

                  <div style={bookingDateStyle}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{booking.scheduled_date || 'Today'}</span>
                  </div>
                </div>

                {/* Upfront Quote Action Box (if awaiting approval) */}
                {booking.status === 'AWAITING_USER_APPROVAL' && (
                  <div style={quoteBannerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={quotePulseDotStyle} />
                      <div>
                        <div style={quoteTitleStyle}>Upfront Technician Quote Ready</div>
                        <div style={quoteSubStyle}>
                          Estimated Total: <b style={{ color: '#92400e', fontSize: '14px' }}>₹{Number(totalQuote).toLocaleString()}</b> • Review & approve before repair begins
                        </div>
                      </div>
                    </div>
                    <span style={quoteActionArrowStyle}>Approve →</span>
                  </div>
                )}

                {/* Completion OTP Alert (if service in progress) */}
                {booking.status === 'SERVICE_IN_PROGRESS' && booking.completion_otp && (
                  <div style={otpBannerStyle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>
                      Completion Security OTP: <b style={{ letterSpacing: '2px', fontSize: '14px', color: '#1e40af' }}>{booking.completion_otp}</b> (Share with technician only when work is done)
                    </span>
                  </div>
                )}

                {/* Technician Info Bar */}
                <div style={technicianBarStyle}>
                  <div style={techAvatarStyle}>
                    {booking.provider_name ? booking.provider_name.charAt(0) : 'T'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={techNameStyle}>
                      {booking.provider_name || 'Assigned Certified Professional'}
                    </div>
                    <div style={techTradeStyle}>
                      {booking.provider_trade || 'Verified Technician'} •{' '}
                      <span style={{ color: '#d97706', fontWeight: 700 }}>
                        ★ {booking.provider_rating || '4.9'}
                      </span>
                    </div>
                  </div>

                  <div style={cardActionWrapStyle}>
                    {needsRating && (
                      <button
                        type="button"
                        style={rateBtnStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(`/user/bookings/${booking.booking_id}/rate`);
                        }}
                      >
                        Rate Service ★
                      </button>
                    )}
                    {!!booking.user_rating && (
                      <span style={ratedBadgeStyle}>
                        Rated {'★'.repeat(booking.user_rating)}
                      </span>
                    )}
                    <span style={viewDetailsBtnStyle}>
                      <span>Track Details</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Injected Hover and Interactive Transitions */}
      <style>{`
        .zc-tab-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .zc-desktop-btn-primary {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .zc-desktop-btn-primary:hover {
          background-color: #1d4ed8 !important;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3) !important;
        }
        .zc-desktop-btn-secondary {
          transition: all 0.2s ease;
        }
        .zc-desktop-btn-secondary:hover {
          background-color: #f1f5f9 !important;
          border-color: #94a3b8 !important;
        }
        .zc-booking-desktop-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          cursor: pointer;
        }
        .zc-booking-desktop-card:hover {
          transform: translateY(-2px);
          border-color: #93c5fd !important;
          box-shadow: 0 16px 36px -8px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.03) !important;
        }
      `}</style>
    </div>
  );
}

// ---------------- STYLES OBJECTS ----------------

const wrapperStyle = {
  width: '100%',
  paddingTop: '28px',
  paddingBottom: '80px',
  boxSizing: 'border-box',
  fontFamily: "'Inter', -apple-system, sans-serif",
};

const headerRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: '16px',
  marginBottom: '28px',
};

const backBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  height: '36px',
  padding: '0 14px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  color: '#334155',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  marginBottom: '14px',
};

const pageTitleStyle = {
  fontSize: '30px',
  fontWeight: '800',
  color: '#0f172a',
  letterSpacing: '-0.8px',
  margin: '0 0 6px 0',
  lineHeight: 1.2,
};

const pageSubtextStyle = {
  fontSize: '14.5px',
  color: '#64748b',
  lineHeight: '22px',
  margin: 0,
};

const newBookingBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  height: '44px',
  padding: '0 20px',
  borderRadius: '12px',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '700',
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
};

const kpiGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: '18px',
  marginBottom: '32px',
};

const kpiCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const kpiHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
};

const kpiIconWrapStyle = (bg, border) => ({
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  backgroundColor: bg,
  border: `1px solid ${border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const kpiBadgeStyle = (bg, color) => ({
  fontSize: '11px',
  fontWeight: '700',
  padding: '3px 8px',
  borderRadius: '999px',
  backgroundColor: bg,
  color: color,
});

const kpiValueStyle = {
  fontSize: '28px',
  fontWeight: '800',
  color: '#0f172a',
  letterSpacing: '-0.5px',
  lineHeight: 1,
};

const kpiLabelStyle = {
  fontSize: '13px',
  color: '#64748b',
  fontWeight: '500',
};

const filterBarWrapStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
  marginBottom: '24px',
};

const tabsRowStyle = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
};

const tabBtnStyle = (active) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  height: '38px',
  padding: '0 16px',
  borderRadius: '10px',
  fontSize: '13.5px',
  fontWeight: active ? '700' : '600',
  border: active ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
  backgroundColor: active ? '#eff6ff' : '#ffffff',
  color: active ? '#1d4ed8' : '#64748b',
  cursor: 'pointer',
});

const tabCountStyle = (active) => ({
  fontSize: '11px',
  fontWeight: '800',
  padding: '1px 7px',
  borderRadius: '999px',
  backgroundColor: active ? '#2563eb' : '#f1f5f9',
  color: active ? '#ffffff' : '#475569',
});

const searchBoxStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  height: '38px',
  padding: '0 14px',
  borderRadius: '10px',
  backgroundColor: '#ffffff',
  border: '1px solid #cbd5e1',
  minWidth: '280px',
};

const searchInputStyle = {
  border: 'none',
  outline: 'none',
  fontSize: '13px',
  color: '#0f172a',
  width: '100%',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
};

const searchClearBtnStyle = {
  border: 'none',
  background: 'none',
  color: '#94a3b8',
  fontSize: '12px',
  cursor: 'pointer',
  padding: 0,
};

const cardsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '20px',
};

const bookingCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '18px',
  border: '1.5px solid #e2e8f0',
  padding: '22px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.03)',
  boxSizing: 'border-box',
};

const cardHeaderRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '12px',
};

const categoryBreadcrumbStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  fontWeight: '600',
  color: '#2563eb',
  marginBottom: '4px',
};

const serviceNameStyle = {
  fontSize: '17px',
  fontWeight: '700',
  color: '#0f172a',
  margin: 0,
  lineHeight: '23px',
};

const freeConsultBadgeStyle = {
  fontSize: '10px',
  fontWeight: '800',
  padding: '3px 8px',
  borderRadius: '999px',
  backgroundColor: '#ecfdf5',
  color: '#047857',
  border: '1px solid #a7f3d0',
};

const statusPillStyle = (bg, color, border) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  fontSize: '11.5px',
  fontWeight: '700',
  padding: '4px 10px',
  borderRadius: '999px',
  backgroundColor: bg,
  color: color,
  border: `1px solid ${border}`,
  whiteSpace: 'nowrap',
});

const cardMetaRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
};

const bookingIdPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  fontSize: '12px',
  fontWeight: '600',
  color: '#475569',
  backgroundColor: '#f8fafc',
  padding: '4px 8px',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
};

const bookingDateStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12.5px',
  color: '#334155',
  fontWeight: '500',
};

const quoteBannerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '12px',
  padding: '12px 14px',
  gap: '10px',
};

const quotePulseDotStyle = {
  width: '10px',
  height: '10px',
  borderRadius: '5px',
  backgroundColor: '#d97706',
  flexShrink: 0,
};

const quoteTitleStyle = {
  fontSize: '12.5px',
  fontWeight: '700',
  color: '#92400e',
};

const quoteSubStyle = {
  fontSize: '12px',
  color: '#b45309',
  marginTop: '2px',
};

const quoteActionArrowStyle = {
  fontSize: '12.5px',
  fontWeight: '700',
  color: '#b45309',
  whiteSpace: 'nowrap',
};

const otpBannerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '12.5px',
  color: '#1d4ed8',
};

const technicianBarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  paddingTop: '12px',
  borderTop: '1px solid #f1f5f9',
};

const techAvatarStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '18px',
  backgroundColor: '#0f172a',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '800',
  fontSize: '14px',
};

const techNameStyle = {
  fontSize: '13.5px',
  fontWeight: '700',
  color: '#0f172a',
};

const techTradeStyle = {
  fontSize: '12px',
  color: '#64748b',
  marginTop: '1px',
};

const cardActionWrapStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const rateBtnStyle = {
  fontSize: '12px',
  fontWeight: '700',
  padding: '6px 12px',
  borderRadius: '8px',
  backgroundColor: '#2563eb',
  color: '#ffffff',
  border: 'none',
  cursor: 'pointer',
};

const ratedBadgeStyle = {
  fontSize: '12px',
  fontWeight: '700',
  color: '#d97706',
  backgroundColor: '#fef3c7',
  padding: '4px 8px',
  borderRadius: '6px',
};

const viewDetailsBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '13px',
  fontWeight: '700',
  color: '#2563eb',
};

const emptyCardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  border: '1.5px dashed #cbd5e1',
  padding: '50px 30px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: '12px',
};

const emptyIconWrapStyle = {
  width: '72px',
  height: '72px',
  borderRadius: '36px',
  backgroundColor: '#eff6ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '6px',
};

const emptyTitleStyle = {
  fontSize: '20px',
  fontWeight: '800',
  color: '#0f172a',
  margin: 0,
};

const emptyDescStyle = {
  fontSize: '14px',
  color: '#64748b',
  maxWidth: '460px',
  lineHeight: '22px',
  margin: 0,
};
