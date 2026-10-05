import { CATALOG_VERSION, MAIN_CATEGORY_NAMES, SERVICE_CATALOG } from './serviceCatalog.server.js';

export { CATALOG_VERSION, MAIN_CATEGORY_NAMES, SERVICE_CATALOG };

export function getCategoryByName(name) {
  return SERVICE_CATALOG.find((c) => c.name === name) || null;
}

export function categoryHasGroups(categoryName) {
  const cat = getCategoryByName(categoryName);
  return Boolean(cat?.groups?.length);
}

export function getSubGroups(categoryName) {
  const cat = getCategoryByName(categoryName);
  return cat?.groups || [];
}

export function getServiceTypes(categoryName, subGroupName = null) {
  const cat = getCategoryByName(categoryName);
  if (!cat) return [];
  if (subGroupName) {
    const group = cat.groups?.find((g) => g.name === subGroupName);
    return group?.items || [];
  }
  return cat.items || [];
}

export function countServicesInCategory(categoryName) {
  const cat = getCategoryByName(categoryName);
  if (!cat) return 0;
  if (cat.groups) {
    return cat.groups.reduce((sum, g) => sum + (g.items?.length || 0), 0);
  }
  return cat.items?.length || 0;
}

export function getInitialStepForCategory(categoryName) {
  if (!categoryName) return 1;
  return categoryHasGroups(categoryName) ? 'SUB_GROUP' : 'SERVICE_TYPE';
}

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

export function searchAllServices(query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return [];
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
