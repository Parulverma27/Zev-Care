import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import BookingProgress from './BookingProgress';
import LiveSupportOptionCard from './LiveSupportOptionCard';

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
  const canContinue = locationValidation?.isSupported;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backChevron}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <BookingProgress activeIndex={3} />
        </View>
      </View>

      <Text style={styles.title}>{isConsultation ? 'Doorstep inspection location' : 'Service location'}</Text>
      <Text style={styles.subtitle}>
        {isConsultation ? 'Choose where you want the technician to visit.' : 'Choose a saved address or enter a new one.'}
      </Text>

      {addresses.length > 0 && (
        <View style={styles.list}>
          {addresses.map((a) => {
            const on = selectedAddressId === a.id || (!selectedAddressId && a.address === address);
            return (
              <TouchableOpacity
                key={a.id}
                style={[styles.addrCard, on && styles.addrCardOn]}
                onPress={() => onSelectSaved?.(a)}
              >
                <Text style={styles.tag}>{a.tag || 'Address'}</Text>
                <Text style={styles.addrText}>{a.address}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={styles.section}>Address</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={onChangeAddress}
        placeholder="Enter complete service address with pincode"
        placeholderTextColor="#94a3b8"
        multiline
      />


      {locationValidation && (
        <View style={[styles.validBanner, canContinue ? styles.validOk : styles.validBad]}>
          <Text style={[styles.validText, canContinue ? styles.validOkText : styles.validBadText]}>
            {locationValidation.message}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.primaryBtn, !canContinue && styles.primaryBtnDisabled]}
        disabled={!canContinue}
        onPress={onContinue}
      >
        <Text style={styles.primaryBtnText}>Continue</Text>
      </TouchableOpacity>

      {onLiveSupport && (
        <View style={{ marginTop: 10 }}>
          <LiveSupportOptionCard onPress={onLiveSupport} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, gap: 12, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: { fontSize: 28, color: '#0f172a', marginTop: -2 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: -4 },
  list: { gap: 8 },
  addrCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    gap: 4,
  },
  addrCardOn: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  tag: { fontSize: 12, fontWeight: '700', color: '#2563eb' },
  addrText: { fontSize: 13, color: '#334155', lineHeight: 18 },
  section: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  input: {
    minHeight: 80,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    textAlignVertical: 'top',
  },
  rowBtns: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  secondaryBtn: {
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '700', color: '#1d4ed8' },
  error: { color: '#dc2626', fontSize: 13 },
  validBanner: { padding: 12, borderRadius: 12 },
  validOk: { backgroundColor: '#ecfdf5' },
  validBad: { backgroundColor: '#fef2f2' },
  validText: { fontSize: 13, lineHeight: 18 },
  validOkText: { color: '#047857' },
  validBadText: { color: '#b91c1c' },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: { backgroundColor: '#94a3b8' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  mapBox: {
    marginTop: 8,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    gap: 8,
  },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8 },
  mapTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  mapClose: { fontSize: 13, fontWeight: '700', color: '#2563eb' },
});
