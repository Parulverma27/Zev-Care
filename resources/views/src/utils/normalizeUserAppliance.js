/**
 * Normalize legacy localStorage appliance records for list/edit compatibility.
 */
import { SERVICE_IMAGES } from './bundledImages';

export function normalizeUserAppliance(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const media = raw.media && typeof raw.media === 'object' ? raw.media : null;
  return {
    id: raw.id ?? Date.now(),
    userId: raw.userId ?? raw.user_id ?? null,
    user_phone: raw.user_phone || '',
    name: raw.name || raw.displayName || 'Appliance',
    displayName: raw.displayName || raw.name || 'Appliance',
    category: raw.category || raw.applianceTypeName || 'Home Appliance',
    applianceTypeId: raw.applianceTypeId || '',
    brand: raw.brand || '',
    type: raw.type || '',
    capacity: raw.capacity || '',
    year: raw.year || raw.age_range || '',
    age_range: raw.age_range || raw.year || '',
    condition: raw.condition || '',
    location: raw.location || '',
    notes: raw.notes || '',
    model: raw.model || '',
    img: raw.img || media?.url || SERVICE_IMAGES.homeAppliances,
    uploadedMediaUri: raw.uploadedMediaUri || media?.url || null,
    media,
    mediaStatus: raw.mediaStatus || (media ? 'PENDING_REVIEW' : 'SKIPPED'),
    is_immutable: raw.is_immutable ?? false,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function normalizeAppliancesList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeUserAppliance).filter(Boolean);
}
