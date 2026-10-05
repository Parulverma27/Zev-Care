/**
 * Server-safe service catalog for Express API (static image paths, no Metro require).
 */

import { SERVICE_IMAGES } from '../utils/bundledImagePaths.server.js';
import { CATALOG_VERSION, buildServiceCatalog } from './serviceCatalogData.js';

export { SERVICE_IMAGES };
export { CATALOG_VERSION };

export const SERVICE_CATALOG = buildServiceCatalog(SERVICE_IMAGES);
export const MAIN_CATEGORY_NAMES = SERVICE_CATALOG.map((c) => c.name);
