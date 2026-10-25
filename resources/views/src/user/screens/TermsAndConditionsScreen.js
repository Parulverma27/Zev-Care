import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { ZEVOTA_COMPANY_NAME, ZEVOTA_TERMS_AND_CONDITIONS } from '../../config/termsAndConditions';

export default function TermsAndConditionsScreen() {
  const navigate = useNavigate();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigate(-1)} activeOpacity={0.7}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F1F3D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms &amp; Conditions</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroIconCircle}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>{ZEVOTA_COMPANY_NAME}</Text>
          <Text style={styles.heroSubtitle}>Annual Maintenance Contract (AMC) Terms &amp; Conditions</Text>
          <Text style={styles.heroMeta}>Official Service Policy • Effective 2026 • India</Text>
        </View>
      </View>

      {/* Intro Note */}
      <View style={styles.introCard}>
        <Text style={styles.introText}>
          Please read these terms and conditions carefully before subscribing to an Annual Maintenance Plan or booking home services with <Text style={{ fontWeight: '700' }}>{ZEVOTA_COMPANY_NAME}</Text>. By purchasing a service plan or creating an account, you confirm your acceptance of all 15 clauses detailed below.
        </Text>
      </View>

      {/* Sections */}
      {ZEVOTA_TERMS_AND_CONDITIONS.map((section) => (
        <View key={section.id} style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.clauseBadge}>
              <Text style={styles.clauseBadgeText}>{section.clauseNumber}</Text>
            </View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}

      {/* Contact */}
      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Questions about these Terms?</Text>
        <Text style={styles.contactText}>
          Contact our legal team at{' '}
          <Text style={styles.contactLink}>legal@zevotacare.com</Text>
          {' '}or call our support line at{' '}
          <Text style={styles.contactLink}>1800-ZEVOTA</Text>.
        </Text>
      </View>

      {/* Accept & Go Back CTA */}
      <TouchableOpacity style={styles.acceptBtn} onPress={() => navigate(-1)} activeOpacity={0.85}>
        <Text style={styles.acceptBtnText}>I Understand — Go Back</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F7FF' },
  content: {
    padding: 24,
    paddingBottom: 48,
    gap: 14,
    maxWidth: 840,
    width: '100%',
    alignSelf: 'center',
    boxSizing: 'border-box',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#D7E3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F1F3D',
  },

  heroBanner: {
    backgroundColor: '#1e3a8a',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroTitle: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
  heroSubtitle: { fontSize: 12, color: '#93c5fd', marginTop: 2 },
  heroMeta: { fontSize: 11, color: '#60a5fa', marginTop: 4 },

  introCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  introText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 20,
    fontWeight: '500',
  },

  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clauseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  clauseBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  sectionBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 21,
    whiteSpace: 'pre-line',
  },

  contactCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 6,
  },
  contactTitle: { fontSize: 13, fontWeight: '700', color: '#166534' },
  contactText: { fontSize: 12, color: '#166534', lineHeight: 18 },
  contactLink: { fontWeight: '700', color: '#15803d' },

  acceptBtn: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
