import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';

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
  const count = appliances.length;
  const price = Number(plan?.price || 0);
  const canPurchase = count > 0;
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
              const hasVideo = !!(app.video || app.videoUrl || app.media?.url);
              return (
                <View key={app.id || `rev-${idx}`} style={styles.itemCard}>
                  <View style={styles.itemIndex}>
                    <Text style={styles.itemIndexText}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                    <Text style={styles.itemName} numberOfLines={1}>{name}</Text>
                    {meta ? <Text style={styles.itemMeta} numberOfLines={1}>{meta}</Text> : null}
                    <View style={styles.itemBadgeRow}>
                      <View style={styles.coveredBadge}>
                        <Text style={styles.coveredBadgeText}>Will be covered</Text>
                      </View>
                      {hasVideo ? (
                        <View style={styles.videoBadge}>
                          <Text style={styles.videoBadgeText}>Video added</Text>
                        </View>
                      ) : null}
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
      </ScrollView>

      {/* Sticky purchase footer */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 120, gap: 14 },
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
