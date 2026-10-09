import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useApp } from '../../context/AppContext';
import { AppIcon } from '../../components/AppIcons';
import { exportToCSV } from '../../utils/exportUtils';

export default function AdminConsultationsScreen() {
  const { bookings, providers, assignProvider, generateBill } = useApp();

  const [tradeFilter, setTradeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);

  // Quote form state
  const [partsCharge, setPartsCharge] = useState('');
  const [labourCharge, setLabourCharge] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');

  // Filter only consultation bookings
  const consultationBookings = (bookings || []).filter(
    (b) => b.isConsultation || b.booking_mode === 'consultation'
  );

  // KPI calculations
  const totalCount = consultationBookings.length;
  const inProgressCount = consultationBookings.filter((b) =>
    ['PROVIDER_ON_THE_WAY', 'PROVIDER_ARRIVED', 'ISSUE_INSPECTED', 'SERVICE_IN_PROGRESS'].includes(b.status)
  ).length;
  const awaitingApprovalCount = consultationBookings.filter(
    (b) => b.status === 'AWAITING_USER_APPROVAL'
  ).length;
  const convertedCount = consultationBookings.filter(
    (b) => b.status === 'BOOKING_COMPLETED' || b.bill_status === 'PAID'
  ).length;
  const declinedCount = consultationBookings.filter(
    (b) => b.status === 'ESTIMATE_REJECTED' || b.bill_status === 'REJECTED'
  ).length;

  const conversionRate = totalCount > 0 ? Math.round((convertedCount / totalCount) * 100) : 0;

  // Filter list
  const filteredList = consultationBookings.filter((b) => {
    if (tradeFilter !== 'ALL') {
      const cat = (b.category_name || b.category || '').toLowerCase();
      if (!cat.includes(tradeFilter.toLowerCase())) return false;
    }
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'PENDING' && b.status !== 'PENDING_ADMIN_REVIEW' && b.status !== 'PENDING') return false;
      if (statusFilter === 'IN_PROGRESS' && !['PROVIDER_ASSIGNED', 'PROVIDER_ACCEPTED', 'PROVIDER_ON_THE_WAY', 'PROVIDER_ARRIVED', 'ISSUE_INSPECTED', 'SERVICE_IN_PROGRESS'].includes(b.status)) return false;
      if (statusFilter === 'QUOTE_READY' && b.status !== 'AWAITING_USER_APPROVAL') return false;
      if (statusFilter === 'CONVERTED' && b.status !== 'BOOKING_COMPLETED' && b.bill_status !== 'PAID') return false;
      if (statusFilter === 'DECLINED' && b.status !== 'ESTIMATE_REJECTED' && b.bill_status !== 'REJECTED') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (b.booking_id || '').toLowerCase().includes(q);
      const matchName = (b.user_name || '').toLowerCase().includes(q);
      const matchPhone = (b.user_phone || '').toLowerCase().includes(q);
      const matchService = (b.service_name || b.category_name || '').toLowerCase().includes(q);
      const matchAddr = (b.address_text || b.address || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchPhone && !matchService && !matchAddr) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const exportData = filteredList.map((b) => ({
      'Booking ID': b.booking_id,
      'Customer': b.user_name,
      'Phone': b.user_phone,
      'Category': b.category_name || b.category,
      'Service': b.service_name || b.service,
      'Scheduled': b.schedule || `${b.scheduled_date} ${b.scheduled_time}`,
      'Status': b.status,
      'Diagnostic Fee': '₹0 (Free)',
      'Parts Charge': b.parts_charge || 0,
      'Labour Charge': b.labour_charge || 0,
      'Total Bill': b.total_bill || 0,
      'Customer Decision': b.status === 'BOOKING_COMPLETED' || b.bill_status === 'PAID' ? 'Approved' : b.status === 'ESTIMATE_REJECTED' ? 'Declined' : 'Pending',
    }));
    exportToCSV(exportData, 'zevota_mechanic_consultations.csv');
  };

  const handleOpenDetail = (booking) => {
    setSelectedBooking(booking);
    setDetailModalVisible(true);
  };

  const handleOpenAssign = (booking) => {
    setSelectedBooking(booking);
    setAssignModalVisible(true);
  };

  const handleAssignProvider = (provId) => {
    if (!selectedBooking) return;
    if (typeof assignProvider === 'function') {
      assignProvider(selectedBooking.booking_id, provId);
    }
    setAssignModalVisible(false);
  };

  const handleOpenQuoteBuilder = (booking) => {
    setSelectedBooking(booking);
    setPartsCharge(booking?.parts_charge ? String(booking.parts_charge) : '');
    setLabourCharge(booking?.labour_charge ? String(booking.labour_charge) : '');
    setQuoteNotes(booking?.inspection_report || '');
    setQuoteModalVisible(true);
  };

  const handleSubmitQuote = () => {
    if (!selectedBooking) return;
    const parts = parseFloat(partsCharge) || 0;
    const labour = parseFloat(labourCharge) || 0;
    if (typeof generateBill === 'function') {
      generateBill(selectedBooking.booking_id, {
        service_charge: 0, // Always 0 for consultation
        parts_charge: parts,
        labour_charge: labour,
        discount_amount: 0,
        total_bill: parts + labour,
        notes: quoteNotes,
      });
    }
    setQuoteModalVisible(false);
  };

  const getStatusBadge = (b) => {
    if (b.status === 'BOOKING_COMPLETED' || b.bill_status === 'PAID') {
      return { label: 'REPAIR APPROVED', bg: '#dcfce7', color: '#15803d' };
    }
    if (b.status === 'ESTIMATE_REJECTED' || b.bill_status === 'REJECTED') {
      return { label: 'DECLINED (₹0)', bg: '#f1f5f9', color: '#64748b' };
    }
    if (b.status === 'AWAITING_USER_APPROVAL') {
      return { label: 'QUOTE PENDING', bg: '#fef3c7', color: '#b45309' };
    }
    if (['PROVIDER_ARRIVED', 'ISSUE_INSPECTED', 'SERVICE_IN_PROGRESS'].includes(b.status)) {
      return { label: 'ON-SITE DIAGNOSIS', bg: '#dbeafe', color: '#1d4ed8' };
    }
    if (b.status === 'PROVIDER_ASSIGNED' || b.status === 'PROVIDER_ACCEPTED') {
      return { label: 'DISPATCHED', bg: '#e0e7ff', color: '#4338ca' };
    }
    return { label: 'NEW REQUEST', bg: '#fef2f2', color: '#b91c1c' };
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={styles.title}>Mechanic Consultations & Diagnostics</Text>
            <View style={styles.freeHeaderTag}>
              <Text style={styles.freeHeaderTagText}>₹0 Free On-Site Inspection</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Monitor Urban Company-style consultation visits, diagnostic findings, upfront repair quotes & conversions.
          </Text>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV} activeOpacity={0.8}>
          <AppIcon name="download" size={14} color="#2563eb" />
          <Text style={styles.exportBtnText}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Cards Row */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>TOTAL REQUESTS</Text>
          <Text style={styles.kpiVal}>{totalCount}</Text>
          <Text style={styles.kpiSub}>All consultation bookings</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>ACTIVE INSPECTIONS</Text>
          <Text style={[styles.kpiVal, { color: '#2563eb' }]}>{inProgressCount}</Text>
          <Text style={styles.kpiSub}>Technician en-route / on site</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>AWAITING APPROVAL</Text>
          <Text style={[styles.kpiVal, { color: '#d97706' }]}>{awaitingApprovalCount}</Text>
          <Text style={styles.kpiSub}>Quotes sent to customer</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>CONVERTED REPAIRS</Text>
          <Text style={[styles.kpiVal, { color: '#16a34a' }]}>{convertedCount}</Text>
          <Text style={styles.kpiSub}>{conversionRate}% conversion rate</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>DECLINED (₹0)</Text>
          <Text style={[styles.kpiVal, { color: '#64748b' }]}>{declinedCount}</Text>
          <Text style={styles.kpiSub}>Diagnosis only, ₹0 charged</Text>
        </View>
      </View>

      {/* Filter Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <AppIcon name="search" size={14} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer, phone, booking ID, trade..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Trade Selector */}
        <View style={styles.filterPillsRow}>
          {['ALL', 'Electrical', 'Plumbing', 'AC', 'Appliance', 'Carpentry'].map((trade) => {
            const isActive = tradeFilter === trade;
            return (
              <TouchableOpacity
                key={trade}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setTradeFilter(trade)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {trade}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Consultations Table */}
      <ScrollView style={styles.tableScroll} showsVerticalScrollIndicator={false}>
        {filteredList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 24 }}>🔍</Text>
            <Text style={styles.emptyStateTitle}>No Consultation Orders Found</Text>
            <Text style={styles.emptyStateSub}>Try adjusting your trade filters or search keywords.</Text>
          </View>
        ) : (
          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { width: 140 }]}>BOOKING ID</Text>
              <Text style={[styles.th, { width: 160 }]}>CUSTOMER</Text>
              <Text style={[styles.th, { width: 140 }]}>TRADE & ISSUE</Text>
              <Text style={[styles.th, { width: 150 }]}>SCHEDULE</Text>
              <Text style={[styles.th, { width: 150 }]}>TECHNICIAN</Text>
              <Text style={[styles.th, { width: 140 }]}>STAGE</Text>
              <Text style={[styles.th, { width: 110 }]}>QUOTE</Text>
              <Text style={[styles.th, { width: 120, textAlign: 'right' }]}>ACTIONS</Text>
            </View>

            {filteredList.map((item) => {
              const badge = getStatusBadge(item);
              const assignedProv = (providers || []).find((p) => p.id === item.provider_id) || null;
              const hasQuote = item.total_bill != null || item.bill_status != null;

              return (
                <View key={item.booking_id} style={styles.tableRow}>
                  {/* ID */}
                  <View style={{ width: 140, gap: 4 }}>
                    <Text style={styles.bookingIdText}>{item.booking_id}</Text>
                    <View style={styles.zeroTag}>
                      <Text style={styles.zeroTagText}>₹0 Diagnostic</Text>
                    </View>
                  </View>

                  {/* Customer */}
                  <View style={{ width: 160, gap: 2 }}>
                    <Text style={styles.customerName}>{item.user_name || 'Customer'}</Text>
                    <Text style={styles.customerPhone}>{item.user_phone || '—'}</Text>
                    <Text style={styles.customerAddr} numberOfLines={1}>{item.address_text || item.address || '—'}</Text>
                  </View>

                  {/* Trade */}
                  <View style={{ width: 140, gap: 2 }}>
                    <Text style={styles.tradeName}>{item.category_name || item.category || 'General'}</Text>
                    <Text style={styles.issueText} numberOfLines={2}>
                      {item.issue || item.issue_description || 'General inspection'}
                    </Text>
                  </View>

                  {/* Schedule */}
                  <View style={{ width: 150, gap: 2 }}>
                    <Text style={styles.scheduleText}>{item.schedule || item.scheduled_date || 'Today'}</Text>
                    {item.scheduled_time ? (
                      <Text style={styles.scheduleSub}>{item.scheduled_time}</Text>
                    ) : null}
                  </View>

                  {/* Technician */}
                  <View style={{ width: 150, gap: 4 }}>
                    {item.provider_name || assignedProv?.name ? (
                      <View>
                        <Text style={styles.provName}>{item.provider_name || assignedProv?.name}</Text>
                        <Text style={styles.provTrade}>{item.provider_trade || assignedProv?.trade || 'Technician'}</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.dispatchBtn}
                        onPress={() => handleOpenAssign(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.dispatchBtnText}>+ Assign Tech</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Status Badge */}
                  <View style={{ width: 140 }}>
                    <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusPillText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  </View>

                  {/* Quote */}
                  <View style={{ width: 110 }}>
                    {hasQuote ? (
                      <View>
                        <Text style={styles.quoteTotal}>₹{Number(item.total_bill || 0).toLocaleString()}</Text>
                        <Text style={styles.quoteSub}>
                          {item.bill_status === 'PAID' ? '✓ Paid' : item.bill_status === 'REJECTED' ? '✕ Declined' : 'Sent'}
                        </Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>Diagnosis Pending</Text>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={{ width: 120, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => handleOpenQuoteBuilder(item)}
                      title="Prepare / Edit Quote"
                      activeOpacity={0.7}
                    >
                      <AppIcon name="file-text" size={13} color="#2563eb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.viewDetailBtn}
                      onPress={() => handleOpenDetail(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewDetailBtnText}>Inspect</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* INSPECT DETAIL MODAL */}
      <Modal visible={detailModalVisible} transparent={true} animationType="fade" onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Consultation Work Order Details</Text>
                <Text style={styles.modalSub}>ID: {selectedBooking?.booking_id}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={{ fontSize: 16, color: '#64748b', fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 18, maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              <View style={styles.detailGrid}>
                <View style={styles.detailCol}>
                  <Text style={styles.dLabel}>Customer Name</Text>
                  <Text style={styles.dVal}>{selectedBooking?.user_name || '—'}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.dLabel}>Phone</Text>
                  <Text style={styles.dVal}>{selectedBooking?.user_phone || '—'}</Text>
                </View>
                <View style={[styles.detailCol, { width: '100%' }]}>
                  <Text style={styles.dLabel}>Home Address</Text>
                  <Text style={styles.dVal}>{selectedBooking?.address_text || selectedBooking?.address || '—'}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.dLabel}>Category / Trade</Text>
                  <Text style={styles.dVal}>{selectedBooking?.category_name || selectedBooking?.category || '—'}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.dLabel}>Diagnostic Fee</Text>
                  <Text style={[styles.dVal, { color: '#16a34a', fontWeight: '800' }]}>₹0 Free Guaranteed</Text>
                </View>
                <View style={[styles.detailCol, { width: '100%' }]}>
                  <Text style={styles.dLabel}>Customer Reported Issue</Text>
                  <Text style={styles.dVal}>{selectedBooking?.issue || selectedBooking?.issue_description || 'General inspection'}</Text>
                </View>
                {selectedBooking?.inspection_report ? (
                  <View style={[styles.detailCol, { width: '100%', backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8 }]}>
                    <Text style={[styles.dLabel, { color: '#166534' }]}>Technician Diagnosis Notes</Text>
                    <Text style={[styles.dVal, { color: '#15803d' }]}>{selectedBooking.inspection_report}</Text>
                  </View>
                ) : null}
                <View style={styles.detailCol}>
                  <Text style={styles.dLabel}>Assigned Technician</Text>
                  <Text style={styles.dVal}>{selectedBooking?.provider_name || 'Unassigned'}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.dLabel}>Work Order Stage</Text>
                  <Text style={styles.dVal}>{selectedBooking?.status}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setDetailModalVisible(false);
                  handleOpenAssign(selectedBooking);
                }}
              >
                <Text style={styles.modalSecondaryBtnText}>Assign Tech</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setDetailModalVisible(false);
                  handleOpenQuoteBuilder(selectedBooking);
                }}
              >
                <Text style={styles.modalPrimaryBtnText}>Prepare Quote</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ASSIGN TECHNICIAN MODAL */}
      <Modal visible={assignModalVisible} transparent={true} animationType="fade" onRequestClose={() => setAssignModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxWidth: 440 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Dispatch Field Technician</Text>
                <Text style={styles.modalSub}>Select a certified technician for on-site visit</Text>
              </View>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={{ fontSize: 16, color: '#64748b', fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16, maxHeight: 360 }}>
              {(providers || []).map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.providerSelectRow}
                  onPress={() => handleAssignProvider(p.id)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.pSelectName}>{p.name}</Text>
                    <Text style={styles.pSelectSub}>{p.trade || p.specialty || 'Field Tech'} • ★ {p.rating || '4.8'}</Text>
                  </View>
                  <View style={styles.pSelectBtn}>
                    <Text style={styles.pSelectBtnText}>Assign</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* UPFRONT QUOTE BUILDER MODAL */}
      <Modal visible={quoteModalVisible} transparent={true} animationType="fade" onRequestClose={() => setQuoteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxWidth: 460 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Upfront Repair Quote</Text>
                <Text style={styles.modalSub}>ID: {selectedBooking?.booking_id} • Diagnostic Visit: ₹0 Free</Text>
              </View>
              <TouchableOpacity onPress={() => setQuoteModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={{ fontSize: 16, color: '#64748b', fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ padding: 18, gap: 12 }}>
              <View style={styles.formRow}>
                <Text style={styles.fLabel}>Diagnostic Visit Fee</Text>
                <TextInput style={[styles.fInput, { backgroundColor: '#f1f5f9' }]} value="₹0 (Free Guarantee)" editable={false} />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fLabel}>Replacement Spare Parts (₹)</Text>
                <TextInput
                  style={styles.fInput}
                  placeholder="e.g. 450"
                  placeholderTextColor="#94a3b8"
                  value={partsCharge}
                  onChangeText={setPartsCharge}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fLabel}>Labour & Workmanship Charge (₹)</Text>
                <TextInput
                  style={styles.fInput}
                  placeholder="e.g. 299"
                  placeholderTextColor="#94a3b8"
                  value={labourCharge}
                  onChangeText={setLabourCharge}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fLabel}>Diagnosis Findings & Notes</Text>
                <TextInput
                  style={[styles.fInput, { minHeight: 50 }]}
                  placeholder="Root cause identified, parts required..."
                  placeholderTextColor="#94a3b8"
                  value={quoteNotes}
                  onChangeText={setQuoteNotes}
                  multiline
                />
              </View>

              <View style={styles.quoteSummaryBox}>
                <Text style={styles.qSumLabel}>Net Payable by Customer Upon Approval</Text>
                <Text style={styles.qSumVal}>
                  ₹{( (parseFloat(partsCharge) || 0) + (parseFloat(labourCharge) || 0) ).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setQuoteModalVisible(false)}>
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleSubmitQuote}>
                <Text style={styles.modalPrimaryBtnText}>Send Quote to Customer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  freeHeaderTag: {
    backgroundColor: '#dcfce7',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  freeHeaderTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803d',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    cursor: 'pointer',
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 12,
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  kpiVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  kpiSub: {
    fontSize: 10.5,
    color: '#94a3b8',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0f172a',
    outlineStyle: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    cursor: 'pointer',
  },
  filterPillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterPillText: {
    fontSize: 11.5,
    color: '#475569',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tableScroll: {
    flex: 1,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  th: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  bookingIdText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  zeroTag: {
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  zeroTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#16a34a',
  },
  customerName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  customerPhone: {
    fontSize: 11,
    color: '#64748b',
  },
  customerAddr: {
    fontSize: 10.5,
    color: '#94a3b8',
  },
  tradeName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  issueText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 14,
  },
  scheduleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  scheduleSub: {
    fontSize: 10.5,
    color: '#64748b',
  },
  provName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  provTrade: {
    fontSize: 10.5,
    color: '#64748b',
  },
  dispatchBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    cursor: 'pointer',
  },
  dispatchBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563eb',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  quoteTotal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  quoteSub: {
    fontSize: 10.5,
    color: '#64748b',
  },
  actionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  viewDetailBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    cursor: 'pointer',
  },
  viewDetailBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyStateSub: {
    fontSize: 12,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  modalBox: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  modalSub: {
    fontSize: 11.5,
    color: '#64748b',
  },
  modalCloseBtn: {
    padding: 6,
    cursor: 'pointer',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  detailCol: {
    width: '47%',
    gap: 2,
  },
  dLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  dVal: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalSecondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    cursor: 'pointer',
  },
  modalSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  modalPrimaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    cursor: 'pointer',
  },
  modalPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  providerSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  pSelectName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  pSelectSub: {
    fontSize: 11,
    color: '#64748b',
  },
  pSelectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2563eb',
    borderRadius: 6,
  },
  pSelectBtnText: {
    fontSize: 11.5,
    color: '#ffffff',
    fontWeight: '700',
  },
  formRow: {
    gap: 4,
  },
  fLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  fInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12.5,
    color: '#0f172a',
    outlineStyle: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  quoteSummaryBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  qSumLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e40af',
  },
  qSumVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1e40af',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
});
