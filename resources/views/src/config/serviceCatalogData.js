/**
 * Shared service catalog tree — image map injected by caller (Metro vs Node).
 */

export const CATALOG_VERSION = '17-hardcoded-catalog-images';

export function buildServiceCatalog(SERVICE_IMAGES) {
  const item = (name, description, imageKey = 'homeAppliances', extra = {}) => ({
    name,
    description,
    image_url: SERVICE_IMAGES[imageKey] || SERVICE_IMAGES.homeAppliances,
    estimated_time: '30-45 mins',
    ...extra,
  });

  const otherItem = (label = 'Other') =>
    item(label, 'Tell us your specific requirement', 'other', { isOther: true });

  const group = (name, description, imageKey, items) => ({
    name,
    description,
    image_url: SERVICE_IMAGES[imageKey] || SERVICE_IMAGES.homeAppliances,
    items: [...items, otherItem()],
  });

  return [
    {
      id: 'electrician',
      name: 'Electrician',
      description: 'Home & kitchen appliance electrical repairs',
      image_url: SERVICE_IMAGES.electrician,
      groups: [
        group('Home Appliances', 'AC, TV, fans, geyser, wiring & appliance repairs', 'homeAppliances', [
          item('AC', 'Repair, service & installation', 'ac'),
          item('Washing Machine', 'Motor, drainage & spin cycle fixes', 'washingMachine'),
          item('TV', 'Mounting, wiring & display issues', 'tv'),
          item('Air Cooler', 'Motor, pump & cooling pad replacement', 'cooler'),
          item('Geyser', 'Thermostat, heating element & leak fixes', 'geyser'),
          item('Fans', 'Ceiling, exhaust & regulator repairs', 'fan'),
          item('Switch Boards', 'Switch replacement, socket & board wiring', 'switchBoard'),
          item('Plugs & Sockets', '3-pin plug, heavy socket & wiring repair', 'plugsSockets'),
          item('Exhaust Fan', 'Kitchen & bathroom exhaust fan installation', 'exhaust'),
          item('Fan Regulator', 'Regulator replacement & speed control fix', 'regulator'),
          item('Fancy Lights', 'Wall sconce, cove & strip light fitting', 'fancyLight'),
          item('Bulbs & Tubelights', 'LED bulb, holder & batten fitting', 'bulb'),
          item('Chandelier', 'Decorative crystal & pendant light mounting', 'chandelier'),
          item('Doorbell', 'Musical & wireless doorbell installation', 'doorbell'),
          item('CCTV', 'Camera installation, DVR & wiring setup', 'cctv'),
          item('MCB & Main Switch', 'Trip fix, fuse & distribution box setup', 'mcb'),
          item('Home Theatre', 'Speaker, amplifier & AV wiring setup', 'homeTheatre'),
          item('Inverters & Batteries', 'Inverter wiring, battery & backup check', 'inverter'),
          item('Stabilisers', 'Voltage stabiliser repair & connection', 'stabiliser'),
          item('Iron', 'Thermostat & heating element repair', 'iron'),
          item('Vacuum Cleaner', 'Motor, suction & cord repairs', 'vacuumCleaner'),
          item('Trimmer', 'Charging port & motor repair', 'trimmer'),
          item('Projector', 'Ceiling mount, screen & HDMI wiring', 'projector'),
          item('Desktops', 'PC power supply, cabinet & monitor setup', 'desktops'),
        ]),
        group('Kitchen Appliances', 'Refrigerator, stove, microwave, purifier & mixer repairs', 'kitchenAppliances', [
          item('Refrigerator', 'Cooling, gas refill & compressor repair', 'refrigerator'),
          item('Stove', 'Burner, ignition & gas line issues', 'stove'),
          item('Coffee Machine', 'Heating element & pump repairs', 'coffee'),
          item('Microwave', 'Magnetron, turntable & door switch fixes', 'microwave'),
          item('Water Purifiers', 'RO filter, UV membrane & pump servicing', 'waterPurifier'),
          item('Juicer & Mixer', 'Motor, coupler & jar blade repairs', 'juicerMixer'),
        ]),
      ],
    },
    {
      id: 'plumber',
      name: 'Plumber',
      description: 'Bathroom, kitchen & pipeline plumbing services',
      image_url: SERVICE_IMAGES.plumber,
      items: [
        item('Bath & Shower', 'Leak fixes, shower head & mixer repairs', 'bath'),
        item('Tap Mixer', 'Dripping taps, spindle & cartridge replacement', 'tap'),
        item('Toilet', 'Flush, cistern & seat repairs', 'toilet'),
        item('Basins & Sinks', 'Blockage, leak & fitting repairs', 'basin'),
        item('Drainage & Blockage', 'Clog removal, drain cleaning & pipe clearing', 'drainage'),
        item('Leakages & Connections', 'Pipe leak repair, joint sealing & valve fitting', 'leakage'),
        item('Water Tanks & Motors', 'Overhead tank cleaning, pump motor & float switch repair', 'waterTank'),
        otherItem(),
      ],
    },
    {
      id: 'carpenter',
      name: 'Carpenter',
      description: 'Furniture repair & kitchen fitting services',
      image_url: SERVICE_IMAGES.carpenter,
      groups: [
        group('Furniture Repair', 'Bed, sofa, table, chair, door & lock repairs', 'furnitureRepair', [
          item('Bed', 'Frame, headboard & slat repairs', 'bed'),
          item('Sofa', 'Cushion, frame & upholstery fixes', 'sofa'),
          item('Table', 'Leg, top & joint repairs', 'table'),
          item('Chair', 'Leg, seat & backrest repairs', 'chair'),
          item('Door Repair', 'Hinges, alignment & frame repair', 'doorRepair'),
          item('Drawer', 'Channel slider, alignment & handle repair', 'drawer'),
          item('Cupboard Lock', 'Keyhole, latch & lock installation', 'cupboardLock'),
          item('Cupboard', 'Wardrobe door, shelf & panel repair', 'cupboard'),
          item('Door Mesh', 'Mosquito net mesh & frame installation', 'doorMesh'),
          item('Door Closer', 'Hydraulic door closer installation & tuning', 'doorCloser'),
          item('Door Lock', 'Main door lock, latch & handles installation', 'doorLock'),
        ]),
        group('Kitchen Fitting', 'Cabinet hinges, pull-out drawers & hydraulic arms', 'kitchenFitting', [
          item('Cabinet Hinges', 'Soft-close & alignment fixes', 'cabinetHinges'),
          item('Pull Out Drawer', 'Rail, slider & alignment repairs', 'pullOutDrawer'),
          item('Cabinet Hydraulic', 'Hydraulic arm replacement & tuning', 'cabinetHydraulic'),
        ]),
      ],
    },
    {
      id: 'dry-cleaning',
      name: 'Dry Cleaning',
      description: 'Professional sofa, carpet, curtains & upholstery cleaning',
      image_url: SERVICE_IMAGES.dryCleaning,
      items: [
        item('Sofa Fabric', 'Deep steam & stain removal for fabric sofas', 'sofaFabric'),
        item('Leather Sofa', 'Leather conditioning & stain treatment', 'leatherSofa'),
        item('Carpets', 'Deep shampoo & stain removal', 'carpet'),
        item('Fabric Headboards', 'Dry cleaning & deodorizing', 'fabricHeadboard'),
        item('Leather Headboards', 'Leather care & stain removal', 'leatherHeadboard'),
        item('Dining Tables & Chairs', 'Chairs upholstery dry cleaning & table polish', 'diningTable'),
        item('Curtains', 'Steam cleaning, stain removal & hanging', 'curtains'),
        item('Large Chairs', 'Recliner & armchair deep cleaning', 'largeChair'),
        otherItem(),
      ],
    },
    {
      id: 'pest-control',
      name: 'Pest Control',
      description: 'Cockroach, termite & bedbug treatments',
      image_url: SERVICE_IMAGES.pestControl,
      items: [
        item('Cockroach', 'Gel baiting & spray treatment', 'cockroach'),
        item('Termite Control', 'Drill-fill-seal & barrier treatment', 'termite'),
        item('Bedbugs', 'Heat & chemical treatment', 'bedbugs'),
        otherItem(),
      ],
    },
  ];
}
