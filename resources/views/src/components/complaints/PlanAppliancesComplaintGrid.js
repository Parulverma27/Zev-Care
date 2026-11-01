import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Platform } from 'react-native';
import { SERVICE_IMAGES } from '../../utils/bundledImages';

/**
 * Returns matching image URL from bundled catalog images
 */
const getApplianceImage = (app) => {
  if (app?.image && typeof app.image === 'string' && app.image.startsWith('http')) {
    return app.image;
  }
  const name = String(app?.name || app?.displayName || '').toLowerCase();
  if (name.includes('ac') || name.includes('air conditioner') || name.includes('split') || name.includes('window')) {
    return SERVICE_IMAGES.ac;
  }
  if (name.includes('refrigerator') || name.includes('fridge')) {
    return SERVICE_IMAGES.refrigerator;
  }
  if (name.includes('washing') || name.includes('dryer')) {
    return SERVICE_IMAGES.washingMachine;
  }
  if (name.includes('ro') || name.includes('purifier') || name.includes('water')) {
    return SERVICE_IMAGES.waterPurifier || SERVICE_IMAGES.ro;
  }
  if (name.includes('tv') || name.includes('television')) {
    return SERVICE_IMAGES.tv;
  }
  if (name.includes('microwave') || name.includes('oven')) {
    return SERVICE_IMAGES.microwave;
  }
  if (name.includes('geyser') || name.includes('water heater')) {
    return SERVICE_IMAGES.geyser;
  }
  if (name.includes('cooler')) {
    return SERVICE_IMAGES.cooler;
  }
  if (name.includes('fan')) {
    return SERVICE_IMAGES.fan;
  }
  return SERVICE_IMAGES.elecAppliance || SERVICE_IMAGES.other;
};

/**
 * Returns user uploaded video URI if one exists, otherwise null
 * (Strictly never returns placeholder / stock demo videos)
 */
const getUserUploadedVideo = (app) => {
  if (!app) return null;
  const raw =
    app.videoUri ||
    app.video_url ||
    app.uploadedMediaUri ||
    app.video ||
    app.videoUrl ||
    app.video_uri ||
    (app.media?.type === 'video' ? (app.media?.url || app.media?.uri) : null);

  if (typeof raw === 'string') {
    const clean = raw.trim();
    if (
      clean.length > 0 &&
      !clean.startsWith('auto-verified') &&
      !clean.includes('mixkit') &&
      (clean.startsWith('blob:') || clean.startsWith('data:video') || clean.startsWith('http') || clean.includes('.mp4') || clean.includes('.webm'))
    ) {
      return clean;
    }
  }
  return null;
};

