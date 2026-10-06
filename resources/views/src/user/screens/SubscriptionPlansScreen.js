import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import api from '../../services/ApiService';
import { AppIcon } from '../../components/AppIcons';
import { getPlanTheme } from '../../config/planTheme';

const IconSavings = ({ size = 16, color = '#15803d' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z" />
    <path d="M2 9v1c0 1.1.9 2 2 2h1" />
    <circle cx="16" cy="11" r="1" fill={color} />
  </svg>
);

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function SubscriptionPlansScreen({ onNavigate }) {
  const { subscriptionPlans, activeUser, purchaseSubscription, activeAmc } = useApp();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  const isAnonymous = Boolean(
    !activeUser ||
    activeUser.isAnonymous ||
    (activeUser.isGuest && !activeUser.phone) ||
    (!activeUser.phone && !activeUser.guestId)
  );

  const isGuest = Boolean(
    activeUser?.isGuest ||
    activeUser?.id === 0 ||
    activeUser?.name === 'Guest User' ||
    isAnonymous
  );

  // Custom Styled Popup Modal state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('info'); // 'success' | 'error' | 'info'

  const showAlert = (title, message, type = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const isCurrentPlan = (plan) => {
    if (!activeUser?.subscription_plan) return false;
    const userPlan = String(activeUser.subscription_plan).toLowerCase();
    const targetPlan = String(plan.name).toLowerCase();
    return userPlan.includes(targetPlan) || targetPlan.includes(userPlan);
  };

  const handleSelect = (plan) => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    if (isCurrentPlan(plan)) {
      showAlert(
        'Active AMC Plan',
        `Your ${plan.name} is already active! Contract #${activeAmc?.contractNo || activeUser?.amc_contract_number || 'AMC-ACTIVE'} protects your home with scheduled visits and ₹0 breakdown labor.`,
        'info'
      );
      return;
    }
    setSelectedPlan(plan);
    setModalVisible(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPlan) return;

    let order = null;
    let isMock = false;

    try {
      const response = await api.post('/payments/create-order', {
        amount: selectedPlan.price,
      });
      if (response.data && response.data.success) {
        order = response.data.order;
      }
    } catch (orderErr) {
      console.warn('Razorpay API order creation failed. Falling back to simulated transaction flow.', orderErr);
      isMock = true;
    }

    if (isMock || !order) {
      // Trigger simulated checkout payment flow
      showAlert('Processing AMC Activation', 'Securing payment via payment gateway (Test Mode)...', 'info');
      setTimeout(async () => {
        try {
          const verifyRes = await api.post('/payments/verify', {
            razorpay_order_id: `order_mock_${Math.floor(100000 + Math.random() * 900000)}`,
            razorpay_payment_id: `pay_mock_${Math.floor(100000 + Math.random() * 900000)}`,
            razorpay_signature: 'mock_signature',
            userId: activeUser?.id,
            userPhone: activeUser?.phone,
            planName: selectedPlan.name,
            creditAmount: selectedPlan.wallet_credit,
          });

          if (verifyRes.data.success) {
            purchaseSubscription(selectedPlan, verifyRes.data.transaction_id);
            setModalVisible(false);
            showAlert(
              'AMC Activated Successfully!',
              `Welcome to Zevota Care VIP! Your ${selectedPlan.name} is now ACTIVE. Contract #${verifyRes.data.amc_contract_number || 'AMC-2026-ACTIVE'} has been issued.`,
              'success'
            );
          } else {
            showAlert('Activation Failed', 'Payment verification failed.', 'error');
          }
        } catch (err) {
          showAlert('Activation Error', `Payment verification error: ${err.message}`, 'error');
        }
      }, 1000);
      return;
    }

    // Live Razorpay Checkout
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      showAlert('Payment Gateway Error', 'Could not load payment checkout script. Please check your internet connection.', 'error');
      return;
    }

    try {
      const options = {
        key: 'rzp_test_SulCbbU6slizY9',
        amount: order.amount,
        currency: order.currency,
        name: 'Zevota Care',
        description: `Activation of ${selectedPlan.name} (365 Days)`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: activeUser?.id,
              userPhone: activeUser?.phone,
              planName: selectedPlan.name,
              creditAmount: selectedPlan.wallet_credit,
            });

            if (verifyRes.data.success) {
              purchaseSubscription(selectedPlan, verifyRes.data.transaction_id);
              setModalVisible(false);
              showAlert(
                'AMC Activated Successfully!',
                `Payment verified! Your ${selectedPlan.name} is now active under Contract #${verifyRes.data.amc_contract_number || 'AMC-ACTIVE'}.`,
                'success'
              );
            } else {
              showAlert('Verification Failed', 'Payment verification failed.', 'error');
            }
          } catch (err) {
            showAlert('Verification Error', `Payment verification error: ${err.message}`, 'error');
          }
        },
        prefill: {
          name: activeUser?.name || '',
          email: activeUser?.email || '',
          contact: activeUser?.phone || '',
        },
        theme: {
          color: '#0a192f',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showAlert('Payment Error', `Razorpay Payment Error: ${err.message}`, 'error');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigate(-1)} activeOpacity={0.75}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F1F3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>AMC Membership Plans</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>Select coverage for your home & appliances</Text>
        </View>
      </View>

      {activeAmc ? (
        <View style={styles.purchasedCard}>
          <View style={styles.purchasedBadge}>
            <Text style={styles.purchasedBadgeText}>PURCHASED</Text>
          </View>
          <Text style={styles.purchasedLabel}>Your active AMC</Text>
          <Text style={styles.purchasedPlan}>{activeAmc.planName}</Text>
          <Text style={styles.purchasedMeta}>Contract {activeAmc.contractNo}</Text>
          <Text style={styles.purchasedMeta}>
            Valid till{' '}
            {activeAmc.expiryDate
              ? new Date(activeAmc.expiryDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </Text>
          <TouchableOpacity style={styles.purchasedLink} onPress={() => navigate('/user/my-amc')} activeOpacity={0.85}>
            <Text style={styles.purchasedLinkText}>View in My AMC →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noPlanCard}>
          <Text style={styles.noPlanTitle}>No AMC purchased yet</Text>
          <Text style={styles.noPlanSub}>Browse plans below and activate coverage for your appliances.</Text>
        </View>
      )}

      {/* Plan Cards Container */}
      <View style={styles.plansContainer}>
        {subscriptionPlans.map((plan) => {
          const isCurrent = isCurrentPlan(plan);
          const features = JSON.parse(plan.features_json || '[]');
          const theme = getPlanTheme(plan.name);

          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                {
                  borderColor: theme.borderGold,
                  borderWidth: plan.is_recommended || isCurrent ? 2.4 : 1.4,
                  boxShadow: theme.cardGlow,
                },
                isCurrent && { backgroundColor: '#fcfcfd' },
              ]}
            >
              {/* Card Header with Glassmorphism Metallic Sheen */}
              <div
                style={{
                  background: theme.headerBg,
                  backgroundColor: theme.headerBgSolid,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  borderTopLeftRadius: '18px',
                  borderTopRightRadius: '18px',
                  padding: '20px 18px',
                  margin: '-16px -16px 14px -16px',
                  borderBottom: `1.5px solid ${theme.borderGold}`,
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.95), 0 4px 16px rgba(0, 0, 0, 0.03)',
                  position: 'relative',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {theme.icon}
                    <Text style={[styles.planName, { color: theme.headerTextColor }]}>{plan.name}</Text>
                  </View>
                  <View style={[styles.tierTagBadge, { backgroundColor: theme.badgeBg, borderColor: theme.badgeBorder }]}>
                    <Text style={[styles.tierTagText, { color: theme.badgeTextColor }]}>{theme.tierBadge}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
                  <Text style={[styles.planPrice, { color: theme.headerTextColor }]}>₹{plan.price.toLocaleString('en-IN')}</Text>
                  <Text style={[styles.planPeriod, { color: theme.headerPeriodColor }]}>/ {plan.validity_months || 12} Months Contract</Text>
                </View>

                <Text style={[styles.planThemeTagline, { color: theme.headerTaglineColor }]}>{theme.tagline || plan.description}</Text>
              </div>

              {plan.is_recommended && (
                <View style={[styles.recBadge, { backgroundColor: theme.btnBg, borderColor: theme.borderGold }]}>
                  <Text style={[styles.recBadgeText, { color: theme.badgeTextColor }]}>★ MOST POPULAR • {theme.tierBadge}</Text>
                </View>
              )}

              {/* UrbanClap Style AMC Entitlements Metric Bar */}
              <View style={styles.amcSpecsBox}>
                <View style={styles.amcSpecItem}>
                  <Text style={styles.amcSpecLabel}>PREVENTIVE VISITS</Text>
                  <Text style={styles.amcSpecVal}>{theme.preventiveVisits} Free Services</Text>
                </View>
                <View style={styles.amcSpecDivider} />
                <View style={styles.amcSpecItem}>
                  <Text style={styles.amcSpecLabel}>BREAKDOWN LABOR</Text>
                  <Text style={[styles.amcSpecVal, { color: '#059669' }]}>100% Free (₹0)</Text>
                </View>
                <View style={styles.amcSpecDivider} />
                <View style={styles.amcSpecItem}>
                  <Text style={styles.amcSpecLabel}>PARTS ALLOWANCE</Text>
                  <Text style={[styles.amcSpecVal, { color: theme.specHighlight || '#d97706' }]}>Up to ₹{theme.partsCap.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              {/* Scannable Feature List with Theme Checkmarks */}
              <View style={styles.featureList}>
                {features.map((feat, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <View style={[styles.goldCheckCircle, { backgroundColor: theme.checkBg || theme.borderGold }]}>
                      <AppIcon name="check" size={11} color={theme.checkColor || '#0f172a'} strokeWidth={3} />
                    </View>
                    <Text style={styles.featureText}>{feat}</Text>
                  </View>
                ))}
              </View>

              {/* AMC Savings Strip */}
              <View style={styles.savingsCallout}>
                <IconSavings size={16} color="#15803d" />
                <Text style={styles.savingsText}>
                  Est. Annual Savings: <Text style={{ fontWeight: '700', color: '#15803d' }}>₹{(plan.price * 0.45).toLocaleString('en-IN')}+</Text> vs ad-hoc repairs
                </Text>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[
                  styles.buyBtn,
                  isCurrent
                    ? [styles.currentActiveBuyBtn, { backgroundColor: theme.btnBg, borderColor: theme.borderGold, borderWidth: 1.5 }]
                    : { backgroundColor: theme.btnBg, borderColor: theme.borderGold, borderWidth: 1.5 },
                ]}
                onPress={() => handleSelect(plan)}
                disabled={isCurrent}
                activeOpacity={isCurrent ? 1 : 0.85}
              >
                {isCurrent ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <AppIcon name="check" size={16} color={theme.btnTextColor} strokeWidth={3} />
                    <Text style={[styles.currentActiveBuyBtnText, { color: theme.btnTextColor }]}>Active AMC Plan</Text>
                  </View>
                ) : (
                  <Text style={[styles.buyBtnText, { color: theme.btnTextColor }]}>{`Activate ${plan.name} →`}</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>



      {/* Confirmation Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {(() => {
              const modalTheme = getPlanTheme(selectedPlan?.name);
              return (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.tierTagBadge, { backgroundColor: modalTheme.badgeBg, borderColor: modalTheme.badgeBorder }]}>
                      <Text style={[styles.tierTagText, { color: modalTheme.badgeTextColor }]}>VIP CONTRACT ACTIVATION</Text>
                    </View>
                  </View>
                  <Text style={styles.modalTitle}>Activate {selectedPlan?.name}</Text>
                  <Text style={styles.modalSub}>
                    You are activating a 365-day Annual Maintenance Contract covering your home, verified appliances, and emergency repairs.
                  </Text>

                  <View style={[styles.summaryBox, { borderColor: modalTheme.borderGold || '#d4af37', borderWidth: 1.5 }]}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.sumLabel}>Contract Duration</Text>
                      <Text style={styles.sumVal}>{selectedPlan?.validity_months || 12} Months (365 Days)</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.sumLabel}>Preventive Services</Text>
                      <Text style={[styles.sumVal, { color: '#059669' }]}>{modalTheme.preventiveVisits} Free Services Included</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.sumLabel}>Breakdown Labor Charge</Text>
                      <Text style={[styles.sumVal, { color: '#059669' }]}>100% Free (Unlimited)</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.sumLabel}>Spare Parts Allowance</Text>
                      <Text style={[styles.sumVal, { color: '#d97706' }]}>Up to ₹{modalTheme.partsCap.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 4 }]}>
                      <Text style={[styles.sumLabel, { fontWeight: '700', color: '#0a192f' }]}>Total Investment</Text>
                      <Text style={[styles.sumVal, { fontSize: 16, fontWeight: '800', color: '#0a192f' }]}>₹{selectedPlan?.price?.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: modalTheme.btnBg, borderWidth: 1.5, borderColor: modalTheme.borderGold }]}
                    onPress={handleConfirmPurchase}
                    activeOpacity={0.88}
                  >
                    <View style={styles.confirmBtnRow}>
                      <AppIcon name="lock" size={15} color={modalTheme.metalColor || '#fbbf24'} strokeWidth={2.5} />
                      <Text style={[styles.confirmBtnText, { color: modalTheme.btnTextColor }]}>Confirm & Activate AMC Contract</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelBtnText}>Review other plans</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Guest Login Required Modal */}
      <Modal visible={showGuestModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.guestCloseBtn} onPress={() => setShowGuestModal(false)}>
              <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              <View style={styles.guestIconCircle}>
                <AppIcon name="lock" size={26} color="#B45309" strokeWidth={2.2} />
              </View>
              <Text style={[styles.modalTitle, { textAlign: 'center' }]}>
                {isAnonymous ? 'Register First' : 'Complete Your Profile First'}
              </Text>
              <Text style={[styles.modalSub, { textAlign: 'center' }]}>
                {isAnonymous
                  ? 'To issue an Annual Maintenance Contract tied to your property and appliances, please register your account first.'
                  : 'To issue an Annual Maintenance Contract tied to your property and appliances, please complete your profile first.'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: '#0052e0', borderColor: '#0052e0', borderWidth: 1.5 }]}
              onPress={() => {
                setShowGuestModal(false);
                navigate('/user/register');
              }}
              activeOpacity={0.88}
            >
              <Text style={[styles.confirmBtnText, { color: '#ffffff' }]}>
                {isAnonymous ? 'Register First →' : 'Complete Your Profile →'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.guestOutlineBtn} onPress={() => setShowGuestModal(false)}>
              <Text style={styles.guestOutlineBtnText}>Explore Plans First</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Styled Alert Modal */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 6 }}>
              <View
                style={[
                  styles.alertIconCircle,
                  alertType === 'success' ? styles.alertSuccessCircle : alertType === 'error' ? styles.alertErrorCircle : styles.alertInfoCircle,
                ]}
              >
                <Text
                  style={[
                    styles.alertIconText,
                    { color: alertType === 'success' ? '#059669' : alertType === 'error' ? '#DC2626' : '#2563EB' },
                  ]}
                >
                  {alertType === 'success' ? '✓' : alertType === 'error' ? '✕' : 'ℹ'}
                </Text>
              </View>
              <Text style={[styles.modalTitle, { textAlign: 'center' }]}>{alertTitle}</Text>
              <Text style={[styles.modalSub, { textAlign: 'center', lineHeight: 19 }]}>{alertMessage}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: alertType === 'success' ? '#059669' : alertType === 'error' ? '#DC2626' : '#0a192f',
                  borderColor: alertType === 'success' ? '#059669' : alertType === 'error' ? '#DC2626' : '#d4af37',
                  borderWidth: 1.5,
                },
              ]}
              onPress={() => setAlertVisible(false)}
            >
              <Text style={[styles.confirmBtnText, { color: '#ffffff' }]}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 60, maxWidth: 680, alignSelf: 'center', width: '100%', gap: 16 },

  /* Top Header */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    width: '100%',
    boxSizing: 'border-box',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0a192f',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },

  purchasedCard: {
    backgroundColor: '#0a192f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#d4af37',
    gap: 4,
  },
  purchasedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.18)',
    borderWidth: 1,
    borderColor: '#d4af37',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  purchasedBadgeText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  purchasedLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  purchasedPlan: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  purchasedMeta: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
  },
  purchasedLink: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  purchasedLinkText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
  },
  noPlanCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 4,
  },
  noPlanTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400e',
  },
  noPlanSub: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 17,
  },

  plansContainer: { gap: 24, paddingTop: 10 },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    gap: 14,
    position: 'relative',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.85)',
  },
  currentCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  recBadge: {
    position: 'absolute',
    top: -12,
    right: 18,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 30,
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
  },
  recBadgeText: { fontWeight: '800', fontSize: 10, letterSpacing: 0.5 },

  planName: { fontSize: 17, fontWeight: '800', fontFamily: "'Outfit', 'Inter', sans-serif" },
  tierTagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  tierTagText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 },
  planPrice: { fontSize: 26, fontWeight: '800', fontFamily: "'Outfit', 'Inter', sans-serif" },
  planPeriod: { fontSize: 12, color: '#cbd5e1', fontWeight: '500' },
  planThemeTagline: { fontSize: 11.5, color: '#94a3b8', marginTop: 4, fontWeight: '500' },

  /* AMC Specs Box */
  amcSpecsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amcSpecItem: { flex: 1, alignItems: 'center', gap: 2 },
  amcSpecLabel: { fontSize: 9, fontWeight: '700', color: '#64748b', letterSpacing: 0.4 },
  amcSpecVal: { fontSize: 12, fontWeight: '800', color: '#0f172a' },
  amcSpecDivider: { width: 1, height: 26, backgroundColor: '#cbd5e1' },

  featureList: { gap: 8, paddingHorizontal: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  goldCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: { fontSize: 12, color: '#334155', fontWeight: '500', lineHeight: 16 },

  savingsCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 8,
    borderRadius: 10,
  },
  savingsEmoji: { fontSize: 14 },
  savingsText: { fontSize: 11.5, color: '#166534', fontWeight: '500' },

  buyBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentActiveBuyBtn: {
    backgroundColor: '#0a192f',
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    cursor: 'default',
  },
  currentActiveBuyBtnText: { color: '#fbbf24', fontWeight: '800', fontSize: 13.5, fontFamily: 'Inter, sans-serif' },
  buyBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13.5, fontFamily: 'Inter, sans-serif' },



  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 25, 47, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    width: '95%',
    maxWidth: 380,
    gap: 14,
    boxShadow: '0 20px 35px rgba(0, 0, 0, 0.25)',
    borderWidth: 1.2,
    borderColor: '#d4af37',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0a192f', fontFamily: 'Inter, sans-serif' },
  modalSub: { fontSize: 12.5, color: '#475569', lineHeight: 18 },
  summaryBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, gap: 7 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumLabel: { fontSize: 12, color: '#64748b' },
  sumVal: { fontSize: 12.5, fontWeight: '700', color: '#0a192f' },

  confirmBtn: { paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  confirmBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmBtnText: { fontWeight: '700', fontSize: 13.5, fontFamily: 'Inter, sans-serif' },
  cancelBtn: { paddingVertical: 6, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: '600', fontSize: 12 },

  alertIconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  alertSuccessCircle: { backgroundColor: '#ecfdf5' },
  alertErrorCircle: { backgroundColor: '#fef2f2' },
  alertInfoCircle: { backgroundColor: '#eff6ff' },
  alertIconText: { fontSize: 22, fontWeight: '700' },

  guestCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  guestIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestOutlineBtn: {
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  guestOutlineBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 13 },
});
