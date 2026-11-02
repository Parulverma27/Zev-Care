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
    const cat = getCategoryByName(categoryName);
    const group = subGroupName && cat?.groups ? cat.groups.find((g) => g.name === subGroupName) : null;
    const fallbackImage = group?.image_url || cat?.image_url || null;
    base = [
      ...base,
      {
        name: 'Other',
        description: 'Tell us your specific requirement',
        isOther: true,
        image_url: fallbackImage,
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

export const SERVICE_TO_CATEGORY_MAP = {
  // Pest Control
  'bedbugs': 'Pest Control',
  'bedbug': 'Pest Control',
  'bedbug control': 'Pest Control',
  'bedbugs_control': 'Pest Control',
  'termite': 'Pest Control',
  'termite control': 'Pest Control',
  'cockroach': 'Pest Control',

  // Plumbing
  'bath & shower': 'Plumbing',
  'tap mixer': 'Plumbing',
  'toilet': 'Plumbing',
  'basins & sinks': 'Plumbing',
  'drainage & blockage': 'Plumbing',
  'leakages & connections': 'Plumbing',
  'water tanks & motors': 'Plumbing',

  // Dry Cleaning
  'sofa fabric': 'Dry Cleaning',
  'leather sofa': 'Dry Cleaning',
  'carpets': 'Dry Cleaning',
  'carpet': 'Dry Cleaning',
  'fabric headboards': 'Dry Cleaning',
  'leather headboards': 'Dry Cleaning',
  'dining tables & chairs': 'Dry Cleaning',
  'curtains': 'Dry Cleaning',
  'large chairs': 'Dry Cleaning',

  // Carpentry
  'bed': 'Carpentry',
  'sofa': 'Carpentry',
  'table': 'Carpentry',
  'chair': 'Carpentry',
  'door repair': 'Carpentry',
  'drawer': 'Carpentry',
  'cupboard lock': 'Carpentry',
  'cupboard': 'Carpentry',
  'door mesh': 'Carpentry',
  'door closer': 'Carpentry',
  'door lock': 'Carpentry',
  'cabinet hinges': 'Carpentry',
  'pull out drawer': 'Carpentry',
  'cabinet hydraulic': 'Carpentry',

  // Electrician
  'ac': 'Electrician',
  'washing machine': 'Electrician',
  'tv': 'Electrician',
  'air cooler': 'Electrician',
  'cooler': 'Electrician',
  'geyser': 'Electrician',
  'fans': 'Electrician',
  'fan': 'Electrician',
  'switch boards': 'Electrician',
  'switch board': 'Electrician',
  'plugs & sockets': 'Electrician',
  'plug': 'Electrician',
  'exhaust fan': 'Electrician',
  'fan regulator': 'Electrician',
  'fancy lights': 'Electrician',
  'fancy light': 'Electrician',
  'bulbs & tubelights': 'Electrician',
  'bulb': 'Electrician',
  'chandelier': 'Electrician',
  'doorbell': 'Electrician',
  'cctv': 'Electrician',
  'mcb & main switch': 'Electrician',
  'mcb': 'Electrician',
  'home theatre': 'Electrician',
  'inverters & batteries': 'Electrician',
  'inverter': 'Electrician',
  'stabilisers': 'Electrician',
  'stabiliser': 'Electrician',
  'iron': 'Electrician',
  'vacuum cleaner': 'Electrician',
  'trimmer': 'Electrician',
  'projector': 'Electrician',
  'desktops': 'Electrician',
  'desktop': 'Electrician',
  'refrigerator': 'Electrician',
  'fridge': 'Electrician',
  'stove': 'Electrician',
  'coffee machine': 'Electrician',
  'microwave': 'Electrician',
  'water purifiers': 'Electrician',
  'water purifier': 'Electrician',
  'ro': 'Electrician',
  'ro purifier': 'Electrician',
  'juicer & mixer': 'Electrician',
};

export function resolveApplianceCanonicalCategory(appliance) {
  if (!appliance) return 'Other';

  const rawCat = String(appliance?.category || '').trim();
  const c = rawCat.toLowerCase();
  const n = String(appliance?.displayName || appliance?.name || '').trim().toLowerCase();
  const s = String(appliance?.serviceName || '').trim().toLowerCase();
  const t = String(appliance?.applianceTypeId || appliance?.type || '').trim().toLowerCase();

  // 1. Direct Category Match if already canonical
  if (c === 'pest control' || c === 'pest_control' || c === 'pest') return 'Pest Control';
  if (c === 'plumbing' || c === 'plumber') return 'Plumbing';
  if (c === 'carpentry' || c === 'carpenter') return 'Carpentry';
  if (c === 'dry cleaning' || c === 'dry_cleaning' || c === 'cleaning') return 'Dry Cleaning';
  if (c === 'electrician' || c === 'electrical' || c === 'home appliance' || c === 'home appliances' || c === 'kitchen appliances') return 'Electrician';

  // 2. Exact match against service catalog dictionary
  if (SERVICE_TO_CATEGORY_MAP[s]) return SERVICE_TO_CATEGORY_MAP[s];
  if (SERVICE_TO_CATEGORY_MAP[n]) return SERVICE_TO_CATEGORY_MAP[n];
  if (SERVICE_TO_CATEGORY_MAP[t]) return SERVICE_TO_CATEGORY_MAP[t];

  const hay = ` ${c} ${n} ${s} ${t} `;

  // 3. Pest Control (High priority to avoid collision with bed/wood)
  if (
    hay.includes('pest') ||
    hay.includes('cockroach') ||
    hay.includes('termite') ||
    hay.includes('bedbug') ||
    hay.includes('bed bug') ||
    hay.includes('insect') ||
    hay.includes('rodent')
  ) {
    return 'Pest Control';
  }

  // 4. Electrician (RO / water purifiers, kitchen appliances, electronics)
  if (
    hay.includes('water purifier') ||
    hay.includes('purifier') ||
    hay.includes(' ro ') ||
    hay.includes('elect') ||
    hay.includes('ac') ||
    hay.includes('air cond') ||
    hay.includes('refrigerat') ||
    hay.includes('fridge') ||
    hay.includes('geyser') ||
    hay.includes('heater') ||
    hay.includes('tv') ||
    hay.includes('television') ||
    hay.includes('fan') ||
    hay.includes('cooler') ||
    hay.includes('inverter') ||
    hay.includes('mcb') ||
    hay.includes('switch') ||
    hay.includes('light') ||
    hay.includes('bulb') ||
    hay.includes('microwave') ||
    hay.includes('oven') ||
    hay.includes('washing machine') ||
    hay.includes('doorbell') ||
    hay.includes('vacuum')
  ) {
    return 'Electrician';
  }

  // 5. Plumbing
  if (
    hay.includes('plumb') ||
    hay.includes('tap') ||
    hay.includes('shower') ||
    hay.includes('sink') ||
    hay.includes('basin') ||
    hay.includes('toilet') ||
    hay.includes('commode') ||
    hay.includes('drain') ||
    hay.includes('leak') ||
    hay.includes('pipe') ||
    hay.includes('valve') ||
    hay.includes('faucet') ||
    hay.includes('water tank') ||
    hay.includes('water pump')
  ) {
    return 'Plumbing';
  }

  // 6. Dry Cleaning
  if (
    hay.includes('dry clean') ||
    hay.includes('dryclean') ||
    hay.includes('carpet') ||
    hay.includes('curtain') ||
    hay.includes('upholstery') ||
    hay.includes('sofa fabric') ||
    hay.includes('leather sofa') ||
    hay.includes('headboard') ||
    hay.includes('laundry')
  ) {
    return 'Dry Cleaning';
  }

  // 7. Carpentry (Whole-word bed to avoid bedbug collision)
  if (
    hay.includes('carpent') ||
    hay.includes('wood') ||
    hay.includes('furnitur') ||
    hay.includes('sofa') ||
    hay.includes('table') ||
    hay.includes('chair') ||
    hay.includes('cupboard') ||
    hay.includes('wardrobe') ||
    hay.includes('door') ||
    hay.includes('drawer') ||
    hay.includes('hinge') ||
    hay.includes('lock') ||
    hay.includes('cabinet') ||
    /\bbed\b/i.test(hay)
  ) {
    return 'Carpentry';
  }

  if (rawCat && !['item', 'appliance', 'home appliance', 'other', 'none'].includes(c)) {
    return rawCat.charAt(0).toUpperCase() + rawCat.slice(1);
  }
  return 'Other';
}

