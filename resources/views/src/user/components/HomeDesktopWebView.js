import React, { useState, useEffect } from 'react';
import { AppIcon } from '../../components/AppIcons';
import { SERVICE_IMAGES } from '../../utils/bundledImages';
import { resolveImageUri } from '../../utils/imageUtils';

const banner1Uri = resolveImageUri(SERVICE_IMAGES.heroBanner1, '/assets/hero-banner-1.png');
const banner2Uri = resolveImageUri(SERVICE_IMAGES.heroBanner2, '/assets/hero-banner-2.png');
const banner3Uri = resolveImageUri(SERVICE_IMAGES.heroBanner3, '/assets/hero-banner-3.png');
const homeHeaderBgUri = resolveImageUri(SERVICE_IMAGES.homeHeaderBg, '/assets/home-header-bg.jpg');
const wordmarkUri = resolveImageUri(SERVICE_IMAGES.zevotaCareWordmark, '/assets/zevota-care-wordmark.png');

const PROMO_SLIDES = [
  { id: 1, image: banner1Uri, alt: 'Zevota Care Annual Maintenance Plans', target: '/user/plans' },
  { id: 2, image: banner2Uri, alt: 'Specialist Home Maintenance & Repair', target: '/user/bookings/new' },
  { id: 3, image: banner3Uri, alt: 'Verified Home Technicians & AMC', target: '/user/plans' },
];

const EXPLORE_SERVICES = [
  {
    id: 'elec',
    name: 'Electrician',
    category: 'Electrician',
    desc: 'Wiring, switches & appliance fixes',
    badge: '30+ Services',
    amcCoverage: '₹0 with AMC',
    image: resolveImageUri(SERVICE_IMAGES.electrician, '/assets/services/catalog/electrician.png'),
  },
  {
    id: 'plumb',
    name: 'Plumbing',
    category: 'Plumber',
    desc: 'Pipes, taps, leakage & drainage',
    badge: 'Taps & Pipes',
    amcCoverage: '₹0 with AMC',
    image: resolveImageUri(SERVICE_IMAGES.plumber, '/assets/services/catalog/plumbing.png'),
  },
  {
    id: 'carp',
    name: 'Carpentry',
    category: 'Carpenter',
    desc: 'Furniture repair & fittings',
    badge: 'Hinges & Locks',
    amcCoverage: '₹0 with AMC',
    image: resolveImageUri(SERVICE_IMAGES.carpenter, '/assets/services/catalog/carpenter.png'),
  },
  {
    id: 'clean',
    name: 'Dry Cleaning',
    category: 'Dry Cleaning',
    desc: 'Sofa, carpet & fabric care',
    badge: 'Deep Cleaning',
    amcCoverage: 'Doorstep Care',
    image: resolveImageUri(SERVICE_IMAGES.dryCleaning, '/assets/services/catalog/dry-cleaning.png'),
  },
  {
    id: 'pest',
    name: 'Pest Control',
    category: 'Pest Control',
    desc: 'Cockroach, termite & bedbugs',
    badge: '100% Safe',
    amcCoverage: 'Warranty',
    image: resolveImageUri(SERVICE_IMAGES.pestControl, '/assets/services/catalog/pest-control.png'),
  },
];

const QUICK_SERVICES_TICKER = [
  {
    id: 'ac_service',
    name: 'AC Services',
    category: 'AC Services',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="9" rx="2" />
        <line x1="6" y1="10" x2="18" y2="10" />
        <circle cx="18" cy="7.5" r="0.75" fill="#2563eb" />
        <path d="M5 17c1 1 2 1 3 0" />
        <path d="M10.5 17c1 1 2 1 3 0" />
        <path d="M16 17c1 1 2 1 3 0" />
      </svg>
    ),
  },
  {
    id: 'washing_machine',
    name: 'Washing Machine',
    category: 'Washing Machine Repair',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="3" />
        <circle cx="12" cy="13" r="4.5" />
        <circle cx="12" cy="13" r="1.8" />
        <line x1="7" y1="5.5" x2="11" y2="5.5" />
        <circle cx="17" cy="5.5" r="1" fill="#2563eb" />
      </svg>
    ),
  },
  {
    id: 'refrigerator',
    name: 'Refrigerator',
    category: 'Refrigerator Repair',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2.5" />
        <line x1="5" y1="10" x2="19" y2="10" />
        <line x1="8" y1="5.5" x2="8" y2="8" />
        <line x1="8" y1="13" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    id: 'tv_av',
    name: 'TV & AV',
    category: 'TV & AV Services',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <circle cx="12" cy="14.5" r="0.8" fill="#2563eb" />
      </svg>
    ),
  },
  {
    id: 'electrician_tick',
    name: 'Electrician',
    category: 'Electrical Services',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22v-5" />
        <path d="M9 7V2" />
        <path d="M15 7V2" />
        <rect x="6" y="7" width="12" height="10" rx="3" />
        <path d="M12.5 10l-1.5 2h2l-1.5 2" />
      </svg>
    ),
  },
  {
    id: 'plumber_tick',
    name: 'Plumbing',
    category: 'Plumbing Services',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h8" />
        <path d="M9 7v5" />
        <path d="M7 7h4" />
        <path d="M12 12c1.5 0 3 .5 3 2v2a1 1 0 0 1-1 1h-2" />
        <path d="M13 20.5c0 1.38-1.12 2.5-2.5 2.5s-2.5-1.12-2.5-2.5c0-1.5 2.5-4 2.5-4s2.5 2.5 2.5 4z" />
      </svg>
    ),
  },
  {
    id: 'carpenter_tick',
    name: 'Carpenter',
    category: 'Carpentry Services',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    id: 'pest_tick',
    name: 'Pest Control',
    category: 'Pest Control Services',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 11 11 13 15 9" />
      </svg>
    ),
  },
  {
    id: 'purifier_tick',
    name: 'RO Purifier',
    category: 'Electrical Services',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    id: 'geyser_tick',
    name: 'Geyser Repair',
    category: 'Electrical Services',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="2" width="12" height="20" rx="3" />
        <circle cx="12" cy="15" r="2" />
        <line x1="9" y1="6" x2="15" y2="6" />
      </svg>
    ),
  },
];

/* ========================================================================= */
/* LUXURY 3D AMC VECTOR ICONS (Matches Mobile App Exactly)                   */
/* ========================================================================= */

