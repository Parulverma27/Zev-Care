import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Modal, Platform, useWindowDimensions } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { searchAllServices } from '../../config/serviceCatalogUtils';
import HomeDesktopWebView from '../components/HomeDesktopWebView';
import { resolveImageUri, DEFAULT_BANNERS } from '../../utils/imageUtils';
import { SERVICE_IMAGES, COMPLAINT_CATEGORY_IMAGES } from '../../utils/bundledImages';
import { AppIcon } from '../../components/AppIcons';
import ZevotaLogo from '../../components/ZevotaLogo';
import GoogleMapsLocationPicker from '../../components/GoogleMapsLocationPicker';
import { upsertDefaultAddress } from '../../utils/savedAddresses';

const profilePic = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120';
const zevotaCareWordmark = require('../../../assets/zevota-care-wordmark.png');

const TRUST_FEATURES = [
  {
    label: 'Certified\nSpecialists',
    route: '/user/bookings/new',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 11 11 13 15 9" />
      </svg>
    ),
  },
  {
    label: 'Trusted\nQuality',
    route: '/user/bookings/new',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  },
  {
    label: 'Fast &\nReliable',
    route: '/user/bookings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    label: 'Get Expert\nHelp',
    route: '/user/consultation',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
        <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    ),
  },
];

function Luxury3DShieldIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="shieldRimGrad_v2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="40%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="shieldFacetLeft_v2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="shieldFacetRight_v2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="60%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="shieldSheen_v2" x1="0%" y1="0%" x2="70%" y2="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="shieldShadow_v2" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="#0f172a" floodOpacity="0.35" />
        </filter>
      </defs>
      <g filter="url(#shieldShadow_v2)">
        <path
          d="M16 2.5L6.5 6.8V14.8C6.5 21.2 10.6 27.2 16 29C21.4 27.2 25.5 21.2 25.5 14.8V6.8L16 2.5Z"
          fill="url(#shieldRimGrad_v2)"
        />
        <path
          d="M16 4.2L8 7.8V14.8C8 20.3 11.4 25.4 16 27V4.2Z"
          fill="url(#shieldFacetLeft_v2)"
        />
        <path
          d="M16 4.2L24 7.8V14.8C24 20.3 20.6 25.4 16 27V4.2Z"
          fill="url(#shieldFacetRight_v2)"
        />
        <path
          d="M16 4.2L8 7.8V14.8C8 17.5 9 20.2 10.8 22.4L20 8.5L16 4.2Z"
          fill="url(#shieldSheen_v2)"
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

function Luxury3DWrenchIcon({ size = 19, variant = 'blue' }) {
  const isBlue = variant === 'blue';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={isBlue ? 'wrenchLuxGrad_blue' : 'wrenchLuxGrad_v3'} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isBlue ? '#60a5fa' : '#fb923c'} />
          <stop offset="50%" stopColor={isBlue ? '#3b82f6' : '#f97316'} />
          <stop offset="100%" stopColor={isBlue ? '#1d4ed8' : '#ea580c'} />
        </linearGradient>
      </defs>
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        stroke={`url(#${isBlue ? 'wrenchLuxGrad_blue' : 'wrenchLuxGrad_v3'})`}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isBlue ? 'rgba(37, 99, 235, 0.15)' : 'rgba(249, 115, 22, 0.15)'}
      />
    </svg>
  );
}


function Luxury3DMechanicIcon({ size = 19, variant = 'teal' }) {
  const isTeal = variant === 'teal';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={isTeal ? 'mechLuxGrad_teal' : 'mechLuxGrad_v3'} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isTeal ? '#6ee7b7' : '#60a5fa'} />
          <stop offset="50%" stopColor={isTeal ? '#10b981' : '#3b82f6'} />
          <stop offset="100%" stopColor={isTeal ? '#059669' : '#1d4ed8'} />
        </linearGradient>
      </defs>
      <path
        d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"
        stroke={`url(#${isTeal ? 'mechLuxGrad_teal' : 'mechLuxGrad_v3'})`}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isTeal ? 'rgba(16, 185, 129, 0.2)' : 'rgba(37, 99, 235, 0.15)'}
      />
      <path
        d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"
        stroke={`url(#${isTeal ? 'mechLuxGrad_teal' : 'mechLuxGrad_v3'})`}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 15v-3a8 8 0 0 1 16 0v3"
        stroke={`url(#${isTeal ? 'mechLuxGrad_teal' : 'mechLuxGrad_v3'})`}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isTeal ? 'rgba(16, 185, 129, 0.14)' : 'rgba(37, 99, 235, 0.12)'}
      />
    </svg>
  );
}

const AMC_HOME_ACTIONS = [
  {
    key: 'plans',
    title: 'My AMC Plan',
    tagline: 'Annual Maintenance Pass',
    actionLabel: 'Explore Plans',
    route: '/user/my-amc',
    cardBg: 'linear-gradient(145deg, #ffffff 0%, #f8fbff 100%)',
    borderColor: '#ffffff',
    boxShadow: '0 12px 26px rgba(15, 23, 42, 0.11), 0 4px 10px rgba(37, 99, 235, 0.1)',
    taglineColor: '#2563eb',
    iconBg: '#f0f7ff',
    iconBorder: '1.2px solid #dbeafe',
    titleColor: '#0f172a',
    pillBtnBg: '#ffffff',
    pillBtnBorder: '#bfdbfe',
    pillBtnColor: '#1d4ed8',
    pillArrowBg: '#eff6ff',
    pillArrowColor: '#1d4ed8',
    icon: <Luxury3DShieldIcon size={20} />,
  },
  {
    key: 'complaints',
    title: 'AMC Complaints',
    tagline: 'Express Priority Support',
    actionLabel: 'Raise Issue',
    route: '/user/complains',
    cardBg: 'linear-gradient(145deg, #ffffff 0%, #f8fbff 100%)',
    borderColor: '#ffffff',
    boxShadow: '0 12px 26px rgba(15, 23, 42, 0.11), 0 4px 10px rgba(37, 99, 235, 0.1)',
    taglineColor: '#2563eb',
    iconBg: '#f0f7ff',
    iconBorder: '1.2px solid #dbeafe',
    titleColor: '#0f172a',
    pillBtnBg: '#ffffff',
    pillBtnBorder: '#bfdbfe',
    pillBtnColor: '#1d4ed8',
    pillArrowBg: '#eff6ff',
    pillArrowColor: '#1d4ed8',
    icon: <Luxury3DWrenchIcon size={19} variant="blue" />,
  },
  {
    key: 'mechanic',
    title: 'My Mechanic',
    tagline: 'Free Doorstep Diagnosis',
    actionLabel: 'Book Free',
    route: '/user/consultation',
    cardBg: 'linear-gradient(135deg, #ffffff 0%, #f4fdf9 100%)',
    borderColor: '#ffffff',
    boxShadow: '0 12px 26px rgba(15, 23, 42, 0.11), 0 4px 10px rgba(16, 185, 129, 0.1)',
    taglineColor: '#059669',
    iconBg: '#ecfdf5',
    iconBorder: '1.2px solid #bbf7d0',
    titleColor: '#0f172a',
    pillBtnBg: '#ffffff',
    pillBtnBorder: '#a7f3d0',
    pillBtnColor: '#047857',
    pillArrowBg: '#ecfdf5',
    pillArrowColor: '#047857',
    icon: <Luxury3DMechanicIcon size={21} variant="teal" />,
  },
];

