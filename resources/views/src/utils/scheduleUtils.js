/**
 * Schedule & Timetable Utilities for Zevota-Care Field Partners
 */

export const CATEGORY_DURATION_HOURS = {
  Electrician: 1.5,
  Plumbing: 2.0,
  Carpentry: 3.0,
  'Pest Control': 2.0,
  'Dry Cleaning': 2.5,
};

/**
 * Normalizes any category string into one of the 5 platform verticals
 */
export const normalizeCategoryName = (catStr) => {
  if (!catStr) return 'Electrician';
  const s = String(catStr).toLowerCase();
  if (s.includes('electr')) return 'Electrician';
  if (s.includes('plumb')) return 'Plumbing';
  if (s.includes('pest')) return 'Pest Control';
  if (s.includes('clean') || s.includes('dry')) return 'Dry Cleaning';
  if (s.includes('carpent') || s.includes('wood')) return 'Carpentry';
  return 'Electrician';
};

/**
 * Returns the canonical platform category for a provider
 */
export const getProviderCanonicalCategory = (provider) => {
  if (!provider) return 'Electrician';
  if (provider.category) {
    const c = normalizeCategoryName(provider.category);
    if (c) return c;
  }
  if (provider.trade) {
    const c = normalizeCategoryName(provider.trade);
    if (c) return c;
  }
  let cats = Array.isArray(provider.categories) ? provider.categories : [];
  if (cats.length === 0 && provider.categories_json) {
    try {
      const p = JSON.parse(provider.categories_json);
      if (Array.isArray(p)) cats = p;
    } catch (e) {}
  }
  for (const c of cats) {
    const norm = normalizeCategoryName(c);
    if (norm) return norm;
  }
  let svcs = Array.isArray(provider.services) ? provider.services : [];
  if (svcs.length === 0 && provider.services_json) {
    try {
      const p = JSON.parse(provider.services_json);
      if (Array.isArray(p)) svcs = p;
    } catch (e) {}
  }
  for (const s of svcs) {
    const norm = normalizeCategoryName(s);
    if (norm) return norm;
  }
  return 'Electrician';
};

/**
 * Parses time string like "2:30 PM" or "10:00 AM" into 24-hr decimal hour (e.g. 14.5)
 */
export const parseTimeToDecimal = (timeStr) => {
  if (!timeStr) return 10.0; // default 10 AM
  const cleaned = String(timeStr).trim().toUpperCase();
  const match = cleaned.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return 10.0;

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const modifier = match[3];

  if (modifier === 'PM' && hour < 12) hour += 12;
  if (modifier === 'AM' && hour === 12) hour = 0;

  return hour + minute / 60;
};

/**
 * Formats decimal hour (e.g. 14.5) to "02:30 PM"
 */
