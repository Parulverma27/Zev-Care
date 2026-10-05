import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigate } from 'react-router-dom';

export default function TermsAndConditionsScreen() {
  const navigate = useNavigate();

  const SECTIONS = [
    {
      title: '1. Acceptance of Terms',
      body: 'By accessing or using Zevota Care\'s platform, mobile application, or services, you confirm that you have read, understood, and agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree to these terms, you must not use our services.',
    },
    {
      title: '2. Services Description',
      body: 'Zevota Care is a home services platform that connects registered property owners and tenants with verified service professionals ("Technicians") for repairs, maintenance, and related home services including Electrician, Plumbing, Carpentry, Appliance Repair, Dry Cleaning, and Pest Control services.',
    },
    {
      title: '3. User Eligibility',
      body: 'You must be at least 18 years of age and a legal resident of India to register and use this platform. By registering, you represent and warrant that all information provided is accurate, current, and complete.',
    },
    {
      title: '4. Service Wallet & Subscription Plans',
      body: 'Prepaid wallet credits purchased through subscription plans are non-refundable except as required by applicable law. Wallet balances are valid for the duration of the subscription period. Credits are non-transferable between accounts.',
    },
    {
      title: '5. Bookings & Cancellations',
      body: 'Bookings can be cancelled up to 2 hours before the scheduled technician arrival for a full wallet credit refund. Cancellations within 2 hours of arrival will attract a convenience fee of ₹99 deducted from your wallet balance. No-shows by users will result in a full service charge.',
    },
    {
      title: '6. Service Guarantees',
      body: 'All work performed by Zevota Care technicians is covered by a 30-day service warranty for the same issue. If the same problem recurs within 30 days of a completed service, Zevota Care will re-dispatch a technician at no additional charge.',
    },
    {
      title: '7. Evidence & Documentation',
      body: 'For quality and safety assurance, users may be required to capture live photos or videos of the issue using the in-app camera at the time of booking. Gallery uploads are not permitted for issue evidence to ensure authenticity.',
    },
    {
      title: '8. Privacy & Data',
      body: 'Zevota Care collects your name, phone number, email, address, and booking information for the purpose of providing and improving our services. We do not sell your personal data to third parties. Data is stored securely and in compliance with applicable Indian data protection laws.',
    },
    {
      title: '9. Payments',
      body: 'All payments are processed through Razorpay, a secure PCI-DSS compliant payment gateway. Zevota Care does not store card or bank details. By initiating a payment, you agree to Razorpay\'s terms of service in addition to these terms.',
    },
    {
      title: '10. Limitation of Liability',
      body: 'Zevota Care acts as an intermediary platform and is not liable for any damages caused by technician errors, delays, or third-party service failures beyond the agreed service guarantee. Our maximum liability in any event shall be limited to the amount paid for the specific service in question.',
    },
    {
      title: '11. Dispute Resolution',
      body: 'Any disputes arising from use of this platform shall first be attempted to be resolved through our in-app support channel. Unresolved disputes shall be subject to arbitration under the Arbitration and Conciliation Act, 1996, with proceedings in Mumbai, Maharashtra.',
    },
    {
      title: '12. Changes to Terms',
      body: 'Zevota Care reserves the right to modify these Terms & Conditions at any time. Continued use of the platform following notification of changes constitutes acceptance of the revised terms. Last updated: September 2026.',
    },
  ];

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
          <Text style={styles.heroTitle}>Zevota Care Platform</Text>
          <Text style={styles.heroSubtitle}>Terms & Conditions &amp; User Agreement</Text>
          <Text style={styles.heroMeta}>Last Updated: September 2026 • India</Text>
        </View>
      </View>

      {/* Intro Note */}
      <View style={styles.introCard}>
        <Text style={styles.introText}>
          Please read these terms carefully before using Zevota Care. By creating an account or placing a service booking, you acknowledge that you have read and agree to the following terms.
        </Text>
      </View>

      {/* Sections */}
      {SECTIONS.map((section, idx) => (
        <View key={idx} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
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
  content: { padding: 16, gap: 12 },

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
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionBody: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
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