function Luxury3DShieldIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="shieldRimGrad_desktop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="40%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="shieldFacetLeft_desktop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="shieldFacetRight_desktop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="60%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="shieldSheen_desktop" x1="0%" y1="0%" x2="70%" y2="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="shieldShadow_desktop" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="#0f172a" floodOpacity="0.35" />
        </filter>
      </defs>
      <g filter="url(#shieldShadow_desktop)">
        <path
          d="M16 2.5L6.5 6.8V14.8C6.5 21.2 10.6 27.2 16 29C21.4 27.2 25.5 21.2 25.5 14.8V6.8L16 2.5Z"
          fill="url(#shieldRimGrad_desktop)"
        />
        <path
          d="M16 4.2L8 7.8V14.8C8 20.3 11.4 25.4 16 27V4.2Z"
          fill="url(#shieldFacetLeft_desktop)"
        />
        <path
          d="M16 4.2L24 7.8V14.8C24 20.3 20.6 25.4 16 27V4.2Z"
          fill="url(#shieldFacetRight_desktop)"
        />
        <path
          d="M16 4.2L8 7.8V14.8C8 17.5 9 20.2 10.8 22.4L20 8.5L16 4.2Z"
          fill="url(#shieldSheen_desktop)"
        />
        <line x1="16" y1="4.2" x2="16" y2="27" stroke="#60a5fa" strokeWidth="0.8" opacity="0.6" />
        <path
          d="M11.5 15.2L14.6 18.3L20.8 11.8"
          stroke="#ffffff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function Luxury3DWrenchIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="wrenchLuxGrad_desktop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        stroke="url(#wrenchLuxGrad_desktop)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(249, 115, 22, 0.15)"
      />
    </svg>
  );
}

function Luxury3DMechanicIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="mechLuxGrad_desktop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path
        d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"
        stroke="url(#mechLuxGrad_desktop)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(37, 99, 235, 0.15)"
      />
      <path
        d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"
        stroke="url(#mechLuxGrad_desktop)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 15v-3a8 8 0 0 1 16 0v3"
        stroke="url(#mechLuxGrad_desktop)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(37, 99, 235, 0.12)"
      />
    </svg>
  );
}

/* Real SVG Vector Icons for Perks (Zero Emojis) */
const renderPerkIcon = (iconName) => {
  switch (iconName) {
    case 'flash':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'shield':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'wrench':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case 'clock':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'pin':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case 'check-circle':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'tag':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      );
    case 'search':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 12 2" />
        </svg>
      );
    default:
      return null;
  }
};

const AMC_CARDS = [
  {
    key: 'plans',
    badge: 'EXCLUSIVE PASS',
    title: 'My AMC Plan',
    subtitle: 'Protect your home with comprehensive annual maintenance.',
    actionLabel: 'Explore Plans',
    route: '/user/plans',
    theme: 'frosted-sapphire',
    glowOrb1: 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, rgba(96, 165, 250, 0.3) 55%, transparent 75%)',
    glowOrb2: 'radial-gradient(circle, rgba(147, 197, 253, 0.65) 0%, rgba(59, 130, 246, 0.25) 55%, transparent 75%)',
    cardBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(240, 246, 255, 0.52) 50%, rgba(224, 242, 254, 0.38) 100%)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: 'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.98), inset 0 -1px 1px 0 rgba(37, 99, 235, 0.08), 0 12px 30px -4px rgba(37, 99, 235, 0.16), 0 2px 6px rgba(15, 23, 42, 0.03)',
    accentGradient: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
    iconBg: 'rgba(255, 255, 255, 0.94)',
    iconBorder: '1.5px solid #ffffff',
    titleColor: '#0f172a',
    subColor: '#475569',
    badgeBg: 'rgba(255, 255, 255, 0.9)',
    badgeBorder: 'rgba(191, 219, 254, 0.9)',
    badgeColor: '#1d4ed8',
    perkBg: 'rgba(255, 255, 255, 0.75)',
    perkBorder: 'rgba(255, 255, 255, 0.95)',
    perkColor: '#1e40af',
    pillBtnBg: '#ffffff',
    pillBtnBorder: '1.2px solid rgba(191, 219, 254, 0.95)',
    pillBtnColor: '#1d4ed8',
    pillArrowBg: '#eff6ff',
    pillArrowColor: '#1d4ed8',
    pillShadow: '0 3px 10px rgba(37, 99, 235, 0.12)',
    icon: <Luxury3DShieldIcon size={24} />,
    perks: [
      { id: 'p1', label: '2-Hour Priority Dispatch', icon: 'flash' },
      { id: 'p2', label: '₹0 Labour on All Repairs', icon: 'shield' },
      { id: 'p3', label: 'Free Periodic Inspections', icon: 'wrench' },
    ],
  },
  {
    key: 'complaints',
    badge: 'PRIORITY SUPPORT',
    title: 'AMC Complaints',
    subtitle: 'Raise any appliance or home issue with instant technician dispatch.',
    actionLabel: 'Raise Issue',
    route: '/user/complains',
    theme: 'frosted-amber',
    glowOrb1: 'radial-gradient(circle, rgba(249, 115, 22, 0.55) 0%, rgba(251, 146, 60, 0.28) 55%, transparent 75%)',
    glowOrb2: 'radial-gradient(circle, rgba(253, 186, 116, 0.65) 0%, rgba(234, 88, 12, 0.22) 55%, transparent 75%)',
    cardBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 247, 237, 0.52) 50%, rgba(254, 215, 170, 0.38) 100%)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: 'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.98), inset 0 -1px 1px 0 rgba(234, 88, 12, 0.08), 0 12px 30px -4px rgba(234, 88, 12, 0.16), 0 2px 6px rgba(15, 23, 42, 0.03)',
    accentGradient: 'linear-gradient(90deg, #ea580c, #f97316)',
    iconBg: 'rgba(255, 255, 255, 0.94)',
    iconBorder: '1.5px solid #ffffff',
    titleColor: '#0f172a',
    subColor: '#475569',
    badgeBg: 'rgba(255, 255, 255, 0.9)',
    badgeBorder: 'rgba(254, 215, 170, 0.9)',
    badgeColor: '#c2410c',
    perkBg: 'rgba(255, 255, 255, 0.75)',
    perkBorder: 'rgba(255, 255, 255, 0.95)',
    perkColor: '#9a3412',
    pillBtnBg: '#ffffff',
    pillBtnBorder: '1.2px solid rgba(254, 215, 170, 0.95)',
    pillBtnColor: '#c2410c',
    pillArrowBg: '#fff7ed',
    pillArrowColor: '#c2410c',
    pillShadow: '0 3px 10px rgba(234, 88, 12, 0.12)',
    icon: <Luxury3DWrenchIcon size={24} />,
    perks: [
      { id: 'c1', label: 'Instant Ticket Logging', icon: 'clock' },
      { id: 'c2', label: 'Direct Technician Dispatch', icon: 'pin' },
      { id: 'c3', label: '100% Quality Guaranteed', icon: 'check-circle' },
    ],
  },
  {
    key: 'mechanic',
    badge: '₹0 FREE VISIT',
    title: 'My Mechanic',
    subtitle: 'Free on-site diagnosis & inspection for home appliances.',
    actionLabel: 'Book Free Visit',
    route: '/user/consultation',
    theme: 'frosted-emerald',
    glowOrb1: 'radial-gradient(circle, rgba(16, 185, 129, 0.52) 0%, rgba(52, 211, 153, 0.28) 55%, transparent 75%)',
    glowOrb2: 'radial-gradient(circle, rgba(167, 243, 208, 0.65) 0%, rgba(16, 185, 129, 0.22) 55%, transparent 75%)',
    cardBg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(240, 253, 250, 0.52) 50%, rgba(204, 251, 241, 0.38) 100%)',
    borderColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: 'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.98), inset 0 -1px 1px 0 rgba(16, 185, 129, 0.08), 0 12px 30px -4px rgba(16, 185, 129, 0.16), 0 2px 6px rgba(15, 23, 42, 0.03)',
    accentGradient: 'linear-gradient(90deg, #059669, #10b981)',
    iconBg: 'rgba(255, 255, 255, 0.94)',
    iconBorder: '1.5px solid #ffffff',
    titleColor: '#0f172a',
    subColor: '#475569',
    badgeBg: 'rgba(255, 255, 255, 0.9)',
    badgeBorder: 'rgba(167, 243, 208, 0.9)',
    badgeColor: '#065f46',
    perkBg: 'rgba(255, 255, 255, 0.75)',
    perkBorder: 'rgba(255, 255, 255, 0.95)',
    perkColor: '#065f46',
    pillBtnBg: '#ffffff',
    pillBtnBorder: '1.2px solid rgba(167, 243, 208, 0.95)',
    pillBtnColor: '#047857',
    pillArrowBg: '#ecfdf5',
    pillArrowColor: '#047857',
    pillShadow: '0 3px 10px rgba(16, 185, 129, 0.12)',
    icon: <Luxury3DMechanicIcon size={24} variant="teal" />,
    perks: [
      { id: 'm1', label: '100% Free Doorstep Visit', icon: 'tag' },
      { id: 'm2', label: 'Comprehensive Diagnosis', icon: 'search' },
      { id: 'm3', label: 'Upfront Fixed Rate Card', icon: 'sparkle' },
    ],
  },
];

