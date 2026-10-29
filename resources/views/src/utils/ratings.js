/**
 * Pure helper utilities for Dual Rating System (Service + Service Provider).
 * Fully independent of UI rendering.
 */

import { PERFORMANCE_TIERS, PROVIDER_ATTRIBUTES } from '../config/ratingConfig';

/**
 * Normalizes legacy booking ratings into dual service_review + provider_review structure.
 * Safe to call on any booking object.
 */
export function normalizeBookingReviews(booking) {
  if (!booking) return booking;

  let serviceReview = booking.service_review || null;
  let providerReview = booking.provider_review || null;

  // Synthesize from legacy user_rating if missing
  if (!serviceReview && !providerReview && Number(booking.user_rating) > 0) {
    const legacyRating = Number(booking.user_rating);
    const legacyFeedback = booking.user_feedback || booking.user_review || '';
    const legacyTags = Array.isArray(booking.feedback_tags) ? booking.feedback_tags : [];
    const legacyResolved = booking.issue_resolved || 'yes';
    const legacyPhotos = Array.isArray(booking.rating_photos) ? booking.rating_photos : [];
    const legacyDate = booking.rating_submitted_at || booking.completed_date || new Date().toISOString();

    serviceReview = {
      rating: legacyRating,
      issue_resolved: legacyResolved,
      aspects: legacyTags,
      comment: legacyFeedback,
      photos: legacyPhotos,
      submitted_at: legacyDate,
      moderation: { hidden: false, flagged: false, admin_note: '' },
    };

    providerReview = {
      provider_id: booking.provider_id || null,
      provider_name: booking.provider_name || 'Assigned Technician',
      rating: legacyRating,
      attributes: {
        punctuality: legacyRating,
        professionalism: legacyRating,
        skill: legacyRating,
        cleanliness: legacyRating,
        communication: legacyRating,
      },
      compliments: legacyRating >= 4 ? ['Courteous & Respectful', 'Expert Craftsperson'] : [],
      comment: legacyFeedback,
      submitted_at: legacyDate,
      moderation: { hidden: false, flagged: false, admin_note: '' },
    };
  }

  // Derive rating status
  let ratingStatus = booking.rating_status;
  if (!ratingStatus) {
    if (booking.rating_skipped) {
      ratingStatus = 'skipped';
    } else if (serviceReview && providerReview) {
      ratingStatus = 'completed';
    } else if (serviceReview && !providerReview) {
      ratingStatus = 'service_done';
    } else if (booking.status === 'BOOKING_COMPLETED') {
      ratingStatus = 'pending';
    } else {
      ratingStatus = 'not_ready';
    }
  }

  return {
    ...booking,
    service_review: serviceReview,
    provider_review: providerReview,
    rating_status: ratingStatus,
  };
}

/**
 * Clean phone helper
 */
function cleanPhone(p) {
  return p ? String(p).replace(/\D/g, '').slice(-10) : '';
}

/**
 * Checks if a booking belongs to a given provider
 */
export function isBookingForProvider(booking, provider) {
  if (!booking || !provider) return false;
  if (provider.id != null && booking.provider_id != null && String(provider.id) === String(booking.provider_id)) {
    return true;
  }
  const pPhone = cleanPhone(provider.phone);
  if (pPhone && booking.provider_phone && cleanPhone(booking.provider_phone) === pPhone) {
    return true;
  }
  const pName = (provider.name || '').trim().toLowerCase();
  if (pName && booking.provider_name && booking.provider_name.trim().toLowerCase() === pName) {
    return true;
  }
  return false;
}

/**
 * Compute aggregate ratings, attribute breakdown, and trend for a provider.
 */
