/**
 * Persistent Media Storage Helper
 * Uses IndexedDB to reliably store large recorded videos (bypassing the 5MB localStorage limit),
 * with an in-memory cache for synchronous access across customer and admin views.
 */

const DB_NAME = 'ZevotaCareMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'appliance_media';

// In-memory synchronous cache
const memoryMediaCache = new Map();

function openDB() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return resolve(null);
    }
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Store a media URI (base64 or blob) associated with an appliance or entity ID */
export async function storeMedia(id, mediaData) {
  if (!id || !mediaData) return;
  const key = String(id);
  memoryMediaCache.set(key, mediaData);
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id: key, data: mediaData, updatedAt: Date.now() });
  } catch (err) {
    console.warn('[mediaStorage] Failed to write to IndexedDB:', err);
  }
}

/** Retrieve media from in-memory cache or IndexedDB */
export async function getStoredMedia(id) {
  if (!id) return null;
  const key = String(id);
  if (memoryMediaCache.has(key)) {
    return memoryMediaCache.get(key);
  }
  try {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result?.data) {
          memoryMediaCache.set(key, req.result.data);
          resolve(req.result.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/** Load all stored media records into memory on app launch */
export async function loadAllStoredMedia() {
  try {
    const db = await openDB();
    if (!db) return memoryMediaCache;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        items.forEach((item) => {
          if (item?.id && item?.data) {
            memoryMediaCache.set(String(item.id), item.data);
          }
        });
        resolve(memoryMediaCache);
      };
      req.onerror = () => resolve(memoryMediaCache);
    });
  } catch {
    return memoryMediaCache;
  }
}

/** Synchronous lookup from memory cache */
export function getCachedMedia(id) {
  if (!id) return null;
  return memoryMediaCache.get(String(id)) || null;
}
