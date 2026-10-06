import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';

export default function BookingConfirmation({
  booking,
  onViewBooking,
  onGoHome,
}) {
  const [copied, setCopied] = useState(false);

  if (!booking) return null;
  const id = booking.booking_id || booking.id || 'BK-2026-000000';
  const service = booking.service_name || booking.service || 'Service';
  const date = booking.scheduledDate || booking.scheduled_date || booking.schedule || '—';
  const time = booking.scheduledTime || booking.scheduled_time || '';
  const address = booking.address_text || booking.address || '—';
  const isConsultation = !!booking.isConsultation;

  const handleCopyId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(String(id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Interactive Animated Success Badge with Ripple Rings & Confetti */}
      <View style={styles.heroWrapper}>
        <div className="zevota-success-hero">
          <div className="zevota-ripple-1" />
          <div className="zevota-ripple-2" />
          <div className="zevota-confetti-dot zevota-confetti-1" />
          <div className="zevota-confetti-dot zevota-confetti-2" />
          <div className="zevota-confetti-dot zevota-confetti-3" />
          <div className="zevota-confetti-dot zevota-confetti-4" />
          <div className="zevota-confetti-dot zevota-confetti-5" />

          <div className="zevota-badge-core">
            <svg
              className="zevota-check-svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Status Pill Badge */}
        <div className="zevota-fade-up-1">
          <View style={styles.verifiedPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.verifiedPillText}>
              {isConsultation ? 'FREE CONSULTATION SECURED' : 'ORDER CONFIRMED & QUEUED'}
            </Text>
          </View>
        </div>

        <div className="zevota-fade-up-1">
          <Text style={styles.title}>
            {isConsultation ? 'Consultation Confirmed' : 'Booking Confirmed'}
          </Text>
          <Text style={styles.subtitle}>
            {isConsultation
              ? `Your complimentary ${service} visit is booked. An expert will visit without any upfront AMC fee.`
              : `Your ${service} request has been confirmed. A technician is being assigned.`}
          </Text>
        </div>
      </View>

      {/* Interactive Booking ID Card with Click-to-Copy */}
      <div className="zevota-fade-up-2" style={{ width: '100%' }}>
        <TouchableOpacity
          style={styles.idCard}
          onPress={handleCopyId}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.idLabel}>BOOKING REFERENCE NUMBER</Text>
            <Text style={styles.idValue}>{id}</Text>
          </View>
          <View style={[styles.copyBtn, copied && styles.copyBtnSuccess]}>
            {copied ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <Text style={styles.copyBtnTextSuccess}>Copied!</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                <Text style={styles.copyBtnText}>Copy ID</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </div>

      {/* Interactive "What Happens Next?" Live Lifecycle Tracker */}
      <div className="zevota-fade-up-2" style={{ width: '100%' }}>
        <View style={styles.lifecycleCard}>
          <Text style={styles.lifecycleTitle}>WHAT HAPPENS NEXT</Text>
          
          <View style={styles.stepRow}>
            <View style={styles.stepIconCompleted}>
              <Text style={styles.stepIconText}>✓</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepHeadingCompleted}>Booking Logged</Text>
              <Text style={styles.stepSub}>Your service request is confirmed in our operations portal.</Text>
            </View>
          </View>

          <View style={styles.stepConnector} />

          <View style={styles.stepRow}>
            <View style={styles.stepIconActive}>
              <View style={styles.activeDot} />
            </View>
            <View style={styles.stepInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.stepHeadingActive}>Technician Assignment</Text>
                <View style={styles.liveTag}>
                  <Text style={styles.liveTagText}>IN PROGRESS</Text>
                </View>
              </View>
              <Text style={styles.stepSub}>Dispatching the nearest verified technician to your area.</Text>
            </View>
          </View>

          <View style={styles.stepConnector} />

          <View style={styles.stepRow}>
            <View style={styles.stepIconUpcoming}>
              <Text style={styles.stepIconUpcomingText}>3</Text>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepHeadingUpcoming}>Doorstep Inspection & Billing</Text>
              <Text style={styles.stepSub}>Technician inspects on-site first. Official bill is generated after diagnosis.</Text>
            </View>
          </View>
        </View>
      </div>

      {/* Booking Summary Card */}
      <div className="zevota-fade-up-3" style={{ width: '100%' }}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardHeader}>WORK ORDER SPECIFICATIONS</Text>

          <View style={styles.specItem}>
            <View style={styles.specIconBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.specLabel}>Service Requested</Text>
              <Text style={styles.specValue}>{service}</Text>
            </View>
          </View>

          <View style={styles.specDivider} />

          <View style={styles.specItem}>
            <View style={styles.specIconBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.specLabel}>Scheduled Date & Window</Text>
              <Text style={styles.specValue}>{date} {time ? `• ${time}` : ''}</Text>
            </View>
          </View>

          <View style={styles.specDivider} />

          <View style={styles.specItem}>
            <View style={styles.specIconBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.specLabel}>Service Location</Text>
              <Text style={styles.specValue}>{address}</Text>
            </View>
          </View>

          {!!booking.applianceName && (
            <>
              <View style={styles.specDivider} />
              <View style={styles.specItem}>
                <View style={styles.specIconBox}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="16" height="20" x="4" y="2" rx="2" />
                    <line x1="4" x2="20" y1="8" y2="8" />
                    <circle cx="12" cy="14" r="2" />
                  </svg>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.specLabel}>Appliance</Text>
                  <Text style={styles.specValue}>{booking.applianceName}</Text>
                </View>
              </View>
            </>
          )}

          {!!(booking.issue || booking.issue_description) && (
            <>
              <View style={styles.specDivider} />
              <View style={styles.specItem}>
                <View style={styles.specIconBox}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.specLabel}>Reported Issue</Text>
                  <Text style={styles.specValue}>{booking.issue || booking.issue_description}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </div>

      {/* Action Buttons */}
      <div className="zevota-fade-up-4" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onViewBooking} activeOpacity={0.88}>
          <Text style={styles.primaryBtnText}>Track Live Booking</Text>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={onGoHome} activeOpacity={0.88}>
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </div>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 16,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    boxSizing: 'border-box',
  },
  heroWrapper: {
    width: '100%',
    alignItems: 'center',
    textAlign: 'center',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
  },
  verifiedPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#1d4ed8',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 380,
  },
  idCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#dbeafe',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.06)',
  },
  idLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  idValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2563eb',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  copyBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  copyBtnSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  copyBtnTextSuccess: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  lifecycleCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
  },
  lifecycleTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepConnector: {
    width: 2,
    height: 18,
    backgroundColor: '#cbd5e1',
    marginLeft: 15,
    marginVertical: 2,
  },
  stepIconCompleted: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepIconText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  stepIconActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  stepIconUpcoming: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepIconUpcomingText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  stepInfo: {
    flex: 1,
    gap: 2,
  },
  stepHeadingCompleted: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  stepHeadingActive: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  stepHeadingUpcoming: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748b',
  },
  stepSub: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 16,
  },
  liveTag: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  liveTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1e40af',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
  },
  summaryCardHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  specIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  specLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  specValue: {
    fontSize: 13.5,
    color: '#0f172a',
    fontWeight: '700',
    marginTop: 1,
  },
  specDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15.5,
  },
  secondaryBtn: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  secondaryBtnText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 14.5,
  },
});
