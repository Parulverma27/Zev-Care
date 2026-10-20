import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Modal } from 'react-native';
import { getApplianceVideoUri, resolveApplianceImage } from '../../utils/applianceMediaHelper';

export default function BookingApplianceCard({ appliance, selected, onPress }) {
  const [showVideoModal, setShowVideoModal] = useState(false);
  if (!appliance) return null;

  const videoUri = getApplianceVideoUri(appliance);
  const imgUrl = resolveApplianceImage(appliance);
  const meta = [appliance.brand, appliance.capacity || appliance.type, appliance.location]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <TouchableOpacity
        style={[styles.card, selected && styles.cardSelected]}
        onPress={onPress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityState={{ selected: !!selected }}
      >
        {/* Media Thumbnail: Playable video or clean service image */}
        {videoUri && Platform.OS === 'web' ? (
          <TouchableOpacity
            style={styles.mediaContainer}
            onPress={(e) => {
              e.stopPropagation?.();
              setShowVideoModal(true);
            }}
            activeOpacity={0.8}
            accessibilityLabel="Watch video walkthrough"
          >
            <video
              src={videoUri}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 10,
                display: 'block',
                pointerEvents: 'none',
              }}
              muted
              loop
              autoPlay
              playsInline
            />
            <View style={styles.videoRibbonBadge}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="#ffffff">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <Text style={styles.videoRibbonText}>VIDEO</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <Image source={{ uri: imgUrl }} style={styles.img} resizeMode="contain" />
        )}

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

          <View style={styles.badgesRow}>
            {appliance.isCoveredByAmc ? (
              <View style={styles.coveredBadge}>
                <Text style={styles.coveredBadgeText}>✓ Covered by AMC • ₹0 Labor</Text>
              </View>
            ) : (
              <View style={styles.outOfPlanBadge}>
                <Text style={styles.outOfPlanBadgeText}>Out-of-Plan • ₹500 Fee</Text>
              </View>
            )}

            {videoUri && (
              <TouchableOpacity
                style={styles.watchVideoBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  setShowVideoModal(true);
                }}
                activeOpacity={0.7}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#2563eb">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <Text style={styles.watchVideoBtnText}>Watch Video</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={[styles.chevron, selected && styles.chevronOn]}>{selected ? '✓' : '›'}</Text>
      </TouchableOpacity>

      {/* Video Walkthrough Player Modal */}
      {showVideoModal && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {appliance.name || appliance.displayName || 'Appliance'} Walkthrough
                  </Text>
                  <Text style={styles.modalSub}>
                    Original verified recording registered for this appliance
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowVideoModal(false)}
                  accessibilityLabel="Close video player"
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalVideoBox}>
                <video
                  src={videoUri}
                  controls
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    maxHeight: 380,
                    backgroundColor: '#000',
                    borderRadius: 12,
                    display: 'block',
                  }}
                />
              </View>

              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowVideoModal(false)}
                activeOpacity={0.88}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
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
  img: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#f8fafc', padding: 4 },
  mediaContainer: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexShrink: 0,
  },
  videoRibbonBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  videoRibbonText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  body: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  meta: { fontSize: 12, color: '#64748b', lineHeight: 16 },
  condition: { fontSize: 11, color: '#2563eb', fontWeight: '600', marginTop: 2 },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 3,
  },
  watchVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  watchVideoBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563eb',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  chevron: { fontSize: 20, color: '#94a3b8', fontWeight: '600' },
  chevronOn: { color: '#2563eb' },
  coveredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  coveredBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#047857',
  },
  outOfPlanBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  outOfPlanBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#c2410c',
  },
  /* Video Player Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 99999,
  },
  modalContent: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  modalVideoBox: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  modalDoneBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
});
