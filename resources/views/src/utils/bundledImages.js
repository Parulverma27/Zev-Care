/** Hardcoded category / subcategory / service images (not editable from admin). */

function getImageUrl(module) {
  const asset = module?.default ?? module;
  if (typeof asset === 'string') return asset;
  if (asset?.uri) return asset.uri;
  return '';
}

export const SERVICE_IMAGES = {
  // Categories
  electrician: getImageUrl(require('../../assets/services/catalog/electrician.png')),
  plumber: getImageUrl(require('../../assets/services/catalog/plumbing.png')),
  carpenter: getImageUrl(require('../../assets/services/catalog/carpenter.png')),
  dryCleaning: getImageUrl(require('../../assets/services/catalog/dry-cleaning.png')),
  pestControl: getImageUrl(require('../../assets/services/catalog/pest-control.png')),

  // Subcategories
  homeAppliances: getImageUrl(require('../../assets/services/catalog/home-appliances.png')),
  kitchenAppliances: getImageUrl(require('../../assets/services/catalog/kitchen-appliances.png')),
  furniture: getImageUrl(require('../../assets/services/catalog/furniture-repair.png')),
  furnitureRepair: getImageUrl(require('../../assets/services/catalog/furniture-repair.png')),
  kitchenFitting: getImageUrl(require('../../assets/services/catalog/kitchen-fittings.png')),
  cabinet: getImageUrl(require('../../assets/services/catalog/cabinet-hinges.png')),

  // Home appliances / electrical services
  ac: getImageUrl(require('../../assets/services/catalog/ac.png')),
  washingMachine: getImageUrl(require('../../assets/services/catalog/washing-machine.png')),
  tv: getImageUrl(require('../../assets/services/catalog/tv.png')),
  cooler: getImageUrl(require('../../assets/services/catalog/cooler.png')),
  geyser: getImageUrl(require('../../assets/services/catalog/geyser.png')),
  fan: getImageUrl(require('../../assets/services/catalog/fan.png')),
  fans: getImageUrl(require('../../assets/services/catalog/fan.png')),
  switchBoard: getImageUrl(require('../../assets/services/catalog/switch-board.png')),
  plugsSockets: getImageUrl(require('../../assets/services/catalog/plug.png')),
  exhaust: getImageUrl(require('../../assets/services/catalog/exhaust.png')),
  regulator: getImageUrl(require('../../assets/services/catalog/regulator.png')),
  fancyLight: getImageUrl(require('../../assets/services/catalog/fancy-light.png')),
  light: getImageUrl(require('../../assets/services/catalog/fancy-light.png')),
  bulb: getImageUrl(require('../../assets/services/catalog/bulb.png')),
  chandelier: getImageUrl(require('../../assets/services/catalog/chandelier.png')),
  doorbell: getImageUrl(require('../../assets/services/catalog/doorbell.png')),
  cctv: getImageUrl(require('../../assets/services/catalog/cctv.png')),
  mcb: getImageUrl(require('../../assets/services/catalog/mcb.png')),
  homeTheatre: getImageUrl(require('../../assets/services/catalog/home-theater.png')),
  inverter: getImageUrl(require('../../assets/services/catalog/inverter.png')),
  stabiliser: getImageUrl(require('../../assets/services/catalog/stabiliser.png')),
  iron: getImageUrl(require('../../assets/services/catalog/iron.png')),
  vacuumCleaner: getImageUrl(require('../../assets/services/catalog/vacuum-cleaner.png')),
  trimmer: getImageUrl(require('../../assets/services/catalog/trimmer.png')),
  projector: getImageUrl(require('../../assets/services/catalog/projector.png')),
  desktops: getImageUrl(require('../../assets/services/catalog/desktops.png')),
  elecAppliance: getImageUrl(require('../../assets/services/catalog/home-appliances.png')),

  // Kitchen appliances
  refrigerator: getImageUrl(require('../../assets/services/catalog/refrigerator.png')),
  stove: getImageUrl(require('../../assets/services/catalog/stove.png')),
  coffee: getImageUrl(require('../../assets/services/catalog/coffee-machine.png')),
  microwave: getImageUrl(require('../../assets/services/catalog/microwave.png')),
  waterPurifier: getImageUrl(require('../../assets/services/catalog/water-purifier.png')),
  ro: getImageUrl(require('../../assets/services/catalog/water-purifier.png')),
  juicerMixer: getImageUrl(require('../../assets/services/catalog/juicer-mixer.png')),
  chimney: getImageUrl(require('../../assets/services/catalog/kitchen-appliances.png')),
  dishwasher: getImageUrl(require('../../assets/services/catalog/kitchen-appliances.png')),

  // Plumbing
  bath: getImageUrl(require('../../assets/services/catalog/bath-shower.png')),
  tap: getImageUrl(require('../../assets/services/catalog/tap-mixer.png')),
  toilet: getImageUrl(require('../../assets/services/catalog/toilet.png')),
  basin: getImageUrl(require('../../assets/services/catalog/basins-sinks.png')),
  drainage: getImageUrl(require('../../assets/services/catalog/drainage-blockage.png')),
  leakage: getImageUrl(require('../../assets/services/catalog/leakage.png')),
  waterTank: getImageUrl(require('../../assets/services/catalog/water-tank.png')),

  // Carpentry
  bed: getImageUrl(require('../../assets/services/catalog/bed.png')),
  sofa: getImageUrl(require('../../assets/services/catalog/sofa.png')),
  table: getImageUrl(require('../../assets/services/catalog/table.png')),
  chair: getImageUrl(require('../../assets/services/catalog/chair.png')),
  door: getImageUrl(require('../../assets/services/catalog/door-repair.png')),
  doorRepair: getImageUrl(require('../../assets/services/catalog/door-repair.png')),
  drawer: getImageUrl(require('../../assets/services/catalog/drawer.png')),
  cupboardLock: getImageUrl(require('../../assets/services/catalog/cupboard-lock.png')),
  cupboard: getImageUrl(require('../../assets/services/catalog/cupboard.png')),
  doorMesh: getImageUrl(require('../../assets/services/catalog/door-mesh.png')),
  doorCloser: getImageUrl(require('../../assets/services/catalog/door-closer.png')),
  doorLock: getImageUrl(require('../../assets/services/catalog/door-lock.png')),
  cabinetHinges: getImageUrl(require('../../assets/services/catalog/cabinet-hinges.png')),
  pullOutDrawer: getImageUrl(require('../../assets/services/catalog/pull-out-drawer.png')),
  cabinetHydraulic: getImageUrl(require('../../assets/services/catalog/cabinet-hydraulic.png')),

  // Dry cleaning
  sofaFabric: getImageUrl(require('../../assets/services/catalog/fabric-sofa.png')),
  leatherSofa: getImageUrl(require('../../assets/services/catalog/leather-sofa.png')),
  carpet: getImageUrl(require('../../assets/services/catalog/carpet.png')),
  headboard: getImageUrl(require('../../assets/services/catalog/fabric-headboard.png')),
  fabricHeadboard: getImageUrl(require('../../assets/services/catalog/fabric-headboard.png')),
  leatherHeadboard: getImageUrl(require('../../assets/services/catalog/leather-headboard.png')),
  diningTable: getImageUrl(require('../../assets/services/catalog/dining-table.png')),
  curtains: getImageUrl(require('../../assets/services/catalog/curtains.png')),
  largeChair: getImageUrl(require('../../assets/services/catalog/large-chair.png')),

  // Pest
  cockroach: getImageUrl(require('../../assets/services/catalog/Modern Kitchen Pest Control Service.png')),
  termite: getImageUrl(require('../../assets/services/catalog/Professional Termite Treatment Scene.png')),
  bedbugs: getImageUrl(require('../../assets/services/catalog/Zevota Care Bedbug Inspection.png')),

  // Misc / legacy keys
  cleaning: getImageUrl(require('../../assets/services/catalog/dry-cleaning.png')),
  bathroomClean: getImageUrl(require('../../assets/services/catalog/toilet.png')),
  kitchenClean: getImageUrl(require('../../assets/services/catalog/kitchen-appliances.png')),
  fanClean: getImageUrl(require('../../assets/services/catalog/fan.png')),
  glass: getImageUrl(require('../../assets/services/catalog/curtains.png')),
  other: getImageUrl(require('../../assets/services/catalog/home-appliances.png')),

  // Banners & Slideshows (promotional — hardcoded)
  heroBanner: getImageUrl(require('../../assets/hero-banner-1.png')),
  homeHeroBanner: getImageUrl(require('../../assets/hero-banner-1.png')),
  heroBanner1: getImageUrl(require('../../assets/hero-banner-1.png')),
  heroBanner2: getImageUrl(require('../../assets/hero-banner-2.png')),
  heroBanner3: getImageUrl(require('../../assets/hero-banner-3.png')),
  footerBanner: getImageUrl(require('../../assets/services/footer-banner.jpg')),
  myAppliancesHero: getImageUrl(require('../../assets/my-appliances-hero.jpg')),
  homeHeaderBg: getImageUrl(require('../../assets/home-header-bg.jpg')),
  amcPlanBg: getImageUrl(require('../../assets/amc-plan-card-bg.jpg')),
  amcComplaintsBg: getImageUrl(require('../../assets/amc-complaints-bg.jpg')),
  amcMechanicBg: getImageUrl(require('../../assets/amc-mechanic-bg.jpg')),
  amcShield3d: getImageUrl(require('../../assets/amc-shield-3d.jpg')),
  amcWrench3d: getImageUrl(require('../../assets/amc-wrench-3d.jpg')),
  amcMechanic3d: getImageUrl(require('../../assets/amc-mechanic-3d.jpg')),

  // Login / Register Slideshow Images (login 1-4)
  loginSlide1: getImageUrl(require('../../assets/login-1.png')),
  loginSlide2: getImageUrl(require('../../assets/login-2.png')),
  loginSlide3: getImageUrl(require('../../assets/login-3.png')),
  loginSlide4: getImageUrl(require('../../assets/login-4.png')),
};

