import { CATALOG_VERSION, MAIN_CATEGORY_NAMES, SERVICE_CATALOG } from './serviceCatalog';

export { CATALOG_VERSION, MAIN_CATEGORY_NAMES, SERVICE_CATALOG };

export function getCategoryByName(name) {
  if (!name) return null;
  const exact = SERVICE_CATALOG.find((c) => c.name === name || c.id === name);
  if (exact) return exact;
  const lower = String(name).toLowerCase().trim();
  return (
    SERVICE_CATALOG.find((c) => {
      const cLower = c.name.toLowerCase();
      return (
        cLower === lower ||
        (lower.includes('plumb') && cLower.includes('plumb')) ||
        (lower.includes('carpen') && cLower.includes('carpen')) ||
        (lower.includes('clean') && cLower.includes('clean')) ||
        (lower.includes('pest') && cLower.includes('pest')) ||
        (lower.includes('elec') && cLower.includes('elec'))
      );
    }) || null
  );
}

export function categoryHasGroups(categoryName, liveSubCategories = null) {
  if (Array.isArray(liveSubCategories) && liveSubCategories.length > 0) {
    return liveSubCategories.some((s) => s.category_name === categoryName);
  }
  const cat = getCategoryByName(categoryName);
  return Boolean(cat?.groups?.length);
}

export function getSubGroups(categoryName, liveSubCategories = null) {
  if (Array.isArray(liveSubCategories) && liveSubCategories.length > 0) {
    const matched = liveSubCategories.filter((s) => s.category_name === categoryName);
    if (matched.length > 0) return matched;
  }
  const cat = getCategoryByName(categoryName);
  return cat?.groups || [];
}

export function getServiceTypes(categoryName, subGroupName = null, liveServices = null) {
  let base = [];
  if (Array.isArray(liveServices) && liveServices.length > 0) {
    const matched = liveServices.filter((s) => {
      const catMatch = !categoryName || s.category_name === categoryName;
      const subMatch = !subGroupName || s.sub_category_name === subGroupName;
      return catMatch && subMatch;
    });
    if (matched.length > 0) base = matched;
  }
  if (base.length === 0) {
    const cat = getCategoryByName(categoryName);
    if (!cat) return [];
    if (subGroupName) {
      const group = cat.groups?.find((g) => g.name === subGroupName);
      base = group?.items || [];
    } else {
      base = cat.items || [];
    }
  }

  // Live services flatten strips catalog "Other" — restore it so every list stays complete
  const hasOther = base.some((s) => s.isOther || s.name === 'Other');
  if (!hasOther) {
    base = [
      ...base,
      {
        name: 'Other',
        description: 'Tell us your specific requirement',
        isOther: true,
        image_url: null,
      },
    ];
  }
  return base;
}

export function countServicesInCategory(categoryName, liveServices = null) {
  if (Array.isArray(liveServices) && liveServices.length > 0) {
    return liveServices.filter((s) => s.category_name === categoryName).length;
  }
  const cat = getCategoryByName(categoryName);
  if (!cat) return 0;
  if (cat.groups) {
    return cat.groups.reduce((sum, g) => sum + (g.items?.length || 0), 0);
  }
  return cat.items?.length || 0;
}

export function countServicesInSubCategory(categoryName, subCategoryName, liveServices = null) {
  if (Array.isArray(liveServices) && liveServices.length > 0) {
    return liveServices.filter((s) => s.category_name === categoryName && s.sub_category_name === subCategoryName).length;
  }
  const cat = getCategoryByName(categoryName);
  if (!cat || !cat.groups) return 0;
  const group = cat.groups.find((g) => g.name === subCategoryName);
  return group?.items?.length || 0;
}

export function getInitialStepForCategory(categoryName) {
  if (!categoryName) return 1;
  if (isPestControlCategory(categoryName)) return 'SERVICE_TYPE';
  return categoryHasGroups(categoryName) ? 'SUB_GROUP' : 'SERVICE_TYPE';
}

/**
 * Flatten tree → legacy arrays used by AppContext, HomeScreen search & Admin CRUD.
 */
