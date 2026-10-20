import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import BookingProgress from './BookingProgress';
import LiveSupportOptionCard from './LiveSupportOptionCard';
import GoogleMapsLocationPicker from '../GoogleMapsLocationPicker';

export default function BookingLocationStep({
  addresses = [],
  selectedAddressId,
  address,
  onSelectSaved,
  onChangeAddress,
  onChangeCoords,
  locationValidation,
  onFetchGps,
  locatingGps,
  gpsError,
  onBack,
  onContinue,
  isConsultation = false,
  onLiveSupport,
}) {
  const [mapAddressKey, setMapAddressKey] = useState(0);
  const canContinue = Boolean(locationValidation?.isSupported);

  const handleLocationPicked = (loc) => {
    if (!loc) return;
    if (loc.address) {
      onChangeAddress?.(loc.address);
    }
    if (loc.lat && loc.lng) {
      onChangeCoords?.({ latitude: loc.lat, longitude: loc.lng });
    }
  };

  const handleSelectSavedAddress = (a) => {
    onSelectSaved?.(a);
    if (a.address) {
      onChangeAddress?.(a.address);
      setMapAddressKey((k) => k + 1);
    }
    if (a.latitude && a.longitude) {
      onChangeCoords?.({ latitude: a.latitude, longitude: a.longitude });
    }
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
              {isConsultation ? 'DOORSTEP INSPECTION' : 'SERVICE LOCATION'}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>
          {isConsultation ? 'Doorstep inspection location' : 'Service location'}
        </Text>
        <Text style={styles.subtitle}>
          {isConsultation
            ? 'Pinpoint or search your exact address on Google Map so the technician reaches on time.'
            : 'Select a saved address or pinpoint your exact doorstep on Google Map.'}
        </Text>
      </View>

      {/* Saved Addresses (if any) */}
      {addresses.length > 0 && (
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
          <View style={styles.savedList}>
            {addresses.map((a) => {
              const active = selectedAddressId === a.id || (!selectedAddressId && a.address === address);
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.savedCard, active && styles.savedCardActive]}
                  onPress={() => handleSelectSavedAddress(a)}
                  activeOpacity={0.8}
                >
                  <View style={styles.savedCardTop}>
                    <View style={styles.savedTagWrap}>
                      {getAddressTagIcon(a.tag)}
                      <Text style={[styles.savedTagText, active && styles.savedTagTextActive]}>
                        {a.tag || 'Saved Address'}
                      </Text>
                    </View>
                    {active && (
                      <View style={styles.activeCheckPill}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <Text style={styles.activeCheckText}>Selected</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.savedAddrText} numberOfLines={2}>
                    {a.address}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Embedded Google Map Section */}
      <View style={styles.mapSectionCard}>
        <View style={styles.mapSectionHeader}>
          <View style={styles.mapSectionTitleRow}>
            <View style={styles.mapIconCircle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
            </View>
            <View>
              <Text style={styles.mapSectionTitle}>Pinpoint on Google Map</Text>
              <Text style={styles.mapSectionSubtitle}>Drag marker or search below for exact doorstep</Text>
            </View>
          </View>
        </View>

        <GoogleMapsLocationPicker
          key={mapAddressKey}
          initialAddress={address}
          onSelectLocation={handleLocationPicked}
        />
      </View>

      {/* Complete Physical Address & Landmark Input */}
      <View style={styles.sectionWrap}>
        <View style={styles.addressLabelRow}>
          <Text style={styles.sectionTitle}>Complete Doorstep Address</Text>
          <Text style={styles.requiredLabel}>Required</Text>
        </View>
        <TextInput
          style={styles.addressInput}
          value={address}
          onChangeText={(t) => {
            onChangeAddress?.(t);
          }}
          placeholder="Flat / House / Floor No., Building name, Street, Landmark & Pincode..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={3}
        />
        <Text style={styles.inputHint}>
          Add flat, floor, or nearby landmark so the expert technician arrives smoothly.
        </Text>
      </View>

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
        style={[styles.primaryBtn, !canContinue && styles.primaryBtnDisabled]}
        disabled={!canContinue}
        onPress={onContinue}
        activeOpacity={0.88}
      >
        <Text style={styles.primaryBtnText}>Continue to Review & Confirm</Text>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#64748b',
    lineHeight: 20,
    fontWeight: '500',
  },
  sectionWrap: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requiredLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
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
  savedAddrText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
  mapSectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 12,
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
  },
  mapSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  mapSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  mapSectionSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  addressInput: {
    minHeight: 84,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 14,
    fontSize: 13.5,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)',
    lineHeight: 20,
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: '500',
  },
  validBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
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
    fontSize: 13,
    fontWeight: '800',
  },
  validOkHeader: {
    color: '#065f46',
  },
  validBadHeader: {
    color: '#991b1b',
  },
  validText: {
    fontSize: 12.5,
    lineHeight: 18,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 15,
    boxShadow: '0 6px 18px rgba(37, 99, 235, 0.28)',
    cursor: 'pointer',
    marginTop: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: '#94a3b8',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