/** Display-name → hardcoded image for every catalog service item */
export const SERVICE_ITEM_IMAGE_KEYS = {
  AC: SERVICE_IMAGES.ac,
  'Washing Machine': SERVICE_IMAGES.washingMachine,
  TV: SERVICE_IMAGES.tv,
  'Air Cooler': SERVICE_IMAGES.cooler,
  Geyser: SERVICE_IMAGES.geyser,
  Fans: SERVICE_IMAGES.fan,
  'Switch Boards': SERVICE_IMAGES.switchBoard,
  'Plugs & Sockets': SERVICE_IMAGES.plugsSockets,
  'Exhaust Fan': SERVICE_IMAGES.exhaust,
  'Fan Regulator': SERVICE_IMAGES.regulator,
  'Fancy Lights': SERVICE_IMAGES.fancyLight,
  'Bulbs & Tubelights': SERVICE_IMAGES.bulb,
  Chandelier: SERVICE_IMAGES.chandelier,
  Doorbell: SERVICE_IMAGES.doorbell,
  CCTV: SERVICE_IMAGES.cctv,
  'MCB & Main Switch': SERVICE_IMAGES.mcb,
  'Home Theatre': SERVICE_IMAGES.homeTheatre,
  'Inverters & Batteries': SERVICE_IMAGES.inverter,
  Stabilisers: SERVICE_IMAGES.stabiliser,
  Iron: SERVICE_IMAGES.iron,
  'Vacuum Cleaner': SERVICE_IMAGES.vacuumCleaner,
  Trimmer: SERVICE_IMAGES.trimmer,
  Projector: SERVICE_IMAGES.projector,
  Desktops: SERVICE_IMAGES.desktops,

  Refrigerator: SERVICE_IMAGES.refrigerator,
  Stove: SERVICE_IMAGES.stove,
  'Coffee Machine': SERVICE_IMAGES.coffee,
  Microwave: SERVICE_IMAGES.microwave,
  'Water Purifiers': SERVICE_IMAGES.waterPurifier,
  'Juicer & Mixer': SERVICE_IMAGES.juicerMixer,

  'Bath & Shower': SERVICE_IMAGES.bath,
  'Tap Mixer': SERVICE_IMAGES.tap,
  Toilet: SERVICE_IMAGES.toilet,
  'Basins & Sinks': SERVICE_IMAGES.basin,
  'Drainage & Blockage': SERVICE_IMAGES.drainage,
  'Leakages & Connections': SERVICE_IMAGES.leakage,
  'Water Tanks & Motors': SERVICE_IMAGES.waterTank,

  Bed: SERVICE_IMAGES.bed,
  Sofa: SERVICE_IMAGES.sofa,
  Table: SERVICE_IMAGES.table,
  Chair: SERVICE_IMAGES.chair,
  'Door Repair': SERVICE_IMAGES.doorRepair,
  Drawer: SERVICE_IMAGES.drawer,
  'Cupboard Lock': SERVICE_IMAGES.cupboardLock,
  Cupboard: SERVICE_IMAGES.cupboard,
  'Door Mesh': SERVICE_IMAGES.doorMesh,
  'Door Closer': SERVICE_IMAGES.doorCloser,
  'Door Lock': SERVICE_IMAGES.doorLock,
  'Cabinet Hinges': SERVICE_IMAGES.cabinetHinges,
  'Pull Out Drawer': SERVICE_IMAGES.pullOutDrawer,
  'Cabinet Hydraulic': SERVICE_IMAGES.cabinetHydraulic,

  'Sofa Fabric': SERVICE_IMAGES.sofaFabric,
  'Leather Sofa': SERVICE_IMAGES.leatherSofa,
  Carpets: SERVICE_IMAGES.carpet,
  'Fabric Headboards': SERVICE_IMAGES.fabricHeadboard,
  'Leather Headboards': SERVICE_IMAGES.leatherHeadboard,
  'Dining Tables & Chairs': SERVICE_IMAGES.diningTable,
  Curtains: SERVICE_IMAGES.curtains,
  'Large Chairs': SERVICE_IMAGES.largeChair,

  Cockroach: SERVICE_IMAGES.cockroach,
  'Cockroach Control': SERVICE_IMAGES.cockroach,
  'Termite Control': SERVICE_IMAGES.termite,
  Bedbugs: SERVICE_IMAGES.bedbugs,
  'Bed Bugs Control': SERVICE_IMAGES.bedbugs,

  Other: SERVICE_IMAGES.other,
};

