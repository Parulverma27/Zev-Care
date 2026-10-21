import React from 'react';
import { useNavigate } from 'react-router-dom';
import ZevotaLogo from '../../components/ZevotaLogo';
import { AppIcon } from '../../components/AppIcons';

export default function DesktopUserFooter() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="desktop-web-footer" style={footerContainerStyle} role="contentinfo">
      <div style={footerInnerStyle}>
        {/* Col 1: Brand Column with Prominent Bigger Logo */}
        <div style={brandColStyle}>
          <div style={brandHeaderRowStyle}>
            <ZevotaLogo size="large" />
            <div style={brandTextWrapStyle}>
              <span style={brandTitleStyle}>ZEVOTA CARE</span>
              <span style={brandSubStyle}>Home Services & AMC</span>
            </div>
          </div>
          <p style={brandDescStyle}>
            Reliable home maintenance, repair, and annual coverage designed to make everyday living effortless.
          </p>
          <div style={badgeRowStyle}>
            <span style={trustBadgePillStyle}>
              <div style={badgeIconCircleStyle}>
                <AppIcon name="check" size={12} color="#0878f8" strokeWidth={3} />
              </div>
              <span>Verified Technicians</span>
            </span>
            <span style={trustBadgePillStyle}>
              <div style={badgeIconCircleStyle}>
                <AppIcon name="check" size={12} color="#0878f8" strokeWidth={3} />
              </div>
              <span>100% Transparent Pricing</span>
            </span>
          </div>
        </div>

        {/* Col 2: Services Column (Electrician, Plumbing, Carpentry, Dry Cleaning, Pest Control) */}
        <div style={colStyle}>
          <h4 style={colHeadingStyle}>Services</h4>
          <ul style={linkListStyle}>
            <li>
              <button
                type="button"
                className="zc-footer-link-btn"
                style={footerLinkBtnStyle}
                onClick={() => navigate('/user/bookings/new', { state: { preSelectedCategory: 'Electrician' } })}
              >
                <span>Electrician</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="zc-footer-link-btn"
                style={footerLinkBtnStyle}
                onClick={() => navigate('/user/bookings/new', { state: { preSelectedCategory: 'Plumber' } })}
              >
                <span>Plumbing</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="zc-footer-link-btn"
                style={footerLinkBtnStyle}
                onClick={() => navigate('/user/bookings/new', { state: { preSelectedCategory: 'Carpenter' } })}
              >
                <span>Carpentry</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="zc-footer-link-btn"
                style={footerLinkBtnStyle}
                onClick={() => navigate('/user/bookings/new', { state: { preSelectedCategory: 'Dry Cleaning' } })}
              >
                <span>Dry Cleaning</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="zc-footer-link-btn"
                style={footerLinkBtnStyle}
                onClick={() => navigate('/user/bookings/new', { state: { preSelectedCategory: 'Pest Control' } })}
              >
                <span>Pest Control</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: AMC & Support Column */}
        <div style={colStyle}>
          <h4 style={colHeadingStyle}>AMC & Support</h4>
          <ul style={linkListStyle}>
            <li>
              <button type="button" className="zc-footer-link-btn" style={footerLinkBtnStyle} onClick={() => navigate('/user/plans')}>
                <span>Explore AMC Plans</span>
              </button>
            </li>
            <li>
              <button type="button" className="zc-footer-link-btn" style={footerLinkBtnStyle} onClick={() => navigate('/user/my-amc')}>
                <span>AMC Wallet & Pass</span>
              </button>
            </li>
            <li>
              <button type="button" className="zc-footer-link-btn" style={footerLinkBtnStyle} onClick={() => navigate('/user/bookings')}>
                <span>My Bookings & Orders</span>
              </button>
            </li>
            <li>
              <button type="button" className="zc-footer-link-btn" style={footerLinkBtnStyle} onClick={() => navigate('/user/complains')}>
                <span>Raise AMC Complaint</span>
              </button>
            </li>
            <li>
              <button type="button" className="zc-footer-link-btn" style={footerLinkBtnStyle} onClick={() => navigate('/user/support')}>
                <span>Live Support</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Col 4: Company Column (Customer Facing Only - No Partner or Admin Links) */}
        <div style={colStyle}>
          <h4 style={colHeadingStyle}>Company</h4>
          <ul style={linkListStyle}>
            <li>
              <button type="button" className="zc-footer-link-btn" style={footerLinkBtnStyle} onClick={() => navigate('/user/terms')}>
                <span>Terms & Conditions</span>
              </button>
            </li>
            <li>
              <button type="button" className="zc-footer-link-btn" style={footerLinkBtnStyle} onClick={() => navigate('/user/terms')}>
                <span>Privacy Policy</span>
              </button>
            </li>
            <li>
              <button type="button" className="zc-footer-link-btn" style={footerLinkBtnStyle} onClick={() => navigate('/user/saved-addresses')}>
                <span>Saved Delivery Addresses</span>
              </button>
            </li>
            <li>
              <button type="button" className="zc-footer-link-btn" style={footerLinkBtnStyle} onClick={() => navigate('/user/support')}>
                <span>Customer Support & Help</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div style={bottomStripStyle}>
        <div style={bottomStripInnerStyle}>
          <span style={copyrightTextStyle}>
            © {currentYear} Zevota Care. All rights reserved.
          </span>
          <div style={bottomLinksWrapStyle}>
            <span style={bottomLinkStyle} onClick={() => navigate('/user/terms')}>Privacy Policy</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '10px' }}>•</span>
            <span style={bottomLinkStyle} onClick={() => navigate('/user/terms')}>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const footerContainerStyle = {
  backgroundColor: '#0878f8',
  backgroundImage: 'linear-gradient(180deg, #0878f8 0%, #055fcc 100%)',
  color: '#ffffff',
  borderTop: '1px solid rgba(255, 255, 255, 0.22)',
  width: '100%',
  marginTop: '44px',
  boxSizing: 'border-box',
  fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
};

