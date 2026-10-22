import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, useWindowDimensions, Image } from 'react-native';
import { getApplianceVideoUri, resolveApplianceImage } from '../../utils/applianceMediaHelper';

const EXTRA_APPLIANCE_FEE = 500;

/**
 * PlanReviewScreen
 * Shown after the user adds appliances for a plan (before purchase).
 * Lets the user review, remove, add more appliances, and proceed to purchase.
 *
 * Props:
 *  - plan: { id, name, price, validity_months }
 *  - appliances: Array of appliance records selected for this plan
 *  - onAddMore(): open the appliance wizard again
 *  - onRemove(index): remove an appliance from the selection
 *  - onPurchase(): proceed to purchase confirmation
 *  - onBack(): go back to the plans list
 */
export default function PlanReviewScreen({
  plan,
  appliances = [],
  onAddMore,
  onRemove,
  onPurchase,
  onBack,
}) {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;
  const count = appliances.length;
  const price = Number(plan?.price || 0);
  const canPurchase = count > 0;
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);

  const getValidVideoUri = (app) => {
    return getApplianceVideoUri(app);
  };

  const openConfirm = () => {
    setConfirmChecked(false);
    setShowConfirm(true);
  };

  const handleConfirmPay = () => {
    if (!confirmChecked) return;
    setShowConfirm(false);
    onPurchase?.();
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, isDesktopWeb && styles.contentDesktop]} showsVerticalScrollIndicator={false}>
        <div style={isDesktopWeb ? desktopTwoColReview : undefined}>
          <div style={isDesktopWeb ? desktopLeftCol : undefined}>
            <TouchableOpacity onPress={onBack} style={styles.backLink} activeOpacity={0.7}>
              <Text style={styles.backLinkText}>← Back to Plans</Text>
            </TouchableOpacity>

            {/* Step indicator */}
            <View style={styles.stepRow}>
              <View style={[styles.stepDot, styles.stepDotDone]}><Text style={styles.stepDotText}>✓</Text></View>
              <View style={[styles.stepLine, styles.stepLineDone]} />
              <View style={[styles.stepDot, styles.stepDotActive]}><Text style={styles.stepDotText}>2</Text></View>
              <View style={styles.stepLine} />
              <View style={styles.stepDot}><Text style={[styles.stepDotText, { color: '#64748b' }]}>3</Text></View>
            </View>
            <View style={styles.stepLabelRow}>
              <Text style={styles.stepLabel}>Add Appliances</Text>
              <Text style={[styles.stepLabel, { color: '#2563eb' }]}>Review</Text>
              <Text style={styles.stepLabel}>Purchase</Text>
            </View>

            <View style={styles.headerCard}>
              <Text style={styles.headerEyebrow}>{(plan?.name || 'AMC').toUpperCase()} PLAN</Text>
              <Text style={styles.headerTitle}>Your Appliances</Text>
              <Text style={styles.headerSub}>
                {count === 0
                  ? 'No appliances added yet. Add every appliance you want covered before purchasing.'
                  : `${count} appliance${count === 1 ? '' : 's'} will be covered under your ${plan?.name}. Add everything you want protected now.`}
              </Text>
            </View>

            {count === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No appliances added</Text>
                <Text style={styles.emptySub}>Tap “Add Appliance” to register your first appliance.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {appliances.map((app, idx) => {
                  const name = app.displayName || app.name || 'Appliance';
                  const meta = [app.category && app.category !== name ? app.category : null, app.brand, app.location]
                    .filter(Boolean)
                    .join(' • ');
                  const validVideoUri = getValidVideoUri(app);
                  const catalogImg = resolveApplianceImage(app);

                  return (
                    <View key={app.id || `rev-${idx}`} style={styles.itemCard}>
                      {validVideoUri ? (
                        <TouchableOpacity
                          style={[styles.itemThumb, isDesktopWeb && styles.itemThumbDesktop, styles.itemThumbVideoWrap]}
                          onPress={() => setPreviewVideo({ uri: validVideoUri, title: name })}
                          activeOpacity={0.85}
                          accessibilityLabel={`Play walkthrough video for ${name}`}
                        >
                          <video
                            src={validVideoUri}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                              pointerEvents: 'none',
                              borderRadius: 'inherit',
                            }}
                            muted
                            loop
                            autoPlay
                            playsInline
                          />
                          <View style={styles.playOverlayBadge}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffffff">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </View>
                        </TouchableOpacity>
                      ) : catalogImg ? (
                        <Image
                          source={{ uri: catalogImg }}
                          style={[styles.itemThumb, isDesktopWeb && styles.itemThumbDesktop]}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.itemIndex}>
                          <Text style={styles.itemIndexText}>{idx + 1}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                        <Text style={styles.itemName} numberOfLines={1}>{name}</Text>
                        {meta ? <Text style={styles.itemMeta} numberOfLines={1}>{meta}</Text> : null}
                        <View style={styles.itemBadgeRow}>
                          <View style={styles.coveredBadge}>
                            <Text style={styles.coveredBadgeText}>Will be covered</Text>
                          </View>
                          {validVideoUri ? (
                            <TouchableOpacity
                              style={styles.videoBadgeBtn}
                              onPress={() => setPreviewVideo({ uri: validVideoUri, title: name })}
                              activeOpacity={0.75}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="#0052e0" stroke="#0052e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                              <Text style={styles.videoBadgeBtnText}>Play Video</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.catalogBadge}>
                              <Text style={styles.catalogBadgeText}>Catalog Verified</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => onRemove?.(idx)} style={styles.removeBtn} activeOpacity={0.7}>
                        <Text style={styles.removeBtnText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity onPress={onAddMore} style={styles.addMoreBtn} activeOpacity={0.85}>
              <Text style={styles.addMoreBtnText}>+ {count === 0 ? 'Add Appliance' : 'Add Another Appliance'}</Text>
            </TouchableOpacity>
          </div>

          {/* Right Column: Desktop Sticky Summary */}
          {isDesktopWeb && (
            <div style={desktopStickySummaryStyle}>
              <View style={styles.desktopSummaryCard}>
                <Text style={styles.summaryCardEyebrow}>PLAN SUMMARY</Text>
                <Text style={styles.summaryCardTitle}>{plan?.name || 'AMC'} Plan</Text>
                <Text style={styles.summaryCardSub}>12 Months Comprehensive Coverage</Text>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryDetailRow}>
                  <Text style={styles.summaryDetailLabel}>Protected Appliances</Text>
                  <Text style={styles.summaryDetailValue}>{count} Items</Text>
                </View>
                <View style={styles.summaryDetailRow}>
                  <Text style={styles.summaryDetailLabel}>Breakdown Repair Labor</Text>
                  <Text style={[styles.summaryDetailValue, { color: '#16a34a' }]}>₹0 Free</Text>
                </View>
                <View style={styles.summaryDetailRow}>
                  <Text style={styles.summaryDetailLabel}>Contract Validity</Text>
                  <Text style={styles.summaryDetailValue}>1 Year (365 Days)</Text>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryTotalRow}>
                  <Text style={styles.summaryTotalLabel}>Total Amount</Text>
                  <Text style={styles.summaryTotalValue}>₹{price.toLocaleString('en-IN')}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.desktopPurchaseBtn, !canPurchase && styles.purchaseBtnDisabled]}
                  onPress={canPurchase ? openConfirm : undefined}
                  disabled={!canPurchase}
                  activeOpacity={0.88}
                >
                  <Text style={styles.desktopPurchaseBtnText}>
                    {canPurchase ? `Confirm & Pay ₹${price.toLocaleString('en-IN')}` : 'Add Appliances First'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.summaryGuaranteeText}>
                  🛡️ 100% Satisfaction Guaranteed • Verified Technicians • Digital Warranty
                </Text>
              </View>
            </div>
          )}
        </div>
      </ScrollView>

      {/* Sticky purchase footer (Mobile only) */}
      {!isDesktopWeb && (
        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerLabel}>{plan?.name} • {plan?.validity_months || 12} months</Text>
            <Text style={styles.footerPrice}>₹{price.toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity
            onPress={canPurchase ? openConfirm : undefined}
            disabled={!canPurchase}
            style={[styles.purchaseBtn, !canPurchase && styles.purchaseBtnDisabled]}
            activeOpacity={0.88}
          >
            <Text style={[styles.purchaseBtnText, !canPurchase && { color: '#94a3b8' }]}>
              Purchase {plan?.name}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pre-purchase confirmation note */}
      <Modal visible={showConfirm} transparent animationType="fade" onRequestClose={() => setShowConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Text style={styles.modalIconText}>!</Text>
            </View>
            <Text style={styles.modalTitle}>Have you added all your appliances?</Text>
            <Text style={styles.modalSub}>
              Please check every appliance listed below. After you buy the {plan?.name}, booking a service for any
              appliance that is <Text style={{ fontWeight: '800', color: '#0f172a' }}>not on this list</Text> will cost an
              extra <Text style={{ fontWeight: '800', color: '#b45309' }}>₹{EXTRA_APPLIANCE_FEE} per appliance</Text>.
            </Text>

            <ScrollView style={styles.modalList} contentContainerStyle={{ gap: 6 }}>
              {appliances.map((app, idx) => (
                <View key={app.id || `cf-${idx}`} style={styles.modalListRow}>
                  <Text style={styles.modalListCheck}>✓</Text>
                  <Text style={styles.modalListText} numberOfLines={1}>
                    {app.displayName || app.name || 'Appliance'}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setConfirmChecked((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkBox, confirmChecked && styles.checkBoxOn]}>
                {confirmChecked ? <Text style={styles.checkBoxTick}>✓</Text> : null}
              </View>
              <Text style={styles.checkLabel}>
                I have added and checked all my appliances ({count})
              </Text>
            </TouchableOpacity>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setShowConfirm(false);
                  onAddMore?.();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSecondaryBtnText}>Go Back & Add More</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, !confirmChecked && styles.purchaseBtnDisabled]}
                onPress={handleConfirmPay}
                disabled={!confirmChecked}
                activeOpacity={0.88}
              >
                <Text style={[styles.modalPrimaryBtnText, !confirmChecked && { color: '#94a3b8' }]}>
                  Confirm & Pay ₹{price.toLocaleString('en-IN')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Video Preview Modal */}
      <Modal
        visible={!!previewVideo}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVideo(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 440, padding: 16, gap: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.videoModalTitle} numberOfLines={1}>
                  {previewVideo?.title || 'Inspection Video'}
                </Text>
                <Text style={styles.videoModalSub}>Recorded Inspection Walkthrough</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPreviewVideo(null)}
                style={styles.videoCloseBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.videoCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.videoPlayerBox}>
              <video
                key={previewVideo?.uri}
                src={previewVideo?.uri}
                controls
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: 240,
                  borderRadius: 12,
                  backgroundColor: '#000000',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </View>

            <TouchableOpacity
              onPress={() => setPreviewVideo(null)}
              style={styles.videoDoneBtn}
              activeOpacity={0.88}
            >
              <Text style={styles.videoDoneBtnText}>Close Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const desktopTwoColReview = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
  gap: '32px',
  alignItems: 'start',
  width: '100%',
};

const desktopLeftCol = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  minWidth: 0,
};

const desktopStickySummaryStyle = {
  position: 'sticky',
  top: '20px',
  minWidth: 0,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 120, gap: 14 },
  contentDesktop: {
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 60,
    boxSizing: 'border-box',
  },
  itemThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  desktopSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 24,
    gap: 12,
    boxShadow: '0 8px 28px rgba(15, 23, 42, 0.06)',
  },
  summaryCardEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.8,
  },
  summaryCardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  summaryCardSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: -4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  summaryDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryDetailLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  summaryDetailValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  summaryTotalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  desktopPurchaseBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 18px rgba(37, 99, 235, 0.3)',
    cursor: 'pointer',
    marginTop: 6,
  },
  desktopPurchaseBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  summaryGuaranteeText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
  },
  backLink: { alignSelf: 'flex-start', paddingVertical: 4 },
  backLinkText: { fontSize: 13, fontWeight: '700', color: '#2563eb' },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginTop: 4 },
  stepDot: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: '#16a34a' },
  stepDotActive: { backgroundColor: '#2563eb' },
  stepDotText: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  stepLine: { flex: 1, height: 3, backgroundColor: '#e2e8f0', marginHorizontal: 4, borderRadius: 2 },
  stepLineDone: { backgroundColor: '#16a34a' },
  stepLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -6 },
  stepLabel: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  headerCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#dbeafe', gap: 4,
    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.08)',
  },
  headerEyebrow: { fontSize: 11, fontWeight: '800', color: '#2563eb', letterSpacing: 0.8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" },
  headerSub: { fontSize: 12.5, color: '#64748b', lineHeight: 18 },
  emptyBox: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 24, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  list: { gap: 10 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#ffffff',
    borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e2e8f0',
  },
  itemThumb: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemThumbDesktop: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  itemThumbVideoWrap: {
    cursor: 'pointer',
    backgroundColor: '#000000',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
  },
  playOverlayBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 82, 224, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
    pointerEvents: 'none',
  },
  catalogBadge: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catalogBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  itemIndex: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#eff6ff',
    alignItems: 'center', justifyContent: 'center',
  },
  itemIndexText: { fontSize: 13, fontWeight: '800', color: '#2563eb' },
  itemName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  itemMeta: { fontSize: 11.5, color: '#64748b' },
  itemBadgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  coveredBadge: { backgroundColor: '#f0fdf4', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#bbf7d0' },
  coveredBadgeText: { fontSize: 10, fontWeight: '700', color: '#15803d' },
  videoBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    cursor: 'pointer',
  },
  videoBadgeBtnText: { fontSize: 10, fontWeight: '700', color: '#0052e0' },
  videoBadge: { backgroundColor: '#eff6ff', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#bfdbfe' },
  videoBadgeText: { fontSize: 10, fontWeight: '700', color: '#1d4ed8' },
  removeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fef2f2' },
  removeBtnText: { fontSize: 11.5, fontWeight: '700', color: '#dc2626' },
  addMoreBtn: {
    borderRadius: 12, paddingVertical: 13, alignItems: 'center', borderWidth: 1.5,
    borderColor: '#2563eb', borderStyle: 'dashed', backgroundColor: '#eff6ff',
  },
  addMoreBtnText: { fontSize: 14, fontWeight: '800', color: '#2563eb' },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff',
    borderTopWidth: 1, borderTopColor: '#e2e8f0', boxShadow: '0 -4px 16px rgba(15, 23, 42, 0.08)',
  },
  footerLabel: { fontSize: 11.5, color: '#64748b', fontWeight: '600' },
  footerPrice: { fontSize: 18, fontWeight: '900', color: '#0f172a', fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" },
  purchaseBtn: {
    backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 18,
    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)', cursor: 'pointer',
  },
  purchaseBtnDisabled: { backgroundColor: '#e2e8f0', boxShadow: 'none', cursor: 'default' },
  purchaseBtnText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  videoModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  videoModalSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  videoCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  videoCloseBtnText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
  },
  videoPlayerBox: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  videoDoneBtn: {
    backgroundColor: '#0052e0',
    borderRadius: 10,
    paddingVertical: 10.5,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginTop: 2,
  },
  videoDoneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 18,
  },
  modalCard: {
    width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 18, padding: 20, gap: 12,
    boxShadow: '0 20px 50px rgba(15, 23, 42, 0.3)',
  },
  modalIconCircle: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#fef3c7', alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fde68a',
  },
  modalIconText: { fontSize: 22, fontWeight: '900', color: '#b45309' },
  modalTitle: {
    fontSize: 17, fontWeight: '800', color: '#0f172a', textAlign: 'center',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  modalSub: { fontSize: 12.5, color: '#475569', lineHeight: 19, textAlign: 'center' },
  modalList: {
    maxHeight: 150, backgroundColor: '#f8fafc', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  modalListRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalListCheck: { fontSize: 12, fontWeight: '900', color: '#16a34a' },
  modalListText: { flex: 1, fontSize: 12.5, fontWeight: '600', color: '#0f172a' },
  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10,
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', cursor: 'pointer',
  },
  checkBox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#94a3b8',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff',
  },
  checkBoxOn: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkBoxTick: { fontSize: 12, fontWeight: '900', color: '#ffffff' },
  checkLabel: { flex: 1, fontSize: 12.5, fontWeight: '700', color: '#1e3a8a' },
  modalBtnRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  modalSecondaryBtn: {
    flex: 1, minWidth: 140, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
  },
  modalSecondaryBtnText: { fontSize: 13, fontWeight: '700', color: '#334155' },
  modalPrimaryBtn: {
    flex: 1, minWidth: 140, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#2563eb', boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)',
  },
  modalPrimaryBtnText: { fontSize: 13, fontWeight: '800', color: '#ffffff' },
});