export function flattenToLegacyCatalog() {
  const categories = [];
  const subCategories = [];
  const services = [];
  let catId = 1;
  let subId = 1;
  let svcId = 1;

  SERVICE_CATALOG.forEach((cat) => {
    categories.push({
      id: catId++,
      name: cat.name,
      description: cat.description,
      image_url: cat.image_url,
    });

    if (cat.groups?.length) {
      cat.groups.forEach((group) => {
        subCategories.push({
          id: subId++,
          category_name: cat.name,
          name: group.name,
          description: group.description || '',
          image_url: group.image_url || cat.image_url,
        });

        (group.items || []).forEach((serviceItem) => {
          if (serviceItem.isOther || serviceItem.name === 'Other') return;
          services.push({
            id: svcId++,
            category_name: cat.name,
            sub_category_name: group.name,
            name: serviceItem.name,
            description: serviceItem.description,
            time: serviceItem.estimated_time || '30-45 mins',
            image_url: serviceItem.image_url,
          });
        });
      });
    } else if (cat.items?.length) {
      cat.items.forEach((serviceItem) => {
        if (serviceItem.isOther || serviceItem.name === 'Other') return;
        services.push({
          id: svcId++,
          category_name: cat.name,
          sub_category_name: '',
          name: serviceItem.name,
          description: serviceItem.description,
          time: serviceItem.estimated_time || '30-45 mins',
          image_url: serviceItem.image_url,
        });
      });
    }
  });

  return { categories, subCategories, services };
}

