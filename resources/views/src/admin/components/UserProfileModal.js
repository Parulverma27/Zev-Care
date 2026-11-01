import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Platform, TextInput } from 'react-native';
import { useApp } from '../../context/AppContext';
import { getPlanTheme } from '../../config/planTheme';
import { normalizeSavedAddresses } from '../../utils/savedAddresses';
import { downloadInvoicePDF } from '../../utils/pdfInvoiceGenerator';
import { hasGeneratedBill } from '../../utils/billing';
import { getApplianceVideoUri, resolveApplianceImage } from '../../utils/applianceMediaHelper';
import AdminVideoPlayer from './AdminVideoPlayer';

const SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'plan', label: 'Plan' },
  { key: 'wallet', label: 'Wallet' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'appliances', label: 'Appliances' },
  { key: 'location', label: 'Location' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'video', label: 'Video' },
];

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const cleanPhone = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');

const formatDate = (iso) => {
  if (!iso || iso === 'Just now' || iso === 'Synced') return iso || '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

const formatDateTime = (iso) => {
  if (!iso || iso === 'Just now' || iso === 'Synced') return iso || '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const isCreditTx = (tx) =>
  tx?.type === 'PLAN_PURCHASE' || tx?.category === 'Plans' || tx?.type === 'WALLET_CREDIT';

const txBelongsToUser = (tx, user) => {
  if (!user || !tx) return false;
  if (tx.userId != null && tx.userId === user.id) return true;
  if (tx.user_id != null && tx.user_id === user.id) return true;
  if (tx.user_phone && cleanPhone(tx.user_phone) === cleanPhone(user.phone)) return true;
  return false;
};

export default function UserProfileModal({ visible, user, onClose }) {
  const {
    verifyPropertyVideo,
    getAppliancesForUser,
    reviewApplianceMedia,
    bookings,
    wallet,
    subscriptionPlans,
  } = useApp();

  const [section, setSection] = useState('overview');
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewAppliance, setPreviewAppliance] = useState(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [txFilter, setTxFilter] = useState('ALL');

  const appliances = useMemo(
    () => (user ? getAppliancesForUser(user) : []),
    [user, getAppliancesForUser]
  );

  const userVideo = useMemo(() => {
    if (!user) return null;
    const direct =
      user.property_video_url ||
      user.property_video ||
      user.propertyVideo ||
      user.videoUri ||
      user.property?.video_url ||
      user.property?.video ||
      user.property?.videoUri;
    if (typeof direct === 'string' && direct.trim() && !direct.includes('sample-video')) {
      return direct.trim();
    }
    const firstAppVideo = (appliances || []).map(getApplianceVideoUri).find(Boolean);
    if (firstAppVideo) return firstAppVideo;
    return null;
  }, [user, appliances]);

  const planMeta = useMemo(() => {
    if (!user?.subscription_plan) return null;
    return (subscriptionPlans || []).find((p) => p.name === user.subscription_plan) || null;
  }, [user?.subscription_plan, subscriptionPlans]);

  const planTheme = getPlanTheme(user?.subscription_plan);

  const userTransactions = useMemo(() => {
    if (!user) return [];
    return (wallet?.transactions || [])
      .filter((tx) => txBelongsToUser(tx, user))
      .sort((a, b) => {
        const ta = new Date(a.created_at || 0).getTime();
        const tb = new Date(b.created_at || 0).getTime();
        return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
      });
  }, [wallet?.transactions, user]);

  const filteredTxs = useMemo(() => {
    if (txFilter === 'PLANS') return userTransactions.filter(isCreditTx);
    if (txFilter === 'SERVICES') {
      return userTransactions.filter((tx) => tx.type === 'SERVICE_PAYMENT' || tx.category === 'Services');
    }
    return userTransactions;
  }, [userTransactions, txFilter]);

  const walletStats = useMemo(() => {
    const remaining = Number(user?.wallet_balance || 0);
    const original =
      user?.wallet_original_balance != null
        ? Number(user.wallet_original_balance)
        : planMeta?.wallet_credit != null
          ? Number(planMeta.wallet_credit)
          : userTransactions.filter(isCreditTx).reduce((s, tx) => s + Math.abs(Number(tx.amount || 0)), 0) ||
            remaining;
    const used = Math.max(0, original - remaining);
    const pct = original > 0 ? Math.min(100, Math.max(0, (remaining / original) * 100)) : 0;
    return { remaining, original, used, pct };
  }, [user, planMeta, userTransactions]);

  const userBookings = useMemo(() => {
    if (!user) return [];
    const targetPhone = cleanPhone(user.phone);
    return (bookings || []).filter((b) => {
      if (b.user_id != null && b.user_id === user.id) return true;
      if (b.user_phone && cleanPhone(b.user_phone) === targetPhone) return true;
      return false;
    });
  }, [bookings, user]);

  const filteredBookings = useMemo(() => {
    return userBookings.filter((b) => {
      if (historyStatusFilter === 'COMPLETED' && b.status !== 'BOOKING_COMPLETED') return false;
      if (
        historyStatusFilter === 'IN_PROGRESS' &&
        !['SERVICE_IN_PROGRESS', 'PROVIDER_ON_THE_WAY', 'PROVIDER_ARRIVED'].includes(b.status)
      ) {
        return false;
      }
      if (
        historyStatusFilter === 'PENDING' &&
        !['PENDING_ADMIN_REVIEW', 'AWAITING_USER_APPROVAL'].includes(b.status)
      ) {
        return false;
      }
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase().trim();
        const hay = [b.booking_id, b.service_name, b.category_name, b.provider_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [userBookings, historyStatusFilter, historySearch]);

  const mapAddress = useMemo(() => {
    if (!user) return '';
    const list = normalizeSavedAddresses(user.saved_addresses || []);
    const defaultAddr = list.find((a) => a.isDefault) || list[0];
    return (
      defaultAddr?.address ||
      user.property?.address ||
      user.address ||
      ''
    );
  }, [user]);

  const savedAddressList = useMemo(
    () => normalizeSavedAddresses(user?.saved_addresses || []),
    [user?.saved_addresses]
  );

  const mapCoords = useMemo(() => {
    if (!user) return null;
    const defaultAddr = savedAddressList.find((a) => a.isDefault) || savedAddressList[0];
    const lat = Number(defaultAddr?.latitude ?? user.property?.latitude ?? user.latitude);
    const lng = Number(defaultAddr?.longitude ?? user.property?.longitude ?? user.longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng };
    }
    return null;
  }, [user, savedAddressList]);

  const mapEmbedUrl = useMemo(() => {
    if (mapCoords) {
      return `https://maps.google.com/maps?q=${mapCoords.lat},${mapCoords.lng}&z=15&output=embed`;
    }
    if (mapAddress) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&z=15&output=embed`;
    }
    return null;
  }, [mapCoords, mapAddress]);

  if (!user) return null;

  const handleVerify = (status) => {
    if (user?.id) verifyPropertyVideo(user.id, status);
  };

  const handleApplianceReview = (applianceId, status) => {
    reviewApplianceMedia(applianceId, status);
    setPreviewAppliance(null);
  };

  const handleClose = () => {
    setIsPlaying(false);
    setPreviewAppliance(null);
    setSection('overview');
    onClose();
  };

  const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
  );

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderBar}>
                <View>
                  <Text style={styles.modalTitle}>Customer 360° Profile</Text>
                  <Text style={styles.modalSub}>Full account, plan, wallet, appliances, location & history</Text>
                </View>
                <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={styles.modalCloseX}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </TouchableOpacity>
              </View>

              {/* Identity */}
              <View style={styles.userIdentityCard}>
                <View style={styles.userAvatarCircle}>
                  <Text style={styles.userAvatarText}>
                    {(user?.name || 'U')
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.userIdentityName}>{user?.name || '—'}</Text>
                  <Text style={styles.userIdentitySub}>{user?.email || '—'}</Text>
                  <Text style={styles.userIdentitySub}>{user?.phone || '—'}</Text>
                </View>
                <View
                  style={[
                    styles.verificationBadge,
                    user?.property_verification_status === 'APPROVED'
                      ? styles.verifiedBadge
                      : styles.pendingBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.verificationBadgeText,
                      user?.property_verification_status === 'APPROVED'
                        ? { color: '#047857' }
                        : { color: '#b45309' },
                    ]}
                  >
                    {user?.property_verification_status || 'PENDING'}
                  </Text>
                </View>
              </View>

              {/* Quick stats */}
              <View style={styles.quickStats}>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatVal}>{user?.subscription_plan || 'None'}</Text>
                  <Text style={styles.quickStatLabel}>Plan</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={[styles.quickStatVal, { color: '#059669' }]}>
                    {money(walletStats.remaining)}
                  </Text>
                  <Text style={styles.quickStatLabel}>Wallet</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatVal}>{appliances.length}</Text>
                  <Text style={styles.quickStatLabel}>Appliances</Text>
                </View>
                <View style={styles.quickStat}>
                  <Text style={styles.quickStatVal}>{userBookings.length}</Text>
                  <Text style={styles.quickStatLabel}>Bookings</Text>
                </View>
              </View>

              {/* Section tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
                <View style={styles.tabsRow}>
                  {SECTIONS.map((s) => {
                    const active = section === s.key;
                    return (
                      <TouchableOpacity
                        key={s.key}
                        style={[styles.tab, active && styles.tabActive]}
                        onPress={() => setSection(s.key)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.tabTxt, active && styles.tabTxtActive]}>{s.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* ── OVERVIEW ── */}
              {section === 'overview' && (
                <View style={styles.panel}>
                  <Text style={styles.sectionTitle}>Basic details</Text>
                  <View style={styles.cardBox}>
                    <DetailRow label="Customer ID" value={user.id != null ? `#${user.id}` : '—'} />
                    <DetailRow label="Full name" value={user.name} />
                    <DetailRow label="Email" value={user.email} />
                    <DetailRow label="Phone" value={user.phone} />
                    <DetailRow label="Primary address" value={mapAddress || 'Not set'} />
                    <DetailRow
                      label="Property type"
                      value={user.property?.type || user.property_type || '—'}
                    />
                    <DetailRow label="Property name" value={user.property?.name || '—'} />
                    <DetailRow
                      label="House / Flat"
                      value={
                        [user.property?.houseNo, user.property?.floor, user.property?.bhk]
                          .filter(Boolean)
                          .join(' · ') || '—'
                      }
                    />
                    <DetailRow
                      label="Verification"
                      value={user.property_verification_status || 'PENDING'}
                    />
                    <DetailRow
                      label="Subscription status"
                      value={user.subscription_status || (user.subscription_plan ? 'ACTIVE' : 'NONE')}
                    />
                  </View>
                </View>
              )}

              {/* ── PLAN ── */}
              {section === 'plan' && (
                <View style={styles.panel}>
                  <Text style={styles.sectionTitle}>Subscription plan</Text>
                  {user.subscription_plan ? (
                    <View
                      style={[
                        styles.planCard,
                        {
                          borderColor: planTheme?.badgeBorder || '#e2e8f0',
                          backgroundColor: planTheme?.badgeBg || '#f8fafc',
                        },
                      ]}
                    >
                      <View style={styles.planCardTop}>
                        <Text style={[styles.planName, { color: planTheme?.badgeTextColor || '#0f172a' }]}>
                          {user.subscription_plan}
                        </Text>
                        <View style={styles.activePill}>
                          <Text style={styles.activePillTxt}>
                            {user.subscription_status || 'ACTIVE'}
                          </Text>
                        </View>
                      </View>
                      <DetailRow
                        label="Wallet credit on plan"
                        value={money(planMeta?.wallet_credit ?? user.wallet_original_balance)}
                      />
                      <DetailRow
                        label="Plan price"
                        value={planMeta?.price != null ? money(planMeta.price) : '—'}
                      />
                      <DetailRow
                        label="Validity"
                        value={
                          planMeta?.validity_months
                            ? `${planMeta.validity_months} months`
                            : '—'
                        }
                      />
                      <DetailRow
                        label="Started"
                        value={formatDate(user.subscription_started_at)}
                      />
                      <DetailRow
                        label="Expires on"
                        value={formatDate(user.subscription_expires_at)}
                      />
                      {Array.isArray(planMeta?.features) && planMeta.features.length > 0 && (
                        <View style={{ marginTop: 8, gap: 4 }}>
                          <Text style={styles.detailLabel}>Plan features</Text>
                          {planMeta.features.map((f, i) => (
                            <Text key={i} style={styles.featureLine}>
                              • {f}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.emptyInfoBox}>
                      <Text style={styles.emptyInfoText}>No subscription plan purchased yet.</Text>
                    </View>
                  )}
                </View>
              )}

              {/* ── WALLET ── */}
              {section === 'wallet' && (
                <View style={styles.panel}>
                  <Text style={styles.sectionTitle}>Care Wallet</Text>
                  <View style={styles.walletHero}>
                    <Text style={styles.walletHeroLabel}>Available balance</Text>
                    <Text style={styles.walletHeroAmt}>{money(walletStats.remaining)}</Text>
                    <View style={styles.walletStatRow}>
                      <View style={styles.walletStatCol}>
                        <Text style={styles.walletStatLabel}>Original</Text>
                        <Text style={styles.walletStatVal}>{money(walletStats.original)}</Text>
                      </View>
                      <View style={styles.walletStatCol}>
                        <Text style={styles.walletStatLabel}>Used</Text>
                        <Text style={styles.walletStatVal}>{money(walletStats.used)}</Text>
                      </View>
                      <View style={styles.walletStatCol}>
                        <Text style={styles.walletStatLabel}>Remaining</Text>
                        <Text style={styles.walletStatVal}>{money(walletStats.remaining)}</Text>
                      </View>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${walletStats.pct}%` }]} />
                    </View>
                    <Text style={styles.progressLabel}>{walletStats.pct.toFixed(1)}% remaining</Text>
                  </View>
                  <Text style={styles.hintTxt}>
                    Balance updates when the customer approves a service bill or purchases a plan.
                  </Text>
                </View>
              )}

              {/* ── TRANSACTIONS ── */}
              {section === 'transactions' && (
                <View style={styles.panel}>
                  <Text style={styles.sectionTitle}>
                    Transaction history ({userTransactions.length})
                  </Text>
                  <View style={styles.filterRow}>
                    {[
                      { key: 'ALL', label: 'All' },
                      { key: 'SERVICES', label: 'Services' },
                      { key: 'PLANS', label: 'Plans' },
                    ].map((t) => (
                      <TouchableOpacity
                        key={t.key}
                        style={[styles.miniTab, txFilter === t.key && styles.miniTabActive]}
                        onPress={() => setTxFilter(t.key)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[styles.miniTabTxt, txFilter === t.key && styles.miniTabTxtActive]}
                        >
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {filteredTxs.length === 0 ? (
                    <View style={styles.emptyInfoBox}>
                      <Text style={styles.emptyInfoText}>No wallet transactions for this user.</Text>
                    </View>
                  ) : (
                    filteredTxs.map((tx) => {
                      const credit = isCreditTx(tx);
                      return (
                        <View key={tx.transaction_id} style={styles.txCard}>
                          <View style={styles.txTop}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.txId}>{tx.transaction_id}</Text>
                              <Text style={styles.txDesc} numberOfLines={2}>
                                {tx.description || tx.service_name || tx.plan_name || tx.type}
                              </Text>
                              <Text style={styles.txTime}>{formatDateTime(tx.created_at)}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={[styles.txAmt, credit ? styles.txCredit : styles.txDebit]}>
                                {credit ? '+' : '-'}
                                {money(Math.abs(tx.amount || 0))}
                              </Text>
                              <Text style={styles.txBal}>
                                Bal: {money(tx.balance_after)}
                              </Text>
                              <View style={styles.txTypePill}>
                                <Text style={styles.txTypeTxt}>{tx.type}</Text>
                              </View>
                            </View>
                          </View>
                          {!credit && (Number(tx.service_charge) > 0 || Number(tx.parts_charge) > 0) && (
                            <View style={styles.txBreakdown}>
                              {Number(tx.service_charge) > 0 && (
                                <Text style={styles.chargeLine}>
                                  Service {money(tx.service_charge)}
                                </Text>
                              )}
                              {Number(tx.parts_charge) > 0 && (
                                <Text style={styles.chargeLine}>Parts {money(tx.parts_charge)}</Text>
                              )}
                              {Number(tx.labour_charge) > 0 && (
                                <Text style={styles.chargeLine}>
                                  Labour {money(tx.labour_charge)}
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              {/* ── APPLIANCES ── */}
              {section === 'appliances' && (
                <View style={styles.panel}>
                  <Text style={styles.sectionTitle}>
                    Registered appliances ({appliances.length})
                  </Text>
                  {appliances.length === 0 ? (
                    <View style={styles.emptyInfoBox}>
                      <Text style={styles.emptyInfoText}>No appliances registered yet.</Text>
                    </View>
                  ) : (
                    appliances.map((appliance) => {
                      const appVideo = getApplianceVideoUri(appliance);
                      const appPhoto = appliance.media?.type === 'photo'
                        ? appliance.media.url
                        : (appliance.uploadedPhotoUri || (typeof appliance.img === 'string' && !appVideo && !appliance.img.includes('sample-video') && (appliance.img.startsWith('data:image/') || appliance.img.startsWith('blob:') || appliance.img.startsWith('http')) && !appliance.img.includes('127.0.0.1:3000') ? appliance.img : null));
                      const catalogImg = resolveApplianceImage(appliance);
                      const isPendingReview = appliance.mediaStatus === 'PENDING_REVIEW';
                      const isApproved = appliance.mediaStatus === 'APPROVED';
                      const isRejected = appliance.mediaStatus === 'REJECTED';

                      return (
                        <View key={appliance.id} style={styles.applianceReviewCard}>
                          <View style={styles.applianceReviewHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.applianceReviewName}>{appliance.name}</Text>
                              <Text style={styles.applianceReviewMeta}>
                                {appliance.category || appliance.typeName || 'Appliance'}
                                {appliance.brand ? ` · ${appliance.brand}` : ''}
                                {appliance.location ? ` · ${appliance.location}` : ''}
                                {` · ${formatDate(appliance.createdAt || appliance.created_at)}`}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.statusPill,
                                isApproved
                                  ? styles.greenPill
                                  : isRejected
                                    ? { backgroundColor: '#fef2f2' }
                                    : isPendingReview
                                      ? styles.yellowPill
                                      : { backgroundColor: '#f1f5f9' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusPillText,
                                  isApproved
                                    ? styles.greenPillText
                                    : isRejected
                                      ? { color: '#dc2626' }
                                      : isPendingReview
                                        ? styles.yellowPillText
                                        : { color: '#64748b' },
                                ]}
                              >
                                {isApproved
                                  ? (appVideo ? 'VIDEO APPROVED' : 'MEDIA APPROVED')
                                  : isRejected
                                    ? (appVideo ? 'VIDEO REJECTED' : 'MEDIA REJECTED')
                                    : isPendingReview
                                      ? (appVideo ? 'VIDEO PENDING AUDIT' : 'MEDIA PENDING AUDIT')
                                      : (appVideo ? 'ORIGINAL VIDEO' : appPhoto ? 'PHOTO ATTACHED' : 'PLAN PROTECTED')}
                              </Text>
                            </View>
                          </View>

                          {appVideo ? (
                            <TouchableOpacity
                              style={styles.applianceMediaPreview}
                              onPress={() => setPreviewAppliance(appliance)}
                              activeOpacity={0.9}
                            >
                              {Platform.OS === 'web' ? (
                                <video
                                  src={appVideo}
                                  muted
                                  playsInline
                                  style={{
                                    width: '100%',
                                    height: 130,
                                    borderRadius: 10,
                                    objectFit: 'cover',
                                    backgroundColor: '#000000',
                                  }}
                                />
                              ) : (
                                <View style={styles.applianceMediaThumb}>
                                  <Text style={styles.videoLabel}>Original Video Attached</Text>
                                </View>
                              )}
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                <Text style={styles.mediaTapHint}>
                                  ▶ Original User Video · Tap to play
                                </Text>
                                <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#2563eb' }}>
                                  Original Recording
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ) : appPhoto ? (
                            <TouchableOpacity
                              style={styles.applianceMediaPreview}
                              onPress={() => setPreviewAppliance(appliance)}
                              activeOpacity={0.9}
                            >
                              <Image
                                source={{ uri: appPhoto }}
                                style={styles.applianceMediaThumb}
                                resizeMode="cover"
                              />
                              <Text style={styles.mediaTapHint}>
                                📷 Customer Photo · Tap to expand
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ffffff', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#f1f5f9' }}>
                              <Image
                                source={{ uri: catalogImg }}
                                style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: '#f8fafc' }}
                                resizeMode="contain"
                              />
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a' }}>
                                  Plan Registered Appliance
                                </Text>
                                <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                                  Active item under AMC protection · No customer video recorded yet
                                </Text>
                              </View>
                            </View>
                          )}

                          {(appVideo || appPhoto) && isPendingReview && (
                            <View style={styles.applianceReviewActions}>
                              <TouchableOpacity
                                style={[styles.approveBtn, { flex: 1, paddingVertical: 10 }]}
                                onPress={() => handleApplianceReview(appliance.id, 'APPROVED')}
                                activeOpacity={0.85}
                              >
                                <Text style={[styles.approveBtnText, { fontSize: 12 }]}>
                                  Approve Media
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.rejectBtn, { flex: 1, paddingVertical: 10 }]}
                                onPress={() => handleApplianceReview(appliance.id, 'REJECTED')}
                                activeOpacity={0.85}
                              >
                                <Text style={[styles.rejectBtnText, { fontSize: 12 }]}>
                                  Reject Media
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              {/* ── LOCATION / MAP ── */}
              {section === 'location' && (
                <View style={styles.panel}>
                  <Text style={styles.sectionTitle}>Map & addresses</Text>

                  {mapEmbedUrl && Platform.OS === 'web' ? (
                    <View style={styles.mapBox}>
                      <iframe
                        title="Customer location map"
                        src={mapEmbedUrl}
                        style={{ width: '100%', height: '100%', border: 0, borderRadius: 12 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </View>
                  ) : (
                    <View style={styles.emptyInfoBox}>
                      <Text style={styles.emptyInfoText}>
                        {mapAddress
                          ? `Address on file: ${mapAddress}`
                          : 'No address or coordinates available for map.'}
                      </Text>
                    </View>
                  )}

                  {mapAddress ? (
                    <View style={styles.cardBox}>
                      <DetailRow label="Pinned / default address" value={mapAddress} />
                      {mapCoords ? (
                        <DetailRow
                          label="Coordinates"
                          value={`${mapCoords.lat.toFixed(5)}, ${mapCoords.lng.toFixed(5)}`}
                        />
                      ) : null}
                    </View>
                  ) : null}

                  <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
                    Saved addresses ({savedAddressList.length})
                  </Text>
                  {savedAddressList.length === 0 ? (
                    <View style={styles.emptyInfoBox}>
                      <Text style={styles.emptyInfoText}>No saved addresses.</Text>
                    </View>
                  ) : (
                    savedAddressList.map((addr) => (
                      <View
                        key={addr.id}
                        style={[styles.addrRow, addr.isDefault && styles.addrRowDefault]}
                      >
                        <View style={styles.addrIconBox}>
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={addr.isDefault ? '#2563eb' : '#64748b'}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.addrTag}>{addr.tag || 'Home'}</Text>
                            {addr.isDefault && (
                              <View style={styles.defaultBadge}>
                                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.addrText}>{addr.address}</Text>
                          {addr.latitude != null && addr.longitude != null ? (
                            <Text style={styles.addrCoords}>
                              {Number(addr.latitude).toFixed(5)}, {Number(addr.longitude).toFixed(5)}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* ── BOOKINGS ── */}
              {section === 'bookings' && (
                <View style={styles.panel}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.sectionTitle}>
                      Service history ({userBookings.length})
                    </Text>
                    {userBookings.length > 0 && (
                      <View style={styles.countPill}>
                        <Text style={styles.countPillTxt}>
                          {userBookings.filter((b) => b.status === 'BOOKING_COMPLETED').length}{' '}
                          completed
                        </Text>
                      </View>
                    )}
                  </View>

                  {userBookings.length > 0 && (
                    <View style={{ gap: 10, marginTop: 4 }}>
                      <View style={styles.searchBox}>
                        <TextInput
                          style={{ flex: 1, fontSize: 12, color: '#0f172a', padding: 0, outlineStyle: 'none' }}
                          placeholder="Search by order, service, category, partner…"
                          placeholderTextColor="#94a3b8"
                          value={historySearch}
                          onChangeText={setHistorySearch}
                        />
                      </View>
                      <View style={styles.filterRow}>
                        {[
                          { key: 'ALL', label: `All (${userBookings.length})` },
                          { key: 'COMPLETED', label: 'Completed' },
                          { key: 'IN_PROGRESS', label: 'In Progress' },
                          { key: 'PENDING', label: 'Pending' },
                        ].map((tab) => (
                          <TouchableOpacity
                            key={tab.key}
                            style={[
                              styles.miniTab,
                              historyStatusFilter === tab.key && styles.miniTabActive,
                            ]}
                            onPress={() => setHistoryStatusFilter(tab.key)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.miniTabTxt,
                                historyStatusFilter === tab.key && styles.miniTabTxtActive,
                              ]}
                            >
                              {tab.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {filteredBookings.length === 0 ? (
                    <View style={styles.emptyInfoBox}>
                      <Text style={styles.emptyInfoText}>
                        {userBookings.length === 0
                          ? 'No service bookings for this customer.'
                          : 'No orders match this filter.'}
                      </Text>
                    </View>
                  ) : (
                    filteredBookings.map((bk) => {
                      const isDone = bk.status === 'BOOKING_COMPLETED';
                      const isPaid = bk.bill_status === 'PAID';
                      return (
                        <View key={bk.id || bk.booking_id} style={styles.bookingCard}>
                          <View style={styles.txTop}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.txId}>{bk.booking_id}</Text>
                              <View
                                style={[
                                  styles.statusPill,
                                  isDone ? styles.greenPill : styles.yellowPill,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.statusPillText,
                                    isDone ? styles.greenPillText : styles.yellowPillText,
                                  ]}
                                >
                                  {(bk.status || 'PENDING').replace(/_/g, ' ')}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.txTime}>
                              {bk.scheduled_date || bk.completed_date || 'Recent'}
                            </Text>
                          </View>
                          <Text style={styles.bookingSvc}>{bk.service_name || 'Service'}</Text>
                          <Text style={styles.applianceReviewMeta}>
                            {bk.category_name || 'General'}
                            {bk.provider_name ? ` · ${bk.provider_name}` : ' · Unassigned'}
                          </Text>
                          <View style={styles.bookingAmtRow}>
                            {hasGeneratedBill(bk) ? (
                              <>
                                <Text style={styles.paidAmt}>
                                  {money(bk.total_bill ?? bk.wallet_deducted ?? 0)}
                                </Text>
                                <View
                                  style={[
                                    styles.statusPill,
                                    isPaid ? styles.greenPill : { backgroundColor: '#fef2f2' },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.statusPillText,
                                      isPaid ? styles.greenPillText : { color: '#dc2626' },
                                    ]}
                                  >
                                    {isPaid ? 'PAID' : 'UNPAID'}
                                  </Text>
                                </View>
                              </>
                            ) : (
                              <View style={[styles.statusPill, { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }]}>
                                <Text style={[styles.statusPillText, { color: '#1d4ed8' }]}>
                                  BILL PENDING INSPECTION
                                </Text>
                              </View>
                            )}
                          </View>
                          {bk.address_text ? (
                            <Text style={styles.addrText} numberOfLines={2}>
                              📍 {bk.address_text}
                            </Text>
                          ) : null}
                          {isPaid && (
                            <TouchableOpacity
                              style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0f9ff', borderColor: '#bae6fd', borderWidth: 1, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start' }}
                              onPress={() => downloadInvoicePDF(bk)}
                              activeOpacity={0.8}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284c7' }}>Download Bill</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              {/* ── VIDEO ── */}
              {section === 'video' && (
                <View style={styles.panel}>
                  <Text style={styles.sectionTitle}>Property walkthrough video</Text>
                  {userVideo ? (
                    <>
                      <View style={{ marginBottom: 16 }}>
                        <AdminVideoPlayer
                          src={userVideo}
                          label="Original Property Walkthrough Video"
                          autoPlay={false}
                        />
                      </View>
                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={styles.approveBtn}
                          onPress={() => handleVerify('APPROVED')}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.approveBtnText}>Approve Video Audit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleVerify('REJECTED')}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.rejectBtnText}>Reject & Re-upload</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <View style={styles.emptyInfoBox}>
                      <Text style={styles.emptyInfoText}>No property video uploaded yet by this customer.</Text>
                    </View>
                  )}
                </View>
              )}

              <TouchableOpacity style={styles.closeModalBtn} onPress={handleClose} activeOpacity={0.7}>
                <Text style={styles.closeModalBtnText}>Close profile</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={!!previewAppliance}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewAppliance(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 600 }]}>
            <Text style={styles.modalTitle}>{previewAppliance?.name}</Text>
            <Text style={styles.modalSub}>
              {previewAppliance?.category} · {previewAppliance?.location}
            </Text>
            {previewAppliance && (() => {
              const previewVideo = getApplianceVideoUri(previewAppliance);
              const previewPhoto = previewAppliance.media?.type === 'photo'
                ? previewAppliance.media.url
                : (previewAppliance.uploadedPhotoUri || (typeof previewAppliance.img === 'string' && !previewVideo && !previewAppliance.img.includes('sample-video') && (previewAppliance.img.startsWith('data:image/') || previewAppliance.img.startsWith('blob:') || previewAppliance.img.startsWith('http')) && !previewAppliance.img.includes('127.0.0.1:3000') ? previewAppliance.img : null));

              if (previewVideo) {
                return (
                  <AdminVideoPlayer
                    src={previewVideo}
                    label="Original Customer Appliance Recording"
                    autoPlay={true}
                  />
                );
              }
              if (previewPhoto) {
                return (
                  <Image
                    source={{ uri: previewPhoto }}
                    style={styles.fullMediaPreview}
                    resizeMode="contain"
                  />
                );
              }
              return (
                <View style={styles.emptyInfoBox}>
                  <Text style={styles.emptyInfoText}>No media uploaded for this appliance.</Text>
                </View>
              );
            })()}
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setPreviewAppliance(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.closeModalBtnText}>Close Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 720,
    gap: 14,
    boxShadow: '0 12px 36px rgba(0,0,0,0.15)',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  modalSub: { fontSize: 12.5, color: '#64748b', marginTop: 2 },
  modalHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalCloseX: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    cursor: 'pointer',
  },

  userIdentityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  userIdentityName: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  userIdentitySub: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  verificationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  verifiedBadge: { backgroundColor: '#ecfdf5' },
  pendingBadge: { backgroundColor: '#fef3c7' },
  verificationBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  quickStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickStat: {
    flexGrow: 1,
    minWidth: 100,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickStatVal: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  quickStatLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2, textTransform: 'uppercase' },

  tabsScroll: { maxHeight: 44 },
  tabsRow: { flexDirection: 'row', gap: 6, paddingVertical: 2 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    cursor: 'pointer',
  },
  tabActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  tabTxt: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  tabTxtActive: { color: '#ffffff' },

  panel: { gap: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', flex: 1 },
  detailValue: {
    fontSize: 12.5,
    color: '#0f172a',
    fontWeight: '700',
    flex: 1.4,
    textAlign: 'right',
  },

  planCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  planCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  planName: { fontSize: 20, fontWeight: '800' },
  activePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activePillTxt: { fontSize: 10, fontWeight: '800', color: '#15803d' },
  featureLine: { fontSize: 12.5, color: '#334155', lineHeight: 18 },

  walletHero: {
    backgroundImage: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%)',
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 18,
  },
  walletHeroLabel: { color: '#dbeafe', fontSize: 12, fontWeight: '600' },
  walletHeroAmt: { color: '#ffffff', fontSize: 32, fontWeight: '800', marginTop: 4 },
  walletStatRow: { flexDirection: 'row', marginTop: 14, gap: 8 },
  walletStatCol: { flex: 1 },
  walletStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  walletStatVal: { color: '#ffffff', fontSize: 13, fontWeight: '700', marginTop: 2 },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#93c5fd', borderRadius: 999 },
  progressLabel: { color: '#dbeafe', fontSize: 12, fontWeight: '600', marginTop: 8 },
  hintTxt: { fontSize: 12, color: '#64748b', lineHeight: 17 },

  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
  },
  miniTabActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  miniTabTxt: { fontSize: 11, fontWeight: '600', color: '#475569' },
  miniTabTxtActive: { color: '#ffffff' },

  txCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 8,
  },
  txTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  txId: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  txDesc: { fontSize: 13, fontWeight: '600', color: '#0f172a', marginTop: 2 },
  txTime: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  txAmt: { fontSize: 15, fontWeight: '800' },
  txCredit: { color: '#059669' },
  txDebit: { color: '#0f172a' },
  txBal: { fontSize: 11, color: '#64748b', marginTop: 2 },
  txTypePill: {
    marginTop: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txTypeTxt: { fontSize: 9, fontWeight: '700', color: '#475569', textTransform: 'uppercase' },
  txBreakdown: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    gap: 2,
  },
  chargeLine: { fontSize: 11, color: '#64748b' },

  mapBox: {
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#e2e8f0',
  },
  addrRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  addrRowDefault: { borderColor: '#bfdbfe', backgroundColor: '#f5f9ff' },
  addrIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrTag: { fontSize: 12, fontWeight: '800', color: '#334155', textTransform: 'uppercase' },
  defaultBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: { color: '#ffffff', fontSize: 8.5, fontWeight: '800' },
  addrText: { fontSize: 11.5, color: '#475569', marginTop: 2, lineHeight: 16 },
  addrCoords: { fontSize: 10, color: '#94a3b8', marginTop: 2 },

  emptyInfoBox: {
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyInfoText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },

  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  greenPill: { backgroundColor: '#ecfdf5' },
  yellowPill: { backgroundColor: '#fef3c7' },
  statusPillText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  greenPillText: { color: '#047857' },
  yellowPillText: { color: '#b45309' },

  applianceReviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 10,
  },
  applianceReviewHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  applianceReviewName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  applianceReviewMeta: { fontSize: 11.5, color: '#64748b', marginTop: 2 },
  applianceMediaPreview: { gap: 6 },
  applianceMediaThumb: { width: '100%', height: 120, borderRadius: 10, backgroundColor: '#0f172a' },
  mediaTapHint: { fontSize: 10.5, color: '#64748b' },
  noMediaText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
  applianceReviewActions: { flexDirection: 'row', gap: 10 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  countPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  countPillTxt: { fontSize: 10, fontWeight: '700', color: '#2563eb' },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 6,
  },
  bookingSvc: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  bookingAmtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paidAmt: { fontSize: 14, fontWeight: '800', color: '#15803d' },

  videoPlayerBox: {
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: { color: '#ffffff', fontSize: 20, marginLeft: 2 },
  videoLabel: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12 },
  approveBtn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  approveBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  closeModalBtn: { paddingVertical: 10, alignItems: 'center' },
  closeModalBtnText: { color: '#475569', fontWeight: '600', fontSize: 14 },
  fullMediaPreview: { width: '100%', height: 320, borderRadius: 12, backgroundColor: '#f1f5f9' },
});