export const CATEGORY_IMAGE_FALLBACKS = {
  Electrician: SERVICE_IMAGES.electrician,
  Electrical: SERVICE_IMAGES.electrician,
  'Electrical Services': SERVICE_IMAGES.electrician,

  Plumber: SERVICE_IMAGES.plumber,
  Plumbing: SERVICE_IMAGES.plumber,
  'Plumbing Services': SERVICE_IMAGES.plumber,

  Carpenter: SERVICE_IMAGES.carpenter,
  Carpentry: SERVICE_IMAGES.carpenter,
  'Carpentry Services': SERVICE_IMAGES.carpenter,

  'Dry Cleaning': SERVICE_IMAGES.dryCleaning,
  'Dry Cleaning Services': SERVICE_IMAGES.dryCleaning,
  'dry-cleaning': SERVICE_IMAGES.dryCleaning,
  'Pest Control': SERVICE_IMAGES.pestControl,
  'Pest & Bug Control': SERVICE_IMAGES.pestControl,

  Cleaning: SERVICE_IMAGES.cleaning,
  'Cleaning Services': SERVICE_IMAGES.cleaning,

  'Home Appliances': SERVICE_IMAGES.homeAppliances,
  'Kitchen Appliances': SERVICE_IMAGES.kitchenAppliances,
  'Furniture Repair': SERVICE_IMAGES.furnitureRepair,
  'Kitchen Fitting': SERVICE_IMAGES.kitchenFitting,

  'AC Services': SERVICE_IMAGES.ac,
  'AC Service': SERVICE_IMAGES.ac,
  'Air Conditioner': SERVICE_IMAGES.ac,
  'Washing Machine': SERVICE_IMAGES.washingMachine,
  Refrigerator: SERVICE_IMAGES.refrigerator,
  TV: SERVICE_IMAGES.tv,
};

