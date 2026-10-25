import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform, useWindowDimensions } from 'react-native';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { searchAllServices } from '../../config/serviceCatalogUtils';
import HomeExploreServices from './HomeExploreServices';
import LiveSupportOptionCard from '../../components/booking/LiveSupportOptionCard';

export default function ServiceBrowseScreen({ onNavigate }) {
  const { categories, services, activeUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const isConsultation = (location.pathname || '').includes('consultation');
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 1024;

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

  const planName = activeUser?.subscription_plan || 'None';
  const hasActiveAmc = !isGuest && activeUser?.subscription_status === 'ACTIVE' && planName !== 'None' && planName !== 'None / Inactive';

  const [showGateModal, setShowGateModal] = useState(false);
  const [gateContext, setGateContext] = useState({ title: '', message: '', isGuestGate: false });

  const checkCanBookComplaint = () => {
    if (isConsultation) {
      // My Mechanic is free for ANY logged-in user, even without an active AMC plan
      if (isAnonymous) {
        setGateContext({
          title: 'Sign In / Register Required',
          message: 'Please sign in or register to book your complimentary My Mechanic consultation.',
          isGuestGate: true,
        });
        setShowGateModal(true);
        return false;
      }
      return true;
    }

    if (isGuest) {
      setGateContext({
        title: 'Sign In / Register Required',
        message: 'AMC complaints with ₹0 breakdown labor and priority repairs are reserved for AMC members. Please sign in or register to get protected.',
        isGuestGate: true,
      });
      setShowGateModal(true);
      return false;
    }
    if (!hasActiveAmc) {
      setGateContext({
        title: 'AMC Plan Required',
        message: 'AMC breakdown complaints, ₹0 labor repairs, and scheduled maintenance visits are exclusive to active AMC plan members. Subscribe to a plan or use My Mechanic for ₹0 free diagnosis.',
        isGuestGate: false,
      });
      setShowGateModal(true);
      return false;
    }
    return true;
  };

  const goHome = () => {
    if (onNavigate) {
      try {
        onNavigate('HOME');
        onNavigate('/user/home');
      } catch (e) {}
    }
    if (navigate) {
      try {
        navigate('/user/home');
        return;
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/user/home';
    }
  };

  const openBookingForCategory = (cat) => {
    if (!checkCanBookComplaint()) return;
    const payload = {
      state: {
        preSelectedCategory: cat?.name,
        bookingMode: isConsultation ? 'consultation' : 'complaint',
      },
    };
    if (navigate) navigate('/user/bookings/new', payload);
    else if (onNavigate) onNavigate('/user/bookings/new', payload);
  };

  const openBookingForService = (item) => {
    if (!checkCanBookComplaint()) return;
    const payload = {
      state: {
        preSelectedCategory: item.category_name,
        preSelectedSubCategory: item.sub_category_name || item.name,
        preSelectedService: item.name,
        bookingMode: isConsultation ? 'consultation' : 'complaint',
      },
    };
    if (navigate) navigate('/user/bookings/new', payload);
    else if (onNavigate) onNavigate('/user/bookings/new', payload);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchAllServices(searchQuery, services).slice(0, 8);
  }, [searchQuery, services]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isDesktopWeb && styles.contentDesktop]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, isDesktopWeb && styles.headerDesktop]}>
        {isDesktopWeb ? (
          <TouchableOpacity
            style={styles.backPillDesktop}
            onPress={goHome}
            activeOpacity={0.75}
          >
            <Text style={styles.backPillDesktopText}>←  Back to Home</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={goHome}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0F1F3D"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: 'none' }}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </TouchableOpacity>
        )}

        <View style={styles.headerTextCol}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, isDesktopWeb && styles.titleDesktop]}>
              {isConsultation ? 'Book Free Consultation' : 'AMC Complaints & Repair'}
            </Text>
            {isConsultation && (
              <View style={styles.freeBadgePill}>
                <Text style={styles.freeBadgePillText}>₹0 FREE</Text>
              </View>
            )}
          </View>
          <Text style={[styles.subtitle, isDesktopWeb && styles.subtitleDesktop]}>
            {isConsultation
              ? 'Expert on-site inspection & diagnosis across all home appliances with zero visitation fee'
              : 'Report any appliance breakdown or maintenance issue under your active AMC protection plan'}
          </Text>
        </View>
      </View>

      {/* Urban Company Consultation Guarantee Hero Card */}
      {isConsultation ? (
        <View style={styles.trustCard}>
          <View style={styles.trustCardTop}>
            <View style={styles.trustIconBubble}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trustCardTitle}>Free Doorstep Diagnosis @ ₹0</Text>
              <Text style={styles.trustCardDesc}>
                Certified technician visits your location to inspect the exact issue. Upfront transparent quote provided before repair.
              </Text>
            </View>
          </View>

          <View style={styles.trustGrid}>
            <View style={styles.trustPill}>
              <Text style={styles.trustPillDot}>✓</Text>
              <Text style={styles.trustPillText}>₹0 Visitation Fee</Text>
            </View>
            <View style={styles.trustPill}>
              <Text style={styles.trustPillDot}>✓</Text>
              <Text style={styles.trustPillText}>Verified Technicians</Text>
            </View>
            <View style={styles.trustPill}>
              <Text style={styles.trustPillDot}>✓</Text>
              <Text style={styles.trustPillText}>Transparent Rate Card</Text>
            </View>
            <View style={styles.trustPill}>
              <Text style={styles.trustPillDot}>✓</Text>
              <Text style={styles.trustPillText}>No Obligation to Repair</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Warning banner when visiting Complaints without active AMC Plan */}
      {!isConsultation && !hasActiveAmc && (
        <View style={styles.planWarningBanner}>
          <View style={styles.planWarningLeft}>
            <View style={styles.planWarningIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.planWarningTitle}>Active AMC Plan Required to Raise Complaints</Text>
              <Text style={styles.planWarningSub}>
                Complaint tickets with ₹0 breakdown labor and free technician visits are reserved for AMC members. Non-subscribers can book free inspections via My Mechanic.
              </Text>
            </View>
          </View>
          <View style={styles.planWarningBtnRow}>
            <TouchableOpacity
              style={styles.planWarningBuyBtn}
              onPress={() => (navigate ? navigate('/user/plans') : onNavigate?.('/user/plans'))}
              activeOpacity={0.85}
            >
              <Text style={styles.planWarningBuyText}>View AMC Plans →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.planWarningMechanicBtn}
              onPress={() => (navigate ? navigate('/user/consultation') : onNavigate?.('/user/consultation'))}
              activeOpacity={0.85}
            >
              <Text style={styles.planWarningMechanicText}>Switch to My Mechanic (₹0 FREE)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <TextInput
          style={styles.searchInput}
          placeholder={
            isConsultation
              ? 'Search appliance or problem (e.g. AC, Fridge, Geyser)...'
              : 'Search service to raise complaint...'
          }
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.trim().length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Live Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.searchResultsCard}>
          <Text style={styles.searchResultsTitle}>Matching Services ({searchResults.length})</Text>
          {searchResults.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.searchResultRow}
              onPress={() => openBookingForService(item)}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.searchResultName}>{item.name}</Text>
                <Text style={styles.searchResultCat}>{item.category_name}</Text>
              </View>
              <View style={styles.bookFreeBtn}>
                <Text style={styles.bookFreeBtnText}>
                  {isConsultation ? 'Free Consult ›' : 'Raise ›'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Full Catalog Categories Section */}
      <View style={styles.sectionDivider}>
        <HomeExploreServices
          categories={categories}
          title={isConsultation ? 'Select Category for Free Consultation' : 'Select Category'}
          onSelectCategory={openBookingForCategory}
          isComplaint={true}
        />
        <View style={{ marginTop: 22, marginBottom: 12 }}>
          <LiveSupportOptionCard
            onPress={() => {
              if (navigate) navigate('/user/support');
              else if (onNavigate) onNavigate('/user/support');
            }}
            subtitle="Need assistance with an appliance issue or AMC service booking? Chat with our team"
          />
        </View>
      </View>

      {/* Gatekeeper Modal */}
      <Modal
        visible={showGateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.gateModalCard}>
            <TouchableOpacity
              style={styles.gateCloseBtn}
              onPress={() => setShowGateModal(false)}
              accessibilityLabel="Close modal"
            >
              <Text style={{ fontSize: 16, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>

            <View style={styles.gateIconCircle}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </View>

            <Text style={styles.gateModalTitle}>{gateContext.title}</Text>
            <Text style={styles.gateModalSub}>{gateContext.message}</Text>

            {gateContext.isGuestGate ? (
              <>
                <TouchableOpacity
                  style={styles.gatePrimaryBtn}
                  onPress={() => {
                    setShowGateModal(false);
                    if (navigate) navigate('/user/register');
                    else if (onNavigate) onNavigate('/user/register');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.gatePrimaryBtnText}>Register Account →</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.gateOutlineBtn}
                  onPress={() => {
                    setShowGateModal(false);
                    if (navigate) navigate('/user/login');
                    else if (onNavigate) onNavigate('/user/login');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.gateOutlineBtnText}>Sign In</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.gatePrimaryBtn}
                  onPress={() => {
                    setShowGateModal(false);
                    if (navigate) navigate('/user/plans');
                    else if (onNavigate) onNavigate('/user/plans');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.gatePrimaryBtnText}>Explore AMC Plans →</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.gateOutlineBtn}
                  onPress={() => {
                    setShowGateModal(false);
                    if (navigate) navigate('/user/consultation');
                    else if (onNavigate) onNavigate('/user/consultation');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.gateOutlineBtnText}>Book My Mechanic (₹0 Diagnosis)</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', width: '100%' },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 110, gap: 14, width: '100%', boxSizing: 'border-box' },
  contentDesktop: {
    maxWidth: 1320,
    paddingHorizontal: 0,
    paddingTop: 24,
    paddingBottom: 120,
    gap: 24,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 2,
  },
  headerDesktop: {
    paddingTop: 8,
    gap: 16,
    alignItems: 'center',
  },
  backPillDesktop: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    cursor: 'pointer',
  },
  backPillDesktopText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  titleDesktop: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitleDesktop: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
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
    cursor: 'pointer',
    zIndex: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    marginTop: 2,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  freeBadgePill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    alignSelf: 'center',
  },
  freeBadgePillText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 18,
  },
  trustCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
    gap: 12,
  },
  trustCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  trustIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  trustCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: "'Outfit', 'Inter', sans-serif",
  },
  trustCardDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
    marginTop: 3,
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  trustPillDot: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '900',
  },
  trustPillText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    outlineStyle: 'none',
    borderWidth: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  searchResultsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 8,
  },
  searchResultsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  searchResultCat: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  bookFreeBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bookFreeBtnText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionDivider: {
    marginTop: 6,
  },
  planWarningBanner: {
    backgroundColor: '#fffbeb',
    borderWidth: 1.2,
    borderColor: '#fde68a',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  planWarningLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  planWarningIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  planWarningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    lineHeight: 18,
  },
  planWarningSub: {
    fontSize: 12,
    color: '#b45309',
    lineHeight: 16,
    marginTop: 2,
  },
  planWarningBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  planWarningBuyBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  planWarningBuyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  planWarningMechanicBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  planWarningMechanicText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 99999,
  },
  gateModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: 14,
    position: 'relative',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
  },
  gateCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  gateIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  gateModalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  gatePrimaryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  gatePrimaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13.5,
  },
  gateOutlineBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateOutlineBtnText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 13,
  },
});

