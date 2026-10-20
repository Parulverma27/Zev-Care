import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Image } from 'react-native';
import { useApp } from '../../context/AppContext';
import ProviderProfileModal from '../components/ProviderProfileModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import { exportToCSV } from '../../utils/exportUtils';
import { resolveCategoryImageUri, resolveServiceItemImageUri } from '../../utils/imageUtils';
import { getHardcodedCatalogImage } from '../../utils/bundledImages';

export function AdminProvidersScreen() {
  const { providers, setProviders, bookings } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Compute real dynamic statistics for a provider from actual bookings
  const getProviderStats = (provider) => {
    if (!provider) return { completedCount: 0, revenue: 0, rating: '5.0', totalCount: 0 };
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
    const rated = completed.filter((b) => Number(b.user_rating || b.provider_rating || b.rating) > 0);
    const rating = rated.length > 0
      ? (rated.reduce((sum, b) => sum + Number(b.user_rating || b.provider_rating || b.rating), 0) / rated.length).toFixed(1)
      : (provider.rating != null ? Number(provider.rating).toFixed(1) : '5.0');

    return {
      completedCount: completed.length,
      revenue,
      rating,
      totalCount: provBookings.length,
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
  const [partnerRating, setPartnerRating] = useState('5.0');
  const [partnerJobs, setPartnerJobs] = useState('0');
  const [partnerEarnings, setPartnerEarnings] = useState('0');
  const [partnerLocation, setPartnerLocation] = useState('Bandra West (1.5 km away)');

  const openModal = (p = null) => {
    if (p) {
      setEditId(p.id);
      setPartnerName(p.name);
      setPartnerPhone(p.phone);
      setPartnerRating(String(p.rating));
      setPartnerJobs(String(p.total_jobs));
      setPartnerEarnings(String(p.earnings));
      setPartnerLocation(p.location);
    } else {
      setEditId(null);
      setPartnerName('');
      setPartnerPhone('');
      setPartnerRating('5.0');
      setPartnerJobs('0');
      setPartnerEarnings('0');
      setPartnerLocation('Bandra West (1.5 km away)');
    }
    setModalVisible(true);
  };

  const handleOpenDetailModal = (p) => {
    setSelectedProvider(p);
    setDetailModalVisible(true);
  };

  const handleAddPartner = () => {
    if (!partnerName.trim() || !partnerPhone.trim()) return;

    const newPartner = {
      id: editId || Date.now(),
      name: partnerName,
      phone: partnerPhone,
      rating: parseFloat(partnerRating) || 5.0,
      total_jobs: parseInt(partnerJobs) || 0,
      earnings: parseFloat(partnerEarnings) || 0.0,
      location: partnerLocation || 'Bandra West, Mumbai',
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
      { label: 'Phone Number', accessor: (p) => p.phone },
      { label: 'Rating', accessor: (p) => getProviderStats(p).rating },
      { label: 'Total Jobs Completed', accessor: (p) => getProviderStats(p).completedCount },
      { label: 'Total Earnings (INR)', accessor: (p) => getProviderStats(p).revenue },
      { label: 'Service Location', accessor: (p) => p.location || 'N/A' },
      { label: 'Online Status', accessor: (p) => (p.is_online ? 'ONLINE' : 'OFFLINE') },
    ];
    exportToCSV('Zevota_Field_Partners_Report', columns, providers);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerWithBtn}>
        <View>
          <Text style={styles.title}>Field Partner Management</Text>
          <Text style={styles.subtitle}>Approve, review, and track certified service technicians.</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
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
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 12.5 }}>Export Partners (Excel/CSV)</Text>
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

        {providers.map((p, idx) => {
          const stats = getProviderStats(p);
          return (
            <View key={idx} style={styles.tableRow}>
              <TouchableOpacity style={{ flex: 1.5 }} onPress={() => handleOpenDetailModal(p)} onClick={() => handleOpenDetailModal(p)} activeOpacity={0.7}>
                <Text style={[styles.tdBold, { color: '#7c3aed' }]}>{p.name}</Text>
              </TouchableOpacity>
              <Text style={[styles.td, { flex: 1.2 }]}>{p.phone}</Text>
              <View style={{ flex: 0.9 }}>
                <View style={[styles.statusPill, p.is_online !== false ? styles.activePill : styles.offlinePill]}>
                  <Text style={[styles.statusPillText, p.is_online !== false ? styles.activePillText : styles.offlinePillText]}>
                    {p.is_online !== false ? 'ACTIVE' : 'OFFLINE'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.td, { flex: 0.9, color: '#d97706', fontWeight: '800' }]}>★ {stats.rating}</Text>
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

      {/* ADD FIELD PARTNER MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editId ? 'Edit Field Partner' : 'Add Certified Field Partner'}</Text>
            
            <Text style={styles.inputLabel}>Partner Name</Text>
            <TextInput style={styles.textInput} value={partnerName} onChangeText={setPartnerName} placeholder="e.g. Ramesh Kumar" />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput style={styles.textInput} value={partnerPhone} onChangeText={setPartnerPhone} placeholder="e.g. +91 99887 76655" />

            <Text style={styles.inputLabel}>Location Service Area</Text>
            <TextInput style={styles.textInput} value={partnerLocation} onChangeText={setPartnerLocation} placeholder="e.g. Bandra West, Mumbai" />

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
              <Text style={styles.addCatalogBtnText}>➕ Add Category</Text>
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
              <Text style={styles.addCatalogBtnText}>➕ Add Sub-Category</Text>
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
              <Text style={styles.addCatalogBtnText}>➕ Add Service</Text>
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
});