export function getCategoryImageUrl(categoryName) {
  return CATEGORY_IMAGE_FALLBACKS[categoryName] || SERVICE_IMAGES.other;
}

export const COMPLAINT_CATEGORY_IMAGES = {
  carpenter: getImageUrl(require('../../assets/services/complaints/carpenter-complaint.png')),
  plumber: getImageUrl(require('../../assets/services/complaints/plumber-complaint.png')),
  cleaning: getImageUrl(require('../../assets/services/complaints/cleaning-complaint.png')),
  electrician: getImageUrl(require('../../assets/services/complaints/electrician-complaint.png')),
  pestControl: getImageUrl(require('../../assets/services/complaints/pest-control-complaint.png')),
};

export const COMPLAINT_CATEGORY_IMAGE_FALLBACKS = {
  Electrician: COMPLAINT_CATEGORY_IMAGES.electrician,
  Electrical: COMPLAINT_CATEGORY_IMAGES.electrician,
  'Electrical Services': COMPLAINT_CATEGORY_IMAGES.electrician,
  'Electrician & Wiring': COMPLAINT_CATEGORY_IMAGES.electrician,
  'AC Service & Repair': COMPLAINT_CATEGORY_IMAGES.electrician,
  electrician: COMPLAINT_CATEGORY_IMAGES.electrician,

  Plumber: COMPLAINT_CATEGORY_IMAGES.plumber,
  Plumbing: COMPLAINT_CATEGORY_IMAGES.plumber,
  'Plumbing Services': COMPLAINT_CATEGORY_IMAGES.plumber,
  'Plumbing & Leak Fix': COMPLAINT_CATEGORY_IMAGES.plumber,
  plumber: COMPLAINT_CATEGORY_IMAGES.plumber,

  Carpenter: COMPLAINT_CATEGORY_IMAGES.carpenter,
  Carpentry: COMPLAINT_CATEGORY_IMAGES.carpenter,
  'Carpentry Services': COMPLAINT_CATEGORY_IMAGES.carpenter,
  'Carpenter & Furniture': COMPLAINT_CATEGORY_IMAGES.carpenter,
  carpenter: COMPLAINT_CATEGORY_IMAGES.carpenter,

  'Dry Cleaning': COMPLAINT_CATEGORY_IMAGES.cleaning,
  'Dry Cleaning Services': COMPLAINT_CATEGORY_IMAGES.cleaning,
  'dry-cleaning': COMPLAINT_CATEGORY_IMAGES.cleaning,
  Cleaning: COMPLAINT_CATEGORY_IMAGES.cleaning,
  'Cleaning Services': COMPLAINT_CATEGORY_IMAGES.cleaning,
  'Sofa Cleaning': COMPLAINT_CATEGORY_IMAGES.cleaning,
  cleaning: COMPLAINT_CATEGORY_IMAGES.cleaning,

  'Pest Control': COMPLAINT_CATEGORY_IMAGES.pestControl,
  'Pest Control Services': COMPLAINT_CATEGORY_IMAGES.pestControl,
  'pest-control': COMPLAINT_CATEGORY_IMAGES.pestControl,
  pestcontrol: COMPLAINT_CATEGORY_IMAGES.pestControl,
  'Pest & Insects': COMPLAINT_CATEGORY_IMAGES.pestControl,
  pest: COMPLAINT_CATEGORY_IMAGES.pestControl,
  cockroach: COMPLAINT_CATEGORY_IMAGES.pestControl,
  termite: COMPLAINT_CATEGORY_IMAGES.pestControl,
  bedbugs: COMPLAINT_CATEGORY_IMAGES.pestControl,
};