const SEARCH_ALIASES = {
  ac: ['air conditioner', 'air conditioning', 'cooling', 'hvac', 'split ac', 'window ac'],
  'air conditioner': ['ac'],
  'air condition': ['ac'],
  tv: ['television', 'led', 'lcd'],
  television: ['tv'],
  fridge: ['refrigerator'],
  refrigerator: ['fridge'],
  wm: ['washing machine'],
  washer: ['washing machine'],
  ro: ['water purifiers', 'purifier'],
  purifier: ['water purifiers', 'ro'],
  cooler: ['air cooler'],
  plumber: ['plumbing'],
  plumbing: ['plumber'],
  electrician: ['electrical'],
  carpenter: ['carpentry'],
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function searchAllServices(query = '', liveServices = null) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];

  const rawList = [];
  if (Array.isArray(liveServices) && liveServices.length > 0) {
    liveServices.forEach((s) => {
      rawList.push({
        id: s.id || s.name,
        name: s.name,
        category_name: s.category_name,
        sub_category_name: s.sub_category_name || s.name,
        description: s.description || '',
        image_url: s.image_url,
      });
    });
  } else {
    SERVICE_CATALOG.forEach((cat) => {
      const scan = (items, subGroupName = null) => {
        (items || []).forEach((item) => {
          if (item.isOther) return;
          rawList.push({
            id: `${cat.id}-${subGroupName || 'root'}-${item.name}`,
            name: item.name,
            category_name: cat.name,
            sub_category_name: subGroupName || item.name,
            description: item.description || '',
            image_url: item.image_url,
          });
        });
      };
      if (cat.groups) {
        cat.groups.forEach((g) => scan(g.items, g.name));
      } else {
        scan(cat.items);
      }
    });
  }

  const aliases = SEARCH_ALIASES[q] || [];
  const isShortQuery = q.length <= 2;
  const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(q)}\\b`, 'i');
  const wordStartRegex = new RegExp(`\\b${escapeRegex(q)}`, 'i');

  const scoredResults = [];

  rawList.forEach((item) => {
    const nameLower = String(item.name || '').toLowerCase().trim();
    const catLower = String(item.category_name || '').toLowerCase().trim();
    const subLower = String(item.sub_category_name || '').toLowerCase().trim();
    const descLower = String(item.description || '').toLowerCase().trim();

    let score = 0;

    // 1. Exact Name match
    if (nameLower === q) {
      score += 1000;
    }
    // 2. Name starts with query
    else if (nameLower.startsWith(q)) {
      score += 600;
    }
    // 3. Name contains query as a distinct word
    else if (wordBoundaryRegex.test(nameLower)) {
      score += 450;
    }
    // 4. Name starts a word with query (for queries >= 3 chars)
    else if (!isShortQuery && wordStartRegex.test(nameLower)) {
      score += 300;
    }
    // 5. Name contains substring (for queries >= 3 chars)
    else if (!isShortQuery && nameLower.includes(q)) {
      score += 150;
    }

    // 6. Common Alias match (e.g. ac -> air conditioner, fridge -> refrigerator)
    if (aliases.length > 0) {
      const matchedAlias = aliases.some((a) => {
        const aLower = a.toLowerCase().trim();
        if (nameLower === aLower) return true;
        if (aLower.length <= 2) {
          return new RegExp(`\\b${escapeRegex(aLower)}\\b`, 'i').test(nameLower);
        }
        return (
          new RegExp(`\\b${escapeRegex(aLower)}`, 'i').test(nameLower) ||
          nameLower.includes(aLower)
        );
      });
      if (matchedAlias) score += 500;
    }

    // 7. Category / SubCategory match
    if (catLower === q || subLower === q) {
      score += 200;
    } else if (catLower.startsWith(q) || subLower.startsWith(q)) {
      score += 120;
    } else if (wordBoundaryRegex.test(catLower) || wordBoundaryRegex.test(subLower)) {
      score += 100;
    } else if (!isShortQuery && (catLower.includes(q) || subLower.includes(q))) {
      score += 50;
    }

    // 8. Description match - strictly whole word boundary match!
    if (wordBoundaryRegex.test(descLower)) {
      score += 60;
    } else if (!isShortQuery && wordStartRegex.test(descLower)) {
      score += 30;
    }

    if (score > 0) {
      scoredResults.push({ item, score });
    }
  });

  // Sort descending by relevance score
  scoredResults.sort((a, b) => b.score - a.score);

  // Return items, removing duplicates by name + category
  const seen = new Set();
  const finalResults = [];
  for (const { item } of scoredResults) {
    const key = `${item.name}-${item.category_name}`;
    if (!seen.has(key)) {
      seen.add(key);
      finalResults.push(item);
    }
  }

  return finalResults;
}

/**
 * Zero-friction category helper:
 * For Plumber (Plumbing) and Pest Control, video verification and questions
 * are skipped and replaced with direct confirmation modal & Blinkit-style cart.
 */
export function isZeroFrictionCategory(categoryNameOrId) {
  if (!categoryNameOrId) return false;
  const normalized = String(categoryNameOrId).toLowerCase().trim();
  return (
    normalized.includes('plumb') ||
    normalized.includes('pest') ||
    normalized.includes('bath') ||
    normalized.includes('shower') ||
    normalized.includes('tap') ||
    normalized.includes('sink') ||
    normalized.includes('basin') ||
    normalized.includes('drain') ||
    normalized.includes('leak') ||
    normalized.includes('toilet') ||
    normalized.includes('cockroach') ||
    normalized.includes('termite') ||
    normalized.includes('bedbug')
  );
}

export function isPestControlCategory(categoryNameOrId) {
  if (!categoryNameOrId) return false;
  const normalized = String(categoryNameOrId).toLowerCase().trim();
  return normalized.includes('pest');
}

export function isPlumberCategory(categoryNameOrId) {
  if (!categoryNameOrId) return false;
  const normalized = String(categoryNameOrId).toLowerCase().trim();
  return normalized.includes('plumb');
}

/**
 * Returns false if an appliance / service belongs to a category or item
 * where video verification is not required (e.g. plumbing, pest control, auto-verified items).
 */
export function doesApplianceRequireVideo(appliance) {
  if (!appliance) return false;
  if (
    appliance.media?.isAutoVerified ||
    appliance.media?.uri === 'auto-verified://zero-friction' ||
    appliance.uploadedMediaUri === 'auto-verified://zero-friction'
  ) {
    return false;
  }
  const text = `${appliance.category || ''} ${appliance.serviceName || ''} ${appliance.name || ''} ${appliance.displayName || ''} ${appliance.applianceTypeId || ''} ${appliance.notes || ''}`.toLowerCase();
  if (
    text.includes('plumb') ||
    text.includes('pest') ||
    text.includes('bath') ||
    text.includes('shower') ||
    text.includes('tap') ||
    text.includes('sink') ||
    text.includes('basin') ||
    text.includes('drain') ||
    text.includes('leak') ||
    text.includes('water tank') ||
    text.includes('tank') ||
    text.includes('toilet') ||
    text.includes('cockroach') ||
    text.includes('termite') ||
    text.includes('bedbug')
  ) {
    return false;
  }
  return true;
}

