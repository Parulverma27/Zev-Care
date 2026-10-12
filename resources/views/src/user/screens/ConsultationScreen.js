import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AppIcon } from '../../components/AppIcons';

const CONSULTATION_TRADES = [
  {
    id: 'electrical',
    title: 'Electrician Consultation',
    trade: 'Electrician',
    category: 'Electrical',
    iconName: 'zap',
    badge: '₹0 Diagnosis',
    duration: '30–45 mins',
    popularSymptom: 'MCB trip, sparking or wiring issues',
    symptoms: [
      'MCB frequently tripping',
      'Switch / socket burnt or sparking',
      'Power failure in specific room',
      'Burning smell near switchboard',
      'New appliance wiring / point required',
      'Other electrical issue',
    ],
  },
  {
    id: 'plumbing',
    title: 'Plumber Consultation',
    trade: 'Plumber',
    category: 'Plumbing',
    iconName: 'droplet',
    badge: '₹0 Diagnosis',
    duration: '30–45 mins',
    popularSymptom: 'Leakage, low pressure or blockage',
    symptoms: [
      'Water leaking from pipe or joint',
      'Low water pressure in taps / shower',
      'Drainage / sink pipe blocked',
      'Continuous dripping tap or valve',
      'Toilet flush tank malfunction',
      'Other plumbing issue',
    ],
  },
  {
    id: 'ac',
    title: 'AC Inspection & Diagnosis',
    trade: 'AC Technician',
    category: 'AC Services',
    iconName: 'wind',
    badge: '₹0 Diagnosis',
    duration: '40–50 mins',
    popularSymptom: 'No cooling, water dripping or noise',
    symptoms: [
      'AC running but room not cooling',
      'Water leaking inside the room',
      'Unusual humming or vibrating noise',
      'AC won\'t power on or trip breaker',
      'Bad odor / gas inspection needed',
      'Other AC issue',
    ],
  },
  {
    id: 'appliances',
    title: 'Appliance Repair Consultation',
    trade: 'Appliance Expert',
    category: 'Home Appliances',
    iconName: 'tool',
    badge: '₹0 Diagnosis',
    duration: '35–45 mins',
    popularSymptom: 'Washing machine, fridge, geyser or microwave',
    symptoms: [
      'Washing machine not spinning / draining',
      'Refrigerator not cooling / ice frosting',
      'Geyser water not heating / tripping',
      'Microwave oven not heating food',
      'RO Water Purifier low flow / taste issue',
      'Other appliance issue',
    ],
  },
  {
    id: 'carpenter',
    title: 'Carpenter Consultation',
    trade: 'Carpenter',
    category: 'Carpentry',
    iconName: 'home',
    badge: '₹0 Diagnosis',
    duration: '30–45 mins',
    popularSymptom: 'Doors, locks, hinges or modular furniture',
    symptoms: [
      'Door jammed / rubbing against floor',
      'Lock damaged or key stuck',
      'Cabinet / drawer channel broken',
      'Wardrobe hinges loose / misaligned',
      'Furniture repair or assembly',
      'Other carpentry issue',
    ],
  },
];

const TIME_SLOTS = [
  '09:00 AM - 11:00 AM',
  '11:00 AM - 01:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
  '06:00 PM - 08:00 PM',
];