/* Real SVG vector icons for Trust Pillars (Zero emojis) */
const IconShieldCheck = ({ size = 26, color = '#2563eb' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" strokeWidth="2.6" />
  </svg>
);

const IconReceiptPercent = ({ size = 26, color = '#059669' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
    <line x1="16" y1="8" x2="8" y2="16" />
    <circle cx="9" cy="9.5" r="1.5" fill={color} stroke="none" />
    <circle cx="15" cy="14.5" r="1.5" fill={color} stroke="none" />
  </svg>
);

const IconClockSpeed = ({ size = 26, color = '#4f46e5' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 15 15" strokeWidth="2.4" />
  </svg>
);

const IconBadgeGuarantee = ({ size = 26, color = '#d97706' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    <path d="m9 8 2 2 4-4" strokeWidth="2.4" />
  </svg>
);

const IconMiniCheck = ({ size = 11, color = '#2563eb' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TRUST_PILLARS = [
  {
    icon: (color) => <IconShieldCheck size={26} color={color} />,
    badgeText: 'SAFETY FIRST',
    title: 'Background-Checked',
    desc: 'Certified and identity-verified home technicians equipped with proper tools for safe, reliable service.',
    chipText: 'Verified Identity',
    accentColor: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  {
    icon: (color) => <IconReceiptPercent size={26} color={color} />,
    badgeText: 'HONEST RATES',
    title: 'Upfront Fixed Pricing',
    desc: 'Standardized rate cards with clear pricing quotes before work begins. Zero surprise or hidden fees.',
    chipText: 'Clear Rate Cards',
    accentColor: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  {
    icon: (color) => <IconClockSpeed size={26} color={color} />,
    badgeText: 'PROMPT SERVICE',
    title: 'Scheduled Doorstep Arrival',
    desc: 'Convenient appointment slots with live arrival updates and timely doorstep service by dedicated professionals.',
    chipText: 'Scheduled Slots',
    accentColor: '#4f46e5',
    bgColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  {
    icon: (color) => <IconBadgeGuarantee size={26} color={color} />,
    badgeText: 'ASSURANCE',
    title: 'Post-Service Warranty',
    desc: 'Every completed repair is covered by our service warranty with free revisit and rework support if unsatisfied.',
    chipText: 'Service Warranty',
    accentColor: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
  },
];

export default function HomeDesktopWebView({
  searchQuery,
  setSearchQuery,
  filteredSuggestions,
  placeholderIdx,
  placeholders,
  onSelectSuggestion,
  onSelectCategory,
  onNavigate,
}) {
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-play promo banners continuously every 3.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Smooth scroll to Explore Services section if requested via hash or categories route
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (window.location.hash === '#explore-services-section' ||
        window.location.pathname.includes('/categories'))
    ) {
      setTimeout(() => {
        const el = document.getElementById('explore-services-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, []);

  return (
    <div className="home-desktop-web-wrap" style={wrapperStyle}>
      {/* 1. HERO SECTION (Urban Company 2-Column Gateway) */}
      <section style={heroCardStyle} aria-label="Hero Gateway">
        <div style={heroGridStyle}>
          {/* Left Column: Headlines, Search & CTAs */}
          <div style={heroLeftStyle}>
            <div style={eyebrowStyle}>
              <span style={eyebrowDotStyle} />
              <span>YOUR HOME, OUR PRIORITY</span>
            </div>

            <h1 style={heroHeadlineStyle}>
              Expert care for every <span style={{ color: '#0878f8' }}>corner of your home.</span>
            </h1>

            <p style={heroSubtextStyle}>
              Book trusted professionals for appliance repairs, home maintenance,
              and comprehensive annual coverage — all in one place.
            </p>

            {/* Live Search Input with Animated Placeholder Ticker (Smooth like in the app) */}
            <div style={searchBoxWrapperStyle}>
              <div className="zc-hero-search-box" style={searchBoxInnerStyle}>
                <button
                  type="button"
                  onClick={() => {
                    if (filteredSuggestions && filteredSuggestions.length > 0) {
                      onSelectSuggestion(filteredSuggestions[0]);
                    } else if (searchQuery.trim()) {
                      onSelectSuggestion({
                        name: searchQuery.trim(),
                        category_name: 'Electrician',
                        sub_category_name: searchQuery.trim(),
                      });
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 4,
                  }}
                  aria-label="Search services"
                >
                  <AppIcon name="search" size={18} color="#0878f8" strokeWidth={2.4} />
                </button>

                {!searchQuery && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '48px',
                      right: '48px',
                      top: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      overflow: 'hidden',
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}
                  >
                    <span
                      key={placeholderIdx}
                      className="search-ticker-item"
                      style={{
                        fontSize: '14.5px',
                        fontWeight: 500,
                        color: '#64748b',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        display: 'block',
                      }}
                    >
                      {placeholders[placeholderIdx] || 'Search electrician, plumbing, carpenter...'}
                    </span>
                  </div>
                )}

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filteredSuggestions && filteredSuggestions.length > 0) {
                        onSelectSuggestion(filteredSuggestions[0]);
                      } else if (searchQuery.trim()) {
                        onSelectSuggestion({
                          name: searchQuery.trim(),
                          category_name: 'Electrician',
                          sub_category_name: searchQuery.trim(),
                        });
                      }
                    }
                  }}
                  placeholder=""
                  style={searchInputStyle}
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={clearBtnStyle}
                    aria-label="Clear search"
                  >
                    <AppIcon name="x" size={14} color="#94a3b8" />
                  </button>
                ) : null}
              </div>

              {/* Live Search Suggestions Dropdown */}
              {searchQuery && filteredSuggestions?.length > 0 && (
                <div style={suggestionsDropdownStyle}>
                  {filteredSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="zc-suggestion-row-item"
                      style={suggestionRowStyle}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onSelectSuggestion(item)}
                    >
                      <AppIcon name="search" size={14} color="#0878f8" />
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</span>
                      {item.category_name && (
                        <span style={{ marginLeft: 'auto', fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>
                          {item.category_name}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div style={ctaButtonsRowStyle}>
              <button
                type="button"
                className="zc-desktop-btn-primary"
                style={primaryCtaBtnStyle}
                onClick={() => onNavigate('/user/bookings/new')}
              >
                <span>Book a Service</span>
                <span style={{ fontSize: '15px' }}>→</span>
              </button>
              <button
                type="button"
                className="zc-desktop-btn-secondary"
                style={secondaryCtaBtnStyle}
                onClick={() => onNavigate('/user/plans')}
              >
                <span>Explore AMC Plans</span>
              </button>
            </div>

            {/* Micro Trust Bullets */}
            <div style={trustBulletsRowStyle}>
              <span style={trustPillStyle}>
                <AppIcon name="check" size={12} color="#059669" strokeWidth={3} />
                <span>Verified Professionals</span>
              </span>
              <span style={trustPillStyle}>
                <AppIcon name="check" size={12} color="#059669" strokeWidth={3} />
                <span>Transparent Pricing</span>
              </span>
              <span style={trustPillStyle}>
                <AppIcon name="check" size={12} color="#059669" strokeWidth={3} />
                <span>Fast Support</span>
              </span>
              <span style={trustPillBlueStyle}>
                <AppIcon name="shield" size={12} color="#0878f8" strokeWidth={2.5} />
                <span>₹0 Visit with AMC</span>
              </span>
            </div>
          </div>

          {/* Right Column: Luxury Living Room Hero Graphic (Matches Brand App Identity) */}
          <div style={heroRightStyle}>
            <div style={heroArtCardStyle}>
              <img
                src={homeHeaderBgUri || '/assets/home-header-bg.jpg'}
                alt="Zevota Care - Your home, our priority"
                style={heroArtImgStyle}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/home-header-bg.jpg';
                }}
              />
              <div style={heroArtOverlayStyle}>
                <div style={heroArtWordmarkWrapStyle}>
                  <img
                    src={wordmarkUri || '/assets/zevota-care-wordmark.png'}
                    alt="Zevota Care"
                    style={{ height: '22px', objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling) {
                        e.currentTarget.nextSibling.style.display = 'block';
                      }
                    }}
                  />
                  <span style={{ display: 'none', color: '#ffffff', fontWeight: 900, fontSize: '15px', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.5px' }}>
                    ZEVOTA CARE
                  </span>
                </div>
                <div style={heroArtTitleStyle}>
                  Your home,<br />
                  <span style={{ color: '#ffffff' }}>our </span>
                  <span style={{ color: '#fbbf24', textShadow: '0 2px 10px rgba(251, 191, 36, 0.45)' }}>priority.</span>
                </div>
                <div style={heroArtSubStyle}>
                  Trusted home services & AMC for a worry-free tomorrow.
                </div>
              </div>

              {/* Floating Rating Badge (Top Right) */}
              <div className="zc-floating-badge" style={heroFloatingBadgeTopStyle}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fde68a' }}>
                  <AppIcon name="star" size={15} color="#d97706" strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif", lineHeight: 1.2 }}>4.9 / 5 Rating</div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>50,000+ Happy Homes</div>
                </div>
              </div>

              {/* Floating Verified Experts Badge (Bottom Right) */}
              <div className="zc-floating-badge" style={heroFloatingBadgeStyle}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #dbeafe' }}>
                  <AppIcon name="check" size={16} color="#0878f8" strokeWidth={3} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>Verified Experts</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Background Checked</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROMOTIONAL BANNER SLIDER (Multi-Card 2-Banner Showcase Carousel) */}
      <section
        style={promoSectionStyle}
        aria-label="Promotional Offers"
      >
        <div style={promoCarouselViewportStyle}>
          <div
            style={{
              ...promoTrackStyle,
              transform: `translateX(calc(-${activeSlide} * (50% + 12px)))`,
            }}
          >
            {[...PROMO_SLIDES, ...PROMO_SLIDES].map((slide, idx) => (
              <div
                key={`${slide.id}-${idx}`}
                className="zc-promo-banner-card"
                style={promoCardStyle}
              >
                <img
                  src={slide.image || `/assets/hero-banner-${((slide.id - 1) % 3) + 1}.png`}
                  alt={slide.alt || 'Promotional Banner'}
                  style={promoImgStyle}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `/assets/hero-banner-${((slide.id - 1) % 3) + 1}.png`;
                  }}
                />
              </div>
            ))}
          </div>

          {/* Left Arrow */}
          <button
            type="button"
            className="zc-slider-arrow"
            style={arrowBtnLeftStyle}
            onClick={() => setActiveSlide((prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length)}
            aria-label="Previous slide"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Right Arrow */}
          <button
            type="button"
            className="zc-slider-arrow"
            style={arrowBtnRightStyle}
            onClick={() => setActiveSlide((prev) => (prev + 1) % PROMO_SLIDES.length)}
            aria-label="Next slide"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Pagination Indicators */}
        <div style={dotsWrapStyle}>
          {PROMO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              style={idx === activeSlide ? dotActiveStyle : dotStyle}
              onClick={() => setActiveSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 3. EXPLORE HOME SERVICES (5-Column Grid + Quick Services Marquee Ticker) */}
      <section id="explore-services-section" style={sectionWrapStyle} aria-label="Explore Home Services">
        <div style={sectionHeaderStyle}>
          <div>
            <div style={{ ...eyebrowStyle, marginBottom: '6px' }}>
              <span className="zc-eyebrow-pulse-dot" style={eyebrowDotStyle} />
              <span>DOORSTEP EXPERTS</span>
            </div>
            <h2 style={sectionTitleStyle}>Explore Home Services</h2>
            <p style={sectionSubtitleStyle}>Professional repair, servicing & certified doorstep maintenance.</p>
          </div>
        </div>

        <div style={servicesGridStyle}>
          {EXPLORE_SERVICES.map((srv) => (
            <div
              key={srv.id}
              className="zc-desktop-service-card"
              style={serviceCardStyle}
              onClick={() => onSelectCategory(srv.category)}
              role="button"
              tabIndex={0}
              title={`Explore ${srv.name} services`}
            >
              {/* Big Service Banner with Floating Meta Badges */}
              <div className="zc-service-banner-wrap" style={serviceBannerWrapStyle}>
                <img
                  src={srv.image}
                  alt={srv.name}
                  style={serviceBigImgStyle}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    const catMap = {
                      elec: 'electrician',
                      plumb: 'plumbing',
                      carp: 'carpenter',
                      clean: 'dry-cleaning',
                      pest: 'pest-control',
                    };
                    e.currentTarget.src = `/assets/services/catalog/${catMap[srv.id] || 'electrician'}.png`;
                  }}
                />
                <div style={serviceFloatingBadgesRowStyle}>
                  <span style={serviceBadgeStyle}>{srv.badge}</span>
                  <span style={serviceAmcTagStyle}>{srv.amcCoverage}</span>
                </div>
              </div>

              {/* Title & Description */}
              <div style={serviceCardInfoStyle}>
                <span style={serviceNameStyle}>{srv.name}</span>
                <span style={serviceDescStyle}>{srv.desc}</span>
              </div>

              {/* Interactive Bottom CTA Link */}
              <div className="zc-service-bottom-cta" style={serviceBottomCtaStyle}>
                <span style={serviceCtaTextStyle}>Book Service</span>
                <span className="zc-service-cta-arrow" style={serviceCtaArrowStyle}>
                  →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FULL-SCREEN LIVE SERVICES TICKER (100vw Full-Bleed, Non-Clickable Ambient Ribbon) */}
      <section style={fullBleedTickerSectionStyle} aria-label="Quick Services Live Ticker">
        <div style={tickerInnerContentStyle}>
          <div style={tickerHeaderRowStyle}>
            <div style={tickerHeaderLeftStyle}>
              <span style={tickerHeaderDotStyle} />
              <span style={tickerHeaderLabelStyle}>QUICK APPLIANCE & REPAIR DISPATCH</span>
            </div>
            <span style={tickerHeaderHintStyle}>Instant Slot • Verified Technician Network</span>
          </div>
        </div>

        <div style={tickerMaskContainerStyle}>
          <div style={tickerTrackStyle} className="zc-services-marquee-track">
            {[...QUICK_SERVICES_TICKER, ...QUICK_SERVICES_TICKER, ...QUICK_SERVICES_TICKER].map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="zc-desktop-ticker-card"
                style={tickerCardNonClickableStyle}
              >
                <div className="zc-ticker-squircle" style={tickerSquircleStyle}>
                  {item.icon}
                </div>
                <span style={tickerTitleStyle}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. COMPLETE CARE FOR YOUR HOME (Flagship AMC Hero + 2 Action Tiles) */}
      <section style={sectionWrapStyle} aria-label="Complete Care for Your Home">
        <div style={sectionHeaderStyle}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '999px', padding: '4px 10px', marginBottom: '8px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 12 2" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                Zevota Care Privilege
              </span>
            </div>
            <h2 style={sectionTitleStyle}>Complete Care for Your Home</h2>
            <p style={sectionSubtitleStyle}>Comprehensive appliance protection, instant complaints & free on-site inspections.</p>
          </div>
        </div>

        <div style={amcGridStyle}>
          {AMC_CARDS.map((card) => (
            <div key={card.key} style={{ position: 'relative' }}>
              {/* Luminous Ambient Glow Orbs behind the frosted glass card */}
              {card.glowOrb1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '10px',
                    width: '180px',
                    height: '110px',
                    borderRadius: '50%',
                    background: card.glowOrb1,
                    filter: 'blur(36px)',
                    opacity: 0.8,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
              )}
              {card.glowOrb2 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-10px',
                    right: '12px',
                    width: '170px',
                    height: '105px',
                    borderRadius: '50%',
                    background: card.glowOrb2,
                    filter: 'blur(34px)',
                    opacity: 0.75,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
              )}
              <div
                className="zc-desktop-amc-card"
                style={{
                  background: card.cardBg,
                  borderColor: card.borderColor,
                  boxShadow: card.boxShadow,
                  borderRadius: '24px',
                  borderWidth: '1.5px',
                  borderStyle: 'solid',
                  padding: '24px 22px 22px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  zIndex: 1,
                  overflow: 'hidden',
                  minHeight: '290px',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  backdropFilter: 'blur(20px) saturate(190%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(190%)',
                }}
                onClick={() => onNavigate(card.route)}
                role="button"
                tabIndex={0}
              >
              {/* Top Accent Gradient Line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3.5px',
                  background: card.accentGradient,
                }}
              />

              <div>
                {/* Top Row: Squircle 3D Icon + Symmetrical Badge with real vector icon */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
                  <div
                    className="zc-amc-icon-art"
                    style={{
                      background: card.iconBg,
                      border: card.iconBorder,
                      width: '48px',
                      height: '48px',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 3px 10px rgba(15, 23, 42, 0.05)',
                    }}
                  >
                    {card.icon}
                  </div>
                  <div
                    style={{
                      backgroundColor: card.badgeBg,
                      border: `1px solid ${card.badgeBorder}`,
                      borderRadius: '999px',
                      padding: '4px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    {card.key === 'plans' && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    )}
                    {card.key === 'complaints' && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={card.badgeColor} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    )}
                    {card.key === 'mechanic' && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={card.badgeColor} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                    )}
                    <span
                      style={{
                        color: card.badgeColor,
                        fontSize: '10px',
                        fontWeight: 800,
                        letterSpacing: '0.4px',
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      {card.badge}
                    </span>
                  </div>
                </div>

                {/* Middle: Title & Subtitle */}
                <div style={{ margin: '14px 0 12px 0', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <h3
                    style={{
                      fontSize: '19.5px',
                      fontWeight: 800,
                      color: card.titleColor,
                      margin: 0,
                      fontFamily: "'Outfit', sans-serif",
                      letterSpacing: '-0.2px',
                      lineHeight: 1.25,
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '12.5px',
                      color: card.subColor,
                      lineHeight: 1.45,
                      margin: 0,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {card.subtitle}
                  </p>
                </div>

                {/* Feature Perks Checklist with real SVG icons (Zero emojis) */}
                {card.perks && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', margin: '14px 0 18px 0' }}>
                    {card.perks.map((perk) => (
                      <div
                        key={perk.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          color: card.perkColor || '#1e40af',
                          background: card.perkBg || 'rgba(255, 255, 255, 0.75)',
                          border: `1px solid ${card.perkBorder || '#bfdbfe'}`,
                          borderRadius: '8px',
                          padding: '5px 9px',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', color: card.key === 'plans' ? '#1d4ed8' : (card.key === 'complaints' ? '#ea580c' : '#059669') }}>
                          {renderPerkIcon(perk.icon)}
                        </span>
                        <span>{perk.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom: Solid/Luminous Action Pill Button */}
              <div
                style={{
                  background: card.pillBtnBg,
                  border: card.pillBtnBorder || 'none',
                  borderRadius: '999px',
                  height: '40px',
                  paddingLeft: '16px',
                  paddingRight: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  boxSizing: 'border-box',
                  boxShadow: card.pillShadow,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  marginTop: 'auto',
                }}
              >
                <span
                  style={{
                    color: card.pillBtnColor,
                    fontSize: '12.5px',
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.1px',
                  }}
                >
                  {card.actionLabel}
                </span>
                <div
                  style={{
                    backgroundColor: card.pillArrowBg,
                    width: '26px',
                    height: '26px',
                    borderRadius: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginLeft: '8px',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={card.pillArrowColor} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </section>

      {/* 5. ELEVATED TRUST PILLARS ("Why Choose Zevota Care?") */}
      <section style={trustSectionWrapStyle} aria-label="Why Choose Zevota Care">
        <div style={trustCardStyle}>
          <div style={trustHeaderStyle}>
            <div style={trustBadgeHeaderStyle}>
              <span className="zc-eyebrow-pulse-dot" style={eyebrowDotStyle} />
              <span>THE ZEVOTA CARE PROMISE</span>
            </div>
            <h3 style={trustHeadingStyle}>Why Choose Zevota Care?</h3>
            <p style={trustSubheadingStyle}>Reliable home maintenance engineered for safety, speed, and complete peace of mind.</p>
          </div>

          <div style={trustGridStyle}>
            {TRUST_PILLARS.map((pillar) => (
              <div key={pillar.title} className="zc-desktop-trust-card" style={trustColStyle}>
                <div
                  className="zc-trust-icon-box"
                  style={{
                    ...trustIconBoxStyle,
                    backgroundColor: pillar.bgColor,
                    borderColor: pillar.borderColor,
                  }}
                >
                  {pillar.icon(pillar.accentColor)}
                </div>

                <div
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: pillar.accentColor,
                    backgroundColor: pillar.bgColor,
                    border: `1px solid ${pillar.borderColor}`,
                    borderRadius: '20px',
                    padding: '3px 10px',
                    letterSpacing: '0.6px',
                    fontFamily: "'Outfit', sans-serif",
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                  }}
                >
                  {pillar.badgeText}
                </div>

                <h4 style={trustPillarTitleStyle}>{pillar.title}</h4>
                <p style={trustPillarDescStyle}>{pillar.desc}</p>

                <div className="zc-trust-chip" style={trustChipStyle}>
                  <IconMiniCheck size={11} color={pillar.accentColor} />
                  <span>{pillar.chipText}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   STYLES: Urban Company Desktop Web View (Luxury Shadows & App Fonts)
   ============================================================ */
const wrapperStyle = {
  width: '100%',
  paddingBottom: '32px',
  fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
};

const heroCardStyle = {
  width: '100%',
  position: 'relative',
  background: 'radial-gradient(circle at 92% 16%, rgba(8, 120, 248, 0.16) 0%, transparent 48%), radial-gradient(circle at 8% 88%, rgba(245, 158, 11, 0.08) 0%, transparent 44%), linear-gradient(135deg, #ffffff 0%, #f8faff 45%, #eff6ff 100%)',
  border: '1.5px solid rgba(191, 219, 254, 0.85)',
  borderRadius: '26px',
  padding: '44px 48px',
  boxShadow: '0 24px 64px -16px rgba(8, 120, 248, 0.14), 0 4px 20px rgba(15, 23, 42, 0.04)',
  marginTop: '18px',
  marginBottom: '36px',
  boxSizing: 'border-box',
};

const heroGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1.14fr 0.86fr',
  gap: '36px',
  alignItems: 'center',
};

const heroLeftStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  zIndex: 2,
};

const eyebrowStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '20px',
  padding: '4px 12px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#0878f8',
  letterSpacing: '0.6px',
  width: 'fit-content',
  fontFamily: "'Outfit', sans-serif",
};

const eyebrowDotStyle = {
  width: '6px',
  height: '6px',
  borderRadius: '3px',
  backgroundColor: '#0878f8',
};

const heroHeadlineStyle = {
  fontSize: '46px',
  fontWeight: 900,
  color: '#0f172a',
  lineHeight: 1.15,
  margin: 0,
  letterSpacing: '-1px',
  fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  textShadow: '0 2px 8px rgba(15,23,42,0.03)',
};

const heroSubtextStyle = {
  fontSize: '15.5px',
  color: '#475569',
  lineHeight: 1.6,
  margin: 0,
  maxWidth: '580px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const searchBoxWrapperStyle = {
  position: 'relative',
  width: '100%',
  maxWidth: '580px',
  marginTop: '4px',
};

const searchBoxInnerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  backgroundColor: '#ffffff',
  border: '1.5px solid #bfdbfe',
  borderRadius: '16px',
  padding: '13px 20px',
  boxShadow: '0 10px 28px -4px rgba(8, 120, 248, 0.14), 0 2px 8px rgba(15, 23, 42, 0.04)',
  position: 'relative',
  overflow: 'hidden',
};

const searchInputStyle = {
  border: 'none',
  outline: 'none',
  fontSize: '14.5px',
  color: '#0f172a',
  flex: 1,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontWeight: 500,
  backgroundColor: 'transparent',
  position: 'relative',
  zIndex: 3,
};

const clearBtnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  zIndex: 4,
};

const suggestionsDropdownStyle = {
  position: 'absolute',
  top: '52px',
  left: 0,
  right: 0,
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  border: '1px solid #bfdbfe',
  boxShadow: '0 14px 32px rgba(15, 23, 42, 0.12)',
  zIndex: 100,
  overflow: 'hidden',
  maxHeight: '360px',
  overflowY: 'auto',
};

const suggestionRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '11px 16px',
  width: '100%',
  border: 'none',
  background: 'none',
  fontSize: '13.5px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  color: '#1e293b',
  cursor: 'pointer',
  textAlign: 'left',
};

const ctaButtonsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginTop: '6px',
};

const primaryCtaBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  backgroundColor: '#0878f8',
  color: '#ffffff',
  border: 'none',
  borderRadius: '14px',
  padding: '14px 32px',
  fontSize: '15px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(8, 120, 248, 0.35)',
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '0.2px',
};

const secondaryCtaBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: '#ffffff',
  color: '#0878f8',
  border: '1.5px dashed #93c5fd',
  borderRadius: '14px',
  padding: '13px 28px',
  fontSize: '15px',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '0.2px',
};

const trustBulletsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginTop: '10px',
  flexWrap: 'wrap',
};

const trustPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#065f46',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '20px',
  padding: '5px 14px',
};

const trustPillBlueStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#0878f8',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  backgroundColor: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: '20px',
  padding: '5px 14px',
};

const heroRightStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const heroArtCardStyle = {
  position: 'relative',
  width: '100%',
  maxWidth: '510px',
  height: '370px',
  borderRadius: '24px',
  overflow: 'hidden',
  boxShadow: '0 28px 64px -12px rgba(3, 13, 58, 0.42), 0 8px 24px rgba(8, 120, 248, 0.22)',
  border: '2px solid rgba(191, 219, 254, 0.9)',
  backgroundColor: '#03102e',
};

const heroArtImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center right',
  display: 'block',
};

const heroArtOverlayStyle = {
  position: 'absolute',
  inset: 0,
  padding: '30px 28px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  background: 'linear-gradient(90deg, rgba(3, 16, 46, 0.95) 0%, rgba(3, 16, 46, 0.78) 50%, rgba(3, 16, 46, 0.15) 100%)',
  pointerEvents: 'none',
  boxSizing: 'border-box',
};

const heroArtWordmarkWrapStyle = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: '14px',
};

const heroArtTitleStyle = {
  fontSize: '26px',
  fontWeight: 900,
  color: '#ffffff',
  lineHeight: 1.2,
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '-0.3px',
  maxWidth: '260px',
};

const heroArtSubStyle = {
  fontSize: '12.5px',
  fontWeight: 500,
  color: 'rgba(255, 255, 255, 0.88)',
  lineHeight: 1.5,
  marginTop: '10px',
  maxWidth: '240px',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const heroFloatingBadgeTopStyle = {
  position: 'absolute',
  top: '20px',
  right: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.97)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRadius: '14px',
  padding: '8px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  boxShadow: '0 10px 28px rgba(0, 0, 0, 0.22)',
  border: '1px solid rgba(255, 255, 255, 0.9)',
  zIndex: 10,
};

const heroFloatingBadgeStyle = {
  position: 'absolute',
  bottom: '20px',
  right: '20px',
  backgroundColor: 'rgba(255, 255, 255, 0.97)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRadius: '14px',
  padding: '10px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  boxShadow: '0 10px 28px rgba(0, 0, 0, 0.22)',
  border: '1px solid rgba(255, 255, 255, 0.9)',
  zIndex: 10,
};

/* Promotional Banner Carousel */
const promoSectionStyle = {
  width: '100%',
  marginBottom: '36px',
  position: 'relative',
};

const promoCarouselViewportStyle = {
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  borderRadius: '24px',
  padding: '6px 2px',
};

const promoTrackStyle = {
  display: 'flex',
  flexDirection: 'row',
  gap: '24px',
  width: '100%',
  transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
  willChange: 'transform',
};

const promoCardStyle = {
  flex: '0 0 calc(50% - 12px)',
  width: 'calc(50% - 12px)',
  height: '318px',
  borderRadius: '22px',
  overflow: 'hidden',
  cursor: 'default',
  position: 'relative',
  backgroundColor: '#03102e',
  boxShadow: '0 14px 34px -8px rgba(8, 120, 248, 0.16), 0 2px 8px rgba(15, 23, 42, 0.04)',
  border: '1.5px solid rgba(191, 219, 254, 0.75)',
  boxSizing: 'border-box',
};

const promoImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const arrowBtnStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '44px',
  height: '44px',
  borderRadius: '22px',
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(226, 232, 240, 0.9)',
  color: '#0f172a',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.16)',
  zIndex: 10,
};

const arrowBtnLeftStyle = {
  ...arrowBtnStyle,
  left: '14px',
};

const arrowBtnRightStyle = {
  ...arrowBtnStyle,
  right: '14px',
};

const dotsWrapStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  marginTop: '16px',
};

const dotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '4px',
  backgroundColor: '#cbd5e1',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  transition: 'all 0.24s ease',
};

const dotActiveStyle = {
  width: '28px',
  height: '8px',
  borderRadius: '4px',
  backgroundColor: '#0878f8',
  boxShadow: '0 0 12px rgba(8, 120, 248, 0.55)',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  transition: 'all 0.24s ease',
};

/* General Section Wrappers */
const sectionWrapStyle = {
  width: '100%',
  marginBottom: '36px',
};

const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  marginBottom: '18px',
};

const sectionTitleStyle = {
  fontSize: '25px',
  fontWeight: 900,
  color: '#0f172a',
  margin: '0 0 5px 0',
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '-0.4px',
};

const sectionSubtitleStyle = {
  fontSize: '14.5px',
  color: '#64748b',
  margin: 0,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  lineHeight: 1.45,
};

const viewAllBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  background: 'none',
  border: 'none',
  fontSize: '13.5px',
  fontWeight: 700,
  color: '#0878f8',
  cursor: 'pointer',
  fontFamily: "'Outfit', sans-serif",
};

const viewAllPillBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#ffffff',
  color: '#0878f8',
  border: '1.5px solid #bfdbfe',
  borderRadius: '10px',
  padding: '8px 18px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Outfit', sans-serif",
};

/* Explore Services 5-Column Grid */
const servicesGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: '20px',
};

const serviceCardStyle = {
  backgroundColor: '#ffffff',
  border: '1.5px solid #e2e8f0',
  borderRadius: '22px',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  cursor: 'pointer',
  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
  position: 'relative',
  minHeight: '272px',
  boxSizing: 'border-box',
};

const serviceBannerWrapStyle = {
  width: '100%',
  height: '138px',
  borderRadius: '16px',
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: '#f1f5f9',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)',
  marginBottom: '12px',
  flexShrink: 0,
};

const serviceBigImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const serviceFloatingBadgesRowStyle = {
  position: 'absolute',
  top: '8px',
  left: '8px',
  right: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '4px',
  pointerEvents: 'none',
};

const serviceBadgeStyle = {
  fontSize: '10.5px',
  fontWeight: 700,
  color: '#0f172a',
  backgroundColor: 'rgba(255, 255, 255, 0.94)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.85)',
  borderRadius: '6px',
  padding: '3px 7px',
  fontFamily: "'Outfit', sans-serif",
  whiteSpace: 'nowrap',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
};

const serviceAmcTagStyle = {
  fontSize: '10.5px',
  fontWeight: 700,
  color: '#1d4ed8',
  backgroundColor: 'rgba(239, 246, 255, 0.96)',
  backdropFilter: 'blur(8px)',
  border: '1px solid #bfdbfe',
  borderRadius: '6px',
  padding: '3px 7px',
  fontFamily: "'Outfit', sans-serif",
  whiteSpace: 'nowrap',
  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.12)',
};

const serviceCardInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '4px',
  width: '100%',
  padding: '0 4px',
  marginBottom: '10px',
  textAlign: 'left',
};