export function getProviderRatingStats(provider, allBookings = []) {
  if (!provider) {
    return {
      totalRatings: 0,
      averageRating: 0,
      starCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      starPercents: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      lowRatingCount: 0,
      lowRatingPercent: 0,
      attributeAverages: {},
      complimentsCount: {},
      trend30Days: 0,
      recentReviews: [],
    };
  }

  const provBookings = allBookings
    .filter((b) => isBookingForProvider(b, provider))
    .map(normalizeBookingReviews);

  const validReviews = [];
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  provBookings.forEach((b) => {
    const rev = b.provider_review;
    if (!rev) return;
    if (rev.moderation?.hidden) return; // Hidden by admin moderation
    const stars = Number(rev.rating);
    if (!stars || stars < 1 || stars > 5) return;

    validReviews.push({
      bookingId: b.booking_id,
      serviceName: b.service_name || 'Home Service',
      userName: b.user_name || 'Verified Customer',
      userPhone: b.user_phone,
      rating: stars,
      attributes: rev.attributes || {},
      compliments: Array.isArray(rev.compliments) ? rev.compliments : [],
      comment: rev.comment || '',
      submittedAt: rev.submitted_at || b.completed_date || b.updated_at,
      moderation: rev.moderation || { hidden: false, flagged: false, admin_note: '' },
    });
  });

  const totalRatings = validReviews.length;
  const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;
  let lowRatingCount = 0;

  const attrSums = {};
  const attrCounts = {};
  PROVIDER_ATTRIBUTES.forEach((attr) => {
    attrSums[attr.key] = 0;
    attrCounts[attr.key] = 0;
  });

  const complimentsCount = {};

  let sumRecent30 = 0;
  let countRecent30 = 0;
  let sumPrior30 = 0;
  let countPrior30 = 0;

  validReviews.forEach((rev) => {
    const r = Math.min(5, Math.max(1, Math.round(rev.rating)));
    starCounts[r] = (starCounts[r] || 0) + 1;
    ratingSum += rev.rating;

    if (rev.rating <= 2) {
      lowRatingCount += 1;
    }

    // Attributes
    if (rev.attributes && typeof rev.attributes === 'object') {
      Object.keys(attrSums).forEach((k) => {
        const val = Number(rev.attributes[k]);
        if (val && val >= 1 && val <= 5) {
          attrSums[k] += val;
          attrCounts[k] += 1;
        }
      });
    }

    // Compliments
    rev.compliments.forEach((c) => {
      if (c) {
        complimentsCount[c] = (complimentsCount[c] || 0) + 1;
      }
    });

    // 30 day trend
    const revTime = new Date(rev.submittedAt).getTime();
    if (!Number.isNaN(revTime)) {
      const ageMs = now - revTime;
      if (ageMs <= thirtyDaysMs) {
        sumRecent30 += rev.rating;
        countRecent30 += 1;
      } else if (ageMs <= 2 * thirtyDaysMs) {
        sumPrior30 += rev.rating;
        countPrior30 += 1;
      }
    }
  });

  const averageRating = totalRatings > 0 ? Number((ratingSum / totalRatings).toFixed(1)) : 0;
  const lowRatingPercent = totalRatings > 0 ? Math.round((lowRatingCount / totalRatings) * 100) : 0;

  const starPercents = {};
  [1, 2, 3, 4, 5].forEach((s) => {
    starPercents[s] = totalRatings > 0 ? Math.round((starCounts[s] / totalRatings) * 100) : 0;
  });

  const attributeAverages = {};
  PROVIDER_ATTRIBUTES.forEach((attr) => {
    const count = attrCounts[attr.key];
    attributeAverages[attr.key] = count > 0 ? Number((attrSums[attr.key] / count).toFixed(1)) : 0;
  });

  // Trend
  let trend30Days = 0;
  if (countRecent30 > 0 && countPrior30 > 0) {
    const avgRecent = sumRecent30 / countRecent30;
    const avgPrior = sumPrior30 / countPrior30;
    trend30Days = Number((avgRecent - avgPrior).toFixed(1));
  }

  // Sort recent reviews newest first
  const sortedReviews = [...validReviews].sort((a, b) => {
    const ta = new Date(a.submittedAt || 0).getTime();
    const tb = new Date(b.submittedAt || 0).getTime();
    return tb - ta;
  });

  return {
    totalRatings,
    averageRating,
    starCounts,
    starPercents,
    lowRatingCount,
    lowRatingPercent,
    attributeAverages,
    complimentsCount,
    trend30Days,
    recentReviews: sortedReviews,
  };
}

/**
 * Determine the Performance Tier for increment decisions based on ratings and standards.
 */
