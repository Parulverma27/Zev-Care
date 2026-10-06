import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getPlanTheme, PLAN_THEMES } from '../../config/planTheme';
import { SERVICE_IMAGES } from '../../utils/bundledImages';
import SubscriptionPlansScreen from './SubscriptionPlansScreen';
import ApplianceAddWizard, { buildSavedApplianceRecords } from '../../components/appliances/ApplianceAddWizard';

const flexCenter = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

/* --- Vector Icons --- */
const IconChevronLeft = ({ size = 20, color = '#0F1F3D' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const IconShield = ({ size = 20, color = '#d4af37' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconShieldCheck = ({ size = 22, color = '#d4af37' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconStar = ({ size = 12, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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

const IconClock = ({ size = 13, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconArrowRight = ({ size = 16, color = '#2563eb' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconScroll = ({ size = 32, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconPlus = ({ size = 16, color = '#ffffff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconTrash = ({ size = 15, color = '#ef4444' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconZap = ({ size = 16, color = '#ea580c' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconHome = ({ size = 16, color = '#0284c7' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconCpu = ({ size = 16, color = '#7c3aed' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
);

const IconUserTie = ({ size = 16, color = '#0d9488' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

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

const formatMoney = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/** Compact rupee format: 100000 -> ₹1 Lakh, 40000 -> ₹40,000 */
const formatLakh = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return `₹${+(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${+(v / 100000).toFixed(2)} Lakh`;
  return formatMoney(v);
};

const TIER_KEYS = ['Silver', 'Gold', 'Platinum'];

const TIER_ACCENTS = {
  Silver: { pillBg: '#e2e8f0', pillText: '#334155', ring: '#94a3b8' },
  Gold: { pillBg: '#fef3c7', pillText: '#92400e', ring: '#D3AF37' },
  Platinum: { pillBg: '#ede9fe', pillText: '#6d28d9', ring: '#8b5cf6' },
};

/** What each covered part is used in — shown when a part chip is tapped. */
const PART_DETAILS = {
  Compressor: 'AC & Refrigerator cooling compressor',
  'Fan Motors': 'AC, cooler, chimney & ceiling fan motors',
  'PCB Circuits': 'Control boards of AC, washing machine & microwave',
  Thermostat: 'Temperature sensors in fridge, geyser & oven',
  'Valves & Gas': 'Gas refill & solenoid / inlet valves',
  'Internal Wiring': 'Internal harness & power wiring of appliances',
  'Heating Elements': 'Geyser, iron, oven & dryer heating coils',
  'Burners & Sensors': 'Stove burners, RO & flame sensors',
};

const getTierKey = (name) => {
  const n = String(name || '').toLowerCase();
  if (n.includes('platinum')) return 'Platinum';
  if (n.includes('gold')) return 'Gold';
  return 'Silver';
};

const formatTxDate = (value) => {
  if (!value || value === 'Just now' || value === 'Synced') return value || '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

function getApplianceImg(appliance) {
  if (!appliance) return SERVICE_IMAGES.homeAppliances;
  if (appliance.uploadedMediaUri && !appliance.uploadedMediaUri.includes('127.0.0.1:3000')) {
    return appliance.uploadedMediaUri;
  }
  if (appliance.media?.url && !appliance.media.url.includes('127.0.0.1:3000')) {
    return appliance.media.url;
  }
  if (appliance.img && typeof appliance.img === 'string') {
    return appliance.img;
  }
  const name = (appliance.name || appliance.category || '').toLowerCase();
  if (name.includes('ac') || name.includes('air')) return SERVICE_IMAGES.ac;
  if (name.includes('fridge') || name.includes('refrigerator')) return SERVICE_IMAGES.refrigerator;
  if (name.includes('wash')) return SERVICE_IMAGES.washingMachine;
  if (name.includes('tv')) return SERVICE_IMAGES.tv;
  if (name.includes('micro') || name.includes('oven')) return SERVICE_IMAGES.microwave;
  if (name.includes('water') || name.includes('ro')) return SERVICE_IMAGES.waterPurifier;
  if (name.includes('geyser')) return SERVICE_IMAGES.geyser;
  return SERVICE_IMAGES.homeAppliances;
}

export default function MyAmcScreen({ onNavigate }) {
  const {
    activeUser = {},
    activeAmc,
    getAppliancesForUser,
    addUserAppliance,
    removeUserAppliance,
    wallet = {},
    bookings = [],
    bookingBelongsToUser,
    getUserBookings,
    subscriptionPlans = [],
  } = useApp();
  const navigate = useNavigate();

  // View state: 'DASHBOARD' | 'HISTORY' | 'WIZARD'
  const [viewMode, setViewMode] = useState('DASHBOARD');

  // Top Tabs: 'BALANCE' | 'APPLIANCES' (matches [ Available Balance ] | [ Add Appliance ])
  const [activeTab, setActiveTab] = useState('BALANCE');

  // History sub-filter: 'All' | 'Services' | 'Contracts'
  const [historyFilter, setHistoryFilter] = useState('All');

  const [copiedContract, setCopiedContract] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [deletingApplianceId, setDeletingApplianceId] = useState(null);
  const [showAllPlansModal, setShowAllPlansModal] = useState(false);

  // Interactive card state
  const [previewTier, setPreviewTier] = useState(null); // null => show active tier
  const [benefitTab, setBenefitTab] = useState('LABOR'); // 'LABOR' | 'PARTS' | 'PERKS'
  const [selectedPart, setSelectedPart] = useState(null);

  const go = (path) => {
    if (navigate) navigate(path);
    else if (onNavigate) onNavigate(path);
  };

  const handleGoBack = () => {
    if (window?.history?.state && window.history.state.idx > 0) {
      if (navigate) navigate(-1);
      else if (onNavigate) onNavigate(-1);
    } else {
      go('/user/home');
    }
  };

  const isGuest = Boolean(
    activeUser?.isGuest ||
    activeUser?.id === 0 ||
    activeUser?.name === 'Guest User' ||
    !activeUser?.phone ||
    activeUser?.phone === '+91 00000 00000'
  );

  const planName = activeUser?.subscription_plan || 'None';
  const hasActiveAmc = !isGuest && activeUser?.subscription_status === 'ACTIVE' && planName !== 'None' && planName !== 'None / Inactive';
  const isSilver = String(planName).toLowerCase().includes('silver');
  const planTheme = getPlanTheme(planName);
  const allowanceLimit = planTheme.applianceAllowance || 20;
  const isUnlimitedAllowance = !Number.isFinite(allowanceLimit);

  // User's registered appliances covered under AMC
  const coveredAppliances = useMemo(() => {
    if (isGuest || !getAppliancesForUser) return [];
    return getAppliancesForUser(activeUser) || [];
  }, [getAppliancesForUser, activeUser, isGuest]);

  const coveredCount = coveredAppliances.length;
  const availableSlots = isUnlimitedAllowance ? Infinity : Math.max(0, allowanceLimit - coveredCount);
  const progressPercent = isUnlimitedAllowance ? 100 : Math.min(100, Math.round((coveredCount / allowanceLimit) * 100));

  const contractDetails = useMemo(() => {
    if (!hasActiveAmc) return null;
    const contractNo = activeAmc?.contractNo || activeUser?.amc_contract_number || `AMC-2026-${String(activeUser?.id || 1).padStart(4, '0')}${String(activeUser?.phone || '9999').slice(-4)}`;
    const visitsLeft = activeAmc?.visitsRemaining ?? activeUser?.amc_preventive_remaining ?? planTheme.preventiveVisits;
    const totalVisits = planTheme.preventiveVisits;
    const partsCap = planTheme.partsCap;
    const partsLeft = activeAmc?.partsRemaining ?? activeUser?.amc_parts_remaining ?? planTheme.partsCap;
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
      '2027-09-07T00:00:00.000Z';

    const computeStartFromExpiry = (expStr) => {
      try {
        const d = new Date(expStr);
        if (!Number.isNaN(d.getTime())) {
          const s = new Date(d);
          s.setFullYear(s.getFullYear() - 1);
          return s.toISOString();
        }
      } catch (e) {}
      return '2026-09-07T00:00:00.000Z';
    };

    let rawStart =
      activeUser?.amc_start_date ||
      activeUser?.subscription_started_at ||
      activeAmc?.startDate;

    if (!rawStart || String(rawStart).includes('2026-01-01')) {
      rawStart = computeStartFromExpiry(rawExpiry);
    }

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
      visitsLeft,
      totalVisits,
      partsCap,
      partsLeft,
      totalPlanMoney,
      remainingPlanMoney,
      slaHours: planTheme.slaHours || 2,
      propertyAddress: (activeUser?.saved_addresses || []).find((a) => a.isDefault)?.address ||
        activeUser?.saved_addresses?.[0]?.address ||
        activeUser?.address ||
        activeUser?.property?.address ||
        '56, 2, 4, 45A, Palam Vihar Extension, Gurugram',
    };
  }, [hasActiveAmc, activeAmc, activeUser, planTheme, planName]);

  const userTransactions = useMemo(() => {
    if (isGuest) return [];
    return (wallet.transactions || []).filter((tx) => txBelongsToUser(tx, activeUser));
  }, [wallet.transactions, activeUser, isGuest]);

  const unifiedHistoryList = useMemo(() => {
    if (isGuest) return [];

    // 1. Service transactions from wallet ledger
    const serviceTxs = (userTransactions || []).filter((tx) => {
      const isTopUpTx =
        tx.type === 'WALLET_CREDIT' ||
        String(tx.transaction_id || '').includes('TOPUP') ||
        String(tx.description || '').toLowerCase().includes('top-up');
      return !isTopUpTx && (tx.type === 'SERVICE_PAYMENT' || tx.type === 'AMC_SERVICE_CLAIM' || tx.category === 'Services');
    });

    // 2. Service claims from real bookings
    const userBookings = getUserBookings
      ? getUserBookings(activeUser)
      : (bookings || []).filter((b) =>
          bookingBelongsToUser
            ? bookingBelongsToUser(b, activeUser)
            : b.user_id === activeUser?.id || (b.user_phone && normalizePhone(b.user_phone) === normalizePhone(activeUser?.phone))
        );

    const bookingClaims = (userBookings || [])
      .filter((b) => b.is_covered_by_amc || b.service_name || b.category_name)
      .map((b) => {
        const laborCharge = Number(b.labour_charge || b.laborCharge || 499);
        const isCovered = b.is_covered_by_amc !== false;
        return {
          id: `booking-claim-${b.booking_id || b.id}`,
          type: 'AMC_SERVICE_CLAIM',
          service_name: b.service_name || `${b.sub_category_name || b.category_name || 'Appliance'} Repair`,
          date: b.completed_date || b.scheduled_date || '5 Oct 2026',
          refNumber: b.booking_id ? String(b.booking_id).replace(/^BK-2026-/, 'K-').replace(/^BK-/, 'K-') : 'K-000125',
          laborCharge: laborCharge,
          benefit: isCovered ? `-₹${laborCharge} (100% Free)` : '₹0',
          totalCustomerPaid: isCovered ? '₹0.00 (Fully Covered)' : `₹${b.total_bill || laborCharge}`,
          category: 'Services',
          createdAt: b.scheduled_date || b.completed_date || '2026-10-05T10:00:00.000Z',
        };
      });

    const allServices = [...serviceTxs, ...bookingClaims];
    const resolvedServices = allServices.length > 0 ? allServices : [
      {
        id: 'sample-claim-1',
        type: 'AMC_SERVICE_CLAIM',
        service_name: 'Mixer & Grinder Repair',
        date: '5 Oct 2026',
        refNumber: 'K-000125',
        laborCharge: 499,
        benefit: '-₹499 (100% Free)',
        totalCustomerPaid: '₹0.00 (Fully Covered)',
        category: 'Services',
        createdAt: '2026-10-05T10:00:00.000Z',
      },
    ];

    // 3. Contract transactions from wallet ledger
    const contractTxs = (userTransactions || []).filter((tx) => {
      const isTopUpTx =
        tx.type === 'WALLET_CREDIT' ||
        String(tx.transaction_id || '').includes('TOPUP') ||
        String(tx.description || '').toLowerCase().includes('top-up');
      return isTopUpTx || tx.type === 'AMC_PURCHASE' || tx.type === 'PLAN_PURCHASE' || tx.category === 'Plans';
    });

    const resolvedContracts = contractTxs.length > 0 ? contractTxs : (hasActiveAmc ? [
      {
        id: 'sample-contract-1',
        type: 'AMC_PURCHASE',
        plan_name: contractDetails?.planName || planName || 'Gold',
        date: '7 Sept 2026',
        refNumber: contractDetails?.contractNo ? contractDetails.contractNo.replace('AMC-2026-', 'X-') : 'X-373004',
        amount: planTheme?.cost || 1499,
        badgeText: 'Contract Activated',
        category: 'Contracts',
        createdAt: '2026-09-07T10:00:00.000Z',
      },
    ] : []);

    // Return unified list containing BOTH services and contracts
    return [...resolvedServices, ...resolvedContracts];
  }, [
    isGuest,
    userTransactions,
    getUserBookings,
    activeUser,
    bookings,
    bookingBelongsToUser,
    hasActiveAmc,
    contractDetails,
    planName,
    planTheme,
  ]);

  const filteredTxs = useMemo(() => {
    if (historyFilter === 'Services') {
      return unifiedHistoryList.filter((item) =>
        item.category === 'Services' ||
        item.type === 'AMC_SERVICE_CLAIM' ||
        item.type === 'SERVICE_PAYMENT'
      );
    }
    if (historyFilter === 'Contracts') {
      return unifiedHistoryList.filter((item) =>
        item.category === 'Contracts' ||
        item.type === 'AMC_PURCHASE' ||
        item.type === 'PLAN_PURCHASE' ||
        item.type === 'WALLET_CREDIT' ||
        item.type === 'TOPUP' ||
        item.type === 'ALLOWANCE_TOPUP'
      );
    }
    // 'All' returns all unified history items (both Services and Contracts)!
    return unifiedHistoryList;
  }, [unifiedHistoryList, historyFilter]);

  // ---------------------------------------------------------------------------
  // Dynamic tier specs (admin-managed subscriptionPlans -> fallback PLAN_THEMES)
  // ---------------------------------------------------------------------------
  const tierData = useMemo(() => {
    return TIER_KEYS.map((key, rank) => {
      const theme = PLAN_THEMES[key];
      const plan = (subscriptionPlans || []).find((p) => getTierKey(p?.name) === key && String(p?.name || '').toLowerCase().includes(key.toLowerCase()));
      let features = [];
      try {
        features = plan?.features_json ? JSON.parse(plan.features_json) : [];
      } catch (e) {
        features = [];
      }
      const appliances = theme.applianceAllowance;
      return {
        key,
        rank,
        theme,
        accent: TIER_ACCENTS[key],
        price: Number(plan?.price ?? theme.coverageLimit),
        coverage: Number(plan?.wallet_credit ?? theme.coverageLimit),
        appliances,
        appliancesText: Number.isFinite(appliances) ? String(appliances) : 'Unlimited',
        partsCap: Number(plan?.parts_coverage_cap ?? theme.partsCap),
        visits: Number(plan?.preventive_visits_count ?? theme.preventiveVisits),
        slaHours: Number(plan?.priority_sla_hours ?? theme.slaHours),
        validityMonths: Number(plan?.validity_months ?? 12),
        features: Array.isArray(features) ? features : [],
      };
    });
  }, [subscriptionPlans]);

  const activeTierKey = getTierKey(contractDetails?.planName || planName);
  const activeTier = tierData.find((t) => t.key === activeTierKey) || tierData[0];
  const shownTier = tierData.find((t) => t.key === (previewTier || activeTierKey)) || activeTier;

  const usage = useMemo(() => {
    const pct = (part, whole) => (whole > 0 ? Math.max(0, Math.min(100, Math.round((part / whole) * 100))) : 0);
    const total = Number(contractDetails?.totalPlanMoney || activeTier.coverage || 0);
    const remaining = Number(contractDetails?.remainingPlanMoney ?? total);
    const partsCap = Number(contractDetails?.partsCap || activeTier.partsCap || 0);
    const partsLeft = Number(contractDetails?.partsLeft ?? partsCap);
    const visitsTotal = Number(contractDetails?.totalVisits || activeTier.visits || 0);
    const visitsLeft = Number(contractDetails?.visitsLeft ?? visitsTotal);
    const claims = unifiedHistoryList.filter((i) => i.category === 'Services' || i.type === 'AMC_SERVICE_CLAIM');
    const laborSaved = claims.reduce((sum, c) => sum + Number(c.laborCharge || 499), 0);
    const totalDays = Number(contractDetails?.totalDays || 365);
    const daysLeft = Number(contractDetails?.daysRemaining || 0);
    return {
      balance: { total, remaining, used: Math.max(0, total - remaining), pctLeft: pct(remaining, total) },
      parts: { cap: partsCap, left: partsLeft, pctLeft: pct(partsLeft, partsCap) },
      visits: { total: visitsTotal, left: visitsLeft, pctLeft: pct(visitsLeft, visitsTotal) },
      appliances: {
        used: coveredCount,
        limit: allowanceLimit,
        pctUsed: isUnlimitedAllowance ? 100 : pct(coveredCount, allowanceLimit),
      },
      days: { left: daysLeft, total: totalDays, pctLeft: pct(daysLeft, totalDays) },
      claimsCount: claims.length,
      laborSaved,
    };
  }, [contractDetails, activeTier, unifiedHistoryList, coveredCount, allowanceLimit, isUnlimitedAllowance]);

  const handleCopyContractNo = () => {
    if (contractDetails?.contractNo) {
      try {
        navigator.clipboard.writeText(contractDetails.contractNo);
        setCopiedContract(true);
        setTimeout(() => setCopiedContract(false), 2000);
      } catch (e) {}
    }
  };

  const handleWizardComplete = (units, applianceType) => {
    if (!activeUser || !addUserAppliance) return;
    const records = buildSavedApplianceRecords(units, applianceType, activeUser);
    records.forEach((rec) => addUserAppliance(rec));
    setViewMode('DASHBOARD');
    setActiveTab('APPLIANCES');
    setActionSuccessMsg(`${records.length} appliance(s) registered under your AMC protection!`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  const handleRemoveAppliance = (id) => {
    if (removeUserAppliance) {
      removeUserAppliance(id);
      setDeletingApplianceId(null);
      setActionSuccessMsg('Appliance removed from AMC coverage.');
      setTimeout(() => setActionSuccessMsg(''), 3000);
    }
  };

  // =========================================================================
  // CONDITION 1: User has NOT purchased a plan yet ("Jab tak user ne plan nhi liya ho")
  // Directly renders the Subscription Plans screen (Silver, Gold, Platinum).
  // =========================================================================
  if (!hasActiveAmc) {
    return <SubscriptionPlansScreen onNavigate={onNavigate} />;
  }

  // Wizard mode to add new appliance directly
  if (viewMode === 'WIZARD') {
    return (
      <View style={styles.wizardContainer}>
        <ApplianceAddWizard
          onCancel={() => setViewMode('DASHBOARD')}
          onComplete={handleWizardComplete}
        />
      </View>
    );
  }

  // =========================================================================
  // SCREEN 3: My AMC History View ("History will be opened.")
  // =========================================================================
  if (viewMode === 'HISTORY') {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setViewMode('DASHBOARD')} activeOpacity={0.75}>
            <IconChevronLeft />
          </TouchableOpacity>
          <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>MY AMC HISTORY</Text>
            <Text style={styles.headerSubtitle}>Claims, ₹0 Labor Waivers & Ledger</Text>
          </View>
        </View>

        {/* History Filter Pills */}
        <View style={styles.subFilterRow}>
          {['All', 'Services', 'Contracts'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.subFilterPill, historyFilter === f && styles.subFilterPillActive]}
              onPress={() => setHistoryFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.subFilterText, historyFilter === f && styles.subFilterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ledger List */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          {filteredTxs.length === 0 ? (
            <View style={{ padding: 36, alignItems: 'center' }}>
              <Text style={{ fontSize: 14, color: '#64748b', fontWeight: '500' }}>
                No {historyFilter === 'All' ? 'history' : historyFilter.toLowerCase()} records found.
              </Text>
            </View>
          ) : (
            filteredTxs.map((tx, idx) => {
              const isContractPurchase = tx.type === 'AMC_PURCHASE' || tx.type === 'PLAN_PURCHASE';
              const isTopUp =
                !isContractPurchase &&
                (tx.type === 'WALLET_CREDIT' ||
                  tx.type === 'TOPUP' ||
                  tx.type === 'ALLOWANCE_TOPUP' ||
                  String(tx.transaction_id || '').includes('TOPUP') ||
                  String(tx.description || '').toLowerCase().includes('top-up'));

              const cardTitle = isContractPurchase
                ? (tx.plan_name || 'AMC Contract Activation')
                : isTopUp
                ? `Parts Allowance Top-Up (+${formatMoney(tx.amount)})`
                : (tx.service_name || tx.description || 'AMC Service Claim');

              const badgeStyle = isContractPurchase
                ? styles.claimStatusActive
                : isTopUp
                ? styles.claimStatusTopUp
                : styles.claimStatusCovered;

              const badgeText = isContractPurchase
                ? 'Contract Activated'
                : isTopUp
                ? 'Allowance Added'
                : '₹0 Labor Covered';

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
                    <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                      <Text style={styles.claimTitle} numberOfLines={1}>{cardTitle}</Text>
                      <Text style={styles.claimDate}>
                        {formatTxDate(tx.date || tx.created_at || tx.createdAt || tx.timestamp || 'Just now')} • Ref #{cleanRef}
                      </Text>
                    </View>
                    <View style={[styles.claimBadge, badgeStyle]}>
                      <Text style={[styles.claimBadgeText, isContractPurchase && { color: '#1d4ed8' }]}>{badgeText}</Text>
                    </View>
                  </View>

                  {!isContractPurchase && !isTopUp && (
                    <View style={styles.amcCostBreakdown}>
                      <View style={styles.amcCostRow}>
                        <Text style={styles.amcCostItemLabel}>Breakdown Labor Charge:</Text>
                        <Text style={styles.amcCostItemStrike}>₹{tx.laborCharge || 499}</Text>
                      </View>
                      <View style={styles.amcCostRow}>
                        <Text style={styles.amcCostItemLabel}>AMC Member Benefit:</Text>
                        <Text style={styles.amcCostBenefit}>{tx.benefit || '-₹499 (100% Free)'}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.claimFooterRow}>
                    <Text style={styles.claimCoveredLabel}>
                      {isContractPurchase
                        ? 'Contract Status:'
                        : isTopUp
                        ? 'Amount Added to AMC:'
                        : 'Total Paid by Customer:'}
                    </Text>
                    <Text style={[styles.claimCoveredVal, (isTopUp || !isContractPurchase) && { color: '#15803d' }]}>
                      {isContractPurchase
                        ? 'Active & Protected'
                        : isTopUp
                        ? `+${formatMoney(tx.amount)}`
                        : (tx.totalCustomerPaid || '₹0.00 (Fully Covered)')}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    );
  }

  // =========================================================================
  // CONDITION 2: Active AMC Dashboard ("Plan Purchased ->")
  // Features:
  // - Top Switch Buttons: [ Available Balance ]  [ Add Appliance ]
  // - Card Content: Available Balance OR Add Appliance
  // - Action Button: [ My AMC History ] -> Opens History view
  // =========================================================================
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.75}>
          <IconChevronLeft />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>MY AMC</Text>
          <Text style={styles.headerSubtitle}>{contractDetails?.planName} • Active Contract</Text>
        </View>
        <View style={[styles.vipShieldBadge, isSilver && { borderColor: '#94a3b8', backgroundColor: '#0f172a' }]}>
          <IconShieldCheck color={isSilver ? '#94a3b8' : '#d4af37'} />
        </View>
      </View>

      {/* Success Notification Banner */}
      {!!actionSuccessMsg && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>{actionSuccessMsg}</Text>
        </View>
      )}

      {/* ===================================================================== */}
      {/* THE 2 PRIMARY TOGGLE TABS: [ Available Balance ] [ Covered Appliances ] */}
      {/* ===================================================================== */}
      <View style={styles.primaryTabsContainer}>
        <TouchableOpacity
          style={[styles.primaryTabBtn, activeTab === 'BALANCE' && styles.primaryTabBtnActive]}
          onPress={() => setActiveTab('BALANCE')}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryTabText, activeTab === 'BALANCE' && styles.primaryTabTextActive]}>
            Available Balance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryTabBtn, activeTab === 'APPLIANCES' && styles.primaryTabBtnActive]}
          onPress={() => setActiveTab('APPLIANCES')}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryTabText, activeTab === 'APPLIANCES' && styles.primaryTabTextActive]}>
            Covered Appliances
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===================================================================== */}
      {/* TAB CONTENT 1: AVAILABLE BALANCE MODE                                */}
      {/* ===================================================================== */}
      {/* ===================================================================== */}
      {/* TAB CONTENT 1: AVAILABLE BALANCE MODE (Exact Match to Images 1 & 2)  */}
      {/* ===================================================================== */}
      {/* ===================================================================== */}
      {/* TAB CONTENT 1: AVAILABLE BALANCE MODE (Authentic Metallic Gold)       */}
      {/* ===================================================================== */}
      {activeTab === 'BALANCE' && contractDetails && (
        <View style={{ paddingHorizontal: 16 }}>
          {/* Main Gold Membership Card with Specular Metallic Sheen */}
          <View
            style={[
              styles.goldCard,
              {
                borderColor: activeTier.theme.borderColor,
                backgroundImage: activeTier.theme.headerBg,
                boxShadow: activeTier.theme.cardGlow,
              },
            ]}
          >
            {/* ---------- Header: identity + days left ---------- */}
            <View style={styles.goldTopRow}>
              <View style={styles.cardIdentity}>
                <View style={styles.chipGraphic}>
                  <View style={styles.chipInnerGrid}>
                    <View style={styles.chipCenterPin} />
                  </View>
                </View>
                <View style={{ marginLeft: 10, minWidth: 0, flex: 1 }}>
                  <Text style={[styles.cardTierName, { color: activeTier.theme.headerTextColor }]} numberOfLines={1}>
                    {activeTier.theme.tierBadge}
                  </Text>
                  <Text style={[styles.cardTierSub, { color: activeTier.theme.headerPeriodColor }]} numberOfLines={1}>
                    Valid till {contractDetails.expiryDate}
                  </Text>
                </View>
              </View>
              <View style={styles.daysLeftBadge}>
                <IconClock size={12} color="#0f172a" />
                <Text style={styles.daysLeftBadgeText}>{usage.days.left} days left</Text>
              </View>
            </View>

            {/* ---------- Balance with live usage meter ---------- */}
            <View style={styles.balanceSection}>
              <Text style={[styles.balanceLabel, { color: activeTier.theme.headerPeriodColor }]}>AVAILABLE AMC BALANCE</Text>
              <Text style={[styles.balanceAmount, { color: activeTier.theme.headerTextColor }]}>
                {formatMoney(usage.balance.remaining)}
              </Text>
              <View style={styles.meterTrack}>
                <View style={[styles.meterFill, { width: `${usage.balance.pctLeft}%` }]} />
              </View>
              <View style={styles.meterLegendRow}>
                <Text style={[styles.meterLegend, { color: activeTier.theme.headerPeriodColor }]}>
                  {usage.balance.pctLeft}% left • Used {formatMoney(usage.balance.used)}
                </Text>
                <Text style={[styles.meterLegend, { color: activeTier.theme.headerPeriodColor }]}>
                  of {formatLakh(usage.balance.total)}
                </Text>
              </View>
            </View>

            {/* ---------- 4 quick metric tiles ---------- */}
            <Text style={[styles.sectionKicker, { color: activeTier.theme.headerPeriodColor }]}>YOUR PLAN AT A GLANCE</Text>
            <View style={styles.metricGrid}>
              {[
                {
                  id: 'appliances',
                  icon: <IconHome size={16} color="#0284c7" />,
                  tint: '#e0f2fe',
                  color: '#0284c7',
                  value: isUnlimitedAllowance ? `${coveredCount}` : `${coveredCount}/${allowanceLimit}`,
                  label: 'Appliances covered',
                  hint: isUnlimitedAllowance ? 'Unlimited slots' : `${availableSlots} slots free`,
                  pct: usage.appliances.pctUsed,
                  onPress: () => setActiveTab('APPLIANCES'),
                },
                {
                  id: 'labor',
                  icon: <IconShieldCheck size={16} color="#15803d" />,
                  tint: '#dcfce7',
                  color: '#16a34a',
                  value: '₹0',
                  label: 'Repair labour charge',
                  hint: `Saved ${formatMoney(usage.laborSaved)}`,
                  pct: 100,
                  onPress: () => setBenefitTab('LABOR'),
                },
                {
                  id: 'parts',
                  icon: <IconCpu size={16} color="#b45309" />,
                  tint: '#fef3c7',
                  color: '#d97706',
                  value: formatLakh(usage.parts.left),
                  label: 'Spare parts allowance',
                  hint: `of ${formatMoney(usage.parts.cap)}`,
                  pct: usage.parts.pctLeft,
                  onPress: () => setBenefitTab('PARTS'),
                },
                {
                  id: 'visits',
                  icon: <IconUserTie size={16} color="#7c3aed" />,
                  tint: '#ede9fe',
                  color: '#7c3aed',
                  value: `${usage.visits.left}/${usage.visits.total}`,
                  label: 'Free maintenance visits',
                  hint: 'Book a visit',
                  pct: usage.visits.pctLeft,
                  onPress: () => go('/user/home'),
                },
              ].map((tile) => (
                <TouchableOpacity
                  key={tile.id}
                  nativeID={`amc-metric-${tile.id}`}
                  style={styles.metricTile}
                  onPress={tile.onPress}
                  activeOpacity={0.85}
                >
                  <View style={[styles.metricIconWrap, { backgroundColor: tile.tint }]}>{tile.icon}</View>
                  <Text style={styles.metricValue} numberOfLines={1}>{tile.value}</Text>
                  <Text style={styles.metricLabel} numberOfLines={1}>{tile.label}</Text>
                  <View style={styles.miniTrack}>
                    <View style={[styles.miniFill, { width: `${tile.pct}%`, backgroundColor: tile.color }]} />
                  </View>
                  <Text style={[styles.metricHint, { color: tile.color }]} numberOfLines={1}>{tile.hint} →</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ---------- Interactive tier comparison ---------- */}
            <View style={styles.sectionHeadRow}>
              <Text style={[styles.sectionKicker, { color: activeTier.theme.headerPeriodColor, marginBottom: 0 }]}>
                COMPARE PLANS • TAP ONE
              </Text>
              <TouchableOpacity style={styles.allPlansBtn} onPress={() => setShowAllPlansModal(true)} activeOpacity={0.8}>
                <Text style={styles.allPlansBtnText}>All Plans →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tierGrid}>
              {tierData.map((t) => {
                const isActive = t.key === activeTierKey;
                const isShown = t.key === shownTier.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    nativeID={`amc-tier-${t.key.toLowerCase()}`}
                    style={[
                      styles.tierCard,
                      isShown && { borderColor: t.accent.ring, borderWidth: 2, boxShadow: `0 6px 18px ${t.accent.ring}55` },
                    ]}
                    onPress={() => setPreviewTier(isActive ? null : t.key)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.tierPill, { backgroundColor: t.accent.pillBg }]}>
                      <Text style={[styles.tierPillText, { color: t.accent.pillText }]}>{t.key.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.tierAmount}>{formatLakh(t.coverage)}</Text>
                    <Text style={styles.tierLimitLabel}>Coverage</Text>
                    <Text style={styles.tierPrice}>{t.appliancesText} appliances</Text>
                    {isActive && (
                      <View style={styles.tierActiveIndicator}>
                        <Text style={styles.tierActiveIndicatorText}>✓ Your Plan</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {(() => {
              const isActiveShown = shownTier.key === activeTierKey;
              const isHigher = shownTier.rank > activeTier.rank;
              const rows = [
                { label: 'Coverage amount', value: formatLakh(shownTier.coverage), a: shownTier.coverage, b: activeTier.coverage },
                { label: 'Appliances covered', value: shownTier.appliancesText, a: shownTier.appliances, b: activeTier.appliances },
                { label: 'Spare parts allowance', value: formatMoney(shownTier.partsCap), a: shownTier.partsCap, b: activeTier.partsCap },
                { label: 'Free maintenance visits', value: `${shownTier.visits} / year`, a: shownTier.visits, b: activeTier.visits },
                { label: 'Technician arrives within', value: `${shownTier.slaHours} hr`, a: -shownTier.slaHours, b: -activeTier.slaHours },
                { label: 'Repair labour', value: '₹0 (Free)', a: 0, b: 0 },
                { label: 'Plan price', value: `${formatMoney(shownTier.price)} / ${shownTier.validityMonths} mo`, a: 0, b: 0 },
              ];
              return (
                <View style={[styles.inspectorCard, { borderColor: shownTier.accent.ring }]}>
                  <View style={styles.inspectorHead}>
                    <Text style={styles.inspectorTitle} numberOfLines={1}>{shownTier.theme.name}</Text>
                    <View style={[styles.tierPill, { backgroundColor: shownTier.accent.pillBg, marginBottom: 0 }]}>
                      <Text style={[styles.tierPillText, { color: shownTier.accent.pillText }]}>
                        {isActiveShown ? 'CURRENT' : isHigher ? 'UPGRADE' : 'LOWER'}
                      </Text>
                    </View>
                  </View>
                  {rows.map((row) => {
                    const diff = isActiveShown || row.a === row.b ? 0 : row.a > row.b ? 1 : -1;
                    return (
                      <View key={row.label} style={styles.inspectorRow}>
                        <Text style={styles.inspectorLabel}>{row.label}</Text>
                        <Text
                          style={[
                            styles.inspectorValue,
                            diff === 1 && { color: '#15803d' },
                            diff === -1 && { color: '#b91c1c' },
                          ]}
                        >
                          {diff === 1 ? '▲ ' : diff === -1 ? '▼ ' : ''}{row.value}
                        </Text>
                      </View>
                    );
                  })}
                  {isActiveShown ? (
                    <Text style={styles.inspectorNote}>✓ You are on this plan. Tap another plan above to compare.</Text>
                  ) : isHigher ? (
                    <TouchableOpacity
                      nativeID="amc-upgrade-btn"
                      style={styles.upgradeBtn}
                      onPress={() => setShowAllPlansModal(true)}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.upgradeBtnText}>Upgrade to {shownTier.key} →</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.inspectorNote}>
                      Your {activeTier.key} plan already gives you more than {shownTier.key}.
                    </Text>
                  )}
                </View>
              );
            })()}

            {/* ---------- What's included (interactive tabs) ---------- */}
            <Text style={[styles.sectionKicker, { color: activeTier.theme.headerPeriodColor }]}>WHAT'S INCLUDED</Text>
            <View style={styles.benefitTabs}>
              {[
                { id: 'LABOR', label: 'Free Labour' },
                { id: 'PARTS', label: 'Spare Parts' },
                { id: 'PERKS', label: 'Priority Perks' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  nativeID={`amc-benefit-${tab.id.toLowerCase()}`}
                  style={[styles.benefitTabBtn, benefitTab === tab.id && styles.benefitTabBtnActive]}
                  onPress={() => setBenefitTab(tab.id)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.benefitTabText, benefitTab === tab.id && styles.benefitTabTextActive]}>{tab.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.benefitPanel}>
              {benefitTab === 'LABOR' && (
                <View>
                  <Text style={styles.panelTitle}>You pay ₹0 for repair labour</Text>
                  <Text style={styles.panelSub}>
                    Every breakdown visit is free — no visit fee, no inspection fee and no labour charge on your registered appliances.
                  </Text>
                  <View style={styles.compareStrip}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.compareCaption}>Without plan</Text>
                      <Text style={styles.compareOld}>₹499 / visit</Text>
                    </View>
                    <IconArrowRight size={16} color="#94a3b8" />
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={styles.compareCaption}>With your plan</Text>
                      <Text style={styles.compareNew}>₹0 / visit</Text>
                    </View>
                  </View>
                  <View style={styles.panelStatsRow}>
                    <View style={styles.panelStat}>
                      <Text style={styles.panelStatValue}>{usage.claimsCount}</Text>
                      <Text style={styles.panelStatLabel}>Repairs done</Text>
                    </View>
                    <View style={styles.panelStat}>
                      <Text style={[styles.panelStatValue, { color: '#15803d' }]}>{formatMoney(usage.laborSaved)}</Text>
                      <Text style={styles.panelStatLabel}>Total saved</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.panelLinkBtn} onPress={() => setViewMode('HISTORY')} activeOpacity={0.85}>
                    <Text style={styles.panelLinkText}>View repair history →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {benefitTab === 'PARTS' && (
                <View>
                  <Text style={styles.panelTitle}>Parts up to {formatMoney(usage.parts.cap)} covered</Text>
                  <Text style={styles.panelSub}>
                    When a part needs replacing, its cost comes from this allowance — not your pocket. Genuine OEM parts only.
                  </Text>
                  <View style={styles.meterTrackLight}>
                    <View style={[styles.meterFill, { width: `${usage.parts.pctLeft}%`, backgroundColor: '#d97706' }]} />
                  </View>
                  <View style={styles.meterLegendRow}>
                    <Text style={styles.meterLegendDark}>{formatMoney(usage.parts.left)} left</Text>
                    <Text style={styles.meterLegendDark}>{usage.parts.pctLeft}%</Text>
                  </View>
                  <Text style={styles.chipsHint}>Tap a part to see where it is used</Text>
                  <View style={styles.partsChipsWrap}>
                    {Object.keys(PART_DETAILS).map((item) => {
                      const isSel = selectedPart === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[styles.partChip, isSel && styles.partChipActive]}
                          onPress={() => setSelectedPart(isSel ? null : item)}
                          activeOpacity={0.85}
                        >
                          <IconCheck size={11} color={isSel ? '#ffffff' : '#15803d'} />
                          <Text style={[styles.partChipText, isSel && { color: '#ffffff' }]}>{item}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {!!selectedPart && (
                    <View style={styles.partDetailBox}>
                      <Text style={styles.partDetailTitle}>{selectedPart} • Covered ✓</Text>
                      <Text style={styles.partDetailText}>
                        Used in: {PART_DETAILS[selectedPart]}. Replacement is paid from your remaining {formatMoney(usage.parts.left)}.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {benefitTab === 'PERKS' && (
                <View>
                  <Text style={styles.panelTitle}>Technician at your door within {activeTier.slaHours} hr</Text>
                  <Text style={styles.panelSub}>
                    {activeTier.key} members are dispatched first. Your plan runs for {activeTier.validityMonths} months, till {contractDetails.expiryDate}.
                  </Text>
                  {(activeTier.features.length > 0
                    ? activeTier.features
                    : ['Unlimited breakdown calls', `${activeTier.visits} free maintenance visits / year`, 'Genuine OEM spare parts']
                  ).map((f) => (
                    <View key={f} style={styles.perkRow}>
                      <View style={styles.perkCheck}>
                        <IconCheck size={10} color="#ffffff" />
                      </View>
                      <Text style={styles.perkText}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ---------- Contract strip with validity timeline ---------- */}
            <View style={styles.contractDetailsCard}>
              <View style={styles.contractTopRow}>
                <View style={styles.contractNumWrap}>
                  <IconShieldCheck size={14} color="#b45309" />
                  <Text style={styles.contractNumText} numberOfLines={1}>
                    CONTRACT #{contractDetails.contractNo}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleCopyContractNo} style={styles.contractCopyBtn} activeOpacity={0.8}>
                  {copiedContract ? (
                    <>
                      <IconCheck size={11} color="#16a34a" />
                      <Text style={[styles.contractCopyText, { color: '#16a34a' }]}>Copied</Text>
                    </>
                  ) : (
                    <>
                      <IconCopy size={11} color="#0f172a" />
                      <Text style={styles.contractCopyText}>Copy</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.meterTrackLight}>
                <View style={[styles.meterFill, { width: `${100 - usage.days.pctLeft}%`, backgroundColor: '#2563eb' }]} />
              </View>
              <View style={styles.contractStatsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>STARTED</Text>
                  <Text style={styles.statValue}>{contractDetails.startDate}</Text>
                </View>
                <View style={[styles.statCol, { alignItems: 'center' }]}>
                  <Text style={styles.statLabel}>DAYS LEFT</Text>
                  <Text style={styles.statValue}>{usage.days.left}</Text>
                </View>
                <View style={[styles.statCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.statLabel}>VALID TILL</Text>
                  <Text style={styles.statValue}>{contractDetails.expiryDate}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT 2: COVERED APPLIANCES MODE (Exact Match to Images 3 & 5) */}
      {/* ===================================================================== */}
      {activeTab === 'APPLIANCES' && (
        <View style={{ paddingHorizontal: 16 }}>
          {/* 1. "MY AMC HISTORY" ACTION CARD AT TOP (Image 5) */}
          <TouchableOpacity
            style={styles.historyActionCard}
            onPress={() => setViewMode('HISTORY')}
            activeOpacity={0.85}
          >
            <View style={styles.historyActionLeft}>
              <View style={styles.historyIconWrap}>
                <IconScroll size={22} color="#2563eb" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.historyActionTitle}>My AMC History</Text>
                <Text style={styles.historyActionSub}>
                  Service claims, maintenance visits & balance ledger
                </Text>
              </View>
            </View>
            <View style={styles.historyArrowWrap}>
              <IconArrowRight size={18} color="#2563eb" />
            </View>
          </TouchableOpacity>

          {/* 2. COVERED APPLIANCES SECTION HEADER (Images 3 & 5) */}
          <View style={styles.applianceHeaderRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
              <Text style={styles.applianceSectionTitle}>Covered Appliances</Text>
              <Text style={styles.applianceSectionSub}>
                {isUnlimitedAllowance
                  ? `${coveredCount} appliances registered • Unlimited allowance`
                  : `${coveredCount} of ${allowanceLimit} appliances registered`}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addApplianceBtn}
              onPress={() => setViewMode('WIZARD')}
              activeOpacity={0.88}
            >
              <IconPlus size={13} color="#ffffff" />
              <Text style={styles.addApplianceBtnText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {/* 3. AMC APPLIANCE PLAN ALLOWANCE CARD (Images 3 & 5) */}
          <View style={styles.allowanceCard}>
            <View style={styles.allowanceTopRow}>
              <View style={styles.allowanceLeftGroup}>
                <View style={styles.allowanceShieldWrap}>
                  <IconShield size={20} color="#2563eb" />
                </View>
                <View style={styles.allowanceTitleCol}>
                  <Text style={styles.allowanceTitle}>
                    <Text style={{ whiteSpace: 'nowrap' }}>AMC Appliance</Text>{' '}
                    <Text style={{ whiteSpace: 'nowrap' }}>Plan Allowance</Text>
                  </Text>
                  <Text style={styles.allowanceProtectionTag} numberOfLines={1}>
                    {contractDetails?.planName || 'Gold'} Protection
                  </Text>
                </View>
              </View>
              <View style={styles.allowanceCountBadge}>
                <Text style={styles.allowanceCountText}>
                  {isUnlimitedAllowance ? `${coveredCount} Added • Unlimited` : `${coveredCount} / ${allowanceLimit} Added`}
                </Text>
              </View>
            </View>

            {/* Dynamic Progress Bar */}
            <View style={styles.allowanceProgressTrack}>
              <View
                style={[
                  styles.allowanceProgressFill,
                  {
                    width: `${progressPercent}%`,
                  },
                ]}
              />
            </View>

            {/* Available Slots Callout Banner */}
            <View style={styles.slotsAvailableCallout}>
              <Text style={styles.slotsAvailableTitle}>
                {isUnlimitedAllowance
                  ? 'Unlimited appliance slots available'
                  : `${availableSlots} appliance slot${availableSlots === 1 ? '' : 's'} available`}
              </Text>
              <Text style={styles.slotsAvailableSub}>
                {isUnlimitedAllowance
                  ? `All home appliances are covered with ₹0 breakdown labor under your ${contractDetails?.planName || 'Platinum'} VIP contract.`
                  : `Total tier capacity is ${allowanceLimit} appliances (${coveredCount} added). Registered appliances receive 100% free breakdown labor.`}
              </Text>
            </View>

            {/* Mandatory Rule Callout Banner */}
            <View style={styles.amcRuleNoticeCard}>
              <Text style={styles.amcRuleNoticeText}>
                <Text style={{ fontWeight: '800' }}>⚠️ Mandatory AMC Rule: </Text>
                Appliances covered under AMC must be registered during plan purchase. Any appliance serviced outside this allowance will incur ₹500 per booking.
              </Text>
            </View>
          </View>

          {/* 4. REGISTERED APPLIANCES LIST */}
          {coveredAppliances.length === 0 ? (
            <View style={{ gap: 10, marginTop: 14 }}>
              {[
                { name: '1.5 Ton Split AC', brand: 'Daikin', location: 'Master Bedroom', category: 'Air Conditioner' },
                { name: 'Double Door Refrigerator', brand: 'Samsung', location: 'Kitchen', category: 'Refrigerator' },
                { name: 'Front Load Washing Machine', brand: 'LG', location: 'Utility Area', category: 'Washing Machine' },
                { name: 'RO Water Purifier', brand: 'Kent', location: 'Kitchen', category: 'Water Purifier' },
                { name: 'Convection Microwave', brand: 'IFB', location: 'Kitchen', category: 'Microwave' },
                { name: '55" 4K Smart TV', brand: 'Sony', location: 'Living Room', category: 'Television' },
              ].map((appliance, idx) => {
                const imgUri = getApplianceImg(appliance);
                return (
                  <View key={idx} style={styles.applianceCard}>
                    <Image
                      source={typeof imgUri === 'string' ? { uri: imgUri } : imgUri}
                      style={styles.applianceThumb}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.applianceName} numberOfLines={1}>
                          {appliance.name}
                        </Text>
                        <View style={styles.applianceCoveredBadge}>
                          <IconCheck size={11} color="#16a34a" />
                          <Text style={styles.applianceCoveredBadgeText}>Active</Text>
                        </View>
                      </View>
                      <Text style={styles.applianceMeta} numberOfLines={1}>
                        {appliance.brand} • {appliance.location}
                      </Text>
                      <Text style={[styles.applianceMeta, { color: '#2563eb', fontWeight: '600', marginTop: 2 }]}>
                        Covered under {contractDetails?.planName || 'Gold'} AMC
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ gap: 10, marginTop: 14 }}>
              {coveredAppliances.map((appliance, idx) => {
                const imgUri = getApplianceImg(appliance);
                return (
                  <View key={appliance.id || idx} style={styles.applianceCard}>
                    <Image
                      source={typeof imgUri === 'string' ? { uri: imgUri } : imgUri}
                      style={styles.applianceThumb}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.applianceName} numberOfLines={1}>
                          {appliance.name || appliance.category || 'Home Appliance'}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setDeletingApplianceId(appliance.id)}
                          style={{ padding: 4 }}
                          activeOpacity={0.7}
                        >
                          <IconTrash size={14} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.applianceMeta} numberOfLines={1}>
                        {appliance.brand ? `${appliance.brand} • ` : ''}
                        {appliance.location || 'Home'}
                        {appliance.capacity ? ` • ${appliance.capacity}` : ''}
                      </Text>
                      {appliance.isCoveredByAmc !== false ? (
                        <View style={styles.applianceCoveredBadge}>
                          <IconCheck size={11} color="#16a34a" />
                          <Text style={styles.applianceCoveredBadgeText}>Covered under {contractDetails?.planName || 'AMC'} • ₹0 Labor</Text>
                        </View>
                      ) : (
                        <View style={[styles.applianceCoveredBadge, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
                          <Text style={[styles.applianceCoveredBadgeText, { color: '#c2410c' }]}>Out-of-Plan (₹500 Fee applies)</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* All Plans Modal */}
      {showAllPlansModal && (
        <Modal visible transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '90%', width: '92%', maxWidth: 440, padding: 18 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={styles.modalTitle}>All AMC Plans</Text>
                <TouchableOpacity onPress={() => setShowAllPlansModal(false)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#64748b' }}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Silver */}
                <View style={[styles.tierCard, { marginBottom: 12, padding: 12, backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1 }]}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a' }}>Silver Plan • ₹799 / yr</Text>
                  <Text style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>₹1 Lakh Coverage Limit • 2 Preventive Visits • ₹10,000 Parts Cap • Priority SLA</Text>
                </View>
                {/* Gold */}
                <View style={[styles.tierCard, { marginBottom: 12, padding: 12, backgroundColor: '#fefce8', borderColor: '#f59e0b', borderWidth: 2 }]}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#92400e' }}>Gold Plan (Active) • ₹1,499 / yr</Text>
                  <Text style={{ fontSize: 12.5, color: '#78350f', marginTop: 4 }}>₹5 Lakh Coverage Limit • 4 Preventive Visits • ₹40,000 Parts Cap • 2-4 Hr SLA</Text>
                </View>
                {/* Platinum */}
                <View style={[styles.tierCard, { marginBottom: 12, padding: 12, backgroundColor: '#faf5ff', borderColor: '#c084fc', borderWidth: 1 }]}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#6b21a8' }}>Platinum Plan • ₹2,499 / yr</Text>
                  <Text style={{ fontSize: 12.5, color: '#6b21a8', marginTop: 4 }}>₹10 Lakh Coverage Limit • 6 Preventive Visits • ₹1,00,000 Parts Cap • 1-2 Hr VIP SLA</Text>
                </View>
              </ScrollView>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#2563eb', marginTop: 14 }]}
                onPress={() => setShowAllPlansModal(false)}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Appliance Delete Confirmation Modal */}
      {deletingApplianceId != null && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Remove Appliance?</Text>
              <Text style={styles.modalSub}>
                Are you sure you want to remove this appliance from your active AMC contract coverage?
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#f1f5f9' }]}
                  onPress={() => setDeletingApplianceId(null)}
                >
                  <Text style={{ color: '#475569', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#ef4444' }]}
                  onPress={() => handleRemoveAppliance(deletingApplianceId)}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '600' }}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    paddingBottom: 90,
  },
  wizardContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    ...flexCenter,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  vipShieldBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
    ...flexCenter,
  },
  successBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  successBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803d',
    textAlign: 'center',
  },

  /* Primary Switch Tabs: [ Available Balance ]  [ Covered Appliances ] */
  primaryTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#eef2f6',
    padding: 5,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  primaryTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  primaryTabBtnActive: {
    backgroundColor: '#2563eb',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
  },
  primaryTabText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  primaryTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  /* ========================================================================= */
  /* AUTHENTIC METALLIC GOLD MEMBERSHIP CARD (FROM PLAN_THEMES.Gold #D3AF37)   */
  /* ========================================================================= */
  goldCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#D3AF37',
    backgroundColor: '#D3AF37',
    backgroundImage: 'linear-gradient(135deg, rgba(255, 253, 240, 0.98) 0%, rgba(245, 228, 155, 0.95) 20%, rgba(211, 175, 55, 0.88) 42%, rgba(255, 255, 255, 0.96) 52%, rgba(230, 198, 88, 0.92) 72%, rgba(211, 175, 55, 0.96) 100%)',
    boxShadow: '0 10px 32px 0 rgba(211, 175, 55, 0.38), inset 0 1px 2px 0 rgba(255, 255, 255, 0.9)',
  },
  goldTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  chipGraphic: {
    width: 38,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#e6c86e',
    backgroundImage: 'linear-gradient(135deg, #fffdf5 0%, #e6c86e 40%, #caa12c 100%)',
    borderWidth: 1.2,
    borderColor: '#b48a1c',
    padding: 3,
    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.9), 0 2px 5px rgba(180, 138, 28, 0.3)',
  },
  chipInnerGrid: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#9e7514',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCenterPin: {
    width: 14,
    height: 8,
    borderWidth: 1,
    borderColor: '#9e7514',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  daysLeftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  daysLeftBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  balanceSection: {
    marginTop: 2,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#713f12',
    letterSpacing: 0.8,
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#451a03',
    letterSpacing: -0.5,
    marginTop: 1,
  },
  cardIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  cardTierName: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  cardTierSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  meterTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 4,
  },
  meterTrackLight: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 4,
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 3,
  },
  meterLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meterLegend: {
    fontSize: 11,
    fontWeight: '700',
  },
  meterLegendDark: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricTile: {
    width: 'calc(50% - 4px)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  miniTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 4,
  },
  miniFill: {
    height: '100%',
    borderRadius: 2,
  },
  metricHint: {
    fontSize: 10,
    fontWeight: '700',
  },
  allPlansBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  allPlansBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
    whiteSpace: 'nowrap',
  },
  tierGrid: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 10,
  },
  tierCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
  },
  tierPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    marginBottom: 3,
  },
  tierPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tierAmount: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'center',
  },
  tierLimitLabel: {
    fontSize: 8.5,
    color: '#64748b',
    marginTop: 1,
    textAlign: 'center',
  },
  tierPrice: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
    textAlign: 'center',
  },
  tierActiveIndicator: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginTop: 3,
  },
  tierActiveIndicatorText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#92400e',
  },
  inspectorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
    marginBottom: 10,
    borderWidth: 1.5,
    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
  },
  inspectorHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  inspectorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  inspectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3.5,
  },
  inspectorLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  inspectorValue: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '700',
  },
  inspectorNote: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    textAlign: 'center',
    fontWeight: '600',
  },
  upgradeBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  upgradeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  benefitTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  benefitTabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  benefitTabBtnActive: {
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  },
  benefitTabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
  },
  benefitTabTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  benefitPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 3,
  },
  panelSub: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
    marginBottom: 10,
  },
  compareStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  compareCaption: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  compareOld: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  compareNew: {
    fontSize: 14,
    fontWeight: '900',
    color: '#15803d',
    marginTop: 2,
  },
  panelStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  panelStat: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  panelStatValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
  },
  panelStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  panelLinkBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  panelLinkText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2563eb',
  },
  chipsHint: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
  },
  partsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  partChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  partChipActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  partChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
  },
  partDetailBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 9,
    marginTop: 4,
  },
  partDetailTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 2,
  },
  partDetailText: {
    fontSize: 11,
    color: '#15803d',
    lineHeight: 15,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
  },
  perkCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  contractDetailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    marginTop: 4,
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(211, 175, 55, 0.2)',
  },
  contractTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  contractNumWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  contractNumText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
    whiteSpace: 'nowrap',
    letterSpacing: -0.2,
  },
  contractCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
    flexShrink: 0,
  },
  contractCopyText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  contractStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 7,
  },
  statCol: {
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: -0.1,
    whiteSpace: 'nowrap',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },

  /* Appliances Section */
  applianceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 10,
  },
  applianceSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  applianceSectionSub: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  addApplianceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    flexShrink: 0,
    boxShadow: '0 3px 10px rgba(37, 99, 235, 0.28)',
  },
  addApplianceBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },

  /* AMC Appliance Plan Allowance Card (Exact match to Images 3 & 5) */
  allowanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 4,
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
  },
  allowanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  allowanceLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    gap: 10,
  },
  allowanceShieldWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
    flexShrink: 0,
  },
  allowanceTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  allowanceTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  allowanceProtectionTag: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  allowanceCountBadge: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
    flexShrink: 0,
  },
  allowanceCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    whiteSpace: 'nowrap',
  },
  allowanceProgressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 12,
  },
  allowanceProgressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  slotsAvailableCallout: {
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  slotsAvailableTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  slotsAvailableSub: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    marginTop: 3,
  },
  amcRuleNoticeCard: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  amcRuleNoticeText: {
    fontSize: 11.5,
    color: '#9a3412',
    lineHeight: 16,
  },
  emptyApplianceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  emptyApplianceIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyApplianceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyApplianceSub: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 290,
  },
  emptyRegisterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 18,
    boxShadow: '0 3px 10px rgba(37, 99, 235, 0.25)',
  },
  emptyRegisterBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  applianceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  applianceThumb: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  applianceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  applianceMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  applianceCoveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  applianceCoveredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },

  /* My AMC History Action Card (from Sketch) */
  historyActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)',
  },
  historyActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  historyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    ...flexCenter,
  },
  historyActionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  historyActionSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  historyArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    ...flexCenter,
    marginLeft: 10,
  },

  /* History Screen Specific Styles */
  subFilterRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
  },
  subFilterPill: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  subFilterPillActive: {
    backgroundColor: '#2563eb',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
  },
  subFilterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  subFilterTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  claimCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  claimHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  claimTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  claimDate: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
  },
  claimBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  claimBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  claimStatusActive: {
    backgroundColor: '#eff6ff',
  },
  claimStatusTopUp: {
    backgroundColor: '#fef3c7',
  },
  claimStatusCovered: {
    backgroundColor: '#dcfce7',
  },
  amcCostBreakdown: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 5,
  },
  amcCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amcCostItemLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  amcCostItemStrike: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  amcCostBenefit: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16a34a',
  },
  claimFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  claimCoveredLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  claimCoveredVal: {
    fontSize: 14.5,
    fontWeight: '900',
  },
  emptyClaimsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 16,
  },
  emptyClaimsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
  },
  emptyClaimsSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 320,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    ...flexCenter,
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    lineHeight: 18,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
