import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getPlanTheme } from '../../config/planTheme';
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

  // User's registered appliances covered under AMC
  const coveredAppliances = useMemo(() => {
    if (isGuest || !getAppliancesForUser) return [];
    return getAppliancesForUser(activeUser) || [];
  }, [getAppliancesForUser, activeUser, isGuest]);

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

    return {
      contractNo,
      planName: activeAmc?.planName || planName,
      tierBadge: planTheme.tierBadge || 'VIP AMC',
      startDate: formatTxDate(activeAmc?.startDate || activeUser?.amc_start_date || '2026-01-01'),
      expiryDate: formatTxDate(activeAmc?.expiryDate || activeUser?.amc_expiry_date || '2027-01-01'),
      daysRemaining: activeAmc?.daysRemaining || 342,
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

  const filteredTxs = useMemo(() => {
    if (historyFilter === 'Services') {
      return userTransactions.filter((tx) => {
        const isTopUpTx = tx.type === 'WALLET_CREDIT' || String(tx.transaction_id || '').includes('TOPUP') || String(tx.description || '').toLowerCase().includes('top-up');
        return !isTopUpTx && (tx.type === 'SERVICE_PAYMENT' || tx.type === 'AMC_SERVICE_CLAIM' || tx.category === 'Services');
      });
    }
    if (historyFilter === 'Contracts') {
      return userTransactions.filter((tx) => {
        const isTopUpTx = tx.type === 'WALLET_CREDIT' || String(tx.transaction_id || '').includes('TOPUP') || String(tx.description || '').toLowerCase().includes('top-up');
        return isTopUpTx || tx.type === 'AMC_PURCHASE' || tx.type === 'PLAN_PURCHASE' || tx.category === 'Plans';
      });
    }
    return userTransactions;
  }, [userTransactions, historyFilter]);

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
            <View style={styles.emptyClaimsCard}>
              <IconScroll size={36} color="#94a3b8" />
              <Text style={styles.emptyClaimsTitle}>No AMC Claims Logged Yet</Text>
              <Text style={styles.emptyClaimsSub}>
                When you book home services under your {contractDetails?.planName || 'AMC'}, all ₹0 labor waivers, scheduled maintenance visits, and covered parts claims will appear here.
              </Text>
              <TouchableOpacity
                style={[styles.actionBtnPrimary, { marginTop: 16 }]}
                onPress={() => go('/user/bookings/new')}
                activeOpacity={0.88}
              >
                <Text style={styles.actionBtnPrimaryText}>Book AMC Covered Service</Text>
              </TouchableOpacity>
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

              return (
                <View key={tx.id || tx.transaction_id || idx} style={styles.claimCard}>
                  <View style={styles.claimHeaderRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.claimTitle} numberOfLines={1}>{cardTitle}</Text>
                      <Text style={styles.claimDate}>
                        {formatTxDate(tx.date || tx.created_at || tx.timestamp || 'Just now')} • Ref #{String(tx.transaction_id || tx.id || 'TX-2026').slice(-8)}
                      </Text>
                    </View>
                    <View style={[styles.claimBadge, badgeStyle]}>
                      <Text style={styles.claimBadgeText}>{badgeText}</Text>
                    </View>
                  </View>

                  {!isContractPurchase && !isTopUp && (
                    <View style={styles.amcCostBreakdown}>
                      <View style={styles.amcCostRow}>
                        <Text style={styles.amcCostItemLabel}>Breakdown Labor Charge:</Text>
                        <Text style={styles.amcCostItemStrike}>₹499</Text>
                      </View>
                      <View style={styles.amcCostRow}>
                        <Text style={styles.amcCostItemLabel}>AMC Member Benefit:</Text>
                        <Text style={styles.amcCostBenefit}>-₹499 (100% Free)</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.claimFooterRow}>
                    <Text style={styles.claimCoveredLabel}>
                      {isContractPurchase
                        ? 'Contract Investment:'
                        : isTopUp
                        ? 'Amount Added to AMC:'
                        : 'Total Paid by Customer:'}
                    </Text>
                    <Text style={[styles.claimCoveredVal, (isTopUp || !isContractPurchase) && { color: '#059669' }]}>
                      {isContractPurchase
                        ? formatMoney(tx.amount)
                        : isTopUp
                        ? `+${formatMoney(tx.amount)}`
                        : '₹0.00 (Fully Covered)'}
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
      {/* THE 2 PRIMARY TOGGLE TABS (From Sketch: Available Balance | Add Appliance) */}
      {/* ===================================================================== */}
      {/* THE 2 PRIMARY TOGGLE TABS (From Sketch: Available Balance | Add New Appliance) */}
      {/* ===================================================================== */}
      <View style={styles.primaryTabsContainer}>
        <TouchableOpacity
          style={[styles.primaryTabBtn, activeTab === 'BALANCE' && styles.primaryTabBtnActive]}
          onPress={() => setActiveTab('BALANCE')}
          activeOpacity={0.85}
        >
          <IconShield size={15} color={activeTab === 'BALANCE' ? '#ffffff' : '#64748b'} />
          <Text style={[styles.primaryTabText, activeTab === 'BALANCE' && styles.primaryTabTextActive]}>
            Available Balance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryTabBtn, activeTab === 'APPLIANCES' && styles.primaryTabBtnActive]}
          onPress={() => setActiveTab('APPLIANCES')}
          activeOpacity={0.85}
        >
          <IconPlus size={15} color={activeTab === 'APPLIANCES' ? '#ffffff' : '#64748b'} />
          <Text style={[styles.primaryTabText, activeTab === 'APPLIANCES' && styles.primaryTabTextActive]}>
            Add New Appliance
          </Text>
        </TouchableOpacity>
      </View>

      {/* ===================================================================== */}
      {/* TAB CONTENT 1: AVAILABLE BALANCE MODE                                */}
      {/* ===================================================================== */}
      {activeTab === 'BALANCE' && contractDetails && (
        <View style={{ paddingHorizontal: 16 }}>
          {/* VIP AMC Membership Card */}
          <View style={styles.vipCard}>
            <View
              style={[
                styles.vipCardInner,
                {
                  backgroundColor: planTheme.headerBgSolid || '#0a192f',
                  backgroundImage: planTheme.headerBg,
                  borderColor: planTheme.borderGold || '#cbd5e1',
                  boxShadow: planTheme.cardGlow,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                },
              ]}
            >
              {/* Card Header Row */}
              <View style={styles.vipCardHeaderRow}>
                <View style={[styles.chipGraphic, { backgroundColor: planTheme.metalColor || '#e2e8f0', borderColor: '#cbd5e1' }]}>
                  <View style={[styles.chipInnerLine, { borderColor: planTheme.specHighlight || '#475569' }]} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.daysLeftPill, { backgroundColor: 'rgba(255, 255, 255, 0.85)', borderColor: planTheme.borderGold || '#cbd5e1' }]}>
                    <IconClock size={11} color={planTheme.headerTaglineColor || '#475569'} />
                    <Text style={[styles.daysLeftPillText, { color: planTheme.headerTextColor || '#0f172a' }]}>
                      {contractDetails.daysRemaining} days left
                    </Text>
                  </View>
                  <View style={[styles.vipTierPill, { backgroundColor: planTheme.badgeBg, borderColor: planTheme.badgeBorder }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <IconStar size={11} color={planTheme.badgeTextColor} />
                      <Text style={[styles.vipTierPillText, { color: planTheme.badgeTextColor }]}>
                        {contractDetails.tierBadge}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Plan Title & Contract Code */}
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.vipCardPlanTitle, { color: planTheme.headerTextColor || '#0f172a' }]}>
                  {contractDetails.planName}
                </Text>
                <View style={styles.contractCodeRow}>
                  <Text style={[styles.contractCodeLabel, { color: planTheme.headerTaglineColor || '#475569' }]}>
                    CONTRACT NO:
                  </Text>
                  <TouchableOpacity
                    onPress={handleCopyContractNo}
                    style={[styles.contractCodeBtn, { backgroundColor: 'rgba(255, 255, 255, 0.85)', borderColor: planTheme.borderGold || '#cbd5e1' }]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.contractCodeVal, { color: planTheme.headerTextColor || '#0f172a' }]}>
                      {contractDetails.contractNo}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 2 }}>
                      {copiedContract ? (
                        <>
                          <IconCheck size={11} color="#16a34a" />
                          <Text style={[styles.copyPillText, { color: '#16a34a' }]}>Copied</Text>
                        </>
                      ) : (
                        <>
                          <IconCopy size={11} color={planTheme.headerTextColor || '#0f172a'} />
                          <Text style={[styles.copyPillText, { color: planTheme.headerTextColor || '#0f172a' }]}>Copy</Text>
                        </>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Property Coverage Info */}
              <View style={[styles.coveredPropertyRow, { borderTopColor: 'rgba(15, 23, 42, 0.12)' }]}>
                <Text style={[styles.coveredPropertyLabel, { color: planTheme.headerTaglineColor || '#475569' }]}>
                  COVERED PROPERTY:
                </Text>
                <Text style={[styles.coveredPropertyText, { color: planTheme.headerTextColor || '#0f172a' }]} numberOfLines={1}>
                  {contractDetails.propertyAddress}
                </Text>
              </View>

              {/* Available Balance Section */}
              <View style={[styles.moneySection, { borderTopColor: 'rgba(15, 23, 42, 0.12)' }]}>
                <View style={styles.moneyMetaRow}>
                  <View style={{ gap: 2 }}>
                    <Text style={[styles.moneyLabel, { color: planTheme.headerTaglineColor || '#475569' }]}>
                      AVAILABLE AMC BALANCE
                    </Text>
                    <Text style={[styles.moneyValText, { color: planTheme.headerTextColor || '#0f172a' }]}>
                      {formatMoney(contractDetails.remainingPlanMoney)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={[styles.moneyLabel, { color: planTheme.headerTaglineColor || '#475569', textAlign: 'right' }]}>
                      TOTAL PLAN LIMIT
                    </Text>
                    <Text style={[styles.moneyCapText, { color: planTheme.headerTextColor || '#0f172a' }]}>
                      {formatMoney(contractDetails.totalPlanMoney)}
                    </Text>
                  </View>
                </View>

                {/* Balance Progress Bar */}
                <View style={[styles.moneyTrack, { backgroundColor: 'rgba(15, 23, 42, 0.12)' }]}>
                  <View
                    style={[
                      styles.moneyFill,
                      {
                        width: `${Math.min(100, Math.max(6, (contractDetails.remainingPlanMoney / (contractDetails.totalPlanMoney || 1)) * 100))}%`,
                        backgroundColor: planTheme.metalColor || '#D3AF37',
                      },
                    ]}
                  />
                </View>

                <View style={styles.moneyStatusRow}>
                  <View style={styles.statusPillRow}>
                    <View style={styles.statusLiveDot} />
                    <Text style={styles.validityStatus}>Active & Verified</Text>
                  </View>
                  <Text style={[styles.validityExpiresMeta, { color: planTheme.headerTaglineColor || '#475569' }]}>
                    Valid till: <Text style={{ fontWeight: '700', color: planTheme.headerTextColor || '#0f172a' }}>{contractDetails.expiryDate}</Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* "MY AMC HISTORY" ACTION CARD (Positioned above Active AMC Coverage Privileges as requested) */}
          <View style={{ marginTop: 14 }}>
            <TouchableOpacity
              style={styles.historyActionCard}
              onPress={() => setViewMode('HISTORY')}
              activeOpacity={0.85}
            >
              <View style={styles.historyActionLeft}>
                <View style={styles.historyIconWrap}>
                  <IconScroll size={20} color="#2563eb" />
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
          </View>

          {/* AMC Privileges & Benefits Card */}
          <View style={styles.perksCard}>
            <Text style={styles.perksCardTitle}>Active AMC Coverage Privileges</Text>

            <View style={styles.perkRow}>
              <View style={styles.perkIconWrap}>
                <IconZap size={16} color="#ea580c" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.perkTitle}>Guaranteed Priority SLA ({contractDetails.slaHours} Hours)</Text>
                <Text style={styles.perkSub}>Certified technicians reach your property within {contractDetails.slaHours} hours for emergency breakdowns.</Text>
              </View>
            </View>

            <View style={styles.perkRow}>
              <View style={styles.perkIconWrap}>
                <IconHome size={16} color="#0284c7" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.perkTitle}>₹0 Breakdown Labor Included</Text>
                <Text style={styles.perkSub}>100% labor charge waiver on all scheduled maintenance and breakdown repairs.</Text>
              </View>
            </View>

            <View style={styles.perkRow}>
              <View style={styles.perkIconWrap}>
                <IconCpu size={16} color="#7c3aed" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.perkTitle}>Genuine OEM Spare Parts Coverage</Text>
                <Text style={styles.perkSub}>Spare parts allowance coverage backed by 90-day replacement guarantee.</Text>
              </View>
            </View>

            <View style={styles.perkRow}>
              <View style={styles.perkIconWrap}>
                <IconUserTie size={16} color="#0d9488" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.perkTitle}>Dedicated Senior Concierge & Manager</Text>
                <Text style={styles.perkSub}>Direct VIP line for priority dispatch, service scheduling, and quality assurance.</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ===================================================================== */}
      {/* TAB CONTENT 2: ADD APPLIANCE MODE                                    */}
      {/* ===================================================================== */}
      {activeTab === 'APPLIANCES' && (
        <View style={{ paddingHorizontal: 16 }}>
          {/* Header Row */}
          <View style={styles.applianceHeaderRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
              <Text style={styles.applianceSectionTitle}>Covered Appliances</Text>
              <Text style={styles.applianceSectionSub} numberOfLines={1}>
                {coveredAppliances.length === 0
                  ? `Protect your home appliances under ${contractDetails?.planName || 'AMC'}`
                  : `${coveredAppliances.length} appliance${coveredAppliances.length === 1 ? '' : 's'} registered`}
              </Text>
            </View>
            {coveredAppliances.length > 0 && (
              <TouchableOpacity
                style={styles.addApplianceBtn}
                onPress={() => setViewMode('WIZARD')}
                activeOpacity={0.88}
              >
                <IconPlus size={13} color="#ffffff" />
                <Text style={styles.addApplianceBtnText}>Add New</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* List of Registered Appliances */}
          {coveredAppliances.length === 0 ? (
            <View style={styles.emptyApplianceCard}>
              <View style={styles.emptyApplianceIconWrap}>
                <IconHome size={28} color="#2563eb" />
              </View>
              <Text style={styles.emptyApplianceTitle}>No Appliances Linked Yet</Text>
              <Text style={styles.emptyApplianceSub}>
                Register your AC, Refrigerator, Washing Machine, RO & home appliances to activate ₹0 breakdown labor and spare parts protection.
              </Text>
              <TouchableOpacity
                style={styles.emptyRegisterBtn}
                onPress={() => setViewMode('WIZARD')}
                activeOpacity={0.88}
              >
                <IconPlus size={15} color="#ffffff" />
                <Text style={styles.emptyRegisterBtnText}>Register New Appliance</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 10, marginTop: 10 }}>
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
                      <View style={styles.applianceCoveredBadge}>
                        <IconCheck size={11} color="#16a34a" />
                        <Text style={styles.applianceCoveredBadgeText}>Covered under {contractDetails?.planName || 'AMC'}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* "MY AMC HISTORY" ACTION CARD */}
          <View style={{ marginTop: 16 }}>
            <TouchableOpacity
              style={styles.historyActionCard}
              onPress={() => setViewMode('HISTORY')}
              activeOpacity={0.85}
            >
              <View style={styles.historyActionLeft}>
                <View style={styles.historyIconWrap}>
                  <IconScroll size={20} color="#2563eb" />
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
          </View>
        </View>
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

  /* Primary Switch Tabs: [ Available Balance ]  [ Add New Appliance ] */
  primaryTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  primaryTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 9,
    gap: 5,
  },
  primaryTabBtnActive: {
    backgroundColor: '#2563eb',
    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
  },
  primaryTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  },
  primaryTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  /* VIP AMC Card */
  vipCard: {
    borderRadius: 18,
    overflow: 'hidden',
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.08)',
  },
  vipCardInner: {
    paddingHorizontal: 15,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  vipCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipGraphic: {
    width: 32,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderColor: '#cbd5e1',
    ...flexCenter,
  },
  chipInnerLine: {
    width: 20,
    height: 12,
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 2,
  },
  daysLeftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  daysLeftPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  vipTierPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  vipTierPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vipCardPlanTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  contractCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  contractCodeLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  contractCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: '100%',
  },
  contractCodeVal: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  copyPillText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  coveredPropertyRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  coveredPropertyLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  coveredPropertyText: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 16,
  },
  moneySection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  moneyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
  moneyLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  moneyValText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  moneyCapText: {
    fontSize: 13.5,
    fontWeight: '700',
    textAlign: 'right',
  },
  moneyTrack: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  moneyFill: {
    height: '100%',
    borderRadius: 3,
  },
  moneyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  validityStatus: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#16a34a',
  },
  validityExpiresMeta: {
    fontSize: 10.5,
  },

  /* Perks Card */
  perksCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  perksCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  perkIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...flexCenter,
    marginTop: 2,
  },
  perkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  perkSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
    lineHeight: 15,
  },

  /* Appliances Section */
  applianceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  applianceSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  applianceSectionSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  addApplianceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  addApplianceBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
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
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  subFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  subFilterPillActive: {
    backgroundColor: '#2563eb',
  },
  subFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  subFilterTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  claimCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  claimHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  claimTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  claimDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  claimBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  claimBadgeText: {
    fontSize: 10,
    fontWeight: '700',
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
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    gap: 4,
  },
  amcCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amcCostItemLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  amcCostItemStrike: {
    fontSize: 11,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  amcCostBenefit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  claimFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  claimCoveredLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  claimCoveredVal: {
    fontSize: 12,
    fontWeight: '800',
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
