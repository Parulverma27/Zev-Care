import { CATALOG_VERSION, MAIN_CATEGORY_NAMES, SERVICE_CATALOG } from './serviceCatalog';

export { CATALOG_VERSION, MAIN_CATEGORY_NAMES, SERVICE_CATALOG };

export function getCategoryByName(name) {
  return SERVICE_CATALOG.find((c) => c.name === name) || null;
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

export function searchAllServices(query = '', liveServices = null) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  if (Array.isArray(liveServices) && liveServices.length > 0) {
    return liveServices.filter((s) => {
      const haystack = `${s.name || ''} ${s.category_name || ''} ${s.sub_category_name || ''} ${s.description || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  const results = [];
  SERVICE_CATALOG.forEach((cat) => {
    const scan = (items, subGroupName = null) => {
      (items || []).forEach((item) => {
        if (item.isOther) return;
        const haystack = [cat.name, subGroupName, item.name, item.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (haystack.includes(q)) {
          results.push({
            id: `${cat.id}-${subGroupName || 'root'}-${item.name}`,
            name: item.name,
            category_name: cat.name,
            sub_category_name: subGroupName || item.name,
            description: item.description,
            image_url: item.image_url,
          });
        }
      });
    };

    if (cat.groups) {
      cat.groups.forEach((g) => scan(g.items, g.name));
    } else {
      scan(cat.items);
    }
  });

  return results;
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

