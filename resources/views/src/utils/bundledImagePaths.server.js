/**
 * Server-side image URLs for the service catalog API (Node/Express).
 * Stable unhashed paths under public/assets/services/catalog/.
 */
const c = (file) => `/assets/services/catalog/${file}`;

export const SERVICE_IMAGES = {
  electrician: c('electrician.png'),
  plumber: c('plumbing.png'),
  carpenter: c('carpenter.png'),
  dryCleaning: c('dry-cleaning.png'),
  pestControl: c('pest-control.png'),
  cleaning: c('dry-cleaning.png'),
  homeAppliances: c('home-appliances.png'),
  kitchenAppliances: c('kitchen-appliances.png'),
  furniture: c('furniture-repair.png'),
  furnitureRepair: c('furniture-repair.png'),
  kitchenFitting: c('kitchen-fittings.png'),
  cabinet: c('cabinet-hinges.png'),

  ac: c('ac.png'),
  washingMachine: c('washing-machine.png'),
  tv: c('tv.png'),
  cooler: c('cooler.png'),
  geyser: c('geyser.png'),
  fan: c('fan.png'),
  fans: c('fan.png'),
  switchBoard: c('switch-board.png'),
  plugsSockets: c('plug.png'),
  exhaust: c('exhaust.png'),
  regulator: c('regulator.png'),
  fancyLight: c('fancy-light.png'),
  light: c('fancy-light.png'),
  bulb: c('bulb.png'),
  chandelier: c('chandelier.png'),
  doorbell: c('doorbell.png'),
  cctv: c('cctv.png'),
  mcb: c('mcb.png'),
  homeTheatre: c('home-theater.png'),
  inverter: c('inverter.png'),
  stabiliser: c('stabiliser.png'),
  iron: c('iron.png'),
  vacuumCleaner: c('vacuum-cleaner.png'),
  trimmer: c('trimmer.png'),
  projector: c('projector.png'),
  desktops: c('desktops.png'),
  elecAppliance: c('home-appliances.png'),

  refrigerator: c('refrigerator.png'),
  stove: c('stove.png'),
  coffee: c('coffee-machine.png'),
  microwave: c('microwave.png'),
  waterPurifier: c('water-purifier.png'),
  ro: c('water-purifier.png'),
  juicerMixer: c('juicer-mixer.png'),
  chimney: c('kitchen-appliances.png'),
  dishwasher: c('kitchen-appliances.png'),

  bath: c('bath-shower.png'),
  tap: c('tap-mixer.png'),
  toilet: c('toilet.png'),
  basin: c('basins-sinks.png'),
  drainage: c('drainage-blockage.png'),
  leakage: c('leakage.png'),
  waterTank: c('water-tank.png'),

  bed: c('bed.png'),
  sofa: c('sofa.png'),
  table: c('table.png'),
  chair: c('chair.png'),
  door: c('door-repair.png'),
  doorRepair: c('door-repair.png'),
  drawer: c('drawer.png'),
  cupboardLock: c('cupboard-lock.png'),
  cupboard: c('cupboard.png'),
  doorMesh: c('door-mesh.png'),
  doorCloser: c('door-closer.png'),
  doorLock: c('door-lock.png'),
  cabinetHinges: c('cabinet-hinges.png'),
  pullOutDrawer: c('pull-out-drawer.png'),
  cabinetHydraulic: c('cabinet-hydraulic.png'),

  sofaFabric: c('fabric-sofa.png'),
  leatherSofa: c('leather-sofa.png'),
  carpet: c('carpet.png'),
  headboard: c('fabric-headboard.png'),
  fabricHeadboard: c('fabric-headboard.png'),
  leatherHeadboard: c('leather-headboard.png'),
  diningTable: c('dining-table.png'),
  curtains: c('curtains.png'),
  largeChair: c('large-chair.png'),

  cockroach: c('Modern Kitchen Pest Control Service.png'),
  termite: c('Professional Termite Treatment Scene.png'),
  bedbugs: c('Zevota Care Bedbug Inspection.png'),

  bathroomClean: c('toilet.png'),
  kitchenClean: c('kitchen-appliances.png'),
  fanClean: c('fan.png'),
  glass: c('curtains.png'),
  other: c('home-appliances.png'),

  heroBanner: '/assets/hero-banner-1.jpg',
  homeHeroBanner: '/assets/hero-banner-1.jpg',
  heroBanner1: '/assets/hero-banner-1.jpg',
  heroBanner2: '/assets/hero-banner-2.jpg',
  heroBanner3: '/assets/hero-banner-3.jpg',
  footerBanner: '/assets/services/footer-banner.jpg',
  homeHeaderBg: '/assets/home-header-bg.jpg',
  amcPlanBg: '/assets/amc-plan-card-bg.jpg',
  amcComplaintsBg: '/assets/amc-complaints-bg.jpg',
  amcMechanicBg: '/assets/amc-mechanic-bg.jpg',
  amcShield3d: '/assets/amc-shield-3d.jpg',
  amcWrench3d: '/assets/amc-wrench-3d.jpg',
  amcMechanic3d: '/assets/amc-mechanic-3d.jpg',
};

export const CATEGORY_IMAGE_FALLBACKS = {
  Electrician: SERVICE_IMAGES.electrician,
  Plumber: SERVICE_IMAGES.plumber,
  Carpenter: SERVICE_IMAGES.carpenter,
  'Dry Cleaning': SERVICE_IMAGES.dryCleaning,
  'Dry Cleaning Services': SERVICE_IMAGES.dryCleaning,
  'dry-cleaning': SERVICE_IMAGES.dryCleaning,
  'Pest Control': SERVICE_IMAGES.pestControl,
  Cleaning: SERVICE_IMAGES.cleaning,
  'Home Appliances': SERVICE_IMAGES.homeAppliances,
  'Kitchen Appliances': SERVICE_IMAGES.kitchenAppliances,
  'Furniture Repair': SERVICE_IMAGES.furnitureRepair,
  'Kitchen Fitting': SERVICE_IMAGES.kitchenFitting,
};

export function getCategoryImageUrl(categoryName) {
  return CATEGORY_IMAGE_FALLBACKS[categoryName] || SERVICE_IMAGES.other;
}

const comp = (file) => `/assets/services/complaints/${file}`;

export const COMPLAINT_CATEGORY_IMAGES = {
  carpenter: comp('carpenter-complaint.png'),
  plumber: comp('plumber-complaint.png'),
  cleaning: comp('cleaning-complaint.png'),
  electrician: comp('electrician-complaint.png'),
  pestControl: comp('pest-control-complaint.png'),
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
