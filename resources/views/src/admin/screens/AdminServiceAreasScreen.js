import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Switch } from 'react-native';
import { useApp } from '../../context/AppContext';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

export default function AdminServiceAreasScreen() {
  const {
    serviceAreas,
    addServiceArea,
    updateServiceArea,
    toggleServiceAreaStatus,
    deleteServiceArea,
  } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingZone, setEditingZone] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [centerLocality, setCenterLocality] = useState('');
  const [radiusKm, setRadiusKm] = useState('20');
  const [pincodesText, setPincodesText] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  // Delete Confirm State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  const openAddModal = () => {
    setEditingZone(null);
    setName('');
    setRegion('');
    setCenterLocality('');
    setRadiusKm('20');
    setPincodesText('');
    setKeywordsText('');
    setStatus('ACTIVE');
    setModalVisible(true);
  };

  const openEditModal = (zone) => {
    setEditingZone(zone);
    setName(zone.name || '');
    setRegion(zone.region || '');
    setCenterLocality(zone.center_locality || '');
    setRadiusKm(String(zone.radius_km || '20'));
    setPincodesText((zone.pincodes || []).join(', '));
    setKeywordsText((zone.keywords || []).join(', '));
    setStatus(zone.status || 'ACTIVE');
    setModalVisible(true);
  };

  const handleSaveZone = () => {
    if (!name.trim() || !region.trim()) return;

    const pincodes = pincodesText.split(',').map((p) => p.trim()).filter((p) => p);
    const keywords = keywordsText.split(',').map((k) => k.trim().toLowerCase()).filter((k) => k);

    if (editingZone) {
      updateServiceArea(editingZone.id, {
        name: name.trim(),
        region: region.trim(),
        center_locality: centerLocality.trim(),
        radius_km: Number(radiusKm) || 15,
        pincodes,
        keywords,
        status,
      });
    } else {
      addServiceArea({
        name: name.trim(),
        region: region.trim(),
        center_locality: centerLocality.trim(),
        radius_km: Number(radiusKm) || 15,
        pincodesText,
        keywordsText,
        status,
      });
    }
    setModalVisible(false);
  };

  const promptDelete = (zone) => {
    setDeleteTargetId(zone.id);
    setDeleteTargetName(zone.name);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteServiceArea(deleteTargetId);
    }
    setDeleteModalVisible(false);
    setDeleteTargetId(null);
  };

  const activeCount = (serviceAreas || []).filter((z) => z.status === 'ACTIVE').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Map-Based Service Area Restrictions</Text>
          <Text style={styles.subtitle}>Define, activate/deactivate, and restrict Zevota Care geographic service coverage zones.</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.85}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <Text style={styles.addBtnText}>Add Service Area</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats Callout Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{(serviceAreas || []).length}</Text>
          <Text style={styles.statLabel}>Configured Zones</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: '#059669' }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active Service Areas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: '#2563eb' }]}>Location Check ✅</Text>
          <Text style={styles.statLabel}>Real-time Geofence Filter</Text>
        </View>
      </View>

      {/* Interactive Geographic Map Visualizer Banner */}
      <View style={styles.mapVisualizerCard}>
        <View style={styles.mapVisualizerHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <Text style={styles.mapVisualizerTitle}>Active Geographic Coverage Map (GPS & Radius Bounds)</Text>
          </View>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTagText}>GEO-RESTRICTION LIVE</Text>
          </View>
        </View>

        <View style={styles.mapCanvasBox}>
          {/* Simulated Interactive Radar Coverage Map Grid */}
          <View style={styles.mapGridLines} />
          {(serviceAreas || []).map((zone, idx) => {
            const isActive = zone.status === 'ACTIVE';
            return (
              <View
                key={zone.id}
                style={[
                  styles.mapZoneCircle,
                  {
                    borderColor: isActive ? '#2563eb' : '#94a3b8',
                    backgroundColor: isActive ? 'rgba(37, 99, 235, 0.08)' : 'rgba(148, 163, 184, 0.08)',
                    top: `${20 + (idx * 24) % 55}%`,
                    left: `${15 + (idx * 30) % 65}%`,
                    width: Math.min(180, Math.max(100, zone.radius_km * 5)),
                    height: Math.min(180, Math.max(100, zone.radius_km * 5)),
                  },
                ]}
              >
                <View style={[styles.mapCenterPin, { backgroundColor: isActive ? '#2563eb' : '#94a3b8' }]} />
                <Text style={[styles.mapZoneLabel, { color: isActive ? '#1e40af' : '#475569' }]} numberOfLines={1}>
                  📍 {zone.region || zone.name} ({zone.radius_km}km)
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Service Area Cards Grid */}
      <View style={styles.cardsGrid}>
        {(serviceAreas || []).map((zone) => {
          const isActive = zone.status === 'ACTIVE';
          return (
            <View key={zone.id} style={[styles.zoneCard, !isActive && styles.inactiveZoneCard]}>
              <View style={styles.zoneCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.zoneName}>{zone.name}</Text>
                  <Text style={styles.zoneRegion}>📍 {zone.region} · Center: {zone.center_locality}</Text>
                </View>

                {/* Active/Inactive Switch */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.switchLabel, isActive ? { color: '#059669' } : { color: '#64748b' }]}>
                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                  </Text>
                  <Switch
                    value={isActive}
                    onValueChange={() => toggleServiceAreaStatus(zone.id)}
                    trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                    thumbColor={isActive ? '#059669' : '#94a3b8'}
                  />
                </View>
              </View>

              {/* Coverage Details */}
              <View style={styles.coverageBox}>
                <View style={styles.coverageRow}>
                  <Text style={styles.covLabel}>Coverage Radius:</Text>
                  <Text style={styles.covVal}>{zone.radius_km} km Geofence</Text>
                </View>
                <View style={styles.coverageRow}>
                  <Text style={styles.covLabel}>Supported Pincodes:</Text>
                  <Text style={styles.covVal}>{(zone.pincodes || []).slice(0, 5).join(', ')}{(zone.pincodes || []).length > 5 ? ' ...' : ''}</Text>
                </View>
                <View style={styles.coverageRow}>
                  <Text style={styles.covLabel}>Localities / Keywords:</Text>
                  <Text style={styles.covVal}>{(zone.keywords || []).slice(0, 5).join(', ')}{(zone.keywords || []).length > 5 ? ' ...' : ''}</Text>
                </View>
              </View>

              {/* Actions Footer */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(zone)} activeOpacity={0.8}>
                  <Text style={styles.editBtnText}>Edit Zone</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => promptDelete(zone)} activeOpacity={0.8}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* ADD / EDIT SERVICE AREA MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingZone ? 'Edit Service Area' : 'Configure New Service Area'}</Text>
            <Text style={styles.modalSub}>Define geographic bounds, localities, and pincodes for Zevota Care dispatch.</Text>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 12 }}>
                <View>
                  <Text style={styles.inputLabel}>Service Area Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Mumbai Metro Coverage Zone"
                  />
                </View>

                <View>
                  <Text style={styles.inputLabel}>Region / City *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={region}
                    onChangeText={setRegion}
                    placeholder="e.g. Mumbai, Maharashtra"
                  />
                </View>

                <View>
                  <Text style={styles.inputLabel}>Center Locality / Landmark</Text>
                  <TextInput
                    style={styles.textInput}
                    value={centerLocality}
                    onChangeText={setCenterLocality}
                    placeholder="e.g. Bandra West & BKC"
                  />
                </View>

                <View>
                  <Text style={styles.inputLabel}>Coverage Radius (km) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={radiusKm}
                    onChangeText={setRadiusKm}
                    keyboardType="number-pad"
                    placeholder="e.g. 20"
                  />
                </View>

                <View>
                  <Text style={styles.inputLabel}>Supported Pincodes (Comma separated)</Text>
                  <TextInput
                    style={[styles.textInput, { height: 60 }]}
                    multiline
                    value={pincodesText}
                    onChangeText={setPincodesText}
                    placeholder="e.g. 400050, 400051, 400049, 400034"
                  />
                </View>

                <View>
                  <Text style={styles.inputLabel}>Localities & Keywords (Comma separated)</Text>
                  <TextInput
                    style={[styles.textInput, { height: 60 }]}
                    multiline
                    value={keywordsText}
                    onChangeText={setKeywordsText}
                    placeholder="e.g. bandra, bkc, juhu, andheri, powai, worli"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveZone}>
                <Text style={styles.saveModalBtnText}>Save Service Area</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        visible={deleteModalVisible}
        title="Delete Service Area"
        message={`Are you sure you want to remove the "${deleteTargetName}" coverage zone? Customers in this region will no longer be able to book services.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, gap: 16 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  addBtn: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#ffffff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  statVal: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },

  mapVisualizerCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#cbd5e1', gap: 12 },
  mapVisualizerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mapVisualizerTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  liveTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2563eb' },
  liveTagText: { fontSize: 10, fontWeight: '700', color: '#2563eb' },

  mapCanvasBox: {
    height: 180,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapGridLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
  },
  mapZoneCircle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  mapCenterPin: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  mapZoneLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center', textShadow: '0 1px 2px rgba(255,255,255,0.8)' },

  cardsGrid: { gap: 14 },
  zoneCard: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', gap: 12 },
  inactiveZoneCard: { opacity: 0.7, backgroundColor: '#f8fafc' },
  zoneCardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  zoneName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  zoneRegion: { fontSize: 12, color: '#64748b', marginTop: 2 },
  switchLabel: { fontSize: 10, fontWeight: '800' },

  coverageBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, gap: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  coverageRow: { flexDirection: 'row', justifyContent: 'space-between' },
  covLabel: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  covVal: { fontSize: 11, fontWeight: '700', color: '#0f172a' },

  cardActionsRow: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  editBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  editBtnText: { fontSize: 12, fontWeight: '600', color: '#2563eb' },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  deleteBtnText: { fontSize: 12, fontWeight: '600', color: '#dc2626' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '100%', maxWidth: 480, backgroundColor: '#ffffff', borderRadius: 16, padding: 20, gap: 14 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalSub: { fontSize: 12, color: '#64748b' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#334155', marginBottom: 4 },
  textInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#0f172a' },

  modalActionsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelModalBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelModalBtnText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  saveModalBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#2563eb', alignItems: 'center' },
  saveModalBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
});