const serviceNameStyle = {
  fontSize: '16.5px',
  fontWeight: 800,
  color: '#0f172a',
  lineHeight: 1.25,
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '-0.2px',
};

const serviceDescStyle = {
  fontSize: '12px',
  fontWeight: 500,
  color: '#64748b',
  lineHeight: 1.35,
  margin: 0,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const serviceBottomCtaStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '8px 4px 2px 4px',
  borderTop: '1px solid #f1f5f9',
  boxSizing: 'border-box',
};

const serviceCtaTextStyle = {
  fontSize: '12.5px',
  fontWeight: 700,
  color: '#0878f8',
  fontFamily: "'Outfit', sans-serif",
};

const serviceCtaArrowStyle = {
  fontSize: '13px',
  fontWeight: 700,
  color: '#0878f8',
  display: 'inline-block',
};

/* Full-Screen Ambient Quick Services Ticker */
const fullBleedTickerSectionStyle = {
  width: '100vw',
  position: 'relative',
  left: '50%',
  right: '50%',
  marginLeft: '-50vw',
  marginRight: '-50vw',
  padding: '24px 0 20px 0',
  backgroundColor: 'rgba(248, 250, 252, 0.88)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderTop: '1px solid #e2e8f0',
  borderBottom: '1px solid #e2e8f0',
  marginTop: '12px',
  marginBottom: '40px',
  overflow: 'hidden',
  boxSizing: 'border-box',
};