const ALL_SERVICES_SLIDESHOW = [
  {
    id: 'ac_service',
    name: 'AC',
    category: 'AC Services',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        {/* Main 3D AC Body */}
        <rect x="2.5" y="5" width="27" height="13" rx="3.5" fill="#f8fafc" stroke="#334155" strokeWidth="1.6" />
        {/* Bottom 3D bevel */}
        <path d="M4 14.5h24a1.5 1.5 0 0 1 1 2.5H3a1.5 1.5 0 0 1 1-2.5z" fill="#e2e8f0" />
        {/* Blue brand accent strip */}
        <line x1="5" y1="12" x2="27" y2="12" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" />
        {/* Dark air louver slot */}
        <rect x="6" y="15" width="20" height="1.8" rx="0.9" fill="#1e293b" />
        {/* LED temp display */}
        <rect x="21" y="7.5" width="5.5" height="2.8" rx="1.2" fill="#0f172a" />
        <circle cx="24.8" cy="8.9" r="0.8" fill="#10b981" />
        {/* Cool 3D airflow waves */}
        <path d="M9 21c0 2-1.8 3-1.8 5" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 21v5.5" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
        <path d="M23 21c0 2 1.8 3 1.8 5" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'washing_machine',
    name: 'Washing Machine',
    category: 'Washing Machine Repair',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        {/* 3D Appliance Cabinet */}
        <rect x="5" y="2.5" width="22" height="27" rx="3.5" fill="#f8fafc" stroke="#334155" strokeWidth="1.6" />
        {/* Top Control Panel */}
        <path d="M5.8 6a2.7 2.7 0 0 1 2.7-2.7h15a2.7 2.7 0 0 1 2.7 2.7v3.2H5.8V6z" fill="#e2e8f0" />
        <line x1="5" y1="9.5" x2="27" y2="9.5" stroke="#475569" strokeWidth="1.4" />
        {/* Detergent drawer & rotary dial */}
        <rect x="7.5" y="5.2" width="5.5" height="2.2" rx="1" fill="#2563eb" />
        <circle cx="22.5" cy="6.3" r="1.6" fill="#0f172a" />
        <circle cx="18.5" cy="6.3" r="0.9" fill="#10b981" />
        {/* Outer Chrome Drum Ring */}
        <circle cx="16" cy="19.5" r="6.8" fill="#cbd5e1" stroke="#334155" strokeWidth="1.5" />
        {/* Inner Glass Porthole */}
        <circle cx="16" cy="19.5" r="4.8" fill="#1e3a8a" />
        {/* Swirling Cyan Water Wave */}
        <path d="M11.6 20c1.5-1.5 3 1.5 4.4 0s2.9-1.5 4.4 0a4.6 4.6 0 0 1-8.8 0z" fill="#38bdf8" />
        <circle cx="14.5" cy="17" r="0.8" fill="#bae6fd" />
      </svg>
    ),
  },
  {
    id: 'refrigerator',
    name: 'Refrigerator',
    category: 'Refrigerator Repair',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        {/* 3D Fridge Body */}
        <rect x="7" y="2.5" width="18" height="27" rx="3" fill="#e2e8f0" stroke="#334155" strokeWidth="1.6" />
        {/* Left light highlight panel */}
        <path d="M8.5 3.5h7v25h-7a1.5 1.5 0 0 1-1.5-1.5v-22a1.5 1.5 0 0 1 1.5-1.5z" fill="#f8fafc" />
        {/* Freezer / Fridge Divider */}
        <line x1="7" y1="12.5" x2="25" y2="12.5" stroke="#334155" strokeWidth="1.6" />
        {/* Chrome Handles */}
        <line x1="10.5" y1="5.8" x2="10.5" y2="10" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="10.5" y1="15.5" x2="10.5" y2="22.5" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" />
        {/* Water / Ice Dispenser Recess */}
        <rect x="18.5" y="16" width="4" height="5.2" rx="1" fill="#0f172a" />
        <circle cx="20.5" cy="18.8" r="1" fill="#38bdf8" />
      </svg>
    ),
  },
  {
    id: 'tv_av',
    name: 'TV & AV',
    category: 'TV & AV Services',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        {/* Outer Dark Bezel */}
        <rect x="2.5" y="5" width="27" height="17.5" rx="2.5" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
        {/* Vivid Sapphire Display */}
        <rect x="4.2" y="6.7" width="23.6" height="14.1" rx="1.2" fill="#2563eb" />
        {/* Screen Diagonal Light Reflection */}
        <path d="M6 6.7h7l-5 14.1H4.2V8a1.2 1.2 0 0 1 1.8-1.3z" fill="#3b82f6" />
        <path d="M10 10l-2.5 5M14 10l-4 7" stroke="#93c5fd" strokeWidth="1.6" strokeLinecap="round" />
        {/* Play Emblem */}
        <polygon points="15,11.5 15,16 19,13.75" fill="#ffffff" />
        {/* Metallic Stand */}
        <path d="M16 22.5v4" stroke="#475569" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M10.5 26.8h11" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'electrician',
    name: 'Electrician',
    category: 'Electrical Services',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        {/* Metal Prongs */}
        <rect x="11" y="3" width="2.4" height="6" rx="1.2" fill="#475569" />
        <rect x="18.6" y="3" width="2.4" height="6" rx="1.2" fill="#475569" />
        {/* 3D Insulated Plug Body */}
        <rect x="7.5" y="8.5" width="17" height="13" rx="4" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.6" />
        <rect x="7.5" y="8.5" width="17" height="3" rx="1.5" fill="#60a5fa" />
        {/* Cord */}
        <path d="M16 21.5v6.5" stroke="#1e293b" strokeWidth="2.8" strokeLinecap="round" />
        {/* Golden 3D Lightning Spark */}
        <polygon points="17.2,11 12.8,15.8 15.8,15.8 14.5,19.8 19.2,14.8 16.2,14.8" fill="#fbbf24" stroke="#fef08a" strokeWidth="0.6" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'plumber',
    name: 'Plumbing',
    category: 'Plumbing Services',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        {/* T-Handle Valve */}
        <rect x="8.5" y="4.5" width="9" height="2.6" rx="1.3" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.2" />
        <rect x="11.8" y="7" width="2.4" height="4" fill="#64748b" />
        {/* Wall Flange */}
        <rect x="3.5" y="9.5" width="2.5" height="8" rx="1" fill="#334155" />
        {/* Chrome Faucet Body */}
        <path
          d="M6 11h11.5c4 0 6.5 2.4 6.5 6.2V19h-4.5v-1.6c0-1.3-.9-2.1-2.2-2.1H6V11z"
          fill="#cbd5e1"
          stroke="#334155"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Glossy 3D Water Droplet */}
        <path
          d="M24.8 25c0 2-1.4 3.5-3.1 3.5s-3.1-1.5-3.1-3.5c0-2 3.1-5 3.1-5s3.1 3 3.1 5z"
          fill="#0ea5e9"
          stroke="#0369a1"
          strokeWidth="1.3"
        />
        <circle cx="20.8" cy="25.2" r="0.8" fill="#e0f2fe" />
      </svg>
    ),
  },
  {
    id: 'carpenter',
    name: 'Carpenter',
    category: 'Carpentry Services',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        {/* Wooden Hammer Handle */}
        <path d="M6.5 25.5L19 13" stroke="#d97706" strokeWidth="3.8" strokeLinecap="round" />
        <path d="M6.5 25.5L19 13" stroke="#fbbf24" strokeWidth="1.6" strokeLinecap="round" />
        {/* Forged Steel Hammer Head */}
        <path
          d="M14.5 8.5l4-4c2-2 5-1.5 6.5 0l-3 3 2.5 2.5 2-2 2.5 2.5-3.5 3.5-2.5-2.5 1.5-1.5-2.5-2.5-4.5 4.5-3-3.5z"
          fill="#475569"
          stroke="#1e293b"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Crossed Cobalt Wrench Accent */}
        <circle cx="7" cy="25" r="1.4" fill="#fef3c7" />
      </svg>
    ),
  },
  {
    id: 'dry_cleaning',
    name: 'Dry Cleaning',
    category: 'Dry Cleaning',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        {/* Plush Backrest */}
        <rect x="6" y="10" width="20" height="9" rx="3.5" fill="#2563eb" stroke="#1e3a8a" strokeWidth="1.5" />
        {/* Armrests & Base */}
        <path
          d="M3.5 15.5a2.5 2.5 0 0 1 5 0v2h15v-2a2.5 2.5 0 0 1 5 0v6a2 2 0 0 1-2 2h-21a2 2 0 0 1-2-2v-6z"
          fill="#60a5fa"
          stroke="#1e3a8a"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Wooden Legs */}
        <path d="M6.5 23.5v3M25.5 23.5v3" stroke="#b45309" strokeWidth="2.4" strokeLinecap="round" />
        {/* Golden Sparkle Stars */}
        <path d="M16 3l1 2.2L19.2 6l-2.2 1-1 2.2-1-2.2L12.8 6 15 5.2 16 3z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.6" />
      </svg>
    ),
  },
  {
    id: 'pest_control',
    name: 'Pest Control',
    category: 'Pest Control Services',
    icon: (
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        {/* 3D Emerald Shield Left Facet */}
        <path d="M16 3L6 7.2v8.3C6 22.8 10.4 27.6 16 29.2V3z" fill="#10b981" />
        {/* 3D Emerald Shield Right Facet */}
        <path d="M16 3l10 4.2v8.3c0 7.3-4.4 12.1-10 13.7V3z" fill="#059669" />
        {/* Shield Border */}
        <path
          d="M16 3L6 7.2v8.3c0 7.3 4.4 12.1 10 13.7 5.6-1.6 10-6.4 10-13.7V7.2L16 3z"
          stroke="#065f46"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Crisp White Checkmark */}
        <polyline points="11.2 16 14.5 19.2 21 12.5" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const MOBILE_EXPLORE_CATEGORIES = [
  {
    id: 'elec',
    name: 'Electrician',
    category: 'Electrician',
    desc: 'Wiring, switches & appliance fixes',
    badge: '30+ Services',
    amcTag: '₹0 with AMC',
    image: SERVICE_IMAGES.electrician,
  },
  {
    id: 'plumb',
    name: 'Plumbing',
    category: 'Plumber',
    desc: 'Pipes, taps, leakage & drainage',
    badge: 'Taps & Pipes',
    amcTag: '₹0 with AMC',
    image: SERVICE_IMAGES.plumber,
  },
  {
    id: 'carp',
    name: 'Carpentry',
    category: 'Carpenter',
    desc: 'Furniture repair, locks & hinges',
    badge: 'Hinges & Locks',
    amcTag: '₹0 with AMC',
    image: SERVICE_IMAGES.carpenter,
  },
  {
    id: 'clean',
    name: 'Dry Cleaning',
    category: 'Dry Cleaning',
    desc: 'Sofa, carpet & curtain deep care',
    badge: 'Deep Cleaning',
    amcTag: 'Doorstep Care',
    image: SERVICE_IMAGES.dryCleaning,
  },
  {
    id: 'pest',
    name: 'Pest Control',
    category: 'Pest Control',
    desc: 'Cockroach, termite & bedbug treatment',
    badge: '100% Safe Herbal',
    amcTag: '30-Day Warranty',
    image: SERVICE_IMAGES.pestControl,
    fullWidth: true,
  },
];

const MOBILE_POPULAR_SERVICES = [
  {
    id: 'pop_ac',
    name: 'AC Foam-Jet Deep Service',
    category: 'AC Services',
    subCategory: 'AC',
    rating: '4.9',
    reviews: '2.4k',
    duration: '45 mins',
    price: '₹399',
    amcNote: '₹0 Labor with AMC',
    image: SERVICE_IMAGES.ac,
  },
  {
    id: 'pop_mcb',
    name: 'MCB & Switchboard Repair',
    category: 'Electrician',
    subCategory: 'MCB & Main Switch',
    rating: '4.9',
    reviews: '1.8k',
    duration: '30 mins',
    price: '₹149',
    amcNote: '₹0 Labor with AMC',
    image: SERVICE_IMAGES.mcb,
  },
  {
    id: 'pop_tap',
    name: 'Tap & Mixer Leakage Fix',
    category: 'Plumber',
    subCategory: 'Tap & Mixer',
    rating: '4.8',
    reviews: '1.5k',
    duration: '30 mins',
    price: '₹149',
    amcNote: '₹0 Labor with AMC',
    image: SERVICE_IMAGES.tap,
  },
  {
    id: 'pop_pest',
    name: 'Kitchen Cockroach Control',
    category: 'Pest Control',
    subCategory: 'Cockroach Control',
    rating: '4.9',
    reviews: '1.2k',
    duration: '60 mins',
    price: '₹499',
    amcNote: 'Odorless Gel',
    image: SERVICE_IMAGES.cockroach,
  },
  {
    id: 'pop_sofa',
    name: 'Sofa Deep Dry Cleaning',
    category: 'Dry Cleaning',
    subCategory: 'Fabric Sofa',
    rating: '4.9',
    reviews: '980',
    duration: '60 mins',
    price: '₹599',
    amcNote: 'Eco Shampoo',
    image: SERVICE_IMAGES.sofaFabric,
  },
];

const MOBILE_TRUST_CARDS = [
  {
    id: 'certified',
    title: 'Certified Specialists',
    desc: 'Background-verified & trained experts',
    badge: '100% Verified',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    route: '/user/bookings/new',
    iconName: 'shield',
  },
  {
    id: 'quality',
    title: 'Trusted Quality',
    desc: 'Genuine spare parts & upfront quotes',
    badge: 'Zero Hidden Fees',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    route: '/user/bookings/new',
    iconName: 'check',
  },
  {
    id: 'fast',
    title: 'Fast & Reliable',
    desc: 'On-time doorstep arrival & live tracking',
    badge: '30-Min Dispatch',
    color: '#4f46e5',
    bg: '#eef2ff',
    border: '#c7d2fe',
    route: '/user/bookings',
    iconName: 'clock',
  },
  {
    id: 'expert',
    title: 'Get Expert Help',
    desc: '₹0 diagnostic visit & instant support',
    badge: '24/7 Assistance',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    route: '/user/consultation',
    iconName: 'headphones',
  },
];

const SEARCH_PLACEHOLDERS = [
  'Search for electrician...',
  'Search for plumber...',
  'Search for AC service...',
  'Search for carpenter...',
  'Search for dry cleaning...',
  'Search for pest control...',
  'Search for other services...',
];

export default function HomeScreen({ onNavigate }) {
  const { activeUser, updateProfile, banners, bookings } = useApp();
  const navigate = useNavigate();

  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const defaultAddr =
    (activeUser?.saved_addresses || []).find((a) => a.isDefault)?.address ||
    activeUser?.address ||
    'Select your location';
  const [selectedLocation, setSelectedLocation] = useState(defaultAddr);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const activeBannersList = React.useMemo(() => {
    const heroBanners = (banners || []).filter(
      (b) => (b.type === 'hero' || b.type === 'HERO') && b.status !== 'INACTIVE'
    );
    if (heroBanners.length > 0) return heroBanners;
    return DEFAULT_BANNERS;
  }, [banners]);

  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);
  const [touchStartPos, setTouchStartPos] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const handlePrevSlide = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (activeBannersList.length <= 1) return;
    setCurrentHeroIdx((prev) => (prev === 0 ? activeBannersList.length - 1 : prev - 1));
  };

  const handleNextSlide = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (activeBannersList.length <= 1) return;
    setCurrentHeroIdx((prev) => (prev + 1) % activeBannersList.length);
  };

  const onTouchStartHandler = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setTouchStartPos(clientX);
    setIsSwiping(false);
  };

  const onTouchMoveHandler = (e) => {
    if (touchStartPos === null) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    if (Math.abs(clientX - touchStartPos) > 8) {
      setIsSwiping(true);
    }
  };

  const onTouchEndHandler = (e) => {
    if (touchStartPos === null) return;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = clientX - touchStartPos;
    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        handlePrevSlide();
      } else {
        handleNextSlide();
      }
    }
    setTimeout(() => {
      setTouchStartPos(null);
      setIsSwiping(false);
    }, 60);
  };

  useEffect(() => {
    if (activeBannersList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentHeroIdx((prev) => (prev + 1) % activeBannersList.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeBannersList, currentHeroIdx]);

  const isAnonymous = Boolean(
    !activeUser ||
    activeUser.isAnonymous ||
    (activeUser.isGuest && !activeUser.phone) ||
    (!activeUser.phone && !activeUser.guestId)
  );

  const isGuest = Boolean(
    activeUser?.isGuest ||
    activeUser?.id === 0 ||
    activeUser?.name === 'Guest User' ||
    isAnonymous
  );

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showPlanRequiredModal, setShowPlanRequiredModal] = useState(false);
  const [guestModalContext, setGuestModalContext] = useState({
    title: '',
    message: '',
  });

  const planName = activeUser?.subscription_plan || 'None';
  const hasActiveAmc = !isGuest && activeUser?.subscription_status === 'ACTIVE' && planName !== 'None' && planName !== 'None / Inactive';

  useEffect(() => {
    if (isGuest) {
      setSelectedLocation('Select your location');
      return;
    }
    const saved =
      (activeUser?.saved_addresses || []).find((a) => a.isDefault)?.address ||
      activeUser?.address;
    const resolved = saved && saved.trim() ? saved.trim() : 'Select your location';
    setSelectedLocation(resolved);
  }, [activeUser?.address, activeUser?.saved_addresses, isGuest, activeUser?.id]);

  const activeHeroBanner = activeBannersList[currentHeroIdx % activeBannersList.length] || activeBannersList[0];

  const liveActiveBooking = React.useMemo(() => {
    if (!activeUser || isGuest || !Array.isArray(bookings)) return null;
    const activeStatuses = ['CONFIRMED', 'ASSIGNED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'INSPECTION_DONE'];
    return bookings.find((b) => {
      const st = String(b?.status || '').toUpperCase();
      if (!activeStatuses.includes(st)) return false;
      if (b.user_id != null && activeUser.id != null && String(b.user_id) === String(activeUser.id)) return true;
      if (b.user_phone && activeUser.phone && String(b.user_phone).slice(-10) === String(activeUser.phone).slice(-10)) return true;
      return false;
    }) || null;
  }, [bookings, activeUser, isGuest]);

  const filteredSuggestions = searchQuery.trim()
    ? searchAllServices(searchQuery).slice(0, 8)
    : [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  const displayName = React.useMemo(() => {
    if (!activeUser || isAnonymous) return 'Guest';
    let name = (activeUser.name || '').trim();
    if (!name || name.toLowerCase() === 'guest user' || name.toLowerCase() === 'guest') {
      try {
        const draft = sessionStorage.getItem('zevota_reg_draft');
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed?.name && parsed.name.trim()) name = parsed.name.trim();
        }
      } catch (e) {}
    }
    if (name && name.toLowerCase() !== 'guest user' && name.toLowerCase() !== 'guest') {
      return name.split(' ')[0];
    }
    return activeUser.isGuest ? 'Guest' : 'Member';
  }, [activeUser, isAnonymous]);

  const handleNav = (path, paramObj) => {
    if (navigate) {
      navigate(path, paramObj);
    } else if (onNavigate) {
      onNavigate(path, paramObj);
    }
  };

  const handleAmcAction = (item) => {
    if (item.key === 'plans') {
      handleNav('/user/my-amc');
      return;
    }
    if (item.key === 'mechanic') {
      if (isAnonymous) {
        setGuestModalContext({
          title: 'Sign In / Register Required',
          message: 'Please sign in or register to book your complimentary My Mechanic consultation.',
        });
        setShowGuestModal(true);
        return;
      }
      handleNav('/user/consultation');
      return;
    }
    if (item.key === 'complaints') {
      if (isGuest) {
        setGuestModalContext({
          title: 'Sign In / Register Required',
          message: 'AMC complaints with ₹0 breakdown labor and priority repairs are exclusively reserved for AMC members. Please sign in or register to get protected.',
        });
        setShowGuestModal(true);
        return;
      }
      if (!hasActiveAmc) {
        setShowPlanRequiredModal(true);
        return;
      }
      handleNav('/user/complains');
      return;
    }
    handleNav(item.route);
  };

  const selectLocation = (loc, extraCoords = {}) => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    const cleanAddr = String(loc || '').trim();
    if (!cleanAddr) return;
    setSelectedLocation(cleanAddr);
    if (updateProfile && activeUser && (activeUser.id != null || activeUser.phone)) {
      const updatedAddresses = upsertDefaultAddress(
        activeUser.saved_addresses || [],
        cleanAddr,
        {
          latitude: extraCoords.latitude ?? extraCoords.lat,
          longitude: extraCoords.longitude ?? extraCoords.lng,
        }
      );
      updateProfile({
        ...activeUser,
        address: cleanAddr,
        saved_addresses: updatedAddresses,
        ...(extraCoords.latitude != null || extraCoords.lat != null
          ? { latitude: extraCoords.latitude ?? extraCoords.lat }
          : {}),
        ...(extraCoords.longitude != null || extraCoords.lng != null
          ? { longitude: extraCoords.longitude ?? extraCoords.lng }
          : {}),
      });
    }
  };

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Desktop Web View (Urban Company style) - strictly active on desktop viewports
  if (isDesktop) {
    return (
      <View style={{ flex: 1, width: '100%', minHeight: '100vh', backgroundColor: '#e4f0ff' }}>
        <HomeDesktopWebView
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filteredSuggestions={filteredSuggestions}
          placeholderIdx={placeholderIdx}
          placeholders={SEARCH_PLACEHOLDERS}
          onSelectSuggestion={(item) => {
            setSearchQuery('');
            const navPayload = {
              state: {
                preSelectedCategory: item.category_name || item.name,
                preSelectedSubCategory: item.sub_category_name || item.name,
                preSelectedService: item.name,
                bookingMode: 'service',
              },
            };
            handleNav('/user/bookings/new', navPayload);
          }}
          onSelectCategory={(category) => {
            handleNav('/user/bookings/new', {
              state: {
                preSelectedCategory: category,
                bookingMode: 'service',
              },
            });
          }}
          onNavigate={handleNav}
        />

        {/* Registration Required Modal for Guests on Desktop */}
        <Modal
          visible={showGuestModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowGuestModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.guestModalCard}>
              <TouchableOpacity
                style={styles.guestCloseBtn}
                onPress={() => setShowGuestModal(false)}
                accessibilityLabel="Close modal"
              >
                <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>

              <View style={styles.guestIconCircle}>
                <AppIcon name="lock" size={26} color="#B45309" strokeWidth={2.2} />
              </View>

              <Text style={styles.guestModalTitle}>
                {guestModalContext.title || (isAnonymous ? 'Register First' : 'Complete Your Profile First')}
              </Text>
              <Text style={styles.guestModalSub}>
                {guestModalContext.message ||
                  (isAnonymous
                    ? 'Please register your account first to set your delivery address and book services.'
                    : 'Please complete your profile to set and save your delivery address and book services.')}
              </Text>

              <TouchableOpacity
                style={styles.guestPrimaryBtn}
                onPress={() => {
                  setShowGuestModal(false);
                  handleNav('/user/register');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.guestPrimaryBtnText}>
                  {isAnonymous ? 'Register First →' : 'Complete Your Profile →'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.guestOutlineBtn}
                onPress={() => {
                  setShowGuestModal(false);
                  handleNav('/user/login');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.guestOutlineBtnText}>Already have an account? Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* AMC Plan Required Modal on Desktop */}
        <Modal
          visible={showPlanRequiredModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPlanRequiredModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.guestModalCard}>
              <TouchableOpacity
                style={styles.guestCloseBtn}
                onPress={() => setShowPlanRequiredModal(false)}
                accessibilityLabel="Close modal"
              >
                <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>

              <View style={[styles.guestIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Luxury3DShieldIcon size={28} />
              </View>

              <Text style={styles.guestModalTitle}>AMC Plan Required</Text>
              <Text style={styles.guestModalSub}>
                AMC complaints with ₹0 breakdown labor, free repairs, and priority technician visits are exclusive to active AMC plan members. Protect your home appliances today!
              </Text>

              <TouchableOpacity
                style={styles.guestPrimaryBtn}
                onPress={() => {
                  setShowPlanRequiredModal(false);
                  handleNav('/user/plans');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.guestPrimaryBtnText}>Explore AMC Plans →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.guestOutlineBtn}
                onPress={() => {
                  setShowPlanRequiredModal(false);
                  handleNav('/user/consultation');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.guestOutlineBtnText}>Book My Mechanic (₹0 Diagnosis)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // 100% UNTOUCHED Mobile App View (Phones & small screens)
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Luxury Hero Header (Clean & Minimal Mobile App Header) */}
      <View style={styles.luxuryHeroContainer}>
        <View style={styles.luxuryHeroCard}>
          <Image
            source={{ uri: SERVICE_IMAGES.homeHeaderBg }}
            style={styles.luxuryHeroBgImage}
            resizeMode="cover"
          />
          <View style={styles.luxuryHeroGradientOverlay} />

          {/* Top Brand & Status Row */}
          <View style={styles.heroTopBar}>
            {/* Left: Brand Identity in exact logo font */}
            <TouchableOpacity
              onPress={() => handleNav('/user/home')}
              activeOpacity={0.85}
              style={styles.heroBrandWrap}
              accessibilityRole="button"
              accessibilityLabel="Zevota Care"
            >
              <Image
                source={zevotaCareWordmark}
                style={styles.heroBrandWordmark}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Right: Greeting, Profile Avatar */}
            <View style={styles.heroActionsRow}>
              <View style={styles.heroGreetingBlock}>
                <Text style={styles.heroGreetingSub}>{getGreeting()}</Text>
                <Text style={styles.heroGreetingName}>{displayName}</Text>
              </View>

              <TouchableOpacity
                style={styles.heroAvatarCircle}
                onPress={() => handleNav('/user/profile')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Go to profile"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Headline & Subtitle */}
          <View style={styles.heroTextContent}>
            <Text style={styles.heroHeadline}>Your Home.</Text>
            <Text style={styles.heroHeadline}>
              Our <Text style={styles.heroHeadlineGold}>Responsibility.</Text>
            </Text>
            <Text style={styles.heroSubHeadline}>
              Trusted experts for every home service.{'\n'}Fast and reliable experience.
            </Text>
          </View>
        </View>

        {/* Floating Pill Search Bar */}
        <View style={styles.floatingSearchWrapper}>
          <View style={styles.floatingSearchBox}>
            <span style={styles.searchIconSvg}><SvgSearch /></span>
            {!searchQuery && (
              <div
                style={{
                  position: 'absolute',
                  left: 42,
                  right: 16,
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
                    fontSize: '13.5px',
                    fontWeight: 500,
                    color: '#334155',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    display: 'block',
                  }}
                >
                  {SEARCH_PLACEHOLDERS[placeholderIdx]}
                </span>
              </div>
            )}
            <TextInput
              style={styles.floatingSearchInput}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowSuggestions(text.trim().length > 0);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setShowSuggestions(true);
              }}
              placeholder=""
              placeholderTextColor="transparent"
            />
            {searchQuery.trim().length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                style={{ padding: 6, marginRight: 2, zIndex: 10 }}
              >
                <AppIcon name="x" size={14} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {showSuggestions && filteredSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {filteredSuggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                    if (isGuest) {
                      setGuestModalContext({
                        title: 'Sign In / Register Required',
                        message: 'Please register your account first to explore and book services.',
                      });
                      setShowGuestModal(true);
                      return;
                    }
                    const navPayload = {
                      state: {
                        preSelectedCategory: item.category_name,
                        preSelectedSubCategory: item.sub_category_name || item.name,
                        preSelectedService: item.name,
                        bookingMode: 'service',
                      },
                    };
                    if (navigate) navigate('/user/bookings/new', navPayload);
                    else if (onNavigate) onNavigate('/user/bookings/new', navPayload);
                  }}
                >
                  <View style={styles.suggestionItemPin}>
                    <AppIcon name="search" size={14} color="#64748b" />
                  </View>
                  <View style={{ flexDirection: 'column', flex: 1 }}>
                    <Text style={styles.suggestionItemText}>{item.name}</Text>
                    <Text style={styles.suggestionItemCat}>{item.category_name}</Text>
                  </View>
                  <Text style={styles.suggestionItemArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.heroCardContainer}>
        <View style={styles.heroCard}>
          {Platform.OS === 'web' ? (
            <div
              style={heroBannerWebCss.slidesWrapper}
              onTouchStart={onTouchStartHandler}
              onTouchMove={onTouchMoveHandler}
              onTouchEnd={onTouchEndHandler}
              onMouseDown={onTouchStartHandler}
              onMouseMove={onTouchMoveHandler}
              onMouseUp={onTouchEndHandler}
              onMouseLeave={() => {
                if (touchStartPos !== null) {
                  setTouchStartPos(null);
                  setIsSwiping(false);
                }
              }}
            >
              <div
                style={{
                  ...heroBannerWebCss.sliderTrack,
                  width: `${activeBannersList.length * 100}%`,
                  transform: `translateX(-${(currentHeroIdx % activeBannersList.length) * (100 / activeBannersList.length)}%)`,
                }}
              >
                {activeBannersList.map((banner, idx) => {
                  const bannerFallback =
                    banner?.id === 2 || banner?.id === 5
                      ? (SERVICE_IMAGES.heroBanner2 || '/assets/hero-banner-2.png')
                      : banner?.id === 3 || banner?.id === 6
                        ? (SERVICE_IMAGES.heroBanner3 || '/assets/hero-banner-3.png')
                        : (SERVICE_IMAGES.heroBanner1 || '/assets/hero-banner-1.png');
                  const bannerUri = resolveImageUri(banner?.image_url, bannerFallback);
                  return (
                    <div
                      key={banner.id || idx}
                      onClick={() => {
                        if (!isSwiping) {
                          handleNav(banner?.redirect_url || '/user/bookings/new');
                        }
                      }}
                      style={{
                        ...heroBannerWebCss.slideItem,
                        width: `${100 / activeBannersList.length}%`,
                        cursor: 'pointer',
                      }}
                    >
                      <img
                        src={bannerUri}
                        alt={banner.title || 'Hero Banner'}
                        style={heroBannerWebCss.slideImage}
                        draggable={false}
                        onError={(e) => {
                          if (e?.currentTarget && !e.currentTarget.dataset.errored) {
                            e.currentTarget.dataset.errored = 'true';
                            e.currentTarget.src = bannerFallback;
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleNav(activeHeroBanner?.redirect_url || '/user/bookings/new')}
            >
              <Image
                source={{ uri: resolveImageUri(activeHeroBanner?.image_url, SERVICE_IMAGES.homeHeroBanner) }}
                style={styles.heroBannerImage}
                resizeMode="fill"
              />
            </TouchableOpacity>
          )}

          {activeBannersList.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.mobileBannerArrowBtn, { left: 8 }]}
                onPress={handlePrevSlide}
                activeOpacity={0.8}
              >
                <Text style={styles.mobileBannerArrowText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mobileBannerArrowBtn, { right: 8 }]}
                onPress={handleNextSlide}
                activeOpacity={0.8}
              >
                <Text style={styles.mobileBannerArrowText}>›</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {activeBannersList.length > 1 && (
          <View style={styles.heroDotsContainer}>
            {activeBannersList.map((_, idx) => {
              const isActive = idx === (currentHeroIdx % activeBannersList.length);
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    setCurrentHeroIdx(idx);
                  }}
                  style={[
                    styles.heroDot,
                    isActive ? styles.heroDotActive : styles.heroDotInactive,
                  ]}
                />
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.amcSection}>
        <View style={styles.amcHeaderBlock}>
          <View style={styles.amcHeaderTitleRow}>
            <View style={styles.amcHeaderSparkleIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 12 2" />
              </svg>
            </View>
            <Text style={styles.amcSectionTitle}>Our AMC Services</Text>
          </View>
          <Text style={styles.amcSectionSub}>Everything you need, under one roof</Text>
        </View>

        <style>{`
          .amc-cards-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            width: 100%;
            box-sizing: border-box;
          }
          .amc-card-col {
            display: flex;
            flex-direction: column;
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }
          .amc-card-col-full {
            grid-column: 1 / -1;
          }
          .amc-card-press {
            transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s ease;
          }
          .amc-card-press:hover {
            transform: translateY(-2px);
          }
        `}</style>
        <div className="amc-cards-container">
          {AMC_HOME_ACTIONS.map((item, idx) => {
            const isFullWidth = idx === 2;
            return (
              <div
                key={item.key}
                className={`amc-card-col ${isFullWidth ? 'amc-card-col-full' : ''}`}
                style={{ position: 'relative' }}
              >
                <TouchableOpacity
                  className="amc-card-press"
                  style={[
                    styles.amcLuxuryCard,
                    {
                      backgroundColor: '#ffffff',
                      backgroundImage: item.cardBg,
                      borderColor: item.borderColor,
                      boxShadow: item.boxShadow,
                      position: 'relative',
                      zIndex: 1,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      paddingHorizontal: isFullWidth ? 16 : 14,
                      paddingVertical: isFullWidth ? 16 : 14,
                    },
                  ]}
                  onPress={() => handleAmcAction(item)}
                  activeOpacity={0.88}
                >
                  {isFullWidth ? (
                    /* Row 2: Full-width clean horizontal card for My Mechanic */
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        gap: '12px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: '12px',
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: item.iconBg,
                            border: item.iconBorder,
                            width: '42px',
                            height: '42px',
                            borderRadius: '21px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 4px 10px rgba(15, 23, 42, 0.08)',
                          }}
                        >
                          {item.icon}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              color: item.titleColor,
                              fontSize: '15px',
                              fontWeight: 700,
                              lineHeight: '19px',
                              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                            }}
                          >
                            {item.title}
                          </span>
                          <span
                            style={{
                              color: item.taglineColor,
                              fontSize: '11.5px',
                              fontWeight: 600,
                              lineHeight: '15px',
                              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                            }}
                          >
                            {item.tagline}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          backgroundColor: item.pillBtnBg,
                          border: `1.2px solid ${item.pillBtnBorder}`,
                          height: '32px',
                          paddingLeft: '12px',
                          paddingRight: '5px',
                          borderRadius: '999px',
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.14)',
                        }}
                      >
                        <span
                          style={{
                            color: item.pillBtnColor,
                            fontSize: '11.5px',
                            fontWeight: 700,
                            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.actionLabel}
                        </span>
                        <div
                          style={{
                            backgroundColor: item.pillArrowBg,
                            width: '20px',
                            height: '20px',
                            borderRadius: '10px',
                            marginLeft: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={item.pillArrowColor} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Row 1: Side-by-side clean vertical cards */
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        flex: 1,
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Top: Clean Circular Icon */}
                        <div style={{ marginBottom: '10px' }}>
                          <div
                            style={{
                              backgroundColor: item.iconBg,
                              border: item.iconBorder,
                              width: '36px',
                              height: '36px',
                              borderRadius: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 10px rgba(15, 23, 42, 0.08)',
                            }}
                          >
                            {item.icon}
                          </div>
                        </div>

                        {/* Title & Tagline */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span
                            style={{
                              color: item.titleColor,
                              fontSize: '14px',
                              fontWeight: 700,
                              lineHeight: '18px',
                              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                            }}
                          >
                            {item.title}
                          </span>
                          <span
                            style={{
                              color: item.taglineColor,
                              fontSize: '11px',
                              fontWeight: 600,
                              lineHeight: '14.5px',
                              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                            }}
                          >
                            {item.tagline}
                          </span>
                        </div>
                      </div>

                      {/* Bottom: Sleek Pill Button */}
                      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                        <div
                          style={{
                            backgroundColor: item.pillBtnBg,
                            border: `1.2px solid ${item.pillBtnBorder}`,
                            height: '28px',
                            paddingLeft: '10px',
                            paddingRight: '4px',
                            borderRadius: '999px',
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.14)',
                          }}
                        >
                          <span
                            style={{
                              color: item.pillBtnColor,
                              fontSize: '10.5px',
                              fontWeight: 700,
                              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.actionLabel}
                          </span>
                          <div
                            style={{
                              backgroundColor: item.pillArrowBg,
                              width: '18px',
                              height: '18px',
                              borderRadius: '9px',
                              marginLeft: '5px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={item.pillArrowColor} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TouchableOpacity>
              </div>
            );
          })}
        </div>
      </View>

      {/* HOME SERVICES (Smooth Moving Marquee with Duotone Icons) */}
      <View style={styles.servicesHeaderBlock}>
        <Text style={styles.servicesHeaderTitle}>Home Services</Text>
        <Text style={styles.servicesHeaderSub}>Book professional help, anytime</Text>
      </View>

      <View style={styles.allServicesSection}>
        <style>{`
          @keyframes marqueeScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-33.333%); }
          }
          .services-marquee-track:hover {
            animation-play-state: paused;
          }
        `}</style>
        {Platform.OS === 'web' ? (
          <div style={marqueeWebCss.container}>
            <div style={marqueeWebCss.track} className="services-marquee-track">
              {[...ALL_SERVICES_SLIDESHOW, ...ALL_SERVICES_SLIDESHOW, ...ALL_SERVICES_SLIDESHOW].map((serviceItem, idx) => (
                <div
                  key={`${serviceItem.id}-${idx}`}
                  style={marqueeWebCss.card}
                  onClick={() =>
                    handleNav('/user/bookings/new', {
                      state: {
                        preSelectedCategory: serviceItem.category,
                        preSelectedService: serviceItem.name,
                        bookingMode: 'service',
                      },
                    })
                  }
                  role="button"
                  tabIndex={0}
                >
                  <div style={marqueeWebCss.squircle}>
                    {serviceItem.icon}
                  </div>
                  <div style={marqueeWebCss.labelWrap}>
                    <span style={marqueeWebCss.title}>{serviceItem.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.servicesScrollContainer}
          >
            {ALL_SERVICES_SLIDESHOW.map((serviceItem) => (
              <TouchableOpacity
                key={serviceItem.id}
                style={styles.serviceSlideCardStatic}
                activeOpacity={0.8}
                onPress={() =>
                  handleNav('/user/bookings/new', {
                    state: {
                      preSelectedCategory: serviceItem.category,
                      preSelectedService: serviceItem.name,
                      bookingMode: 'service',
                    },
                  })
                }
              >
                <View style={styles.serviceSquircleStatic}>
                  {serviceItem.icon}
                </View>
                <View style={styles.serviceLabelRowStatic}>
                  <Text style={styles.serviceSlideTitle}>{serviceItem.name}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* YOUR HOME. OUR RESPONSIBILITY. (Clean 4-Pillar Trust Banner with Luxury Home Background) */}
      <View style={styles.trustBanner}>
        <Image
          source={{ uri: SERVICE_IMAGES.trustBannerBg }}
          style={styles.trustBannerBgImage}
          resizeMode="cover"
        />
        <View style={styles.trustBannerOverlay} />
        <Text style={styles.trustTitle}>
          Your Home. <Text style={{ color: '#fbbf24' }}>Our Responsibility.</Text>
        </Text>
        <View style={styles.trustRow}>
          {TRUST_FEATURES.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.trustItem}
              onPress={() => {
                if (isGuest && (item.route.includes('book') || item.route.includes('support'))) {
                  setGuestModalContext({
                    title: 'Sign In / Register Required',
                    message: 'Please register your account first to access this feature.',
                  });
                  setShowGuestModal(true);
                  return;
                }
                handleNav(item.route, { state: {} });
              }}
              activeOpacity={0.8}
            >
              <View style={styles.trustIconWrap}>{item.icon}</View>
              <Text style={styles.trustLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Interactive Map API Picker Modal */}
      {showMapPicker && (
        <Modal visible={true} animationType="slide" transparent>
          <View style={styles.fullMapModalOverlay}>
            <View style={styles.fullMapContainer}>
              <View style={styles.mapModalHeader}>
                <Text style={styles.mapModalHeaderTitle}>Select Location on Map</Text>
                <TouchableOpacity style={styles.mapModalCloseBtn} onPress={() => setShowMapPicker(false)}>
                  <Text style={styles.mapModalCloseText}>✕ Close</Text>
                </TouchableOpacity>
              </View>
              <GoogleMapsLocationPicker
                initialAddress={selectedLocation}
                onClose={() => setShowMapPicker(false)}
                onSelectLocation={(loc) => {
                  const addr = loc?.address || loc?.formatted_address || '';
                  if (addr) {
                    selectLocation(addr, { lat: loc?.lat, lng: loc?.lng });
                  }
                  setShowMapPicker(false);
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Registration Required Modal for Guests */}
      <Modal
        visible={showGuestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGuestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.guestModalCard}>
            <TouchableOpacity
              style={styles.guestCloseBtn}
              onPress={() => setShowGuestModal(false)}
              accessibilityLabel="Close modal"
            >
              <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>

            <View style={styles.guestIconCircle}>
              <AppIcon name="lock" size={26} color="#B45309" strokeWidth={2.2} />
            </View>

            <Text style={styles.guestModalTitle}>
              {guestModalContext.title || (isAnonymous ? 'Register First' : 'Complete Your Profile First')}
            </Text>
            <Text style={styles.guestModalSub}>
              {guestModalContext.message ||
                (isAnonymous
                  ? 'Please register your account first to set your delivery address and book services.'
                  : 'Please complete your profile to set and save your delivery address and book services.')}
            </Text>

            <TouchableOpacity
              style={styles.guestPrimaryBtn}
              onPress={() => {
                setShowGuestModal(false);
                handleNav('/user/register');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.guestPrimaryBtnText}>
                {isAnonymous ? 'Register First →' : 'Complete Your Profile →'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestOutlineBtn}
              onPress={() => {
                setShowGuestModal(false);
                handleNav('/user/login');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.guestOutlineBtnText}>Already have an account? Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AMC Plan Required Modal for Authenticated Users Without Active Plan */}
      <Modal
        visible={showPlanRequiredModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPlanRequiredModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.guestModalCard}>
            <TouchableOpacity
              style={styles.guestCloseBtn}
              onPress={() => setShowPlanRequiredModal(false)}
              accessibilityLabel="Close modal"
            >
              <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>

            <View style={[styles.guestIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Luxury3DShieldIcon size={28} />
            </View>

            <Text style={styles.guestModalTitle}>
              AMC Plan Required
            </Text>
            <Text style={styles.guestModalSub}>
              AMC complaints with ₹0 breakdown labor, free repairs, and priority technician visits are exclusive to active AMC plan members. Protect your home appliances today!
            </Text>

            <TouchableOpacity
              style={styles.guestPrimaryBtn}
              onPress={() => {
                setShowPlanRequiredModal(false);
                handleNav('/user/plans');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.guestPrimaryBtnText}>
                Explore AMC Plans →
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestOutlineBtn}
              onPress={() => {
                setShowPlanRequiredModal(false);
                handleNav('/user/consultation');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.guestOutlineBtnText}>Book My Mechanic (₹0 Diagnosis)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e4f0ff',
    width: '100%',
    ...(Platform.OS === 'web'
      ? { backgroundImage: 'linear-gradient(180deg, #dcebff 0%, #e8f2ff 50%, #dfeeff 100%)' }
      : {}),
  },
  content: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 110, gap: 16, width: '100%', boxSizing: 'border-box' },

  /* Location & Live Booking Bar */
  locationAndLiveWrap: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  locationBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ffffff',
    gap: 10,
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08), 0 3px 8px rgba(37, 99, 235, 0.08)',
  },
  locationPinBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  locationBarLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.6,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  locationBarAddress: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 1,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  locationChangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },
  locationChangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e40af',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  locationChangeArrow: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
    marginTop: -1,
  },
  liveBookingStripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    gap: 10,
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.1), 0 4px 12px rgba(16, 185, 129, 0.14)',
  },
  livePulseDotWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  livePulseDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  liveStripBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  liveStripStepText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#475569',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  liveStripServiceTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  liveStripTrackBtn: {
    backgroundColor: '#059669',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    flexShrink: 0,
  },
  liveStripTrackText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },

  /* Luxury Frontpage Hero Section */
  luxuryHeroContainer: {
    marginHorizontal: -16,
    position: 'relative',
    marginTop: 0,
    marginBottom: 22,
    zIndex: 100,
  },
  luxuryHeroCard: {
    width: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 218,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 38,
    backgroundColor: '#06112b',
    boxShadow: '0 14px 34px rgba(11, 25, 54, 0.28), 0 4px 12px rgba(37, 99, 235, 0.16)',
  },
  luxuryHeroBgImage: {
    position: 'absolute',
    top: 22,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web'
      ? {
        objectFit: 'cover',
        objectPosition: 'right 8px',
      }
      : {}),
  },
  luxuryHeroGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web'
      ? {
        background: 'linear-gradient(180deg, rgba(6, 17, 43, 0.96) 0%, rgba(6, 17, 43, 0.58) 28%, rgba(6, 17, 43, 0) 52%), linear-gradient(90deg, rgba(6, 17, 43, 0.96) 0%, rgba(6, 17, 43, 0.85) 45%, rgba(6, 17, 43, 0.28) 70%, rgba(6, 17, 43, 0.05) 100%)',
      }
      : { backgroundColor: 'rgba(5, 16, 42, 0.75)' }),
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    zIndex: 10,
    marginBottom: 20,
    gap: 8,
  },
  heroBrandWrap: {
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  heroBrandWordmark: {
    width: 86,
    height: 28,
  },
  heroBrandZevota: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    lineHeight: 22,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  heroBrandCare: {
    fontSize: 7.5,
    fontWeight: '400',
    color: '#ffffff',
    letterSpacing: 1.5,
    alignSelf: 'flex-end',
    marginTop: 1,
    marginRight: 1,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroGreetingBlock: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  heroGreetingSub: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '500',
    lineHeight: 13,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  heroGreetingName: {
    fontSize: 12.5,
    color: '#ffffff',
    fontWeight: '700',
    lineHeight: 15,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  heroAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  heroBellBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor: 'pointer',
  },
  heroBellDot: {
    position: 'absolute',
    top: 4,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
    borderWidth: 1.2,
    borderColor: '#0A192F',
  },
  heroTextContent: {
    width: '58%',
    maxWidth: 230,
    zIndex: 10,
    paddingLeft: 2,
    marginTop: 6,
    marginBottom: 6,
  },
  heroHeadline: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 21,
    letterSpacing: -0.3,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  heroHeadlineGold: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#f6c453',
    fontStyle: 'italic',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  heroSubHeadline: {
    fontSize: 10,
    lineHeight: 14,
    color: '#cbd5e1',
    fontWeight: '400',
    marginTop: 5,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  mobileHeroEyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.45)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    marginBottom: 8,
    zIndex: 10,
  },
  mobileHeroLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  mobileHeroEyebrowText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#93c5fd',
    letterSpacing: 0.7,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  mobileLiveStatusRow: {
    flexDirection: 'column',
    gap: 5,
    marginTop: 6,
    marginBottom: 8,
    zIndex: 10,
  },
  mobileLiveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mobileLiveStatusText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  mobileSpecialistBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  mobileSpecialistBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#a7f3d0',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  mobileHeroCtaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
    marginBottom: 8,
    zIndex: 10,
  },
  mobileCtaPrimaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#60a5fa',
  },
  mobileCtaPrimaryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  mobileCtaSecondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  mobileCtaSecondaryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  mobileCtaTertiaryBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.5)',
  },
  mobileCtaTertiaryText: {
    color: '#ecfdf5',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  mobileBannerArrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -11,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  mobileBannerArrowText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: -1,
  },
  floatingSearchWrapper: {
    position: 'absolute',
    bottom: -22,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  heroFilterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    zIndex: 10,
  },
  floatingSearchBox: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 10,
    height: 46,
    borderWidth: 1,
    borderColor: '#ffffff',
    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(37, 99, 235, 0.14)',
  },
  floatingSearchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13.5,
    color: '#0f172a',
    outlineStyle: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  searchDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 6,
  },
  filterBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  headerLogoBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  headerProfileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#eff6ff',
  },
  headerProfileImg: {
    width: '100%',
    height: '100%',
  },

  servicesHeaderBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2,
    marginTop: 6,
    marginBottom: 4,
    gap: 8,
  },
  servicesHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.35,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  servicesHeaderSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 0,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  allServicesSection: {
    marginTop: 2,
    marginBottom: 4,
    width: '100%',
  },
  servicesScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    gap: 14,
  },
  serviceSlideCardStatic: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 5,
  },
  serviceSquircleStatic: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: '0 8px 18px rgba(15, 23, 42, 0.11), 0 3px 8px rgba(37, 99, 235, 0.1)',
  },
  serviceLabelRowStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  serviceSlideTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 14,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  serviceArrowStatic: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },

  heroCardContainer: {
    position: 'relative',
    width: '100%',
    marginVertical: 4,
  },
  heroCard: {
    width: '100%',
    ...(Platform.OS === 'web' ? { aspectRatio: '1376 / 768' } : { height: 190 }),
    borderRadius: 14,
    overflow: 'hidden',
    alignSelf: 'center',
    position: 'relative',
    backgroundColor: '#03102e',
    boxShadow: '0 14px 30px rgba(15, 23, 42, 0.2), 0 5px 14px rgba(37, 99, 235, 0.14)',
  },
  heroBannerImage: {
    width: '100%',
    ...(Platform.OS === 'web'
      ? { height: '100%', objectFit: 'contain', objectPosition: 'center' }
      : { height: 190 }),
    display: 'block',
  },
  heroDotsContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 20,
  },
  heroDot: {
    height: 6,
    borderRadius: 3,
  },
  heroDotActive: {
    width: 24,
    backgroundColor: '#2563eb',
  },
  heroDotInactive: {
    width: 6,
    backgroundColor: '#cbd5e1',
  },

  amcSection: {
    width: '100%',
    gap: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  amcHeaderBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 2,
  },
  amcHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amcHeaderSparkleIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amcSectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  amcSectionSub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  amcLuxuryCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    position: 'relative',
    cursor: 'pointer',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  amcLuxuryCardFeatured: {
    paddingVertical: 11,
    paddingHorizontal: 13,
    justifyContent: 'center',
  },
  amcLuxuryCardCompact: {
    minHeight: 120,
    height: '100%',
    width: '100%',
    minWidth: 0,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
  },
  amcCompactCardInner: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
  },
  amcPlansBannerContent: {
    flexDirection: 'column',
    width: '100%',
  },
  amcPlansTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 5,
  },
  amcPlansTitleBlock: {
    flexDirection: 'column',
    width: '100%',
  },
  amcPerksStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4.5,
    marginTop: 2,
    marginBottom: 7,
    width: '100%',
  },
  amcPerkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
  },
  amcPerkChipText: {
    color: '#e0f2fe',
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.1,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  amcPlansFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 2,
  },
  amcPlansActionPill: {
    borderRadius: 999,
    height: 29,
    paddingLeft: 11,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.07), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxSizing: 'border-box',
  },
  amcPlansActionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e40af',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
    ...(Platform.OS === 'web' ? { whiteSpace: 'nowrap' } : {}),
  },
  amcPlansActionPillArrow: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  amcCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  amcLuxuryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
  },
  amcBadgePill: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  amcBadgePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  amcCardBody: {
    marginVertical: 10,
    gap: 4,
  },
  amcLuxuryHeading: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
    letterSpacing: -0.2,
  },
  amcLuxurySub: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '500',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  amcCardActionPill: {
    borderRadius: 999,
    height: 34,
    paddingLeft: 12,
    paddingRight: 5,
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    marginTop: 'auto',
  },
  amcCardActionPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
    flex: 1,
    minWidth: 0,
    ...(Platform.OS === 'web' ? { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' } : {}),
  },
  amcCardActionPillArrow: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  trustBanner: {
    width: '100%',
    backgroundColor: '#0b1936',
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.35)',
    boxShadow: '0 16px 36px rgba(11, 25, 54, 0.28), 0 6px 16px rgba(37, 99, 235, 0.16)',
    position: 'relative',
    overflow: 'hidden',
    gap: 18,
  },
  trustBannerBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  trustBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8, 20, 44, 0.52)',
    backgroundImage: 'linear-gradient(180deg, rgba(8, 20, 44, 0.38) 0%, rgba(8, 20, 44, 0.55) 55%, rgba(8, 20, 44, 0.78) 100%)',
    zIndex: 1,
  },
  trustTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.25,
    textAlign: 'center',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    position: 'relative',
    zIndex: 2,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    position: 'relative',
    zIndex: 2,
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
    gap: 9,
    cursor: 'pointer',
  },
  trustIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 31, 61, 0.65)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderWidth: 1.5,
    borderColor: 'rgba(191, 219, 254, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.28)',
  },
  trustLabel: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
    textShadow: '0 1px 4px rgba(0, 0, 0, 0.65)',
  },

  searchWrapper: {
    position: 'relative',
    zIndex: 1000,
    flex: 1,
    minWidth: 0,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgb(208, 209, 210)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    height: 44,
  },
  searchIconSvg: { display: 'flex', alignItems: 'center', marginRight: 8, flexShrink: 0 },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0f172a',
    outlineStyle: 'none',
    fontFamily: 'Inter, sans-serif',
  },

  exploreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 0,
  },
  exploreTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#002574',
    fontFamily: 'Inter, sans-serif',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
    fontFamily: 'Inter, sans-serif',
  },
  gridCardContainer: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
  },
  gridImgWrap: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.07)',
  },
  gridImg: {
    width: '100%',
    height: '100%',
  },
  gridCardTitleUnder: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },

  allServicesSection: {
    marginTop: 10,
    marginBottom: 4,
    gap: 8,
  },
  allServicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allServicesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002574',
    fontFamily: 'Inter, sans-serif',
  },
  servicesScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    gap: 14,
  },
  serviceSlideCardStatic: {
    width: 84,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  serviceIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  serviceSlideTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 14,
    fontFamily: 'Inter, sans-serif',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '90%',
    maxWidth: 320,
    gap: 12,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    boxSizing: 'border-box',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', letterSpacing: -0.5 },
  modalSub: { fontSize: 12.5, color: '#475569', marginTop: -4 },

  locList: { display: 'flex', flexDirection: 'column', gap: 6, marginVertical: 4 },
  locListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    gap: 10,
    cursor: 'pointer',
    position: 'relative',
    boxSizing: 'border-box',
  },
  locListItemActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
    borderWidth: 2,
  },
  pinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCircleActive: {
    backgroundColor: '#bfdbfe',
  },
  pinText: { fontSize: 12 },
  locListText: { fontSize: 13, color: '#334155', fontWeight: '600', fontFamily: 'Inter, sans-serif' },
  locListTextActive: { color: '#1e40af' },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
  },
  checkText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },

  customLocBox: { flexDirection: 'column', gap: 8, marginTop: 4, width: '100%', boxSizing: 'border-box' },
  customLocInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    outlineStyle: 'none',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
  },
  customLocBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
    boxSizing: 'border-box',
  },
  customLocBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '600', fontFamily: 'Inter, sans-serif' },

  closeModalBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    marginTop: 2,
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  closeModalBtnText: { color: '#475569', fontWeight: '600', fontSize: 13, fontFamily: 'Inter, sans-serif' },

  mapBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 8,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
  },
  mapBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
  },

  fullMapModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  fullMapContainer: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  mapModalHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif',
  },
  mapModalCloseBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
  },
  mapModalCloseText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },

  suggestionsContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 6,
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    zIndex: 9999,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  suggestionItemPin: {
    fontSize: 13,
    color: '#94a3b8',
  },
  suggestionItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif',
  },
  suggestionItemCat: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: 'Inter, sans-serif',
    marginTop: 1,
  },
  suggestionItemArrow: {
    fontSize: 16,
    color: '#cbd5e1',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 99999,
  },
  guestModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: 14,
    position: 'relative',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
  },
  guestCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  guestIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  guestModalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter, sans-serif',
  },
  guestPrimaryBtn: {
    backgroundColor: '#0052E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  guestPrimaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13.5,
    fontFamily: 'Inter, sans-serif',
  },
  guestOutlineBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestOutlineBtnText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 13,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },

  /* Shared Section Headers */
  sectionTitleBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 2,
    marginBottom: 12,
  },
  sectionEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  sectionEyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563eb',
  },
  sectionEyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.8,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  sectionMainHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.35,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  sectionViewAllPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.06)',
  },
  sectionViewAllText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563eb',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },

  /* Explore Home Services Grid */
  exploreSectionWrap: {
    width: '100%',
    marginTop: 4,
  },
  exploreCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  exploreCategoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
  },
  exploreCategoryCardHalf: {
    width: '48%',
    flexGrow: 1,
    minWidth: 148,
  },
  exploreCategoryCardFull: {
    width: '100%',
  },
  exploreCardImageWrap: {
    width: '100%',
    height: 102,
    backgroundColor: '#eff6ff',
    position: 'relative',
    overflow: 'hidden',
  },
  exploreCardImage: {
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web' ? { objectFit: 'cover', objectPosition: 'center' } : {}),
  },
  exploreCardTagRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  exploreCardPrimaryTag: {
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backdropFilter: 'blur(6px)',
  },
  exploreCardPrimaryTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  exploreCardAmcTag: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  exploreCardAmcTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#047857',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  exploreCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 11,
    paddingVertical: 10,
    gap: 8,
  },
  exploreCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  exploreCardSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
    marginTop: 2,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  exploreCardArrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  exploreCardArrowText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
  },

  /* Quick Appliance Dispatch Card */
  quickDispatchCardWrap: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
  },
  instantBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  instantBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  instantBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },

  /* Most Booked Popular Services Carousel */
  popularSectionWrap: {
    width: '100%',
    marginTop: 2,
  },
  popularScrollContent: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
    paddingRight: 8,
  },
  popularServiceCard: {
    width: 214,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.05)',
    flexShrink: 0,
  },
  popularCardImgWrap: {
    width: '100%',
    height: 112,
    backgroundColor: '#f8fafc',
    position: 'relative',
    overflow: 'hidden',
  },
  popularCardImg: {
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web' ? { objectFit: 'cover', objectPosition: 'center' } : {}),
  },
  popularRatingPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  popularRatingStar: {
    fontSize: 10,
    color: '#fbbf24',
    fontWeight: '800',
  },
  popularRatingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  popularRatingCount: {
    fontSize: 9,
    fontWeight: '600',
    color: '#cbd5e1',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  popularAmcChip: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  popularAmcChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1d4ed8',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  popularCardBody: {
    padding: 12,
    gap: 4,
  },
  popularCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  popularCardMeta: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  popularCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  popularPriceLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  popularPriceValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  popularBookBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 6.5,
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
  },
  popularBookBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },

  /* Modern 2x2 Trust Section & Social Proof Banner */
  trustSectionContainer: {
    width: '100%',
    marginTop: 4,
    gap: 12,
  },
  trustGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
  },
  trustModernCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: 145,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
    boxShadow: '0 3px 12px rgba(15, 23, 42, 0.04)',
  },
  trustModernIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustModernBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  trustModernBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  trustModernTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  trustModernDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
    lineHeight: 15,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  socialProofFooterBanner: {
    width: '100%',
    backgroundColor: '#0b1936',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#1e3a8a',
    boxShadow: '0 8px 20px rgba(11, 25, 54, 0.18)',
  },
  socialProofMetricCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  socialProofValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fbbf24',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  socialProofLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#e2e8f0',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  socialProofDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },

  /* Sleek Royal Navy 2x2 Promise Card */
  luxuryTrustCard: {
    width: '100%',
    backgroundColor: '#0b1936',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    gap: 14,
    boxShadow: '0 10px 28px rgba(11, 25, 54, 0.22)',
  },
  luxuryTrustHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  luxuryTrustBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 2,
  },
  luxuryTrustBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38bdf8',
  },
  luxuryTrustBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#93c5fd',
    letterSpacing: 0.8,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  luxuryTrustHeading: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.3,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  luxuryTrustSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#cbd5e1',
    textAlign: 'center',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  luxuryTrustGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  luxuryTrustIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 99, 235, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  luxuryTrustItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 15,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  luxuryTrustItemSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#93c5fd',
    marginTop: 1,
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
  },
  luxuryTrustMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
});