export function getComplaintCategoryImageUrl(categoryName) {
  if (!categoryName || typeof categoryName !== 'string') return null;
  const trimmed = categoryName.trim();
  if (COMPLAINT_CATEGORY_IMAGE_FALLBACKS[trimmed]) {
    return COMPLAINT_CATEGORY_IMAGE_FALLBACKS[trimmed];
  }
  const lower = trimmed.toLowerCase();
  if (lower.includes('carpenter') || lower.includes('carpentr')) {
    return COMPLAINT_CATEGORY_IMAGES.carpenter;
  }
  if (lower.includes('plumb')) {
    return COMPLAINT_CATEGORY_IMAGES.plumber;
  }
  if (lower.includes('clean') || lower.includes('sofa')) {
    return COMPLAINT_CATEGORY_IMAGES.cleaning;
  }
  if (lower.includes('electr') || lower.includes('technician')) {
    return COMPLAINT_CATEGORY_IMAGES.electrician;
  }
  if (
    lower.includes('pest') ||
    lower.includes('cockroach') ||
    lower.includes('termite') ||
    lower.includes('bedbug') ||
    lower.includes('insect')
  ) {
    return COMPLAINT_CATEGORY_IMAGES.pestControl;
  }
  return null;
}

export function getHardcodedCatalogImage(name) {
  if (!name) return SERVICE_IMAGES.other;
  return (
    CATEGORY_IMAGE_FALLBACKS[name] ||
    SERVICE_ITEM_IMAGE_KEYS[name] ||
    SERVICE_IMAGES.other
  );
}
