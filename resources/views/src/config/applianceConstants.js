/** Inventory appliance wizard constants — easy to change without touching UI. */

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = Infinity;

/** Fee when registering a new appliance during booking (post-registration add). Separate from ₹499 unit surcharge. */
export const APPLIANCE_REGISTRATION_FEE = 500;

/** Appliances covered allowance per AMC tier: 20 for Silver, 40 for Gold, unlimited for Platinum */
export const AMC_TIER_APPLIANCE_ALLOWANCES = {
  Silver: 20,
  Gold: 40,
  Platinum: Infinity,
};

/** Default base service charge used by booking pricing helper (matches legacy createBooking). */
export const DEFAULT_SERVICE_CHARGE = 2000;

/** First-screen appliance IDs (order matters). Must exist in applianceCatalog. */
export const TOP_APPLIANCE_IDS = [
  'air_conditioner',
  'refrigerator',
  'washing_machine',
  'television',
  'microwave',
  'geyser',
  'air_cooler',
  'fan',
  'water_purifier',
  'chimney',
  'ro_system',
  'dishwasher',
  'cctv',
  'doorbell',
  'stove',
];

export const MEDIA_REQUIREMENTS = {
  photoRequired: false,
  videoRequired: false,
  maxVideoSeconds: 20,
};

export const CONDITION_OPTIONS = [
  'Working',
  'Not Working',
  'Needs Repair',
  'Intermittent Issues',
];
