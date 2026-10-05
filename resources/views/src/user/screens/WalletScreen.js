import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getPlanTheme } from '../../config/planTheme';

const flexCenter = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

/* --- High Precision SVG Vector Icons (Strictly Zero Emojis) --- */

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

const IconWrench = ({ size = 18, color = '#0284c7' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const IconTools = ({ size = 18, color = '#059669' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    <line x1="2" y1="22" x2="7.5" y2="16.5" />
  </svg>
);

const IconCog = ({ size = 18, color = '#d97706' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconSavings = ({ size = 22, color = '#15803d' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
    <path d="M2 9v1c0 1.1.9 2 2 2h1" />
    <circle cx="16" cy="11" r="1" fill={color} />
  </svg>
);

const IconZap = ({ size = 16, color = '#d97706' }) => (
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

const IconDoc = ({ size = 18, color = '#d4af37' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
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

const IconArrowRight = ({ size = 14, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconClose = ({ size = 16, color = '#64748b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
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

export default function WalletScreen({ onNavigate }) {
  const { wallet = {}, activeUser = {}, activeAmc, topUpWallet } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('coverage'); // 'coverage' | 'claims'
  const [filter, setFilter] = useState('All'); // 'All' | 'Services' | 'Contracts'
  const [copiedContract, setCopiedContract] = useState(false);

  const isGuest = Boolean(
    activeUser?.isGuest ||
    activeUser?.id === 0 ||
    activeUser?.name === 'Guest User' ||
    !activeUser?.phone ||
    activeUser?.phone === '+91 00000 00000'
  );

  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(10000);
  const [topUpMsg, setTopUpMsg] = useState('');
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);

  const go = (path) => {
    if (navigate) navigate(path);
    else if (onNavigate) onNavigate(path);
  };

  const planName = activeUser?.subscription_plan || 'None';
  const hasActiveAmc = !isGuest && activeUser?.subscription_status === 'ACTIVE' && planName !== 'None' && planName !== 'None / Inactive';
  const isSilver = String(planName).toLowerCase().includes('silver');
  const planTheme = getPlanTheme(planName);

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
    if (filter === 'Services') {
      return userTransactions.filter((tx) => {
        const isTopUpTx = tx.type === 'WALLET_CREDIT' || String(tx.transaction_id || '').includes('TOPUP') || String(tx.description || '').toLowerCase().includes('top-up');
        return !isTopUpTx && (tx.type === 'SERVICE_PAYMENT' || tx.type === 'AMC_SERVICE_CLAIM' || tx.category === 'Services');
      });
    }
    if (filter === 'Contracts') {
      return userTransactions.filter((tx) => {
        const isTopUpTx = tx.type === 'WALLET_CREDIT' || String(tx.transaction_id || '').includes('TOPUP') || String(tx.description || '').toLowerCase().includes('top-up');
        return isTopUpTx || tx.type === 'AMC_PURCHASE' || tx.type === 'PLAN_PURCHASE' || tx.category === 'Plans';
      });
    }
    return userTransactions;
  }, [userTransactions, filter]);

  const handleCopyContractNo = () => {
    if (contractDetails?.contractNo) {
      try {
        navigator.clipboard.writeText(contractDetails.contractNo);
        setCopiedContract(true);
        setTimeout(() => setCopiedContract(false), 2000);
      } catch (e) {}
    }
  };

  const handleTopUpPartsAllowance = () => {
    setIsProcessingTopUp(true);
    setTimeout(() => {
      if (typeof topUpWallet === 'function') {
        topUpWallet(topUpAmount);
      }
      setIsProcessingTopUp(false);
      setShowTopUpModal(false);
      setTopUpMsg(`Allowance Top-Up Successful: ₹${topUpAmount.toLocaleString('en-IN')} added to Spare Parts Protection!`);
      setTimeout(() => setTopUpMsg(''), 4000);
    }, 1000);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => go('/user/home')} activeOpacity={0.75}>
          <IconChevronLeft />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>MY AMC</Text>
        </View>
        <View style={[styles.vipShieldBadge, isSilver && { borderColor: '#94a3b8', backgroundColor: '#0f172a' }]}>
          <IconShieldCheck color={isSilver ? '#94a3b8' : '#d4af37'} />
        </View>
      </View>

      {/* Alert / Notice Message */}
      {!!topUpMsg && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>{topUpMsg}</Text>
        </View>
      )}

      {/* Urban Company Plus Style VIP AMC Membership Card */}
      {hasActiveAmc && contractDetails ? (
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
            {/* Holographic / Metallic Chip & Top Badge Row */}
            <View style={styles.vipCardHeaderRow}>
              <View style={[styles.chipGraphic, { backgroundColor: planTheme.metalColor || '#e2e8f0', borderColor: '#ffffff' }]}>
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
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.vipCardPlanTitle, { color: planTheme.headerTextColor || '#0f172a' }]}>{contractDetails.planName}</Text>
              <View style={styles.contractCodeRow}>
                <Text style={[styles.contractCodeLabel, { color: planTheme.headerTaglineColor || '#475569' }]}>CONTRACT NO:</Text>
                <TouchableOpacity
                  onPress={handleCopyContractNo}
                  style={[styles.contractCodeBtn, { backgroundColor: 'rgba(255, 255, 255, 0.75)', borderColor: planTheme.borderGold || '#cbd5e1' }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.contractCodeVal, { color: planTheme.headerTextColor || '#0f172a' }]}>{contractDetails.contractNo}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 2 }}>
                    {copiedContract ? (
                      <>
                        <IconCheck size={12} color="#16a34a" />
                        <Text style={[styles.copyPillText, { color: '#16a34a' }]}>Copied</Text>
                      </>
                    ) : (
                      <>
                        <IconCopy size={12} color={planTheme.headerTextColor || '#0f172a'} />
                        <Text style={[styles.copyPillText, { color: planTheme.headerTextColor || '#0f172a' }]}>Copy</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Property Coverage Info */}
            <View style={[styles.coveredPropertyRow, { borderTopColor: 'rgba(15, 23, 42, 0.12)' }]}>
              <Text style={[styles.coveredPropertyLabel, { color: planTheme.headerTaglineColor || '#475569' }]}>COVERED PROPERTY:</Text>
              <Text style={[styles.coveredPropertyText, { color: planTheme.headerTextColor || '#0f172a' }]} numberOfLines={1}>{contractDetails.propertyAddress}</Text>
            </View>

            {/* Money Allowance Line (Shows full 5,00,000 / 1,00,000 plan coverage) */}
            <View style={[styles.moneySection, { borderTopColor: 'rgba(15, 23, 42, 0.12)' }]}>
              <View style={styles.moneyMetaRow}>
                <View style={{ gap: 2 }}>
                  <Text style={[styles.moneyLabel, { color: planTheme.headerTaglineColor || '#475569' }]}>AMC COVERAGE BALANCE</Text>
                  <Text style={[styles.moneyValText, { color: planTheme.headerTextColor || '#0f172a' }]}>
                    {formatMoney(contractDetails.remainingPlanMoney)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Text style={[styles.moneyLabel, { color: planTheme.headerTaglineColor || '#475569' }]}>TOTAL PLAN VALUE</Text>
                  <Text style={[styles.moneyCapText, { color: planTheme.headerTextColor || '#0f172a' }]}>
                    {formatMoney(contractDetails.totalPlanMoney)}
                  </Text>
                </View>
              </View>

              {/* Progress Money Line */}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#16a34a' }} />
                  <Text style={[styles.validityStatus, { color: '#16a34a' }]}>Contract Active & Verified</Text>
                </View>
                <Text style={[styles.validityExpiresMeta, { color: planTheme.headerTaglineColor || '#475569' }]}>
                  Valid till: <Text style={{ fontWeight: '700', color: planTheme.headerTextColor || '#0f172a' }}>{contractDetails.expiryDate}</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        /* Unprotected State: Urban Company Style Invitation Card */
        <View style={styles.unprotectedCard}>
          <View style={styles.unprotectedLeft}>
            <View style={styles.unprotectedShieldWrap}>
              <IconShield size={28} color="#d4af37" />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text style={styles.unprotectedTitle}>No Active AMC Contract</Text>
              <Text style={styles.unprotectedSub}>
                Protect your home & major appliances with ₹0 breakdown labor, scheduled maintenance visits, and priority 2-hr response.
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.unprotectedBtn} onPress={() => go('/user/plans')} activeOpacity={0.88}>
            <Text style={styles.unprotectedBtnText}>Explore AMC Plans (from ₹1 Lakh)</Text>
            <IconArrowRight size={14} color="#fbbf24" />
          </TouchableOpacity>
        </View>
      )}


      {/* Urban Company Savings Guarantee Counter */}
      {hasActiveAmc && (
        <View style={styles.savingsBox}>
          <View style={styles.savingsBoxLeft}>
            <View style={styles.savingsIconCircle}>
              <IconSavings size={20} color="#15803d" />
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
              <Text style={styles.savingsBoxTitle}>Annual AMC Savings Guarantee</Text>
              <Text style={styles.savingsBoxSub}>
                You have saved <Text style={{ fontWeight: '800', color: '#15803d' }}>₹14,850</Text> this year on inspection and labor charges.
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Navigation Tabs: Coverage & Benefits vs Claims & Ledger */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'coverage' && styles.tabItemActive]}
          onPress={() => setActiveTab('coverage')}
          activeOpacity={0.8}
        >
          <IconShield size={15} color={activeTab === 'coverage' ? (isSilver ? '#e2e8f0' : '#fbbf24') : '#64748b'} />
          <Text style={[styles.tabItemText, activeTab === 'coverage' && (isSilver ? { color: '#e2e8f0' } : styles.tabItemTextActive)]}>
            Coverage & Perks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'claims' && styles.tabItemActive]}
          onPress={() => setActiveTab('claims')}
          activeOpacity={0.8}
        >
          <IconDoc size={15} color={activeTab === 'claims' ? (isSilver ? '#e2e8f0' : '#fbbf24') : '#64748b'} />
          <Text style={[styles.tabItemText, activeTab === 'claims' && (isSilver ? { color: '#e2e8f0' } : styles.tabItemTextActive)]}>
            Claims & History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab 1: Coverage & Entitlement Details */}
      {activeTab === 'coverage' && (
        <View style={styles.tabContentCol}>
          <View style={styles.perksCard}>
            <Text style={styles.perksCardTitle}>Included AMC Privileges</Text>

            <View style={styles.perkRow}>
              <View style={styles.perkIconWrap}>
                <IconZap size={16} color="#ea580c" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.perkTitle}>Guaranteed Priority Response SLA</Text>
                <Text style={styles.perkSub}>Certified technicians reach your premises within {contractDetails?.slaHours || 2} hours for emergency breakdowns.</Text>
              </View>
            </View>

            <View style={styles.perkRow}>
              <View style={styles.perkIconWrap}>
                <IconHome size={16} color="#0284c7" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.perkTitle}>All Verified Home Appliances Covered</Text>
                <Text style={styles.perkSub}>ACs, Refrigerator, RO Water Purifier, Washing Machine, Electrical Wiring, Plumbing Fixtures, and Carpentry.</Text>
              </View>
            </View>

            <View style={styles.perkRow}>
              <View style={styles.perkIconWrap}>
                <IconCpu size={16} color="#7c3aed" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.perkTitle}>Genuine OEM Spare Parts Guarantee</Text>
                <Text style={styles.perkSub}>100% factory original parts with 90-day replacement warranty on all replaced components.</Text>
              </View>
            </View>

            <View style={styles.perkRow}>
              <View style={styles.perkIconWrap}>
                <IconUserTie size={16} color="#0d9488" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.perkTitle}>Dedicated Account Manager & VIP Concierge</Text>
                <Text style={styles.perkSub}>Direct line to our senior dispatch team for quick scheduling, dispute resolution, and reports.</Text>
              </View>
            </View>
          </View>

        </View>
      )}

      {/* Tab 2: Claims & Service History Ledger */}
      {activeTab === 'claims' && (
        <View style={styles.tabContentCol}>
          {/* Sub-Filters */}
          <View style={styles.subFilterRow}>
            {['All', 'Services', 'Contracts'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.subFilterPill, filter === f && styles.subFilterPillActive]}
                onPress={() => setFilter(f)}
                activeOpacity={0.8}
              >
                <Text style={[styles.subFilterText, filter === f && styles.subFilterTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredTxs.length === 0 ? (
            <View style={styles.emptyClaimsCard}>
              <IconScroll size={36} color="#94a3b8" />
              <Text style={styles.emptyClaimsTitle}>No Claims Logged Yet</Text>
              <Text style={styles.emptyClaimsSub}>
                When you book home services under your AMC, all ₹0 labor waivers and covered repair claims will appear here.
              </Text>
            </View>
          ) : (
            filteredTxs.map((tx) => {
              const isContractPurchase = tx.type === 'AMC_PURCHASE' || tx.type === 'PLAN_PURCHASE';
              const isTopUp =
                !isContractPurchase &&
                (tx.type === 'WALLET_CREDIT' ||
                  tx.type === 'TOPUP' ||
                  tx.type === 'ALLOWANCE_TOPUP' ||
                  String(tx.transaction_id || '').includes('TOPUP') ||
                  String(tx.description || '').toLowerCase().includes('top-up'));
              const serviceCharge = Number(tx.service_charge || 0);
              const partsCharge = Number(tx.parts_charge || 0);
              const labourCharge = Number(tx.labour_charge || 0);

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
                ? 'CONTRACT ACTIVE'
                : isTopUp
                ? 'ALLOWANCE CREDITED'
                : 'COVERED (₹0)';

              const badgeTextColor = isContractPurchase
                ? '#d97706'
                : isTopUp
                ? '#059669'
                : '#059669';

              return (
                <View key={tx.transaction_id} style={styles.claimCard}>
                  <View style={styles.claimCardHeader}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.claimTitle} numberOfLines={1}>
                        {cardTitle}
                      </Text>
                      <Text style={styles.claimDate}>{formatTxDate(tx.created_at)} • ID: {tx.transaction_id}</Text>
                    </View>
                    <View style={[styles.claimStatusBadge, badgeStyle]}>
                      <Text style={[styles.claimStatusText, { color: badgeTextColor }]}>
                        {badgeText}
                      </Text>
                    </View>
                  </View>

                  {/* Top-Up Breakdown Box */}
                  {isTopUp && (
                    <View style={styles.claimBreakdownBox}>
                      <View style={styles.claimRow}>
                        <Text style={styles.claimItemLabel}>Allowance Credited:</Text>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#15803d' }}>+{formatMoney(tx.amount)}</Text>
                      </View>
                      <View style={styles.claimRow}>
                        <Text style={styles.claimItemLabel}>Allocated To:</Text>
                        <Text style={{ fontSize: 11.5, fontWeight: '600', color: '#0f172a' }}>Spare Parts Protection Reserve</Text>
                      </View>
                      <View style={styles.claimRow}>
                        <Text style={styles.claimItemLabel}>Coverage Status:</Text>
                        <Text style={{ fontSize: 11.5, fontWeight: '600', color: '#059669' }}>Active & Available for Claims</Text>
                      </View>
                    </View>
                  )}

                  {/* Service Claim Breakdown Box */}
                  {!isContractPurchase && !isTopUp && (
                    <View style={styles.claimBreakdownBox}>
                      <View style={styles.claimRow}>
                        <Text style={styles.claimItemLabel}>Inspection & Call Charge:</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ textDecorationLine: 'line-through', color: '#94a3b8', fontSize: 11.5 }}>
                            {formatMoney(serviceCharge || 1800)}
                          </Text>
                          <Text style={{ color: '#059669', fontWeight: '700', fontSize: 11.5 }}>₹0 (AMC)</Text>
                        </View>
                      </View>
                      <View style={styles.claimRow}>
                        <Text style={styles.claimItemLabel}>Technician Labor:</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ textDecorationLine: 'line-through', color: '#94a3b8', fontSize: 11.5 }}>
                            {formatMoney(labourCharge || 1200)}
                          </Text>
                          <Text style={{ color: '#059669', fontWeight: '700', fontSize: 11.5 }}>₹0 (AMC)</Text>
                        </View>
                      </View>
                      {partsCharge > 0 && (
                        <View style={styles.claimRow}>
                          <Text style={styles.claimItemLabel}>Parts Covered under Allowance:</Text>
                          <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#0f172a' }}>{formatMoney(partsCharge)}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Contract Purchase Breakdown Box */}
                  {isContractPurchase && (
                    <View style={styles.claimBreakdownBox}>
                      <View style={styles.claimRow}>
                        <Text style={styles.claimItemLabel}>Annual Protection Tier:</Text>
                        <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#0f172a' }}>{tx.plan_name || 'Active AMC Plan'}</Text>
                      </View>
                      <View style={styles.claimRow}>
                        <Text style={styles.claimItemLabel}>Coverage Validity:</Text>
                        <Text style={{ fontSize: 11.5, fontWeight: '600', color: '#0f172a' }}>365 Days Protection</Text>
                      </View>
                      <View style={styles.claimRow}>
                        <Text style={styles.claimItemLabel}>Privileges:</Text>
                        <Text style={{ fontSize: 11.5, fontWeight: '600', color: '#059669' }}>Unlimited ₹0 Labor & Free Visits</Text>
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
      )}

      {/* Top-up Spare Parts Allowance Modal */}
      <Modal visible={showTopUpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.modalTitle}>Top Up Parts Allowance</Text>
              <TouchableOpacity onPress={() => setShowTopUpModal(false)} style={styles.modalCloseBtn}>
                <IconClose size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Add reserve allowance to cover genuine spare parts for future appliance repairs with 0 out-of-pocket hassle.
            </Text>

            <View style={styles.topUpPillsRow}>
              {[5000, 10000, 25000, 50000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.topUpPill, topUpAmount === amt && styles.topUpPillActive]}
                  onPress={() => setTopUpAmount(amt)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.topUpPillText, topUpAmount === amt && styles.topUpPillTextActive]}>
                    +{formatMoney(amt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.confirmTopUpBtn, isProcessingTopUp && { opacity: 0.7 }]}
              onPress={handleTopUpPartsAllowance}
              disabled={isProcessingTopUp}
              activeOpacity={0.88}
            >
              {isProcessingTopUp ? (
                <ActivityIndicator color="#0a192f" size="small" />
              ) : (
                <Text style={styles.confirmTopUpBtnText}>Confirm +{formatMoney(topUpAmount)} Allowance</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc', width: '100%' },
  scroll: {
    padding: 14,
    paddingBottom: 64,
    maxWidth: 580,
    alignSelf: 'center',
    width: '100%',
    boxSizing: 'border-box',
    gap: 14,
  },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    width: '100%',
    boxSizing: 'border-box',
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
  },
  headerTitle: {
    fontSize: 17.5,
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
    backgroundColor: '#0a192f',
    borderWidth: 1.2,
    borderColor: '#d4af37',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  successBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.2,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    boxSizing: 'border-box',
  },
  successBannerText: { color: '#15803d', fontWeight: '700', fontSize: 12.5, textAlign: 'center' },

  /* UrbanClap VIP Card */
  vipCard: {
    width: '100%',
    boxSizing: 'border-box',
  },
  vipCardInner: {
    width: '100%',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.8,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0a192f',
    boxShadow: '0 12px 30px rgba(10, 25, 47, 0.3), 0 0 16px rgba(212, 175, 55, 0.2)',
  },
  vipCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  chipGraphic: {
    width: 36,
    height: 26,
    borderRadius: 5,
    backgroundColor: '#d4af37',
    borderWidth: 1,
    borderColor: '#fef08a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipInnerLine: {
    width: 22,
    height: 13,
    borderWidth: 1,
    borderColor: '#78350f',
    borderRadius: 3,
  },
  vipTierPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vipTierPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'Inter, sans-serif',
  },
  vipCardPlanTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  contractCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    width: '100%',
  },
  contractCodeLabel: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contractCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '100%',
  },
  contractCodeVal: {
    fontSize: 11.5,
    color: '#0f172a',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  copyPillText: {
    fontSize: 10.5,
    color: '#334155',
    fontWeight: '600',
  },
  coveredPropertyRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.12)',
    width: '100%',
  },
  coveredPropertyLabel: {
    fontSize: 9.5,
    color: '#475569',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  coveredPropertyText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
    marginTop: 2,
  },
  daysLeftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  daysLeftPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
  },
  moneySection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.12)',
    width: '100%',
  },
  moneyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
    width: '100%',
  },
  moneyLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  moneyValText: {
    fontSize: 16.5,
    fontWeight: '800',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  moneyCapText: {
    fontSize: 13,
    fontWeight: '700',
  },
  moneyTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
    overflow: 'hidden',
    width: '100%',
  },
  moneyFill: {
    height: '100%',
    borderRadius: 4,
  },
  moneyStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    width: '100%',
  },
  validityExpiresMeta: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  validityStatus: { fontSize: 10.5, color: '#16a34a', fontWeight: '700' },

  /* Unprotected Card */
  unprotectedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 12,
    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
    width: '100%',
    boxSizing: 'border-box',
  },
  unprotectedLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, width: '100%' },
  unprotectedShieldWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0a192f',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  unprotectedTitle: { fontSize: 15.5, fontWeight: '800', color: '#0a192f' },
  unprotectedSub: { fontSize: 11.5, color: '#64748b', lineHeight: 16 },
  unprotectedBtn: {
    backgroundColor: '#0a192f',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  unprotectedBtnText: { color: '#fbbf24', fontWeight: '800', fontSize: 12.5 },

  /* Savings Guarantee Box */
  savingsBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.2,
    borderColor: '#bbf7d0',
    borderRadius: 16,
    padding: 12,
    width: '100%',
    boxSizing: 'border-box',
  },
  savingsBoxLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  savingsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  savingsBoxTitle: { fontSize: 13, fontWeight: '800', color: '#14532d' },
  savingsBoxSub: { fontSize: 11, color: '#166534', lineHeight: 15 },

  /* Tab Bar */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 3,
    gap: 4,
    width: '100%',
    boxSizing: 'border-box',
  },
  tabItem: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 11,
  },
  tabItemActive: {
    backgroundColor: '#0a192f',
    boxShadow: '0 2px 8px rgba(10, 25, 47, 0.18)',
  },
  tabItemText: { fontSize: 11.5, fontWeight: '700', color: '#64748b' },
  tabItemTextActive: { color: '#fbbf24' },

  tabContentCol: { gap: 12, width: '100%', boxSizing: 'border-box' },

  /* Perks Card */
  perksCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    gap: 13,
    width: '100%',
    boxSizing: 'border-box',
  },
  perksCardTitle: { fontSize: 14.5, fontWeight: '800', color: '#0a192f' },
  perkRow: { flexDirection: 'row', gap: 11, alignItems: 'flex-start', width: '100%' },
  perkIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  perkTitle: { fontSize: 12.5, fontWeight: '700', color: '#0f172a' },
  perkSub: { fontSize: 11, color: '#64748b', lineHeight: 15, marginTop: 2 },



  /* Claims Tab Styles */
  subFilterRow: { flexDirection: 'row', gap: 8, width: '100%' },
  subFilterPill: {
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  subFilterPillActive: { backgroundColor: '#0a192f', borderColor: '#d4af37' },
  subFilterText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  subFilterTextActive: { color: '#fbbf24' },

  emptyClaimsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 26,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    width: '100%',
    boxSizing: 'border-box',
  },
  emptyClaimsTitle: { fontSize: 14.5, fontWeight: '800', color: '#0a192f' },
  emptyClaimsSub: { fontSize: 11.5, color: '#64748b', textAlign: 'center', lineHeight: 16, maxWidth: 340 },

  claimCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    gap: 9,
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
  },
  claimCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: 8 },
  claimTitle: { fontSize: 13.5, fontWeight: '800', color: '#0f172a' },
  claimDate: { fontSize: 10.5, color: '#94a3b8', marginTop: 2 },
  claimStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
  },
  claimStatusActive: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  claimStatusCovered: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  claimStatusTopUp: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  claimStatusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },

  claimBreakdownBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 9,
    gap: 5,
    width: '100%',
    boxSizing: 'border-box',
  },
  claimRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  claimItemLabel: { fontSize: 11, color: '#64748b' },
  claimItemWaived: { fontSize: 11, color: '#94a3b8' },

  claimFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    width: '100%',
  },
  claimCoveredLabel: { fontSize: 11.5, fontWeight: '600', color: '#64748b' },
  claimCoveredVal: { fontSize: 13, fontWeight: '800', color: '#0a192f' },

  /* Top Up Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 20,
    width: '95%',
    maxWidth: 380,
    gap: 13,
    boxShadow: '0 20px 35px rgba(0, 0, 0, 0.25)',
    boxSizing: 'border-box',
  },
  modalTitle: { fontSize: 16.5, fontWeight: '800', color: '#0a192f' },
  modalCloseBtn: { padding: 4 },
  modalSub: { fontSize: 11.5, color: '#64748b', lineHeight: 16 },
  topUpPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  topUpPill: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  topUpPillActive: {
    backgroundColor: '#0a192f',
    borderColor: '#d4af37',
  },
  topUpPillText: { fontSize: 12.5, fontWeight: '700', color: '#0f172a' },
  topUpPillTextActive: { color: '#fbbf24' },
  confirmTopUpBtn: {
    backgroundColor: '#d4af37',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  confirmTopUpBtnText: { color: '#0a192f', fontWeight: '800', fontSize: 13 },
});