const tickerInnerContentStyle = {
  maxWidth: '1420px',
  margin: '0 auto',
  padding: '0 32px',
  boxSizing: 'border-box',
};

const tickerHeaderRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '14px',
  paddingBottom: '10px',
  borderBottom: '1px solid #e2e8f0',
};

const tickerHeaderLeftStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const tickerHeaderDotStyle = {
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  backgroundColor: '#10b981',
  boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
};

const tickerHeaderLabelStyle = {
  fontSize: '11.5px',
  fontWeight: 800,
  color: '#0f172a',
  letterSpacing: '0.6px',
  fontFamily: "'Outfit', sans-serif",
};

const tickerHeaderHintStyle = {
  fontSize: '11.5px',
  fontWeight: 600,
  color: '#64748b',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const tickerMaskContainerStyle = {
  width: '100vw',
  overflow: 'hidden',
  position: 'relative',
  padding: '4px 0',
  maskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)',
  WebkitMaskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)',
  pointerEvents: 'none',
};

const tickerTrackStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '18px',
  width: 'max-content',
  userSelect: 'none',
  pointerEvents: 'none',
};

const tickerCardNonClickableStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  width: '100px',
  flexShrink: 0,
  padding: '12px 10px',
  borderRadius: '18px',
  backgroundColor: '#ffffff',
  border: '1.2px solid #e2e8f0',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
  cursor: 'default',
  pointerEvents: 'none',
  userSelect: 'none',
};

