import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import BookingProgress from './BookingProgress';
import LiveSupportOptionCard from './LiveSupportOptionCard';

export const DEFAULT_TIME_SLOTS = [
  '10:00 AM - 12:00 PM',
  '12:00 PM - 2:00 PM',
  '2:00 PM - 4:00 PM',
  '4:00 PM - 6:00 PM',
  '6:00 PM - 8:00 PM',
];

function buildDateOptions(count = 7) {
  const out = [];
  const now = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const dayNumber = d.getDate();
    const monthShort = d.toLocaleString('en-IN', { month: 'short' }).toUpperCase();
    const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase();
    const label =
      i === 0
        ? `Today, ${dayNumber} ${d.toLocaleString('en-IN', { month: 'short' })}`
        : i === 1
          ? `Tomorrow, ${dayNumber} ${d.toLocaleString('en-IN', { month: 'short' })}`
          : `${d.toLocaleDateString('en-IN', { weekday: 'short' })}, ${dayNumber} ${d.toLocaleString('en-IN', { month: 'short' })}`;
    const tag = i === 0 ? 'TODAY' : i === 1 ? 'TOMORROW' : dayName;
    out.push({ key, label, tag, dayNumber, monthShort, isToday: i === 0 });
  }
  return out;
}

export default function BookingScheduleStep({
  scheduledDate,
  scheduledTime,
  onChangeDate,
  onChangeTime,
  timeSlots = DEFAULT_TIME_SLOTS,
  onBack,
  onContinue,
  serviceLabel = 'Service',
  applianceSummary = '',
  isConsultation = false,
  onLiveSupport,
}) {
  const dates = useMemo(() => buildDateOptions(7), []);

  // Pre-select today if no date has been selected yet
  useEffect(() => {
    if (!scheduledDate && dates.length > 0) {
      onChangeDate?.(dates[0].key, dates[0].label);
    }
  }, [scheduledDate, dates, onChangeDate]);

  const selectedDateObj = useMemo(
    () => dates.find((d) => d.key === scheduledDate),
    [dates, scheduledDate]
  );

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {/* Top Header Row with Back Button & Progress Indicator */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <BookingProgress activeIndex={2} />
        </View>
      </View>

      {/* Page Title & Contextual Subtitle */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>
          {isConsultation ? 'Schedule Free Inspection' : 'Schedule Your Service'}
        </Text>
        <Text style={styles.subtitle}>
          {isConsultation
            ? 'Choose a convenient date & time slot for our certified expert to visit your doorstep.'
            : 'Select your preferred doorstep service appointment window.'}
        </Text>
      </View>

      {/* Premium Service & Free Inspection Status Card */}
      <View style={[styles.serviceCard, isConsultation && styles.serviceCardConsultation]}>
        <View style={styles.serviceCardTopRow}>
          <View style={styles.serviceIconWrap}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </View>
          <View style={{ flex: 1, minWidth: 0, paddingRight: 6 }}>
            <Text style={styles.serviceTitle} numberOfLines={2}>
              {serviceLabel}
            </Text>
            {!!applianceSummary && (
              <Text style={styles.serviceSub} numberOfLines={2}>
                {applianceSummary}
              </Text>
            )}
          </View>
          {isConsultation ? (
            <View style={styles.freeInspectionChip}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <Text style={styles.freeInspectionChipText}>₹0 Free Visit</Text>
            </View>
          ) : (
            <View style={styles.slaBadgeChip}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <Text style={styles.slaBadgeChipText}>Fast SLA</Text>
            </View>
          )}
        </View>

        <View style={styles.serviceCardDivider} />

        <View style={styles.serviceCardFooterRow}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 11 11 13 15 9" />
          </svg>
          <Text style={styles.serviceCardFooterText}>
            {isConsultation
              ? 'Thorough physical diagnosis • Transparent quote prior to any repair'
              : 'Senior verified technician dispatch • 100% genuine parts guarantee'}
          </Text>
        </View>
      </View>

      {/* SECTION: PREFERRED DATE */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderIconWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </View>
        <Text style={styles.sectionTitle}>Preferred Date</Text>
        {selectedDateObj && (
          <Text style={styles.sectionSelectedIndicator} numberOfLines={1}>
            {selectedDateObj.label}
          </Text>
        )}
      </View>

      {/* Modern 2-Line Calendar Cards Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateCardRow}
      >
        {dates.map((d) => {
          const isSelected = scheduledDate === d.key;
          return (
            <TouchableOpacity
              key={d.key}
              style={[
                styles.dateCard,
                isSelected && styles.dateCardActive,
                d.isToday && !isSelected && styles.dateCardToday,
              ]}
              onPress={() => onChangeDate?.(d.key, d.label)}
              activeOpacity={0.85}
            >
              <View style={[styles.dateCardTagWrap, isSelected && styles.dateCardTagWrapActive]}>
                <Text style={[styles.dateCardTagText, isSelected && styles.dateCardTagTextActive]}>
                  {d.tag}
                </Text>
              </View>

              <Text style={[styles.dateCardNumber, isSelected && styles.dateCardNumberActive]}>
                {d.dayNumber}
              </Text>

              <Text style={[styles.dateCardMonth, isSelected && styles.dateCardMonthActive]}>
                {d.monthShort}
              </Text>

              {d.isToday && (
                <View style={[styles.fastestIndicator, isSelected && styles.fastestIndicatorActive]}>
                  <View style={[styles.fastestDot, isSelected && styles.fastestDotActive]} />
                  <Text style={[styles.fastestText, isSelected && styles.fastestTextActive]}>
                    Fastest
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* SECTION: PREFERRED TIME SLOT */}
      <View style={[styles.sectionHeaderRow, { marginTop: 8 }]}>
        <View style={styles.sectionHeaderIconWrap}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </View>
        <Text style={styles.sectionTitle}>Preferred Time Slot</Text>
        {scheduledTime ? (
          <Text style={styles.sectionSelectedIndicator} numberOfLines={1}>
            {scheduledTime}
          </Text>
        ) : null}
      </View>

      {/* Clean 2-Column Responsive Time Slot Cards (No emojis, real SVGs) */}
      <View style={styles.slotGrid}>
        {timeSlots.map((slot, index) => {
          const isSelected = scheduledTime === slot;
          return (
            <TouchableOpacity
              key={slot}
              style={[
                styles.slotCard,
                isSelected && styles.slotCardActive,
              ]}
              onPress={() => onChangeTime?.(slot)}
              activeOpacity={0.85}
            >
              <View style={styles.slotCardLeft}>
                <View style={[styles.slotIconBox, isSelected && styles.slotIconBoxActive]}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={isSelected ? '#2563eb' : '#64748b'}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.slotTimeText, isSelected && styles.slotTimeTextActive]}>
                    {slot}
                  </Text>
                  <Text style={styles.slotPeriodText}>
                    {index === 0
                      ? 'Morning window'
                      : index <= 2
                        ? 'Afternoon window'
                        : 'Evening window'}
                  </Text>
                </View>
              </View>

              <View style={[styles.slotRadioCircle, isSelected && styles.slotRadioCircleActive]}>
                {isSelected && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Real-Icon Quality & Reassurance Strip */}
      <View style={styles.trustStrip}>
        <View style={styles.trustItem}>
          <View style={styles.trustIconCircle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 11 11 13 15 9" />
            </svg>
          </View>
          <Text style={styles.trustText}>Certified Expert</Text>
        </View>

        <View style={styles.trustDivider} />

        <View style={styles.trustItem}>
          <View style={styles.trustIconCircle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </View>
          <Text style={styles.trustText}>Free Reschedule</Text>
        </View>

        <View style={styles.trustDivider} />

        <View style={styles.trustItem}>
          <View style={styles.trustIconCircle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
          </View>
          <Text style={styles.trustText}>Live Tracking</Text>
        </View>
      </View>

      {/* Selection Summary Pill (Shown when both Date & Time are chosen) */}
      {Boolean(scheduledDate && scheduledTime) && (
        <View style={styles.selectionSummaryBanner}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <polyline points="9 15 11 17 15 13" />
          </svg>
          <Text style={styles.selectionSummaryText} numberOfLines={1}>
            <Text style={{ fontWeight: '700', color: '#0f172a' }}>Appointment: </Text>
            {selectedDateObj?.label || scheduledDate} • {scheduledTime}
          </Text>
        </View>
      )}

      {/* Primary Action Button */}
      <TouchableOpacity
        style={[
          styles.primaryBtn,
          (!scheduledDate || !scheduledTime) && styles.primaryBtnDisabled,
        ]}
        disabled={!scheduledDate || !scheduledTime}
        onPress={onContinue}
        activeOpacity={0.88}
      >
        <Text style={[styles.primaryBtnText, (!scheduledDate || !scheduledTime) && styles.primaryBtnTextDisabled]}>
          Proceed to Location
        </Text>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={(!scheduledDate || !scheduledTime) ? '#94a3b8' : '#ffffff'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </TouchableOpacity>

      {/* 24/7 Priority Support */}
      {onLiveSupport && (
        <View style={{ marginTop: 6 }}>
          <LiveSupportOptionCard onPress={onLiveSupport} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
    paddingBottom: 48,
    gap: 12,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    boxSizing: 'border-box',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  titleSection: {
    gap: 3,
    marginTop: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },

  // Service Card
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    gap: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  serviceCardConsultation: {
    borderColor: '#bfdbfe',
    backgroundColor: '#ffffff',
  },
  serviceCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  serviceIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 17,
  },
  serviceSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
  freeInspectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
    flexShrink: 0,
  },
  freeInspectionChipText: {
    color: '#15803d',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  slaBadgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
    flexShrink: 0,
  },
  slaBadgeChipText: {
    color: '#1d4ed8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  serviceCardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  serviceCardFooterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  serviceCardFooterText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 16,
    flex: 1,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sectionHeaderIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSelectedIndicator: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '700',
    marginLeft: 'auto',
  },

  // Date Cards
  dateCardRow: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 1,
  },
  dateCard: {
    width: 76,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    gap: 3,
    cursor: 'pointer',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  dateCardToday: {
    borderColor: '#bfdbfe',
    backgroundColor: '#f8fafc',
  },
  dateCardActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  dateCardTagWrap: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: '#f1f5f9',
  },
  dateCardTagWrapActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dateCardTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.3,
  },
  dateCardTagTextActive: {
    color: '#ffffff',
  },
  dateCardNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 24,
  },
  dateCardNumberActive: {
    color: '#ffffff',
  },
  dateCardMonth: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  dateCardMonthActive: {
    color: '#dbeafe',
  },
  fastestIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  fastestIndicatorActive: {
    opacity: 0.95,
  },
  fastestDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16a34a',
  },
  fastestDotActive: {
    backgroundColor: '#86efac',
  },
  fastestText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#16a34a',
  },
  fastestTextActive: {
    color: '#dcfce7',
  },

  // Slot Grid (2 Columns)
  slotGrid: {
    gap: 8,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  slotCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  slotCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  slotIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  slotIconBoxActive: {
    backgroundColor: '#ffffff',
    borderColor: '#bfdbfe',
  },
  slotTimeText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  slotTimeTextActive: {
    color: '#1d4ed8',
  },
  slotPeriodText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 1,
  },
  slotRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 8,
  },
  slotRadioCircleActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },

  // Trust Strip
  trustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  trustDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#e2e8f0',
  },

  // Selection Summary
  selectionSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  selectionSummaryText: {
    fontSize: 12.5,
    color: '#1e40af',
    fontWeight: '500',
    flex: 1,
  },

  // Primary Button
  primaryBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
    cursor: 'not-allowed',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  primaryBtnTextDisabled: {
    color: '#94a3b8',
  },
});
