import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { AppIcon } from './AppIcons';

export default function RazorpayDemoModal({
  visible,
  onClose,
  amount = 0,
  businessName = 'Zevota Care Services',
  orderMeta = 'Instant Verification',
  activeUser = null,
  onSuccess,
  successTitle = 'Payment Successful!',
  successSub = '',
}) {
  const [paymentMethod, setPaymentMethod] = useState('upi'); // upi | card | netbanking | wallet
  const [paymentState, setPaymentState] = useState('idle'); // idle | processing | success | failed
  const [selectedUpiApp, setSelectedUpiApp] = useState('Google Pay');
  const [upiIdInput, setUpiIdInput] = useState('user@okaxis');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Paytm Wallet');

  useEffect(() => {
    if (visible) {
      setPaymentState('idle');
      if (activeUser?.phone) {
        const cleanPhone = String(activeUser.phone).replace(/\D/g, '').slice(-10);
        if (cleanPhone) setUpiIdInput(`${cleanPhone}@upi`);
      }
    }
  }, [visible, activeUser]);

  const handleProcessPayment = () => {
    if (paymentState === 'processing') return;
    setPaymentState('processing');

    setTimeout(() => {
      setPaymentState('success');
      setTimeout(() => {
        if (typeof onSuccess === 'function') {
          onSuccess({
            method: paymentMethod,
            amount: amount,
            upiApp: selectedUpiApp,
            bank: selectedBank,
            wallet: selectedWallet,
          });
        }
        if (typeof onClose === 'function') {
          onClose();
        }
        setPaymentState('idle');
      }, 1300);
    }, 1400);
  };

  const formattedAmount = Number(amount || 0).toLocaleString('en-IN');
  const holderName = (activeUser?.name || 'CARD HOLDER').toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (paymentState !== 'processing' && typeof onClose === 'function') {
          onClose();
        }
      }}
    >
      <View style={styles.rzpOverlay}>
        <View style={styles.rzpCard}>
          {/* Header */}
          <View style={styles.rzpHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.rzpBadgeRow}>
                <View style={styles.rzpLiveDot} />
                <Text style={styles.rzpBadgeText}>Razorpay Demo Gateway</Text>
              </View>
              <Text style={styles.rzpBusinessName}>{businessName}</Text>
              <Text style={styles.rzpOrderMeta}>{orderMeta}</Text>
            </View>
            <TouchableOpacity
              style={styles.rzpCloseBtn}
              disabled={paymentState === 'processing'}
              onPress={() => {
                if (paymentState !== 'processing' && typeof onClose === 'function') {
                  onClose();
                }
              }}
              accessibilityLabel="Close Razorpay Demo"
            >
              <Text style={styles.rzpCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Amount Box */}
          <View style={styles.rzpAmountBox}>
            <Text style={styles.rzpAmountLabel}>Amount Payable</Text>
            <Text style={styles.rzpAmountValue}>₹{formattedAmount}.00</Text>
          </View>

          {paymentState === 'processing' ? (
            <View style={styles.rzpProcessingBox}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.rzpProcessingTitle}>Contacting Bank Gateway...</Text>
              <Text style={styles.rzpProcessingSub}>Securing transaction via Razorpay Demo...</Text>
            </View>
          ) : paymentState === 'success' ? (
            <View style={styles.rzpSuccessBox}>
              <View style={styles.rzpSuccessBadge}>
                <Text style={styles.rzpSuccessCheck}>✓</Text>
              </View>
              <Text style={styles.rzpSuccessTitle}>{successTitle}</Text>
              <Text style={styles.rzpSuccessSub}>
                {successSub || `₹${formattedAmount} processed successfully.`}
              </Text>
            </View>
          ) : (
            <>
              {/* Payment Method Tabs */}
              <View style={styles.rzpTabs}>
                {[
                  { id: 'upi', label: '⚡ UPI' },
                  { id: 'card', label: '💳 Cards' },
                  { id: 'netbanking', label: '🏦 NetBanking' },
                  { id: 'wallet', label: '👛 Wallets' },
                ].map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.rzpTab, paymentMethod === m.id && styles.rzpTabActive]}
                    onPress={() => setPaymentMethod(m.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.rzpTabText, paymentMethod === m.id && styles.rzpTabTextActive]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Method Body */}
              <View style={styles.rzpMethodBody}>
                {paymentMethod === 'upi' && (
                  <View style={{ gap: 10 }}>
                    <Text style={styles.rzpMethodLabel}>Choose UPI Payment Option</Text>
                    <View style={styles.rzpGrid}>
                      {['Google Pay', 'PhonePe', 'Paytm UPI', 'BHIM'].map((app) => (
                        <TouchableOpacity
                          key={app}
                          style={[styles.rzpOptionPill, selectedUpiApp === app && styles.rzpOptionPillActive]}
                          onPress={() => setSelectedUpiApp(app)}
                        >
                          <Text style={[styles.rzpOptionPillText, selectedUpiApp === app && styles.rzpOptionPillTextActive]}>
                            {app}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.rzpInputWrap}>
                      <Text style={styles.rzpInputPrefix}>VPA</Text>
                      <TextInput
                        style={styles.rzpInput}
                        value={upiIdInput}
                        onChangeText={setUpiIdInput}
                        placeholder="yourname@upi"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>
                )}

                {paymentMethod === 'card' && (
                  <View style={{ gap: 10 }}>
                    <Text style={styles.rzpMethodLabel}>Card Simulation (Demo Mode)</Text>
                    <View style={styles.rzpCardPreview}>
                      <Text style={styles.rzpCardBrand}>VISA / MASTERCARD</Text>
                      <Text style={styles.rzpCardNumber}>4829 •••• •••• 9201</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={styles.rzpCardHolder}>{holderName}</Text>
                        <Text style={styles.rzpCardExp}>12 / 28</Text>
                      </View>
                    </View>
                  </View>
                )}

                {paymentMethod === 'netbanking' && (
                  <View style={{ gap: 10 }}>
                    <Text style={styles.rzpMethodLabel}>Select Bank</Text>
                    <View style={styles.rzpGrid}>
                      {['HDFC Bank', 'SBI', 'ICICI Bank', 'Axis Bank', 'Kotak'].map((b) => (
                        <TouchableOpacity
                          key={b}
                          style={[styles.rzpOptionPill, selectedBank === b && styles.rzpOptionPillActive]}
                          onPress={() => setSelectedBank(b)}
                        >
                          <Text style={[styles.rzpOptionPillText, selectedBank === b && styles.rzpOptionPillTextActive]}>
                            {b}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {paymentMethod === 'wallet' && (
                  <View style={{ gap: 10 }}>
                    <Text style={styles.rzpMethodLabel}>Select Digital Wallet</Text>
                    <View style={styles.rzpGrid}>
                      {['Paytm Wallet', 'Amazon Pay', 'PhonePe', 'Mobikwik'].map((w) => (
                        <TouchableOpacity
                          key={w}
                          style={[styles.rzpOptionPill, selectedWallet === w && styles.rzpOptionPillActive]}
                          onPress={() => setSelectedWallet(w)}
                        >
                          <Text style={[styles.rzpOptionPillText, selectedWallet === w && styles.rzpOptionPillTextActive]}>
                            {w}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Pay Action Button */}
              <TouchableOpacity
                style={styles.rzpPayBtn}
                onPress={handleProcessPayment}
                activeOpacity={0.88}
              >
                <Text style={styles.rzpPayBtnText}>
                  Pay ₹{formattedAmount}.00
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginVertical: 12 }}>
                <AppIcon name="lock" size={12} color="#94a3b8" strokeWidth={2.2} />
                <Text style={[styles.rzpSecuredFooter, { marginVertical: 0 }]}>
                  256-bit SSL Encrypted • Razorpay Certified Gateway
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  rzpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  rzpCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    elevation: 12,
  },
  rzpHeader: {
    backgroundColor: '#0c2340',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  rzpBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  rzpLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  rzpBadgeText: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: 'Inter, sans-serif',
  },
  rzpBusinessName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
  },
  rzpOrderMeta: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'Inter, sans-serif',
  },
  rzpCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rzpCloseText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  rzpAmountBox: {
    backgroundColor: '#f8fafc',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rzpAmountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'Inter, sans-serif',
  },
  rzpAmountValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif',
  },
  rzpTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    gap: 4,
  },
  rzpTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  rzpTabActive: {
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  rzpTabText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'Inter, sans-serif',
  },
  rzpTabTextActive: {
    color: '#0c2340',
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
  },
  rzpMethodBody: {
    padding: 16,
    minHeight: 140,
  },
  rzpMethodLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    fontFamily: 'Inter, sans-serif',
  },
  rzpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rzpOptionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
  },
  rzpOptionPillActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  rzpOptionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    fontFamily: 'Inter, sans-serif',
  },
  rzpOptionPillTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
  },
  rzpInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    marginTop: 4,
  },
  rzpInputPrefix: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginRight: 8,
    fontFamily: 'Inter, sans-serif',
  },
  rzpInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    height: '100%',
    fontFamily: 'Inter, sans-serif',
  },
  rzpCardPreview: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  rzpCardBrand: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'Inter, sans-serif',
  },
  rzpCardNumber: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
    marginVertical: 4,
    fontFamily: 'Inter, sans-serif',
  },
  rzpCardHolder: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter, sans-serif',
  },
  rzpCardExp: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter, sans-serif',
  },
  rzpPayBtn: {
    backgroundColor: '#2563eb',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
  },
  rzpPayBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter, sans-serif',
  },
  rzpSecuredFooter: {
    fontSize: 10.5,
    color: '#94a3b8',
    textAlign: 'center',
    marginVertical: 12,
    fontWeight: '500',
    fontFamily: 'Inter, sans-serif',
  },
  rzpProcessingBox: {
    padding: 36,
    alignItems: 'center',
    gap: 12,
  },
  rzpProcessingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 8,
    fontFamily: 'Inter, sans-serif',
  },
  rzpProcessingSub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
  },
  rzpSuccessBox: {
    padding: 36,
    alignItems: 'center',
    gap: 10,
  },
  rzpSuccessBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#86efac',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  rzpSuccessCheck: {
    fontSize: 28,
    color: '#16a34a',
    fontWeight: '800',
  },
  rzpSuccessTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'Inter, sans-serif',
  },
  rzpSuccessSub: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Inter, sans-serif',
  },
});
