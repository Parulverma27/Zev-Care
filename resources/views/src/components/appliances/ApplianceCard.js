import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';

export default function ApplianceCard({ appliance, selected = false, onPress, style }) {
  if (!appliance) return null;
  const isOther = appliance.id === 'other';

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected, style]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={appliance.name}
      accessibilityState={{ selected }}
    >
      <View style={styles.imageWrap}>
        {isOther ? (
          <View style={styles.otherIcon}>
            <Text style={styles.otherDots}>•••</Text>
          </View>
        ) : (
          <Image
            source={{ uri: appliance.image }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={`${appliance.name} image`}
          />
        )}
      </View>
      <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={2}>
        {appliance.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 96,
    maxWidth: 140,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)', cursor: 'pointer' }
      : { elevation: 2 }),
  },
  cardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  imageWrap: {
    width: '100%',
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  image: {
    width: '88%',
    height: 68,
  },
  otherIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherDots: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '800',
    letterSpacing: 2,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  nameSelected: {
    color: '#1d4ed8',
  },
});