export const formatDecimalToTime = (dec) => {
  const h = Math.floor(dec);
  const m = Math.round((dec - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m === 0 ? '00' : String(m).padStart(2, '0');
  return `${displayH}:${displayM} ${period}`;
};

/**
 * Formats a Date object as YYYY-MM-DD
 */
export const formatDateKey = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Extracts date key and decimal time range from a booking's scheduled_date
 */
export const extractBookingTimeRange = (booking) => {
  if (!booking) return null;

  const raw = String(booking.scheduled_date || booking.date || '').trim();
  const todayKey = formatDateKey(new Date());

  // Date determination
  let dateKey = todayKey;
  if (raw.toLowerCase().includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateKey = formatDateKey(tomorrow);
  } else {
    // Check for explicit YYYY-MM-DD or DD/MM/YYYY
    const isoMatch = raw.match(/\d{4}-\d{2}-\d{2}/);
    if (isoMatch) {
      dateKey = isoMatch[0];
    }
  }

  // Time determination
  const startHour = parseTimeToDecimal(raw);
  const cat = normalizeCategoryName(booking.category_name || booking.category || booking.service_name);
  const duration = CATEGORY_DURATION_HOURS[cat] || 1.5;
  const endHour = startHour + duration;

  return {
    dateKey,
    startHour,
    endHour,
    duration,
    timeLabel: `${formatDecimalToTime(startHour)} - ${formatDecimalToTime(endHour)}`,
  };
};

/**
 * Checks whether a provider is free or busy for a target booking
 */
export const checkProviderAvailability = (provider, targetBooking, allBookings = []) => {
  if (!provider) return { isAvailable: false, statusLabel: 'OFFLINE', statusMessage: 'No provider selected' };

  const provIdStr = String(provider.id || '');
  const provPhone = (provider.phone || '').replace(/\D/g, '').slice(-10);

  // If provider is marked offline
  if (provider.is_online === false) {
    return {
      isAvailable: false,
      statusLabel: 'OFFLINE',
      statusMessage: 'Partner is currently off-duty',
      isOffline: true,
    };
  }

  const targetRange = extractBookingTimeRange(targetBooking);
  if (!targetRange) {
    return {
      isAvailable: true,
      statusLabel: 'FREE',
      statusMessage: 'Available for immediate dispatch',
    };
  }

  // Find all active bookings for this provider on the target date
  const providerActiveBookings = (allBookings || []).filter((b) => {
    // Exclude the current target booking itself
    if (targetBooking?.id != null && b.id === targetBooking.id) return false;
    if (targetBooking?.booking_id && b.booking_id === targetBooking.booking_id) return false;

    // Check if assigned to this provider
    const isThisProv =
      (b.provider_id != null && String(b.provider_id) === provIdStr) ||
      (b.provider_phone && b.provider_phone.replace(/\D/g, '').slice(-10) === provPhone);

    if (!isThisProv) return false;

    // Only consider pending or active in-progress bookings (not completed or cancelled)
    const activeStatuses = [
      'PROVIDER_ASSIGNED',
      'PROVIDER_ACCEPTED',
      'PROVIDER_ON_THE_WAY',
      'PROVIDER_ARRIVED',
      'SERVICE_IN_PROGRESS',
      'ISSUE_INSPECTED',
      'INSPECTION_COMPLETED',
      'CONFIRMED',
    ];
    return activeStatuses.includes(b.status);
  });

  // Check for time overlap on the same date
  for (const b of providerActiveBookings) {
    const range = extractBookingTimeRange(b);
    if (range && range.dateKey === targetRange.dateKey) {
      // Overlap condition: startA < endB && endA > startB
      const isOverlap = targetRange.startHour < range.endHour && targetRange.endHour > range.startHour;
      if (isOverlap) {
        return {
          isAvailable: false,
          conflictBooking: b,
          statusLabel: 'BUSY',
          statusMessage: `Occupied on ${b.booking_id || 'booking'} until ${formatDecimalToTime(range.endHour)}`,
          timeRange: range,
        };
      }
    }
  }

  return {
    isAvailable: true,
    statusLabel: 'FREE',
    statusMessage: `Free at ${formatDecimalToTime(targetRange.startHour)} (${providerActiveBookings.length} other jobs today)`,
    otherJobsTodayCount: providerActiveBookings.length,
  };
};

/**
 * Builds a daily timetable (8:00 AM to 8:00 PM) for a provider
 */
export const getProviderDailyTimetable = (provider, dateKey, allBookings = []) => {
  if (!provider) return { slots: [], bookedCount: 0, totalHours: 0 };

  const provIdStr = String(provider.id || '');
  const provPhone = (provider.phone || '').replace(/\D/g, '').slice(-10);

  // Relevant active bookings for this date
  const dayBookings = (allBookings || []).filter((b) => {
    const isThisProv =
      (b.provider_id != null && String(b.provider_id) === provIdStr) ||
      (b.provider_phone && b.provider_phone.replace(/\D/g, '').slice(-10) === provPhone);

    if (!isThisProv) return false;

    const range = extractBookingTimeRange(b);
    return range && range.dateKey === dateKey;
  });

  // Hours: 8 AM to 8 PM (12 hours)
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

  const slots = hours.map((hour) => {
    const slotStart = hour;
    const slotEnd = hour + 1;
    const timeLabel = formatDecimalToTime(hour);

    // Find any booking that covers this slot
    const matchingBooking = dayBookings.find((b) => {
      const range = extractBookingTimeRange(b);
      if (!range) return false;
      return range.startHour < slotEnd && range.endHour > slotStart;
    });

    if (matchingBooking) {
      const range = extractBookingTimeRange(matchingBooking);
      return {
        hour,
        timeLabel,
        isBooked: true,
        booking: matchingBooking,
        timeRange: range,
      };
    }

    return {
      hour,
      timeLabel,
      isBooked: false,
      booking: null,
    };
  });

  const totalHours = dayBookings.reduce((sum, b) => {
    const range = extractBookingTimeRange(b);
    return sum + (range?.duration || 1.5);
  }, 0);

  return {
    slots,
    dayBookings,
    bookedCount: dayBookings.length,
    totalHours,
  };
};
