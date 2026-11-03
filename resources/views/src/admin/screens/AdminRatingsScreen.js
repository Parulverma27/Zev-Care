import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
} from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import UserProfileModal from '../components/UserProfileModal';
import {
  getProviderRatingStats,
  getServiceRatingStats,
  getPerformanceTier,
  normalizeBookingReviews,
} from '../../utils/ratings';
import {
  PERFORMANCE_TIERS,
  PROVIDER_ATTRIBUTES,
  RESOLVED_OPTIONS,
} from '../../config/ratingConfig';
import { exportToCSV } from '../../utils/exportUtils';
import { AppIcon } from '../../components/AppIcons';
import {
  TrophyIcon,
  MedalIcon,
  AlertTriangleIcon,
  FlagIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  XIcon,
  PauseIcon,
  HourglassIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ToolsIcon,
  ProvidersIcon,
  ZapMiniIcon,
  RatingsIcon,
} from '../components/AdminIcons';

export default function AdminRatingsScreen() {
  const {
    bookings = [],
    users = [],
    providers = [],
    moderateReview,
    setProviderIncrementDecision,
  } = useApp() || {};

  const navigate = useNavigate();

  // Active Main Tab: 'services' | 'providers' | 'performance'
  const [activeTab, setActiveTab] = useState('performance');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [starFilter, setStarFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');

  // Modals
  const [modalUser, setModalUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);

  // Review Detail Modal
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewDetailOpen, setReviewDetailOpen] = useState(false);

  // Increment Appraisal Modal
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [appraisalModalOpen, setAppraisalModalOpen] = useState(false);
  const [incrementStatus, setIncrementStatus] = useState('APPROVED');
  const [incrementPct, setIncrementPct] = useState('15');
  const [incrementNotes, setIncrementNotes] = useState('');

  // Admin note modal for moderation
  const [adminNoteModalOpen, setAdminNoteModalOpen] = useState(false);
  const [moderationTarget, setModerationTarget] = useState({ bookingId: null, target: 'service' });
  const [adminNoteText, setAdminNoteText] = useState('');

  // Normalized bookings
  const normalizedBookings = useMemo(() => {
    return (bookings || []).map(normalizeBookingReviews);
  }, [bookings]);

  // Overall Service Stats
  const serviceStats = useMemo(() => {
    return getServiceRatingStats(null, normalizedBookings);
  }, [normalizedBookings]);

  // Filtered Service Reviews List
  const serviceReviewsList = useMemo(() => {
    let list = serviceStats.recentReviews || [];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.serviceName?.toLowerCase().includes(q) ||
          r.userName?.toLowerCase().includes(q) ||
          r.bookingId?.toLowerCase().includes(q)
      );
    }

    if (starFilter !== 'ALL') {
      const s = Number(starFilter);
      list = list.filter((r) => Math.round(r.rating) === s);
    }

    return list;
  }, [serviceStats.recentReviews, searchQuery, starFilter]);

  // Provider Stats Map & Leaderboard
  const providerLeaderboard = useMemo(() => {
    return (providers || []).map((p) => {
      const stats = getProviderRatingStats(p, normalizedBookings);
      const tier = getPerformanceTier(stats);
      return {
        provider: p,
        stats,
        tier,
      };
    }).sort((a, b) => {
      // Sort by avg rating then total reviews
      if (b.stats.averageRating !== a.stats.averageRating) {
        return b.stats.averageRating - a.stats.averageRating;
      }
      return b.stats.totalRatings - a.stats.totalRatings;
    });
  }, [providers, normalizedBookings]);

  // All Provider Reviews Flat List
  const allProviderReviews = useMemo(() => {
    const list = [];
    providerLeaderboard.forEach(({ provider, stats }) => {
      stats.recentReviews.forEach((rev) => {
        list.push({
          ...rev,
          providerId: provider.id,
          providerName: provider.name,
          providerTrade: provider.trade,
          providerAvatar: provider.avatar,
        });
      });
    });

    return list.sort((a, b) => {
      const ta = new Date(a.submittedAt || 0).getTime();
      const tb = new Date(b.submittedAt || 0).getTime();
      return tb - ta;
    });
  }, [providerLeaderboard]);

  // Filtered Provider Reviews
  const filteredProviderReviews = useMemo(() => {
    let list = allProviderReviews;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.providerName?.toLowerCase().includes(q) ||
          r.userName?.toLowerCase().includes(q) ||
          r.bookingId?.toLowerCase().includes(q)
      );
    }

    if (starFilter !== 'ALL') {
      const s = Number(starFilter);
      list = list.filter((r) => Math.round(r.rating) === s);
    }

    return list;
  }, [allProviderReviews, searchQuery, starFilter]);

  // Filtered Leaderboard
  const filteredLeaderboard = useMemo(() => {
    let list = providerLeaderboard;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (row) =>
          row.provider.name?.toLowerCase().includes(q) ||
          row.provider.phone?.includes(q) ||
          row.provider.trade?.toLowerCase().includes(q)
      );
    }

    if (tierFilter !== 'ALL') {
      list = list.filter((row) => row.tier.id === tierFilter);
    }

    return list;
  }, [providerLeaderboard, searchQuery, tierFilter]);

  // Handle Moderation actions
  const handleToggleHide = (bookingId, target, currentlyHidden) => {
    if (!moderateReview) return;
    moderateReview(bookingId, target, { hidden: !currentlyHidden });
  };

  const handleToggleFlag = (bookingId, target, currentlyFlagged) => {
    if (!moderateReview) return;
    moderateReview(bookingId, target, { flagged: !currentlyFlagged });
  };

  const openAdminNoteModal = (bookingId, target, currentNote = '') => {
    setModerationTarget({ bookingId, target });
    setAdminNoteText(currentNote || '');
    setAdminNoteModalOpen(true);
  };

  const saveAdminNote = () => {
    if (moderationTarget.bookingId && moderateReview) {
      moderateReview(moderationTarget.bookingId, moderationTarget.target, {
        admin_note: adminNoteText.trim(),
      });
    }
    setAdminNoteModalOpen(false);
  };

  // Open Appraisal Drawer
  const openAppraisal = (row) => {
    setSelectedProvider(row);
    const existingStatus = row.provider.increment_status || (row.tier.id === 'platinum' ? 'APPROVED' : 'UNDER_REVIEW');
    const existingPct = row.provider.current_increment != null ? String(row.provider.current_increment) : (row.tier.id === 'platinum' ? '15' : '10');
    setIncrementStatus(existingStatus);
    setIncrementPct(existingPct);
    setIncrementNotes('');
    setAppraisalModalOpen(true);
  };

  const saveAppraisal = () => {
    if (!selectedProvider || !setProviderIncrementDecision) return;
    setProviderIncrementDecision(selectedProvider.provider.id, {
      status: incrementStatus,
      incrementPercentage: Number(incrementPct) || 0,
      notes: incrementNotes.trim(),
      tier: selectedProvider.tier.label,
      reviewedBy: 'Admin Director',
      reviewedAt: new Date().toISOString(),
    });
    setAppraisalModalOpen(false);
  };

  // CSV Export
  const handleExportPerformance = () => {
    const columns = [
      { label: 'Partner ID', accessor: (r) => r.provider.id },
      { label: 'Partner Name', accessor: (r) => r.provider.name },
      { label: 'Trade Specialization', accessor: (r) => r.provider.trade || 'Technician' },
      { label: 'Average Rating', accessor: (r) => r.stats.averageRating },
      { label: 'Total Verified Reviews', accessor: (r) => r.stats.totalRatings },
      { label: 'Low Ratings (<=2*)', accessor: (r) => r.stats.lowRatingCount },
      { label: 'Performance Tier', accessor: (r) => r.tier.label },
      { label: 'Increment Recommendation', accessor: (r) => r.tier.incrementRecommendation },
      { label: 'Current Increment Status', accessor: (r) => r.provider.increment_status || 'PENDING_EVALUATION' },
      { label: 'Approved Hike %', accessor: (r) => (r.provider.current_increment ? `${r.provider.current_increment}%` : '0%') },
    ];
    exportToCSV('Zevota_Technician_Performance_Appraisal_Report', columns, providerLeaderboard);
  };

  const resolveUser = (userName, userPhone) => {
    const clean = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');
    const u = users.find((usr) => clean(usr.phone) === clean(userPhone) || usr.name === userName);
    return (
      u || {
        name: userName || 'Customer',
        phone: userPhone || '—',
        email: '',
        property_verification_status: 'PENDING',
      }
    );
  };

  const renderTierBadge = (tier) => {
    if (!tier) return null;
    let Icon = null;
    if (tier.id === 'platinum') Icon = TrophyIcon;
    else if (tier.id === 'gold' || tier.id === 'silver') Icon = MedalIcon;
    else if (tier.id === 'needs_review') Icon = AlertTriangleIcon;

    return (
      <View
        style={[
          styles.tierBadge,
          {
            backgroundColor: tier.bg,
            borderColor: tier.border,
          },
        ]}
      >
        {Icon && <Icon size={12} color={tier.color} />}
        <Text style={[styles.tierBadgeText, { color: tier.color }]}>{tier.badge || tier.label}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Ratings, Reviews & Performance</Text>
          <Text style={styles.subtitle}>
            Monitor customer satisfaction, dual review metrics, and appraise technician increment eligibility.
          </Text>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExportPerformance} activeOpacity={0.85}>
          <AppIcon name="download" size={14} color="#ffffff" />
          <Text style={styles.exportBtnText}>Export Appraisal CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Main Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'performance' && styles.tabBtnActive]}
          onPress={() => setActiveTab('performance')}
        >
          <View style={styles.tabBtnInner}>
            <TrophyIcon size={15} color={activeTab === 'performance' ? '#0f172a' : '#64748b'} />
            <Text style={[styles.tabBtnText, activeTab === 'performance' && styles.tabBtnTextActive]}>
              Partner Performance & Increments ({providerLeaderboard.length})
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'services' && styles.tabBtnActive]}
          onPress={() => setActiveTab('services')}
        >
          <View style={styles.tabBtnInner}>
            <ToolsIcon size={15} color={activeTab === 'services' ? '#0f172a' : '#64748b'} />
            <Text style={[styles.tabBtnText, activeTab === 'services' && styles.tabBtnTextActive]}>
              Service Reviews ({serviceStats.totalRatings})
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'providers' && styles.tabBtnActive]}
          onPress={() => setActiveTab('providers')}
        >
          <View style={styles.tabBtnInner}>
            <ProvidersIcon size={15} color={activeTab === 'providers' ? '#0f172a' : '#64748b'} />
            <Text style={[styles.tabBtnText, activeTab === 'providers' && styles.tabBtnTextActive]}>
              Technician Reviews ({allProviderReviews.length})
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* TAB 1: PARTNER PERFORMANCE & INCREMENTS */}
      {activeTab === 'performance' && (
        <View style={styles.tabContent}>
          {/* KPI Cards */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL ACTIVE TECHNICIANS</Text>
              <Text style={styles.kpiValue}>{providers.length}</Text>
              <Text style={styles.kpiFoot}>100% verified field force</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>PLATINUM TIER (ELIGIBLE FOR TOP HIKE)</Text>
              <Text style={[styles.kpiValue, { color: '#6d28d9' }]}>
                {providerLeaderboard.filter((r) => r.tier.id === 'platinum').length}
              </Text>
              <Text style={styles.kpiFoot}>Avg ≥ 4.8★ & ≥ 20 reviews</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>GOLD TIER (STANDARD HIKE)</Text>
              <Text style={[styles.kpiValue, { color: '#b45309' }]}>
                {providerLeaderboard.filter((r) => r.tier.id === 'gold').length}
              </Text>
              <Text style={styles.kpiFoot}>Avg ≥ 4.5★ & ≥ 10 reviews</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>AT-RISK / UNDER PIP</Text>
              <Text style={[styles.kpiValue, { color: '#dc2626' }]}>
                {providerLeaderboard.filter((r) => r.tier.id === 'needs_review').length}
              </Text>
              <Text style={styles.kpiFoot}>Low ratings or coaching needed</Text>
            </View>
          </View>

          {/* Leaderboard Filter Bar */}
          <View style={styles.filterBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search partner by name, trade or phone..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View style={styles.filterPills}>
              {[
                { id: 'ALL', label: 'All Tiers' },
                { id: 'platinum', label: 'Platinum', icon: TrophyIcon, iconColor: '#8b5cf6' },
                { id: 'gold', label: 'Gold', icon: MedalIcon, iconColor: '#f59e0b' },
                { id: 'silver', label: 'Silver', icon: MedalIcon, iconColor: '#64748b' },
                { id: 'needs_review', label: 'Needs Review', icon: AlertTriangleIcon, iconColor: '#ef4444' },
                { id: 'insufficient_data', label: 'Baseline' },
              ].map((tierItem) => {
                const isSelected = tierFilter === tierItem.id;
                const IconComponent = tierItem.icon;
                return (
                  <TouchableOpacity
                    key={tierItem.id}
                    style={[styles.pill, isSelected && styles.pillActive]}
                    onPress={() => setTierFilter(tierItem.id)}
                  >
                    <View style={styles.pillInner}>
                      {IconComponent && (
                        <IconComponent
                          size={13}
                          color={isSelected ? '#ffffff' : tierItem.iconColor || '#64748b'}
                        />
                      )}
                      <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                        {tierItem.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Performance Leaderboard Table */}
          <View style={styles.tableCard}>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { flex: 2 }]}>Field Partner</Text>
              <Text style={[styles.th, { flex: 1.2 }]}>Customer Rating</Text>
              <Text style={[styles.th, { flex: 1.4 }]}>30-Day Trend</Text>
              <Text style={[styles.th, { flex: 1.4 }]}>Performance Tier</Text>
              <Text style={[styles.th, { flex: 1.6 }]}>Increment Recommendation</Text>
              <Text style={[styles.th, { flex: 1.4 }]}>Appraisal Status</Text>
              <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>Actions</Text>
            </View>

            {filteredLeaderboard.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No technicians matching this filter criteria.</Text>
              </View>
            ) : (
              filteredLeaderboard.map((row) => {
                const { provider, stats, tier } = row;
                const status = provider.increment_status || 'PENDING_EVALUATION';
                const trendPositive = stats.trend30Days > 0;
                const trendNegative = stats.trend30Days < 0;

                return (
                  <View key={provider.id} style={styles.tableRow}>
                    {/* Partner Info */}
                    <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                      <Image
                        source={{
                          uri:
                            provider.avatar ||
                            'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150',
                        }}
                        style={styles.avatarMini}
                      />
                      <View style={{ minWidth: 0, flex: 1 }}>
                        <Text style={styles.provName}>{provider.name}</Text>
                        <Text style={styles.provSub} numberOfLines={1}>
                          {provider.trade || 'Specialist'} • {provider.phone}
                        </Text>
                      </View>
                    </View>

                    {/* Rating & Count */}
                    <View style={[styles.td, { flex: 1.2 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.starGold}>★</Text>
                        <Text style={styles.ratingVal}>
                          {stats.totalRatings > 0 ? stats.averageRating : '—'}
                        </Text>
                      </View>
                      <Text style={styles.subHint}>{stats.totalRatings} verified reviews</Text>
                    </View>

                    {/* Trend */}
                    <View style={[styles.td, { flex: 1.4 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {trendPositive ? (
                          <TrendingUpIcon size={14} color="#059669" />
                        ) : trendNegative ? (
                          <TrendingDownIcon size={14} color="#dc2626" />
                        ) : null}
                        <Text
                          style={[
                            styles.trendBadge,
                            trendPositive && styles.trendUp,
                            trendNegative && styles.trendDown,
                          ]}
                        >
                          {trendPositive
                            ? `+${stats.trend30Days}`
                            : trendNegative
                            ? `${stats.trend30Days}`
                            : '— Stable'}
                        </Text>
                      </View>
                      <Text style={styles.subHint}>
                        {stats.lowRatingCount > 0 ? `${stats.lowRatingCount} low ratings` : '0 low ratings'}
                      </Text>
                    </View>

                    {/* Tier Badge */}
                    <View style={[styles.td, { flex: 1.4 }]}>
                      {renderTierBadge(tier)}
                    </View>

                    {/* Recommendation */}
                    <View style={[styles.td, { flex: 1.6 }]}>
                      <Text style={styles.recText} numberOfLines={2}>
                        {tier.incrementRecommendation}
                      </Text>
                    </View>

                    {/* Increment Status */}
                    <View style={[styles.td, { flex: 1.4 }]}>
                      <View
                        style={[
                          styles.statusPill,
                          status === 'APPROVED' && styles.statusApproved,
                          status === 'ON_HOLD' && styles.statusHold,
                          status === 'REJECTED' && styles.statusRejected,
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {status === 'APPROVED' && <CheckIcon size={11} color="#065f46" />}
                          {status === 'ON_HOLD' && <PauseIcon size={10} color="#92400e" />}
                          {status === 'REJECTED' && <XIcon size={10} color="#991b1b" />}
                          <Text
                            style={[
                              styles.statusPillText,
                              status === 'APPROVED' && { color: '#065f46' },
                              status === 'ON_HOLD' && { color: '#92400e' },
                              status === 'REJECTED' && { color: '#991b1b' },
                            ]}
                          >
                            {status === 'APPROVED'
                              ? `Hike +${provider.current_increment || 15}%`
                              : status.replace(/_/g, ' ')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Action */}
                    <View style={[styles.td, { flex: 1.2, alignItems: 'flex-end' }]}>
                      <TouchableOpacity
                        style={styles.actionAppraiseBtn}
                        onPress={() => openAppraisal(row)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.actionAppraiseText}>Appraise →</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      )}

      {/* TAB 2: SERVICE REVIEWS */}
      {activeTab === 'services' && (
        <View style={styles.tabContent}>
          {/* KPI Cards */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>AVERAGE SERVICE SCORE</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <RatingsIcon size={20} color="#f59e0b" />
                <Text style={[styles.kpiValue, { marginBottom: 0 }]}>{serviceStats.averageRating || '—'}</Text>
              </View>
              <Text style={styles.kpiFoot}>Based on {serviceStats.totalRatings} completed services</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ISSUE RESOLUTION RATE</Text>
              <Text style={[styles.kpiValue, { color: '#059669' }]}>{serviceStats.resolvedPercent}%</Text>
              <Text style={styles.kpiFoot}>
                {serviceStats.resolvedCount} full • {serviceStats.partialCount} partial • {serviceStats.unresolvedCount} unresolved
              </Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>5-STAR EXCELLENCE</Text>
              <Text style={[styles.kpiValue, { color: '#d97706' }]}>
                {serviceStats.starPercents[5] || 0}%
              </Text>
              <Text style={styles.kpiFoot}>{serviceStats.starCounts[5]} perfect ratings</Text>
            </View>
          </View>

          {/* Filter Bar */}
          <View style={styles.filterBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Filter by customer, order ID or service title..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View style={styles.filterPills}>
              {['ALL', '5', '4', '3', '2', '1'].map((star) => (
                <TouchableOpacity
                  key={star}
                  style={[styles.pill, starFilter === star && styles.pillActive]}
                  onPress={() => setStarFilter(star)}
                >
                  <View style={styles.pillInner}>
                    <Text style={[styles.pillText, starFilter === star && styles.pillTextActive]}>
                      {star === 'ALL' ? 'All Stars' : star}
                    </Text>
                    {star !== 'ALL' && (
                      <RatingsIcon
                        size={11}
                        color={starFilter === star ? '#ffffff' : '#f59e0b'}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Service Reviews Table */}
          <View style={styles.tableCard}>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { flex: 1.4 }]}>Order ID / Date</Text>
              <Text style={[styles.th, { flex: 1.6 }]}>Customer</Text>
              <Text style={[styles.th, { flex: 2 }]}>Service Name</Text>
              <Text style={[styles.th, { flex: 1.2 }]}>Rating</Text>
              <Text style={[styles.th, { flex: 1.4 }]}>Issue Status</Text>
              <Text style={[styles.th, { flex: 2.5 }]}>Review & Aspects</Text>
              <Text style={[styles.th, { flex: 1.4, textAlign: 'right' }]}>Moderation</Text>
            </View>

            {serviceReviewsList.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No service reviews found matching this filter.</Text>
              </View>
            ) : (
              serviceReviewsList.map((rev) => {
                const isHidden = Boolean(rev.moderation?.hidden);
                const isFlagged = Boolean(rev.moderation?.flagged);
                const hasAdminNote = Boolean(rev.moderation?.admin_note);

                return (
                  <View key={rev.bookingId} style={[styles.tableRow, isHidden && styles.rowHidden]}>
                    <View style={[styles.td, { flex: 1.4 }]}>
                      <Text style={styles.bookingIdLink}>{rev.bookingId}</Text>
                      <Text style={styles.subHint}>{rev.submittedAt ? new Date(rev.submittedAt).toLocaleDateString() : '—'}</Text>
                    </View>

                    <View style={[styles.td, { flex: 1.6 }]}>
                      <TouchableOpacity
                        onPress={() => {
                          setModalUser(resolveUser(rev.userName, rev.userPhone));
                          setUserModalVisible(true);
                        }}
                      >
                        <Text style={styles.userNameLink}>{rev.userName || 'Customer'}</Text>
                        <Text style={styles.subHint}>{rev.userPhone || '—'}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.td, { flex: 2 }]}>
                      <Text style={styles.serviceNameText}>{rev.serviceName}</Text>
                    </View>

                    <View style={[styles.td, { flex: 1.2 }]}>
                      <Text style={styles.starGold}>{'★'.repeat(rev.rating)}</Text>
                      <Text style={styles.subHint}>{rev.rating}.0 / 5</Text>
                    </View>

                    <View style={[styles.td, { flex: 1.4 }]}>
                      <View
                        style={[
                          styles.resolutionPill,
                          rev.issueResolved === 'yes' && styles.resYes,
                          rev.issueResolved === 'partial' && styles.resPartial,
                          rev.issueResolved === 'no' && styles.resNo,
                        ]}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {rev.issueResolved === 'yes' ? (
                            <CheckIcon size={11} color="#065f46" />
                          ) : rev.issueResolved === 'partial' ? (
                            <ZapMiniIcon size={11} color="#92400e" />
                          ) : (
                            <XIcon size={11} color="#991b1b" />
                          )}
                          <Text
                            style={[
                              styles.resolutionPillText,
                              rev.issueResolved === 'yes' && { color: '#065f46' },
                              rev.issueResolved === 'partial' && { color: '#92400e' },
                              rev.issueResolved === 'no' && { color: '#991b1b' },
                            ]}
                          >
                            {rev.issueResolved === 'yes'
                              ? 'Resolved'
                              : rev.issueResolved === 'partial'
                              ? 'Partial'
                              : 'Unresolved'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={[styles.td, { flex: 2.5 }]}>
                      {rev.comment ? (
                        <Text style={styles.reviewCommentText}>“{rev.comment}”</Text>
                      ) : (
                        <Text style={styles.emptyComment}>No comment provided</Text>
                      )}

                      {Array.isArray(rev.aspects) && rev.aspects.length > 0 && (
                        <View style={styles.miniTagsWrap}>
                          {rev.aspects.slice(0, 3).map((a) => (
                            <View key={a} style={styles.miniTag}>
                              <Text style={styles.miniTagText}>{a}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {hasAdminNote ? (
                        <View style={styles.adminNotePill}>
                          <Text style={styles.adminNotePillText}>Admin note: {rev.moderation.admin_note}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Moderation Controls */}
                    <View style={[styles.td, { flex: 1.4, alignItems: 'flex-end', gap: 6 }]}>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <TouchableOpacity
                          style={[styles.modBtn, isFlagged && styles.modBtnFlagged]}
                          onPress={() => handleToggleFlag(rev.bookingId, 'service', isFlagged)}
                          title="Flag Review"
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <FlagIcon
                              size={12}
                              color={isFlagged ? '#dc2626' : '#64748b'}
                              fill={isFlagged ? '#dc2626' : 'none'}
                            />
                            <Text style={[styles.modBtnText, isFlagged && { color: '#dc2626' }]}>
                              {isFlagged ? 'Flagged' : 'Flag'}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.modBtn, isHidden && styles.modBtnHidden]}
                          onPress={() => handleToggleHide(rev.bookingId, 'service', isHidden)}
                          title="Hide/Exclude"
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            {isHidden ? (
                              <EyeIcon size={12} color="#dc2626" />
                            ) : (
                              <EyeOffIcon size={12} color="#64748b" />
                            )}
                            <Text style={[styles.modBtnText, isHidden && { color: '#dc2626' }]}>
                              {isHidden ? 'Unhide' : 'Hide'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.noteActionBtn}
                        onPress={() => openAdminNoteModal(rev.bookingId, 'service', rev.moderation?.admin_note)}
                      >
                        <Text style={styles.noteActionText}>+ Note</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      )}

      {/* TAB 3: TECHNICIAN REVIEWS */}
      {activeTab === 'providers' && (
        <View style={styles.tabContent}>
          {/* Filter Bar */}
          <View style={styles.filterBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Filter by technician name, trade, customer or order ID..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <View style={styles.filterPills}>
              {['ALL', '5', '4', '3', '2', '1'].map((star) => (
                <TouchableOpacity
                  key={star}
                  style={[styles.pill, starFilter === star && styles.pillActive]}
                  onPress={() => setStarFilter(star)}
                >
                  <View style={styles.pillInner}>
                    <Text style={[styles.pillText, starFilter === star && styles.pillTextActive]}>
                      {star === 'ALL' ? 'All Stars' : star}
                    </Text>
                    {star !== 'ALL' && (
                      <RatingsIcon
                        size={11}
                        color={starFilter === star ? '#ffffff' : '#f59e0b'}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Provider Reviews Table */}
          <View style={styles.tableCard}>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { flex: 2 }]}>Field Technician</Text>
              <Text style={[styles.th, { flex: 1.4 }]}>Order / Customer</Text>
              <Text style={[styles.th, { flex: 1.2 }]}>Overall ★</Text>
              <Text style={[styles.th, { flex: 2.2 }]}>Attribute Ratings Breakdown</Text>
              <Text style={[styles.th, { flex: 2 }]}>Compliments & Notes</Text>
              <Text style={[styles.th, { flex: 1.4, textAlign: 'right' }]}>Moderation</Text>
            </View>

            {filteredProviderReviews.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No technician evaluations found.</Text>
              </View>
            ) : (
              filteredProviderReviews.map((rev, idx) => {
                const isHidden = Boolean(rev.moderation?.hidden);
                const isFlagged = Boolean(rev.moderation?.flagged);
                const hasAdminNote = Boolean(rev.moderation?.admin_note);

                return (
                  <View key={`${rev.bookingId}-${idx}`} style={[styles.tableRow, isHidden && styles.rowHidden]}>
                    {/* Tech details */}
                    <View style={[styles.td, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                      <Image
                        source={{
                          uri:
                            rev.providerAvatar ||
                            'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150',
                        }}
                        style={styles.avatarMini}
                      />
                      <View style={{ minWidth: 0, flex: 1 }}>
                        <Text style={styles.provName}>{rev.providerName}</Text>
                        <Text style={styles.provSub} numberOfLines={1}>
                          {rev.providerTrade || 'Specialist'}
                        </Text>
                      </View>
                    </View>

                    {/* Order / Customer */}
                    <View style={[styles.td, { flex: 1.4 }]}>
                      <Text style={styles.bookingIdLink}>{rev.bookingId}</Text>
                      <Text style={styles.userNameLink}>{rev.userName}</Text>
                    </View>

                    {/* Overall Rating */}
                    <View style={[styles.td, { flex: 1.2 }]}>
                      <Text style={styles.starGold}>{'★'.repeat(rev.rating)}</Text>
                      <Text style={styles.subHint}>{rev.rating}.0 / 5</Text>
                    </View>

                    {/* Attributes */}
                    <View style={[styles.td, { flex: 2.2 }]}>
                      <View style={styles.attrMiniGrid}>
                        {PROVIDER_ATTRIBUTES.map((a) => {
                          const val = rev.attributes?.[a.key] || rev.rating || 5;
                          return (
                            <View key={a.key} style={styles.attrMiniRow}>
                              <Text style={styles.attrMiniLabel}>{a.label.slice(0, 14)}:</Text>
                              <Text style={styles.attrMiniStars}>{'★'.repeat(val)}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Compliments & Comment */}
                    <View style={[styles.td, { flex: 2 }]}>
                      {Array.isArray(rev.compliments) && rev.compliments.length > 0 && (
                        <View style={styles.miniTagsWrap}>
                          {rev.compliments.map((c) => (
                            <View key={c} style={[styles.miniTag, { backgroundColor: '#f5f3ff', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                              <CheckIcon size={10} color="#6d28d9" />
                              <Text style={[styles.miniTagText, { color: '#6d28d9' }]}>{c}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {rev.comment ? (
                        <Text style={styles.reviewCommentText}>“{rev.comment}”</Text>
                      ) : null}

                      {hasAdminNote ? (
                        <View style={styles.adminNotePill}>
                          <Text style={styles.adminNotePillText}>Admin note: {rev.moderation.admin_note}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Moderation */}
                    <View style={[styles.td, { flex: 1.4, alignItems: 'flex-end', gap: 6 }]}>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <TouchableOpacity
                          style={[styles.modBtn, isFlagged && styles.modBtnFlagged]}
                          onPress={() => handleToggleFlag(rev.bookingId, 'provider', isFlagged)}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <FlagIcon
                              size={12}
                              color={isFlagged ? '#dc2626' : '#64748b'}
                              fill={isFlagged ? '#dc2626' : 'none'}
                            />
                            <Text style={[styles.modBtnText, isFlagged && { color: '#dc2626' }]}>
                              {isFlagged ? 'Flagged' : 'Flag'}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.modBtn, isHidden && styles.modBtnHidden]}
                          onPress={() => handleToggleHide(rev.bookingId, 'provider', isHidden)}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            {isHidden ? (
                              <EyeIcon size={12} color="#dc2626" />
                            ) : (
                              <EyeOffIcon size={12} color="#64748b" />
                            )}
                            <Text style={[styles.modBtnText, isHidden && { color: '#dc2626' }]}>
                              {isHidden ? 'Unhide' : 'Hide'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.noteActionBtn}
                        onPress={() => openAdminNoteModal(rev.bookingId, 'provider', rev.moderation?.admin_note)}
                      >
                        <Text style={styles.noteActionText}>+ Note</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      )}

      {/* MODAL 1: PARTNER INCREMENT & APPRAISAL DRAWER */}
      <Modal visible={appraisalModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.appraisalModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>PERFORMANCE & APPRAISAL APP</Text>
                <Text style={styles.modalTitle}>
                  {selectedProvider?.provider.name} — Increment Decision
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAppraisalModalOpen(false)} style={styles.modalCloseBtn}>
                <XIcon size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedProvider && (
              <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                {/* Stats Summary */}
                <View style={styles.appraisalStatsBox}>
                  <View style={styles.appraisalStatCol}>
                    <Text style={styles.appraisalStatVal}>★ {selectedProvider.stats.averageRating}</Text>
                    <Text style={styles.appraisalStatLbl}>Verified Rating</Text>
                  </View>
                  <View style={styles.appraisalStatDivider} />
                  <View style={styles.appraisalStatCol}>
                    <Text style={styles.appraisalStatVal}>{selectedProvider.stats.totalRatings}</Text>
                    <Text style={styles.appraisalStatLbl}>Evaluations</Text>
                  </View>
                  <View style={styles.appraisalStatDivider} />
                  <View style={styles.appraisalStatCol}>
                    {renderTierBadge(selectedProvider.tier)}
                    <Text style={styles.appraisalStatLbl}>Performance Tier</Text>
                  </View>
                </View>

                {/* Attribute Scores Breakdown */}
                <Text style={styles.formSectionTitle}>Technician Competency Scores</Text>
                <View style={styles.competencyBox}>
                  {PROVIDER_ATTRIBUTES.map((attr) => {
                    const score = selectedProvider.stats.attributeAverages[attr.key] || 0;
                    return (
                      <View key={attr.key} style={styles.competencyRow}>
                        <Text style={styles.competencyLabel}>{attr.label}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.competencyScore}>{score > 0 ? `${score}/5` : '—'}</Text>
                          <Text style={styles.starGold}>{'★'.repeat(Math.round(score))}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Appraisal Form */}
                <Text style={styles.formSectionTitle}>Appraisal Decision & Salary Increment</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Increment Decision Status</Text>
                  <View style={styles.statusSelectRow}>
                    {[
                      { id: 'APPROVED', label: 'Approved', icon: CheckIcon, iconColor: '#059669' },
                      { id: 'ON_HOLD', label: 'On Hold', icon: PauseIcon, iconColor: '#b45309' },
                      { id: 'REJECTED', label: 'Rejected', icon: XIcon, iconColor: '#dc2626' },
                      { id: 'UNDER_REVIEW', label: 'Review', icon: HourglassIcon, iconColor: '#2563eb' },
                    ].map((opt) => {
                      const IconC = opt.icon;
                      const isSel = incrementStatus === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.statusSelectBtn,
                            isSel && styles.statusSelectBtnActive,
                          ]}
                          onPress={() => setIncrementStatus(opt.id)}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <IconC size={12} color={isSel ? '#ffffff' : opt.iconColor} />
                            <Text
                              style={[
                                styles.statusSelectBtnText,
                                isSel && styles.statusSelectBtnTextActive,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Proposed Payout / Salary Increment (%)</Text>
                  <View style={styles.pctRow}>
                    {['0', '5', '10', '15', '20'].map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.pctPill, incrementPct === p && styles.pctPillActive]}
                        onPress={() => setIncrementPct(p)}
                      >
                        <Text style={[styles.pctPillText, incrementPct === p && styles.pctPillTextActive]}>
                          +{p}%
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TextInput
                      style={styles.pctInput}
                      value={incrementPct}
                      onChangeText={setIncrementPct}
                      keyboardType="numeric"
                      placeholder="Custom %"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Appraisal Justification / Executive Notes</Text>
                  <TextInput
                    style={styles.modalTextArea}
                    placeholder="Document justification for increment or improvement guidance..."
                    placeholderTextColor="#94a3b8"
                    value={incrementNotes}
                    onChangeText={setIncrementNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Prior History */}
                {Array.isArray(selectedProvider.provider.increment_history) &&
                  selectedProvider.provider.increment_history.length > 0 && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.formSectionTitle}>Appraisal History</Text>
                      {selectedProvider.provider.increment_history.map((h, i) => (
                        <View key={i} style={styles.historyItem}>
                          <Text style={styles.historyTitle}>
                            {h.status} (+{h.incrementPercentage}%) • {new Date(h.reviewedAt).toLocaleDateString()}
                          </Text>
                          {h.notes ? <Text style={styles.historyNotes}>“{h.notes}”</Text> : null}
                        </View>
                      ))}
                    </View>
                  )}
              </ScrollView>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setAppraisalModalOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={saveAppraisal} activeOpacity={0.88}>
                <Text style={styles.modalSubmitText}>Save Appraisal & Update Increment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ADMIN MODERATION NOTE */}
      <Modal visible={adminNoteModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.appraisalModal, { maxWidth: 440 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Admin Resolution Note</Text>
              <TouchableOpacity onPress={() => setAdminNoteModalOpen(false)} style={styles.modalCloseBtn}>
                <XIcon size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12.5, color: '#64748b', marginBottom: 10 }}>
              Add internal operational notes or audit explanations regarding this review.
            </Text>

            <TextInput
              style={[styles.modalTextArea, { minHeight: 90 }]}
              placeholder="e.g., Contacted customer directly; verified spare part bill and resolved dispute."
              placeholderTextColor="#94a3b8"
              value={adminNoteText}
              onChangeText={setAdminNoteText}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setAdminNoteModalOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={saveAdminNote}>
                <Text style={styles.modalSubmitText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Customer User Profile Modal */}
      {userModalVisible && modalUser && (
        <UserProfileModal
          visible={userModalVisible}
          user={modalUser}
          onClose={() => {
            setUserModalVisible(false);
            setModalUser(null);
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 24,
    paddingBottom: 64,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  exportBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  tabBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabBtnActive: {
    borderBottomColor: '#0f172a',
  },
  tabBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  tabContent: {
    gap: 20,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: '#64748b',
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  kpiFoot: {
    fontSize: 11.5,
    color: '#94a3b8',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  filterPills: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  pillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  th: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowHidden: {
    backgroundColor: '#fef2f2',
    opacity: 0.6,
  },
  td: {
    paddingRight: 8,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  provName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  provSub: {
    fontSize: 11,
    color: '#64748b',
  },
  starGold: {
    color: '#f59e0b',
    fontSize: 13,
    letterSpacing: 1,
  },
  ratingVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  subHint: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 2,
  },
  trendBadge: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
  },
  trendUp: {
    color: '#059669',
  },
  trendDown: {
    color: '#dc2626',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  recText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600',
    lineHeight: 16,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignSelf: 'flex-start',
  },
  statusApproved: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  statusHold: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  statusRejected: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
  },
  actionAppraiseBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionAppraiseText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  emptyWrap: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  bookingIdLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  userNameLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  serviceNameText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0f172a',
  },
  resolutionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  resYes: {
    backgroundColor: '#ecfdf5',
  },
  resPartial: {
    backgroundColor: '#fffbeb',
  },
  resNo: {
    backgroundColor: '#fef2f2',
  },
  resolutionPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  reviewCommentText: {
    fontSize: 12,
    color: '#334155',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  emptyComment: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  miniTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  miniTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniTagText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  adminNotePill: {
    backgroundColor: '#fffbeb',
    borderRadius: 6,
    padding: 4,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  adminNotePillText: {
    fontSize: 10.5,
    color: '#b45309',
    fontWeight: '600',
  },
  modBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modBtnFlagged: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  modBtnHidden: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  modBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  noteActionBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  noteActionText: {
    fontSize: 10.5,
    color: '#2563eb',
    fontWeight: '700',
  },
  attrMiniGrid: {
    gap: 2,
  },
  attrMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attrMiniLabel: {
    fontSize: 10.5,
    color: '#64748b',
  },
  attrMiniStars: {
    fontSize: 10,
    color: '#f59e0b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  appraisalModal: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalEyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#64748b',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '800',
  },
  appraisalStatsBox: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  appraisalStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  appraisalStatVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  appraisalStatLbl: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },
  appraisalStatDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  formSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    marginTop: 8,
  },
  competencyBox: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 14,
  },
  competencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  competencyLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  competencyScore: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  statusSelectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statusSelectBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  statusSelectBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  statusSelectBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  pctRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pctPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pctPillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  pctPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  pctPillTextActive: {
    color: '#ffffff',
  },
  pctInput: {
    flex: 1,
    maxWidth: 90,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    textAlign: 'center',
  },
  modalTextArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    fontSize: 12.5,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  historyItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  historyTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  historyNotes: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 14,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  modalSubmitBtn: {
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
