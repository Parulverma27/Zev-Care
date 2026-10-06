import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AppIcon } from '../../components/AppIcons';
import GoogleMapsLocationPicker from '../../components/GoogleMapsLocationPicker';
import { normalizeSavedAddresses } from '../../utils/savedAddresses';

const TAG_ICONS = {
  Home: 'home',
  Office: 'building',
  Other: 'map-pin',
  Parents: 'users',
  Gym: 'dumbbell',
};

const TAG_COLORS = {
  'Home': '#3b82f6',
  'Office': '#10b981',
  'Other': '#6366f1',
  'Parents': '#f59e0b',
  'Gym': '#ec4899'
};

export default function SavedAddressesScreen({ onNavigate }) {
  const { activeUser, updateProfile, validateServiceLocation } = useApp();
  const navigate = useNavigate();

  const isAnonymous = Boolean(
    !activeUser ||
    activeUser.isAnonymous ||
    (activeUser.isGuest && !activeUser.phone) ||
    (!activeUser.phone && !activeUser.guestId)
  );

  const isGuest = Boolean(
    activeUser?.isGuest ||
    activeUser?.id === 0 ||
    activeUser?.name === 'Guest User' ||
    isAnonymous
  );

  // Guest accounts have no saved addresses and cannot edit
  const addresses = isGuest ? [] : (activeUser?.saved_addresses || []);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleNav = (path) => {
    if (navigate) navigate(path);
    else if (onNavigate) onNavigate(path);
  };

  const handleGoBack = () => {
    if (window?.history?.state && window.history.state.idx > 0) {
      if (navigate) navigate(-1);
      else if (onNavigate) onNavigate(-1);
    } else {
      handleNav('/user/profile');
    }
  };

  const updateSavedAddresses = (updatedList) => {
    if (isGuest || !activeUser || !updateProfile) {
      if (isGuest) setShowGuestModal(true);
      return;
    }
    const normalized = normalizeSavedAddresses(updatedList);
    const defaultAddress = normalized.find((a) => a.isDefault)?.address || '';
    updateProfile({
      ...activeUser,
      saved_addresses: normalized,
      address: defaultAddress || activeUser.address,
    });
  };

  const handleAddOrSave = () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    if (!newAddress.trim()) return;

    let updatedList;
    if (editingId !== null) {
      updatedList = addresses.map(a =>
        a.id === editingId ? { ...a, tag: newTag || a.tag, address: newAddress } : a
      );
      setEditingId(null);
    } else {
      const isFirst = addresses.length === 0;
      updatedList = [
        ...addresses,
        {
          id: Date.now(),
          tag: newTag || 'Other',
          address: newAddress,
          isDefault: isFirst
        }
      ];
    }

    updateSavedAddresses(updatedList);
    setNewTag('');
    setNewAddress('');
    setShowAddForm(false);
  };

  const handleSetDefault = (id) => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    const updatedList = addresses.map(a => ({
      ...a,
      isDefault: a.id === id
    }));
    updateSavedAddresses(updatedList);
  };

  const handleDelete = (id) => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    const updatedList = addresses.filter(a => a.id !== id);
    // If we deleted the default, set first remaining as default
    if (updatedList.length > 0 && !updatedList.some(a => a.isDefault)) {
      updatedList[0].isDefault = true;
    }
    updateSavedAddresses(updatedList);
  };

  const handleEdit = (item) => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    setEditingId(item.id);
    setNewTag(item.tag);
    setNewAddress(item.address);
    setShowAddForm(true);
  };

  const TAG_OPTIONS = ['Home', 'Office', 'Other', 'Parents', 'Gym'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.7}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F1F3D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </TouchableOpacity>
        <View style={{ flex: 1, paddingLeft: 14 }}>
          <Text style={styles.headerTitle}>Saved Addresses</Text>
          <Text style={styles.headerSubtitle}>Manage your verified service locations</Text>
        </View>
      </View>

      {/* Address Cards */}
      <View style={styles.cardGroup}>
        {addresses.map((item) => {
          const iconName = TAG_ICONS[item.tag] || 'map-pin';
          const themeColor = TAG_COLORS[item.tag] || '#6366f1';

          return (
            <View key={item.id} style={[styles.addrCard, item.isDefault && styles.addrCardDefault]}>
              
              {/* Absolute Star Action on Top-Right */}
              <TouchableOpacity
                style={[styles.starActionBtn, item.isDefault && styles.starActionBtnActive]}
                onPress={() => !item.isDefault && handleSetDefault(item.id)}
                activeOpacity={0.7}
                disabled={item.isDefault}
              >
                {item.isDefault ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                )}
              </TouchableOpacity>

              <View style={styles.addrCardTop}>
                <View style={[styles.pinIconWrap, { backgroundColor: item.isDefault ? '#eff6ff' : '#f8fafc' }]}>
                  <AppIcon name={iconName} size={18} color={themeColor} />
                </View>
                <View style={{ flex: 1, paddingRight: 44 }}>
                  <View style={styles.tagRow}>
                    <Text style={[styles.addrTag, { color: themeColor }]}>{item.tag}</Text>
                    {item.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Primary</Text>
                      </View>
                    )}
                    {(() => {
                      const cov = validateServiceLocation ? validateServiceLocation(item.address) : { isSupported: true };
                      return cov.isSupported ? (
                        <View style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#bbf7d0' }}>
                          <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#16a34a' }}>Coverage Verified ✅</Text>
                        </View>
                      ) : (
                        <View style={{ backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#fecaca' }}>
                          <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#dc2626' }}>Out of Coverage ⚠️</Text>
                        </View>
                      );
                    })()}
                  </View>
                  <Text style={styles.addrText}>{item.address}</Text>
                </View>
              </View>

              {/* Both edit and delete buttons are now perfectly aligned under every card */}
              <View style={styles.addrActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)} activeOpacity={0.7}>
                  <View style={styles.actionBtnInner}>
                    <AppIcon name="edit" size={14} color="#2563eb" />
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id)} activeOpacity={0.7}>
                  <View style={styles.actionBtnInner}>
                    <AppIcon name="trash" size={14} color="#dc2626" />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* If guest or no addresses, show message */}
      {isGuest ? (
        <View style={styles.guestLockedCard}>
          <View style={styles.guestIconCircle}>
            <AppIcon name="lock" size={26} color="#B45309" strokeWidth={2.2} />
          </View>
          <Text style={styles.guestLockedTitle}>Guest Mode</Text>
          <Text style={styles.guestLockedDesc}>
            Saving, updating, and setting default addresses is reserved for registered accounts. Please register or log in to manage your addresses.
          </Text>
          <TouchableOpacity
            style={styles.guestRegisterBtn}
            onPress={() => setShowGuestModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.guestRegisterBtnText}>Register / Sign In</Text>
          </TouchableOpacity>
        </View>
      ) : showAddForm ? (
        <View style={styles.addForm}>
          <Text style={styles.addFormTitle}>{editingId ? 'Modify Saved Location' : 'Register New Location'}</Text>

          <Text style={styles.formLabel}>Address Tag / Category</Text>
          <View style={styles.tagChoiceRow}>
            {TAG_OPTIONS.map(t => {
              const active = newTag === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagChip, active && styles.tagChipActive]}
                  onPress={() => setNewTag(t)}
                  activeOpacity={0.7}
                >
                  <AppIcon name={TAG_ICONS[t]} size={12} color={active ? '#2563eb' : '#64748b'} />
                  <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Map Location Picker Trigger */}
          <TouchableOpacity
            style={styles.mapPickerBtn}
            onPress={() => setShowMapPicker(!showMapPicker)}
            activeOpacity={0.8}
          >
            <AppIcon name="map-pin" size={14} color="#2563eb" />
            <Text style={styles.mapPickerBtnText}>{showMapPicker ? 'Hide Google Map' : 'Detect / Pick Location on Google Map'}</Text>
          </TouchableOpacity>

          {showMapPicker && (
            <GoogleMapsLocationPicker
              initialAddress={newAddress}
              onSelectLocation={(loc) => {
                setNewAddress(loc.address);
                setShowMapPicker(false);
              }}
              onClose={() => setShowMapPicker(false)}
            />
          )}

          <Text style={styles.formLabel}>Complete Physical Address</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={3}
              value={newAddress}
              onChangeText={setNewAddress}
              placeholder="Flat No., Building Name, Sector/Area, Landmark, City & Pincode..."
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.formBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddForm(false); setEditingId(null); setNewTag(''); setNewAddress(''); }} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Dismiss</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddOrSave} activeOpacity={0.85}>
              <Text style={styles.saveBtnText}>{editingId ? 'Update & Sync' : 'Confirm & Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.addNewBtn} onPress={() => { setShowAddForm(true); setEditingId(null); setNewTag('Home'); setNewAddress(''); }} activeOpacity={0.85}>
          <Text style={{ fontSize: 18, color: '#2563eb', fontWeight: '800' }}>＋</Text>
          <Text style={styles.addNewBtnText}>Create New Verified Location</Text>
        </TouchableOpacity>
      )}

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>✨ Locations saved here are shared securely with verified technician dispatchers for prompt servicing.</Text>
      </View>

      {/* Registration Required Modal */}
      <Modal
        visible={showGuestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGuestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.guestCloseBtn}
              onPress={() => setShowGuestModal(false)}
              accessibilityLabel="Close modal"
            >
              <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>

            <View style={styles.guestIconCircle}>
              <AppIcon name="lock" size={26} color="#B45309" strokeWidth={2.2} />
            </View>

            <Text style={styles.modalTitle}>
              {isAnonymous ? 'Register First' : 'Complete Your Profile First'}
            </Text>
            <Text style={styles.modalSub}>
              {isAnonymous
                ? 'Please register your account first to save and manage service addresses.'
                : 'Please complete your profile to add, save, and manage your service addresses.'}
            </Text>

            <TouchableOpacity
              style={styles.primaryModalBtn}
              onPress={() => {
                setShowGuestModal(false);
                if (navigate) navigate('/user/register');
                else if (onNavigate) onNavigate('/user/register');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryModalBtnText}>
                {isAnonymous ? 'Register First →' : 'Complete Your Profile →'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestOutlineBtn}
              onPress={() => {
                setShowGuestModal(false);
                if (navigate) navigate('/user/login');
                else if (onNavigate) onNavigate('/user/login');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.guestOutlineBtnText}>Already have an account? Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F7FF' },
  content: { padding: 18, gap: 16 },

  topHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1.2, borderColor: '#D7E3F5', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(15,31,61,0.04)' },
  backArrow: { fontSize: 20, color: '#0F1F3D', fontWeight: '700', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F1F3D', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif", letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 12, color: '#64748B', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif", marginTop: 1 },

  cardGroup: { gap: 14 },
  addrCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1.2, borderColor: '#E2E8F0', boxShadow: '0 2px 10px rgba(15,31,61,0.02)', position: 'relative' },
  addrCardDefault: { borderColor: '#BFDBFE', backgroundColor: '#F5F9FF', boxShadow: '0 4px 12px rgba(37,99,235,0.04)' },

  // Top Right Star button to toggle/set primary address
  starActionBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    display: 'flex',
    zIndex: 10,
  },
  starActionBtnActive: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },

  addrCardTop: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  pinIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', display: 'flex', flexShrink: 0, borderWidth: 1, borderColor: '#E2E8F0' },
  tagRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, rowGap: 4, marginBottom: 6 },
  addrTag: { fontSize: 14, fontWeight: '800', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif", textTransform: 'uppercase', letterSpacing: 0.3 },
  defaultBadge: { backgroundColor: '#2563EB', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  defaultBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.2, fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  addrText: { fontSize: 13, color: '#334155', lineHeight: 20, fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif", fontWeight: '500' },

  // Bottom action buttons: exactly 2 aligned buttons per card now
  addrActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  actionBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '750', color: '#475569', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  deleteBtn: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' },
  deleteBtnText: { fontSize: 12, fontWeight: '750', color: '#DC2626', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },

  addNewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ffffff', borderRadius: 16, paddingVertical: 15, borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed' },
  addNewBtnText: { fontSize: 13.5, fontWeight: '800', color: '#2563EB', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },

  addForm: { backgroundColor: '#ffffff', borderRadius: 24, padding: 18, borderWidth: 1.2, borderColor: '#D7E3F5', gap: 14, boxShadow: '0 8px 24px rgba(15,31,61,0.06)' },
  addFormTitle: { fontSize: 16.5, fontWeight: '800', color: '#0F1F3D', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif", letterSpacing: -0.3 },
  formLabel: { fontSize: 12.5, fontWeight: '700', color: '#475569', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif", marginTop: 4 },
  tagChoiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1.2, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagChipActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  tagChipText: { fontSize: 12, fontWeight: '700', color: '#475569', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  tagChipTextActive: { color: '#2563EB' },

  inputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 4,
  },
  mapPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingVertical: 10,
    cursor: 'pointer',
    marginVertical: 4,
  },
  mapPickerBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2563eb',
    fontFamily: 'Inter, sans-serif',
  },
  textInput: { fontSize: 13, color: '#0F1F3D', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif", outlineStyle: 'none', minHeight: 80, lineHeight: 18 },

  formBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: '#475569', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  saveBtn: { flex: 2, backgroundColor: '#2563EB', paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 13, fontWeight: '800', color: '#ffffff', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },

  infoBanner: { backgroundColor: '#EFF6FF', borderRadius: 16, padding: 14, borderWidth: 1.2, borderColor: '#BFDBFE' },
  infoBannerText: { fontSize: 12, color: '#1E40AF', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif", lineHeight: 18, fontWeight: '500' },

  guestLockedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    gap: 12,
  },
  guestLockedTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter, sans-serif',
  },
  guestLockedDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    fontFamily: 'Inter, sans-serif',
  },
  guestRegisterBtn: {
    backgroundColor: '#0052E0',
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 12,
    marginTop: 4,
  },
  guestRegisterBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: 14,
    position: 'relative',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
  },
  guestCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  guestIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter, sans-serif',
  },
  primaryModalBtn: {
    backgroundColor: '#0052E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryModalBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13.5,
    fontFamily: 'Inter, sans-serif',
  },
  guestOutlineBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestOutlineBtnText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 13,
    fontFamily: 'Inter, sans-serif',
  },
});
