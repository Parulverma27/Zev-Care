import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import BookingProgress from './BookingProgress';
import LiveSupportOptionCard from './LiveSupportOptionCard';
import GoogleMapsLocationPicker from '../GoogleMapsLocationPicker';

export default function BookingLocationStep({
  addresses = [],
  selectedAddressId,
  address,
  onSelectSaved,
  onChangeAddress,
  onSaveAddress,
  locationValidation,
  onBack,
  onContinue,
  isConsultation = false,
  isGuest = false,
  onLiveSupport,
  onManageSavedAddresses,
}) {
  const [inputAddress, setInputAddress] = useState(address || '');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(addresses.length === 0);

  useEffect(() => {
    if (address && address !== inputAddress) {
      setInputAddress(address);
    }
  }, [address]);

  useEffect(() => {
    if (!address && addresses.length === 0) {
      try {
        const prelogin = sessionStorage.getItem('zevota_prelogin_location');
        if (prelogin && prelogin.trim() && !/[\u0900-\u097F]/.test(prelogin)) {
          const trimmed = prelogin.trim();
          setInputAddress(trimmed);
          onChangeAddress?.(trimmed, {});
        }
      } catch (e) {}
    }
  }, []);

  // Automatically ensure default or first saved address is selected
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      if (def) {
        onSelectSaved?.(def);
      }
    }
  }, [addresses, selectedAddressId, onSelectSaved]);

  const activeAddressObj =
    addresses.find((a) => a.id === selectedAddressId) ||
    addresses.find((a) => a.address === address) ||
    (address && address.trim()
      ? {
          id: 'custom-address',
          tag: isConsultation ? 'Doorstep Inspection' : 'Service Address',
          address: address.trim(),
        }
      : null) ||
    (inputAddress && inputAddress.trim()
      ? {
          id: 'custom-address',
          tag: isConsultation ? 'Doorstep Inspection' : 'Service Address',
          address: inputAddress.trim(),
        }
      : null) ||
    addresses.find((a) => a.isDefault) ||
    addresses[0] ||
    null;

  const canContinue = Boolean(
    (activeAddressObj?.address || address || inputAddress)?.trim()?.length >= 4 &&
    locationValidation?.isSupported !== false
  );

  const fallbackOsm = (lat, lng) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`, {
      headers: { 'Accept-Language': 'en' },
    })
      .then((res) => res.json())
      .then((data) => {
        setDetectingLocation(false);
        if (data && data.display_name) {
          const addr = data.display_name;
          setInputAddress(addr);
          onChangeAddress?.(addr, { latitude: lat, longitude: lng });
          onSaveAddress?.(addr, { latitude: lat, longitude: lng });
          setLocationFeedback('✓ Current GPS location detected & selected!');
        } else {
          setLocationFeedback('Unable to reverse-geocode coordinates. Please enter address manually.');
        }
      })
      .catch(() => {
        setDetectingLocation(false);
        setLocationFeedback('Unable to reverse-geocode coordinates. Please enter address manually.');
      });
  };

  const handleUseCurrentLocation = () => {
    setLocationFeedback('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationFeedback('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingLocation(true);
    setLocationFeedback('Detecting your GPS location...');

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
              setInputAddress(formatted);
              onChangeAddress?.(formatted, { latitude: lat, longitude: lng });
              onSaveAddress?.(formatted, { latitude: lat, longitude: lng });
              setLocationFeedback('✓ Current GPS location detected & selected!');
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
          setLocationFeedback('Location permission denied. Please allow access or enter address below.');
        } else {
          setLocationFeedback('Unable to retrieve location. Please enter address below.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSelectFromMap = (loc) => {
    const chosen = loc?.address || '';
    if (chosen) {
      setInputAddress(chosen);
      const coords = { latitude: loc.lat, longitude: loc.lng };
      onChangeAddress?.(chosen, coords);
      onSaveAddress?.(chosen, coords);
      setLocationFeedback('✓ Selected from Map successfully!');
    }
    setShowMapPicker(false);
  };

  const handleInputChange = (text) => {
    setInputAddress(text);
    onChangeAddress?.(text, {});
  };

  const handleContinuePress = () => {
    const finalAddr = (activeAddressObj?.address || address || inputAddress || '').trim();
    if (!finalAddr) return;
    onChangeAddress?.(finalAddr, {});
    onSaveAddress?.(finalAddr, {});
    onContinue?.();
  };

  const getAddressTagIcon = (tag = '') => {
    const t = tag.toUpperCase();
    if (t.includes('OFFICE') || t.includes('WORK')) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="9" y1="6" x2="9" y2="6.01" />
          <line x1="15" y1="6" x2="15" y2="6.01" />
          <line x1="9" y1="10" x2="9" y2="10.01" />
          <line x1="15" y1="10" x2="15" y2="10.01" />
          <line x1="9" y1="14" x2="9" y2="14.01" />
          <line x1="15" y1="14" x2="15" y2="14.01" />
          <line x1="9" y1="18" x2="15" y2="18" />
        </svg>
      );
    }
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7} accessibilityLabel="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <BookingProgress activeIndex={3} />
        </View>
      </View>

      {/* Title & Badge */}
      <View style={styles.titleSection}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <Text style={styles.badgeText}>
              {isConsultation ? 'MY MECHANIC • ₹0 INSPECTION' : 'SERVICE LOCATION'}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>
          {isConsultation ? 'Doorstep inspection location' : 'Service location'}
        </Text>
        <Text style={styles.subtitle}>
          {isConsultation
            ? 'Select or enter where the certified mechanic will arrive for your complimentary ₹0 diagnosis.'
            : 'Service will be provided at your selected address. Choose a saved address or enter a new location.'}
        </Text>
      </View>

      {/* Saved Addresses Section (if available) */}
      {addresses.length > 0 && (
        <View style={styles.sectionWrap}>
          <View style={styles.savedSectionHeaderRow}>
            <Text style={styles.sectionTitle}>Saved Addresses</Text>
            {onManageSavedAddresses && (
              <TouchableOpacity
                onPress={onManageSavedAddresses}
                style={styles.editSavedAddressesLink}
                activeOpacity={0.7}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <Text style={styles.editSavedAddressesText}>Edit in Saved Addresses</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.savedList}>
            {addresses.map((a) => {
              const active =
                selectedAddressId === a.id ||
                (!selectedAddressId && activeAddressObj?.id === a.id);
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.savedCard, active && styles.savedCardActive]}
                  onPress={() => {
                    onSelectSaved?.(a);
                    setInputAddress(a.address);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.savedCardTop}>
                    <View style={styles.savedTagWrap}>
                      {getAddressTagIcon(a.tag)}
                      <Text style={[styles.savedTagText, active && styles.savedTagTextActive]}>
                        {a.tag || 'Saved Address'}
                      </Text>
                    </View>
                    {active ? (
                      <View style={styles.activeCheckPill}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <Text style={styles.activeCheckText}>Selected</Text>
                      </View>
                    ) : (
                      <Text style={styles.selectPromptText}>Tap to Select</Text>
                    )}
                  </View>
                  <Text style={styles.savedAddrText} numberOfLines={3}>
                    {a.address}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!showCustomInput && (
            <TouchableOpacity
              style={styles.useDifferentBtn}
              onPress={() => setShowCustomInput(true)}
              activeOpacity={0.8}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <Text style={styles.useDifferentBtnText}>Choose / Enter a Different Service Address</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Interactive Location Selector Card (When no saved address or user wants different address) */}
      {(addresses.length === 0 || showCustomInput) && (
        <View style={styles.customAddressCard}>
          <View style={styles.customAddressHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.customAddressTitle}>
                {addresses.length === 0
                  ? (isConsultation ? 'Select Inspection Doorstep' : 'Select Service Address')
                  : 'Enter a Different Service Address'}
              </Text>
              <Text style={styles.customAddressSub}>
                {isConsultation
                  ? 'Select or enter where our mechanic should arrive for your complimentary ₹0 inspection.'
                  : 'Specify your service doorstep.'}
              </Text>
            </View>
            {addresses.length > 0 && (
              <TouchableOpacity onPress={() => setShowCustomInput(false)} style={styles.closeCustomBtn}>
                <Text style={styles.closeCustomBtnText}>✕ Use Saved</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Action Buttons: GPS + Map Picker */}
          <View style={styles.quickLocationRow}>
            <TouchableOpacity
              style={[styles.quickLocBtn, detectingLocation && styles.quickLocBtnActive]}
              onPress={handleUseCurrentLocation}
              disabled={detectingLocation}
              activeOpacity={0.8}
            >
              {detectingLocation ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              )}
              <Text style={styles.quickLocBtnText}>
                {detectingLocation ? 'Detecting GPS…' : 'Use Current GPS'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickMapBtn, showMapPicker && styles.quickMapBtnActive]}
              onPress={() => setShowMapPicker((prev) => !prev)}
              activeOpacity={0.8}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              <Text style={styles.quickMapBtnText}>
                {showMapPicker ? 'Close Map Picker' : 'Choose on Map'}
              </Text>
            </TouchableOpacity>
          </View>

          {locationFeedback ? (
            <View style={[styles.feedbackBadge, locationFeedback.includes('✓') ? styles.feedbackSuccess : styles.feedbackError]}>
              <Text style={[styles.feedbackText, locationFeedback.includes('✓') ? styles.feedbackSuccessText : styles.feedbackErrorText]}>
                {locationFeedback}
              </Text>
            </View>
          ) : null}

          {showMapPicker && (
            <View style={styles.mapPickerWrapper}>
              <GoogleMapsLocationPicker
                initialAddress={inputAddress}
                onSelectLocation={handleSelectFromMap}
                onClose={() => setShowMapPicker(false)}
              />
            </View>
          )}

          {/* Manual Input Field */}
          <View style={styles.inputFieldWrap}>
            <Text style={styles.inputLabel}>Complete Doorstep Address</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputIconWrap}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </View>
              <TextInput
                style={styles.addressTextInput}
                placeholder="House / Flat No., Building Name, Street, Area, City"
                placeholderTextColor="#94a3b8"
                value={inputAddress}
                onChangeText={handleInputChange}
                multiline
                numberOfLines={2}
              />
              {Boolean(inputAddress) && (
                <TouchableOpacity
                  style={styles.clearInputBtn}
                  onPress={() => {
                    setInputAddress('');
                    onChangeAddress?.('', {});
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.clearInputBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Confirmed Doorstep Card */}
      {activeAddressObj && (
        <View style={styles.confirmedDoorstepCard}>
          <View style={styles.confirmedDoorstepTop}>
            <View style={styles.confirmedIconCircle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.confirmedCardLabel}>CONFIRMED SERVICE DOORSTEP</Text>
              <Text style={styles.confirmedTagText}>{activeAddressObj.tag || 'Home'}</Text>
            </View>
          </View>
          <Text style={styles.confirmedAddressBody}>{activeAddressObj.address}</Text>
          <View style={styles.lockedNoteRow}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <Text style={styles.lockedNoteText}>
              {isGuest || activeAddressObj?.id === 'custom-address'
                ? 'Certified mechanic will arrive at this verified doorstep location.'
                : 'Address confirmed for this service. You can also edit it in your Saved Addresses.'}
            </Text>
          </View>
        </View>
      )}

      {/* Service Coverage Validation Banner */}
      {locationValidation && (
        <View style={[styles.validBanner, canContinue ? styles.validOk : styles.validBad]}>
          <View style={styles.validIconWrap}>
            {canContinue ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.validHeader, canContinue ? styles.validOkHeader : styles.validBadHeader]}>
              {canContinue ? 'Service Available at This Location' : 'Location Verification'}
            </Text>
            <Text style={[styles.validText, canContinue ? styles.validOkText : styles.validBadText]}>
              {locationValidation.message}
            </Text>
          </View>
        </View>
      )}

      {/* Continue CTA */}
      <TouchableOpacity
        style={[styles.primaryBtn, (!canContinue || !activeAddressObj) && styles.primaryBtnDisabled]}
        disabled={!canContinue || !activeAddressObj}
        onPress={handleContinuePress}
        activeOpacity={0.88}
      >
        <Text style={[styles.primaryBtnText, (!canContinue || !activeAddressObj) && styles.primaryBtnTextDisabled]}>
          Continue to Review & Confirm
        </Text>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={!canContinue || !activeAddressObj ? '#94a3b8' : '#ffffff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </TouchableOpacity>

      {/* Live Support */}
      {onLiveSupport && (
        <View style={{ marginTop: 4 }}>
          <LiveSupportOptionCard onPress={onLiveSupport} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 56,
    gap: 16,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    boxSizing: 'border-box',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
    cursor: 'pointer',
  },
  titleSection: {
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 16,
    fontWeight: '500',
  },
  sectionWrap: {
    gap: 8,
  },
  savedSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  editSavedAddressesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    cursor: 'pointer',
  },
  editSavedAddressesText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  savedList: {
    gap: 10,
  },
  savedCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 6,
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
    cursor: 'pointer',
  },
  savedCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#f8faff',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)',
  },
  savedCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  savedTagText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  savedTagTextActive: {
    color: '#2563eb',
  },
  activeCheckPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeCheckText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  selectPromptText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  savedAddrText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
  emptySavedBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
  },
  emptySavedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
  },
  emptySavedSub: {
    fontSize: 11.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  addSavedBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
    cursor: 'pointer',
  },
  addSavedBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  confirmedDoorstepCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    boxShadow: '0 2px 10px rgba(22, 163, 74, 0.05)',
  },
  confirmedDoorstepTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confirmedIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmedCardLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.6,
  },
  confirmedTagText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1e293b',
  },
  confirmedAddressBody: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '500',
    paddingLeft: 2,
  },
  lockedNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  lockedNoteText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  validBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  validOk: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  validBad: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  validIconWrap: {
    marginTop: 1,
  },
  validHeader: {
    fontSize: 12,
    fontWeight: '800',
  },
  validOkHeader: {
    color: '#065f46',
  },
  validBadHeader: {
    color: '#991b1b',
  },
  validText: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
    fontWeight: '500',
  },
  validOkText: {
    color: '#047857',
  },
  validBadText: {
    color: '#b91c1c',
  },
  primaryBtn: {
    width: '100%',
    boxSizing: 'border-box',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 20,
    boxShadow: '0 6px 18px rgba(37, 99, 235, 0.28)',
    cursor: 'pointer',
    marginTop: 6,
  },
  primaryBtnDisabled: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13.5,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  primaryBtnTextDisabled: {
    color: '#94a3b8',
    fontWeight: '700',
  },
  customAddressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 14,
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
  },
  customAddressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  customAddressTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  customAddressSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  closeCustomBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    cursor: 'pointer',
  },
  closeCustomBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  quickLocationRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  quickLocBtn: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1.2,
    borderColor: '#bfdbfe',
    cursor: 'pointer',
  },
  quickLocBtnActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  quickLocBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  quickMapBtn: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#faf5ff',
    borderWidth: 1.2,
    borderColor: '#e9d5ff',
    cursor: 'pointer',
  },
  quickMapBtnActive: {
    backgroundColor: '#f3e8ff',
    borderColor: '#d8b4fe',
  },
  quickMapBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7c3aed',
  },
  feedbackBadge: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  feedbackError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  feedbackText: {
    fontSize: 11.5,
    fontWeight: '600',
    lineHeight: 16,
  },
  feedbackSuccessText: {
    color: '#15803d',
  },
  feedbackErrorText: {
    color: '#dc2626',
  },
  mapPickerWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  inputFieldWrap: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  inputIconWrap: {
    marginTop: 2,
    flexShrink: 0,
  },
  addressTextInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0f172a',
    lineHeight: 18,
    fontFamily: 'Inter, sans-serif',
    outlineStyle: 'none',
    borderWidth: 0,
    backgroundColor: 'transparent',
    padding: 0,
    minHeight: 38,
  },
  clearInputBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    cursor: 'pointer',
  },
  clearInputBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    lineHeight: 12,
  },
  useDifferentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    cursor: 'pointer',
    marginTop: 4,
  },
  useDifferentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
});
