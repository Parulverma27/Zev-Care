import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { loadGoogleMapsScript } from '../config/maps';
import { AppIcon } from './AppIcons';

/**
 * Shows customer service address on a map for the assigned provider.
 */
export default function ClientLocationMap({
  customerCoords = null,
  customerAddress = '',
  customerName = 'Customer',
  customerPhone = '',
}) {
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const mapRef = useRef(null);
  const googleMapObj = useRef(null);

  const coords =
    customerCoords &&
    Number.isFinite(Number(customerCoords.lat)) &&
    Number.isFinite(Number(customerCoords.lng))
      ? { lat: Number(customerCoords.lat), lng: Number(customerCoords.lng) }
      : null;

  const embedUrl = coords
    ? `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`
    : customerAddress
      ? `https://maps.google.com/maps?q=${encodeURIComponent(customerAddress)}&z=15&output=embed`
      : null;

  useEffect(() => {
    if (!coords || Platform.OS !== 'web') {
      setLoading(false);
      return;
    }
    let mounted = true;
    loadGoogleMapsScript()
      .then((maps) => {
        if (!mounted || !mapRef.current) return;
        setLoading(false);
        googleMapObj.current = new maps.Map(mapRef.current, {
          center: coords,
          zoom: 15,
          disableDefaultUI: true,
          zoomControl: true,
        });
        new maps.Marker({
          position: coords,
          map: googleMapObj.current,
          title: customerName,
        });
      })
      .catch(() => {
        if (mounted) {
          setLoading(false);
          setMapError(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, [coords?.lat, coords?.lng, customerName]);

  const openExternal = () => {
    const url = coords
      ? `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(customerAddress || '')}`;
    if (typeof window !== 'undefined') window.open(url, '_blank');
  };

  const callCustomer = () => {
    if (!customerPhone || typeof window === 'undefined') return;
    window.open(`tel:${String(customerPhone).replace(/\s/g, '')}`);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Customer location</Text>
          <Text style={styles.sub} numberOfLines={2}>
            {customerAddress || 'Address on booking'}
          </Text>
        </View>
        <TouchableOpacity style={styles.navBtn} onPress={openExternal} activeOpacity={0.85}>
          <Text style={styles.navBtnTxt}>Navigate</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapBox}>
        {loading && !mapError && coords ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#2563eb" />
            <Text style={styles.loadingTxt}>Loading map…</Text>
          </View>
        ) : coords && !mapError && Platform.OS === 'web' ? (
          <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
        ) : embedUrl && Platform.OS === 'web' ? (
          <iframe
            title="Customer location"
            src={embedUrl}
            style={{ width: '100%', height: '100%', border: 0, borderRadius: 12 }}
            loading="lazy"
          />
        ) : (
          <View style={styles.loadingBox}>
            <Text style={styles.loadingTxt}>Map unavailable — use Navigate for directions.</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.callBtn} onPress={callCustomer} activeOpacity={0.85}>
          <AppIcon name="phone" size={14} color="#2563eb" />
          <Text style={styles.callBtnTxt}>Call {customerName.split(' ')[0] || 'customer'}</Text>
        </TouchableOpacity>
        {coords ? (
          <Text style={styles.coords}>
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  sub: { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 17 },
  navBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  navBtnTxt: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  mapBox: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16 },
  loadingTxt: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  callBtnTxt: { color: '#2563eb', fontSize: 12, fontWeight: '700' },
  coords: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
});