const heroBannerWebCss = {
  slidesWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: '1376 / 768',
    borderRadius: '14px',
    overflow: 'hidden',
    backgroundColor: '#03102e',
    cursor: 'default',
    userSelect: 'none',
    touchAction: 'pan-y',
  },
  sliderTrack: {
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    transition: 'transform 500ms cubic-bezier(0.25, 1, 0.5, 1)',
    willChange: 'transform',
    userSelect: 'none',
  },
  slideItem: {
    height: '100%',
    flexShrink: 0,
    borderRadius: '14px',
    overflow: 'hidden',
    userSelect: 'none',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
    display: 'block',
    borderRadius: '14px',
    userSelect: 'none',
    pointerEvents: 'none',
  },
};

const marqueeWebCss = {
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    padding: '10px 0 14px',
    margin: '2px 0 0',
    maskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
    WebkitMaskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
  },
  track: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '10px',
    width: 'max-content',
    animation: 'marqueeScroll 26s linear infinite',
    userSelect: 'none',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '6px',
    width: '72px',
    flexShrink: 0,
    cursor: 'pointer',
  },
  squircle: {
    width: '52px',
    height: '52px',
    borderRadius: '16px',
    background: '#ffffff',
    border: '1.2px solid #ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 18px rgba(15, 23, 42, 0.11), 0 3px 8px rgba(37, 99, 235, 0.1)',
  },
  labelWrap: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontSize: '10.5px',
    fontWeight: 600,
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: '13px',
    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
    whiteSpace: 'nowrap',
  },
};

const exploreGridCss = {
  wrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px 14px',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: 10,
  },
};

function SvgSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SvgFilter() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="9" y1="4" x2="9" y2="20" />
      <line x1="15" y1="4" x2="15" y2="20" />
      <line x1="6" y1="15" x2="12" y2="15" />
      <line x1="12" y1="9" x2="18" y2="9" />
    </svg>
  );
}

function SvgBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

