import React from 'react';
import { useNavigate } from 'react-router-dom';
import ZevotaLogo from '../../components/ZevotaLogo';

/* ========================================================================= */
/* REAL AUTHENTIC VECTOR SVG ICONS                                            */
/* ========================================================================= */

const IconShieldCheck = ({ size = 20, color = '#2563eb' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" strokeWidth="2.4" />
  </svg>
);

const IconTagPercent = ({ size = 20, color = '#10b981' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" fill={color} stroke="none" />
    <circle cx="17.5" cy="17.5" r="2.5" fill={color} stroke="none" />
  </svg>
);

const IconStar = ({ size = 18, color = '#f59e0b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="#d97706" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconHeadphones = ({ size = 20, color = '#6366f1' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const IconPhone = ({ size = 15, color = '#2563eb' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconMail = ({ size = 15, color = '#2563eb' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconApple = ({ size = 20, color = '#0f172a' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.67-1.09 1.74-.96 2.77 1.01.08 2.07-.52 2.69-1.27z" />
  </svg>
);

const IconGooglePlay = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3.609 1.814L13.792 12 3.61 22.186A2.22 2.22 0 0 1 3 20.61V3.39c0-.6.22-1.16.609-1.576z" fill="#00C1A6" />
    <path d="M17.38 8.414l-3.588 3.586 3.588 3.586 4.04-2.32c1.16-.66 1.16-1.75 0-2.41l-4.04-2.442z" fill="#FFBA00" />
    <path d="M3.609 1.814l10.183 10.186 3.588-3.586L6.22 1.41C5.23.85 4.17 1.01 3.61 1.814z" fill="#0086F0" />
    <path d="M3.609 22.186c.56.8 1.62.96 2.61.4l11.16-6.406-3.588-3.586L3.61 22.186z" fill="#FF3A44" />
  </svg>
);

const IconInstagram = ({ size = 17, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" />
  </svg>
);

const IconXTwitter = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconLinkedIn = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" fill={color} />
  </svg>
);

const IconYouTube = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill={color} stroke="none" />
  </svg>
);

const IconLock = ({ size = 13, color = '#64748b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/* ========================================================================= */
/* COMPONENT                                                                 */
/* ========================================================================= */

export default function DesktopUserFooter() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="desktop-web-footer" role="contentinfo">
      {/* Scoped CSS for Animations and Micro-interactions */}
      <style>{`
        .desktop-web-footer {
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          border-top: 1px solid #e2e8f0;
          color: #0f172a;
          width: 100%;
          margin-top: 48px;
          box-sizing: border-box;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          position: relative;
        }

        /* Top Trust Highlights Banner */
        .zc-trust-bar {
          max-width: 1240px;
          margin: 0 auto;
          padding: 24px 24px 0 24px;
          box-sizing: border-box;
        }
        .zc-trust-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px 20px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        }
        .zc-trust-item {
          display: flex;
          align-items: center;
          gap: 12px;
          transition: transform 0.22s ease;
        }
        .zc-trust-item:hover {
          transform: translateY(-2px);
        }
        .zc-trust-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.25s ease;
        }
        .zc-trust-item:hover .zc-trust-icon-box {
          transform: scale(1.08);
        }
        .zc-trust-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.25;
        }
        .zc-trust-desc {
          font-size: 11.5px;
          color: #64748b;
          margin-top: 2px;
          line-height: 1.25;
        }

        /* Main Footer Grid */
        .zc-footer-main {
          max-width: 1240px;
          margin: 0 auto;
          padding: 44px 24px 36px 24px;
          display: grid;
          grid-template-columns: 1.35fr 1fr 1fr 1fr 1.25fr;
          gap: 32px;
          box-sizing: border-box;
        }

        /* Column Heading */
        .zc-col-heading {
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.9px;
          margin: 0 0 16px 0;
          font-family: 'Outfit', sans-serif;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .zc-col-heading-dot {
          width: 4px;
          height: 4px;
          border-radius: 2px;
          background-color: #2563eb;
          display: inline-block;
        }

        /* Interactive Link Items */
        .zc-footer-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .zc-footer-link {
          background: none;
          border: none;
          color: #475569;
          font-size: 13.5px;
          font-weight: 500;
          padding: 0;
          text-align: left;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0px;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .zc-link-arrow {
          opacity: 0;
          transform: translateX(-6px);
          transition: all 0.2s ease;
          color: #2563eb;
          font-size: 12px;
          font-weight: 700;
          margin-left: 2px;
        }
        .zc-footer-link:hover {
          color: #1d4ed8;
          transform: translateX(4px);
        }
        .zc-footer-link:hover .zc-link-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        /* Contact Pill Box in Brand Column */
        .zc-contact-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
          transition: all 0.25s ease;
        }
        .zc-contact-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
          transform: translateY(-1px);
        }
        .zc-contact-row {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #334155;
          font-size: 12.5px;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.16s ease;
        }
        .zc-contact-row:hover {
          color: #1d4ed8;
        }

        /* App Download Buttons */
        .zc-app-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 9px 14px;
          text-decoration: none;
          color: #0f172a;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .zc-app-btn:hover {
          border-color: #2563eb;
          background: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px -3px rgba(37, 99, 235, 0.15), 0 2px 4px rgba(15, 23, 42, 0.04);
        }
        .zc-app-btn-sub {
          font-size: 9.5px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          line-height: 1;
        }
        .zc-app-btn-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
          font-family: 'Outfit', sans-serif;
        }

        /* Social Media Icons */
        .zc-social-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 14px;
        }
        .zc-social-btn {
          width: 36px;
          height: 36px;
          border-radius: 18px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #475569;
          text-decoration: none;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 5px rgba(15, 23, 42, 0.03);
          cursor: pointer;
        }
        .zc-social-btn:hover {
          color: #ffffff;
          background: #0f172a;
          border-color: #0f172a;
          transform: translateY(-3px) scale(1.08);
          box-shadow: 0 6px 14px rgba(15, 23, 42, 0.18);
        }
        .zc-social-btn:active {
          transform: translateY(-1px) scale(1.02);
        }

        /* Bottom Copyright Strip */
        .zc-bottom-bar {
          border-top: 1px solid #e2e8f0;
          background: #eef2f6;
          padding: 18px 24px;
        }
        .zc-bottom-inner {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          box-sizing: border-box;
        }
        .zc-copy-text {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
        .zc-bottom-links {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .zc-bottom-link-item {
          font-size: 12.5px;
          color: #64748b;
          cursor: pointer;
          transition: color 0.16s ease;
        }
        .zc-bottom-link-item:hover {
          color: #0f172a;
          text-decoration: underline;
        }

        @media (max-width: 1024px) {
          .zc-trust-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .zc-footer-main {
            grid-template-columns: 1fr 1fr 1fr;
            gap: 28px;
          }
        }
      `}</style>

      {/* 1. TOP TRUST HIGHLIGHTS BAR */}
      <div className="zc-trust-bar">
        <div className="zc-trust-grid">
          <div className="zc-trust-item">
            <div className="zc-trust-icon-box" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <IconShieldCheck size={22} color="#2563eb" />
            </div>
            <div>
              <div className="zc-trust-title">Verified Technicians</div>
              <div className="zc-trust-desc">100% background checked</div>
            </div>
          </div>

          <div className="zc-trust-item">
            <div className="zc-trust-icon-box" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
              <IconTagPercent size={21} color="#10b981" />
            </div>
            <div>
              <div className="zc-trust-title">Transparent Pricing</div>
              <div className="zc-trust-desc">Upfront fixed rates & ₹0 hidden fee</div>
            </div>
          </div>

          <div className="zc-trust-item">
            <div className="zc-trust-icon-box" style={{ backgroundColor: '#fffbeb', color: '#f59e0b' }}>
              <IconStar size={20} color="#f59e0b" />
            </div>
            <div>
              <div className="zc-trust-title">4.8★ Rated Service</div>
              <div className="zc-trust-desc">50,000+ satisfied homes</div>
            </div>
          </div>

          <div className="zc-trust-item">
            <div className="zc-trust-icon-box" style={{ backgroundColor: '#eef2ff', color: '#6366f1' }}>
              <IconHeadphones size={21} color="#6366f1" />
            </div>
            <div>
              <div className="zc-trust-title">24x7 Dedicated Help</div>
              <div className="zc-trust-desc">Rapid assistance on chat & call</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN 5-COLUMN NAVIGATION GRID */}
      <div className="zc-footer-main">
        {/* Col 1: Brand Anchor with Large Prominent Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ZevotaLogo size="large" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.6px', fontFamily: "'Outfit', sans-serif", lineHeight: 1.15 }}>
                ZEVOTA CARE
              </span>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#2563eb', letterSpacing: '0.3px', marginTop: '3px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Home Services & AMC
              </span>
            </div>
          </div>

          <p style={{ fontSize: '13.5px', lineHeight: '22px', color: '#64748b', margin: 0, maxWidth: '300px' }}>
            Reliable home maintenance, repair, and annual protection coverage designed to make everyday living effortless.
          </p>

          {/* Quick Helpline Card */}
          <div className="zc-contact-card">
            <a href="tel:+919876543210" className="zc-contact-row">
              <IconPhone size={14} color="#2563eb" />
              <span>+91 98765 43210</span>
            </a>
            <a href="mailto:care@zevotacare.com" className="zc-contact-row">
              <IconMail size={14} color="#2563eb" />
              <span>care@zevotacare.com</span>
            </a>
          </div>
        </div>

        {/* Col 2: Services */}
        <div>
          <h4 className="zc-col-heading">
            <span className="zc-col-heading-dot" />
            Services
          </h4>
          <ul className="zc-footer-list">
            <li>
              <button
                type="button"
                className="zc-footer-link"
                onClick={() => navigate('/user/bookings/new', { state: { preSelectedCategory: 'Electrician' } })}
              >
                <span>Electrician</span>
                <span className="zc-link-arrow">›</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="zc-footer-link"
                onClick={() => navigate('/user/bookings/new', { state: { preSelectedCategory: 'Plumber' } })}
              >
                <span>Plumbing</span>
                <span className="zc-link-arrow">›</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="zc-footer-link"
                onClick={() => navigate('/user/bookings/new', { state: { preSelectedCategory: 'Carpenter' } })}
              >
                <span>Carpentry</span>
                <span className="zc-link-arrow">›</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="zc-footer-link"
                onClick={() => navigate('/user/bookings/new', { state: { preSelectedCategory: 'Dry Cleaning' } })}
              >
                <span>Dry Cleaning</span>
                <span className="zc-link-arrow">›</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="zc-footer-link"
                onClick={() => navigate('/user/bookings/new', { state: { preSelectedCategory: 'Pest Control' } })}
              >
                <span>Pest Control</span>
                <span className="zc-link-arrow">›</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="zc-footer-link"
                onClick={() => navigate('/user/bookings/new', { state: { preSelectedCategory: 'AC Service' } })}
              >
                <span>AC Maintenance & Repair</span>
                <span className="zc-link-arrow">›</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: AMC & Support */}
        <div>
          <h4 className="zc-col-heading">
            <span className="zc-col-heading-dot" />
            AMC & Support
          </h4>
          <ul className="zc-footer-list">
            <li>
              <button type="button" className="zc-footer-link" onClick={() => navigate('/user/plans')}>
                <span>Explore AMC Plans</span>
                <span className="zc-link-arrow">›</span>
              </button>
            </li>
            <li>
              <button type="button" className="zc-footer-link" onClick={() => navigate('/user/my-amc')}>
                <span>AMC Wallet & Pass</span>
                <span className="zc-link-arrow">›</span>
              </button>
            </li>
            <li>
              <button type="button" className="zc-footer-link" onClick={() => navigate('/user/bookings')}>
                <span>My Bookings & Orders</span>
                <span className="zc-link-arrow">›</span>
              </button>
            </li>
            <li>
              <button type="button" className="zc-footer-link" onClick={() => navigate('/user/complains')}>
                <span>Raise AMC Complaint</span>
                <span className="zc-link-arrow">›</span>
              </button>
            </li>
            <li>
              <button type="button" className="zc-footer-link" onClick={() => navigate('/user/support')}>
                <span>24x7 Live Support</span>
                <span className="zc-link-arrow">›</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Col 4: Company */}
        <div>
          <h4 className="zc-col-heading">
            <span className="zc-col-heading-dot" />
            Company
          </h4>
          <ul className="zc-footer-list">
            <li>
              <button type="button" className="zc-footer-link" onClick={() => navigate('/user/terms')}>
                <span>Terms & Conditions</span>
                <span className="zc-link-arrow">›</span>
              </button>
            </li>
            <li>
              <button type="button" className="zc-footer-link" onClick={() => navigate('/user/terms')}>
                <span>Privacy Policy</span>
                <span className="zc-link-arrow">›</span>
              </button>
            </li>
            <li>
              <button type="button" className="zc-footer-link" onClick={() => navigate('/user/saved-addresses')}>
                <span>Saved Delivery Addresses</span>
                <span className="zc-link-arrow">›</span>
              </button>
            </li>
            <li>
              <button type="button" className="zc-footer-link" onClick={() => navigate('/user/support')}>
                <span>Customer Helpdesk</span>
                <span className="zc-link-arrow">›</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Col 5: App Download & Socials */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h4 className="zc-col-heading" style={{ marginBottom: '8px' }}>
              <span className="zc-col-heading-dot" />
              Get The App
            </h4>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0', lineHeight: '18px' }}>
              Book services in seconds & track technician arrival in real-time.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="zc-app-btn" title="Download on App Store">
              <IconApple size={22} color="#0f172a" />
              <div>
                <div className="zc-app-btn-sub">Download on the</div>
                <div className="zc-app-btn-title">App Store</div>
              </div>
            </div>

            <div className="zc-app-btn" title="Get it on Google Play">
              <IconGooglePlay size={20} />
              <div>
                <div className="zc-app-btn-sub">GET IT ON</div>
                <div className="zc-app-btn-title">Google Play</div>
              </div>
            </div>
          </div>

          {/* Social Icons */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '6px' }}>
              Connect With Us
            </div>
            <div className="zc-social-row">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="zc-social-btn" title="Instagram">
                <IconInstagram size={17} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="zc-social-btn" title="X (Twitter)">
                <IconXTwitter size={15} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="zc-social-btn" title="LinkedIn">
                <IconLinkedIn size={16} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="zc-social-btn" title="YouTube">
                <IconYouTube size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM COPYRIGHT STRIP */}
      <div className="zc-bottom-bar">
        <div className="zc-bottom-inner">
          <span className="zc-copy-text">
            © {currentYear} Zevota Care Technologies Pvt. Ltd. All rights reserved.
          </span>

          <div className="zc-bottom-links">
            <span className="zc-bottom-link-item" onClick={() => navigate('/user/terms')}>Privacy Policy</span>
            <span style={{ color: '#cbd5e1', fontSize: '10px' }}>•</span>
            <span className="zc-bottom-link-item" onClick={() => navigate('/user/terms')}>Terms of Service</span>
            <span style={{ color: '#cbd5e1', fontSize: '10px' }}>•</span>
            <span className="zc-bottom-link-item" onClick={() => navigate('/user/support')}>Help Center</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
