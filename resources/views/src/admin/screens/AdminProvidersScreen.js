import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Image } from 'react-native';
import { useApp } from '../../context/AppContext';
import ProviderProfileModal from '../components/ProviderProfileModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { exportToCSV } from '../../utils/exportUtils';
import { resolveCategoryImageUri, resolveServiceItemImageUri } from '../../utils/imageUtils';
import { getHardcodedCatalogImage } from '../../utils/bundledImages';
import { getProviderRatingStats, getPerformanceTier } from '../../utils/ratings';
import GoogleMapsLocationPicker from '../../components/GoogleMapsLocationPicker';
import FleetRadarMap from '../components/FleetRadarMap';

export function AdminProvidersScreen() {
  const { providers, setProviders, updateProviderDutyStatus, bookings, isCategoryAllowedForAdmin, adminUser } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [viewMode, setViewMode] = useState('TABLE');

  const visibleProviders = (providers || []).filter((p) => {
    if (!adminUser || adminUser.role === 'SUPER_ADMIN') return true;
    if (typeof isCategoryAllowedForAdmin === 'function') {
      const pCats = p.categories || (p.category ? [p.category] : []);
      if (pCats.length === 0) return true;
      return pCats.some((c) => isCategoryAllowedForAdmin(c));
    }
    return true;
  });

  // Compute real dynamic statistics for a provider from actual bookings
  const getProviderStats = (provider) => {
    if (!provider) return { completedCount: 0, revenue: 0, rating: '5.0', totalCount: 0, tier: null };
    const pStats = getProviderRatingStats(provider, bookings || []);
    const tier = getPerformanceTier(pStats);

    const provIdStr = provider.id != null ? String(provider.id) : '';
    const provPhone = (provider.phone || '').replace(/\D/g, '').slice(-10);
    const provName = (provider.name || '').trim().toLowerCase();

    const provBookings = (bookings || []).filter((b) => {
      if (provIdStr && b.provider_id != null && String(b.provider_id) === provIdStr) return true;
      if (provPhone && b.provider_phone && b.provider_phone.replace(/\D/g, '').slice(-10) === provPhone) return true;
      if (provName && b.provider_name && b.provider_name.trim().toLowerCase() === provName) return true;
      return false;
    });

    const completed = provBookings.filter((b) => b.status === 'BOOKING_COMPLETED' || b.status === 'COMPLETED');
    const revenue = completed.reduce((sum, b) => sum + Number(b.payout_amount || (b.total_bill ? b.total_bill * 0.8 : 0) || b.amount || 0), 0);
    const rating = pStats.totalRatings > 0 ? String(pStats.averageRating) : (provider.rating != null ? Number(provider.rating).toFixed(1) : '5.0');

    return {
      completedCount: completed.length,
      revenue,
      rating,
      totalCount: provBookings.length,
      tier,
      totalRatings: pStats.totalRatings,
    };
  };

  // Delete Confirmation State
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // Form states
  const [editId, setEditId] = useState(null);
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerAadhar, setPartnerAadhar] = useState('');
  const [partnerRating, setPartnerRating] = useState('5.0');
  const [partnerJobs, setPartnerJobs] = useState('0');
  const [partnerEarnings, setPartnerEarnings] = useState('0');
  const [partnerLocation, setPartnerLocation] = useState('DLF Cyber City, Sector 24, Gurugram');
  const [partnerCoords, setPartnerCoords] = useState({ lat: 28.4986, lng: 77.0878 });
  const [showMapPicker, setShowMapPicker] = useState(false);

  const formatAadharNumber = (val) => {
    const digits = (val || '').replace(/\D/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const openModal = (p = null) => {
    if (p) {
      setEditId(p.id);
      setPartnerName(p.name || '');
      setPartnerPhone(p.phone || '');
      setPartnerAadhar(p.aadhar ? formatAadharNumber(p.aadhar) : '');
      setPartnerRating(String(p.rating ?? '5.0'));
      setPartnerJobs(String(p.total_jobs ?? '0'));
      setPartnerEarnings(String(p.earnings ?? '0'));
      setPartnerLocation(p.location || 'DLF Cyber City, Sector 24, Gurugram');
      setPartnerCoords(p.coords || (p.lat && p.lng ? { lat: Number(p.lat), lng: Number(p.lng) } : { lat: 28.4986, lng: 77.0878 }));
    } else {
      setEditId(null);
      setPartnerName('');
      setPartnerPhone('');
      setPartnerAadhar('');
      setPartnerRating('5.0');
      setPartnerJobs('0');
      setPartnerEarnings('0');
      setPartnerLocation('DLF Cyber City, Sector 24, Gurugram');
      setPartnerCoords({ lat: 28.4986, lng: 77.0878 });
    }
    setShowMapPicker(false);
    setModalVisible(true);
  };

  const handleOpenDetailModal = (p) => {
    setSelectedProvider(p);
    setDetailModalVisible(true);
  };

  const handleAddPartner = () => {
    if (!partnerName.trim() || !partnerPhone.trim()) return;

    const cleanAadhar = (partnerAadhar || '').replace(/\D/g, '').slice(0, 12);
    const formattedAadhar = cleanAadhar.length > 0 ? formatAadharNumber(cleanAadhar) : '';

    const existing = editId ? providers.find((p) => p.id === editId) : null;
    const newPartner = {
      ...(existing || {}),
      id: editId || Date.now(),
      name: partnerName.trim(),
      phone: partnerPhone.trim(),
      aadhar: formattedAadhar,
      coords: partnerCoords,
      rating: parseFloat(partnerRating) || 5.0,
      total_jobs: parseInt(partnerJobs) || 0,
      earnings: parseFloat(partnerEarnings) || 0.0,
      location: partnerLocation.trim() || 'DLF Cyber City, Sector 24, Gurugram',
    };

    if (editId) {
      setProviders((prev) => prev.map((p) => p.id === editId ? newPartner : p));
    } else {
      setProviders((prev) => [...prev, newPartner]);
    }
    setModalVisible(false);
  };

  const promptDeletePartner = (p) => {
    setDeleteTargetId(p.id);
    setDeleteTargetName(p.name);
    setDeleteConfirmVisible(true);
  };

  const confirmDeletePartner = () => {
    if (deleteTargetId) {
      setProviders((prev) => prev.filter((p) => p.id !== deleteTargetId));
    }
    setDeleteConfirmVisible(false);
    setDeleteTargetId(null);
  };

  const handleExportProviders = () => {
    const columns = [
      { label: 'Provider ID', accessor: (p) => p.id },
      { label: 'Partner Name', accessor: (p) => p.name },
      { label: 'Aadhaar (UIDAI)', accessor: (p) => p.aadhar || 'Pending' },
      { label: 'Phone Number', accessor: (p) => p.phone },
      { label: 'Rating', accessor: (p) => getProviderStats(p).rating },
      { label: 'Performance Tier', accessor: (p) => getProviderStats(p).tier?.label || 'Baseline' },
      { label: 'Total Jobs Completed', accessor: (p) => getProviderStats(p).completedCount },
      { label: 'Total Earnings (INR)', accessor: (p) => getProviderStats(p).revenue },
      { label: 'Service Location', accessor: (p) => p.location || 'N/A' },
      { label: 'Map Coordinates', accessor: (p) => p.coords?.lat && p.coords?.lng ? `${p.coords.lat}, ${p.coords.lng}` : 'N/A' },
      { label: 'Online Status', accessor: (p) => (p.is_online ? 'ONLINE' : 'OFFLINE') },
    ];
    exportToCSV('Zevota_Field_Partners_Report', columns, visibleProviders);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerWithBtn}>
        <View>
          <Text style={styles.title}>Field Partner Management</Text>
          <Text style={styles.subtitle}>Approve, review, and track certified service technicians.</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View Mode Switcher */}
          <View style={{ flexDirection: 'row', backgroundColor: '#e2e8f0', padding: 3, borderRadius: 8 }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: viewMode === 'TABLE' ? '#ffffff' : 'transparent',
              }}
              onPress={() => setViewMode('TABLE')}
              activeOpacity={0.8}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={viewMode === 'TABLE' ? '#0f172a' : '#64748b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
                <path d="M9 3v18" />
              </svg>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: viewMode === 'TABLE' ? '#0f172a' : '#64748b' }}>
                Table View
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: viewMode === 'RADAR' ? '#ffffff' : 'transparent',
              }}
              onPress={() => setViewMode('RADAR')}
              activeOpacity={0.8}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={viewMode === 'RADAR' ? '#2563eb' : '#64748b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: viewMode === 'RADAR' ? '#2563eb' : '#64748b' }}>
                Fleet Radar Map
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={{ backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 }}
            onPress={handleExportProviders}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12.5 }}>Export (CSV)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addPartnerBtn} onPress={() => openModal()}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <Text style={styles.addPartnerBtnText}>Add Field Partner</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'RADAR' ? (
        <FleetRadarMap
          providers={visibleProviders}
          onSelectProvider={(p) => handleOpenDetailModal(p)}
          onToggleDuty={(id, next) => updateProviderDutyStatus && updateProviderDutyStatus(id, next)}
        />
      ) : (
        <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.5 }]}>Partner Name</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Phone</Text>
          <Text style={[styles.th, { flex: 0.9 }]}>Status</Text>
          <Text style={[styles.th, { flex: 0.9 }]}>Rating</Text>
          <Text style={[styles.th, { flex: 0.9 }]}>Jobs Done</Text>
          <Text style={[styles.th, { flex: 1.1 }]}>Total Revenue</Text>
          <Text style={[styles.th, { flex: 1.5, textAlign: 'right' }]}>Actions</Text>
        </View>

        {visibleProviders.map((p, idx) => {
          const stats = getProviderStats(p);
          return (
            <View key={idx} style={styles.tableRow}>
              <View style={{ flex: 1.5, gap: 3 }}>
                <TouchableOpacity onPress={() => handleOpenDetailModal(p)} onClick={() => handleOpenDetailModal(p)} activeOpacity={0.7}>
                  <Text style={[styles.tdBold, { color: '#7c3aed' }]}>{p.name}</Text>
                </TouchableOpacity>
                {p.aadhar ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <Text style={{ fontSize: 10.5, color: '#047857', fontWeight: '700' }}>
                      UIDAI: {p.aadhar}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 10, color: '#94a3b8' }}>UIDAI: Pending</Text>
                )}
              </View>

              <View style={{ flex: 1.2, gap: 3 }}>
                <Text style={styles.td}>{p.phone}</Text>
                {p.location ? (
                  <TouchableOpacity
                    onPress={() => {
                      const url = p.coords?.lat && p.coords?.lng
                        ? `https://www.google.com/maps/search/?api=1&query=${p.coords.lat},${p.coords.lng}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.location)}`;
                      if (typeof window !== 'undefined') window.open(url, '_blank');
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
                    activeOpacity={0.7}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    <Text style={{ fontSize: 10.5, color: '#2563eb', fontWeight: '600' }} numberOfLines={1}>
                      {p.location}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={{ flex: 0.9 }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => updateProviderDutyStatus && updateProviderDutyStatus(p.id, p.is_online === false)}
                  style={[styles.statusPill, p.is_online !== false ? styles.activePill : styles.offlinePill, { flexDirection: 'row', alignItems: 'center' }]}
                >
                  <View style={[styles.statusDot, { backgroundColor: p.is_online !== false ? '#10b981' : '#94a3b8' }]} />
                  <Text style={[styles.statusPillText, p.is_online !== false ? styles.activePillText : styles.offlinePillText]}>
                    {p.is_online !== false ? 'ONLINE' : 'OFFLINE'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.td, { flex: 0.9, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#d97706" stroke="#d97706" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <Text style={{ color: '#d97706', fontWeight: '800', fontSize: 13 }}>{stats.rating}</Text>
                {stats.tier ? (
                  <Text style={{ fontSize: 9.5, fontWeight: '700', color: stats.tier.color }}>
                    {stats.tier.badge}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.td, { flex: 0.9 }]}>{stats.completedCount} Jobs</Text>
              <Text style={[styles.td, { flex: 1.1, color: '#059669', fontWeight: '800' }]}>₹{stats.revenue.toLocaleString('en-IN')}</Text>
            
            {/* Actions button row with proper touch targets */}
            <View style={{ flex: 1.5, flexDirection: 'row', justifyContent: 'flex-end', gap: 6, zIndex: 10 }}>
              <TouchableOpacity
                style={styles.viewActionPill}
                onPress={() => handleOpenDetailModal(p)}
                onClick={() => handleOpenDetailModal(p)}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#7c3aed', fontSize: 11.5, fontWeight: '700' }}>View</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editActionPill}
                onPress={() => openModal(p)}
                onClick={() => openModal(p)}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#2563eb', fontSize: 11.5, fontWeight: '700' }}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteActionPill}
                onPress={() => promptDeletePartner(p)}
                onClick={() => promptDeletePartner(p)}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#dc2626', fontSize: 11.5, fontWeight: '700' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
        </View>
      )}

      {/* ADD / EDIT FIELD PARTNER MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90vh', overflow: 'hidden' }]}>
            <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ gap: 12 }}>
              <Text style={styles.modalTitle}>{editId ? 'Edit Field Partner' : 'Add Certified Field Partner'}</Text>
              
              <Text style={styles.inputLabel}>Partner Name *</Text>
              <TextInput style={styles.textInput} value={partnerName} onChangeText={setPartnerName} placeholder="e.g. Ramesh Kumar" />

              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput style={styles.textInput} value={partnerPhone} onChangeText={setPartnerPhone} placeholder="e.g. +91 99887 76655" keyboardType="phone-pad" />

              {/* AADHAAR NUMBER FIELD */}
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.inputLabel}>Aadhaar Card Number (UIDAI) *</Text>
                  {partnerAadhar.replace(/\D/g, '').length === 12 ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <Text style={{ fontSize: 10.5, color: '#059669', fontWeight: '700' }}>12-Digit Format Valid</Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 10, color: '#94a3b8' }}>12 Digits required</Text>
                  )}
                </View>
                <TextInput
                  style={styles.textInput}
                  value={partnerAadhar}
                  onChangeText={(text) => setPartnerAadhar(formatAadharNumber(text))}
                  placeholder="e.g. 4829 1938 4821"
                  maxLength={14}
                  keyboardType="numeric"
                />
              </View>

              {/* LOCATION SERVICE AREA (WITH GOOGLE MAPS PINPOINT) */}
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.inputLabel}>Location Service Area (Google Maps) *</Text>
                  <TouchableOpacity
                    onPress={() => setShowMapPicker(true)}
                    style={styles.mapPinpointBtn}
                    activeOpacity={0.8}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                      <line x1="8" y1="2" x2="8" y2="18" />
                      <line x1="16" y1="6" x2="16" y2="22" />
                    </svg>
                    <Text style={styles.mapPinpointBtnText}>Pinpoint on Map</Text>
                  </TouchableOpacity>
                </View>
                
                <TextInput
                  style={styles.textInput}
                  value={partnerLocation}
                  onChangeText={setPartnerLocation}
                  placeholder="e.g. DLF Cyber City, Sector 24, Gurugram"
                />

                {partnerCoords && partnerCoords.lat && partnerCoords.lng ? (
                  <View style={styles.coordsBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    <Text style={styles.coordsBadgeText}>
                      Google Maps Pin: {Number(partnerCoords.lat).toFixed(4)}° N, {Number(partnerCoords.lng).toFixed(4)}° E
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const url = `https://www.google.com/maps/search/?api=1&query=${partnerCoords.lat},${partnerCoords.lng}`;
                        if (typeof window !== 'undefined') window.open(url, '_blank');
                      }}
                      style={{ marginLeft: 'auto' }}
                    >
                      <Text style={{ fontSize: 10, color: '#2563eb', fontWeight: '700', textDecorationLine: 'underline' }}>View Live Map</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowMapPicker(true)}
                    style={[styles.coordsBadge, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                    activeOpacity={0.8}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600' }}>
                      Click "Pinpoint on Map" to select exact Google Maps coordinates
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Rating (1-5)</Text>
                  <TextInput style={styles.textInput} value={partnerRating} onChangeText={setPartnerRating} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Completed Jobs</Text>
                  <TextInput style={styles.textInput} value={partnerJobs} onChangeText={setPartnerJobs} keyboardType="number-pad" />
                </View>
              </View>

              <Text style={styles.inputLabel}>Initial Earnings / Revenue (₹)</Text>
              <TextInput style={styles.textInput} value={partnerEarnings} onChangeText={setPartnerEarnings} keyboardType="numeric" />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.submitBtn} onPress={handleAddPartner}>
                  <Text style={styles.submitBtnText}>{editId ? 'Save Partner' : 'Add Partner'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* GOOGLE MAPS LOCATION PICKER MODAL */}
      <Modal visible={showMapPicker} transparent animationType="fade" onRequestClose={() => setShowMapPicker(false)}>
        <View style={styles.mapModalOverlay}>
          <View style={styles.mapModalCard}>
            <View style={styles.mapModalHeader}>
              <View style={{ gap: 2 }}>
                <Text style={styles.mapModalTitle}>Google Maps Location Calibration</Text>
                <Text style={styles.mapModalSubtitle}>Search or drag pin to define field partner dispatch location</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMapPicker(false)} style={styles.mapModalCloseBtn} activeOpacity={0.7}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </TouchableOpacity>
            </View>

            <GoogleMapsLocationPicker
              initialAddress={partnerLocation}
              initialCoords={partnerCoords}
              onSelectLocation={({ address, lat, lng }) => {
                if (address) setPartnerLocation(address);
                if (lat && lng) setPartnerCoords({ lat, lng });
                setShowMapPicker(false);
              }}
              onClose={() => setShowMapPicker(false)}
              containerStyle={{ borderWidth: 0, boxShadow: 'none', padding: 0 }}
            />
          </View>
        </View>
      </Modal>

      {/* Provider Detail Modal */}
      <ProviderProfileModal
        visible={detailModalVisible}
        provider={selectedProvider}
        onClose={() => { setDetailModalVisible(false); setSelectedProvider(null); }}
        onEdit={(p) => openModal(p)}
      />

      {/* Confirm Delete Modal for Partners */}
      <ConfirmDeleteModal
        visible={deleteConfirmVisible}
        title="Delete Field Partner?"
        message={`Are you sure you want to remove ${deleteTargetName || 'this field partner'}? This will remove them from active dispatch assignment.`}
        onConfirm={confirmDeletePartner}
        onCancel={() => setDeleteConfirmVisible(false)}
        confirmText="Delete Partner"
      />
    </ScrollView>
  );
}