export default function PlanAppliancesComplaintGrid({
  appliances = [],
  onSelectAppliance,
}) {
  const [activeVideoAppliance, setActiveVideoAppliance] = useState(null);

  if (!appliances || appliances.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section Header: Fixed Layout (Row 1: Title + Count Badge, Row 2: Subtitle) */}
      <View style={styles.sectionHeaderContainer}>
        <View style={styles.sectionHeaderTopRow}>
          <View style={styles.titleWithAccent}>
            <View style={styles.titleAccentBar} />
            <Text style={styles.sectionTitle}>Your Plan Appliances</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{appliances.length} APPLIANCES</Text>
          </View>
        </View>
        <Text style={styles.sectionSub}>Select an appliance in your AMC to report an issue</Text>
      </View>

      {/* 3-in-a-Row Responsive Grid */}
      <div style={gridStyle}>
        {appliances.map((app, index) => {
          const imgSrc = getApplianceImage(app);
          const appName = app.name || app.displayName || 'Appliance';
          const location = app.location || app.room || 'Home';
          const brand = app.brand && app.brand !== 'Standard' ? app.brand : null;
          const userUploadedVideo = getUserUploadedVideo(app);

          return (
            <div
              key={app.id || `app-${index}`}
              style={cardStyle}
              onClick={() => onSelectAppliance && onSelectAppliance(app)}
              title={`Report issue for ${appName}`}
            >
              {/* Media Preview Box */}
              <div style={mediaBoxStyle}>
                <Image
                  source={{ uri: imgSrc }}
                  style={styles.applianceThumb}
                  resizeMode="contain"
                />

                {/* Video Chip Button: STRICTLY SHOWN ONLY IF USER UPLOADED VIDEO */}
                {userUploadedVideo && (
                  <button
                    type="button"
                    style={videoChipStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveVideoAppliance({
                        ...app,
                        videoSrc: userUploadedVideo,
                        name: appName,
                        location,
                      });
                    }}
                    title="Watch recorded video"
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="#ffffff">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>Video</span>
                  </button>
                )}
              </div>

              {/* Info Details */}
              <div style={infoBoxStyle}>
                {/* Clean 2-line fixed height title to ensure row alignment */}
                <div style={nameStyle} title={appName}>
                  {appName}
                </div>

                {/* Location & Brand: Single compact line with ellipsis */}
                <div style={metaRowStyle}>
                  <span style={locationTagStyle}>{location}</span>
                  {brand && <span style={brandTagStyle}>{brand}</span>}
                </div>

                {/* Status Indicator: Compact single line */}
                <div style={protectionPillStyle}>
                  <span style={greenDotStyle} />
                  <span>₹0 Labor</span>
                </div>
              </div>

              {/* Action Button: Pinned to bottom of card */}
              <div style={reportActionBtnStyle}>
                <span>Raise ›</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Video Inspection Modal (Only launches for real uploaded videos) */}
      {activeVideoAppliance && (
        <Modal
          visible={Boolean(activeVideoAppliance)}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setActiveVideoAppliance(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{activeVideoAppliance.name}</Text>
                  <Text style={styles.modalSub}>
                    Attached Verification Video • {activeVideoAppliance.location}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setActiveVideoAppliance(null)}
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* HTML5 Video Player */}
              <div style={videoPlayerContainerStyle}>
                <video
                  src={activeVideoAppliance.videoSrc}
                  controls
                  autoPlay
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000000' }}
                />
              </div>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => {
                    const chosen = activeVideoAppliance;
                    setActiveVideoAppliance(null);
                    if (onSelectAppliance) onSelectAppliance(chosen);
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={styles.modalActionBtnText}>Report Issue for this Appliance →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

/* --- Inline Web Styles for Pixel-Perfect 3-Column Grid --- */
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '8px',
  width: '100%',
  boxSizing: 'border-box',
};

const cardStyle = {
  background: '#ffffff',
  borderRadius: '14px',
  border: '1.5px solid #e2e8f0',
  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
  position: 'relative',
  boxSizing: 'border-box',
  minHeight: '190px',
};

const mediaBoxStyle = {
  position: 'relative',
  width: '100%',
  height: '68px',
  background: '#f8fafc',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottom: '1px solid #f1f5f9',
  overflow: 'hidden',
};

const videoChipStyle = {
  position: 'absolute',
  top: '5px',
  right: '5px',
  background: 'rgba(15, 23, 42, 0.78)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '999px',
  padding: '2px 6px',
  fontSize: '9px',
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
  cursor: 'pointer',
  zIndex: 2,
};

const infoBoxStyle = {
  padding: '7px 7px 4px 7px',
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
  flex: 1,
};

const nameStyle = {
  fontSize: '11.5px',
  fontWeight: '700',
  color: '#0f172a',
  lineHeight: '14px',
  height: '28px',
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  textOverflow: 'ellipsis',
};

const metaRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
};

const locationTagStyle = {
  fontSize: '9px',
  color: '#64748b',
  fontWeight: '600',
  background: '#f1f5f9',
  padding: '1px 4px',
  borderRadius: '4px',
  maxWidth: '65px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'inline-block',
};

const brandTagStyle = {
  fontSize: '9px',
  color: '#2563eb',
  fontWeight: '700',
  background: '#eff6ff',
  padding: '1px 4px',
  borderRadius: '4px',
  maxWidth: '45px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  display: 'inline-block',
};

const protectionPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3.5px',
  marginTop: '2px',
  fontSize: '9.5px',
  fontWeight: '600',
  color: '#059669',
  whiteSpace: 'nowrap',
};

const greenDotStyle = {
  width: '5px',
  height: '5px',
  borderRadius: '50%',
  backgroundColor: '#10b981',
  display: 'inline-block',
  flexShrink: 0,
};

const reportActionBtnStyle = {
  margin: '4px 7px 7px 7px',
  padding: '5px 0',
  borderRadius: '7px',
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  color: '#1d4ed8',
  fontSize: '11px',
  fontWeight: '700',
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const videoPlayerContainerStyle = {
  width: '100%',
  height: '240px',
  background: '#000000',
  borderRadius: '12px',
  overflow: 'hidden',
  margin: '12px 0',
};

/* --- React Native Stylesheet --- */
const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  sectionHeaderContainer: {
    width: '100%',
    marginBottom: 10,
  },
  sectionHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  titleWithAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  titleAccentBar: {
    width: 3.5,
    height: 18,
    backgroundColor: '#0052cc',
    borderRadius: 2,
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 15,
  },
  countBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    flexShrink: 0,
  },
  countBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: 0.3,
  },
  applianceThumb: {
    width: 44,
    height: 44,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 20px 48px rgba(0, 0, 0, 0.28)' }
      : { elevation: 8 }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
  modalFooter: {
    marginTop: 8,
  },
  modalActionBtn: {
    backgroundColor: '#0052cc',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
