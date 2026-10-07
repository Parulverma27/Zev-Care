import {
  SERVICE_IMAGES,
  CATEGORY_IMAGE_FALLBACKS,
  SERVICE_ITEM_IMAGE_KEYS,
  getHardcodedCatalogImage,
  getComplaintCategoryImageUrl,
  COMPLAINT_CATEGORY_IMAGES,
} from './bundledImages';

export const DEFAULT_BANNERS = [
  {
    id: 1,
    title: 'Expert Care, Right at Home',
    description: 'Reliable, fast, hassle-free home services at your doorstep.',
    image_url: SERVICE_IMAGES.heroBanner1,
    type: 'hero',
    status: 'ACTIVE',
    redirect_url: '/user/bookings/new',
  },
  {
    id: 2,
    title: 'Unlimited Home Maintenance',
    description: 'Subscribe to Gold Care Plan & get ₹5,00,000 Service Wallet Credit.',
    image_url: SERVICE_IMAGES.heroBanner2,
    type: 'hero',
    status: 'ACTIVE',
    redirect_url: '/user/plans',
  },
  {
    id: 3,
    title: 'Trusted Professionals & Genuine Spares',
    description: '100% background-verified technicians with 30 days warranty.',
    image_url: SERVICE_IMAGES.heroBanner3,
    type: 'hero',
    status: 'ACTIVE',
    redirect_url: '/user/bookings/new',
  },
  {
    id: 4,
    title: 'Deep House & Appliance Cleaning',
    description: 'Book certified hygiene experts for kitchen, bath & AC servicing.',
    image_url: SERVICE_IMAGES.heroBanner1,
    type: 'hero',
    status: 'ACTIVE',
    redirect_url: '/user/bookings/new',
  },
  {
    id: 5,
    title: 'Smart Appliance & Property Verification',
    description: 'Register appliances for digital invoice backup & instant claims.',
    image_url: SERVICE_IMAGES.heroBanner2,
    type: 'hero',
    status: 'ACTIVE',
    redirect_url: '/user/property-verification',
  },
  {
    id: 6,
    title: '24x7 Emergency Repair Dispatch',
    description: 'Immediate response within 30 mins for electrical & plumbing breakdowns.',
    image_url: SERVICE_IMAGES.heroBanner3,
    type: 'hero',
    status: 'ACTIVE',
    redirect_url: '/user/bookings/new',
  },
];

export { CATEGORY_IMAGE_FALLBACKS, SERVICE_ITEM_IMAGE_KEYS as SERVICE_ITEM_IMAGE_FALLBACKS };

export const BANNERS_VERSION = '8';

export function isStaleLocalImageUrl(url) {
  if (!url || typeof url !== 'string') return true;
  if (url.startsWith('data:image/') || url.startsWith('blob:')) return false;
  return /127\.0\.0\.1:3000\/electrician\.png|localhost:3000\/electrician\.png/.test(url);
}

const BROKEN_IMAGE_MARKERS = [
  '1628177100286',
  '1c9e0c0e0e0e',
  'f9f9c0c8b8b8',
  '1560518883-ce09059eeffa',
];

function isBrokenImageUrl(url) {
  if (!url || typeof url !== 'string') return true;
  if (url.startsWith('data:image/') || url.startsWith('blob:')) return false;
  if (isStaleLocalImageUrl(url)) return true;
  return BROKEN_IMAGE_MARKERS.some((marker) => url.includes(marker));
}

/**
 * Returns a working image URI. Never rewrites dead localhost URLs to the current origin.
 */
export function resolveImageUri(url, fallback = '') {
  if (isBrokenImageUrl(url)) {
    return fallback || DEFAULT_BANNERS[0].image_url;
  }
  return url || fallback || DEFAULT_BANNERS[0].image_url;
}

/**
 * Category image resolver.
 * When isComplaint is true, uses the dedicated complaint images for the 4 categories
 * (Carpenter, Plumber, Dry Cleaning / Sofa Cleaning, Electrician).
 * When isComplaint is false (e.g. adding appliances, regular catalog), strictly uses standard catalog images.
 */
export function resolveCategoryImageUri(categoryName, _url, isComplaint = false) {
  if (isComplaint) {
    const complaintImg = getComplaintCategoryImageUrl(categoryName);
    if (complaintImg) return complaintImg;
  }
  return CATEGORY_IMAGE_FALLBACKS[categoryName] || getHardcodedCatalogImage(categoryName);
}

/** Convenience resolver specifically for complaint category cards */
export function resolveComplaintCategoryImageUri(categoryName, _url = '') {
  return resolveCategoryImageUri(categoryName, _url, true);
}

/** Always use hardcoded service assets — admin cannot override. */
export function resolveServiceItemImageUri(item, categoryName) {
  const itemName = typeof item === 'string' ? item : item?.name || '';
  if (itemName && SERVICE_ITEM_IMAGE_KEYS[itemName]) {
    return SERVICE_ITEM_IMAGE_KEYS[itemName];
  }
  return CATEGORY_IMAGE_FALLBACKS[categoryName] || SERVICE_IMAGES.electrician;
}
