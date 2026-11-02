import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Platform, useWindowDimensions } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AppIcon } from '../../components/AppIcons';
import GoogleMapsLocationPicker from '../../components/GoogleMapsLocationPicker';
import { upsertDefaultAddress } from '../../utils/savedAddresses';

const PROPERTY_TYPES = [
  {
    id: 'Independent house/floor',
    label: 'Independent house/floor',
    image: require('../../../assets/property_home.png'),
  },
  {
    id: 'Villa',
    label: 'Villa',
    image: require('../../../assets/property_villa.png'),
  },
  {
    id: 'PG',
    label: 'PG',
    image: require('../../../assets/property_pg.png'),
  },
  {
    id: 'Rented home/floor',
    label: 'Rented home/floor',
    image: require('../../../assets/property_home.png'),
  },
];

export default function AddPropertyScreen() {
  const { activeUser, updateProfile } = useApp();
  const navigate = useNavigate();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;

  const [propertyType, setPropertyType] = useState('Independent house/floor');
  const [propertyName, setPropertyName] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [floor, setFloor] = useState('');
  const [bhk, setBhk] = useState('');
  const [address, setAddress] = useState(activeUser?.address || '');
  const [contact, setContact] = useState(activeUser?.phone || '');
  const [error, setError] = useState('');
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [locFeedback, setLocFeedback] = useState('');

  const handleUseCurrentLocation = () => {
    setLocFeedback('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocFeedback('Geolocation is not supported by your browser or device.');
      return;
    }

    setDetectingLoc(true);
    setLocFeedback('Detecting your GPS location...');

    const fallbackOsm = (lat, lng) => {
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`, {
        headers: { 'Accept-Language': 'en' },
      })
        .then((r) => r.json())
        .then((data) => {
          setDetectingLoc(false);
          if (data && data.display_name) {
            setAddress(data.display_name);
            setLocFeedback('✓ Current GPS location detected & filled!');
          } else {
            setLocFeedback('Unable to reverse-geocode coordinates. Please enter manually.');
          }
        })
        .catch(() => {
          setDetectingLoc(false);
          setLocFeedback('Unable to reverse-geocode coordinates.');
        });
    };

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
              setDetectingLoc(false);
              setAddress(formatted);
              setLocFeedback('✓ Current GPS location detected & filled!');
            } else {
              fallbackOsm(lat, lng);
            }
          });
        } else {
          fallbackOsm(lat, lng);
        }
      },
      (err) => {
        setDetectingLoc(false);
        if (err.code === 1) {
          setLocFeedback('Location permission denied. Please allow access in browser settings.');
        } else {
          setLocFeedback('Unable to retrieve location. Please use map picker or enter manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const isFormValid =
    Boolean(propertyType) &&
    Boolean(propertyName.trim()) &&
    Boolean(houseNo.trim()) &&
    Boolean(floor.trim()) &&
    Boolean(bhk.trim()) &&
    Boolean(address.trim()) &&
    Boolean(contact.trim());

  const handleContinue = () => {
    if (!isFormValid) {
      setError('Please fill in all property details (Property Name, House/Flat No., Floor, BHK, Address, and Contact Number) to continue.');
      return;
    }
    setError('');

    const fullAddress = [houseNo.trim(), floor.trim(), bhk.trim(), address.trim()].filter(Boolean).join(', ');

    const property = {
      type: propertyType,
      name: propertyName.trim(),
      houseNo: houseNo.trim(),
      floor: floor.trim(),
      bhk: bhk.trim(),
      address: fullAddress,
      contact: contact.trim() || activeUser?.phone,
    };

    updateProfile({
      ...activeUser,
      address: fullAddress,
      property,
      saved_addresses: upsertDefaultAddress(activeUser?.saved_addresses || [], fullAddress, {
        tag: propertyType || 'Independent house/floor',
      }),
    });

    navigate('/user/home');
  };

  if (isDesktopWeb) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentDesktop}
        showsVerticalScrollIndicator={false}
      >
        <div style={desktopContainerStyle}>
          {/* Left Column: Brand & Value Showcase */}
          <div style={desktopLeftColStyle}>
            <View style={styles.topRow}>
              <TouchableOpacity style={styles.backPillDesktop} onPress={() => navigate('/user/register')} activeOpacity={0.7}>
                <Text style={styles.backPillDesktopText}>← Back</Text>
              </TouchableOpacity>
              <View style={styles.progressWrap}>
                <Text style={styles.stepLabel}>Setup Property</Text>
                <View style={styles.progressTrack}>
                  <View style={styles.progressFill} />
                </View>
              </View>
            </View>

            <Text style={styles.titleDesktop}>Tell us about your home</Text>
            <Text style={styles.subtitleDesktop}>
              Add your primary residence so we can organize your appliances, verify AMC coverage, and dispatch technicians smoothly.
            </Text>

            {/* Visual Property Type Cards */}
            <View style={{ marginTop: 8, gap: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>Select Property Type</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {PROPERTY_TYPES.map((pt) => {
                  const isSel = propertyType === pt.id;
                  return (
                    <TouchableOpacity
                      key={pt.id}
                      style={[
                        styles.propertyTypeCard,
                        isSel && styles.propertyTypeCardSelected,
                      ]}
                      onPress={() => setPropertyType(pt.id)}
                      activeOpacity={0.88}
                    >
                      <Image source={pt.image} style={styles.propertyTypeImage} resizeMode="contain" />
                      <Text style={[styles.propertyTypeLabel, isSel && styles.propertyTypeLabelSelected]}>
                        {pt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3 Core Value Props */}
            <View style={styles.benefitsCard}>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIconBox}>
                  <AppIcon name="shield" size={16} color="#0052e0" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>Zero-Hassle AMC Protection</Text>
                  <Text style={styles.benefitSub}>₹0 breakdown labor and priority repairs for AC, Plumber & Electrician.</Text>
                </View>
              </View>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIconBox}>
                  <AppIcon name="map-pin" size={16} color="#0052e0" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>Accurate Doorstep Dispatch</Text>
                  <Text style={styles.benefitSub}>Pinpointed GPS location ensures technicians reach your home without calling for directions.</Text>
                </View>
              </View>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIconBox}>
                  <AppIcon name="file-text" size={16} color="#0052e0" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.benefitTitle}>Digital Warranty Vault</Text>
                  <Text style={styles.benefitSub}>Invoices, photos, and live inspection walkthroughs stored securely in one place.</Text>
                </View>
              </View>
            </View>
          </div>

          {/* Right Column: Spacious Form Card */}
          <div style={desktopRightColStyle}>
            <Text style={styles.formCardHeading}>Property & Location Details</Text>
            <Text style={styles.formCardSub}>Please enter your full address and contact details.</Text>

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            )}

            {/* Property Type Dropdown */}
            <PropertyTypeDropdown value={propertyType} onChange={setPropertyType} />

            <View style={styles.formRow}>
              <View style={styles.halfField}>
                <Field label="Property Name" value={propertyName} onChangeText={setPropertyName} placeholder="e.g. My Home, Green Villa" />
              </View>
              <View style={styles.halfField}>
                <Field label="House / Flat No." value={houseNo} onChangeText={setHouseNo} placeholder="e.g. 302, Flat B-4" />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.halfField}>
                <Field label="Floor" value={floor} onChangeText={setFloor} placeholder="e.g. 3rd Floor, Ground" />
              </View>
              <View style={styles.halfField}>
                <Field label="BHK Configuration" value={bhk} onChangeText={setBhk} placeholder="e.g. 2 BHK, 3 BHK, Studio" />
              </View>
            </View>

            {/* Quick Location Action Button */}
            <View style={{ marginBottom: 10 }}>
              <TouchableOpacity
                onPress={handleUseCurrentLocation}
                disabled={detectingLoc}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: '#0f172a',
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                }}
                activeOpacity={0.85}
              >
                <AppIcon name="map-pin" size={14} color="#38bdf8" />
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>
                  {detectingLoc ? 'Detecting GPS Location...' : 'Use My Current Location'}
                </Text>
              </TouchableOpacity>
              {locFeedback ? (
                <Text style={{ fontSize: 11.5, color: locFeedback.includes('✓') ? '#15803d' : '#dc2626', marginTop: 4, textAlign: 'center' }}>
                  {locFeedback}
                </Text>
              ) : null}
            </View>

            <Field label="Full Address / Landmark" value={address} onChangeText={setAddress} placeholder="e.g. 123, Green Park, Near City Center, Jaipur" multiline />

            {/* Embedded Google Map */}
            <View style={{ marginTop: 4, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AppIcon name="map-pin" size={14} color="#2563eb" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e293b' }}>
                  Pinpoint Property on Map
                </Text>
              </View>
              <GoogleMapsLocationPicker
                initialAddress={address}
                onSelectLocation={(loc) => {
                  if (loc && loc.address) {
                    setAddress(loc.address);
                  }
                }}
              />
            </View>

            <Field
              label="Contact Number for Technicians"
              value={contact}
              onChangeText={(v) => setContact(v)}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.continueBtn, !isFormValid && styles.continueBtnDisabled]}
              onPress={handleContinue}
              disabled={!isFormValid}
              activeOpacity={isFormValid ? 0.88 : 1}
            >
              <Text style={[styles.continueBtnText, !isFormValid && styles.continueBtnTextDisabled]}>
                Save & Continue to Home →
              </Text>
            </TouchableOpacity>
          </div>
        </div>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigate('/user/register')} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          <Text style={styles.stepLabel}>Setup Property</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>

      <Text style={styles.title}>Tell us about your home</Text>
      <Text style={styles.subtitle}>Add a property so we can organize your appliances and service requests.</Text>

      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠ {error}</Text>
        </View>
      )}

      {/* Property Type Dropdown Input */}
      <PropertyTypeDropdown value={propertyType} onChange={setPropertyType} />

      <View style={styles.formRow}>
        <View style={styles.halfField}>
          <Field label="Property Name" value={propertyName} onChangeText={setPropertyName} placeholder="My Home" />
        </View>
        <View style={styles.halfField}>
          <Field label="House / Apartment No." value={houseNo} onChangeText={setHouseNo} placeholder="302" />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.halfField}>
          <Field label="Floor" value={floor} onChangeText={setFloor} placeholder="3rd Floor" />
        </View>
        <View style={styles.halfField}>
          <Field label="BHK" value={bhk} onChangeText={setBhk} placeholder="3 BHK" />
        </View>
      </View>

      {/* Quick Location Action Button */}
      <View style={{ marginBottom: 10 }}>
        <TouchableOpacity
          onPress={handleUseCurrentLocation}
          disabled={detectingLoc}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: '#0f172a',
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 10,
          }}
          activeOpacity={0.85}
        >
          <AppIcon name="map-pin" size={14} color="#38bdf8" />
          <Text style={{ color: '#ffffff', fontSize: 12.5, fontWeight: '700' }}>
            {detectingLoc ? 'Detecting GPS Location...' : 'Use My Current Location'}
          </Text>
        </TouchableOpacity>
        {locFeedback ? (
          <Text style={{ fontSize: 11.5, color: locFeedback.includes('✓') ? '#15803d' : '#dc2626', marginTop: 4, textAlign: 'center' }}>
            {locFeedback}
          </Text>
        ) : null}
      </View>

      <Field label="Address" value={address} onChangeText={setAddress} placeholder="123, Green Park, Jaipur" multiline />

      {/* Embedded Interactive Google Map */}
      <View style={{ marginTop: 2, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <AppIcon name="map-pin" size={13} color="#2563eb" />
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#1e293b' }}>
            Property Location on Map
          </Text>
        </View>
        <GoogleMapsLocationPicker
          initialAddress={address}
          onSelectLocation={(loc) => {
            if (loc && loc.address) {
              setAddress(loc.address);
            }
          }}
        />
      </View>

      <Field
        label="Contact Number"
        value={contact}
        onChangeText={(v) => setContact(v)}
        placeholder="+91 98765 43210"
        keyboardType="phone-pad"
      />

      <TouchableOpacity
        style={[styles.continueBtn, !isFormValid && styles.continueBtnDisabled]}
        onPress={handleContinue}
        disabled={!isFormValid}
        activeOpacity={isFormValid ? 0.88 : 1}
      >
        <Text style={[styles.continueBtnText, !isFormValid && styles.continueBtnTextDisabled]}>
          Save & Continue to Home →
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          focused && styles.fieldInputFocused,
          multiline && styles.fieldInputMultiline
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        multiline={multiline}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function PropertyTypeDropdown({ value, onChange }) {
  const options = [
    { id: 'Independent house/floor', label: 'Independent house/floor' },
    { id: 'Villa', label: 'Villa' },
    { id: 'PG', label: 'PG' },
    { id: 'Rented home/floor', label: 'Rented home/floor' },
  ];

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>Property Type</Text>
      {Platform.OS === 'web' ? (
        <div style={selectWebCss.wrapper}>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={selectWebCss.select}
          >
            {options.map((opt) => (
              <option key={opt.id} value={opt.id} style={selectWebCss.option}>
                {opt.label}
              </option>
            ))}
          </select>
          <div style={selectWebCss.arrow}>▼</div>
        </div>
      ) : (
        <View style={styles.pickerRow}>
          {options.map((opt) => {
            const selected = value === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.pickerBtn, selected && styles.pickerBtnSelected]}
                onPress={() => onChange(opt.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pickerBtnText, selected && styles.pickerBtnTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 16,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    boxSizing: 'border-box',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backArrow: { fontSize: 18, color: '#0f172a', fontWeight: '600' },
  progressWrap: { flex: 1, gap: 6 },
  stepLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', fontFamily: 'Inter, sans-serif' },
  progressTrack: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 99, overflow: 'hidden' },
  progressFill: { width: '50%', height: '100%', backgroundColor: '#2563eb', borderRadius: 99 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3, fontFamily: 'Inter, sans-serif' },
  subtitle: { fontSize: 13, color: '#64748b', lineHeight: 19, marginTop: -6, marginBottom: 6, fontFamily: 'Inter, sans-serif' },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 10 },
  errorText: { color: '#dc2626', fontSize: 12, fontWeight: '600', fontFamily: 'Inter, sans-serif' },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  pickerBtnSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  pickerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pickerBtnTextSelected: {
    color: '#2563eb',
    fontWeight: '700',
  },
  checkCircleUnselected: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
  },
  fieldInputFocused: {
    borderColor: '#0052e0',
    borderWidth: 1.5,
    boxShadow: '0 0 0 3.5px rgba(0, 82, 224, 0.12)',
  },
  fieldInputMultiline: { minHeight: 60, textAlignVertical: 'top' },
  continueBtn: {
    marginTop: 10,
    backgroundColor: '#0052e0',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: '#cbd5e1',
    opacity: 0.65,
    cursor: 'not-allowed',
  },
  continueBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  continueBtnTextDisabled: { color: '#94a3b8' },

  /* Desktop Studio Styles */
  contentDesktop: {
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    boxSizing: 'border-box',
  },
  backPillDesktop: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPillDesktopText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  titleDesktop: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.8,
    fontFamily: "'Outfit', 'Inter', sans-serif",
    lineHeight: 40,
  },
  subtitleDesktop: {
    fontSize: 14.5,
    color: '#64748b',
    lineHeight: 22,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  propertyTypeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  propertyTypeCardSelected: {
    borderColor: '#0052e0',
    backgroundColor: '#eff6ff',
    boxShadow: '0 4px 14px rgba(0, 82, 224, 0.15)',
  },
  propertyTypeImage: {
    width: 64,
    height: 64,
  },
  propertyTypeLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  propertyTypeLabelSelected: {
    color: '#0052e0',
    fontWeight: '800',
  },
  benefitsCard: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    padding: 20,
    gap: 16,
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  benefitIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  benefitTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  benefitSub: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    marginTop: 2,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  formCardHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    letterSpacing: -0.4,
  },
  formCardSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: -8,
    marginBottom: 4,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
});

const desktopContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)',
  gap: '36px',
  alignItems: 'start',
  width: '100%',
};

const desktopLeftColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  minWidth: 0,
};

const desktopRightColStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  backgroundColor: '#ffffff',
  borderRadius: '24px',
  padding: '32px 32px 36px',
  border: '1.5px solid rgba(226, 232, 240, 0.9)',
  boxShadow: '0 12px 36px -8px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.02)',
  boxSizing: 'border-box',
  minWidth: 0,
};

const selectWebCss = {
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  select: {
    width: '100%',
    backgroundColor: '#ffffff',
    border: '1.5px solid #cbd5e1',
    borderRadius: '12px',
    padding: '12px 38px 12px 14px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  arrow: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    fontSize: '11px',
    color: '#64748b',
  },
  option: {
    padding: '10px',
    fontSize: '14px',
    color: '#0f172a',
  },
};
