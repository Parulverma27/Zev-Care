import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { loadGoogleMapsScript } from '../../config/maps';

export default function FleetRadarMap({
  providers = [],
  onSelectProvider,
  onToggleDuty,
}) {
  const [selectedPin, setSelectedPin] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'ONLINE' | 'OFFLINE'
  const mapContainerRef = useRef(null);
  const googleMapInstance = useRef(null);
  const markersRef = useRef([]);

  const onlineCount = providers.filter((p) => p.is_online !== false).length;
  const offlineCount = providers.length - onlineCount;

  const filteredProviders = providers.filter((p) => {
    if (filterMode === 'ONLINE') return p.is_online !== false;
    if (filterMode === 'OFFLINE') return p.is_online === false;
    return true;
  });

  useEffect(() => {
    let isMounted = true;

    if (Platform.OS === 'web') {
      loadGoogleMapsScript()
        .then((google) => {
          if (!isMounted || !mapContainerRef.current || !google?.maps) {
            setMapLoading(false);
            return;
          }

          // Center around Gurugram / NCR where Zevota providers operate
          const center = { lat: 28.4595, lng: 77.0266 };

          if (!googleMapInstance.current) {
            googleMapInstance.current = new google.maps.Map(mapContainerRef.current, {
              center,
              zoom: 12,
              styles: [
                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
              ],
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
            });
          }

          // Clear existing markers
          markersRef.current.forEach((m) => m.setMap(null));
          markersRef.current = [];

          const bounds = new google.maps.LatLngBounds();
          let validCount = 0;

          filteredProviders.forEach((p) => {
            const lat = Number(p.coords?.lat);
            const lng = Number(p.coords?.lng);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
              validCount++;
              const isOnline = p.is_online !== false;
              const pos = { lat, lng };
              bounds.extend(pos);

              const marker = new google.maps.Marker({
                position: pos,
                map: googleMapInstance.current,
                title: `${p.name} (${isOnline ? 'ONLINE' : 'OFFLINE'})`,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: isOnline ? 9 : 7,
                  fillColor: isOnline ? '#10b981' : '#94a3b8',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2.5,
                },
              });

              marker.addListener('click', () => {
                setSelectedPin(p);
                if (onSelectProvider) onSelectProvider(p);
              });

              markersRef.current.push(marker);
            }
          });

          if (validCount > 0 && googleMapInstance.current) {
            googleMapInstance.current.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
          }

          setMapLoading(false);
        })
        .catch(() => {
          if (isMounted) setMapLoading(false);
        });
    } else {
      setMapLoading(false);
    }

    return () => {
      isMounted = false;
      markersRef.current.forEach((m) => m.setMap(null));
    };
  }, [filteredProviders]);

  return (
    <View style={styles.container}>
      {/* Top Radar Overview Bar */}
      <View style={styles.radarHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.radarLiveBadge}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveBadgeText}>LIVE FLEET RADAR</Text>
          </View>
          <Text style={styles.radarSubtitle}>
            {providers.length} Registered Field Partners · Gurugram / NCR
          </Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillGroup}>
          <TouchableOpacity
            style={[styles.radarPill, filterMode === 'ALL' && styles.radarPillActive]}
            onPress={() => setFilterMode('ALL')}
            activeOpacity={0.8}
          >
            <Text style={[styles.radarPillText, filterMode === 'ALL' && styles.radarPillTextActive]}>
              All ({providers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.radarPill, filterMode === 'ONLINE' && styles.radarPillActiveGreen]}
            onPress={() => setFilterMode('ONLINE')}
            activeOpacity={0.8}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 4 }} />
            <Text style={[styles.radarPillText, filterMode === 'ONLINE' && { color: '#047857', fontWeight: '800' }]}>
              Online ({onlineCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.radarPill, filterMode === 'OFFLINE' && styles.radarPillActiveGray]}
            onPress={() => setFilterMode('OFFLINE')}
            activeOpacity={0.8}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#94a3b8', marginRight: 4 }} />
            <Text style={[styles.radarPillText, filterMode === 'OFFLINE' && { color: '#475569', fontWeight: '800' }]}>
              Offline ({offlineCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Map + Fleet Side Console */}
      <View style={styles.radarBody}>
        {/* Map Container */}
        <View style={styles.mapWrap}>
          {mapLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={{ marginTop: 8, fontSize: 12, color: '#64748b', fontWeight: '600' }}>
                Connecting to Google Fleet Coordinates...
              </Text>
            </View>
          )}
          {Platform.OS === 'web' && (
            <div
              ref={mapContainerRef}
              style={{ width: '100%', height: '100%', minHeight: 440, borderRadius: 12 }}
            />
          )}
        </View>

        {/* Selected Partner / Fleet List Console */}
        <View style={styles.sideConsole}>
          <Text style={styles.consoleTitle}>
            {selectedPin ? 'Selected Partner Details' : 'Field Technician Fleet'}
          </Text>

          {selectedPin ? (
            <View style={styles.selectedPartnerCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partnerNameText}>{selectedPin.name}</Text>
                  <Text style={styles.partnerTradeText}>{selectedPin.trade || 'Certified Specialist'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <Text style={styles.partnerLocationText}>{selectedPin.location || 'Gurugram'}</Text>
                  </View>
                </View>

                {/* Duty Toggle Pill */}
                <TouchableOpacity
                  style={[
                    styles.dutyTogglePill,
                    selectedPin.is_online !== false ? styles.dutyOnlinePill : styles.dutyOfflinePill,
                  ]}
                  onPress={() => {
                    const next = selectedPin.is_online === false;
                    if (onToggleDuty) onToggleDuty(selectedPin.id, next);
                    setSelectedPin({ ...selectedPin, is_online: next });
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: selectedPin.is_online !== false ? '#10b981' : '#94a3b8',
                      marginRight: 4,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color: selectedPin.is_online !== false ? '#047857' : '#64748b',
                    }}
                  >
                    {selectedPin.is_online !== false ? 'ONLINE' : 'OFFLINE'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <Text style={styles.statNum}>{selectedPin.rating || '5.0'}</Text>
                  </View>
                  <Text style={styles.statLbl}>Rating</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{selectedPin.experience || '5 Yrs'}</Text>
                  <Text style={styles.statLbl}>Experience</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{selectedPin.phone || '—'}</Text>
                  <Text style={styles.statLbl}>Contact</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  style={styles.inspectBtn}
                  onPress={() => onSelectProvider && onSelectProvider(selectedPin)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.inspectBtnText}>View Full Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closePinBtn}
                  onPress={() => setSelectedPin(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closePinBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ gap: 8, flex: 1, overflow: 'auto' }}>
              {filteredProviders.map((p) => {
                const isOnline = p.is_online !== false;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={styles.fleetRowItem}
                    onPress={() => setSelectedPin(p)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: isOnline ? '#10b981' : '#94a3b8',
                          }}
                        />
                        <Text style={styles.fleetNameText}>{p.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: '700' }}>
                            {p.rating || '5.0'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.fleetSubText} numberOfLines={1}>
                        {p.trade} · {p.location || 'NCR'}
                      </Text>
                    </View>

                    <Text style={{ fontSize: 11, color: '#2563eb', fontWeight: '700' }}>
                      Locate ›
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginVertical: 10,
  },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    flexWrap: 'wrap',
    gap: 10,
  },
  radarLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  radarSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  filterPillGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  radarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  radarPillActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  radarPillActiveGreen: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  radarPillActiveGray: {
    borderColor: '#64748b',
    backgroundColor: '#f1f5f9',
  },
  radarPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  radarPillTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  radarBody: {
    flexDirection: 'row',
    minHeight: 460,
    flexWrap: 'wrap',
  },
  mapWrap: {
    flex: 2.2,
    minWidth: 320,
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideConsole: {
    flex: 1,
    minWidth: 260,
    borderLeftWidth: 1,
    borderLeftColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 10,
  },
  consoleTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  selectedPartnerCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  partnerNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  partnerTradeText: {
    fontSize: 11.5,
    color: '#2563eb',
    fontWeight: '600',
  },
  partnerLocationText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  dutyTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dutyOnlinePill: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  dutyOfflinePill: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statNum: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  statLbl: {
    fontSize: 9.5,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  inspectBtn: {
    flex: 1,
    backgroundColor: '#7c3aed',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  inspectBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  closePinBtn: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  closePinBtnText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  fleetRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  fleetNameText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  fleetSubText: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
});

