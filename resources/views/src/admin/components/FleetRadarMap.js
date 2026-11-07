import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { loadGoogleMapsScript } from '../../config/maps';

// Dynamic Leaflet asset loader for seamless 100% reliable fallback
const loadLeafletAssets = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window is undefined'));
    if (window.L) return resolve(window.L);

    const timer = setTimeout(() => {
      reject(new Error('Leaflet assets load timeout'));
    }, 2500);

    const safeResolve = (L) => {
      clearTimeout(timer);
      resolve(L);
    };

    const safeReject = (err) => {
      clearTimeout(timer);
      reject(err);
    };

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (document.getElementById('leaflet-js')) {
      const script = document.getElementById('leaflet-js');
      if (window.L) {
        safeResolve(window.L);
        return;
      }
      script.addEventListener('load', () => safeResolve(window.L));
      script.addEventListener('error', (err) => safeReject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => safeResolve(window.L);
    script.onerror = (err) => safeReject(err);
    document.head.appendChild(script);
  });
};

export default function FleetRadarMap({
  providers = [],
  onSelectProvider,
  onToggleDuty,
}) {
  const [selectedPin, setSelectedPin] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapEngine, setMapEngine] = useState('init'); // 'google' | 'leaflet' | 'radar'
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'ONLINE' | 'OFFLINE'
  
  const mapContainerRef = useRef(null);
  const googleMapInstance = useRef(null);
  const leafletMapInstance = useRef(null);
  const markersRef = useRef([]);

  const onlineCount = providers.filter((p) => p.is_online !== false).length;
  const offlineCount = providers.length - onlineCount;

  const filteredProviders = providers.filter((p) => {
    if (filterMode === 'ONLINE') return p.is_online !== false;
    if (filterMode === 'OFFLINE') return p.is_online === false;
    return true;
  });

  // Center coordinate around Gurugram / NCR hub
  const defaultCenter = { lat: 28.4595, lng: 77.0266 };

  // Initialize Map Engine (Google Maps -> Leaflet Fallback -> Radar Fallback)
  useEffect(() => {
    let isMounted = true;

    if (Platform.OS !== 'web') {
      setMapEngine('radar');
      setMapLoading(false);
      return;
    }

    // Safety fallback timer to guarantee UI never gets stuck on an empty box
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setMapEngine((cur) => {
          if (cur === 'init') {
            setMapLoading(false);
            return 'radar';
          }
          return cur;
        });
      }
    }, 2000);

    // Fallback: Leaflet + OpenStreetMap
    const initLeaflet = () => {
      loadLeafletAssets()
        .then((L) => {
          if (!isMounted || !mapContainerRef.current) return;

          try {
            if (!leafletMapInstance.current) {
              const map = L.map(mapContainerRef.current, {
                center: [defaultCenter.lat, defaultCenter.lng],
                zoom: 12,
                zoomControl: true,
              });

              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors',
              }).addTo(map);

              leafletMapInstance.current = map;

              setTimeout(() => { if (map && typeof map.invalidateSize === 'function') map.invalidateSize(); }, 150);
              setTimeout(() => { if (map && typeof map.invalidateSize === 'function') map.invalidateSize(); }, 400);
            }

            setMapEngine('leaflet');
            renderLeafletMarkers(L);
            setMapLoading(false);
          } catch (e) {
            console.warn('Leaflet initialization error, using visual radar fallback:', e);
            setMapEngine('radar');
            setMapLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setMapEngine('radar');
            setMapLoading(false);
          }
        });
    };

    // Attempt Google Maps First
    loadGoogleMapsScript()
      .then((mapsObj) => {
        if (!isMounted) return;
        const maps = (typeof window !== 'undefined' && window.google?.maps) ? window.google.maps : mapsObj;

        if (!mapContainerRef.current || !maps || !maps.Map) {
          throw new Error('Google Maps API not available');
        }

        try {
          if (!googleMapInstance.current) {
            googleMapInstance.current = new maps.Map(mapContainerRef.current, {
              center: defaultCenter,
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

          setMapEngine('google');
          renderGoogleMarkers(maps);
          setMapLoading(false);
        } catch (e) {
          console.warn('Google Maps map creation error, falling back to Leaflet:', e);
          initLeaflet();
        }
      })
      .catch((err) => {
        console.warn('Google Maps script loading failed, falling back to Leaflet:', err);
        if (isMounted) {
          initLeaflet();
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      clearMarkers();
      if (leafletMapInstance.current) {
        try {
          leafletMapInstance.current.remove();
          leafletMapInstance.current = null;
        } catch (e) {}
      }
    };
  }, []);

  // Update markers when filtered providers change
  useEffect(() => {
    if (mapEngine === 'google') {
      const maps = typeof window !== 'undefined' ? window.google?.maps : null;
      if (maps) renderGoogleMarkers(maps);
    } else if (mapEngine === 'leaflet') {
      const L = typeof window !== 'undefined' ? window.L : null;
      if (L) renderLeafletMarkers(L);
    }
  }, [filteredProviders, mapEngine]);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => {
      if (typeof m.setMap === 'function') {
        m.setMap(null); // Google Maps
      } else if (typeof m.remove === 'function') {
        m.remove(); // Leaflet
      }
    });
    markersRef.current = [];
  };

  const renderGoogleMarkers = (maps) => {
    if (!googleMapInstance.current || !maps) return;
    clearMarkers();

    const bounds = new maps.LatLngBounds();
    let validCount = 0;

    filteredProviders.forEach((p) => {
      const lat = Number(p.coords?.lat);
      const lng = Number(p.coords?.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        validCount++;
        const isOnline = p.is_online !== false;
        const pos = { lat, lng };
        bounds.extend(pos);

        const marker = new maps.Marker({
          position: pos,
          map: googleMapInstance.current,
          title: `${p.name} (${isOnline ? 'ONLINE' : 'OFFLINE'})`,
          icon: {
            path: maps.SymbolPath.CIRCLE,
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

    if (validCount > 0) {
      googleMapInstance.current.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
    }
  };

  const renderLeafletMarkers = (L) => {
    if (!leafletMapInstance.current || !L) return;
    clearMarkers();

    const group = [];

    filteredProviders.forEach((p) => {
      const lat = Number(p.coords?.lat);
      const lng = Number(p.coords?.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const isOnline = p.is_online !== false;

        const pinHtml = `
          <div style="
            background: ${isOnline ? '#10b981' : '#64748b'};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: 12px;
            cursor: pointer;
            position: relative;
          ">
            ${p.name ? p.name[0] : 'P'}
            ${isOnline ? '<div style="position: absolute; top: -3px; right: -3px; width: 10px; height: 10px; background: #22c55e; border: 2px solid #ffffff; border-radius: 50%;"></div>' : ''}
          </div>
        `;

        const icon = L.divIcon({
          className: 'fleet-partner-leaflet-pin',
          html: pinHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(leafletMapInstance.current);

        marker.on('click', () => {
          setSelectedPin(p);
          if (onSelectProvider) onSelectProvider(p);
        });

        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 2px;">
            <div style="font-weight: 800; color: #0f172a; font-size: 13px;">${p.name}</div>
            <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${p.trade || 'Technician'}</div>
            <div style="margin-top: 6px; display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; background: ${isOnline ? '#ecfdf5' : '#f1f5f9'}; color: ${isOnline ? '#047857' : '#64748b'};">
              ${isOnline ? '● ONLINE' : '○ OFFLINE'}
            </div>
          </div>
        `);

        markersRef.current.push(marker);
        group.push([lat, lng]);
      }
    });

    if (group.length > 0) {
      leafletMapInstance.current.fitBounds(group, { padding: [50, 50] });
    }
  };

  const handleLocateProvider = (p) => {
    setSelectedPin(p);
    const lat = Number(p.coords?.lat);
    const lng = Number(p.coords?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (mapEngine === 'google' && googleMapInstance.current) {
      googleMapInstance.current.panTo({ lat, lng });
      googleMapInstance.current.setZoom(15);
    } else if (mapEngine === 'leaflet' && leafletMapInstance.current) {
      leafletMapInstance.current.setView([lat, lng], 15, { animate: true });
    }
  };

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
          {mapEngine === 'leaflet' && (
            <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#bfdbfe' }}>
              <Text style={{ fontSize: 9.5, color: '#1d4ed8', fontWeight: '700' }}>OpenStreetMap Active</Text>
            </View>
          )}
          {mapEngine === 'google' && (
            <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#a7f3d0' }}>
              <Text style={{ fontSize: 9.5, color: '#047857', fontWeight: '700' }}>Google Maps Active</Text>
            </View>
          )}
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
                Connecting to Live Fleet Coordinates...
              </Text>
            </View>
          )}

          {/* Interactive Map DOM Element */}
          {Platform.OS === 'web' && mapEngine !== 'radar' && (
            <div
              ref={mapContainerRef}
              style={{ width: '100%', height: '100%', minHeight: 460, borderRadius: 12 }}
            />
          )}

          {/* Visual Satellite Radar Grid Fallback if Tiles Offline */}
          {mapEngine === 'radar' && (
            <View style={styles.radarFallbackWrap}>
              <View style={styles.radarGridLines} />
              {/* Concentric Radar Rings */}
              <View style={[styles.radarRing, { width: 140, height: 140 }]} />
              <View style={[styles.radarRing, { width: 280, height: 280 }]} />
              <View style={[styles.radarRing, { width: 420, height: 420 }]} />

              {/* Technician Markers plotted on Radar Grid */}
              {filteredProviders.map((p, idx) => {
                const isOnline = p.is_online !== false;
                const topPct = 30 + ((idx * 27) % 45);
                const leftPct = 25 + ((idx * 33) % 50);

                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.radarBlip,
                      { top: `${topPct}%`, left: `${leftPct}%` },
                      selectedPin?.id === p.id && styles.radarBlipSelected,
                    ]}
                    onPress={() => setSelectedPin(p)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.radarBlipInner,
                        { backgroundColor: isOnline ? '#10b981' : '#94a3b8' },
                      ]}
                    />
                    <View style={styles.radarBlipTag}>
                      <Text style={styles.radarBlipTagText}>{p.name}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.radarStatusOverlay}>
                <Text style={{ color: '#0f172a', fontSize: 11, fontWeight: '700' }}>
                  Satellite Fleet Telemetry Radar • Gurugram Hub
                </Text>
              </View>
            </View>
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
                    onPress={() => handleLocateProvider(p)}
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
    backgroundColor: '#f8fafc',
    minHeight: 460,
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
  radarFallbackWrap: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 460,
  },
  radarGridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  },
  radarRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  radarBlip: {
    position: 'absolute',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex: 5,
  },
  radarBlipInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#ffffff',
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
  },
  radarBlipSelected: {
    transform: [{ scale: 1.2 }],
    zIndex: 10,
  },
  radarBlipTag: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
  },
  radarBlipTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
  },
  radarStatusOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  selectedPartnerCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 10,
  },
  partnerNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  partnerTradeText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  partnerLocationText: {
    fontSize: 11,
    color: '#64748b',
  },
  dutyTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  dutyOnlinePill: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  dutyOfflinePill: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    marginVertical: 4,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNum: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLbl: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  inspectBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  inspectBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  closePinBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  closePinBtnText: {
    color: '#64748b',
    fontSize: 11.5,
    fontWeight: '600',
  },
  fleetRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fleetNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  fleetSubText: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },
});
