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
  const [showAllPlansModal, setShowAllPlansModal] = useState(false);

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
          {(() => {
            const listToRender = filteredTxs.length > 0 ? filteredTxs : [
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
              },
              {
                id: 'sample-contract-1',
                type: 'AMC_PURCHASE',
                plan_name: contractDetails?.planName || 'Gold',
                date: '5 Sept 2026',
                refNumber: 'D-PLAN-1',
                amount: 1499,
                badgeText: 'Contract Activated',
                category: 'Contracts',
              },
            ].filter((tx) => {
              if (historyFilter === 'Services') return tx.category === 'Services';
              if (historyFilter === 'Contracts') return tx.category === 'Contracts';
              return true;
            });

            return listToRender.map((tx, idx) => {
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

              const displayRef = tx.refNumber
                ? tx.refNumber
                : String(tx.transaction_id || tx.id || 'TX-2026').slice(-8);

              return (
                <View key={tx.id || tx.transaction_id || idx} style={styles.claimCard}>
                  <View style={styles.claimHeaderRow}>
                    <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                      <Text style={styles.claimTitle} numberOfLines={1}>{cardTitle}</Text>
                      <Text style={styles.claimDate}>
                        {formatTxDate(tx.date || tx.created_at || tx.timestamp || 'Just now')} • Ref #{displayRef}
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
            });
          })()}
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
          <View style={styles.goldCard}>
            {/* Top row: Metallic Smart Chip + Days Left Badge */}
            <View style={styles.goldTopRow}>
              <View style={styles.chipGraphic}>
                <View style={styles.chipInnerGrid}>
                  <View style={styles.chipCenterPin} />
                </View>
              </View>
              <View style={styles.daysLeftBadge}>
                <IconClock size={12} color="#0f172a" />
                <Text style={styles.daysLeftBadgeText}>
                  {contractDetails.daysRemaining || 342} days left
                </Text>
              </View>
            </View>

            {/* Available AMC Balance Heading */}
            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>AVAILABLE AMC BALANCE</Text>
              <Text style={styles.balanceAmount}>
                {formatMoney(contractDetails.remainingPlanMoney || 500000)}
              </Text>
            </View>

            {/* Active AMC Protection White Card */}
            <View style={styles.activePlanCard}>
              <View style={styles.activePlanTopHeader}>
                <View style={styles.activePlanBadgeRow}>
                  <IconShieldCheck size={14} color="#b45309" />
                  <Text style={styles.activePlanBadgeText}>ACTIVE AMC PROTECTION</Text>
                </View>
                <TouchableOpacity
                  style={styles.allPlansBtn}
                  onPress={() => setShowAllPlansModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.allPlansBtnText}>All Plans →</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.activePlanTitle}>
                {contractDetails.planName || 'Gold'} • Verified Active Coverage
              </Text>
              <Text style={styles.activePlanSub}>
                Active Plan — Ye hamara active plan hai • 100% Free breakdown repairs & labor covered
              </Text>
            </View>

            {/* Covered Amounts by Plan Tier */}
            <Text style={styles.tierSectionTitle}>COVERED AMOUNTS BY PLAN TIER</Text>
            <View style={styles.tierGrid}>
              {/* Silver Tier */}
              <View style={styles.tierCard}>
                <View style={[styles.tierPill, { backgroundColor: '#e2e8f0' }]}>
                  <Text style={[styles.tierPillText, { color: '#475569' }]}>SILVER</Text>
                </View>
                <Text style={styles.tierAmount}>₹1 Lakh</Text>
                <Text style={styles.tierLimitLabel}>Coverage Limit</Text>
                <Text style={styles.tierPrice}>₹799 / yr</Text>
              </View>

              {/* Gold Tier (Active) */}
              <View style={[styles.tierCard, styles.tierCardActive]}>
                <View style={[styles.tierPill, { backgroundColor: '#fef08a', borderWidth: 1, borderColor: '#D3AF37' }]}>
                  <Text style={[styles.tierPillText, { color: '#78350f' }]}>ACTIVE</Text>
                </View>
                <Text style={styles.tierAmount}>₹5 Lakh</Text>
                <Text style={styles.tierLimitLabel}>Coverage Limit</Text>
                <Text style={styles.tierPrice}>₹1,499 / yr</Text>
                <View style={styles.tierActiveIndicator}>
                  <Text style={styles.tierActiveIndicatorText}>✓ Active</Text>
                </View>
              </View>

              {/* Platinum Tier */}
              <View style={styles.tierCard}>
                <View style={[styles.tierPill, { backgroundColor: '#f3e8ff' }]}>
                  <Text style={[styles.tierPillText, { color: '#7e22ce' }]}>PLATINUM</Text>
                </View>
                <Text style={styles.tierAmount}>₹10 Lakh</Text>
                <Text style={styles.tierLimitLabel}>Coverage Limit</Text>
                <Text style={styles.tierPrice}>₹2,499 / yr</Text>
              </View>
            </View>

            {/* Contract # Strip Card */}
            <View style={styles.contractDetailsCard}>
              <View style={styles.contractTopRow}>
                <View style={styles.contractNumWrap}>
                  <IconShieldCheck size={14} color="#b45309" />
                  <Text style={styles.contractNumText}>
                    CONTRACT #{contractDetails.contractNo}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCopyContractNo}
                  style={styles.contractCopyBtn}
                  activeOpacity={0.8}
                >
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

              <View style={styles.contractStatsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>VALID TILL</Text>
                  <Text style={styles.statValue}>{contractDetails.expiryDate || '1 Jan 2027'}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>PARTS ALLOWANCE</Text>
                  <Text style={styles.statValue}>
                    {formatMoney(contractDetails.partsLeft || contractDetails.partsCap || 40000)}
                  </Text>
                </View>
                <View style={[styles.statCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.statLabel}>FREE VISITS LEFT</Text>
                  <Text style={styles.statValue}>
                    {contractDetails.visitsLeft ?? 4} / {contractDetails.totalVisits ?? 4}
                  </Text>
                </View>
              </View>
            </View>

            {/* All Parts Change & Replacement Covered Section (Image 2) */}
            <View style={styles.partsCoverageCard}>
              <View style={styles.partsCoverageHeader}>
                <IconCpu size={16} color="#b45309" />
                <Text style={styles.partsCoverageTitle}>ALL PARTS CHANGE & REPLACEMENT COVERED</Text>
              </View>
              <Text style={styles.partsCoverageSub}>
                100% Genuine OEM parts replacement covered under your AMC plan with ₹0 breakdown labor charges:
              </Text>

              {/* 8 OEM Chips */}
              <View style={styles.partsChipsWrap}>
                {[
                  'Compressor',
                  'Fan Motors',
                  'PCB Circuits',
                  'Thermostat',
                  'Valves & Gas',
                  'Internal Wiring',
                  'Heating Elements',
                  'Burners & Sensors',
                ].map((item) => (
                  <View key={item} style={styles.partChip}>
                    <IconCheck size={11} color="#15803d" />
                    <Text style={styles.partChipText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Benefits Included */}
              <View style={styles.benefitRow}>
                <IconShieldCheck size={15} color="#b45309" />
                <Text style={styles.benefitText}>₹0 Breakdown Labor Included</Text>
              </View>
              <View style={styles.benefitRow}>
                <IconClock size={15} color="#b45309" />
                <Text style={styles.benefitText}>2-4 Hours Priority SLA</Text>
              </View>
            </View>

            {/* Bottom active plan card from Image 2 */}
            <View style={styles.activePlanBottomBar}>
              <IconCheck size={15} color="#15803d" />
              <Text style={styles.activePlanBottomBarText}>
                Active Plan — Ye hamara active plan hai
              </Text>
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
  activePlanCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 11,
    boxShadow: '0 3px 12px rgba(0,0,0,0.05)',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(211, 175, 55, 0.25)',
  },
  activePlanTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  activePlanBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activePlanBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
    letterSpacing: 0.5,
  },
  activePlanTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  activePlanSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
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
  tierSectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#713f12',
    letterSpacing: 0.5,
    marginBottom: 6,
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
  tierCardActive: {
    backgroundColor: '#ffffff',
    borderColor: '#D3AF37',
    borderWidth: 1.6,
    boxShadow: '0 3px 12px rgba(211, 175, 55, 0.25)',
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
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 3,
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
  contractDetailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
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
  partsCoverageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 13,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(211, 175, 55, 0.2)',
  },
  partsCoverageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  partsCoverageTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#713f12',
    letterSpacing: 0.3,
  },
  partsCoverageSub: {
    fontSize: 11.5,
    color: '#57534e',
    lineHeight: 16,
    marginBottom: 10,
  },
  partsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  partChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  partChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1c1917',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  benefitText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1c1917',
  },
  activePlanBottomBar: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(211, 175, 55, 0.3)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  },
  activePlanBottomBarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1c1917',
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
