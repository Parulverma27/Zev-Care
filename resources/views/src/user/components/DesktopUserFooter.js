import React from 'react';
import { useNavigate } from 'react-router-dom';
import ZevotaLogo from '../../components/ZevotaLogo';

/* ========================================================================= */
/* REAL AUTHENTIC VECTOR SVG ICONS                                            */
/* ========================================================================= */


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

        /* Main Footer Grid - 4 Balanced Columns */
        .zc-footer-main {
          max-width: 1420px;
          margin: 0 auto;
          padding: 52px 32px 44px 32px;
          display: grid;
          grid-template-columns: 1.6fr 1fr 1fr 1fr;
          gap: 48px;
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
          font-family: 'Inter', 'Plus Jakarta Sans', sans-serif;
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

        /* Bottom Copyright Strip */
        .zc-bottom-bar {
          border-top: 1px solid #e2e8f0;
          background: #eef2f6;
          padding: 18px 0;
        }
        .zc-bottom-inner {
          max-width: 1420px;
          margin: 0 auto;
          padding: 0 32px;
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
            grid-template-columns: 1.2fr 1fr 1fr;
            gap: 32px;
          }
        }

        @media (max-width: 768px) {
          .zc-footer-main {
            grid-template-columns: 1fr;
            gap: 28px;
          }
        }
      `}</style>

      {/* MAIN 5-COLUMN NAVIGATION GRID */}
      <div className="zc-footer-main">
        {/* Col 1: Brand Anchor with Large Prominent Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <ZevotaLogo size="large" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em', fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif", lineHeight: 1.15 }}>
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
