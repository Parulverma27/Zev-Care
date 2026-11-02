import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, useWindowDimensions, Image } from 'react-native';
import { getApplianceVideoUri, resolveApplianceImage } from '../../utils/applianceMediaHelper';
import { ZEVOTA_COMPANY_NAME, ZEVOTA_TERMS_AND_CONDITIONS } from '../../config/termsAndConditions';

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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);

  const getValidVideoUri = (app) => {
    return getApplianceVideoUri(app);
  };

  const openConfirm = () => {
    setConfirmChecked(false);
    setShowConfirm(true);
  };

  const canProceedToPayment = confirmChecked && termsAccepted;

  const handleConfirmPay = () => {
    if (!canProceedToPayment) return;
    setShowConfirm(false);
    onPurchase?.();
  };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, isDesktopWeb && styles.contentDesktop]} showsVerticalScrollIndicator={false}>
        <div style={isDesktopWeb ? desktopTwoColReview : undefined}>
          <div style={isDesktopWeb ? desktopLeftCol : undefined}>
            <View style={styles.topNavRow}>
              <TouchableOpacity onPress={onBack} style={styles.backPill} activeOpacity={0.75}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <Text style={styles.backPillText}>Back to Plans</Text>
              </TouchableOpacity>
              <View style={styles.stepBadgePill}>
                <Text style={styles.stepBadgePillText}>Step 2 of 3</Text>
              </View>
            </View>

            {/* Polished Stepper without overlapping */}
            <View style={styles.stepperContainer}>
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, styles.stepDotDone]}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </View>
                <Text style={[styles.stepLabel, styles.stepLabelDone]}>Add Appliances</Text>
              </View>

              <View style={[styles.stepConnector, styles.stepConnectorDone]} />

              <View style={styles.stepItem}>
                <View style={[styles.stepDot, styles.stepDotActive]}>
                  <Text style={styles.stepDotText}>2</Text>
                </View>
                <Text style={[styles.stepLabel, styles.stepLabelActive]}>Review</Text>
              </View>

              <View style={styles.stepConnector} />

              <View style={styles.stepItem}>
                <View style={styles.stepDot}>
                  <Text style={[styles.stepDotText, { color: '#64748b' }]}>3</Text>
                </View>
                <Text style={styles.stepLabel}>Purchase</Text>
              </View>
            </View>

            {/* Header / Plan Overview Card */}
            <View style={styles.headerCard}>
              <View style={styles.headerEyebrowRow}>
                <View style={styles.headerEyebrowBadge}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <Text style={styles.headerEyebrow}>{(plan?.name || 'AMC').toUpperCase()} PLAN</Text>
                </View>
                <View style={styles.validityBadge}>
                  <Text style={styles.validityBadgeText}>{plan?.validity_months || 12} Months Protection</Text>
                </View>
              </View>
              <Text style={styles.headerTitle}>Review Covered Appliances</Text>
              <Text style={styles.headerSub}>
                {count === 0
                  ? 'No appliances added yet. Add every appliance you want covered before purchasing.'
                  : `${count} appliance${count === 1 ? '' : 's'} protected under this plan. Everything listed here gets free breakdown repair labor & verified technician support.`}
              </Text>
            </View>

            {count === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No appliances added yet</Text>
                <Text style={styles.emptySub}>Tap “Add Appliance” to register your first appliance under this plan.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {appliances.map((app, idx) => {
                  const name = app.displayName || app.name || 'Appliance';
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
                              borderRadius: 14,
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
                        <View style={[styles.itemThumb, isDesktopWeb && styles.itemThumbDesktop]}>
                          <Image
                            source={{ uri: catalogImg }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                          />
                        </View>
                      ) : (
                        <View style={styles.itemIndex}>
                          <Text style={styles.itemIndexText}>{idx + 1}</Text>
                        </View>
                      )}

                      <View style={styles.itemInfo}>
                        <View style={styles.itemHeaderRow}>
                          <Text style={styles.itemName} numberOfLines={1}>{name}</Text>
                          <TouchableOpacity onPress={() => onRemove?.(idx)} style={styles.removeBtn} activeOpacity={0.7} accessibilityLabel={`Remove ${name}`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            <Text style={styles.removeBtnText}>Remove</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Specs Pill Row */}
                        <View style={styles.specChipsRow}>
                          {app.category && app.category !== name ? (
                            <View style={styles.specChip}>
                              <Text style={styles.specChipText}>{app.category}</Text>
                            </View>
                          ) : null}
                          {app.brand ? (
                            <View style={styles.specChip}>
                              <Text style={styles.specChipText}>{app.brand}</Text>
                            </View>
                          ) : null}
                          {app.location ? (
                            <View style={styles.specChip}>
                              <Text style={styles.specChipText}>{app.location}</Text>
                            </View>
                          ) : null}
                        </View>

                        <View style={styles.itemBadgeRow}>
                          <View style={styles.coveredBadge}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.6">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
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
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity onPress={onAddMore} style={styles.addMoreBtn} activeOpacity={0.85}>
              <View style={styles.addMoreIconBox}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.addMoreBtnTitle}>+ {count === 0 ? 'Add Appliance' : 'Add Another Appliance'}</Text>
                <Text style={styles.addMoreBtnSub}>Add AC, Refrigerator, RO, Geyser &amp; more to this plan</Text>
              </View>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </TouchableOpacity>

            {/* Mobile Terms & Conditions Acceptance Card */}
            {!isDesktopWeb && (
              <View style={styles.mobileTermsCard}>
                <TouchableOpacity
                  style={[styles.summaryTermsCheckRow, termsAccepted && styles.summaryTermsCheckRowActive]}
                  onPress={() => setTermsAccepted((v) => !v)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkBox, termsAccepted && styles.checkBoxOn]}>
                    {termsAccepted ? <Text style={styles.checkBoxTick}>✓</Text> : null}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.summaryTermsCheckText}>
                      I accept the{' '}
                      <Text
                        style={styles.termsLinkUnderline}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          setShowTermsModal(true);
                        }}
                      >
                        Terms and Conditions
                      </Text>{' '}
                      of {ZEVOTA_COMPANY_NAME}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
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

                {/* Desktop Mandatory Terms Agreement Checkbox */}
                <TouchableOpacity
                  style={[styles.summaryTermsCheckRow, termsAccepted && styles.summaryTermsCheckRowActive]}
                  onPress={() => setTermsAccepted((v) => !v)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkBox, termsAccepted && styles.checkBoxOn]}>
                    {termsAccepted ? <Text style={styles.checkBoxTick}>✓</Text> : null}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.summaryTermsCheckText}>
                      I accept the{' '}
                      <Text
                        style={styles.termsLinkUnderline}
                        onPress={(e) => {
                          e?.stopPropagation?.();
                          setShowTermsModal(true);
                        }}
                      >
                        Terms and Conditions
                      </Text>{' '}
                      of {ZEVOTA_COMPANY_NAME}
                    </Text>
                  </View>
                </TouchableOpacity>

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
                  100% Satisfaction Guaranteed • Verified Technicians • Digital Warranty
                </Text>
              </View>
            </div>
          )}
        </div>
      </ScrollView>

      {/* Sticky purchase footer (Mobile only) */}
      {!isDesktopWeb && (
        <View style={styles.footer}>
          {/* Row 1: Plan & Covered Items Info */}
          <View style={styles.footerTopRow}>
            <View style={styles.footerPlanTitleWrap}>
              <View style={styles.footerDot} />
              <Text style={styles.footerPlanTitle}>
                {plan?.name} Plan • {plan?.validity_months || 12} Months
              </Text>
            </View>
            <View style={styles.footerCoveredPill}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <Text style={styles.footerCoveredPillText}>
                {count} {count === 1 ? 'Item' : 'Items'} Covered
              </Text>
            </View>
          </View>

          {/* Row 2: Price & Purchase Action */}
          <View style={styles.footerBottomRow}>
            <View style={styles.footerPriceCol}>
              <Text style={styles.footerPriceLabel}>Total Plan Price</Text>
              <Text style={styles.footerPrice}>₹{price.toLocaleString('en-IN')}</Text>
            </View>
            <TouchableOpacity
              onPress={canPurchase ? openConfirm : undefined}
              disabled={!canPurchase}
              style={[styles.purchaseBtn, !canPurchase && styles.purchaseBtnDisabled]}
              activeOpacity={0.88}
            >
              <Text style={[styles.purchaseBtnText, !canPurchase && { color: '#94a3b8' }]}>
                {canPurchase ? `Purchase ${plan?.name} →` : 'Add Appliance First'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Pre-purchase confirmation note */}
      <Modal visible={showConfirm} transparent animationType="fade" onRequestClose={() => setShowConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Text style={styles.modalIconText}>!</Text>
            </View>
            <Text style={styles.modalTitle}>Confirm Plan &amp; Accept Terms</Text>
            <Text style={styles.modalSub}>
              Please check your registered appliances below. After you buy the {plan?.name}, booking a service for any
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

            {/* Checkbox 1: Appliances Checked */}
            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setConfirmChecked((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkBox, confirmChecked && styles.checkBoxOn]}>
                {confirmChecked ? <Text style={styles.checkBoxTick}>✓</Text> : null}
              </View>
              <Text style={styles.checkLabel}>
                I have added and verified all my appliances ({count})
              </Text>
            </TouchableOpacity>

            {/* Checkbox 2: Mandatory Terms Acceptance */}
            <TouchableOpacity
              style={[styles.checkRow, !termsAccepted && styles.checkRowPending]}
              onPress={() => setTermsAccepted((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkBox, termsAccepted && styles.checkBoxOn]}>
                {termsAccepted ? <Text style={styles.checkBoxTick}>✓</Text> : null}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.checkLabel}>
                  I accept all 15 clauses of the{' '}
                  <Text
                    style={{ color: '#0052e0', fontWeight: '800', textDecorationLine: 'underline', cursor: 'pointer' }}
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      setShowTermsModal(true);
                    }}
                  >
                    Terms &amp; Conditions
                  </Text>{' '}
                  of {ZEVOTA_COMPANY_NAME}.
                </Text>
              </View>
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
                <Text style={styles.modalSecondaryBtnText}>Add More Appliances</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, !canProceedToPayment && styles.purchaseBtnDisabled]}
                onPress={handleConfirmPay}
                disabled={!canProceedToPayment}
                activeOpacity={0.88}
              >
                <Text style={[styles.modalPrimaryBtnText, !canProceedToPayment && { color: '#94a3b8' }]}>
                  {!canProceedToPayment
                    ? 'Accept Terms to Pay'
                    : `Confirm & Pay ₹${price.toLocaleString('en-IN')}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Terms & Conditions Modal */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.termsModalCard}>
            <View style={styles.termsModalHeader}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.termsModalTitle} numberOfLines={1}>
                  {ZEVOTA_COMPANY_NAME}
                </Text>
                <Text style={styles.termsModalSub}>
                  Annual Maintenance Contract (AMC) Terms &amp; Conditions (15 Clauses)
                </Text>
              </View>
              <TouchableOpacity
                style={styles.videoCloseBtn}
                onPress={() => setShowTermsModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.videoCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.termsModalList} showsVerticalScrollIndicator={true} contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
              {ZEVOTA_TERMS_AND_CONDITIONS.map((clause) => (
                <View key={clause.id} style={styles.termsClauseCard}>
                  <View style={styles.termsClauseHeader}>
                    <View style={styles.termsClauseNumberBadge}>
                      <Text style={styles.termsClauseNumberText}>{clause.clauseNumber}</Text>
                    </View>
                    <Text style={styles.termsClauseTitle}>{clause.title}</Text>
                  </View>
                  <Text style={styles.termsClauseBody}>{clause.body}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.termsModalFooter}>
              <TouchableOpacity
                style={styles.termsModalCloseBtn}
                onPress={() => setShowTermsModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.termsModalCloseBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.termsModalAcceptBtn}
                onPress={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.termsModalAcceptBtnText}>
                  I Understand &amp; Accept All 15 Terms ✓
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
  content: { padding: 16, paddingBottom: 175, gap: 14 },
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
  /* Top Nav Row */
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    cursor: 'pointer',
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 6px rgba(37, 99, 235, 0.06)' } : {}),
  },
  backPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  stepBadgePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  stepBadgePillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2563eb',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },

  /* Stepper (No Overlap) */
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)' } : {}),
  },
  stepItem: {
    alignItems: 'center',
    flexShrink: 0,
    width: 86,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepDotDone: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  stepDotActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 0 3.5px rgba(37, 99, 235, 0.2)' } : {}),
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  stepConnector: {
    flex: 1,
    height: 2.5,
    backgroundColor: '#e2e8f0',
    marginTop: 13,
    marginHorizontal: 4,
    borderRadius: 1.5,
  },
  stepConnectorDone: {
    backgroundColor: '#16a34a',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  stepLabelActive: {
    color: '#2563eb',
    fontWeight: '800',
  },
  stepLabelDone: {
    color: '#15803d',
    fontWeight: '700',
  },

  /* Header Card */
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 8,
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' } : {}),
  },
  headerEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  headerEyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  headerEyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.6,
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  validityBadge: {
    backgroundColor: '#f8fafc',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  validityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  headerSub: {
    fontSize: 12.5,
    color: '#64748b',
    lineHeight: 18,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  emptySub: { fontSize: 12.5, color: '#64748b', textAlign: 'center' },
  list: { gap: 10 },

  /* Appliance Item Card */
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' } : {}),
  },
  itemThumb: {
    width: 62,
    height: 62,
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
  itemInfo: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    flex: 1,
  },
  specChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  specChip: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  specChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  itemBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  coveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  coveredBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803d',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
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
  videoBadgeBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0052e0',
    fontFamily: "'Outfit', 'Inter', sans-serif",
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
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIndexText: { fontSize: 13, fontWeight: '800', color: '#2563eb' },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    cursor: 'pointer',
    flexShrink: 0,
  },
  removeBtnText: { fontSize: 11, fontWeight: '700', color: '#dc2626' },

  /* Add More Button */
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    backgroundColor: '#f8faff',
    cursor: 'pointer',
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(37, 99, 235, 0.05)' } : {}),
  },
  addMoreIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addMoreBtnTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1d4ed8',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  addMoreBtnSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  /* Sticky Footer */
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'web' ? 14 : 22,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    boxShadow: '0 -6px 20px rgba(15, 23, 42, 0.08)',
    zIndex: 90,
    gap: 10,
  },
  footerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  footerPlanTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#2563eb',
  },
  footerPlanTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  footerCoveredPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  footerCoveredPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  footerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  footerPriceCol: {
    justifyContent: 'center',
  },
  footerPriceLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  purchaseBtn: {
    flex: 1.3,
    backgroundColor: '#0052e0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(0, 82, 224, 0.28)',
    cursor: 'pointer',
  },
  purchaseBtnDisabled: {
    backgroundColor: '#e2e8f0',
    boxShadow: 'none',
    cursor: 'default',
  },
  purchaseBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
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

  /* Terms & Conditions Agreement Checkbox & Links */
  mobileTermsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
    marginTop: 14,
    gap: 6,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  summaryTermsCheckRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 11,
    marginTop: 2,
    cursor: 'pointer',
  },
  summaryTermsCheckRowActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  summaryTermsCheckText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    fontWeight: '600',
  },
  termsLinkUnderline: {
    color: '#0878f8',
    fontWeight: '800',
    textDecorationLine: 'underline',
    cursor: 'pointer',
  },
  viewTermsLinkBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    marginTop: -4,
    marginBottom: 4,
    cursor: 'pointer',
  },
  viewTermsLinkBtnText: {
    fontSize: 11.5,
    color: '#0878f8',
    fontWeight: '700',
  },
  checkRowPending: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  viewTermsModalLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingVertical: 4,
    cursor: 'pointer',
  },
  viewTermsModalLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
    textDecorationLine: 'underline',
  },

  /* Terms & Conditions Modal Styles */
  termsModalCard: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '88vh',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.35)',
    display: 'flex',
    flexDirection: 'column',
  },
  termsModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  termsModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  termsModalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  termsModalList: {
    flex: 1,
    maxHeight: 460,
    paddingRight: 6,
  },
  termsClauseCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  termsClauseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  termsClauseNumberBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  termsClauseNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  termsClauseTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  termsClauseBody: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 19,
    whiteSpace: 'pre-line',
  },
  termsModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  termsModalCloseBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  termsModalCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  termsModalAcceptBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
  },
  termsModalAcceptBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
