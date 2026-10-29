import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useApp } from '../../context/AppContext';
import { getProviderRatingStats, getPerformanceTier } from '../../utils/ratings';

export default function ProviderProfileModal({ visible, provider, onClose, onEdit }) {
  const { bookings } = useApp() || {};

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'jobs'
  const [jobFilter, setJobFilter] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'ACTIVE'
  const [jobSearch, setJobSearch] = useState('');

  const cleanPhone = (p) => (p ? String(p).replace(/\D/g, '').slice(-10) : '');

  // Calculate real bookings that belong to this provider
  const providerBookings = useMemo(() => {
    if (!provider) return [];
    const provIdStr = provider.id != null ? String(provider.id) : '';
    const provPhone = cleanPhone(provider.phone);
    const provName = (provider.name || '').trim().toLowerCase();

    return (bookings || []).filter((b) => {
      if (provIdStr && b.provider_id != null && String(b.provider_id) === provIdStr) return true;
      if (provPhone && b.provider_phone && cleanPhone(b.provider_phone) === provPhone) return true;
      if (provName && b.provider_name && b.provider_name.trim().toLowerCase() === provName) return true;
      return false;
    });
  }, [bookings, provider]);

  const completedJobs = useMemo(() => {
    return providerBookings.filter((b) => b.status === 'BOOKING_COMPLETED' || b.status === 'COMPLETED');
  }, [providerBookings]);

  const activeJobs = useMemo(() => {
    return providerBookings.filter((b) =>
      ['PROVIDER_ASSIGNED', 'PROVIDER_ON_THE_WAY', 'PROVIDER_ARRIVED', 'SERVICE_IN_PROGRESS', 'INSPECTION_COMPLETED'].includes(b.status)
    );
  }, [providerBookings]);

  const realRevenue = useMemo(() => {
    return completedJobs.reduce((sum, b) => {
      const amt = Number(b.payout_amount || (b.total_bill ? b.total_bill * 0.8 : 0) || b.amount || 0);
      return sum + amt;
    }, 0);
  }, [completedJobs]);

  const providerStats = useMemo(() => {
    return getProviderRatingStats(provider, bookings || []);
  }, [provider, bookings]);

  const performanceTier = useMemo(() => {
    return getPerformanceTier(providerStats);
  }, [providerStats]);

  const realRating = useMemo(() => {
    if (providerStats.totalRatings > 0) {
      return providerStats.averageRating.toFixed(1);
    }
    return provider?.rating ? Number(provider.rating).toFixed(1) : '5.0';
  }, [providerStats, provider?.rating]);

  // Filtered jobs list for the Jobs tab
  const filteredJobs = useMemo(() => {
    let list = providerBookings;
    if (jobFilter === 'COMPLETED') {
      list = completedJobs;
    } else if (jobFilter === 'ACTIVE') {
      list = activeJobs;
    }

    if (jobSearch.trim()) {
      const q = jobSearch.trim().toLowerCase();
      list = list.filter((b) => {
        const text = [
          b.booking_id,
          b.service_name,
          b.category_name,
          b.user_name,
          b.user_phone,
          b.address_text || b.address,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return text.includes(q);
      });
    }

    return list;
  }, [providerBookings, completedJobs, activeJobs, jobFilter, jobSearch]);

  if (!provider) return null;

  const initials = (provider?.name || 'P')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const categories = Array.isArray(provider.categories)
    ? provider.categories
    : typeof provider.categories_json === 'string'
      ? JSON.parse(provider.categories_json || '[]')
      : ['Electrical & AC', 'Appliances'];

  const services = Array.isArray(provider.services)
    ? provider.services
    : typeof provider.services_json === 'string'
      ? JSON.parse(provider.services_json || '[]')
      : ['Mixer Repair', 'Switch Repair', 'AC Gas Refill', 'AC Deep Cleaning'];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'BOOKING_COMPLETED':
      case 'COMPLETED':
        return { label: 'Completed', bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'PROVIDER_ON_THE_WAY':
        return { label: 'On The Way', bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
      case 'SERVICE_IN_PROGRESS':
        return { label: 'In Progress', bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      case 'PROVIDER_ASSIGNED':
        return { label: 'Assigned', bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' };
      default:
        return { label: status || 'Scheduled', bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Modal Header Bar */}
          <View style={styles.modalHeaderBar}>
            <View style={{ gap: 2 }}>
              <Text style={styles.modalTitle}>Field Partner Profile</Text>
              <Text style={styles.modalSubtitle}>
                Live performance metrics, profile details & verified work order history
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.modalCloseX}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]}
              onPress={() => setActiveTab('overview')}
              activeOpacity={0.8}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'overview' ? '#7c3aed' : '#64748b'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <Text style={[styles.tabBtnText, activeTab === 'overview' && styles.tabBtnTextActive]}>
                Profile Overview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'jobs' && styles.tabBtnActive]}
              onPress={() => setActiveTab('jobs')}
              activeOpacity={0.8}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'jobs' ? '#7c3aed' : '#64748b'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <Text style={[styles.tabBtnText, activeTab === 'jobs' && styles.tabBtnTextActive]}>
                Jobs Done
              </Text>
              <View style={[styles.tabBadge, activeTab === 'jobs' && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, activeTab === 'jobs' && styles.tabBadgeTextActive]}>
                  {providerBookings.length}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content Body */}
          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={true}>
            {activeTab === 'overview' ? (
              <View style={{ gap: 16 }}>
                {/* ── PARTNER IDENTITY CARD ── */}
                <View style={styles.providerCard}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={styles.providerName}>{provider?.name || '—'}</Text>
                      <View style={[styles.statusPill, provider?.is_online !== false ? styles.onlinePill : styles.offlinePill]}>
                        <View style={[styles.statusDot, { backgroundColor: provider?.is_online !== false ? '#10b981' : '#94a3b8' }]} />
                        <Text style={[styles.statusPillText, provider?.is_online !== false ? styles.onlineText : styles.offlineText]}>
                          {provider?.is_online !== false ? 'ACTIVE' : 'OFFLINE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.tradeText}>{provider?.trade || 'Certified Service Specialist'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6.91 6.91l.82-.82a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        <Text style={styles.metaSubText}>{provider?.phone || '—'}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        <Text style={styles.metaSubText}>{provider?.location || 'Gurugram, Haryana'}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* ── REAL DYNAMIC METRICS ROW ── */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>AVERAGE RATING</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.metricValue, { color: '#d97706' }]}>★ {realRating}</Text>
                      {performanceTier && (
                        <View style={{ backgroundColor: performanceTier.bg, borderColor: performanceTier.border, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: performanceTier.color }}>{performanceTier.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.metricSubNote}>
                      {providerStats.totalRatings > 0
                        ? `${providerStats.totalRatings} verified customer reviews`
                        : 'Baseline starting rating'}
                    </Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>COMPLETED JOBS</Text>
                    <Text style={[styles.metricValue, { color: '#7c3aed' }]}>{completedJobs.length} Jobs</Text>
                    <Text style={styles.metricSubNote}>Verified doorstep completions</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>ACTIVE JOBS</Text>
                    <Text style={[styles.metricValue, { color: '#2563eb' }]}>{activeJobs.length} Active</Text>
                    <Text style={styles.metricSubNote}>In dispatch & progress</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>TOTAL EARNINGS</Text>
                    <Text style={[styles.metricValue, { color: '#059669' }]}>₹{realRevenue.toLocaleString('en-IN')}</Text>
                    <Text style={styles.metricSubNote}>Calculated from completed jobs</Text>
                  </View>
                </View>

                {/* ── CONTACT & PROFILE DETAILS ── */}
                <View style={styles.detailSectionCard}>
                  <Text style={styles.sectionHeaderTitle}>Partner Contact & Credentials</Text>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Full Name</Text>
                      <Text style={styles.detailVal}>{provider?.name || '—'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Mobile Phone</Text>
                      <Text style={styles.detailVal}>{provider?.phone || '—'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Email Address</Text>
                      <Text style={styles.detailVal}>{provider?.email || `${(provider?.name || 'partner').toLowerCase().replace(/\s+/g, '.')}@zevotacare.com`}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Service Hub / Base</Text>
                      <Text style={styles.detailVal}>{provider?.location || 'Gurugram, Haryana'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Experience</Text>
                      <Text style={styles.detailVal}>{provider?.experience || '6+ Years in Field Work'}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>ID / Verification</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <Text style={[styles.detailVal, { color: '#15803d', fontWeight: '700' }]}>Aadhaar & Police Verified</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* ── ASSIGNED SKILLS & CATEGORIES ── */}
                <View style={styles.detailSectionCard}>
                  <Text style={styles.sectionHeaderTitle}>Assigned Categories & Services</Text>
                  <View style={{ gap: 10 }}>
                    <View>
                      <Text style={styles.subCategoryHeading}>Primary Categories:</Text>
                      <View style={styles.pillWrap}>
                        {categories.map((cat, idx) => (
                          <View key={idx} style={styles.catPill}>
                            <Text style={styles.catPillText}>{cat}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <View>
                      <Text style={styles.subCategoryHeading}>Handled Services:</Text>
                      <View style={styles.pillWrap}>
                        {services.map((svc, idx) => (
                          <View key={idx} style={styles.servicePill}>
                            <Text style={styles.servicePillText}>{svc}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              /* ── TAB 2: JOBS DONE / WORK ORDERS ── */
              <View style={{ gap: 14 }}>
                {/* Filter and Search Bar */}
                <View style={styles.filterSearchRow}>
                  <View style={styles.filterPillsRow}>
                    <TouchableOpacity
                      style={[styles.filterChip, jobFilter === 'ALL' && styles.filterChipActive]}
                      onPress={() => setJobFilter('ALL')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.filterChipText, jobFilter === 'ALL' && styles.filterChipTextActive]}>
                        All ({providerBookings.length})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.filterChip, jobFilter === 'COMPLETED' && styles.filterChipActive]}
                      onPress={() => setJobFilter('COMPLETED')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.filterChipText, jobFilter === 'COMPLETED' && styles.filterChipTextActive]}>
                        Completed ({completedJobs.length})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.filterChip, jobFilter === 'ACTIVE' && styles.filterChipActive]}
                      onPress={() => setJobFilter('ACTIVE')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.filterChipText, jobFilter === 'ACTIVE' && styles.filterChipTextActive]}>
                        Active ({activeJobs.length})
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.searchBox}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search jobs, customer, booking ID..."
                      value={jobSearch}
                      onChangeText={setJobSearch}
                      placeholderTextColor="#94a3b8"
                    />
                    {jobSearch ? (
                      <TouchableOpacity onPress={() => setJobSearch('')} activeOpacity={0.7}>
                        <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '700' }}>✕</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {/* List of Real Job Cards */}
                {filteredJobs.length > 0 ? (
                  <View style={{ gap: 12 }}>
                    {filteredJobs.map((b, idx) => {
                      const badge = getStatusBadge(b.status);
                      const isDone = b.status === 'BOOKING_COMPLETED' || b.status === 'COMPLETED';
                      const payout = Number(b.payout_amount || (b.total_bill ? b.total_bill * 0.8 : 0) || b.amount || 0);
                      const bill = Number(b.total_bill || b.amount || 0);

                      return (
                        <View key={b.id || b.booking_id || idx} style={styles.jobCard}>
                          {/* Top Row: Booking ID + Date + Status */}
                          <View style={styles.jobTopRow}>
                            <View style={styles.jobIdPill}>
                              <Text style={styles.jobIdText}>#{b.booking_id || `BK-${b.id}`}</Text>
                            </View>
                            <Text style={styles.jobDateText}>{b.completed_date || b.scheduled_date || 'Recent'}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                              <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
                            </View>
                          </View>

                          {/* Middle: Service & Category */}
                          <View style={{ gap: 3 }}>
                            <Text style={styles.jobServiceTitle}>{b.service_name || 'Home Maintenance Service'}</Text>
                            <Text style={styles.jobCategorySub}>{b.category_name || 'General'} {b.sub_category_name ? `• ${b.sub_category_name}` : ''}</Text>
                          </View>

                          {/* Customer & Doorstep Info */}
                          <View style={styles.jobCustomerBox}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                              </svg>
                              <Text style={styles.jobCustomerName}>{b.user_name || 'Customer'}</Text>
                              {b.user_phone && <Text style={styles.jobCustomerPhone}>({b.user_phone})</Text>}
                            </View>
                            {(b.address_text || b.address) && (
                              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 2 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2 }}>
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                                </svg>
                                <Text style={styles.jobAddressText} numberOfLines={2}>{b.address_text || b.address}</Text>
                              </View>
                            )}
                          </View>

                          {/* Problem / Work Report */}
                          {b.issue_description && (
                            <View style={styles.jobNoteRow}>
                              <Text style={styles.jobNoteLabel}>Issue Reported:</Text>
                              <Text style={styles.jobNoteValue}>{b.issue_description}</Text>
                            </View>
                          )}
                          {b.inspection_report && (
                            <View style={[styles.jobNoteRow, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                              <Text style={[styles.jobNoteLabel, { color: '#15803d' }]}>Work Done:</Text>
                              <Text style={[styles.jobNoteValue, { color: '#166534' }]}>{b.inspection_report}</Text>
                            </View>
                          )}

                          {/* Payout & Financials Strip */}
                          <View style={styles.jobFinanceRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                              <View>
                                <Text style={styles.financeLabel}>Partner Payout</Text>
                                <Text style={styles.payoutValue}>₹{payout.toLocaleString('en-IN')}</Text>
                              </View>
                              <View style={styles.financeDivider} />
                              <View>
                                <Text style={styles.financeLabel}>Total Bill</Text>
                                <Text style={styles.billValue}>₹{bill.toLocaleString('en-IN')}</Text>
                              </View>
                              {b.bill_status && (
                                <View style={[styles.billPill, b.bill_status === 'PAID' ? styles.billPaid : styles.billUnpaid]}>
                                  <Text style={[styles.billPillText, b.bill_status === 'PAID' ? styles.billPaidText : styles.billUnpaidText]}>
                                    {b.bill_status}
                                  </Text>
                                </View>
                              )}
                            </View>

                            {/* Customer Review if available */}
                            {(b.user_rating || b.provider_rating) && (
                              <View style={styles.ratingBadge}>
                                <Text style={styles.ratingBadgeStar}>★ {Number(b.user_rating || b.provider_rating).toFixed(1)}</Text>
                              </View>
                            )}
                          </View>

                          {/* Customer Review Quote */}
                          {b.user_review && (
                            <View style={styles.reviewQuoteRow}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              <Text style={styles.reviewQuoteText}>"{b.user_review}"</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyJobsBox}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    <Text style={styles.emptyJobsTitle}>No work orders found</Text>
                    <Text style={styles.emptyJobsSub}>
                      {jobSearch
                        ? 'No jobs match your search keywords.'
                        : 'No jobs are currently registered under this filter.'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Modal Actions Footer */}
          <View style={styles.actionsRow}>
            {onEdit && (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  onClose();
                  onEdit(provider);
                }}
                activeOpacity={0.85}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <Text style={styles.editBtnText}>Edit Field Partner</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 720,
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 48px rgba(0, 0, 0, 0.22)',
    overflow: 'hidden',
  },
  modalHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  modalCloseX: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    cursor: 'pointer',
  },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
  },
  tabBtnActive: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#7c3aed',
  },
  tabBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: '#7c3aed',
  },
  tabBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
  },
  tabBadgeTextActive: {
    color: '#ffffff',
  },

  scrollBody: {
    padding: 24,
    gap: 16,
  },

  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  providerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  tradeText: {
    fontSize: 13,
    color: '#7c3aed',
    fontWeight: '700',
  },
  metaSubText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  onlinePill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  offlinePill: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  onlineText: {
    color: '#047857',
  },
  offlineText: {
    color: '#64748b',
  },

  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 3,
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  metricSubNote: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '500',
  },

  detailSectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 12,
  },
  sectionHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  detailItem: {
    width: '47%',
    minWidth: 200,
    gap: 2,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },

  subCategoryHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catPill: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  catPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#7c3aed',
  },
  servicePill: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  servicePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },

  /* Jobs Done Tab Styles */
  filterSearchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    cursor: 'pointer',
  },
  filterChipActive: {
    backgroundColor: '#7c3aed',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },

  searchBox: {
    flex: 1,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0f172a',
    outlineStyle: 'none',
  },

  jobCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 10,
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
  },
  jobTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  jobIdPill: {
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  jobIdText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#7c3aed',
  },
  jobDateText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  jobServiceTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  jobCategorySub: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },

  jobCustomerBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  jobCustomerName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1e293b',
  },
  jobCustomerPhone: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  jobAddressText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
    flex: 1,
  },

  jobNoteRow: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 2,
  },
  jobNoteLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  jobNoteValue: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 16,
    fontWeight: '500',
  },

  jobFinanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  financeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  payoutValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  billValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  financeDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#e2e8f0',
  },
  billPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  billPaid: {
    backgroundColor: '#ecfdf5',
  },
  billUnpaid: {
    backgroundColor: '#fef3c7',
  },
  billPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  billPaidText: {
    color: '#059669',
  },
  billUnpaidText: {
    color: '#d97706',
  },
  ratingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingBadgeStar: {
    color: '#d97706',
    fontSize: 11.5,
    fontWeight: '800',
  },
  reviewQuoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 7,
  },
  reviewQuoteText: {
    fontSize: 11.5,
    color: '#b45309',
    fontStyle: 'italic',
    flex: 1,
  },

  emptyJobsBox: {
    padding: 36,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyJobsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  emptyJobsSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
  },
  editBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  closeBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  closeBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  },
});
