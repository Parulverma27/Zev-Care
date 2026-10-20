/**
 * Maps booking service catalog names → inventory applianceTypeId.
 * Non-appliance services return null (skip appliance selection step).
 */
import { getApplianceById } from './applianceCatalog';

/** @type {Record<string, string>} */
const SERVICE_NAME_TO_APPLIANCE_TYPE = {
  // Electrician & Appliances
  AC: 'air_conditioner',
  'Washing Machine': 'washing_machine',
  TV: 'television',
  'Air Cooler': 'air_cooler',
  Geyser: 'geyser',
  Fans: 'fan',
  'Exhaust Fan': 'fan',
  Doorbell: 'doorbell',
  CCTV: 'cctv',
  Refrigerator: 'refrigerator',
  Stove: 'stove',
  'Coffee Machine': 'coffee_machine',
  Microwave: 'microwave',
  'Water Purifiers': 'water_purifier',
  'Switch Boards': 'switch_board',
  'Plugs & Sockets': 'switch_board',
  'Fan Regulator': 'switch_board',
  'Fancy Lights': 'switch_board',
  'Bulbs & Tubelights': 'switch_board',
  Chandelier: 'switch_board',
  'MCB & Main Switch': 'switch_board',
  'Home Theatre': 'home_theatre',
  'Inverters & Batteries': 'inverter_battery',
  Stabilisers: 'stabiliser',
  Iron: 'vacuum_cleaner',
  'Vacuum Cleaner': 'vacuum_cleaner',
  Trimmer: 'vacuum_cleaner',
  Projector: 'home_theatre',
  Desktops: 'vacuum_cleaner',
  'Juicer & Mixer': 'juicer_mixer',

  // Plumber
  'Bath & Shower': 'bath_shower',
  'Tap Mixer': 'tap_mixer',
  Toilet: 'toilet',
  'Basins & Sinks': 'basins_sinks',
  'Drainage & Blockage': 'drainage_blockage',
  'Leakages & Connections': 'leakage_connection',
  'Water Tanks & Motors': 'water_tank_motor',

  // Carpenter
  Bed: 'bed',
  Sofa: 'sofa',
  Table: 'table',
  Chair: 'chair',
  'Door Repair': 'door_repair',
  Drawer: 'cupboard',
  'Cupboard Lock': 'cupboard',
  Cupboard: 'cupboard',
  'Door Mesh': 'door_repair',
  'Cabinet Hinges': 'kitchen_fittings',
  'Cabinet Hydraulic': 'kitchen_fittings',
  'Dining Table': 'table',
  'Door Closer': 'door_repair',
  'Large Chair': 'chair',
  'Pull-out Drawer': 'kitchen_fittings',
  'Kitchen Fittings': 'kitchen_fittings',
  'Furniture Repair': 'sofa',

  // Dry Cleaning
  'Fabric Sofa': 'fabric_sofa',
  'Leather Sofa': 'leather_sofa',
  Carpet: 'carpet',
  Curtains: 'curtains',
  'Fabric Headboard': 'fabric_headboard',
  'Leather Headboard': 'leather_headboard',

  // Pest Control
  Cockroach: 'cockroach_control',
  Termite: 'termite_control',
  Bedbugs: 'bedbugs_control',
};

// True inventory home appliances eligible for selection during booking flow
const CORE_BOOKING_INVENTORY_TYPES = new Set([
  'air_conditioner',
  'washing_machine',
  'television',
  'air_cooler',
  'geyser',
  'fan',
  'refrigerator',
  'stove',
  'coffee_machine',
  'microwave',
  'water_purifier',
  'cctv',
  'doorbell',
  'inverter_battery',
  'juicer_mixer',
]);

