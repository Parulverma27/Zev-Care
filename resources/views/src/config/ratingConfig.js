/**
 * Rating system configuration & standards.
 * Covers Service Reviews, Provider Reviews, Attribute evaluations, and Performance Tiers for increments.
 */

export const STAR_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Exceptional',
};

export const RESOLVED_OPTIONS = [
  { id: 'yes', label: 'Yes, completely', color: '#059669', badgeBg: '#ecfdf5', icon: '✓' },
  { id: 'partial', label: 'Partially', color: '#d97706', badgeBg: '#fffbeb', icon: '⚡' },
  { id: 'no', label: 'No, unresolved', color: '#dc2626', badgeBg: '#fef2f2', icon: '✕' },
];

export const SERVICE_ASPECTS_POSITIVE = [
  'Prompt & On-Time',
  'Accurate Diagnosis',
  'Quality Workmanship',
  'Transparent Pricing',
  'Cleaned Up Afterward',
  'Genuine Spare Parts',
];

export const SERVICE_ASPECTS_NEGATIVE = [
  'Delayed Arrival',
  'Issue Persists',
  'High Spare Cost',
  'Work Area Left Messy',
  'Lack of Proper Tools',
  'Unclear Billing',
];

export const PROVIDER_ATTRIBUTES = [
  {
    key: 'punctuality',
    label: 'Punctuality',
    hint: 'Arrived on scheduled appointment window',
    icon: 'clock',
  },
  {
    key: 'professionalism',
    label: 'Professionalism & Decorum',
    hint: 'Courteous behaviour, ID badge & verified uniform',
    icon: 'user-check',
  },
  {
    key: 'skill',
    label: 'Technical Expertise',
    hint: 'Thorough diagnosis & sound repair competence',
    icon: 'tool',
  },
  {
    key: 'cleanliness',
    label: 'Site Cleanliness',
    hint: 'Kept appliance surroundings orderly & tidy',
    icon: 'sparkles',
  },
  {
    key: 'communication',
    label: 'Clear Communication',
    hint: 'Explained defects, parts and warranty honestly',
    icon: 'message-circle',
  },
];

export const PROVIDER_COMPLIMENTS = [
  'Polite & Respectful',
  'Explained Issue Thoroughly',
  'Master Craftsperson',
  'Followed Safety Standards',
  'Fast & Flawless Execution',
  'Honest & Transparent',
];

export const PERFORMANCE_TIERS = {
  PLATINUM: {
    id: 'platinum',
    label: 'Platinum Partner',
    badge: 'Platinum',
    minAvg: 4.8,
    minRatings: 20,
    maxLowPercent: 5,
    incrementRecommendation: 'Eligible for Top Tier Hike (+15% to +20%)',
    color: '#6d28d9',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    accent: '#8b5cf6',
  },
  GOLD: {
    id: 'gold',
    label: 'Gold Partner',
    badge: 'Gold',
    minAvg: 4.5,
    minRatings: 10,
    maxLowPercent: 10,
    incrementRecommendation: 'Eligible for Standard Hike (+10%)',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
    accent: '#f59e0b',
  },
  SILVER: {
    id: 'silver',
    label: 'Silver Partner',
    badge: 'Silver',
    minAvg: 4.0,
    minRatings: 5,
    maxLowPercent: 20,
    incrementRecommendation: 'Standard Performance (0% to +5% / Monitor)',
    color: '#334155',
    bg: '#f8fafc',
    border: '#cbd5e1',
    accent: '#64748b',
  },
  NEEDS_REVIEW: {
    id: 'needs_review',
    label: 'Needs Review',
    badge: 'Needs Review',
    minAvg: 0,
    minRatings: 5,
    maxLowPercent: 100,
    incrementRecommendation: 'Performance Improvement Plan (PIP) — Increment Hold',
    color: '#b91c1c',
    bg: '#fef2f2',
    border: '#fecaca',
    accent: '#ef4444',
  },
  INSUFFICIENT_DATA: {
    id: 'insufficient_data',
    label: 'Awaiting Evaluations',
    badge: 'Baseline',
    minAvg: 0,
    minRatings: 0,
    maxLowPercent: 100,
    incrementRecommendation: 'Not evaluated yet (Needs ≥ 5 verified reviews)',
    color: '#64748b',
    bg: '#f1f5f9',
    border: '#e2e8f0',
    accent: '#94a3b8',
  },
};
