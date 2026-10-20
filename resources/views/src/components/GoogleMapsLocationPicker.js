import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { GOOGLE_MAPS_API_KEY, isGoogleMapsLoaded, loadGoogleMapsScript } from '../config/maps';
import { AppIcon } from './AppIcons';

export default function GoogleMapsLocationPicker({ onSelectLocation, initialAddress = '', onClose }) {
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [selectedAddress, setSelectedAddress] = useState(initialAddress || 'Jaipur, Rajasthan, India');
  const [coords, setCoords] = useState({ lat: 26.9124, lng: 75.7873 }); // Default Jaipur
  const [permissionError, setPermissionError] = useState('');

  const mapRef = useRef(null);
  const googleMapObj = useRef(null);
  const markerObj = useRef(null);
  const leafletMapObj = useRef(null);
  const leafletMarkerObj = useRef(null);
  const mapTypeRef = useRef('google'); // 'google' | 'leaflet'

  useEffect(() => {
    let isMounted = true;
    
    // Give DOM a frame to ensure mapRef element is mounted
    const timer = setTimeout(() => {
      loadGoogleMapsScript()
        .then((maps) => {
          if (!isMounted) return;
          try {
            initMap(maps, coords.lat, coords.lng);
            setLoading(false);
          } catch (e) {
            console.warn('Google Maps init failed, switching to fallback:', e);
            initLeafletMap(coords.lat, coords.lng);
          }
        })
        .catch((err) => {
          console.warn('Failed to load Google Maps script, switching to OpenStreetMap fallback:', err);
          if (isMounted) {
            initLeafletMap(coords.lat, coords.lng);
          }
        });
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (leafletMapObj.current) {
        try { leafletMapObj.current.remove(); } catch (e) {}
      }
    };
  }, []);

  const initLeafletMap = (lat, lng) => {
    if (!mapRef.current || typeof window === 'undefined') return;

    const loadLeafletAssets = () => {
      return new Promise((resolve, reject) => {
        if (window.L) return resolve(window.L);
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }
        if (document.getElementById('leaflet-js')) {
          const script = document.getElementById('leaflet-js');
          script.addEventListener('load', () => resolve(window.L));
          script.addEventListener('error', (err) => reject(err));
          return;
        }
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve(window.L);
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
      });
    };

    loadLeafletAssets()
      .then((L) => {
        if (!mapRef.current) return;
        mapTypeRef.current = 'leaflet';
        if (leafletMapObj.current) {
          try { leafletMapObj.current.remove(); } catch (e) {}
        }

        const map = L.map(mapRef.current).setView([lat, lng], 15);
        leafletMapObj.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap',
        }).addTo(map);

        const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
        leafletMarkerObj.current = marker;

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setCoords({ lat: pos.lat, lng: pos.lng });
          reverseGeocodeOsm(pos.lat, pos.lng);
        });

        setLoading(false);

        if (initialAddress && initialAddress.trim()) {
          forwardGeocodeOsm(initialAddress);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const reverseGeocodeOsm = (lat, lng) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.display_name) {
          setSelectedAddress(data.display_name);
          setSearchQuery(data.display_name);
          if (onSelectLocation) {
            onSelectLocation({ address: data.display_name, lat, lng });
          }
        }
      })
      .catch(() => {});
  };

  const forwardGeocodeOsm = (addressText) => {
    if (!addressText || !addressText.trim()) return;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressText.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const formatted = data[0].display_name;
          setCoords({ lat, lng });
          setSelectedAddress(formatted);

          if (leafletMapObj.current && leafletMarkerObj.current) {
            leafletMapObj.current.setView([lat, lng], 15);
            leafletMarkerObj.current.setLatLng([lat, lng]);
          }
        }
      })
      .catch(() => {});
  };

  const forwardGeocode = (addressText) => {
    if (!addressText || !addressText.trim()) return;

    if (mapTypeRef.current === 'leaflet') {
      forwardGeocodeOsm(addressText);
      return;
    }

    if (!isGoogleMapsLoaded()) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: addressText.trim() }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const formattedAddr = results[0].formatted_address;

        setCoords({ lat, lng });
        setSelectedAddress(formattedAddr);

        if (googleMapObj.current && markerObj.current) {
          const newPos = { lat, lng };
          googleMapObj.current.setCenter(newPos);
          googleMapObj.current.setZoom(15);
          markerObj.current.setPosition(newPos);
        }
      } else {
        // Fallback to OSM search if Google geocoder fails
        forwardGeocodeOsm(addressText);
      }
    });
  };

  useEffect(() => {
    if (initialAddress && initialAddress.trim() && !loading) {
      setSearchQuery(initialAddress);
      setSelectedAddress(initialAddress);
      const timer = setTimeout(() => {
        forwardGeocode(initialAddress);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [initialAddress, loading]);

  const initMap = (maps, lat, lng) => {
    if (!mapRef.current || !maps) return;
    mapTypeRef.current = 'google';
    const center = { lat, lng };

    googleMapObj.current = new maps.Map(mapRef.current, {
      center,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    markerObj.current = new maps.Marker({
      position: center,
      map: googleMapObj.current,
      draggable: true,
      animation: maps.Animation.DROP,
      title: 'Service Location',
    });

    markerObj.current.addListener('dragend', (event) => {
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();
      setCoords({ lat: newLat, lng: newLng });
      reverseGeocode(newLat, newLng);
    });

    if (initialAddress && initialAddress.trim()) {
      forwardGeocode(initialAddress);
    }
  };

  const reverseGeocode = (lat, lng) => {
    if (mapTypeRef.current === 'leaflet') {
      reverseGeocodeOsm(lat, lng);
      return;
    }
    if (!isGoogleMapsLoaded()) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const addr = results[0].formatted_address;
        setSelectedAddress(addr);
        setSearchQuery(addr);
        if (onSelectLocation) {
          onSelectLocation({ address: addr, lat, lng });
        }
      } else {
        reverseGeocodeOsm(lat, lng);
      }
    });
  };

  const handleDetectCurrentLocation = () => {
    setPermissionError('');
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setPermissionError('Geolocation is not supported by your browser or device.');
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDetecting(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });

        if (mapTypeRef.current === 'google' && googleMapObj.current && markerObj.current) {
          const newPos = { lat, lng };
          googleMapObj.current.setCenter(newPos);
          googleMapObj.current.setZoom(16);
          markerObj.current.setPosition(newPos);
        } else if (mapTypeRef.current === 'leaflet' && leafletMapObj.current && leafletMarkerObj.current) {
          leafletMapObj.current.setView([lat, lng], 16);
          leafletMarkerObj.current.setLatLng([lat, lng]);
        }

        reverseGeocode(lat, lng);
      },
      (error) => {
        setDetecting(false);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionError('Location permission denied. Please allow location access or select manually.');
        } else {
          setPermissionError('Unable to detect current location. Please select manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirm = () => {
    if (onSelectLocation) {
      onSelectLocation({
        address: selectedAddress,
        lat: coords.lat,
        lng: coords.lng,
      });
    }
    if (onClose) onClose();
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <AppIcon name="search" size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              forwardGeocode(text);
            }}
            placeholder="Search address or landmark..."
            placeholderTextColor="#94a3b8"
          />
        </View>
        <TouchableOpacity style={styles.gpsBtn} onPress={handleDetectCurrentLocation} disabled={detecting}>
          {detecting ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : (
            <>
              <AppIcon name="map-pin" size={16} color="#2563eb" />
              <Text style={styles.gpsBtnText}>Detect GPS</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {!!permissionError && (
        <View style={styles.errorBox}>
          <AppIcon name="alert" size={14} color="#dc2626" />
          <Text style={styles.errorText}>{permissionError}</Text>
        </View>
      )}

      {/* Interactive Map Container — ALWAYS MOUNTED IN DOM */}
      <View style={styles.mapWrap}>
        <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '12px' }} />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading Map...</Text>
          </View>
        )}
      </View>

      {/* Bottom Selected Location Bar */}
      <View style={styles.footer}>
        <View style={styles.locationMetaRow}>
          <View style={styles.pinCircle}>
            <AppIcon name="map-pin" size={18} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationTitle}>Selected Service Location</Text>
            <Text style={styles.locationAddress} numberOfLines={2}>{selectedAddress}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.88}>
          <Text style={styles.confirmBtnText}>Confirm Service Location</Text>
        </TouchableOpacity>
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
    padding: 14,
    gap: 12,
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#0f172a',
    outlineStyle: 'none',
    borderStyle: 'none',
    backgroundColor: 'transparent',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    cursor: 'pointer',
    flexShrink: 0,
  },
  gpsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0052e0',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    whiteSpace: 'nowrap',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  mapWrap: {
    width: '100%',
    height: 230,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(248, 250, 252, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  footer: {
    gap: 10,
    marginTop: 2,
  },
  locationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  pinCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0052e0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  locationTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  locationAddress: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    lineHeight: 16,
  },
  confirmBtn: {
    backgroundColor: '#0052e0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 82, 224, 0.18)',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
});

