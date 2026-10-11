import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { searchAllServices } from '../../config/serviceCatalogUtils';
import HomeExploreServices from './HomeExploreServices';

export default function ServiceBrowseScreen({ onNavigate }) {
  const { categories, services } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const isConsultation = (location.pathname || '').includes('consultation');
  const [searchQuery, setSearchQuery] = useState('');

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
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

        <View style={styles.headerTextCol}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {isConsultation ? 'Book Free Consultation' : 'AMC Complaints & Repair'}
            </Text>
            {isConsultation && (
              <View style={styles.freeBadgePill}>
                <Text style={styles.freeBadgePillText}>₹0 FREE</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>
            {isConsultation
              ? 'Expert on-site inspection & diagnosis across all services'
              : 'Report any appliance breakdown or maintenance issue'}
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', width: '100%' },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 110, gap: 14, width: '100%', boxSizing: 'border-box' },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 2,
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
});