export default function ConsultationScreen({ onNavigate }) {
  const navigate = useNavigate();
  const { activeUser, createBooking } = useApp();

  const [selectedTradeId, setSelectedTradeId] = useState('electrical');
  const [selectedSymptom, setSelectedSymptom] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[1]);
  const [address, setAddress] = useState(activeUser?.address || 'Bandra West, Mumbai');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isGuest = Boolean(
    !activeUser ||
    activeUser.isGuest ||
    activeUser.id === 0 ||
    activeUser.name === 'Guest User' ||
    activeUser.isAnonymous
  );
  const [showGuestModal, setShowGuestModal] = useState(false);

  const activeTrade = CONSULTATION_TRADES.find((t) => t.id === selectedTradeId) || CONSULTATION_TRADES[0];

  // Generate 4 calendar day options
  const days = React.useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const label =
        i === 0
          ? 'Today'
          : i === 1
          ? 'Tomorrow'
          : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      list.push({
        label,
        dateStr: d.toISOString().split('T')[0],
      });
    }
    return list;
  }, []);

  const handleGoBack = () => {
    if (onNavigate) {
      onNavigate('HOME');
    } else {
      navigate('/user/home');
    }
  };

  const handleBookConsultation = async () => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    setErrorMsg('');
    if (!address.trim()) {
      setErrorMsg('Please specify a home address for the technician visit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const issueSummary = [
        selectedSymptom || 'General on-site inspection requested',
        customNotes.trim() ? `Notes: ${customNotes.trim()}` : null,
      ]
        .filter(Boolean)
        .join(' • ');

      const bookingPayload = {
        category: activeTrade.category,
        subCategory: activeTrade.title,
        service: activeTrade.title,
        trade: activeTrade.trade,
        scheduledDate: days[selectedDayIdx].dateStr,
        scheduledDateLabel: days[selectedDayIdx].label,
        scheduledTime: selectedSlot,
        address: address.trim(),
        issue: issueSummary,
        issueDescription: issueSummary,
        bookingMode: 'consultation',
        isConsultation: true,
        total_price: 0,
        isCoveredByAmc: false, // 100% Free even without any plan!
      };

      const result = await createBooking(bookingPayload);
      setIsSubmitting(false);

      const targetId = result?.booking_id || result?.bookingId || result?.id;
      if (targetId) {
        if (navigate) {
          navigate(`/user/bookings/${targetId}`);
        } else if (onNavigate) {
          onNavigate('BOOKINGS');
        }
      } else {
        if (navigate) navigate('/user/bookings');
        else if (onNavigate) onNavigate('BOOKINGS');
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Could not place consultation booking. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Header Row */}
      <View style={styles.topNavRow}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backBtn} activeOpacity={0.7}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Book a Consultation</Text>
          <Text style={styles.pageSubtitle}>Expert on-site inspection & diagnosis</Text>
        </View>
        <View style={styles.zeroPillBadge}>
          <Text style={styles.zeroPillBadgeText}>₹0 FREE</Text>
        </View>
      </View>

      {/* Hero Banner: Free For Everyone */}
      <View style={styles.heroBannerCard}>
        <View style={styles.heroBannerIconWrap}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.heroBannerTitle}>Free On-Site Diagnostic Visit</Text>
          <Text style={styles.heroBannerSub}>
            Zero visitation charges for anyone. Our certified technician visits, inspects the issue, and provides an upfront quote.
          </Text>
        </View>
      </View>

      {/* Step 1: Select Trade */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.stepNumberBadge}><Text style={styles.stepNumberText}>1</Text></View>
          <Text style={styles.sectionHeading}>Select Service Category</Text>
        </View>
        <Text style={styles.sectionHint}>Choose the type of problem you need diagnosed</Text>

        <View style={styles.tradesGrid}>
          {CONSULTATION_TRADES.map((trade) => {
            const isSelected = trade.id === selectedTradeId;
            return (
              <TouchableOpacity
                key={trade.id}
                style={[styles.tradeCard, isSelected && styles.tradeCardSelected]}
                onPress={() => {
                  setSelectedTradeId(trade.id);
                  setSelectedSymptom('');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.tradeCardHeader}>
                  <View style={[styles.tradeIconCircle, isSelected && styles.tradeIconCircleSelected]}>
                    <AppIcon name={trade.iconName} size={20} color={isSelected ? '#ffffff' : '#2563eb'} />
                  </View>
                  <View style={[styles.freeTag, isSelected && styles.freeTagSelected]}>
                    <Text style={[styles.freeTagText, isSelected && styles.freeTagTextSelected]}>₹0 Free</Text>
                  </View>
                </View>

                <Text style={[styles.tradeTitle, isSelected && styles.tradeTitleSelected]}>
                  {trade.title}
                </Text>
                <Text style={styles.tradeSub} numberOfLines={2}>
                  {trade.popularSymptom}
                </Text>

                <View style={styles.tradeFooter}>
                  <Text style={styles.tradeDuration}>⏱ {trade.duration}</Text>
                  {isSelected && (
                    <View style={styles.checkmarkDot}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Step 2: Pick Symptom / Issue */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.stepNumberBadge}><Text style={styles.stepNumberText}>2</Text></View>
          <Text style={styles.sectionHeading}>What seems to be the problem?</Text>
        </View>
        <Text style={styles.sectionHint}>Select the closest symptom so the technician carries the right tools</Text>

        <View style={styles.symptomsWrap}>
          {activeTrade.symptoms.map((symptom, idx) => {
            const isPicked = selectedSymptom === symptom;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.symptomChip, isPicked && styles.symptomChipActive]}
                onPress={() => setSelectedSymptom(isPicked ? '' : symptom)}
                activeOpacity={0.75}
              >
                <Text style={[styles.symptomChipText, isPicked && styles.symptomChipTextActive]}>
                  {symptom}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Optional Notes */}
        <TextInput
          style={styles.notesInput}
          placeholder="Add any extra details or instructions (optional)..."
          placeholderTextColor="#94a3b8"
          value={customNotes}
          onChangeText={setCustomNotes}
          multiline
        />
      </View>

      {/* Step 3: Schedule Date & Slot */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.stepNumberBadge}><Text style={styles.stepNumberText}>3</Text></View>
          <Text style={styles.sectionHeading}>Select Date & Preferred Time</Text>
        </View>

        {/* Day Tabs */}
        <View style={styles.daysRow}>
          {days.map((day, idx) => {
            const isDaySelected = selectedDayIdx === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.dayTab, isDaySelected && styles.dayTabSelected]}
                onPress={() => setSelectedDayIdx(idx)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayTabText, isDaySelected && styles.dayTabTextSelected]}>
                  {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Slot Pills */}
        <View style={styles.slotsGrid}>
          {TIME_SLOTS.map((slot) => {
            const isSlotActive = selectedSlot === slot;
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.slotPill, isSlotActive && styles.slotPillActive]}
                onPress={() => setSelectedSlot(slot)}
                activeOpacity={0.8}
              >
                <Text style={[styles.slotPillText, isSlotActive && styles.slotPillTextActive]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Step 4: Home Address */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.stepNumberBadge}><Text style={styles.stepNumberText}>4</Text></View>
          <Text style={styles.sectionHeading}>Service Location</Text>
        </View>

        <View style={styles.addressBox}>
          <View style={styles.addressIconCircle}>
            <AppIcon name="map-pin" size={18} color="#2563eb" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>Home Address</Text>
            <TextInput
              style={styles.addressInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your street address, house no., landmark..."
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>
      </View>

      {/* How Urban Company Consultation Works (Trust Card) */}
      <View style={styles.howItWorksCard}>
        <Text style={styles.howItWorksTitle}>How Consultation Works</Text>
        <View style={styles.howItWorksList}>
          <View style={styles.howStepRow}>
            <View style={styles.howStepDot}><Text style={styles.howStepNum}>1</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.howStepHeading}>Certified Technician Visits Home</Text>
              <Text style={styles.howStepDetail}>Technician arrives at your selected slot and diagnoses the root cause.</Text>
            </View>
          </View>
          <View style={styles.howStepRow}>
            <View style={styles.howStepDot}><Text style={styles.howStepNum}>2</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.howStepHeading}>Detailed Digital Quote Prepared</Text>
              <Text style={styles.howStepDetail}>You receive an itemized quote (parts + labor) directly inside your app.</Text>
            </View>
          </View>
          <View style={styles.howStepRow}>
            <View style={styles.howStepDot}><Text style={styles.howStepNum}>3</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.howStepHeading}>You Decide to Proceed</Text>
              <Text style={styles.howStepDetail}>
                Approve to begin repair work. If you choose not to proceed, the consultation remains ₹0 with no charges.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Zero Fee Checkout Breakdown */}
      <View style={styles.billCard}>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>On-Site Inspection & Diagnosis</Text>
          <Text style={styles.billStrikethrough}>₹199</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Zevota Care Introductory Discount</Text>
          <Text style={styles.billGreen}>-₹199</Text>
        </View>
        <View style={[styles.billRow, styles.billRowTotal]}>
          <View>
            <Text style={styles.billTotalLabel}>Total Amount Due Now</Text>
            <Text style={styles.billTotalSub}>Pay only if you approve actual repair work</Text>
          </View>
          <Text style={styles.billTotalAmount}>₹0</Text>
        </View>
      </View>

      {errorMsg ? <Text style={styles.errorBanner}>{errorMsg}</Text> : null}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.bookBtn, isSubmitting && styles.bookBtnDisabled]}
        onPress={handleBookConsultation}
        disabled={isSubmitting}
        activeOpacity={0.88}
      >
        <Text style={styles.bookBtnText}>
          {isSubmitting ? 'Scheduling Visit...' : `Confirm Free Consultation (₹0)`}
        </Text>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </TouchableOpacity>

      {/* Guest Lock Modal */}
      <Modal
        visible={showGuestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGuestModal(false)}
      >
        <View style={consultGuestStyles.overlay}>
          <View style={consultGuestStyles.card}>
            <TouchableOpacity
              style={consultGuestStyles.closeBtn}
              onPress={() => setShowGuestModal(false)}
            >
              <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>

            <View style={consultGuestStyles.iconCircle}>
              <AppIcon name="lock" size={26} color="#B45309" strokeWidth={2.2} />
            </View>

            <Text style={consultGuestStyles.title}>Register First</Text>
            <Text style={consultGuestStyles.sub}>
              Please register or sign in to your account to book your free My Mechanic consultation.
            </Text>

            <TouchableOpacity
              style={consultGuestStyles.primaryBtn}
              onPress={() => {
                setShowGuestModal(false);
                if (navigate) navigate('/user/register');
                else if (onNavigate) onNavigate('/user/register');
              }}
              activeOpacity={0.85}
            >
              <Text style={consultGuestStyles.primaryBtnText}>Register Now →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={consultGuestStyles.secondaryBtn}
              onPress={() => {
                setShowGuestModal(false);
                if (navigate) navigate('/user/login');
                else if (onNavigate) onNavigate('/user/login');
              }}
              activeOpacity={0.85}
            >
              <Text style={consultGuestStyles.secondaryBtnText}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const consultGuestStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    position: 'relative',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  sub: {
    fontSize: 13.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  secondaryBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#334155',
    fontSize: 13.5,
    fontWeight: '600',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    width: '100%',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 90,
    gap: 16,
    width: '100%',
    boxSizing: 'border-box',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  zeroPillBadge: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  zeroPillBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.2,
  },
  heroBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 8px 24px rgba(29, 78, 216, 0.22)',
  },
  heroBannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroBannerTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  heroBannerSub: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: '400',
  },
  sectionBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  sectionHint: {
    fontSize: 12,
    color: '#64748b',
    marginTop: -6,
  },
  tradesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 10,
    width: '100%',
  },
  tradeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 6,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  tradeCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#f0f7ff',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.12)',
  },
  tradeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  tradeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeIconCircleSelected: {
    backgroundColor: '#2563eb',
  },
  freeTag: {
    backgroundColor: '#f1f5f9',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  freeTagSelected: {
    backgroundColor: '#dcfce7',
  },
  freeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  freeTagTextSelected: {
    color: '#15803d',
  },
  tradeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  tradeTitleSelected: {
    color: '#1d4ed8',
  },
  tradeSub: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 15,
  },
  tradeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  tradeDuration: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  checkmarkDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symptomsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 7,
    cursor: 'pointer',
  },
  symptomChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  symptomChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
  },
  symptomChipTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    fontSize: 12.5,
    color: '#0f172a',
    minHeight: 54,
    outlineStyle: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  dayTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    cursor: 'pointer',
  },
  dayTabSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  dayTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  dayTabTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    width: '100%',
  },
  slotPill: {
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    cursor: 'pointer',
  },
  slotPillActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  slotPillText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '500',
  },
  slotPillTextActive: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
  },
  addressIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addressLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressInput: {
    fontSize: 13,
    color: '#0f172a',
    marginTop: 2,
    outlineStyle: 'none',
    padding: 0,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  howItWorksCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 16,
    gap: 12,
  },
  howItWorksTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  howItWorksList: {
    gap: 10,
  },
  howStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  howStepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  howStepNum: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  howStepHeading: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#166534',
  },
  howStepDetail: {
    fontSize: 11.5,
    color: '#15803d',
    lineHeight: 15,
  },
  billCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 8,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 12.5,
    color: '#475569',
  },
  billStrikethrough: {
    fontSize: 12.5,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  billGreen: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#16a34a',
  },
  billRowTotal: {
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  billTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  billTotalSub: {
    fontSize: 11,
    color: '#64748b',
  },
  billTotalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#16a34a',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  bookBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.28)',
    cursor: 'pointer',
  },
  bookBtnDisabled: {
    opacity: 0.65,
    cursor: 'not-allowed',
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
  },
});
