import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Platform, useWindowDimensions } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/ApiService';
import { AppIcon } from '../../components/AppIcons';
import { getPlanTheme } from '../../config/planTheme';
import ApplianceAddWizard, { buildSavedApplianceRecords } from '../../components/appliances/ApplianceAddWizard';
import AppliancePaymentPromptModal from '../../components/appliances/AppliancePaymentPromptModal';
import LiveSupportOptionCard from '../../components/booking/LiveSupportOptionCard';
import PlanReviewScreen from '../../components/plans/PlanReviewScreen';
import PlanPurchaseSuccess from '../../components/plans/PlanPurchaseSuccess';

/* --- Vector Icons --- */
const IconClock = ({ size = 13, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconCopy = ({ size = 13, color = '#93c5fd' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconCheck = ({ size = 13, color = '#4ade80' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconPlus = ({ size = 15, color = '#ffffff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconScroll = ({ size = 16, color = '#2563eb' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconShieldCheck = ({ size = 20, color = '#d4af37' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconSavings = ({ size = 15, color = '#15803d' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
    <path d="M2 9v1c0 1.1.9 2 2 2h1" />
    <circle cx="16" cy="11" r="1" fill={color} />
  </svg>
);

/* --- Helper Formatters --- */
const formatMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatLakh = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return `₹${+(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${+(v / 100000).toFixed(2)} Lakh`;
  return formatMoney(v);
};

const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const txBelongsToUser = (tx, user) => {
  if (!user || !tx) return false;
  if (user.isGuest || user.id === 0 || user.name === 'Guest User' || !user.phone || user.phone === '+91 00000 00000') {
    return false;
  }
  const uid = user.id != null ? String(user.id) : null;
  const uPhone = normalizePhone(user.phone);
  if (uid && tx.userId != null && String(tx.userId) === uid) return true;
  if (uid && tx.user_id != null && String(tx.user_id) === uid) return true;
  const txHasId = tx.userId != null || tx.user_id != null;
  if (!txHasId && uPhone && tx.user_phone && normalizePhone(tx.user_phone) === uPhone) return true;
  return false;
};

const formatTxDate = (value) => {
  if (!value || value === 'Just now' || value === 'Synced') return value || '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const COMMON_APPLIANCES = [
  '1.5 Ton AC',
  'Refrigerator',
  'Washing Machine',
  'RO Purifier',
  'Smart TV',
  'Microwave',
  'Geyser',
  'Chimney',
  'Ceiling Fan',
  'Air Cooler',
];

/**
 * Returns dynamic styling palette for the active purchased card
 * matching the exact metallic liquid silk color theme of the active plan (Gold, Silver, or Platinum).
 */
const getActiveCardPalette = (name) => {
  const n = String(name || '').toLowerCase();
  if (n.includes('gold')) {
    return {
      isGold: true,
      cardBg: "linear-gradient(135deg, rgba(255, 255, 255, 0.38) 0%, rgba(254, 240, 138, 0.22) 42%, rgba(180, 83, 9, 0.12) 100%), url('/gold_silk_bg.jpg') center / cover no-repeat",
      cardBgSolid: '#d97706',
      borderColor: '#eab308',
      glow: '0 16px 48px rgba(217, 119, 6, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.85)',
      badgeBg: 'rgba(20, 14, 8, 0.72)',
      badgeBorder: 'rgba(250, 204, 21, 0.55)',
      badgeText: '#fde047',
      daysPillBg: '#ffffff',
      daysPillText: '#78350f',
      chipBg: 'rgba(20, 14, 8, 0.62)',
      chipBorder: 'rgba(250, 204, 21, 0.4)',
      chipText: '#ffffff',
      balanceBoxBg: 'rgba(20, 14, 8, 0.62)',
      balanceBoxBorder: 'rgba(250, 204, 21, 0.35)',
      balanceLabel: '#fde047',
      balanceAmount: '#ffffff',
      meterFill: '#facc15',
      meterTrack: 'rgba(0, 0, 0, 0.45)',
      meterLegendText: '#fef08a',
      actionBtnBg: 'rgba(20, 14, 8, 0.62)',
      actionBtnBorder: 'rgba(250, 204, 21, 0.35)',
      actionIconBg: '#facc15',
      actionIconColor: '#451a03',
      actionBtnTitle: '#ffffff',
      actionBtnSub: '#fde047',
      outlineBtnBg: 'rgba(20, 14, 8, 0.62)',
      outlineBtnBorder: 'rgba(250, 204, 21, 0.32)',
      outlineIconBg: 'rgba(250, 204, 21, 0.22)',
      outlineIconColor: '#fde047',
      outlineBtnTitle: '#ffffff',
      outlineBtnSub: '#fde047',
      copyIconColor: '#fde047',
      timelineBg: 'rgba(20, 14, 8, 0.65)',
      timelineBorder: 'rgba(250, 204, 21, 0.3)',
      timelineTrack: 'rgba(255, 255, 255, 0.18)',
      timelineFill: '#facc15',
      timelineHighlight: '#fde047',
      timelineLabel: '#fde047',
      timelineVal: '#ffffff',
      exploreBtnBg: 'rgba(20, 14, 8, 0.72)',
      exploreBtnBorder: 'rgba(250, 204, 21, 0.42)',
      exploreBtnText: '#fde047',
      vignetteBg: 'linear-gradient(180deg, rgba(120, 53, 15, 0.04) 0%, rgba(69, 26, 3, 0.18) 55%, rgba(20, 8, 2, 0.32) 100%)',
    };
  }
  if (n.includes('platinum')) {
    return {
      isPlatinum: true,
      cardBg: "linear-gradient(135deg, rgba(255, 255, 255, 0.32) 0%, rgba(224, 242, 254, 0.16) 45%, rgba(15, 23, 42, 0.28) 100%), url('/platinum_silk_bg.jpg') center / cover no-repeat",
      cardBgSolid: '#334155',
      borderColor: '#94a3b8',
      glow: '0 16px 48px rgba(51, 65, 85, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.85)',
      badgeBg: 'rgba(12, 16, 26, 0.72)',
      badgeBorder: 'rgba(147, 197, 253, 0.55)',
      badgeText: '#93c5fd',
      daysPillBg: '#ffffff',
      daysPillText: '#0f172a',
      chipBg: 'rgba(12, 16, 26, 0.62)',
      chipBorder: 'rgba(147, 197, 253, 0.4)',
      chipText: '#ffffff',
      balanceBoxBg: 'rgba(12, 16, 26, 0.62)',
      balanceBoxBorder: 'rgba(147, 197, 253, 0.35)',
      balanceLabel: '#93c5fd',
      balanceAmount: '#ffffff',
      meterFill: '#60a5fa',
      meterTrack: 'rgba(0, 0, 0, 0.45)',
      meterLegendText: '#e0f2fe',
      actionBtnBg: 'rgba(12, 16, 26, 0.62)',
      actionBtnBorder: 'rgba(147, 197, 253, 0.35)',
      actionIconBg: '#93c5fd',
      actionIconColor: '#0f172a',
      actionBtnTitle: '#ffffff',
      actionBtnSub: '#bfdbfe',
      outlineBtnBg: 'rgba(12, 16, 26, 0.62)',
      outlineBtnBorder: 'rgba(147, 197, 253, 0.32)',
      outlineIconBg: 'rgba(147, 197, 253, 0.22)',
      outlineIconColor: '#bfdbfe',
      outlineBtnTitle: '#ffffff',
      outlineBtnSub: '#bfdbfe',
      copyIconColor: '#bfdbfe',
      timelineBg: 'rgba(12, 16, 26, 0.65)',
      timelineBorder: 'rgba(147, 197, 253, 0.3)',
      timelineTrack: 'rgba(255, 255, 255, 0.18)',
      timelineFill: '#60a5fa',
      timelineHighlight: '#93c5fd',
      timelineLabel: '#93c5fd',
      timelineVal: '#ffffff',
      exploreBtnBg: 'rgba(12, 16, 26, 0.72)',
      exploreBtnBorder: 'rgba(147, 197, 253, 0.42)',
      exploreBtnText: '#93c5fd',
      vignetteBg: 'linear-gradient(180deg, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.2) 55%, rgba(10, 15, 30, 0.35) 100%)',
    };
  }
  // Silver
  return {
    isSilver: true,
    cardBg: "linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(220, 230, 242, 0.08) 45%, rgba(15, 23, 42, 0.25) 100%), url('/silver_silk_bg.jpg') center / cover no-repeat",
    cardBgSolid: '#64748b',
    borderColor: '#94a3b8',
    glow: '0 16px 48px rgba(71, 85, 105, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.85)',
    badgeBg: 'rgba(16, 22, 34, 0.72)',
    badgeBorder: 'rgba(203, 213, 225, 0.55)',
    badgeText: '#e2e8f0',
    daysPillBg: '#ffffff',
    daysPillText: '#0f172a',
    chipBg: 'rgba(16, 22, 34, 0.62)',
    chipBorder: 'rgba(203, 213, 225, 0.4)',
    chipText: '#ffffff',
    balanceBoxBg: 'rgba(16, 22, 34, 0.62)',
    balanceBoxBorder: 'rgba(203, 213, 225, 0.35)',
    balanceLabel: '#cbd5e1',
    balanceAmount: '#ffffff',
    meterFill: '#cbd5e1',
    meterTrack: 'rgba(0, 0, 0, 0.45)',
    meterLegendText: '#e2e8f0',
    actionBtnBg: 'rgba(16, 22, 34, 0.62)',
    actionBtnBorder: 'rgba(203, 213, 225, 0.35)',
    actionIconBg: '#e2e8f0',
    actionIconColor: '#0f172a',
    actionBtnTitle: '#ffffff',
    actionBtnSub: '#e2e8f0',
    outlineBtnBg: 'rgba(16, 22, 34, 0.62)',
    outlineBtnBorder: 'rgba(203, 213, 225, 0.32)',
    outlineIconBg: 'rgba(203, 213, 225, 0.22)',
    outlineIconColor: '#e2e8f0',
    outlineBtnTitle: '#ffffff',
    outlineBtnSub: '#e2e8f0',
    copyIconColor: '#e2e8f0',
    timelineBg: 'rgba(16, 22, 34, 0.65)',
    timelineBorder: 'rgba(203, 213, 225, 0.3)',
    timelineTrack: 'rgba(255, 255, 255, 0.18)',
    timelineFill: '#cbd5e1',
    timelineHighlight: '#f1f5f9',
    timelineLabel: '#cbd5e1',
    timelineVal: '#ffffff',
    exploreBtnBg: 'rgba(16, 22, 34, 0.72)',
    exploreBtnBorder: 'rgba(203, 213, 225, 0.42)',
    exploreBtnText: '#e2e8f0',
    vignetteBg: 'linear-gradient(180deg, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.2) 55%, rgba(10, 15, 30, 0.35) 100%)',
  };
};

const getPlanCtaStyle = (theme) => {
  if (theme?.isPlatinum) {
    return {
      background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
      boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
    };
  }
  if (theme?.isGold) {
    return {
      background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
      boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
    };
  }
  // Silver / default
  return {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)',
  };
};

export default function SubscriptionPlansScreen({ onNavigate }) {
  const {
    subscriptionPlans = [],
    activeUser = {},
    purchaseSubscription,
    activeAmc,
    getAppliancesForUser,
    addUserAppliance,
    wallet = {},
    bookings = [],
    bookingBelongsToUser,
    getUserBookings,
  } = useApp();

  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;

  // Selected appliances map per plan: { [planId]: [ ...appliances ] }
  const [planAppliancesMap, setPlanAppliancesMap] = useState({});

  useEffect(() => {
    setPlanAppliancesMap({});
  }, [activeUser?.id, activeUser?.phone]);

  // View state: 'DASHBOARD' | 'WIZARD'
  const [viewMode, setViewMode] = useState('DASHBOARD');
  const [wizardTargetPlan, setWizardTargetPlan] = useState(null);
  // Plan currently being reviewed before purchase (PLAN_REVIEW view)
  const [reviewPlan, setReviewPlan] = useState(null);
  const [purchaseSuccessInfo, setPurchaseSuccessInfo] = useState(null);

  // Modal states
  const [applianceModalPlan, setApplianceModalPlan] = useState(null); // which plan we are editing appliances for
  const [customApplianceName, setCustomApplianceName] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showActiveAddModal, setShowActiveAddModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentPromptTarget, setPaymentPromptTarget] = useState(null);

  // History sub-filter
  const [historyFilter, setHistoryFilter] = useState('All');

  // Custom Styled Popup Modal state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info'); // 'success' | 'error' | 'info'

  const showAlert = (title, message, type = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

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

  const planName = activeUser?.subscription_plan || 'None';
  const hasActiveAmc = !isGuest && activeUser?.subscription_status === 'ACTIVE' && planName !== 'None' && planName !== 'None / Inactive';
  const planTheme = getPlanTheme(planName);
  const activeCardPalette = getActiveCardPalette(planName);

  // Registered appliances for current user
  const coveredAppliances = useMemo(() => {
    if (isGuest || !getAppliancesForUser) return [];
    return getAppliancesForUser(activeUser) || [];
  }, [getAppliancesForUser, activeUser, isGuest]);

  const coveredCount = coveredAppliances.length;

  // Active Contract details
  const contractDetails = useMemo(() => {
    if (!hasActiveAmc) return null;
    const contractNo =
      activeAmc?.contractNo ||
      activeUser?.amc_contract_number ||
      `AMC-2026-${String(activeUser?.id || 1).padStart(4, '0')}${String(activeUser?.phone || '9999').slice(-4)}`;

    const pName = String(activeAmc?.planName || planName).toLowerCase();
    const defaultPlanVal = pName.includes('platinum')
      ? 1000000
      : pName.includes('gold')
      ? 500000
      : 100000;

    const totalPlanMoney = Number(activeUser?.wallet_original_balance) > 0
      ? Number(activeUser.wallet_original_balance)
      : defaultPlanVal;

    const remainingPlanMoney = activeUser?.wallet_balance != null && Number(activeUser.wallet_balance) > 0
      ? Number(activeUser.wallet_balance)
      : totalPlanMoney;

    const rawExpiry =
      activeAmc?.expiryDate ||
      activeUser?.amc_expiry_date ||
      activeUser?.subscription_expires_at ||
      '2027-10-07T00:00:00.000Z';

    const rawStart =
      activeUser?.amc_start_date ||
      activeUser?.subscription_started_at ||
      activeAmc?.startDate ||
      '2026-10-07T00:00:00.000Z';

    const expiryMs = new Date(rawExpiry).getTime();
    const startMs = new Date(rawStart).getTime();
    const daysRemaining = Number.isNaN(expiryMs)
      ? 0
      : Math.max(0, Math.ceil((expiryMs - Date.now()) / 86400000));
    const totalDays = !Number.isNaN(expiryMs) && !Number.isNaN(startMs) && expiryMs > startMs
      ? Math.ceil((expiryMs - startMs) / 86400000)
      : 365;

    return {
      contractNo,
      planName: activeAmc?.planName || planName,
      tierBadge: planTheme.tierBadge || 'VIP AMC',
      startDate: formatTxDate(rawStart),
      expiryDate: formatTxDate(rawExpiry),
      daysRemaining,
      totalDays,
      totalPlanMoney,
      remainingPlanMoney,
    };
  }, [hasActiveAmc, activeAmc, activeUser, planTheme, planName]);

  // Usage stats for purchased card
  const usage = useMemo(() => {
    const pct = (part, whole) => (whole > 0 ? Math.max(0, Math.min(100, Math.round((part / whole) * 100))) : 0);
    const total = Number(contractDetails?.totalPlanMoney || 500000);
    const remaining = Number(contractDetails?.remainingPlanMoney ?? total);
    const totalDays = Number(contractDetails?.totalDays || 365);
    const daysLeft = Number(contractDetails?.daysRemaining || 0);

    return {
      balance: {
        total,
        remaining,
        used: Math.max(0, total - remaining),
        pctLeft: pct(remaining, total),
      },
      days: {
        left: daysLeft,
        total: totalDays,
        pctLeft: pct(daysLeft, totalDays),
      },
    };
  }, [contractDetails]);

  // History list computation
  const unifiedHistoryList = useMemo(() => {
    if (isGuest || !activeUser) return [];

    const userTransactions = (wallet.transactions || []).filter((tx) => txBelongsToUser(tx, activeUser));

    // Only genuine AMC claims from wallet transactions
    const serviceTxs = (userTransactions || []).filter((tx) => {
      return tx.type === 'AMC_SERVICE_CLAIM' || (tx.category === 'Services' && tx.is_amc);
    });

    const userBookings = getUserBookings
      ? getUserBookings(activeUser)
      : (bookings || []).filter((b) =>
          bookingBelongsToUser
            ? bookingBelongsToUser(b, activeUser)
            : (b.user_id && activeUser?.id && String(b.user_id) === String(activeUser.id)) ||
              (b.user_phone && activeUser?.phone && normalizePhone(b.user_phone) === normalizePhone(activeUser.phone))
        );

    // Only bookings that are actually AMC claims / covered under AMC
    const bookingClaims = (userBookings || [])
      .filter((b) => b && (b.is_covered_by_amc === true || b.is_amc === true || Boolean(b.amc_plan_id)))
      .map((b) => {
        const laborCharge = Number(b.labour_charge || b.laborCharge || 0);
        const isCovered = b.is_covered_by_amc !== false;
        return {
          id: `booking-claim-${b.booking_id || b.id}`,
          type: 'AMC_SERVICE_CLAIM',
          service_name: b.service_name || `${b.sub_category_name || b.category_name || 'Appliance'} Service`,
          date: b.completed_date || b.scheduled_date || b.created_at || new Date().toISOString(),
          refNumber: b.booking_id ? String(b.booking_id).replace(/^BK-2026-/, 'K-').replace(/^BK-/, 'K-') : String(b.id || ''),
          laborCharge,
          benefit: isCovered ? (laborCharge > 0 ? `-₹${laborCharge} (100% Free)` : '₹0 Labor Free') : '₹0',
          totalCustomerPaid: isCovered ? '₹0.00 (Fully Covered)' : `₹${b.total_bill || laborCharge}`,
          category: 'Services',
          createdAt: b.scheduled_date || b.completed_date || b.created_at || new Date().toISOString(),
        };
      });

    // Purely dynamic - never inject hardcoded dummy claims when user has no claims!
    const resolvedServices = [...serviceTxs, ...bookingClaims];

    const contractTxs = (userTransactions || []).filter((tx) => {
      const isTopUpTx =
        tx.type === 'WALLET_CREDIT' ||
        String(tx.transaction_id || '').includes('TOPUP') ||
        String(tx.description || '').toLowerCase().includes('top-up');
      return isTopUpTx || tx.type === 'AMC_PURCHASE' || tx.type === 'PLAN_PURCHASE' || tx.category === 'Plans';
    });

    // Deduplicate: if a real AMC purchase transaction exists, discard duplicate auto-generated TX-SYNC transactions
    const hasRealPurchase = contractTxs.some((tx) => tx.type === 'AMC_PURCHASE' || Boolean(tx.amc_contract_number));
    const dedupedContractTxs = hasRealPurchase
      ? contractTxs.filter((tx) => !String(tx.transaction_id || '').startsWith('TX-SYNC-'))
      : contractTxs;

    const resolvedContracts = dedupedContractTxs.length > 0 ? dedupedContractTxs : (hasActiveAmc && contractDetails?.planName ? [
      {
        id: `initial-contract-${contractDetails.contractNo || activeUser.id || 'amc'}`,
        type: 'AMC_PURCHASE',
        plan_name: `${contractDetails.planName} AMC Contract`,
        amount: Number(contractDetails.price || contractDetails.amount || 0),
        date: contractDetails.startDate || new Date().toISOString(),
        refNumber: contractDetails.contractNo || 'AMC-CONTRACT',
        category: 'Plans',
        createdAt: contractDetails.startDate || new Date().toISOString(),
      },
    ] : []);

    const combined = [...resolvedServices, ...resolvedContracts];
    combined.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date || a.created_at || 0).getTime();
      const dateB = new Date(b.createdAt || b.date || b.created_at || 0).getTime();
      return (Number.isNaN(dateB) ? 0 : dateB) - (Number.isNaN(dateA) ? 0 : dateA);
    });
    return combined;
  }, [isGuest, wallet.transactions, activeUser, getUserBookings, bookings, bookingBelongsToUser, hasActiveAmc, contractDetails]);

  const filteredHistoryTxs = useMemo(() => {
    if (historyFilter === 'All') return unifiedHistoryList;
    if (historyFilter === 'Services') return unifiedHistoryList.filter((i) => i.category === 'Services' || i.type === 'AMC_SERVICE_CLAIM');
    if (historyFilter === 'Contracts') return unifiedHistoryList.filter((i) => i.category === 'Plans' || i.type === 'AMC_PURCHASE' || i.type === 'PLAN_PURCHASE');
    return unifiedHistoryList;
  }, [unifiedHistoryList, historyFilter]);

  const handleCopyContractNo = () => {
    if (contractDetails?.contractNo) {
      try {
        navigator.clipboard.writeText(contractDetails.contractNo);
        setCopiedContract(true);
        setTimeout(() => setCopiedContract(false), 2000);
      } catch (e) {}
    }
  };

  const isCurrentPlan = (plan) => {
    if (!activeUser?.subscription_plan) return false;
    const userPlan = String(activeUser.subscription_plan).toLowerCase();
    const targetPlan = String(plan.name).toLowerCase();
    return userPlan.includes(targetPlan) || targetPlan.includes(userPlan);
  };

  // Helper to get appliances selected for a plan
  const getSelectedAppliancesForPlan = (plan) => {
    if (!plan) return [];
    return planAppliancesMap[plan.id] || [];
  };

  // User can add UNLIMITED appliances to any plan (NO LIMIT)
  const handleAddApplianceToPlan = (plan, appName) => {
    if (!plan || !appName) return;

    const newApp = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: appName,
      displayName: appName,
      brand: 'Standard',
      category: 'Home Appliance',
      isCoveredByAmc: true,
      linkedAtPlanPurchase: true,
    };

    setPlanAppliancesMap((prev) => ({
      ...prev,
      [plan.id]: [...(prev[plan.id] || []), newApp],
    }));
  };

  const handleRemoveApplianceFromPlan = (plan, indexToRemove) => {
    if (!plan) return;
    setPlanAppliancesMap((prev) => ({
      ...prev,
      [plan.id]: (prev[plan.id] || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  // Active Member: adding appliance directly to active contract (Requires ₹500 fee)
  const handleAddActiveAppliance = (appName) => {
    if (!appName || !addUserAppliance) return;
    setPaymentPromptTarget({
      type: 'QUICK_ADD',
      name: appName,
    });
    setShowActiveAddModal(false);
    setShowPaymentModal(true);
  };

  // Trigger purchase flow for a plan
  const handleInitiatePurchase = async (plan) => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }

    if (isCurrentPlan(plan)) {
      showAlert(
        'Active Plan',
        `Your ${plan.name} is currently active under Contract #${contractDetails?.contractNo || 'ACTIVE'}.`,
        'info'
      );
      return;
    }

    const chosenAppliances = getSelectedAppliancesForPlan(plan);
    if (!chosenAppliances || chosenAppliances.length === 0) {
      setApplianceModalPlan(plan);
      showAlert(
        'Add Appliances First',
        `Please add the appliances you wish to cover under ${plan.name} before purchasing.`,
        'info'
      );
      return;
    }

    // Proceed to payment
    let order = null;
    let isMock = false;

    try {
      const response = await api.post('/payments/create-order', {
        amount: plan.price,
      });
      if (response.data && response.data.success) {
        order = response.data.order;
      }
    } catch (orderErr) {
      console.warn('Razorpay order fallback to simulated gateway flow.', orderErr);
      isMock = true;
    }

    if (isMock || !order) {
      showAlert('Processing AMC Activation', 'Securing payment via payment gateway (Test Mode)...', 'info');
      setTimeout(async () => {
        try {
          const verifyRes = await api.post('/payments/verify', {
            razorpay_order_id: `order_mock_${Math.floor(100000 + Math.random() * 900000)}`,
            razorpay_payment_id: `pay_mock_${Math.floor(100000 + Math.random() * 900000)}`,
            razorpay_signature: 'mock_signature',
            userId: activeUser?.id,
            userPhone: activeUser?.phone,
            planName: plan.name,
            creditAmount: plan.wallet_credit,
          });

          if (verifyRes.data.success) {
            purchaseSubscription(plan, verifyRes.data.transaction_id, chosenAppliances);
            setApplianceModalPlan(null);
            setReviewPlan(null);
            setPurchaseSuccessInfo({
              planName: plan.name,
              contractNo: verifyRes.data.amc_contract_number || 'AMC-2026-ACTIVE',
              applianceCount: chosenAppliances.length,
            });
            setViewMode('PURCHASE_SUCCESS');
          } else {
            showAlert('Activation Failed', 'Payment verification failed.', 'error');
          }
        } catch (err) {
          showAlert('Activation Error', `Payment verification error: ${err.message}`, 'error');
        }
      }, 1000);
      return;
    }

    // Live Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      showAlert('Payment Gateway Error', 'Could not load payment checkout script. Please check your connection.', 'error');
      return;
    }

    try {
      const options = {
        key: 'rzp_test_SulCbbU6slizY9',
        amount: order.amount,
        currency: order.currency,
        name: 'Zevota Care',
        description: `Activation of ${plan.name} (365 Days)`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: activeUser?.id,
              userPhone: activeUser?.phone,
              planName: plan.name,
              creditAmount: plan.wallet_credit,
            });

            if (verifyRes.data.success) {
              purchaseSubscription(plan, verifyRes.data.transaction_id, chosenAppliances);
              setApplianceModalPlan(null);
              setReviewPlan(null);
              setPurchaseSuccessInfo({
                planName: plan.name,
                contractNo: verifyRes.data.amc_contract_number || 'AMC-2026-ACTIVE',
                applianceCount: chosenAppliances.length,
              });
              setViewMode('PURCHASE_SUCCESS');
            } else {
              showAlert('Verification Failed', 'Payment verification failed.', 'error');
            }
          } catch (err) {
            showAlert('Verification Error', `Payment verification error: ${err.message}`, 'error');
          }
        },
        prefill: {
          name: activeUser?.name || '',
          email: activeUser?.email || '',
          contact: activeUser?.phone || '',
        },
        theme: {
          color: '#2563eb',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showAlert('Payment Error', `Razorpay Payment Error: ${err.message}`, 'error');
    }
  };

  const handleBack = () => {
    if (window?.history?.state && window.history.state.idx > 0 && navigate) {
      navigate(-1);
    } else if (onNavigate) {
      onNavigate('/user/home');
    } else if (navigate) {
      navigate('/user/home');
    }
  };

  const scrollToExplorePlans = () => {
    const el = document.getElementById('explore-plans-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleWizardComplete = (units, applianceType) => {
    if (!activeUser) return;
    const records = buildSavedApplianceRecords(units, applianceType, activeUser);

    if (wizardTargetPlan) {
      setPlanAppliancesMap((prev) => ({
        ...prev,
        [wizardTargetPlan.id]: [...(prev[wizardTargetPlan.id] || []), ...records],
      }));
      setReviewPlan(wizardTargetPlan);
      setWizardTargetPlan(null);
      setViewMode('PLAN_REVIEW');
      return;
    } else {
      // Adding out-of-plan appliance to active contract requires ₹500 fee
      const first = records[0];
      setPaymentPromptTarget({
        type: 'WIZARD_ADD',
        records,
        name: first?.name || applianceType?.name || 'Appliance',
      });
      setShowPaymentModal(true);
    }
  };

  const handleAppliancePaymentSuccess = (paymentResult) => {
    setShowPaymentModal(false);
    const payId = paymentResult?.paymentId || `pay_${Date.now()}`;
    const nowIso = new Date().toISOString();

    if (paymentPromptTarget?.type === 'QUICK_ADD') {
      const appName = paymentPromptTarget.name;
      const newRecord = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: appName,
        brand: 'Standard',
        location: 'Home',
        category: 'Home Appliance',
        is_covered_by_amc: true,
        fee_paid: 500,
        paymentId: payId,
        paymentDate: nowIso,
        user_id: activeUser?.id,
        user_phone: activeUser?.phone,
      };
      if (addUserAppliance) addUserAppliance(newRecord);
      setActionSuccessMsg(`Added "${appName}" to your active AMC protection!`);
      setTimeout(() => setActionSuccessMsg(''), 4000);
    } else if (paymentPromptTarget?.type === 'WIZARD_ADD') {
      const records = (paymentPromptTarget.records || []).map((rec) => ({
        ...rec,
        is_covered_by_amc: true,
        fee_paid: 500,
        paymentId: payId,
        paymentDate: nowIso,
      }));
      if (addUserAppliance) {
        records.forEach((rec) => addUserAppliance(rec));
      }
      setActionSuccessMsg(`${records.length} appliance(s) registered under your AMC protection!`);
      setViewMode('DASHBOARD');
      setTimeout(() => setActionSuccessMsg(''), 4000);
    }
    setPaymentPromptTarget(null);
  };

  if (viewMode === 'WIZARD') {
    return (
      <View style={styles.wizardContainer}>
        <ApplianceAddWizard
          existingAppliances={
            wizardTargetPlan
              ? (planAppliancesMap[wizardTargetPlan.id] || [])
              : coveredAppliances
          }
          planName={wizardTargetPlan?.name || (planName !== 'None' ? planName : 'AMC')}
          onCancel={() => {
            const target = wizardTargetPlan;
            setWizardTargetPlan(null);
            if (target && (planAppliancesMap[target.id] || []).length > 0) {
              setReviewPlan(target);
              setViewMode('PLAN_REVIEW');
            } else {
              setViewMode('DASHBOARD');
            }
          }}
          onComplete={handleWizardComplete}
        />
        <AppliancePaymentPromptModal
          visible={showPaymentModal}
          applianceName={paymentPromptTarget?.name || 'Appliance'}
          activeUser={activeUser}
          contextLabel="adding appliance to active AMC contract"
          onPaymentSuccess={handleAppliancePaymentSuccess}
          onCancel={() => {
            setShowPaymentModal(false);
            setPaymentPromptTarget(null);
          }}
        />
      </View>
    );
  }

  if (viewMode === 'PLAN_REVIEW' && reviewPlan) {
    return (
      <View style={styles.wizardContainer}>
        <PlanReviewScreen
          plan={reviewPlan}
          appliances={getSelectedAppliancesForPlan(reviewPlan)}
          onAddMore={() => {
            setWizardTargetPlan(reviewPlan);
            setViewMode('WIZARD');
          }}
          onRemove={(idx) => handleRemoveApplianceFromPlan(reviewPlan, idx)}
          onPurchase={() => handleInitiatePurchase(reviewPlan)}
          onBack={() => {
            setReviewPlan(null);
            setViewMode('DASHBOARD');
          }}
        />
      </View>
    );
  }

  if (viewMode === 'PURCHASE_SUCCESS' && purchaseSuccessInfo) {
    return (
      <View style={styles.wizardContainer}>
        <PlanPurchaseSuccess
          planName={purchaseSuccessInfo.planName}
          contractNo={purchaseSuccessInfo.contractNo}
          applianceCount={purchaseSuccessInfo.applianceCount}
          onGoHome={() => {
            if (navigate) navigate('/user/home');
            else if (onNavigate) onNavigate('/user/home');
          }}
          onViewPlan={() => {
            setViewMode('DASHBOARD');
            setPurchaseSuccessInfo(null);
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={[styles.content, isDesktopWeb && styles.contentDesktop]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header */}
      <View style={[styles.topHeader, isDesktopWeb && styles.topHeaderDesktop]}>
        {isDesktopWeb ? (
          <TouchableOpacity style={styles.backPillDesktop} onPress={handleBack} activeOpacity={0.75}>
            <Text style={styles.backPillDesktopText}>←  Back to Home</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.75}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F1F3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, minWidth: 0, marginLeft: isDesktopWeb ? 16 : 12 }}>
          <Text style={[styles.headerTitle, isDesktopWeb && styles.headerTitleDesktop]} numberOfLines={1}>
            {hasActiveAmc ? 'My AMC Membership' : 'Annual Maintenance Contracts (AMC)'}
          </Text>
          <Text style={[styles.headerSubtitle, isDesktopWeb && styles.headerSubtitleDesktop]} numberOfLines={1}>
            {hasActiveAmc
              ? `${contractDetails?.planName} • Active Contract Protection`
              : 'Add appliances & activate ₹0 breakdown labor for your home'}
          </Text>
        </View>
        {hasActiveAmc && (
          <View style={[styles.vipShieldBadge, { borderColor: activeCardPalette.borderColor }]}>
            <IconShieldCheck color={activeCardPalette.borderColor} size={22} />
          </View>
        )}
      </View>

      {/* Success Banner */}
      {!!actionSuccessMsg && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>{actionSuccessMsg}</Text>
        </View>
      )}

      {/* ===================================================================== */}
      {/* CONDITION 1: USER HAS PURCHASED A PLAN (PURCHASED CARD DISPLAY)        */}
      {/* ===================================================================== */}
      {hasActiveAmc && contractDetails && (
        <View style={styles.purchasedCardWrapper}>
          <div
            style={{
              backgroundColor: activeCardPalette.cardBgSolid,
              borderRadius: isDesktopWeb ? '28px' : '22px',
              padding: isDesktopWeb ? '28px 32px' : '20px 18px',
              border: `2px solid ${activeCardPalette.borderColor}`,
              boxShadow: activeCardPalette.glow,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: isDesktopWeb ? '22px' : '16px',
            }}
          >
            {/* Silky Metallic Base Texture Layer (Crisp defined metallic silk texture with minimal 0.8px blur) */}
            <div
              style={{
                position: 'absolute',
                top: -4,
                left: -4,
                right: -4,
                bottom: -4,
                background: activeCardPalette.cardBg,
                backgroundColor: activeCardPalette.cardBgSolid,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'blur(0.8px)',
                WebkitFilter: 'blur(0.8px)',
                transform: 'scale(1.02)',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />

            {/* Metallic Specular Chrome/Gold Sheen (Intense High-Luster Light Sweep) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: activeCardPalette.isGold
                  ? 'linear-gradient(118deg, transparent 10%, rgba(255, 255, 255, 0.14) 28%, rgba(255, 255, 255, 0.58) 46%, rgba(255, 255, 255, 0.95) 51%, rgba(255, 245, 160, 0.5) 56%, transparent 78%)'
                  : 'linear-gradient(118deg, transparent 12%, rgba(255, 255, 255, 0.12) 30%, rgba(255, 255, 255, 0.55) 47%, rgba(255, 255, 255, 0.92) 51%, rgba(255, 255, 255, 0.42) 56%, transparent 80%)',
                mixBlendMode: 'screen',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />

            {/* Specular Radial Light Reflection (Metallic Glint Hotspot) */}
            <div
              style={{
                position: 'absolute',
                top: '-25%',
                left: '10%',
                width: '80%',
                height: '150%',
                background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.16) 38%, transparent 72%)',
                mixBlendMode: 'overlay',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />

            {/* Theme-Aware Vignette / Readability Underlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: activeCardPalette.vignetteBg,
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />

            {/* Content Layer (Pin-Sharp & High Contrast, zIndex: 2) */}
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: isDesktopWeb ? '20px' : '16px' }}>
              {/* Top Row: VIP Status Badge on Left, Days Left on Right */}
              <View style={styles.purchasedTopRow}>
                <View style={[styles.cardTierBadge, { backgroundColor: activeCardPalette.badgeBg, borderColor: activeCardPalette.badgeBorder }]}>
                  <Text style={[styles.cardTierBadgeText, { color: activeCardPalette.badgeText, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }]}>
                    {contractDetails.tierBadge}
                  </Text>
                </View>

                <View style={[styles.daysLeftBadge, { backgroundColor: activeCardPalette.daysPillBg, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }]}>
                  <IconClock size={12} color={activeCardPalette.daysPillText} />
                  <Text style={[styles.daysLeftBadgeText, { color: activeCardPalette.daysPillText }]}>
                    {usage.days.left} days left
                  </Text>
                </View>
              </View>

              {isDesktopWeb ? (
                /* DESKTOP 2-COLUMN LUXURY SUITE */
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'stretch' }}>
                  {/* Left Column: Plan Identity & Available Balance Vault */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between' }}>
                    <View style={styles.purchasedPlanRow}>
                      <Text style={[styles.cardPlanName, styles.cardPlanNameDesktop, { textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)' }]}>
                        {contractDetails.planName}
                      </Text>
                      <View style={[styles.contractNumChip, { backgroundColor: activeCardPalette.chipBg, borderColor: activeCardPalette.chipBorder, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }]}>
                        <Text style={[styles.contractNumText, { color: activeCardPalette.chipText, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                          #{contractDetails.contractNo}
                        </Text>
                        <TouchableOpacity onPress={handleCopyContractNo} style={{ padding: 2 }} activeOpacity={0.7} title="Copy Contract No">
                          {copiedContract ? (
                            <IconCheck size={13} color="#4ade80" />
                          ) : (
                            <IconCopy size={13} color={activeCardPalette.copyIconColor} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Available Balance Card */}
                    <View style={[styles.balanceBox, styles.balanceBoxDesktop, { backgroundColor: activeCardPalette.balanceBoxBg, borderColor: activeCardPalette.balanceBoxBorder, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.balanceLabel, styles.balanceLabelDesktop, { color: activeCardPalette.balanceLabel, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }]}>
                          AVAILABLE AMC BALANCE
                        </Text>
                        <View style={styles.activeProtectionBadge}>
                          <View style={styles.activeProtectionPulse} />
                          <Text style={styles.activeProtectionText}>100% Protected</Text>
                        </View>
                      </View>

                      <Text style={[styles.balanceAmount, styles.balanceAmountDesktop, { textShadow: '0 2px 8px rgba(0,0,0,0.7)' }]}>
                        {formatMoney(usage.balance.remaining)}
                      </Text>

                      <View style={[styles.meterTrack, styles.meterTrackDesktop, { backgroundColor: activeCardPalette.meterTrack }]}>
                        <View style={[styles.meterFill, { width: `${usage.balance.pctLeft}%`, backgroundColor: activeCardPalette.meterFill, boxShadow: '0 0 12px rgba(250, 204, 21, 0.65)' }]} />
                      </View>

                      <View style={styles.meterLegendRow}>
                        <Text style={[styles.meterLegend, styles.meterLegendDesktop, { color: activeCardPalette.meterLegendText, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                          {usage.balance.pctLeft}% left • Used {formatMoney(usage.balance.used)}
                        </Text>
                        <Text style={[styles.meterLegend, styles.meterLegendDesktop, { color: activeCardPalette.meterLegendText, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                          of {formatLakh(usage.balance.total)} Limit
                        </Text>
                      </View>
                    </View>
                  </div>

                  {/* Right Column: Actions, Timeline Milestones & Quick Upgrade */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'space-between' }}>
                    {/* Action Buttons Row */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        className="zc-amc-action-card"
                        style={[styles.cardActionBtn, styles.cardActionBtnDesktop, { background: activeCardPalette.actionBtnBg, borderColor: activeCardPalette.actionBtnBorder, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }]}
                        onPress={() => {
                          if (isGuest) {
                            setShowGuestModal(true);
                            return;
                          }
                          setWizardTargetPlan(null);
                          setViewMode('WIZARD');
                        }}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.cardActionIconCircle, styles.cardActionIconCircleDesktop, { backgroundColor: activeCardPalette.actionIconBg }]}>
                          <IconPlus size={16} color={activeCardPalette.actionIconColor} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.cardActionBtnTitle, styles.cardActionBtnTitleDesktop, { color: activeCardPalette.actionBtnTitle, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }]}>
                            Add Appliance
                          </Text>
                          <Text style={[styles.cardActionBtnSub, styles.cardActionBtnSubDesktop, { color: activeCardPalette.actionBtnSub, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                            Unlimited Coverage
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="zc-amc-action-card"
                        style={[styles.cardActionBtn, styles.cardActionBtnDesktop, { background: activeCardPalette.outlineBtnBg, borderColor: activeCardPalette.outlineBtnBorder, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }]}
                        onPress={() => setShowHistoryModal(true)}
                        activeOpacity={0.85}
                      >
                        <View style={[styles.cardActionIconCircle, styles.cardActionIconCircleDesktop, { backgroundColor: activeCardPalette.outlineIconBg }]}>
                          <IconScroll size={16} color={activeCardPalette.outlineIconColor} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.cardActionBtnTitle, styles.cardActionBtnTitleDesktop, { color: activeCardPalette.outlineBtnTitle, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }]}>
                            AMC History
                          </Text>
                          <Text style={[styles.cardActionBtnSub, styles.cardActionBtnSubDesktop, { color: activeCardPalette.outlineBtnSub, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                            Claims & Ledger →
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Validity Timeline Strip */}
                    <View style={[styles.timelineCardStrip, styles.timelineCardStripDesktop, { backgroundColor: activeCardPalette.timelineBg, borderColor: activeCardPalette.timelineBorder, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }]}>
                      <View style={[styles.timelineMeterTrack, { backgroundColor: activeCardPalette.timelineTrack }]}>
                        <View style={[styles.timelineMeterFill, { width: `${100 - usage.days.pctLeft}%`, backgroundColor: activeCardPalette.timelineFill }]} />
                      </View>
                      <View style={styles.timelineStatsRow}>
                        <View style={styles.timelineStatCol}>
                          <Text style={[styles.timelineStatLabel, styles.timelineStatLabelDesktop, { color: activeCardPalette.timelineLabel, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                            STARTED
                          </Text>
                          <Text style={[styles.timelineStatVal, styles.timelineStatValDesktop, { color: activeCardPalette.timelineVal, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }]}>
                            {contractDetails.startDate}
                          </Text>
                        </View>
                        <View style={[styles.timelineStatCol, { alignItems: 'center', flex: 1.25 }]}>
                          <Text style={[styles.timelineStatLabel, styles.timelineStatLabelDesktop, { color: activeCardPalette.timelineLabel, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                            DAYS REMAINING
                          </Text>
                          <Text style={[styles.timelineStatVal, styles.timelineStatValDesktop, { color: activeCardPalette.timelineHighlight, fontWeight: '800', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }]}>
                            {usage.days.left} Days
                          </Text>
                        </View>
                        <View style={[styles.timelineStatCol, { alignItems: 'flex-end' }]}>
                          <Text style={[styles.timelineStatLabel, styles.timelineStatLabelDesktop, { color: activeCardPalette.timelineLabel, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                            VALID TILL
                          </Text>
                          <Text style={[styles.timelineStatVal, styles.timelineStatValDesktop, { color: activeCardPalette.timelineVal, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }]}>
                            {contractDetails.expiryDate}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Explore All Plans Button */}
                    <TouchableOpacity
                      className="zc-amc-explore-btn"
                      style={[
                        styles.cardExploreLinkBtn,
                        styles.cardExploreLinkBtnDesktop,
                        {
                          backgroundColor: activeCardPalette.exploreBtnBg,
                          borderColor: activeCardPalette.exploreBtnBorder,
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                        },
                      ]}
                      onPress={scrollToExplorePlans}
                      activeOpacity={0.82}
                    >
                      <Text style={[styles.cardExploreLinkText, styles.cardExploreLinkTextDesktop, { color: activeCardPalette.exploreBtnText, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }]}>
                        Explore All Plans & Upgrades ↓
                      </Text>
                    </TouchableOpacity>
                  </div>
                </div>
              ) : (
                /* MOBILE VIEW */
                <>
                  {/* Plan Name & Contract Number Row */}
                  <View style={styles.purchasedPlanRow}>
                    <View style={{ flex: 1, minWidth: 150, paddingRight: 6 }}>
                      <Text style={[styles.cardPlanName, { textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)' }]}>
                        {contractDetails.planName}
                      </Text>
                    </View>
                    <View style={[styles.contractNumChip, { backgroundColor: activeCardPalette.chipBg, borderColor: activeCardPalette.chipBorder, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', flexShrink: 0 }]}>
                      <Text style={[styles.contractNumText, { color: activeCardPalette.chipText, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                        #{contractDetails.contractNo}
                      </Text>
                      <TouchableOpacity onPress={handleCopyContractNo} style={{ padding: 2 }} activeOpacity={0.7} title="Copy Contract No">
                        {copiedContract ? (
                          <IconCheck size={12} color="#4ade80" />
                        ) : (
                          <IconCopy size={12} color={activeCardPalette.copyIconColor} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Available Balance Section */}
                  <View style={[styles.balanceBox, { backgroundColor: activeCardPalette.balanceBoxBg, borderColor: activeCardPalette.balanceBoxBorder, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }]}>
                    <Text style={[styles.balanceLabel, { color: activeCardPalette.balanceLabel, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }]}>
                      AVAILABLE AMC BALANCE
                    </Text>
                    <Text style={[styles.balanceAmount, { textShadow: '0 2px 6px rgba(0,0,0,0.7)' }]}>
                      {formatMoney(usage.balance.remaining)}
                    </Text>
                    <View style={[styles.meterTrack, { backgroundColor: activeCardPalette.meterTrack }]}>
                      <View style={[styles.meterFill, { width: `${usage.balance.pctLeft}%`, backgroundColor: activeCardPalette.meterFill }]} />
                    </View>
                    <View style={styles.meterLegendRow}>
                      <Text style={[styles.meterLegend, { color: activeCardPalette.meterLegendText, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                        {usage.balance.pctLeft}% left • Used {formatMoney(usage.balance.used)}
                      </Text>
                      <Text style={[styles.meterLegend, { color: activeCardPalette.meterLegendText, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                        of {formatLakh(usage.balance.total)}
                      </Text>
                    </View>
                  </View>

                  {/* Card Action Buttons: Add Appliance & My AMC History */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={[styles.cardActionBtn, { background: activeCardPalette.actionBtnBg, borderColor: activeCardPalette.actionBtnBorder, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }]}
                      onPress={() => {
                        if (isGuest) {
                          setShowGuestModal(true);
                          return;
                        }
                        setWizardTargetPlan(null);
                        setViewMode('WIZARD');
                      }}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.cardActionIconCircle, { backgroundColor: activeCardPalette.actionIconBg }]}>
                        <IconPlus size={14} color={activeCardPalette.actionIconColor} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.cardActionBtnTitle, { color: activeCardPalette.actionBtnTitle, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }]}>
                          Add Appliance
                        </Text>
                        <Text style={[styles.cardActionBtnSub, { color: activeCardPalette.actionBtnSub, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                          Unlimited Appliances
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.cardActionBtn, { background: activeCardPalette.outlineBtnBg, borderColor: activeCardPalette.outlineBtnBorder, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }]}
                      onPress={() => setShowHistoryModal(true)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.cardActionIconCircle, { backgroundColor: activeCardPalette.outlineIconBg }]}>
                        <IconScroll size={14} color={activeCardPalette.outlineIconColor} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.cardActionBtnTitle, { color: activeCardPalette.outlineBtnTitle, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }]}>
                          AMC History
                        </Text>
                        <Text style={[styles.cardActionBtnSub, { color: activeCardPalette.outlineBtnSub, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                          Claims & Ledger →
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Validity Timeline */}
                  <View style={[styles.timelineCardStrip, { backgroundColor: activeCardPalette.timelineBg, borderColor: activeCardPalette.timelineBorder, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }]}>
                    <View style={[styles.timelineMeterTrack, { backgroundColor: activeCardPalette.timelineTrack }]}>
                      <View style={[styles.timelineMeterFill, { width: `${100 - usage.days.pctLeft}%`, backgroundColor: activeCardPalette.timelineFill }]} />
                    </View>
                    <View style={styles.timelineStatsRow}>
                      <View style={styles.timelineStatCol}>
                        <Text style={[styles.timelineStatLabel, { color: activeCardPalette.timelineLabel, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                          STARTED
                        </Text>
                        <Text style={[styles.timelineStatVal, { color: activeCardPalette.timelineVal, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }]}>
                          {contractDetails.startDate}
                        </Text>
                      </View>
                      <View style={[styles.timelineStatCol, { alignItems: 'center', flex: 1.25 }]}>
                        <Text style={[styles.timelineStatLabel, { color: activeCardPalette.timelineLabel, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                          DAYS REMAINING
                        </Text>
                        <Text style={[styles.timelineStatVal, { color: activeCardPalette.timelineHighlight, fontWeight: '800', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }]}>
                          {usage.days.left} Days
                        </Text>
                      </View>
                      <View style={[styles.timelineStatCol, { alignItems: 'flex-end' }]}>
                        <Text style={[styles.timelineStatLabel, { color: activeCardPalette.timelineLabel, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }]}>
                          VALID TILL
                        </Text>
                        <Text style={[styles.timelineStatVal, { color: activeCardPalette.timelineVal, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }]}>
                          {contractDetails.expiryDate}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Interactive Jump Link to Explore All Plans */}
                  <TouchableOpacity
                    style={[
                      styles.cardExploreLinkBtn,
                      {
                        backgroundColor: activeCardPalette.exploreBtnBg,
                        borderColor: activeCardPalette.exploreBtnBorder,
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                      },
                    ]}
                    onPress={scrollToExplorePlans}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.cardExploreLinkText, { color: activeCardPalette.exploreBtnText, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }]}>
                      Explore All Plans & Upgrades ↓
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </div>
          </div>
        </View>
      )}

      {/* ===================================================================== */}
      {/* SECTION HEADER: EXPLORE ALL PLANS                                     */}
      {/* ===================================================================== */}
      <div id="explore-plans-section" style={{ width: '100%', marginTop: 8 }}>
        <View style={styles.exploreSectionHeader}>
          <View style={styles.exploreHeaderLeft}>
            <View style={styles.exploreAccentBar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.exploreTitle}>
                {hasActiveAmc ? 'Explore All Plans' : 'Choose Your Protection Plan'}
              </Text>
              <Text style={styles.exploreSub}>
                {hasActiveAmc
                  ? 'Compare tiers or upgrade coverage for your home & appliances'
                  : 'Add appliances to unlock and activate your 365-day AMC contract'}
              </Text>
            </View>
          </View>
          <View style={styles.exploreBadgePill}>
            <Text style={styles.exploreBadgeText}>3 TIERS</Text>
          </View>
        </View>
      </div>

      {/* ===================================================================== */}
      {/* ALL SUBSCRIPTION PLANS LIST                                           */}
      {/* ===================================================================== */}
      <View style={[styles.plansContainer, isDesktopWeb && desktopPlansGridStyle]}>
        {subscriptionPlans.map((plan) => {
          const isCurrent = isCurrentPlan(plan);
          const features = JSON.parse(plan.features_json || '[]');
          const theme = getPlanTheme(plan.name);
          const selectedForThisPlan = getSelectedAppliancesForPlan(plan);
          const hasAddedAppliances = selectedForThisPlan.length > 0;

          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                isDesktopWeb && styles.planCardDesktop,
                {
                  borderColor: theme.borderGold,
                  borderWidth: plan.is_recommended || isCurrent ? 2 : 1.4,
                  boxShadow: theme.cardGlow,
                },
                isCurrent && { backgroundColor: '#fcfcfd' },
              ]}
            >
              {/* Metallic Card Header with Polished Liquid Metallic Chrome Sheen */}
              <div
                style={{
                  backgroundColor: theme.headerBgSolid,
                  borderTopLeftRadius: '18px',
                  borderTopRightRadius: '18px',
                  padding: '18px 18px',
                  margin: '-16px -16px 12px -16px',
                  borderBottom: `1.5px solid ${theme.borderGold}`,
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.85), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.35)',
                }}
              >
                {/* Silky Metallic Base Texture Layer (Crisp defined metallic silk texture with minimal 0.8px blur) */}
                <div
                  style={{
                    position: 'absolute',
                    top: -4,
                    left: -4,
                    right: -4,
                    bottom: -4,
                    background: theme.headerBg,
                    backgroundColor: theme.headerBgSolid,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: 'blur(0.8px)',
                    WebkitFilter: 'blur(0.8px)',
                    transform: 'scale(1.02)',
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}
                />

                {/* Metallic Specular Chrome/Gold Sheen (Intense High-Luster Light Sweep) */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: theme.isGold
                      ? 'linear-gradient(118deg, transparent 20%, rgba(255, 255, 255, 0.1) 36%, rgba(255, 255, 255, 0.45) 54%, rgba(255, 255, 255, 0.8) 58%, rgba(255, 245, 160, 0.4) 64%, transparent 84%)'
                      : 'linear-gradient(118deg, transparent 22%, rgba(255, 255, 255, 0.08) 38%, rgba(255, 255, 255, 0.42) 54%, rgba(255, 255, 255, 0.78) 58%, rgba(255, 255, 255, 0.35) 64%, transparent 86%)',
                    mixBlendMode: 'screen',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                />

                {/* Specular Radial Light Reflection (Positioned right to showcase metallic luster without washing out text) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-30%',
                    right: '-5%',
                    width: '65%',
                    height: '160%',
                    background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.12) 42%, transparent 72%)',
                    mixBlendMode: 'overlay',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                />

                {/* Directional Theme-Aware Dark Scrim Overlay to Anchor Text Contrast */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: theme.isGold
                      ? 'linear-gradient(115deg, rgba(18, 10, 3, 0.65) 0%, rgba(35, 16, 4, 0.45) 52%, rgba(55, 22, 5, 0.15) 100%)'
                      : theme.isPlatinum
                      ? 'linear-gradient(115deg, rgba(8, 14, 26, 0.68) 0%, rgba(15, 23, 42, 0.48) 52%, rgba(15, 23, 42, 0.15) 100%)'
                      : 'linear-gradient(115deg, rgba(10, 15, 26, 0.68) 0%, rgba(15, 23, 42, 0.48) 52%, rgba(15, 23, 42, 0.15) 100%)',
                    zIndex: 1,
                    pointerEvents: 'none',
                  }}
                />

                {/* Content Layer (Pin-Sharp & High Contrast with Frosted Dark-Glass Backdrop Plate) */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    backgroundColor: theme.isGold
                      ? 'rgba(14, 9, 3, 0.65)'
                      : theme.isPlatinum
                      ? 'rgba(8, 14, 26, 0.65)'
                      : 'rgba(10, 16, 26, 0.65)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    border: theme.isGold
                      ? '1.2px solid rgba(250, 204, 21, 0.35)'
                      : theme.isPlatinum
                      ? '1.2px solid rgba(147, 197, 253, 0.35)'
                      : '1.2px solid rgba(255, 255, 255, 0.25)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      {theme.icon}
                      <Text style={[styles.planName, { color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.7)' }]} numberOfLines={1}>
                        {plan.name}
                      </Text>
                    </View>
                    {!plan.is_recommended && (
                      <View style={[styles.tierTagBadge, { backgroundColor: 'rgba(0, 0, 0, 0.7)', borderColor: theme.badgeBorder || 'rgba(255, 255, 255, 0.6)', flexShrink: 0 }]}>
                        <Text style={[styles.tierTagText, { color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }]}>{theme.tierBadge}</Text>
                      </View>
                    )}
                  </View>

                  {/* Price and Duration wrapped cleanly */}
                  <View style={styles.planPriceRow}>
                    <Text style={[styles.planPrice, { color: '#ffffff', textShadow: '0 2px 6px rgba(0,0,0,0.95), 0 4px 12px rgba(0,0,0,0.8)' }]}>
                      ₹{plan.price.toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.planPeriod, { color: theme.isGold ? '#fde047' : '#e2e8f0', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }]}>
                      / {plan.validity_months || 12} Months Contract
                    </Text>
                  </View>

                  <Text style={[styles.planThemeTagline, { color: theme.isGold ? '#fef08a' : '#cbd5e1', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }]}>
                    {theme.tagline || plan.description}
                  </Text>
                </div>
              </div>

              {plan.is_recommended && (
                <View
                  style={[
                    styles.recBadge,
                    {
                      backgroundColor: theme.recBadgeBg || (theme.isGold ? '#b45309' : '#0f172a'),
                      borderColor: '#ffffff',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.22)',
                    },
                  ]}
                >
                  <Text style={[styles.recBadgeText, { color: theme.recBadgeTextColor || '#ffffff' }]}>
                    ★ MOST POPULAR • {theme.tierBadge}
                  </Text>
                </View>
              )}

              {/* Specs Bar: All plans have UNLIMITED appliances */}
              <View style={styles.amcSpecsBox}>
                <View style={styles.amcSpecItem}>
                  <Text style={styles.amcSpecLabel}>ANNUAL COVERAGE</Text>
                  <Text style={[styles.amcSpecVal, { color: '#0f172a' }]}>
                    {theme.coverageLimitText || '₹1 Lakh'}
                  </Text>
                </View>
                <View style={styles.amcSpecDivider} />
                <View style={styles.amcSpecItem}>
                  <Text style={styles.amcSpecLabel}>APPLIANCES</Text>
                  <Text style={[styles.amcSpecVal, { color: '#0284c7' }]}>Unlimited</Text>
                </View>
                <View style={styles.amcSpecDivider} />
                <View style={styles.amcSpecItem}>
                  <Text style={styles.amcSpecLabel}>BREAKDOWN LABOR</Text>
                  <Text style={[styles.amcSpecVal, { color: '#16a34a' }]}>₹0 Free</Text>
                </View>
              </View>

              {/* Scannable Feature List */}
              <View style={styles.featureList}>
                {features.map((feat, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <View style={[styles.checkCircle, { backgroundColor: '#eff6ff', borderColor: '#2563eb' }]}>
                      <AppIcon name="check" size={11} color="#2563eb" strokeWidth={3} />
                    </View>
                    <Text style={styles.featureText}>{feat}</Text>
                  </View>
                ))}
              </View>

              {/* AMC Savings Strip */}
              <View style={styles.savingsCallout}>
                <IconSavings size={15} color="#15803d" />
                <Text style={styles.savingsText}>
                  Est. Annual Savings:{' '}
                  <Text style={{ fontWeight: '700', color: '#15803d' }}>
                    ₹{(plan.price * 0.45).toLocaleString('en-IN')}+
                  </Text>{' '}
                  vs ad-hoc repair bills
                </Text>
              </View>

              {/* ============================================================= */}
              {/* MANDATORY APPLIANCE SELECTION SECTION (UNLIMITED ALLOWANCE)    */}
              {/* ============================================================= */}
              <View style={styles.planApplianceSection}>
                <View style={styles.planApplianceHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                    <AppIcon name="shield" size={14} color="#2563eb" strokeWidth={2.4} />
                    <Text style={styles.planApplianceTitle}>Covered Appliances</Text>
                  </View>
                  <View style={styles.planApplianceAllowancePill}>
                    <Text style={styles.planApplianceAllowancePillText}>
                      {selectedForThisPlan.length > 0
                        ? `${selectedForThisPlan.length} Selected`
                        : 'Unlimited'}
                    </Text>
                  </View>
                </View>

                {hasAddedAppliances ? (
                  <View style={styles.planChipsContainer}>
                    {selectedForThisPlan.map((app, idx) => (
                      <View key={app.id || idx} style={styles.planApplianceChip}>
                        <Text style={styles.planApplianceChipText} numberOfLines={1}>
                          {app.name || app.displayName}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveApplianceFromPlan(plan, idx)}
                          style={styles.planChipRemoveBtn}
                        >
                          <Text style={styles.planChipRemoveText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity
                      style={styles.editAppliancesBtn}
                      onPress={() => {
                        if (isGuest) {
                          setShowGuestModal(true);
                          return;
                        }
                        setWizardTargetPlan(plan);
                        setViewMode('WIZARD');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.editAppliancesBtnText}>+ Add More</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addAppliancesPromptBtn}
                    onPress={() => {
                      if (isGuest) {
                        setShowGuestModal(true);
                        return;
                      }
                      setWizardTargetPlan(plan);
                      setViewMode('WIZARD');
                    }}
                    activeOpacity={0.85}
                  >
                    <IconPlus size={14} color="#2563eb" />
                    <Text style={styles.addAppliancesPromptBtnText}>Add Appliances to Cover</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Action / Purchase Button */}
              {isCurrent ? (
                <View style={styles.currentActiveBtn}>
                  <AppIcon name="check" size={16} color="#047857" strokeWidth={3} />
                  <Text style={styles.currentActiveBtnText}>Current Active AMC Plan</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.purchaseBtn,
                    getPlanCtaStyle(theme),
                  ]}
                  onPress={() => {
                    if (isGuest) {
                      setShowGuestModal(true);
                      return;
                    }
                    if (!hasAddedAppliances) {
                      setWizardTargetPlan(plan);
                      setViewMode('WIZARD');
                    } else {
                      setReviewPlan(plan);
                      setViewMode('PLAN_REVIEW');
                    }
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.purchaseBtnText}>
                    {hasAddedAppliances
                      ? `Review & Activate Plan (${selectedForThisPlan.length} added) →`
                      : hasActiveAmc
                        ? (Number(plan.price || 0) > Number(contractDetails?.price || 0)
                            ? `Upgrade to ${plan.name} →`
                            : `Switch to ${plan.name} →`)
                        : `Choose ${plan.name} →`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Live Support Help Card for AMC Plans */}
      <View style={{ marginHorizontal: 16, marginTop: 14, marginBottom: 20 }}>
        <LiveSupportOptionCard
          onPress={() => {
            if (navigate) navigate('/user/support');
            else if (onNavigate) onNavigate('/user/support');
          }}
          subtitle="Have questions about AMC plan benefits or appliance coverage? Chat with us"
        />
      </View>

      {/* ===================================================================== */}
      {/* MODAL 1: APPLIANCE SELECTION MODAL (UNLIMITED APPLIANCE ALLOWANCE)    */}
      {/* ===================================================================== */}
      <Modal visible={Boolean(applianceModalPlan)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {applianceModalPlan && (() => {
              const curList = getSelectedAppliancesForPlan(applianceModalPlan);

              return (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={styles.modalTitle}>Select Covered Appliances</Text>
                      <Text style={styles.modalSub}>
                        {applianceModalPlan.name} covers unlimited appliances with ₹0 breakdown labor.
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setApplianceModalPlan(null)} style={styles.modalCloseCircle}>
                      <Text style={{ fontSize: 16, color: '#64748b', fontWeight: '700' }}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.allowanceStatusRow}>
                    <Text style={styles.allowanceStatusLabel}>Appliance Allowance:</Text>
                    <View style={styles.allowanceBadge}>
                      <Text style={styles.allowanceBadgeText}>
                        {curList.length > 0
                          ? `${curList.length} Added • Unlimited (No Limit)`
                          : 'Unlimited (No Limit)'}
                      </Text>
                    </View>
                  </View>

                  {/* Selected Appliances Chips Box */}
                  <View style={styles.chipsScrollBox}>
                    {curList.length === 0 ? (
                      <Text style={styles.emptyChipsHint}>
                        No appliances added yet. Tap common appliances below or type custom names to add them.
                      </Text>
                    ) : (
                      curList.map((app, idx) => (
                        <View key={app.id || idx} style={styles.modalSelectedChip}>
                          <Text style={styles.modalSelectedChipText}>{app.name || app.displayName}</Text>
                          <TouchableOpacity
                            onPress={() => handleRemoveApplianceFromPlan(applianceModalPlan, idx)}
                            style={styles.modalChipRemoveBtn}
                          >
                            <Text style={styles.modalChipRemoveText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>

                  {/* Quick Add Suggestions */}
                  <Text style={styles.quickAddHeader}>Quick Add Common Household Appliances:</Text>
                  <View style={styles.quickAddWrap}>
                    {COMMON_APPLIANCES.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={styles.quickAddChipBtn}
                        onPress={() => handleAddApplianceToPlan(applianceModalPlan, item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.quickAddChipBtnText}>+ {item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Custom Appliance Name Input */}
                  <View style={styles.customAddRow}>
                    <TextInput
                      style={styles.customAddInput}
                      placeholder="Or enter custom appliance name..."
                      placeholderTextColor="#94a3b8"
                      value={customApplianceName}
                      onChangeText={setCustomApplianceName}
                    />
                    <TouchableOpacity
                      style={[styles.customAddSubmitBtn, !customApplianceName.trim() && { opacity: 0.5 }]}
                      disabled={!customApplianceName.trim()}
                      onPress={() => {
                        if (!customApplianceName.trim()) return;
                        handleAddApplianceToPlan(applianceModalPlan, customApplianceName.trim());
                        setCustomApplianceName('');
                      }}
                    >
                      <Text style={styles.customAddSubmitBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Done / Continue Button */}
                  <TouchableOpacity
                    style={[
                      styles.modalConfirmBtn,
                      curList.length === 0 && { backgroundColor: '#64748b' },
                    ]}
                    onPress={() => {
                      if (curList.length === 0) {
                        showAlert('Select Appliances', 'Please add at least 1 appliance to be covered.', 'info');
                        return;
                      }
                      setApplianceModalPlan(null);
                    }}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.modalConfirmBtnText}>
                      {curList.length > 0
                        ? `Done (${curList.length} Appliances Added)`
                        : 'Done'}
                    </Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: ADD APPLIANCE FOR ACTIVE MEMBER (UNLIMITED ALLOWANCE)         */}
      {/* ===================================================================== */}
      <Modal visible={showActiveAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={styles.modalTitle}>Add Appliance to AMC</Text>
                <Text style={styles.modalSub}>
                  Register additional appliances under your active {contractDetails?.planName} contract.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowActiveAddModal(false)} style={styles.modalCloseCircle}>
                <Text style={{ fontSize: 16, color: '#64748b', fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.allowanceStatusRow}>
              <Text style={styles.allowanceStatusLabel}>Appliance Allowance:</Text>
              <View style={styles.allowanceBadge}>
                <Text style={styles.allowanceBadgeText}>
                  {coveredCount} Registered • Unlimited (No Limit)
                </Text>
              </View>
            </View>

            <Text style={styles.quickAddHeader}>Quick Add Common Appliances:</Text>
            <View style={styles.quickAddWrap}>
              {COMMON_APPLIANCES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.quickAddChipBtn}
                  onPress={() => handleAddActiveAppliance(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickAddChipBtnText}>+ {item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customAddRow}>
              <TextInput
                style={styles.customAddInput}
                placeholder="Or type custom appliance name..."
                placeholderTextColor="#94a3b8"
                value={customApplianceName}
                onChangeText={setCustomApplianceName}
              />
              <TouchableOpacity
                style={[styles.customAddSubmitBtn, !customApplianceName.trim() && { opacity: 0.5 }]}
                disabled={!customApplianceName.trim()}
                onPress={() => {
                  if (!customApplianceName.trim()) return;
                  handleAddActiveAppliance(customApplianceName.trim());
                  setCustomApplianceName('');
                }}
              >
                <Text style={styles.customAddSubmitBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: AMC HISTORY & CLAIMS LEDGER                                   */}
      {/* ===================================================================== */}
      <Modal visible={showHistoryModal} transparent animationType="slide">
        <View style={styles.historyModalOverlay}>
          <View style={styles.historyModalContent}>
            {/* Modal Header */}
            <View style={styles.historyModalHeader}>
              <View>
                <Text style={styles.modalTitle}>My AMC History</Text>
                <Text style={styles.modalSub}>Service claims, ₹0 labor waivers & contracts</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)} style={styles.modalCloseCircle}>
                <Text style={{ fontSize: 16, color: '#64748b', fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Filter Pills */}
            <View style={styles.historyFilterRow}>
              {['All', 'Services', 'Contracts'].map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.historyFilterPill, historyFilter === f && styles.historyFilterPillActive]}
                  onPress={() => setHistoryFilter(f)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.historyFilterText, historyFilter === f && styles.historyFilterTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Ledger List */}
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {filteredHistoryTxs.length === 0 ? (
                <View style={{ padding: 36, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: '#64748b', fontWeight: '500' }}>
                    No {historyFilter === 'All' ? 'history' : historyFilter.toLowerCase()} records found.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10, paddingVertical: 10 }}>
                  {filteredHistoryTxs.map((tx, idx) => {
                    const isContractPurchase = tx.type === 'AMC_PURCHASE' || tx.type === 'PLAN_PURCHASE';
                    const isTopUp =
                      !isContractPurchase &&
                      (tx.type === 'WALLET_CREDIT' ||
                        tx.type === 'TOPUP' ||
                        String(tx.transaction_id || '').includes('TOPUP'));

                    const cardTitle = isContractPurchase
                      ? (tx.plan_name || 'AMC Contract Activation')
                      : isTopUp
                      ? `Parts Allowance Top-Up (+${formatMoney(tx.amount)})`
                      : (tx.service_name || tx.description || 'AMC Service Claim');

                    const cleanRef = String(
                      tx.refNumber ||
                      tx.amc_contract_number ||
                      tx.transaction_id ||
                      tx.id ||
                      '2026'
                    ).replace(/^#/, '').replace(/^TX-/, 'X-').slice(-10);

                    return (
                      <View key={tx.id || tx.transaction_id || idx} style={styles.claimCard}>
                        <View style={styles.claimHeaderRow}>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.claimTitle} numberOfLines={1}>{cardTitle}</Text>
                            <Text style={styles.claimDate}>
                              {formatTxDate(tx.date || tx.created_at || 'Just now')} • Ref #{cleanRef}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.claimBadge,
                              isContractPurchase
                                ? styles.claimBadgeContract
                                : styles.claimBadgeLabor,
                            ]}
                          >
                            <Text
                              style={[
                                styles.claimBadgeText,
                                isContractPurchase && { color: '#1d4ed8' },
                              ]}
                            >
                              {isContractPurchase ? 'Contract Active' : '₹0 Labor Free'}
                            </Text>
                          </View>
                        </View>

                        {!isContractPurchase && !isTopUp && (
                          <View style={styles.claimCostBox}>
                            <View style={styles.claimCostRow}>
                              <Text style={styles.claimCostLabel}>Breakdown Labor Charge:</Text>
                              <Text style={styles.claimCostStrike}>₹{tx.laborCharge ?? 0}</Text>
                            </View>
                            <View style={styles.claimCostRow}>
                              <Text style={styles.claimCostLabel}>AMC Member Benefit:</Text>
                              <Text style={styles.claimCostBenefit}>{tx.benefit || (tx.laborCharge ? `-₹${tx.laborCharge} (100% Free)` : '₹0 Labor Free')}</Text>
                            </View>
                          </View>
                        )}

                        <View style={styles.claimFooterRow}>
                          <Text style={styles.claimCoveredLabel}>
                            {isContractPurchase ? 'Status:' : 'Customer Paid:'}
                          </Text>
                          <Text style={styles.claimCoveredVal}>
                            {isContractPurchase ? 'Active & Protected' : (tx.totalCustomerPaid || '₹0.00 (Fully Covered)')}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Guest Login Required Modal */}
      <Modal visible={showGuestModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.guestCloseBtn} onPress={() => setShowGuestModal(false)}>
              <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              <View style={styles.guestIconCircle}>
                <AppIcon name="lock" size={26} color="#B45309" strokeWidth={2.2} />
              </View>
              <Text style={[styles.modalTitle, { textAlign: 'center' }]}>
                {isAnonymous ? 'Register First' : 'Complete Your Profile First'}
              </Text>
              <Text style={[styles.modalSub, { textAlign: 'center' }]}>
                {isAnonymous
                  ? 'To issue an Annual Maintenance Contract tied to your property and appliances, please register your account first.'
                  : 'To issue an Annual Maintenance Contract tied to your property and appliances, please complete your profile first.'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalConfirmBtn, { backgroundColor: '#2563eb' }]}
              onPress={() => {
                setShowGuestModal(false);
                navigate('/user/register');
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.modalConfirmBtnText}>
                {isAnonymous ? 'Register First →' : 'Complete Your Profile →'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.guestOutlineBtn} onPress={() => setShowGuestModal(false)}>
              <Text style={styles.guestOutlineBtnText}>Explore Plans First</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Styled Alert Modal */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 6 }}>
              <View
                style={[
                  styles.alertIconCircle,
                  alertType === 'success' ? styles.alertSuccessCircle : alertType === 'error' ? styles.alertErrorCircle : styles.alertInfoCircle,
                ]}
              >
                <Text
                  style={[
                    styles.alertIconText,
                    { color: alertType === 'success' ? '#059669' : alertType === 'error' ? '#DC2626' : '#2563EB' },
                  ]}
                >
                  {alertType === 'success' ? '✓' : alertType === 'error' ? '✕' : 'ℹ'}
                </Text>
              </View>
              <Text style={[styles.modalTitle, { textAlign: 'center' }]}>{alertTitle}</Text>
              <Text style={[styles.modalSub, { textAlign: 'center', lineHeight: 19 }]}>{alertMessage}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.modalConfirmBtn,
                {
                  backgroundColor: alertType === 'success' ? '#059669' : alertType === 'error' ? '#DC2626' : '#2563eb',
                },
              ]}
              onPress={() => setAlertVisible(false)}
            >
              <Text style={styles.modalConfirmBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <AppliancePaymentPromptModal
        visible={showPaymentModal}
        applianceName={paymentPromptTarget?.name || 'Appliance'}
        activeUser={activeUser}
        contextLabel="adding appliance to active AMC contract"
        onPaymentSuccess={handleAppliancePaymentSuccess}
        onCancel={() => {
          setShowPaymentModal(false);
          setPaymentPromptTarget(null);
        }}
      />
    </ScrollView>
  );
}

const desktopPlansGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '24px',
  alignItems: 'stretch',
  width: '100%',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 130, maxWidth: 680, alignSelf: 'center', width: '100%', gap: 16 },
  contentDesktop: {
    maxWidth: 1320,
    paddingHorizontal: 0,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 24,
  },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    width: '100%',
    boxSizing: 'border-box',
  },
  topHeaderDesktop: {
    paddingVertical: 12,
  },
  backPillDesktop: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  },
  backPillDesktopText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  headerTitleDesktop: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  headerSubtitleDesktop: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  planCardDesktop: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a192f',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  vipShieldBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  successBanner: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 10,
    borderRadius: 12,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },

  /* PURCHASED PLAN CARD STYLES */
  purchasedCardWrapper: {
    width: '100%',
  },
  purchasedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  purchasedPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: -4,
    flexWrap: 'wrap',
  },
  cardTierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  cardTierBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  contractNumChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
  },
  contractNumText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  cardPlanName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    letterSpacing: -0.3,
    lineHeight: 25,
  },
  daysLeftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  daysLeftBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  /* Balance Box */
  balanceBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  balanceLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    marginVertical: 4,
  },
  meterTrack: {
    height: 6,
    borderRadius: 99,
    overflow: 'hidden',
    marginVertical: 4,
  },
  meterFill: {
    height: '100%',
    borderRadius: 99,
  },
  meterLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  meterLegend: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },

  /* Card Action Buttons */
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.2,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  cardActionIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardActionBtnTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardActionBtnSub: {
    fontSize: 9.5,
    fontWeight: '500',
  },

  /* Timeline Strip */
  timelineCardStrip: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  timelineMeterTrack: {
    height: 4,
    borderRadius: 99,
    overflow: 'hidden',
  },
  timelineMeterFill: {
    height: '100%',
    borderRadius: 99,
  },
  timelineStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 4,
    gap: 6,
  },
  timelineStatCol: {
    flex: 1,
    minWidth: 0,
  },
  timelineStatLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  timelineStatVal: {
    fontSize: 11,
    color: '#e2e8f0',
    fontWeight: '700',
    marginTop: 3,
    whiteSpace: 'nowrap',
  },

  /* Card Jump Link to Explore Plans */
  cardExploreLinkBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  cardExploreLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  cardPlanNameDesktop: {
    fontSize: 26,
    letterSpacing: -0.4,
  },
  balanceBoxDesktop: {
    padding: 20,
    borderRadius: 18,
    gap: 8,
  },
  balanceLabelDesktop: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  balanceAmountDesktop: {
    fontSize: 36,
    fontWeight: '900',
    marginVertical: 6,
  },
  meterTrackDesktop: {
    height: 8,
    marginVertical: 8,
  },
  meterLegendDesktop: {
    fontSize: 11.5,
  },
  cardActionBtnDesktop: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  cardActionIconCircleDesktop: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  cardActionBtnTitleDesktop: {
    fontSize: 13.5,
  },
  cardActionBtnSubDesktop: {
    fontSize: 10.5,
  },
  timelineCardStripDesktop: {
    padding: 14,
    borderRadius: 14,
    gap: 8,
  },
  timelineStatLabelDesktop: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  timelineStatValDesktop: {
    fontSize: 13,
  },
  cardExploreLinkBtnDesktop: {
    paddingVertical: 12,
    borderRadius: 12,
  },
  cardExploreLinkTextDesktop: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  activeProtectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.38)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 99,
  },
  activeProtectionPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
    boxShadow: '0 0 6px #4ade80',
  },
  activeProtectionText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#86efac',
  },

  /* Explore Section Header */
  exploreSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  exploreHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  exploreAccentBar: {
    width: 4,
    height: 32,
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  exploreTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  exploreSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  exploreBadgePill: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  exploreBadgeText: {
    color: '#2563eb',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  /* PLAN CARDS */
  plansContainer: { gap: 20 },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    gap: 14,
    position: 'relative',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
  },
  recBadge: {
    position: 'absolute',
    top: -12,
    right: 18,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 30,
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
  },
  recBadgeText: { fontWeight: '800', fontSize: 10, letterSpacing: 0.5 },
  planName: { fontSize: 17, fontWeight: '800', fontFamily: "'Outfit', 'Inter', sans-serif" },
  tierTagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  tierTagText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  planPrice: { fontSize: 26, fontWeight: '800', fontFamily: "'Outfit', 'Inter', sans-serif" },
  planPeriod: { fontSize: 12, color: '#475569', fontWeight: '600' },
  planThemeTagline: { fontSize: 11.5, color: '#64748b', marginTop: 4, fontWeight: '500' },

  amcSpecsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amcSpecItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    minWidth: 0,
  },
  amcSpecLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.3,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  amcSpecVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 3,
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  amcSpecDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 2,
    flexShrink: 0,
  },

  featureList: { gap: 8, paddingHorizontal: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: { fontSize: 12, color: '#334155', fontWeight: '500', lineHeight: 16 },

  savingsCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 8,
    borderRadius: 10,
  },
  savingsText: { fontSize: 11.5, color: '#166534', fontWeight: '500' },

  /* Plan Appliance Selection Section */
  planApplianceSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  planApplianceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  planApplianceTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  planApplianceAllowancePill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexShrink: 0,
  },
  planApplianceAllowancePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
  },
  planChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  planApplianceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 99,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  planApplianceChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  planChipRemoveBtn: {
    padding: 2,
  },
  planChipRemoveText: {
    fontSize: 9,
    color: '#ef4444',
    fontWeight: '800',
  },
  editAppliancesBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  editAppliancesBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563eb',
  },
  addAppliancesPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1.2,
    borderColor: '#93c5fd',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 9,
  },
  addAppliancesPromptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },

  purchaseBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    borderWidth: 0,
    cursor: 'pointer',
  },
  purchaseBtnText: {
    fontWeight: '800',
    fontSize: 13.5,
    fontFamily: 'Inter, sans-serif',
    color: '#ffffff',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  purchaseBtnPrompt: {
    backgroundColor: '#ffffff',
    borderColor: '#2563eb',
    borderStyle: 'solid',
  },
  purchaseBtnPromptText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
  },
  currentActiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#10b981',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  currentActiveBtnText: {
    color: '#047857',
    fontWeight: '800',
    fontSize: 13.5,
  },

  /* MODALS */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    width: '95%',
    maxWidth: 480,
    maxHeight: '90vh',
    overflowY: 'auto',
    gap: 12,
    boxShadow: '0 20px 35px rgba(0, 0, 0, 0.25)',
  },
  modalCloseCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0a192f', fontFamily: 'Inter, sans-serif' },
  modalSub: { fontSize: 12, color: '#475569', lineHeight: 17 },

  allowanceStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  allowanceStatusLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  allowanceBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  allowanceBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563eb',
  },

  chipsScrollBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    maxHeight: 110,
    overflowY: 'auto',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 42,
    alignItems: 'center',
  },
  emptyChipsHint: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  modalSelectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 5,
  },
  modalSelectedChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalChipRemoveBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalChipRemoveText: {
    fontSize: 9,
    color: '#ef4444',
    fontWeight: '800',
  },

  quickAddHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
  quickAddWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickAddChipBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  quickAddChipBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
  },

  customAddRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  customAddInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0f172a',
    outlineStyle: 'none',
  },
  customAddSubmitBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAddSubmitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  modalConfirmBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalConfirmBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },

  /* AMC History Modal */
  historyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.65)',
    justifyContent: 'flex-end',
  },
  historyModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: '85vh',
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    gap: 12,
  },
  historyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  historyFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyFilterPillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  historyFilterText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
  },
  historyFilterTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  claimCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    gap: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  claimHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  claimTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  claimDate: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  claimBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  claimBadgeLabor: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  claimBadgeContract: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  claimBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#15803d',
  },
  claimCostBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    gap: 3,
  },
  claimCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  claimCostLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  claimCostStrike: {
    fontSize: 11,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  claimCostBenefit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  claimFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 6,
  },
  claimCoveredLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  claimCoveredVal: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#15803d',
  },

  /* Alert modal */
  alertIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  alertSuccessCircle: { backgroundColor: '#ecfdf5' },
  alertErrorCircle: { backgroundColor: '#fef2f2' },
  alertInfoCircle: { backgroundColor: '#eff6ff' },
  alertIconText: { fontSize: 20, fontWeight: '700' },

  guestCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  guestIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestOutlineBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  guestOutlineBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 12.5 },
  wizardContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
});