const footerInnerStyle = {
  maxWidth: '1240px',
  margin: '0 auto',
  padding: '48px 24px 38px 24px',
  display: 'grid',
  gridTemplateColumns: '1.35fr 1fr 1fr 1fr',
  gap: '32px',
  boxSizing: 'border-box',
};

const brandColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const brandHeaderRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const brandTextWrapStyle = {
  display: 'flex',
  flexDirection: 'column',
};

const brandTitleStyle = {
  fontSize: '24px',
  fontWeight: 900,
  color: '#ffffff',
  letterSpacing: '0.6px',
  fontFamily: "'Outfit', sans-serif",
  lineHeight: 1.15,
};

const brandSubStyle = {
  fontSize: '13px',
  fontWeight: 700,
  color: 'rgba(255, 255, 255, 0.95)',
  letterSpacing: '0.3px',
  marginTop: '2px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const brandDescStyle = {
  fontSize: '13.5px',
  lineHeight: '22px',
  color: 'rgba(255, 255, 255, 0.9)',
  margin: 0,
  maxWidth: '320px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const badgeRowStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginTop: '6px',
};

const trustBadgePillStyle = {
  fontSize: '12.5px',
  fontWeight: 700,
  color: '#ffffff',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: 'rgba(255, 255, 255, 0.14)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  padding: '6px 14px',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  width: 'fit-content',
};

const badgeIconCircleStyle = {
  width: '18px',
  height: '18px',
  borderRadius: '9px',
  backgroundColor: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const colStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const colHeadingStyle = {
  fontSize: '14px',
  fontWeight: 800,
  color: '#ffffff',
  textTransform: 'uppercase',
  letterSpacing: '0.9px',
  margin: 0,
  fontFamily: "'Outfit', sans-serif",
};

const linkListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const footerLinkBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '13.5px',
  fontWeight: 500,
  padding: 0,
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'color 0.16s ease, transform 0.16s ease',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const bottomStripStyle = {
  borderTop: '1px solid rgba(255, 255, 255, 0.18)',
  backgroundColor: '#044ea8',
  padding: '16px 24px',
};

const bottomStripInnerStyle = {
  maxWidth: '1240px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '12px',
  boxSizing: 'border-box',
};

const copyrightTextStyle = {
  fontSize: '12.5px',
  color: 'rgba(255, 255, 255, 0.85)',
  fontWeight: 500,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const bottomLinksWrapStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const bottomLinkStyle = {
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.85)',
  cursor: 'pointer',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};
