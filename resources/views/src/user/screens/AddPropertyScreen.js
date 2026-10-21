import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Platform } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AppIcon } from '../../components/AppIcons';
import GoogleMapsLocationPicker from '../../components/GoogleMapsLocationPicker';
import { upsertDefaultAddress } from '../../utils/savedAddresses';

const PROPERTY_TYPES = [
  {
    id: 'HOME',
    label: 'HOME',
    image: require('../../../assets/property_home.png'),
  },
  {
    id: 'VILLA',
    label: 'VILLA',
    image: require('../../../assets/property_villa.png'),
  },
  {
    id: 'PG',
    label: 'PG',
    image: require('../../../assets/property_pg.png'),
  },
];

export default function AddPropertyScreen() {
  const { activeUser, updateProfile } = useApp();
  const navigate = useNavigate();

  const [propertyType, setPropertyType] = useState('HOME');
  const [propertyName, setPropertyName] = useState('');
  const [houseNo, setHouseNo] = useState('');
  const [floor, setFloor] = useState('');
  const [bhk, setBhk] = useState('');
  const [address, setAddress] = useState(activeUser?.address || '');
  const [contact, setContact] = useState(activeUser?.phone || '');
  const [error, setError] = useState('');

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
        tag: propertyName.trim() || 'Home',
      }),
    });

    navigate('/user/plans');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigate('/user/register')} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressWrap}>
          <Text style={styles.stepLabel}>Step 1 of 2</Text>
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
          Continue
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
    { id: 'HOME', label: 'Home' },
    { id: 'VILLA', label: 'Villa' },
    { id: 'PG', label: 'PG / Co-Living' },
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
});

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
