import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform, useWindowDimensions } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AppIcon } from '../../components/AppIcons';
import GoogleMapsLocationPicker from '../../components/GoogleMapsLocationPicker';
import { normalizeSavedAddresses, upsertDefaultAddress, ADDRESS_CATEGORIES, isAddressEditable, normalizeTag } from '../../utils/savedAddresses';

const TAG_ICONS = {
  'Independent house/floor': 'home',
  Villa: 'villa',
  PG: 'pg',
  'Rented home/floor': 'home',
};

const TAG_COLORS = {
  'Independent house/floor': '#2563eb',
  Villa: '#7c3aed',
  PG: '#059669',
  'Rented home/floor': '#d97706',
};

const CATEGORY_DISPLAY_NAMES = {
  'Independent house/floor': 'Independent House/Floor',
  Villa: 'Private Villa',
  PG: 'Paying Guest (PG)',
  'Rented home/floor': 'Rented Home/Floor',
};

const CATEGORY_BG_COLORS = {
  'Independent house/floor': '#EFF6FF',
  Villa: '#F5F3FF',
  PG: '#ECFDF5',
  'Rented home/floor': '#FFFBEB',
};

const CATEGORY_BORDER_COLORS = {
  'Independent house/floor': '#BFDBFE',
  Villa: '#DDD6FE',
  PG: '#A7F3D0',
  'Rented home/floor': '#FDE68A',
};

function formatAddressParts(addrStr) {
  if (!addrStr) return { premise: '', locality: '' };
  const parts = addrStr.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 2) {
    return { premise: addrStr, locality: '' };
  }
  const premise = parts.slice(0, 2).join(', ');
  const locality = parts.slice(2).join(', ');
  return { premise, locality };
}

