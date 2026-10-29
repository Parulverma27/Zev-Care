export const ADDRESS_CATEGORIES = [
  'Independent house/floor',
  'Villa',
  'PG',
  'Rented home/floor',
];

export function isAddressEditable(tag) {
  const t = String(tag || '').trim().toLowerCase();
  return t.includes('rented');
}

export function normalizeTag(tag) {
  const t = String(tag || '').trim().toLowerCase();
  if (t.includes('rented')) return 'Rented home/floor';
  if (t === 'villa') return 'Villa';
  if (t === 'pg') return 'PG';
  return 'Independent house/floor';
}

/**
 * Keep saved address lists consistent: at most one default, valid tags only (Independent house/floor, Villa, PG, Rented home/floor).
 */
export function normalizeSavedAddresses(list = []) {
  if (!Array.isArray(list) || list.length === 0) return [];

  const seen = new Set();
  const deduped = [];

  for (const addr of list) {
    if (!addr || !addr.address) continue;
    const key = String(addr.address).trim().toLowerCase().replace(/\s+/g, ' ');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push({
      ...addr,
      tag: normalizeTag(addr.tag),
      address: String(addr.address).trim(),
    });
  }

  const defaultIdx = deduped.findIndex((a) => a.isDefault);
  return deduped.map((a, i) => ({
    ...a,
    isDefault: defaultIdx >= 0 ? i === defaultIdx : i === 0,
  }));
}

/**
 * Upsert the home/default property address instead of stacking duplicates.
 */
export function upsertDefaultAddress(existing = [], nextAddress, extras = {}) {
  const list = Array.isArray(existing) ? [...existing] : [];
  const full = String(nextAddress || '').trim();
  if (!full) return normalizeSavedAddresses(list);

  const key = full.toLowerCase().replace(/\s+/g, ' ');
  const exactIdx = list.findIndex(
    (a) => String(a.address || '').trim().toLowerCase().replace(/\s+/g, ' ') === key
  );
  const defaultIdx = list.findIndex((a) => a.isDefault);
  const homeIdx = list.findIndex((a) => /(home|independent|rented)/i.test(String(a.tag || '')));
  const replaceIdx = exactIdx >= 0 ? exactIdx : defaultIdx >= 0 ? defaultIdx : homeIdx;

  const entry = {
    id: replaceIdx >= 0 ? list[replaceIdx].id : Date.now(),
    tag: normalizeTag(extras.tag || (replaceIdx >= 0 ? list[replaceIdx].tag : 'Independent house/floor')),
    address: full,
    isDefault: true,
    ...(extras.latitude != null ? { latitude: extras.latitude } : {}),
    ...(extras.longitude != null ? { longitude: extras.longitude } : {}),
  };

  let next;
  if (replaceIdx >= 0) {
    next = list.map((a, i) => (i === replaceIdx ? { ...a, ...entry } : { ...a, isDefault: false }));
  } else {
    next = [entry, ...list.map((a) => ({ ...a, isDefault: false }))];
  }

  return normalizeSavedAddresses(next);
}