export function getPerformanceTier(stats) {
  if (!stats || stats.totalRatings < 5) {
    return PERFORMANCE_TIERS.INSUFFICIENT_DATA;
  }

  const avg = stats.averageRating;
  const count = stats.totalRatings;
  const lowPct = stats.lowRatingPercent;

  if (avg >= PERFORMANCE_TIERS.PLATINUM.minAvg && count >= PERFORMANCE_TIERS.PLATINUM.minRatings && lowPct <= PERFORMANCE_TIERS.PLATINUM.maxLowPercent) {
    return PERFORMANCE_TIERS.PLATINUM;
  }

  if (avg >= PERFORMANCE_TIERS.GOLD.minAvg && count >= PERFORMANCE_TIERS.GOLD.minRatings && lowPct <= PERFORMANCE_TIERS.GOLD.maxLowPercent) {
    return PERFORMANCE_TIERS.GOLD;
  }

  if (avg >= PERFORMANCE_TIERS.SILVER.minAvg && lowPct <= PERFORMANCE_TIERS.SILVER.maxLowPercent) {
    return PERFORMANCE_TIERS.SILVER;
  }

  return PERFORMANCE_TIERS.NEEDS_REVIEW;
}

/**
 * Compute aggregate ratings, issue resolution stats, and feedback aspects for a specific service or all services.
 */
export function getServiceRatingStats(serviceNameOrId = null, allBookings = []) {
  const normBookings = allBookings.map(normalizeBookingReviews);
  const filtered = serviceNameOrId
    ? normBookings.filter((b) => {
        if (b.service_name && b.service_name.trim().toLowerCase() === String(serviceNameOrId).trim().toLowerCase()) return true;
        if (b.service_id && String(b.service_id) === String(serviceNameOrId)) return true;
        return false;
      })
    : normBookings;

  const validReviews = [];
  filtered.forEach((b) => {
    const rev = b.service_review;
    if (!rev) return;
    if (rev.moderation?.hidden) return;
    const stars = Number(rev.rating);
    if (!stars || stars < 1 || stars > 5) return;

    validReviews.push({
      bookingId: b.booking_id,
      serviceName: b.service_name || 'Home Service',
      categoryName: b.category_name,
      userName: b.user_name || 'Verified Customer',
      userPhone: b.user_phone,
      rating: stars,
      issueResolved: rev.issue_resolved || 'yes',
      aspects: Array.isArray(rev.aspects) ? rev.aspects : [],
      comment: rev.comment || '',
      photos: Array.isArray(rev.photos) ? rev.photos : [],
      submittedAt: rev.submitted_at || b.completed_date || b.updated_at,
      moderation: rev.moderation || { hidden: false, flagged: false, admin_note: '' },
    });
  });

  const totalRatings = validReviews.length;
  const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratingSum = 0;
  let resolvedCount = 0;
  let partialCount = 0;
  let unresolvedCount = 0;
  const aspectsCount = {};

  validReviews.forEach((rev) => {
    const r = Math.min(5, Math.max(1, Math.round(rev.rating)));
    starCounts[r] = (starCounts[r] || 0) + 1;
    ratingSum += rev.rating;

    if (rev.issueResolved === 'yes') resolvedCount += 1;
    else if (rev.issueResolved === 'partial') partialCount += 1;
    else if (rev.issueResolved === 'no') unresolvedCount += 1;

    rev.aspects.forEach((asp) => {
      if (asp) {
        aspectsCount[asp] = (aspectsCount[asp] || 0) + 1;
      }
    });
  });

  const averageRating = totalRatings > 0 ? Number((ratingSum / totalRatings).toFixed(1)) : 0;
  const resolvedPercent = totalRatings > 0 ? Math.round((resolvedCount / totalRatings) * 100) : 0;

  const starPercents = {};
  [1, 2, 3, 4, 5].forEach((s) => {
    starPercents[s] = totalRatings > 0 ? Math.round((starCounts[s] / totalRatings) * 100) : 0;
  });

  const sortedReviews = [...validReviews].sort((a, b) => {
    const ta = new Date(a.submittedAt || 0).getTime();
    const tb = new Date(b.submittedAt || 0).getTime();
    return tb - ta;
  });

  return {
    totalRatings,
    averageRating,
    starCounts,
    starPercents,
    resolvedCount,
    partialCount,
    unresolvedCount,
    resolvedPercent,
    aspectsCount,
    recentReviews: sortedReviews,
  };
}