export function getApplianceTypeIdForService(serviceName) {
  if (!serviceName) return null;
  const key = String(serviceName).trim();
  if (Object.prototype.hasOwnProperty.call(SERVICE_NAME_TO_APPLIANCE_TYPE, key)) {
    return SERVICE_NAME_TO_APPLIANCE_TYPE[key];
  }
  // Fuzzy: match inventory name or catalog
  const lower = key.toLowerCase();
  if (lower.includes('sofa')) return lower.includes('leather') ? 'leather_sofa' : 'fabric_sofa';
  if (lower.includes('carpet') || lower.includes('rug')) return 'carpet';
  if (lower.includes('curtain') || lower.includes('blind')) return 'curtains';
  if (lower.includes('headboard')) return lower.includes('leather') ? 'leather_headboard' : 'fabric_headboard';
  if (lower.includes('cockroach') || lower.includes('pest')) return 'cockroach_control';
  if (lower.includes('termite')) return 'termite_control';
  if (lower.includes('bedbug')) return 'bedbugs_control';
  if (lower.includes('shower') || lower.includes('bath')) return 'bath_shower';
  if (lower.includes('tap') || lower.includes('faucet')) return 'tap_mixer';
  if (lower.includes('toilet') || lower.includes('commode')) return 'toilet';
  if (lower.includes('basin') || lower.includes('sink')) return 'basins_sinks';
  if (lower.includes('drain') || lower.includes('block')) return 'drainage_blockage';
  if (lower.includes('leak')) return 'leakage_connection';
  if (lower.includes('tank') || lower.includes('motor') || lower.includes('pump')) return 'water_tank_motor';
  if (lower.includes('bed')) return 'bed';
  if (lower.includes('table') || lower.includes('desk')) return 'table';
  if (lower.includes('chair')) return 'chair';
  if (lower.includes('door')) return 'door_repair';
  if (lower.includes('wardrobe') || lower.includes('cupboard') || lower.includes('drawer')) return 'cupboard';
  if (lower.includes('cabinet') || lower.includes('hinge') || lower.includes('hydraulic') || lower.includes('fitting')) return 'kitchen_fittings';
  if (lower.includes('fan')) return 'fan';
  if (lower.includes('ac') || lower.includes('air conditioner')) return 'air_conditioner';
  if (lower.includes('wash')) return 'washing_machine';
  if (lower.includes('tv') || lower.includes('television')) return 'television';
  if (lower.includes('fridge') || lower.includes('refrigerator')) return 'refrigerator';
  if (lower.includes('geyser') || lower.includes('heater')) return 'geyser';
  if (lower.includes('purifier') || lower.includes('ro')) return 'water_purifier';
  if (lower.includes('inverter') || lower.includes('battery')) return 'inverter_battery';
  return null;
}

export function isApplianceLinkedService(serviceName) {
  const typeId = getApplianceTypeIdForService(serviceName);
  return !!typeId && CORE_BOOKING_INVENTORY_TYPES.has(typeId);
}

export function getApplianceDisplayName(applianceTypeId) {
  if (!applianceTypeId) return 'Appliance';
  const def = getApplianceById(applianceTypeId);
  return def?.name || 'Appliance';
}

export function filterAppliancesByType(appliances, applianceTypeId) {
  if (!applianceTypeId || !Array.isArray(appliances)) return [];
  return appliances.filter((a) => {
    // 1. Direct type ID match
    if (a.applianceTypeId && a.applianceTypeId === applianceTypeId) return true;
    if (a.typeId && a.typeId === applianceTypeId) return true;

    // If appliance has a different known applianceTypeId, do not cross-match
    if (a.applianceTypeId && a.applianceTypeId !== 'other' && a.applianceTypeId !== applianceTypeId) {
      return false;
    }

    const name = String(a.name || a.displayName || '').toLowerCase();
    const cat = String(a.category || a.serviceName || a.type || '').toLowerCase();
    const full = `${name} ${cat}`;
    const display = getApplianceDisplayName(applianceTypeId).toLowerCase();

    // 2. Air Conditioner: must match air conditioner or word boundary \bac\b (never substring 'ac' inside 'machine')
    if (applianceTypeId === 'air_conditioner') {
      return (
        full.includes('air conditioner') ||
        full.includes('air-conditioner') ||
        full.includes('airconditioner') ||
        /\bac\b/i.test(full) ||
        full.includes('hvac') ||
        full.includes('split ac') ||
        full.includes('window ac')
      );
    }

    // 3. Washing Machine:
    if (applianceTypeId === 'washing_machine') {
      return full.includes('wash') || full.includes('laundry') || full.includes('dryer');
    }

    // 4. Television:
    if (applianceTypeId === 'television') {
      return /\btv\b/i.test(full) || full.includes('television') || full.includes('led tv') || full.includes('oled');
    }

    // 5. Refrigerator:
    if (applianceTypeId === 'refrigerator') {
      return full.includes('fridge') || full.includes('refrigerator') || full.includes('freezer');
    }

    // 6. Generic display name match
    if (display && display !== 'appliance' && full.includes(display)) return true;

    return false;
  });
}
