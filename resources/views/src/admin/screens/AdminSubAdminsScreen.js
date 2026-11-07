import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

// Real Vector SVG Icons (No Emojis)
const CrownIcon = ({ color = '#2563eb', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

const UserIcon = ({ color = '#64748b', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const EyeIcon = ({ color = '#1d4ed8', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EditIcon = ({ color = '#3b82f6', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const TrashIcon = ({ color = '#dc2626', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const CheckIcon = ({ color = '#ffffff', size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PlusIcon = ({ color = '#ffffff', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const LockIcon = ({ color = '#64748b', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CloseIcon = ({ color = '#94a3b8', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const AVAILABLE_CATEGORIES = [
  'Electrical',
  'Plumbing',
  'AC Services',
  'Carpentry',
  'Cleaning',
  'Pest Control',
  'Appliances',
];

const CATEGORY_COLORS = {
  'Electrical': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  'Plumbing': { bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
  'AC Services': { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
  'Carpentry': { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  'Pest Control': { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  'Cleaning': { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
  'Appliances': { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' },
};

export default function AdminSubAdminsScreen() {
  const navigate = useNavigate();
  const {
    adminUser,
    subAdmins = [],
    addSubAdmin,
    updateSubAdmin,
    deleteSubAdmin,
    toggleSubAdminStatus,
    switchAdminAccount,
  } = useApp() || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    status: 'ACTIVE',
    assigned_categories: ['Electrical'],
    permissions: {
      can_dispatch_partners: true,
      can_approve_estimates: true,
      can_manage_catalog_rates: true,
      can_resolve_complaints: true,
    },
  });

  const openAddModal = () => {
    setEditingSubAdmin(null);
    setActionError('');
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      status: 'ACTIVE',
      assigned_categories: ['Electrical'],
      permissions: {
        can_dispatch_partners: true,
        can_approve_estimates: true,
        can_manage_catalog_rates: true,
        can_resolve_complaints: true,
      },
    });
    setIsModalOpen(true);
  };

  const openEditModal = (subAdmin) => {
    setEditingSubAdmin(subAdmin);
    setActionError('');
    setFormData({
      name: subAdmin.name || '',
      email: subAdmin.email || '',
      password: '', // blank means keep unchanged
      phone: subAdmin.phone || '',
      status: subAdmin.status || 'ACTIVE',
      assigned_categories: Array.isArray(subAdmin.assigned_categories)
        ? [...subAdmin.assigned_categories]
        : ['Electrical'],
      permissions: {
        can_dispatch_partners: !!subAdmin.permissions?.can_dispatch_partners,
        can_approve_estimates: !!subAdmin.permissions?.can_approve_estimates,
        can_manage_catalog_rates: !!subAdmin.permissions?.can_manage_catalog_rates,
        can_resolve_complaints: !!subAdmin.permissions?.can_resolve_complaints,
      },
    });
    setIsModalOpen(true);
  };

  const toggleCategorySelection = (cat) => {
    setFormData((prev) => {
      const exists = prev.assigned_categories.includes(cat);
      if (exists) {
        if (prev.assigned_categories.length <= 1) return prev; // Keep at least one
        return {
          ...prev,
          assigned_categories: prev.assigned_categories.filter((c) => c !== cat),
        };
      } else {
        return {
          ...prev,
          assigned_categories: [...prev.assigned_categories, cat],
        };
      }
    });
  };

  const togglePermission = (permKey) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permKey]: !prev.permissions[permKey],
      },
    }));
  };

  const handleSaveSubAdmin = async () => {
    setActionError('');
    if (!formData.name.trim() || !formData.email.trim()) {
      setActionError('Please enter sub-admin name and email.');
      return;
    }
    if (!editingSubAdmin && (!formData.password || formData.password.length < 4)) {
      setActionError('Please provide a secure initial password (minimum 4 characters).');
      return;
    }
    if (formData.assigned_categories.length === 0) {
      setActionError('Please assign at least one category vertical.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSubAdmin) {
        if (typeof updateSubAdmin === 'function') {
          const payload = { ...formData };
          if (!payload.password) delete payload.password;
          await updateSubAdmin(editingSubAdmin.id, payload);
        }
      } else {
        if (typeof addSubAdmin === 'function') {
          await addSubAdmin(formData);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      setActionError(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchPersona = (subAdmin) => {
    if (typeof switchAdminAccount === 'function') {
      switchAdminAccount(subAdmin);
      navigate('/admin/bookings');
    }
  };

  // Filter Sub-Admins
  const filteredSubAdmins = subAdmins.filter((sa) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      sa.name?.toLowerCase().includes(q) ||
      sa.email?.toLowerCase().includes(q) ||
      sa.phone?.toLowerCase().includes(q) ||
      sa.assigned_categories?.some((c) => c.toLowerCase().includes(q));

    const matchCategory =
      selectedCategoryFilter === 'ALL' ||
      sa.assigned_categories?.includes(selectedCategoryFilter);

    return matchQuery && matchCategory;
  });

  const totalActive = subAdmins.filter((sa) => sa.status === 'ACTIVE').length;
  const uniqueCoveredCategories = new Set(
    subAdmins.filter((sa) => sa.status === 'ACTIVE').flatMap((sa) => sa.assigned_categories || [])
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Category Sub-Admin Operations</Text>
          <Text style={styles.headerSubtitle}>
            Delegate vertical-specific tasks, partners, and bookings to dedicated departmental managers.
          </Text>
        </View>
        <TouchableOpacity style={styles.primaryAddBtn} onPress={openAddModal}>
          <PlusIcon color="#ffffff" size={14} />
          <Text style={styles.primaryAddBtnText}>Create New Sub-Admin</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Summary Cards */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Total Sub-Admins</Text>
          <Text style={styles.kpiValue}>{subAdmins.length}</Text>
          <Text style={styles.kpiSub}>Registered vertical leads</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Active Managers</Text>
          <Text style={[styles.kpiValue, { color: '#059669' }]}>{totalActive}</Text>
          <Text style={styles.kpiSub}>Currently managing operations</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Covered Verticals</Text>
          <Text style={[styles.kpiValue, { color: '#2563eb' }]}>
            {uniqueCoveredCategories.size} / {AVAILABLE_CATEGORIES.length}
          </Text>
          <Text style={styles.kpiSub}>Categories under oversight</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Current Admin Session</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4 }}>
            {adminUser?.role === 'SUPER_ADMIN' ? (
              <CrownIcon color="#2563eb" size={16} />
            ) : (
              <UserIcon color="#059669" size={16} />
            )}
            <Text style={[styles.kpiValue, { fontSize: 16, color: '#1e293b', marginVertical: 0 }]} numberOfLines={1}>
              {adminUser?.role === 'SUPER_ADMIN' ? 'Super Admin' : (adminUser?.name || 'Sub-Admin')}
            </Text>
          </View>
          <Text style={styles.kpiSub}>
            {adminUser?.role === 'SUPER_ADMIN'
              ? 'Unrestricted omni-category view'
              : (adminUser?.assigned_categories || []).join(', ')}
          </Text>
        </View>
      </View>

      {/* Filter and Search Bar */}
      <View style={styles.toolbarRow}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search sub-admin name, email, phone, category..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <CloseIcon color="#94a3b8" size={14} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilterScroll}>
          <TouchableOpacity
            style={[styles.catFilterChip, selectedCategoryFilter === 'ALL' && styles.catFilterChipActive]}
            onPress={() => setSelectedCategoryFilter('ALL')}
          >
            <Text
              style={[
                styles.catFilterChipText,
                selectedCategoryFilter === 'ALL' && styles.catFilterChipTextActive,
              ]}
            >
              All Verticals ({subAdmins.length})
            </Text>
          </TouchableOpacity>
          {AVAILABLE_CATEGORIES.map((cat) => {
            const count = subAdmins.filter((sa) => sa.assigned_categories?.includes(cat)).length;
            const isActive = selectedCategoryFilter === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catFilterChip, isActive && styles.catFilterChipActive]}
                onPress={() => setSelectedCategoryFilter(cat)}
              >
                <Text style={[styles.catFilterChipText, isActive && styles.catFilterChipTextActive]}>
                  {cat} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Directory Table */}
      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.thCell, { flex: 2 }]}>SUB-ADMIN / CONTACT</Text>
          <Text style={[styles.thCell, { flex: 2.2 }]}>ASSIGNED CATEGORIES</Text>
          <Text style={[styles.thCell, { flex: 2.5 }]}>OPERATIONAL PERMISSIONS</Text>
          <Text style={[styles.thCell, { flex: 1, textAlign: 'center' }]}>STATUS</Text>
          <Text style={[styles.thCell, { flex: 2.3, textAlign: 'right' }]}>ACTIONS</Text>
        </View>

        <ScrollView style={styles.tableBody}>
          {filteredSubAdmins.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Sub-Admins Found</Text>
              <Text style={styles.emptyStateSub}>
                Try adjusting your search criteria or create a new category sub-admin.
              </Text>
            </View>
          ) : (
            filteredSubAdmins.map((sa) => {
              const isCurrentSession = adminUser?.id === sa.id;
              const initials = (sa.name || 'SA')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <View key={sa.id} style={[styles.tableRow, isCurrentSession && styles.activeSessionRow]}>
                  {/* Name & Contact */}
                  <View style={[styles.tdCell, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.saName}>{sa.name}</Text>
                        {isCurrentSession && (
                          <View style={styles.currentSessionBadge}>
                            <Text style={styles.currentSessionBadgeText}>CURRENT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.saEmail} numberOfLines={1}>{sa.email}</Text>
                      <Text style={styles.saPhone}>{sa.phone || 'No phone'}</Text>
                    </View>
                  </View>

                  {/* Assigned Categories */}
                  <View style={[styles.tdCell, { flex: 2.2, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }]}>
                    {(sa.assigned_categories || []).map((cat) => {
                      const theme = CATEGORY_COLORS[cat] || {
                        bg: '#f1f5f9',
                        text: '#475569',
                        border: '#cbd5e1',
                      };
                      return (
                        <View
                          key={cat}
                          style={[
                            styles.categoryBadge,
                            { backgroundColor: theme.bg, borderColor: theme.border },
                          ]}
                        >
                          <Text style={[styles.categoryBadgeText, { color: theme.text }]}>
                            {cat}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Permissions */}
                  <View style={[styles.tdCell, { flex: 2.5, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }]}>
                    {sa.permissions?.can_dispatch_partners && (
                      <View style={styles.permPill}>
                        <CheckIcon color="#059669" size={10} />
                        <Text style={styles.permPillText}>Dispatch Partners</Text>
                      </View>
                    )}
                    {sa.permissions?.can_approve_estimates && (
                      <View style={styles.permPill}>
                        <CheckIcon color="#059669" size={10} />
                        <Text style={styles.permPillText}>Approve Estimates</Text>
                      </View>
                    )}
                    {sa.permissions?.can_manage_catalog_rates && (
                      <View style={styles.permPill}>
                        <CheckIcon color="#059669" size={10} />
                        <Text style={styles.permPillText}>Manage Rates</Text>
                      </View>
                    )}
                    {sa.permissions?.can_resolve_complaints && (
                      <View style={styles.permPill}>
                        <CheckIcon color="#059669" size={10} />
                        <Text style={styles.permPillText}>Resolve Complaints</Text>
                      </View>
                    )}
                  </View>

                  {/* Status */}
                  <View style={[styles.tdCell, { flex: 1, alignItems: 'center' }]}>
                    <TouchableOpacity
                      onPress={() => toggleSubAdminStatus && toggleSubAdminStatus(sa.id)}
                      style={[
                        styles.statusBadge,
                        sa.status === 'ACTIVE' ? styles.statusBadgeActive : styles.statusBadgeInactive,
                      ]}
                      title="Click to toggle status"
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          sa.status === 'ACTIVE'
                            ? styles.statusBadgeTextActive
                            : styles.statusBadgeTextInactive,
                        ]}
                      >
                        {sa.status}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Actions */}
                  <View style={[styles.tdCell, { flex: 2.3, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }]}>
                    <TouchableOpacity
                      style={styles.switchPersonaBtn}
                      onPress={() => handleSwitchPersona(sa)}
                      title="Experience portal as this Sub-Admin"
                    >
                      <EyeIcon color="#1d4ed8" size={13} />
                      <Text style={styles.switchPersonaBtnText}>View Scoped</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => openEditModal(sa)}
                      title="Edit Sub-Admin"
                    >
                      <EditIcon color="#3b82f6" size={14} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionIconBtn, { borderColor: '#fee2e2' }]}
                      onPress={() => {
                        if (window.confirm(`Delete sub-admin ${sa.name}?`)) {
                          deleteSubAdmin && deleteSubAdmin(sa.id);
                        }
                      }}
                      title="Delete Sub-Admin"
                    >
                      <TrashIcon color="#dc2626" size={14} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Add / Edit Modal */}
      <Modal visible={isModalOpen} transparent animationType="fade" onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingSubAdmin ? 'Edit Category Sub-Admin' : 'Create Category Sub-Admin'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Configure credentials, assigned categories, and permission boundaries.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} style={styles.modalCloseBtn}>
                <CloseIcon color="#94a3b8" size={16} />
              </TouchableOpacity>
            </View>

            {!!actionError && (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{actionError}</Text>
              </View>
            )}

            <ScrollView style={styles.modalFormScroll}>
              {/* Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Ramesh Gupta"
                  placeholderTextColor="#94a3b8"
                  value={formData.name}
                  onChangeText={(val) => setFormData((p) => ({ ...p, name: val }))}
                />
              </View>

              {/* Email & Phone */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Email Address *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="ramesh@zevotacare.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(val) => setFormData((p) => ({ ...p, email: val }))}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.formLabel}>Mobile Number</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="+91 98112 XXXXX"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(val) => setFormData((p) => ({ ...p, phone: val }))}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <LockIcon color="#475569" size={13} />
                  <Text style={styles.formLabel}>
                    {editingSubAdmin ? 'New Password (Optional)' : 'Login Password *'}
                  </Text>
                </View>
                <TextInput
                  style={styles.formInput}
                  placeholder={editingSubAdmin ? 'Leave blank to keep existing password' : 'Enter login password for this sub-admin'}
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(val) => setFormData((p) => ({ ...p, password: val }))}
                />
                <Text style={styles.formHelp}>
                  {editingSubAdmin
                    ? 'Only provide a new password if you want to reset credentials for this sub-admin.'
                    : 'The sub-admin will use this password along with their email address to log into their portal.'}
                </Text>
              </View>

              {/* Category Assignment Chips */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Assigned Verticals * ({formData.assigned_categories.length} selected)
                </Text>
                <Text style={styles.formHelp}>
                  This manager will strictly see bookings, consultations, providers, and rates for these categories.
                </Text>
                <View style={styles.categoryChipsContainer}>
                  {AVAILABLE_CATEGORIES.map((cat) => {
                    const isSelected = formData.assigned_categories.includes(cat);
                    const theme = CATEGORY_COLORS[cat] || {
                      bg: '#f1f5f9',
                      text: '#475569',
                      border: '#cbd5e1',
                    };
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => toggleCategorySelection(cat)}
                        style={[
                          styles.categorySelectChip,
                          isSelected && {
                            backgroundColor: theme.bg,
                            borderColor: theme.border,
                            borderWidth: 2,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categorySelectChipText,
                            isSelected && { color: theme.text, fontWeight: '700' },
                          ]}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Permissions */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Operational Capabilities</Text>
                <View style={styles.permissionList}>
                  <TouchableOpacity
                    style={styles.permCheckboxRow}
                    onPress={() => togglePermission('can_dispatch_partners')}
                  >
                    <View
                      style={[
                        styles.checkboxBox,
                        formData.permissions.can_dispatch_partners && styles.checkboxBoxActive,
                      ]}
                    >
                      {formData.permissions.can_dispatch_partners && (
                        <CheckIcon color="#ffffff" size={10} />
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.permTitle}>Field Partner Dispatch & Reassignment</Text>
                      <Text style={styles.permSub}>
                        Allows allocating category jobs and tracking partner arrival on site.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.permCheckboxRow}
                    onPress={() => togglePermission('can_approve_estimates')}
                  >
                    <View
                      style={[
                        styles.checkboxBox,
                        formData.permissions.can_approve_estimates && styles.checkboxBoxActive,
                      ]}
                    >
                      {formData.permissions.can_approve_estimates && (
                        <CheckIcon color="#ffffff" size={10} />
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.permTitle}>Estimate & Extra Charges Approval</Text>
                      <Text style={styles.permSub}>
                        Authorize technician estimates and customer additional work orders.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.permCheckboxRow}
                    onPress={() => togglePermission('can_manage_catalog_rates')}
                  >
                    <View
                      style={[
                        styles.checkboxBox,
                        formData.permissions.can_manage_catalog_rates && styles.checkboxBoxActive,
                      ]}
                    >
                      {formData.permissions.can_manage_catalog_rates && (
                        <CheckIcon color="#ffffff" size={10} />
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.permTitle}>Catalog Price Adjustments</Text>
                      <Text style={styles.permSub}>
                        Update service rates and spare parts pricing for assigned verticals.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.permCheckboxRow}
                    onPress={() => togglePermission('can_resolve_complaints')}
                  >
                    <View
                      style={[
                        styles.checkboxBox,
                        formData.permissions.can_resolve_complaints && styles.checkboxBoxActive,
                      ]}
                    >
                      {formData.permissions.can_resolve_complaints && (
                        <CheckIcon color="#ffffff" size={10} />
                      )}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.permTitle}>Ticket Resolution & Escalations</Text>
                      <Text style={styles.permSub}>
                        Address user complaints and diagnosis questions in My Mechanic console.
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Status */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Account Status</Text>
                <View style={styles.statusToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      formData.status === 'ACTIVE' && styles.statusToggleBtnActive,
                    ]}
                    onPress={() => setFormData((p) => ({ ...p, status: 'ACTIVE' }))}
                  >
                    <Text
                      style={[
                        styles.statusToggleBtnText,
                        formData.status === 'ACTIVE' && styles.statusToggleBtnTextActive,
                      ]}
                    >
                      Active
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      formData.status === 'INACTIVE' && styles.statusToggleBtnInactive,
                    ]}
                    onPress={() => setFormData((p) => ({ ...p, status: 'INACTIVE' }))}
                  >
                    <Text
                      style={[
                        styles.statusToggleBtnText,
                        formData.status === 'INACTIVE' && styles.statusToggleBtnTextInactive,
                      ]}
                    >
                      Suspended / Inactive
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSaveSubAdmin}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingSubAdmin ? 'Update Sub-Admin' : 'Create Sub-Admin'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8fafc' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  headerSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  primaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#2563eb',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryAddBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  kpiGrid: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kpiLabel: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  kpiValue: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginVertical: 4 },
  kpiSub: { fontSize: 11, color: '#94a3b8' },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  searchBox: {
    width: 320,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0f172a' },
  clearBtn: { padding: 4 },
  categoryFilterScroll: { flex: 1 },
  catFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  catFilterChipActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  catFilterChipText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  catFilterChipTextActive: { color: '#2563eb', fontWeight: '700' },
  tableCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  thCell: { fontSize: 11, fontWeight: '700', color: '#475569', letterSpacing: 0.5 },
  tableBody: { flex: 1 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activeSessionRow: { backgroundColor: '#f0fdf4' },
  tdCell: { justifyContent: 'center' },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#1d4ed8' },
  saName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  currentSessionBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentSessionBadgeText: { fontSize: 9, fontWeight: '700', color: '#166534' },
  saEmail: { fontSize: 12, color: '#64748b', marginTop: 1 },
  saPhone: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryBadgeText: { fontSize: 11, fontWeight: '600' },
  permPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  permPillText: { fontSize: 10, color: '#334155' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusBadgeActive: { backgroundColor: '#dcfce7' },
  statusBadgeInactive: { backgroundColor: '#f1f5f9' },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  statusBadgeTextActive: { color: '#15803d' },
  statusBadgeTextInactive: { color: '#64748b' },
  switchPersonaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  switchPersonaBtnText: { fontSize: 11, fontWeight: '600', color: '#1d4ed8' },
  actionIconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyStateTitle: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 6 },
  emptyStateSub: { fontSize: 13, color: '#94a3b8' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  modalCloseBtn: { padding: 4 },
  modalErrorBox: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 4,
  },
  modalErrorText: { color: '#dc2626', fontSize: 12, fontWeight: '600' },
  modalFormScroll: { padding: 20 },
  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: 'row' },
  formLabel: { fontSize: 12, fontWeight: '600', color: '#334155', marginBottom: 6 },
  formHelp: { fontSize: 11, color: '#64748b', marginBottom: 8 },
  formInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  categoryChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categorySelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  categorySelectChipText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  permissionList: { gap: 10 },
  permCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#94a3b8',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxBoxActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  permTitle: { fontSize: 12, fontWeight: '600', color: '#1e293b' },
  permSub: { fontSize: 11, color: '#64748b', marginTop: 1 },
  statusToggleRow: { flexDirection: 'row', gap: 12 },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  statusToggleBtnActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  statusToggleBtnInactive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  statusToggleBtnText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  statusToggleBtnTextActive: { color: '#15803d' },
  statusToggleBtnTextInactive: { color: '#dc2626' },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  saveBtn: {
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#2563eb',
  },
  saveBtnText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },
});