export default function SavedAddressesScreen({ onNavigate }) {
  const { activeUser, updateProfile, validateServiceLocation } = useApp();
  const navigate = useNavigate();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const isAnonymous = Boolean(
    !activeUser ||
    activeUser.isAnonymous ||
    (!activeUser.phone && !activeUser.guestId && !activeUser.name)
  );

  const isGuest = Boolean(
    activeUser?.isGuest ||
    activeUser?.id === 0 ||
    activeUser?.name === 'Guest User'
  );

  // Derive addresses list, always including default address if saved in activeUser
  const rawAddresses = useMemo(() => {
    let list = Array.isArray(activeUser?.saved_addresses) ? [...activeUser.saved_addresses] : [];
    const fallbackAddr = (activeUser?.address || activeUser?.property?.address || '').trim();
    if (fallbackAddr) {
      const exists = list.some(
        (a) => (a.address || '').trim().toLowerCase() === fallbackAddr.toLowerCase()
      );
      if (!exists) {
        list = upsertDefaultAddress(list, fallbackAddr, {
          latitude: activeUser?.latitude,
          longitude: activeUser?.longitude,
        });
      }
    }
    return normalizeSavedAddresses(list);
  }, [activeUser?.saved_addresses, activeUser?.address, activeUser?.property?.address, activeUser?.latitude, activeUser?.longitude]);

  const addresses = rawAddresses.map((a) => {
    return { ...a, tag: normalizeTag(a.tag) };
  });

  // Users with permanent addresses (Independent house/floor, Villa, PG) cannot add additional addresses
  const hasPermanentAddress = addresses.some((a) => !isAddressEditable(a.tag));
  const canCreateNewAddress = !hasPermanentAddress;

  // Auto-sync fallback address into activeUser.saved_addresses if missing
  useEffect(() => {
    if (!activeUser || !updateProfile) return;
    const fallbackAddr = (activeUser?.address || activeUser?.property?.address || '').trim();
    if (!fallbackAddr) return;
    const currentSaved = Array.isArray(activeUser.saved_addresses) ? activeUser.saved_addresses : [];
    const alreadySaved = currentSaved.some(
      (a) => (a.address || '').trim().toLowerCase() === fallbackAddr.toLowerCase()
    );
    if (!alreadySaved) {
      const updated = upsertDefaultAddress(currentSaved, fallbackAddr, {
        latitude: activeUser?.latitude,
        longitude: activeUser?.longitude,
      });
      updateProfile({
        ...activeUser,
        saved_addresses: updated,
        address: fallbackAddr,
      });
    }
  }, [activeUser, updateProfile]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState({ type: '', text: '' });

  const fallbackOsm = (lat, lng) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`, {
      headers: { 'Accept-Language': 'en' },
    })
      .then((res) => res.json())
      .then((data) => {
        setDetectingLocation(false);
        if (data && data.display_name) {
          setNewAddress(data.display_name);
          setLocationStatus({ type: 'success', text: 'Current GPS location detected & filled!' });
        } else {
          setLocationStatus({ type: 'error', text: 'Unable to reverse-geocode coordinates. Please enter address manually.' });
        }
      })
      .catch(() => {
        setDetectingLocation(false);
        setLocationStatus({ type: 'error', text: 'Unable to reverse-geocode coordinates. Please enter address manually.' });
      });
  };

  const handleUseCurrentLocation = () => {
    setLocationStatus({ type: '', text: '' });
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus({ type: 'error', text: 'Geolocation is not supported by your browser or device.' });
      return;
    }

    setDetectingLocation(true);
    setLocationStatus({ type: 'info', text: 'Detecting your GPS coordinates...' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (window.google?.maps?.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng }, language: 'en' }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              const formatted = results[0].formatted_address;
              if (/[\u0900-\u097F]/.test(formatted)) {
                fallbackOsm(lat, lng);
                return;
              }
              setDetectingLocation(false);
              setNewAddress(formatted);
              setLocationStatus({ type: 'success', text: 'Current GPS location detected & filled!' });
            } else {
              fallbackOsm(lat, lng);
            }
          });
        } else {
          fallbackOsm(lat, lng);
        }
      },
      (err) => {
        setDetectingLocation(false);
        if (err.code === 1) {
          setLocationStatus({ type: 'error', text: 'Location permission was denied. Please allow location access in your browser settings.' });
        } else {
          setLocationStatus({ type: 'error', text: 'Unable to retrieve location. Please use map picker or type address manually.' });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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
    if (!activeUser || !updateProfile) return;
    if (isAnonymous) {
      setShowGuestModal(true);
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
    if (isAnonymous) {
      setShowGuestModal(true);
      return;
    }
    if (editingId === null && !canCreateNewAddress) {
      alert('Additional addresses cannot be created for permanent residences (Independent house/floor, Villa, PG).');
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
          tag: normalizeTag(newTag || 'Independent house/floor'),
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
    if (isAnonymous) {
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
    if (isAnonymous) {
      setShowGuestModal(true);
      return;
    }
    const target = addresses.find(a => a.id === id);
    if (target && !isAddressEditable(target.tag)) {
      alert('Permanent addresses (Independent house/floor, Villa, PG) cannot be deleted.');
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
    if (isAnonymous) {
      setShowGuestModal(true);
      return;
    }
    if (!isAddressEditable(item.tag)) {
      alert('Permanent addresses (Independent house/floor, Villa, PG) cannot be edited once saved. Only Rented home/floor addresses can be modified.');
      return;
    }
    setEditingId(item.id);
    setNewTag(normalizeTag(item.tag));
    setNewAddress(item.address);
    setShowAddForm(true);
  };

  const TAG_OPTIONS = ADDRESS_CATEGORIES;

  if (isDesktopWeb) {
    return (
      <View style={styles.desktopContainer}>
        {/* Top Header / Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="button"
              onClick={handleGoBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 999,
                backgroundColor: '#ffffff',
                border: '1.5px solid #e2e8f0',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: 13.5,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              <span>← Back to Profile</span>
            </button>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>
                Saved Addresses & Service Locations
              </h1>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: '4px 0 0', fontFamily: 'Inter, sans-serif' }}>
                Manage verified properties and service destinations linked with your AMC protection plan
              </p>
            </div>
          </div>

          {!showAddForm && !isGuest && canCreateNewAddress && (
            <button
              type="button"
              onClick={() => { setShowAddForm(true); setEditingId(null); setNewTag('Home'); setNewAddress(''); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 12,
                backgroundColor: '#0052cc',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,82,204,0.25)',
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Register New Address</span>
            </button>
          )}
        </div>

        {/* 2-Column Desktop Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 28, alignItems: 'start' }}>
          {/* Left Column: Address Cards List / Grid */}
          <div>
            {isAnonymous && addresses.length === 0 ? (
              <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 36, textAlign: 'center', border: '1.5px dashed #cbd5e1' }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <AppIcon name="lock" size={28} color="#b45309" strokeWidth={2.2} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>Guest Access Restricted</h3>
                <p style={{ fontSize: 14, color: '#64748b', maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
                  Saving, managing, and setting primary delivery addresses is reserved for registered account holders.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button
                    onClick={() => handleNav('/user/register')}
                    style={{ padding: '10px 22px', backgroundColor: '#0052cc', color: '#fff', borderRadius: 10, fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 13.5 }}
                  >
                    Register Account →
                  </button>
                  <button
                    onClick={() => handleNav('/user/login')}
                    style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#334155', borderRadius: 10, fontWeight: 600, border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: 13.5 }}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            ) : addresses.length === 0 ? (
              <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 48, textAlign: 'center', border: '1.5px dashed #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <AppIcon name="map-pin" size={28} color="#2563eb" />
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>No Saved Addresses Yet</h3>
                <p style={{ fontSize: 14, color: '#64748b', maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
                  Register your home, office, or parents’ address for instant technician dispatch and zero-hassle AMC servicing.
                </p>
                <button
                  onClick={() => { setShowAddForm(true); setEditingId(null); setNewTag('Independent house/floor'); setNewAddress(''); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', backgroundColor: '#0052cc', color: '#fff', borderRadius: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 14, boxShadow: '0 4px 12px rgba(0,82,204,0.2)' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Add Your First Address</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
                {addresses.map((item) => {
                  const iconName = TAG_ICONS[item.tag] || 'home';
                  const themeColor = TAG_COLORS[item.tag] || '#3b82f6';
                  const cov = validateServiceLocation ? validateServiceLocation(item.address) : { isSupported: true };

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: item.isDefault ? '#f8faff' : '#ffffff',
                        borderRadius: 18,
                        padding: 20,
                        border: item.isDefault ? '2px solid #3b82f6' : '1.5px solid #e2e8f0',
                        boxShadow: item.isDefault ? '0 8px 24px rgba(59,130,246,0.08)' : '0 2px 10px rgba(15,23,42,0.03)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 16,
                        position: 'relative',
                      }}
                    >
                      <div>
                        {/* Top Meta Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${themeColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <AppIcon name={iconName} size={18} color={themeColor} />
                            </div>
                            <div>
                              <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', fontFamily: 'Inter, sans-serif' }}>
                                {CATEGORY_DISPLAY_NAMES[item.tag] || item.tag}
                              </span>
                              {item.isDefault && (
                                <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 6, backgroundColor: '#2563eb', color: '#ffffff', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  Primary
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Star button */}
                          <button
                            onClick={() => !item.isDefault && handleSetDefault(item.id)}
                            disabled={item.isDefault}
                            title={item.isDefault ? "Primary Address" : "Set as Primary"}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: item.isDefault ? '#fffbeb' : '#f8fafc',
                              border: item.isDefault ? '1px solid #fde68a' : '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: item.isDefault ? 'default' : 'pointer',
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={item.isDefault ? '#f59e0b' : 'none'} stroke={item.isDefault ? '#f59e0b' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          </button>
                        </div>

                        {/* Coverage pill */}
                        <div style={{ marginBottom: 10 }}>
                          {cov.isSupported ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 6, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 11, fontWeight: 700, color: '#16a34a' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Coverage Verified
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 6, backgroundColor: '#fef2f2', border: '1px solid #fecaca', fontSize: 11, fontWeight: 700, color: '#dc2626' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                              </svg>
                              Out of Standard Zone
                            </span>
                          )}
                        </div>

                        {/* Physical Address */}
                        <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif' }}>
                          {item.address}
                        </p>
                      </div>

                      {/* Card Actions: Only show options for Rented home/floor */}
                      {isAddressEditable(item.tag) && (
                        <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                          <button
                            onClick={() => handleEdit(item)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: 10,
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              color: '#2563eb',
                              fontSize: 12.5,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              cursor: 'pointer',
                            }}
                          >
                            <AppIcon name="edit" size={13} color="#2563eb" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: 10,
                              backgroundColor: '#fef2f2',
                              border: '1px solid #fee2e2',
                              color: '#dc2626',
                              fontSize: 12.5,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              cursor: 'pointer',
                            }}
                          >
                            <AppIcon name="trash" size={13} color="#dc2626" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Add/Edit Form OR Guarantees Card */}
          <div style={{ position: 'sticky', top: 90 }}>
            {showAddForm ? (
              <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 24, border: '1.5px solid #dbeafe', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 16px', fontFamily: 'Inter, sans-serif' }}>
                  {editingId ? 'Modify Saved Location' : 'Register New Location'}
                </h3>

                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                  Address Category
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {TAG_OPTIONS.map(t => {
                    const active = newTag === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewTag(t)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 20,
                          backgroundColor: active ? '#eff6ff' : '#f8fafc',
                          border: active ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                          color: active ? '#2563eb' : '#475569',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <AppIcon name={TAG_ICONS[t]} size={12} color={active ? '#2563eb' : '#64748b'} />
                        <span>{t}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Use Current Location Button */}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={detectingLocation}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: 12,
                    backgroundColor: '#0f172a',
                    border: '1.5px solid #0f172a',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: detectingLocation ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 8,
                    boxShadow: '0 2px 8px rgba(15,23,42,0.12)',
                    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="2" x2="12" y2="6" />
                    <line x1="12" y1="18" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="6" y2="12" />
                    <line x1="18" y1="12" x2="22" y2="12" />
                    <circle cx="12" cy="12" r="3" fill="#38bdf8" />
                  </svg>
                  <span>{detectingLocation ? 'Detecting GPS Location...' : 'Use My Current Location'}</span>
                </button>

                {/* Map button */}
                <button
                  type="button"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    borderRadius: 12,
                    backgroundColor: showMapPicker ? '#0f172a' : '#ffffff',
                    border: showMapPicker ? '1.5px solid #0f172a' : '1.5px solid #bfdbfe',
                    color: showMapPicker ? '#ffffff' : '#0052e0',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: locationStatus.text ? 8 : 14,
                    boxShadow: showMapPicker ? '0 2px 8px rgba(15,23,42,0.12)' : '0 2px 8px rgba(0, 82, 224, 0.06)',
                    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
                    transition: 'all 0.15s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={showMapPicker ? '#38bdf8' : '#0052e0'} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{showMapPicker ? 'Close Google Map' : 'Pinpoint on Google Map'}</span>
                </button>

                {locationStatus.text ? (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    marginBottom: 12,
                    backgroundColor: locationStatus.type === 'error' ? '#fef2f2' : locationStatus.type === 'success' ? '#f0fdf4' : '#eff6ff',
                    border: `1px solid ${locationStatus.type === 'error' ? '#fca5a5' : locationStatus.type === 'success' ? '#bbf7d0' : '#bfdbfe'}`,
                    color: locationStatus.type === 'error' ? '#dc2626' : locationStatus.type === 'success' ? '#15803d' : '#1e40af',
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'center',
                  }}>
                    {locationStatus.type === 'error' ? '⚠ ' : locationStatus.type === 'success' ? '✓ ' : 'ℹ '}
                    {locationStatus.text}
                  </div>
                ) : null}

                {showMapPicker && (
                  <div style={{ marginBottom: 14 }}>
                    <GoogleMapsLocationPicker
                      initialAddress={newAddress}
                      onSelectLocation={(loc) => {
                        setNewAddress(loc.address);
                        setShowMapPicker(false);
                      }}
                      onClose={() => setShowMapPicker(false)}
                    />
                  </div>
                )}

                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#475569', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                  Complete Physical Address
                </label>
                <div style={{ backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: 12, padding: 6, marginBottom: 16 }}>
                  <TextInput
                    style={styles.textInput}
                    multiline
                    numberOfLines={3}
                    value={newAddress}
                    onChangeText={setNewAddress}
                    placeholder="Flat / Villa No., Tower, Society Name, Landmark, Sector, City..."
                    placeholderTextColor="#94a3b8"
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setEditingId(null); setNewTag(''); setNewAddress(''); }}
                    style={{
                      flex: 1,
                      padding: '11px',
                      borderRadius: 10,
                      backgroundColor: '#f1f5f9',
                      border: 'none',
                      color: '#475569',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddOrSave}
                    style={{
                      flex: 2,
                      padding: '11px',
                      borderRadius: 10,
                      backgroundColor: '#0052cc',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,82,204,0.25)',
                    }}
                  >
                    {editingId ? 'Update Address' : 'Save Address'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 24, border: '1.5px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <AppIcon name="map-pin" size={18} color="#2563eb" />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                    Fast Technician Dispatch
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                      </svg>
                    </div>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Automated Primary Routing</h4>
                      <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                        When you book a service, your primary address is automatically preselected for 15-minute technician dispatch.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                    </div>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>AMC Plan Protection</h4>
                      <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                        Appliance breakdown visits and AMC labor benefits apply seamlessly to all registered locations.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="22" y1="12" x2="18" y2="12" />
                        <line x1="6" y1="12" x2="2" y2="12" />
                        <line x1="12" y1="6" x2="12" y2="2" />
                        <line x1="12" y1="22" x2="12" y2="18" />
                      </svg>
                    </div>
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Pinpoint GPS Coordinates</h4>
                      <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                        Google Maps integration ensures your technician arrives at the correct tower and gate without repeated calling.
                      </p>
                    </div>
                  </div>
                </div>

                {!isGuest && (
                  <button
                    onClick={() => { setShowAddForm(true); setEditingId(null); setNewTag('Home'); setNewAddress(''); }}
                    style={{
                      width: '100%',
                      marginTop: 20,
                      padding: '11px',
                      borderRadius: 12,
                      backgroundColor: '#eff6ff',
                      border: '1.5px dashed #3b82f6',
                      color: '#2563eb',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add Another Location</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal for guest */}
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
                <AppIcon name="x" size={16} color="#64748B" strokeWidth={2.2} />
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
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isDesktopWeb && styles.contentDesktop]} showsVerticalScrollIndicator={false}>
      {/* Luxury Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.7} accessibilityLabel="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </TouchableOpacity>
        <View style={{ flex: 1, paddingLeft: 12 }}>
          <Text style={styles.headerTitle}>Saved Addresses</Text>
          <Text style={styles.headerSubtitle}>Manage your verified service locations</Text>
        </View>
        {addresses.length > 0 && (
          <View style={styles.headerCountPill}>
            <View style={styles.headerCountDot} />
            <Text style={styles.headerCountText}>{addresses.length} Verified</Text>
          </View>
        )}
      </View>

      {/* Address Cards */}
      <div style={isDesktopWeb ? desktopAddressGridStyle : { display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {addresses.map((item) => {
          const iconName = TAG_ICONS[item.tag] || 'home';
          const themeColor = TAG_COLORS[item.tag] || '#2563eb';
          const bgTheme = CATEGORY_BG_COLORS[item.tag] || '#EFF6FF';
          const borderTheme = CATEGORY_BORDER_COLORS[item.tag] || '#BFDBFE';
          const displayName = CATEGORY_DISPLAY_NAMES[item.tag] || item.tag;
          const { premise, locality } = formatAddressParts(item.address);
          const cov = validateServiceLocation ? validateServiceLocation(item.address) : { isSupported: true };

          return (
            <View key={item.id} style={[styles.addrCard, item.isDefault && styles.addrCardDefault]}>
              {/* Top Row: Icon + Title & Badges + Star Button */}
              <View style={styles.addrCardTop}>
                {/* Dual-tone Squircle Icon */}
                <View style={[styles.pinIconWrap, { backgroundColor: bgTheme, borderColor: borderTheme }]}>
                  <AppIcon name={iconName} size={20} color={themeColor} strokeWidth={2.2} />
                </View>

                {/* Title & Badges */}
                <View style={styles.addrTitleWrap}>
                  <Text style={styles.addrTag}>{displayName}</Text>
                  
                  <View style={styles.tagRow}>
                    {item.isDefault && (
                      <View style={styles.defaultBadge}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" style={{ marginRight: 3 }}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        <Text style={styles.defaultBadgeText}>PRIMARY</Text>
                      </View>
                    )}
                    {cov.isSupported ? (
                      <View style={styles.coverageBadge}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 3 }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <Text style={styles.coverageBadgeText}>Coverage Verified</Text>
                      </View>
                    ) : (
                      <View style={styles.outOfCoverageBadge}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 3 }}>
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/>
                          <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <Text style={styles.outOfCoverageBadgeText}>Out of Coverage</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Star Bookmark Pill (Flex sibling on the right) */}
                <TouchableOpacity
                  style={[styles.starActionBtn, item.isDefault && styles.starActionBtnActive]}
                  onPress={() => !item.isDefault && handleSetDefault(item.id)}
                  activeOpacity={0.7}
                  disabled={item.isDefault}
                  title={item.isDefault ? "Primary Service Address" : "Set as Primary Destination"}
                >
                  {item.isDefault ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" stroke="#D97706" strokeWidth="1.2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  )}
                </TouchableOpacity>
              </View>

              {/* Physical Address Presentation */}
              <View style={styles.addressBlock}>
                <View style={styles.addressPinIcon}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" fill="#2563EB" />
                  </svg>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addrStreetText}>{premise || item.address}</Text>
                  {locality ? <Text style={styles.addrLocalityText}>{locality}</Text> : null}
                </View>
              </View>

              {/* Card Footer: Ribbon or Editable Actions */}
              {!isAddressEditable(item.tag) ? (
                <View style={styles.cardRibbon}>
                  <View style={styles.ribbonLeft}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <Text style={styles.ribbonText}>Fixed Household Location</Text>
                  </View>
                  <View style={styles.ribbonRight}>
                    <View style={styles.greenPulseDot} />
                    <Text style={styles.doorstepReadyText}>Doorstep Ready</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.addrActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)} activeOpacity={0.7}>
                    <View style={styles.actionBtnInner}>
                      <AppIcon name="edit" size={13} color="#2563eb" strokeWidth={2.2} />
                      <Text style={styles.actionBtnText}>Edit Address</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id)} activeOpacity={0.7}>
                    <View style={styles.actionBtnInner}>
                      <AppIcon name="trash" size={13} color="#dc2626" strokeWidth={2.2} />
                      <Text style={styles.deleteBtnText}>Remove</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </div>

      {/* If anonymous with no addresses, show message */}
      {isAnonymous && addresses.length === 0 ? (
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

          {/* Action Buttons: Current GPS & Google Map Picker */}
          <View style={styles.locButtonsWrap}>
            <TouchableOpacity
              style={styles.currentLocationBtn}
              onPress={handleUseCurrentLocation}
              disabled={detectingLocation}
              activeOpacity={0.85}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
                <circle cx="12" cy="12" r="3" fill="#38bdf8" />
              </svg>
              <Text style={styles.currentLocationBtnText}>
                {detectingLocation ? 'Detecting GPS Location...' : 'Use My Current Location'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mapPickerBtn, showMapPicker && styles.mapPickerBtnActive]}
              onPress={() => setShowMapPicker(!showMapPicker)}
              activeOpacity={0.85}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={showMapPicker ? '#38bdf8' : '#0052e0'} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <Text style={[styles.mapPickerBtnText, showMapPicker && styles.mapPickerBtnTextActive]}>
                {showMapPicker ? 'Close Google Map' : 'Pinpoint on Google Map'}
              </Text>
            </TouchableOpacity>
          </View>

          {locationStatus.text ? (
            <View style={[
              styles.locStatusBox,
              locationStatus.type === 'error' && styles.locStatusBoxError,
              locationStatus.type === 'success' && styles.locStatusBoxSuccess
            ]}>
              <Text style={[
                styles.locStatusText,
                locationStatus.type === 'error' && styles.locStatusTextError,
                locationStatus.type === 'success' && styles.locStatusTextSuccess
              ]}>
                {locationStatus.type === 'error' ? '⚠ ' : locationStatus.type === 'success' ? '✓ ' : 'ℹ '}
                {locationStatus.text}
              </Text>
            </View>
          ) : null}

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
      ) : canCreateNewAddress ? (
        <TouchableOpacity style={styles.addNewBtn} onPress={() => { setShowAddForm(true); setEditingId(null); setNewTag('Independent house/floor'); setNewAddress(''); }} activeOpacity={0.85}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <Text style={styles.addNewBtnText}>Create New Verified Location</Text>
        </TouchableOpacity>
      ) : null}

      {/* Verified Dispatch Notice */}
      <View style={styles.securityNoticeCard}>
        <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div>
        <Text style={styles.securityNoticeText}>
          Locations saved here are shared securely with verified technician dispatchers for prompt servicing.
        </Text>
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
              <AppIcon name="x" size={16} color="#64748B" strokeWidth={2.2} />
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

const desktopAddressGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
  gap: '16px',
  width: '100%',
  boxSizing: 'border-box',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 18, gap: 16 },
  contentDesktop: {
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 80,
    boxSizing: 'border-box',
  },

  topHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, marginBottom: 4 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#ffffff', borderWidth: 1.2, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' },
  backArrow: { fontSize: 20, color: '#0F1F3D', fontWeight: '700', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  headerTitle: { fontSize: 21, fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif", letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 12.5, color: '#64748B', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif", marginTop: 2 },
  headerCountPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#BBF7D0' },
  headerCountDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  headerCountText: { fontSize: 11, fontWeight: '700', color: '#16A34A', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },

  cardGroup: { gap: 14 },
  addrCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    boxShadow: '0 4px 18px rgba(15,23,42,0.04)',
    position: 'relative',
  },
  addrCardDefault: {
    borderColor: '#93C5FD',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 3.5,
    borderTopColor: '#2563EB',
    boxShadow: '0 8px 24px rgba(37,99,235,0.08), 0 2px 6px rgba(15,23,42,0.02)',
  },

  starActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    display: 'flex',
    flexShrink: 0,
  },
  starActionBtnActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    boxShadow: '0 2px 8px rgba(245,158,11,0.2)',
  },

  addrCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12, width: '100%' },
  pinIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', display: 'flex', flexShrink: 0, borderWidth: 1.2 },
  addrTitleWrap: { flex: 1, minWidth: 0, justifyContent: 'center' },
  addrTag: { fontSize: 13.5, fontWeight: '800', color: '#0F172A', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif", letterSpacing: -0.2, marginBottom: 3 },
  tagRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  defaultBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  defaultBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5, fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  coverageBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  coverageBadgeText: { color: '#16A34A', fontSize: 9.5, fontWeight: '700', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  outOfCoverageBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  outOfCoverageBadgeText: { color: '#DC2626', fontSize: 9.5, fontWeight: '700', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },

  addressBlock: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
  addressPinIcon: { marginTop: 2, flexShrink: 0 },
  addrStreetText: { fontSize: 13.5, fontWeight: '650', color: '#1E293B', lineHeight: 19, fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  addrLocalityText: { fontSize: 12, color: '#64748B', lineHeight: 17, fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif", marginTop: 2 },

  cardRibbon: { width: '100%', alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, marginTop: 14, boxSizing: 'border-box' },
  ribbonLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0, marginRight: 8 },
  ribbonText: { fontSize: 11.5, color: '#64748B', fontWeight: '600', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  ribbonRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  greenPulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A', flexShrink: 0 },
  doorstepReadyText: { fontSize: 11, color: '#16A34A', fontWeight: '700', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },

  // Bottom action buttons: exactly 2 aligned buttons per card now
  addrActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, marginTop: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  actionBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#2563EB', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  lockedBtn: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0', opacity: 0.85 },
  lockedBtnText: { fontSize: 11.5, fontWeight: '700', color: '#64748b', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  deleteBtn: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: '#DC2626', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },

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
  locButtonsWrap: {
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    cursor: 'pointer',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  currentLocationBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  locStatusBox: {
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  locStatusBoxError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  locStatusBoxSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  locStatusText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1e40af',
    textAlign: 'center',
  },
  locStatusTextError: {
    color: '#dc2626',
  },
  locStatusTextSuccess: {
    color: '#15803d',
  },
  mapPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    cursor: 'pointer',
    shadowColor: '#0052e0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  mapPickerBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  mapPickerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0052e0',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  mapPickerBtnTextActive: {
    color: '#ffffff',
  },
  textInput: { fontSize: 13, color: '#0F1F3D', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif", outlineStyle: 'none', minHeight: 80, lineHeight: 18 },

  formBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: '#475569', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },
  saveBtn: { flex: 2, backgroundColor: '#2563EB', paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 13, fontWeight: '800', color: '#ffffff', fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif" },

  securityNoticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    boxShadow: '0 2px 10px rgba(15,23,42,0.02)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityNoticeText: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
    fontWeight: '500',
  },

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
  desktopContainer: {
    width: '100%',
    paddingVertical: 24,
  },
});