export function AdminServicesScreen() {
  const { 
    categories, setCategories, 
    subCategories, setSubCategories, 
    services, setServices 
  } = useApp();

  // Delete Confirm State for Catalog
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetType, setDeleteTargetType] = useState('category'); // 'category' | 'subcategory' | 'service'
  const [deleteTargetName, setDeleteTargetName] = useState('');

  const [viewMode, setViewMode] = useState('CATEGORIES'); // 'CATEGORIES' | 'SUBCATEGORIES' | 'SERVICES'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  // Add Modals State
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);

  // Form states
  const [editId, setEditId] = useState(null);
  
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [newSubName, setNewSubName] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');

  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceTime, setNewServiceTime] = useState('30-45 mins');

  const openCatModal = (cat = null) => {
    if (cat) {
      setEditId(cat.id);
      setNewCatName(cat.name);
      setNewCatDesc(cat.description || '');
    } else {
      setEditId(null);
      setNewCatName('');
      setNewCatDesc('');
    }
    setCatModalVisible(true);
  };

  const openSubModal = (sub = null) => {
    if (sub) {
      setEditId(sub.id);
      setNewSubName(sub.name);
      setNewSubDesc(sub.description || '');
    } else {
      setEditId(null);
      setNewSubName('');
      setNewSubDesc('');
    }
    setSubModalVisible(true);
  };

  const openServiceModal = (s = null) => {
    if (s) {
      setEditId(s.id);
      setNewServiceName(s.name);
      setNewServiceDesc(s.description || '');
      setNewServiceTime(s.time || '30-45 mins');
    } else {
      setEditId(null);
      setNewServiceName('');
      setNewServiceDesc('');
      setNewServiceTime('30-45 mins');
    }
    setServiceModalVisible(true);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const name = newCatName.trim();
    const item = {
      id: editId || Date.now(),
      name,
      description: newCatDesc.trim(),
      image_url: getHardcodedCatalogImage(name),
    };
    if (editId) {
      setCategories(prev => prev.map(c => c.id === editId ? item : c));
    } else {
      setCategories(prev => [...prev, item]);
    }
    setCatModalVisible(false);
  };

  const handleDeleteCategory = (cat) => {
    setDeleteTargetId(cat.id);
    setDeleteTargetType('category');
    setDeleteTargetName(cat.name);
    setDeleteConfirmVisible(true);
  };

  const handleAddSubCategory = () => {
    if (!newSubName.trim() || !selectedCategory) return;
    const name = newSubName.trim();
    const item = {
      id: editId || Date.now(),
      category_name: selectedCategory.name,
      name,
      description: newSubDesc.trim(),
      image_url: getHardcodedCatalogImage(name),
    };
    if (editId) {
      setSubCategories(prev => prev.map(s => s.id === editId ? item : s));
    } else {
      setSubCategories(prev => [...prev, item]);
    }
    setSubModalVisible(false);
  };

  const handleDeleteSubCategory = (sub) => {
    setDeleteTargetId(sub.id);
    setDeleteTargetType('subcategory');
    setDeleteTargetName(sub.name);
    setDeleteConfirmVisible(true);
  };

  const handleAddService = () => {
    if (!newServiceName.trim() || !selectedCategory) return;
    const name = newServiceName.trim();
    const item = {
      id: editId || Date.now(),
      category_name: selectedCategory.name,
      sub_category_name: selectedSubCategory ? selectedSubCategory.name : '',
      name,
      description: newServiceDesc.trim(),
      time: newServiceTime.trim() || '30-45 mins',
      image_url: getHardcodedCatalogImage(name),
    };
    if (editId) {
      setServices(prev => prev.map(s => s.id === editId ? item : s));
    } else {
      setServices(prev => [...prev, item]);
    }
    setServiceModalVisible(false);
  };

  const handleDeleteService = (s) => {
    setDeleteTargetId(s.id);
    setDeleteTargetType('service');
    setDeleteTargetName(s.name);
    setDeleteConfirmVisible(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Service & Category Catalog</Text>
        <Text style={styles.subtitle}>
          Configure names and descriptions. Category / service images are hardcoded in the app and cannot be changed here.
        </Text>
      </View>

      {/* Breadcrumbs Navigation Row */}
      <View style={styles.breadcrumbRow}>
        <TouchableOpacity onPress={() => setViewMode('CATEGORIES')} style={styles.breadItemLink}>
          <Text style={[styles.breadText, viewMode === 'CATEGORIES' && styles.breadActiveText]}>Catalog Root</Text>
        </TouchableOpacity>

        {selectedCategory && (
          <>
            <Text style={styles.breadSeparator}>›</Text>
            <TouchableOpacity onPress={() => {
              const hasSub = subCategories.some(sub => sub.category_name === selectedCategory.name);
              if (hasSub) {
                setViewMode('SUBCATEGORIES');
                setSelectedSubCategory(null);
              } else {
                setViewMode('SERVICES');
              }
            }} style={styles.breadItemLink}>
              <Text style={[styles.breadText, (viewMode === 'SUBCATEGORIES' || (viewMode === 'SERVICES' && !selectedSubCategory)) && styles.breadActiveText]}>{selectedCategory.name}</Text>
            </TouchableOpacity>
          </>
        )}

        {selectedSubCategory && viewMode === 'SERVICES' && (
          <>
            <Text style={styles.breadSeparator}>›</Text>
            <Text style={[styles.breadText, styles.breadActiveText]}>{selectedSubCategory.name}</Text>
          </>
        )}
      </View>

      {/* TIER 1: CATEGORIES VIEW */}
      {viewMode === 'CATEGORIES' && (
        <View style={styles.catalogCard}>
          <View style={styles.cardHeaderWithBtn}>
            <Text style={styles.sectionHeaderTitle}>Main Service Categories ({categories.length})</Text>
            <TouchableOpacity style={styles.addCatalogBtn} onPress={() => openCatModal()}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <Text style={styles.addCatalogBtnText}>Add Category</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            {categories.map((c, idx) => {
              const subCount = subCategories.filter(s => s.category_name === c.name).length;
              const svcCount = services.filter(s => s.category_name === c.name).length;
              const hasSub = subCount > 0;
              return (
                <View key={idx} style={styles.catalogItemRowNoClick}>
                  <TouchableOpacity 
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 }}
                    onPress={() => {
                      setSelectedCategory(c);
                      if (hasSub) {
                        setSelectedSubCategory(null);
                        setViewMode('SUBCATEGORIES');
                      } else {
                        setSelectedSubCategory(null);
                        setViewMode('SERVICES');
                      }
                    }}
                  >
                    <Image source={{ uri: resolveCategoryImageUri(c.name, c.image_url) }} style={styles.catalogRowImg} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.catalogRowTitle}>{c.name}</Text>
                      <Text style={styles.catalogRowDesc}>{c.description || 'No description provided.'}</Text>
                    </View>
                    <View style={styles.badgeCount}>
                      <Text style={styles.badgeCountText}>
                        {hasSub ? `${subCount} Sub-Categories` : `${svcCount} Services`}
                      </Text>
                    </View>
                    <Text style={styles.chevronArrow}>›</Text>
                  </TouchableOpacity>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => openCatModal(c)} onClick={() => openCatModal(c)}><Text style={styles.actionEdit}>Edit</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteCategory(c)} onClick={() => handleDeleteCategory(c)}><Text style={styles.actionDelete}>Del</Text></TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* TIER 2: SUB-CATEGORIES VIEW */}
      {viewMode === 'SUBCATEGORIES' && (
        <View style={styles.catalogCard}>
          <View style={styles.cardHeaderWithBtn}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeaderTitle}>Sub-Categories in {selectedCategory?.name}</Text>
              <Text style={styles.sectionHeaderSub}>Select to configure individual service items.</Text>
            </View>
            <TouchableOpacity style={styles.addCatalogBtn} onPress={() => openSubModal()}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <Text style={styles.addCatalogBtnText}>Add Sub-Category</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            {subCategories.filter(sub => sub.category_name === selectedCategory?.name).length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No sub-categories created yet under {selectedCategory?.name}.</Text>
              </View>
            ) : (
              subCategories
                .filter(sub => sub.category_name === selectedCategory?.name)
                .map((sub, idx) => {
                  const sCount = services.filter(s => s.category_name === selectedCategory?.name && s.sub_category_name === sub.name).length;
                  return (
                    <View key={idx} style={styles.catalogItemRowNoClick}>
                      <TouchableOpacity 
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 }}
                        onPress={() => {
                          setSelectedSubCategory(sub);
                          setViewMode('SERVICES');
                        }}
                      >
                        <Image source={{ uri: resolveCategoryImageUri(selectedCategory?.name, sub.image_url) }} style={styles.catalogRowImg} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.catalogRowTitle}>{sub.name}</Text>
                          <Text style={styles.catalogRowDesc}>{sub.description || 'No description provided.'}</Text>
                        </View>
                        <View style={styles.badgeCount}>
                          <Text style={styles.badgeCountText}>{sCount} Services</Text>
                        </View>
                        <Text style={styles.chevronArrow}>›</Text>
                      </TouchableOpacity>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity onPress={() => openSubModal(sub)} onClick={() => openSubModal(sub)}><Text style={styles.actionEdit}>Edit</Text></TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteSubCategory(sub)} onClick={() => handleDeleteSubCategory(sub)}><Text style={styles.actionDelete}>Del</Text></TouchableOpacity>
                      </View>
                    </View>
                  );
                })
            )}
          </View>

          <TouchableOpacity style={styles.backLinkBtn} onPress={() => setViewMode('CATEGORIES')}>
            <Text style={styles.backLinkBtnText}>← Back to Categories</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* TIER 3: SPECIFIC SERVICES VIEW */}
      {viewMode === 'SERVICES' && (
        <View style={styles.catalogCard}>
          <View style={styles.cardHeaderWithBtn}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeaderTitle}>
                Services in {selectedSubCategory ? selectedSubCategory.name : selectedCategory?.name}
              </Text>
              <Text style={styles.sectionHeaderSub}>Configured for dispatch and booking checklists.</Text>
            </View>
            <TouchableOpacity style={styles.addCatalogBtn} onPress={() => openServiceModal()}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <Text style={styles.addCatalogBtnText}>Add Service</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            {services.filter(s => {
              if (selectedSubCategory) {
                return s.category_name === selectedCategory?.name && s.sub_category_name === selectedSubCategory.name;
              }
              return s.category_name === selectedCategory?.name;
            }).length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No service items created yet under {selectedSubCategory ? selectedSubCategory.name : selectedCategory?.name}.</Text>
              </View>
            ) : (
              services
                .filter(s => {
                  if (selectedSubCategory) {
                    return s.category_name === selectedCategory?.name && s.sub_category_name === selectedSubCategory.name;
                  }
                  return s.category_name === selectedCategory?.name;
                })
                .map((s, idx) => (
                  <View key={idx} style={styles.catalogItemRowNoClick}>
                    <Image source={{ uri: resolveServiceItemImageUri(s, selectedCategory?.name) }} style={styles.catalogRowImg} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.catalogRowTitle}>{s.name}</Text>
                      <Text style={styles.catalogRowDesc}>{s.description || 'No description provided.'}</Text>
                      <Text style={styles.catalogRowMeta}>⏱ Duration: {s.time || '30-45 mins'}</Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity onPress={() => openServiceModal(s)} onClick={() => openServiceModal(s)}><Text style={styles.actionEdit}>Edit</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteService(s)} onClick={() => handleDeleteService(s)}><Text style={styles.actionDelete}>Del</Text></TouchableOpacity>
                    </View>
                  </View>
                ))
            )}
          </View>

          <TouchableOpacity style={styles.backLinkBtn} onPress={() => {
            const hasSub = subCategories.some(sub => sub.category_name === selectedCategory?.name);
            if (hasSub) {
              setViewMode('SUBCATEGORIES');
            } else {
              setViewMode('CATEGORIES');
            }
          }}>
            <Text style={styles.backLinkBtnText}>
              {subCategories.some(sub => sub.category_name === selectedCategory?.name) ? '← Back to Sub-Categories' : '← Back to Categories'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CATEGORY ADD MODAL */}
      <Modal visible={catModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Category' : 'Add New Category'}</Text>
            
            <Text style={styles.inputLabel}>Category Name</Text>
            <TextInput style={styles.textInput} value={newCatName} onChangeText={setNewCatName} placeholder="e.g. Carpenter" />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput style={styles.textInput} value={newCatDesc} onChangeText={setNewCatDesc} placeholder="Description of category" />

            <Text style={styles.imageLockedNote}>Image is fixed in the app (not editable).</Text>
            {!!newCatName.trim() && (
              <Image
                source={{ uri: getHardcodedCatalogImage(newCatName.trim()) }}
                style={styles.catalogPreviewImg}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddCategory}>
                <Text style={styles.submitBtnText}>{editId ? 'Save Changes' : 'Add Category'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCatModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SUBCATEGORY ADD MODAL */}
      <Modal visible={subModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Sub-Category' : 'Add Sub-Category'}</Text>
            <Text style={styles.modalSubTitle}>Adding under category: {selectedCategory?.name}</Text>
            
            <Text style={styles.inputLabel}>Sub-Category Name</Text>
            <TextInput style={styles.textInput} value={newSubName} onChangeText={setNewSubName} placeholder="e.g. Door Repair & Fitment" />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput style={styles.textInput} value={newSubDesc} onChangeText={setNewSubDesc} placeholder="Description of sub-category" />

            <Text style={styles.imageLockedNote}>Image is fixed in the app (not editable).</Text>
            {!!newSubName.trim() && (
              <Image
                source={{ uri: getHardcodedCatalogImage(newSubName.trim()) }}
                style={styles.catalogPreviewImg}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddSubCategory}>
                <Text style={styles.submitBtnText}>{editId ? 'Save Changes' : 'Add Sub-Category'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSubModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SERVICE ADD MODAL */}
      <Modal visible={serviceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Service' : 'Add New Service Item'}</Text>
            <Text style={styles.modalSubTitle}>Adding under: {selectedCategory?.name} › {selectedSubCategory?.name}</Text>
            
            <Text style={styles.inputLabel}>Service Name</Text>
            <TextInput style={styles.textInput} value={newServiceName} onChangeText={setNewServiceName} placeholder="e.g. Door Lock Installation" />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput style={styles.textInput} value={newServiceDesc} onChangeText={setNewServiceDesc} placeholder="Description of service item" />

            <Text style={styles.inputLabel}>Time Duration</Text>
            <TextInput style={styles.textInput} value={newServiceTime} onChangeText={setNewServiceTime} placeholder="e.g. 30-45 mins" />

            <Text style={styles.imageLockedNote}>Image is fixed in the app (not editable).</Text>
            {!!newServiceName.trim() && (
              <Image
                source={{ uri: getHardcodedCatalogImage(newServiceName.trim()) }}
                style={styles.catalogPreviewImg}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddService}>
                <Text style={styles.submitBtnText}>{editId ? 'Save Changes' : 'Add Service'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setServiceModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Catalog Item Delete Confirmation Modal */}
      <ConfirmDeleteModal
        visible={deleteConfirmVisible}
        title={`Delete ${deleteTargetType === 'category' ? 'Category' : deleteTargetType === 'subcategory' ? 'Sub-Category' : 'Service'}?`}
        message={`Are you sure you want to delete "${deleteTargetName}"? This action cannot be undone.`}
        onConfirm={() => {
          if (deleteTargetType === 'category') {
            setCategories(prev => prev.filter(c => c.id !== deleteTargetId));
          } else if (deleteTargetType === 'subcategory') {
            setSubCategories(prev => prev.filter(s => s.id !== deleteTargetId));
          } else if (deleteTargetType === 'service') {
            setServices(prev => prev.filter(s => s.id !== deleteTargetId));
          }
          setDeleteConfirmVisible(false);
          setDeleteTargetId(null);
        }}
        onCancel={() => setDeleteConfirmVisible(false)}
        confirmText="Delete"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, gap: 16 },
  header: { gap: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b' },

  tableCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0f172a', padding: 14 },
  th: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  tableRow: { flexDirection: 'row', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  tdBold: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  td: { fontSize: 13, color: '#334155' },

  breadcrumbRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  breadItemLink: { outlineStyle: 'none' },
  breadText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  breadActiveText: { color: '#64748b' },
  breadSeparator: { color: '#94a3b8', marginHorizontal: 8, fontSize: 12 },

  catalogCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', padding: 18, gap: 16 },
  cardHeaderWithBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  sectionHeaderSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  
  addCatalogBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addCatalogBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 12 },
  
  listContainer: { gap: 12 },
  catalogItemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#f8fafc', gap: 14, cursor: 'pointer' },
  catalogItemRowNoClick: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#ffffff', gap: 14 },
  catalogRowImg: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#e2e8f0' },
  catalogRowTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  catalogRowDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  catalogRowMeta: { fontSize: 11, fontWeight: '600', color: '#2563eb', marginTop: 4 },
  
  badgeCount: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeCountText: { fontSize: 11, fontWeight: '600', color: '#2563eb' },
  chevronArrow: { fontSize: 18, color: '#94a3b8', fontWeight: '600', marginLeft: 4, marginRight: 8 },
  
  actionButtons: { flexDirection: 'row', gap: 12, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: '#f1f5f9' },
  actionEdit: { color: '#2563eb', fontSize: 12, fontWeight: '600' },
  actionDelete: { color: '#dc2626', fontSize: 12, fontWeight: '600' },

  backLinkBtn: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, alignItems: 'flex-start' },
  backLinkBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
  
  emptyContainer: { padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 20, padding: 22, width: '100%', maxWidth: 440, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  modalSubTitle: { fontSize: 12, color: '#64748b', marginTop: -6 },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#475569' },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, padding: 10, fontSize: 13, color: '#0f172a' },
  imageLockedNote: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  catalogPreviewImg: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#e2e8f0', alignSelf: 'flex-start' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  submitBtn: { flex: 1, backgroundColor: '#7c3aed', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontWeight: '600', fontSize: 12 },
  headerWithBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  addPartnerBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addPartnerBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 12 },

  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  statusPillText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  activePill: { backgroundColor: '#ecfdf5' },
  activePillText: { color: '#047857' },
  offlinePill: { backgroundColor: '#f1f5f9' },
  offlinePillText: { color: '#64748b' },

  viewActionPill: {
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    cursor: 'pointer',
  },
  editActionPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    cursor: 'pointer',
  },
  deleteActionPill: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    cursor: 'pointer',
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  coordsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  mapPinpointBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    cursor: 'pointer',
  },
  mapPinpointBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  mapModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  mapModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    maxWidth: 620,
    gap: 12,
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  mapModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  mapModalSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
  },
  mapModalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  },
});
