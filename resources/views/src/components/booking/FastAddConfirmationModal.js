import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image } from 'react-native';

export default function FastAddConfirmationModal({
  visible = false,
  item = null,
  categoryName = '',
  quantity = 1,
  onIncrement = null,
  onDecrement = null,
  onConfirm = () => {},
  onCancel = () => {},
}) {
  if (!visible || !item) return null;

  const itemName = item.name || 'Service Item';
  const itemDesc = item.description || 'Professional doorstep inspection & service';
  const itemImg = item.image_url || item.image || null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Top category chip & close button */}
          <View style={styles.headerRow}>
            <View style={styles.categoryChip}>
              <span style={styles.sparkleIcon}>⚡</span>
              <Text style={styles.categoryChipText}>
                {categoryName ? `${categoryName.toUpperCase()} • QUICK ADD` : 'QUICK ADD'}
              </Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Item details card */}
          <View style={styles.itemCard}>
            {itemImg ? (
              <Image source={{ uri: itemImg }} style={styles.itemImg} resizeMode="cover" />
            ) : (
              <View style={styles.fallbackIconWrap}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.itemTitle}>{itemName}</Text>
              <Text style={styles.itemDesc} numberOfLines={2}>{itemDesc}</Text>
            </View>
          </View>


          {/* Quantity selector (optional if counters enabled) */}
          {onIncrement && onDecrement && (
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Quantity</Text>
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  onPress={onDecrement}
                  style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
                  disabled={quantity <= 1}
                  activeOpacity={0.7}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNumber}>{quantity}</Text>
                <TouchableOpacity onPress={onIncrement} style={styles.qtyBtn} activeOpacity={0.7}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={styles.confirmBtn} activeOpacity={0.85}>
              <Text style={styles.confirmBtnText}>Confirm & Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.25)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  sparkleIcon: {
    fontSize: 12,
  },
  categoryChipText: {
    color: '#1d4ed8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  closeBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemImg: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  fallbackIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  itemDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  qtyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    cursor: 'pointer',
  },
  qtyBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  qtyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  qtyNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    minWidth: 18,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
    cursor: 'pointer',
  },
  confirmBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
});
