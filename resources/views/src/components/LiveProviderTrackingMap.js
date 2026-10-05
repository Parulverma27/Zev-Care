import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { loadGoogleMapsScript } from '../config/maps';
import { AppIcon } from './AppIcons';

export default function LiveProviderTrackingMap({
  customerCoords = { lat: 19.0596, lng: 72.8295 },
  customerAddress = '',
  providerName = 'Technician',
  providerPhone = '',
  providerCoords: providerCoordsProp = null,
  bookingStatus = 'ON_THE_WAY',
  lastUpdatedAt = null,
  onRefresh,
}) {
  const resolvedCustomer = {
    lat: Number(customerCoords?.lat) || 19.0596,
    lng: Number(customerCoords?.lng) || 72.8295,
  };

  const hasLiveProvider =
    providerCoordsProp &&
    Number.isFinite(Number(providerCoordsProp.lat)) &&
    Number.isFinite(Number(providerCoordsProp.lng));

  const [loading, setLoading] = useState(true);
  const [providerCoords, setProviderCoords] = useState(() =>
    hasLiveProvider
      ? { lat: Number(providerCoordsProp.lat), lng: Number(providerCoordsProp.lng) }
      : {
          lat: resolvedCustomer.lat + 0.0085,
          lng: resolvedCustomer.lng + 0.0065,
        }
  );
  const [distanceEta, setDistanceEta] = useState({ distance: '—', eta: '—' });

  const mapRef = useRef(null);
  const googleMapObj = useRef(null);
  const providerMarkerObj = useRef(null);
  const polylineObj = useRef(null);

  // Sync when booking receives a real GPS broadcast from the provider
  useEffect(() => {
    if (!hasLiveProvider) return;
    const next = { lat: Number(providerCoordsProp.lat), lng: Number(providerCoordsProp.lng) };
    setProviderCoords(next);
    if (providerMarkerObj.current && googleMapObj.current) {
      providerMarkerObj.current.setPosition(next);
      updatePolyline(next);
      calculateEta(next.lat, next.lng);
      googleMapObj.current.panTo({
        lat: (resolvedCustomer.lat + next.lat) / 2,
        lng: (resolvedCustomer.lng + next.lng) / 2,
      });
    }
  }, [providerCoordsProp?.lat, providerCoordsProp?.lng, hasLiveProvider]);

  // Do not invent fake live GPS — wait for a real provider broadcast
  useEffect(() => {
    if (hasLiveProvider) return undefined;
    if (bookingStatus === 'ON_THE_WAY' || bookingStatus === 'ASSIGNED') {
      setDistanceEta({ distance: '—', eta: 'Awaiting GPS' });
    }
    return undefined;
  }, [bookingStatus, hasLiveProvider]);

  useEffect(() => {
    let isMounted = true;
    loadGoogleMapsScript()
      .then((maps) => {
        if (!isMounted) return;
        setLoading(false);
        initMap(maps);
      })
      .catch((err) => {
        console.error('Failed to load map for tracking:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const initMap = (maps) => {
    if (!mapRef.current || !maps) return;

    const center = {
      lat: (resolvedCustomer.lat + providerCoords.lat) / 2,
      lng: (resolvedCustomer.lng + providerCoords.lng) / 2,
    };

    googleMapObj.current = new maps.Map(mapRef.current, {
      center,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
    });

    new maps.Marker({
      position: resolvedCustomer,
      map: googleMapObj.current,
      title: customerAddress || 'Service Destination',
      icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#2563eb',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
    });

    providerMarkerObj.current = new maps.Marker({
      position: providerCoords,
      map: googleMapObj.current,
      title: `${providerName} (Technician)`,
      icon: {
        path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#16a34a',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });

    updatePolyline(providerCoords);
    calculateEta(providerCoords.lat, providerCoords.lng);
  };

  const updatePolyline = (pPos) => {
    if (!window.google || !window.google.maps || !googleMapObj.current) return;
    if (polylineObj.current) polylineObj.current.setMap(null);

    polylineObj.current = new window.google.maps.Polyline({
      path: [pPos, resolvedCustomer],
      geodesic: true,
      strokeColor: '#2563eb',
      strokeOpacity: 0.8,
      strokeWeight: 4,
    });

    polylineObj.current.setMap(googleMapObj.current);
  };

  const calculateEta = (pLat, pLng) => {
    const R = 6371;
    const dLat = ((resolvedCustomer.lat - pLat) * Math.PI) / 180;
    const dLng = ((resolvedCustomer.lng - pLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pLat * Math.PI) / 180) *
        Math.cos((resolvedCustomer.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = R * c;

    const etaMins = Math.max(1, Math.round(distKm * 4.5));
    setDistanceEta({
      distance: `${distKm.toFixed(1)} km`,
      eta: `${etaMins} mins`,
    });
  };

  const getStatusBadge = () => {
    switch (bookingStatus) {
      case 'ASSIGNED':
        return { label: 'Technician Assigned', color: '#0284c7', bg: '#e0f2fe' };
      case 'ON_THE_WAY':
        return { label: hasLiveProvider ? 'Live GPS · On The Way' : 'Technician On The Way', color: '#16a34a', bg: '#dcfce7' };
      case 'ARRIVED':
        return { label: 'Technician Arrived', color: '#9333ea', bg: '#f3e8ff' };
      case 'IN_PROGRESS':
        return { label: 'Service In Progress', color: '#d97706', bg: '#fef3c7' };
      case 'COMPLETED':
        return { label: 'Service Completed', color: '#16a34a', bg: '#dcfce7' };
      default:
        return { label: 'Order Processing', color: '#475569', bg: '#f1f5f9' };
    }
  };

  const badge = getStatusBadge();
  const updatedLabel = lastUpdatedAt
    ? (() => {
        try {
          return `Updated ${new Date(lastUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Live Technician Tracking</Text>
          <Text style={styles.headerSub}>
            {providerName}
            {providerPhone ? ` · ${providerPhone}` : ''}
          </Text>
          {customerAddress ? (
            <Text style={[styles.headerSub, { marginTop: 2 }]} numberOfLines={1}>
              Dest: {customerAddress}
            </Text>
          ) : null}
          {updatedLabel ? <Text style={styles.updatedTxt}>{updatedLabel}</Text> : null}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: badge.color }]} />
          <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Initializing Live Map...</Text>
          </View>
        ) : (
          <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '14px' }} />
        )}
      </View>

      <View style={styles.etaBar}>
        <View style={styles.etaItem}>
          <AppIcon name="clock" size={16} color="#2563eb" />
          <View>
            <Text style={styles.etaLabel}>Estimated Arrival</Text>
            <Text style={styles.etaValue}>{distanceEta.eta}</Text>
          </View>
        </View>

        <View style={styles.etaSep} />

        <View style={styles.etaItem}>
          <AppIcon name="navigation" size={16} color="#16a34a" />
          <View>
            <Text style={styles.etaLabel}>Live Distance</Text>
            <Text style={styles.etaValue}>{distanceEta.distance}</Text>
          </View>
        </View>

        {onRefresh && (
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
            <AppIcon name="refresh-cw" size={14} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    fontFamily: 'Inter, sans-serif',
    marginTop: 2,
  },
  updatedTxt: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 4,
    fontFamily: 'Inter, sans-serif',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
  },
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  etaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'space-between',
  },
  etaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  etaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  etaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  etaSep: {
    width: 1,
    height: 24,
    backgroundColor: '#cbd5e1',
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
});