const tickerSquircleStyle = {
  width: '54px',
  height: '54px',
  borderRadius: '16px',
  background: 'linear-gradient(145deg, #f8faff 0%, #eff6ff 100%)',
  border: '1.2px solid #dbeafe',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.06)',
  pointerEvents: 'none',
};

const tickerTitleStyle = {
  fontSize: '11.5px',
  fontWeight: 700,
  color: '#0f172a',
  textAlign: 'center',
  fontFamily: "'Outfit', sans-serif",
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '88px',
  pointerEvents: 'none',
};

/* Complete Care AMC 3-Grid */
const amcGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '22px',
};

const amcCardStyle = {
  backgroundColor: '#ffffff',
  border: '1.5px solid #e2e8f0',
  borderRadius: '22px',
  padding: '0',
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.07), 0 2px 6px rgba(8, 120, 248, 0.04)',
  overflow: 'hidden',
  minHeight: '270px',
};

const amcAccentBarStyle = {
  width: '100%',
  height: '5px',
  flexShrink: 0,
};

const amcCardContentStyle = {
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  flex: 1,
  justifyContent: 'space-between',
};

const amcCardTopStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const amcIconBoxStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '18px',
  overflow: 'hidden',
  backgroundColor: '#f1f5f9',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.06)',
};

const amcIconImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const amcBadgeStyle = {
  fontSize: '11.5px',
  fontWeight: 700,
  padding: '5px 12px',
  borderRadius: '20px',
  border: '1px solid transparent',
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '0.2px',
};

const amcCardBodyStyle = {
  flex: 1,
};

const amcCardTitleStyle = {
  fontSize: '19px',
  fontWeight: 800,
  color: '#0f172a',
  margin: '0 0 6px 0',
  fontFamily: "'Outfit', sans-serif",
};

const amcCardDescStyle = {
  fontSize: '13.5px',
  color: '#475569',
  lineHeight: 1.55,
  margin: 0,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const amcCardBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#0878f8',
  color: '#ffffff',
  borderRadius: '12px',
  padding: '12px 20px',
  fontSize: '14px',
  fontWeight: 700,
  fontFamily: "'Outfit', sans-serif",
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(8, 120, 248, 0.3)',
};

const amcArrowCircleStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.25)',
  width: '22px',
  height: '22px',
  borderRadius: '11px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
};

/* Trust Bar */
const trustSectionWrapStyle = {
  width: '100%',
  marginBottom: '32px',
};

const trustCardStyle = {
  backgroundColor: '#ffffff',
  background: 'linear-gradient(135deg, #f8faff 0%, #eff6ff 50%, #ffffff 100%)',
  border: '1.5px solid rgba(191, 219, 254, 0.75)',
  borderRadius: '24px',
  padding: '36px 36px 32px 36px',
  boxShadow: '0 16px 36px -10px rgba(8, 120, 248, 0.1), 0 4px 12px rgba(15, 23, 42, 0.03)',
  boxSizing: 'border-box',
};

