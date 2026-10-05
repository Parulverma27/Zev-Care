import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SERVICE_IMAGES } from '../../utils/bundledImages';

export default function BookingApplianceCard({ appliance, selected, onPress }) {
  if (!appliance) return null;
  const img =
    appliance.img ||
    appliance.uploadedMediaUri ||
    appliance.media?.url ||
    SERVICE_IMAGES.homeAppliances;
  const meta = [appliance.brand, appliance.capacity || appliance.type, appliance.location]
    .filter(Boolean)
    .join(' · ');

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
    >
      <Image source={{ uri: img }} style={styles.img} resizeMode="cover" />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {appliance.name || appliance.displayName || 'Appliance'}
        </Text>
        {!!meta && (
          <Text style={styles.meta} numberOfLines={2}>
            {meta}
          </Text>
        )}
        {!!appliance.condition && (
          <Text style={styles.condition} numberOfLines={1}>
            {appliance.condition}
          </Text>
        )}
      </View>
      <Text style={[styles.chevron, selected && styles.chevronOn]}>{selected ? '✓' : '›'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  cardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  img: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#f1f5f9' },
  body: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  meta: { fontSize: 12, color: '#64748b', lineHeight: 16 },
  condition: { fontSize: 11, color: '#2563eb', fontWeight: '600', marginTop: 2 },
  chevron: { fontSize: 20, color: '#94a3b8', fontWeight: '600' },
  chevronOn: { color: '#2563eb' },
});