const trustHeaderStyle = {
  textAlign: 'center',
  marginBottom: '26px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const trustBadgeHeaderStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '7px',
  backgroundColor: '#ffffff',
  border: '1px solid #bfdbfe',
  borderRadius: '20px',
  padding: '4px 14px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#0878f8',
  letterSpacing: '0.6px',
  fontFamily: "'Outfit', sans-serif",
  marginBottom: '10px',
};

const trustHeadingStyle = {
  fontSize: '24px',
  fontWeight: 900,
  color: '#0f172a',
  margin: '0 0 6px 0',
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '-0.3px',
};

const trustSubheadingStyle = {
  fontSize: '14px',
  color: '#64748b',
  margin: 0,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  maxWidth: '560px',
};

const trustGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '18px',
};

const trustColStyle = {
  backgroundColor: '#ffffff',
  border: '1.5px solid #e2e8f0',
  borderRadius: '22px',
  padding: '28px 20px 22px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
  cursor: 'default',
};

const trustIconBoxStyle = {
  width: '60px',
  height: '60px',
  borderRadius: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '14px',
  flexShrink: 0,
  borderWidth: '1.5px',
  borderStyle: 'solid',
};

const trustPillarTitleStyle = {
  fontSize: '16.5px',
  fontWeight: 800,
  color: '#0f172a',
  margin: '0 0 8px 0',
  fontFamily: "'Outfit', sans-serif",
  lineHeight: 1.25,
  minHeight: '42px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const trustPillarDescStyle = {
  fontSize: '12.5px',
  color: '#64748b',
  lineHeight: 1.5,
  margin: '0 0 16px 0',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  flex: 1,
};

const trustChipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '4px 10px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#334155',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  marginTop: 'auto',
};
