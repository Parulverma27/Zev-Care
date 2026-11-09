/**
 * Central specification catalog for appliances, fixtures, furniture, and services.
 * Tailored fields for Electrician, Plumber, Carpenter, Dry Cleaning, and Pest Control.
 */
import { SERVICE_IMAGES } from '../utils/bundledImages';
import { TOP_APPLIANCE_IDS, MEDIA_REQUIREMENTS } from './applianceConstants';

const commonLocation = {
  id: 'location',
  label: 'Location in Home',
  type: 'text',
  required: true,
  placeholder: 'e.g. Master Bedroom, Kitchen, Living Room',
};

const commonYear = {
  id: 'year',
  label: 'Age / Purchase Year',
  type: 'text',
  required: true,
  placeholder: 'e.g. 2 years old or 2023',
  keyboardType: 'default',
};

const commonBrand = {
  id: 'brand',
  label: 'Company / Brand',
  type: 'brand',
  required: true,
};

const commonNotes = {
  id: 'notes',
  label: 'Additional details',
  type: 'textarea',
  required: false,
  maxLength: 120,
  placeholder: 'Any specific instructions, model number, or extra notes',
};

const commonName = (defaultPlaceholder = 'e.g. Master Bedroom AC') => ({
  id: 'displayName',
  label: 'Item / Appliance Name',
  type: 'text',
  required: true,
  placeholder: defaultPlaceholder,
});

function entry(def) {
  return {
    category: def.category || 'home_appliance',
    media: { ...MEDIA_REQUIREMENTS },
    ...def,
    fields: def.fields || [],
    image: SERVICE_IMAGES[def.imageKey] || SERVICE_IMAGES.homeAppliances,
  };
}

export const APPLIANCE_CATALOG = [
  // ==========================================
  // 1. ELECTRICIAN & HOME APPLIANCES
  // ==========================================
  entry({
    id: 'air_conditioner',
    name: 'Air Conditioner',
    aliases: ['ac', 'air conditioner', 'split ac', 'window ac', 'inverter ac', 'compressor (ac)', 'compressor'],
    imageKey: 'ac',
    fields: [
      commonName('e.g. Living Room Split AC'),
      commonBrand,
      {
        id: 'type',
        label: 'AC Type',
        type: 'select',
        required: true,
        options: ['Split Inverter AC', 'Split Non-Inverter', 'Window AC', 'Cassette AC', 'Tower AC'],
      },
      {
        id: 'capacity',
        label: 'Tonnage / Capacity',
        type: 'select',
        required: true,
        options: ['1 Ton', '1.5 Ton', '2 Ton', '2.5 Ton+'],
      },
      commonYear,
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'refrigerator',
    name: 'Refrigerator',
    aliases: ['fridge', 'freezer', 'refrigerator'],
    imageKey: 'refrigerator',
    fields: [
      commonName('e.g. Kitchen Refrigerator'),
      commonBrand,
      {
        id: 'type',
        label: 'Door Type',
        type: 'select',
        required: true,
        options: ['Single Door', 'Double Door (Frost Free)', 'Triple Door', 'Side-by-Side', 'French Door'],
      },
      {
        id: 'capacity',
        label: 'Storage Capacity',
        type: 'select',
        required: true,
        options: ['Up to 190 L', '190–260 L', '260–350 L', '350–500 L', '500 L+'],
      },
      commonYear,
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'washing_machine',
    name: 'Washing Machine',
    aliases: ['washer', 'laundry', 'washing machine'],
    imageKey: 'washingMachine',
    fields: [
      commonName('e.g. Balcony Washing Machine'),
      commonBrand,
      {
        id: 'type',
        label: 'Machine Type',
        type: 'select',
        required: true,
        options: ['Fully Automatic Front Load', 'Fully Automatic Top Load', 'Semi-Automatic Twin Tub'],
      },
      {
        id: 'capacity',
        label: 'Load Capacity',
        type: 'select',
        required: true,
        options: ['6 kg', '6.5 kg', '7 kg', '7.5 kg', '8 kg', '8.5 kg+', '10 kg+'],
      },
      commonYear,
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'television',
    name: 'Television',
    aliases: ['tv', 'smart tv', 'led tv', 'oled', 'television'],
    imageKey: 'tv',
    fields: [
      commonName('e.g. Living Room TV'),
      commonBrand,
      {
        id: 'type',
        label: 'Screen Technology',
        type: 'select',
        required: true,
        options: ['4K Smart LED', 'OLED', 'QLED', 'Full HD Smart TV', 'Standard LED'],
      },
      {
        id: 'capacity',
        label: 'Screen Size',
        type: 'select',
        required: true,
        options: ['32 Inch', '43 Inch', '50 Inch', '55 Inch', '65 Inch', '75 Inch+'],
      },
      commonYear,
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'microwave',
    name: 'Microwave',
    aliases: ['oven', 'microwave oven', 'microwave'],
    imageKey: 'microwave',
    fields: [
      commonName('e.g. Kitchen Microwave Oven'),
      commonBrand,
      {
        id: 'type',
        label: 'Oven Type',
        type: 'select',
        required: true,
        options: ['Convection (Baking & Grilling)', 'Grill Microwave', 'Solo Microwave', 'Built-in OTG'],
      },
      {
        id: 'capacity',
        label: 'Chamber Volume',
        type: 'select',
        required: true,
        options: ['20 Litres', '23–25 Litres', '28–30 Litres', '32 Litres+'],
      },
      commonYear,
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'geyser',
    name: 'Geyser',
    aliases: ['water heater', 'geyser'],
    imageKey: 'geyser',
    fields: [
      commonName('e.g. Master Bathroom Geyser'),
      commonBrand,
      {
        id: 'type',
        label: 'Geyser Type',
        type: 'select',
        required: true,
        options: ['Electric Storage Geyser', 'Instant Water Heater (3L)', 'Gas Geyser', 'Solar Water Heater Tank'],
      },
      {
        id: 'capacity',
        label: 'Water Capacity',
        type: 'select',
        required: true,
        options: ['3 Litres (Instant)', '6 Litres', '10 Litres', '15 Litres', '25 Litres', '35 Litres+'],
      },
      commonYear,
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'air_cooler',
    name: 'Air Cooler',
    aliases: ['cooler', 'desert cooler', 'air cooler'],
    imageKey: 'cooler',
    fields: [
      commonName('e.g. Hall Desert Cooler'),
      commonBrand,
      {
        id: 'type',
        label: 'Cooler Type',
        type: 'select',
        required: true,
        options: ['Desert Cooler (Heavy)', 'Personal / Room Cooler', 'Tower Sleek Cooler', 'Window Cooler'],
      },
      {
        id: 'capacity',
        label: 'Water Tank Size',
        type: 'select',
        required: false,
        options: ['20–35 Litres', '40–55 Litres', '60–75 Litres', '85 Litres+'],
      },
      commonYear,
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'fan',
    name: 'Fan',
    aliases: ['ceiling fan', 'exhaust fan', 'fans', 'fan'],
    imageKey: 'fan',
    fields: [
      commonName('e.g. Bedroom Ceiling Fan'),
      commonBrand,
      {
        id: 'type',
        label: 'Fan Type',
        type: 'select',
        required: true,
        options: ['Ceiling Fan', 'BLDC Energy Saver Smart Fan', 'Exhaust Fan', 'Wall Mount Fan', 'Pedestal Stand Fan'],
      },
      {
        id: 'capacity',
        label: 'Blade Sweep Size',
        type: 'select',
        required: false,
        options: ['1200 mm (Standard 48")', '1400 mm (56")', '900 mm (36")', '600 mm (24" High Speed)'],
      },
      commonYear,
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'water_purifier',
    name: 'Water Purifier',
    aliases: ['purifier', 'aqua guard', 'water filter', 'water purifiers', 'ro'],
    imageKey: 'waterPurifier',
    fields: [
      commonName('e.g. Kitchen Water Purifier'),
      commonBrand,
      {
        id: 'type',
        label: 'Purification Technology',
        type: 'select',
        required: true,
        options: ['RO + UV + UF + TDS Controller', 'RO + Mineralizer', 'UV + UF (Non-RO)', 'Alkaline Water Purifier'],
      },
      commonYear,
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'inverter_battery',
    name: 'Inverters & Batteries',
    aliases: ['inverter', 'inverters & batteries', 'battery'],
    imageKey: 'inverter',
    fields: [
      commonName('e.g. Home Backup Inverter Set'),
      commonBrand,
      {
        id: 'type',
        label: 'Inverter Capacity',
        type: 'select',
        required: true,
        options: ['850 VA – 900 VA (Single Battery)', '1050 VA – 1150 VA', '1500 VA – 2000 VA (Double Battery)', '3.5 kVA Solar Inverter'],
      },
      {
        id: 'capacity',
        label: 'Battery Specification',
        type: 'select',
        required: true,
        options: ['150 Ah Tall Tubular', '200 Ah Tall Tubular', '220 Ah Heavy Duty', '100–120 Ah Short Tubular', 'Lithium-Ion Pack'],
      },
      commonYear,
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'switch_board',
    name: 'Switch Boards',
    aliases: ['switch board', 'switch boards', 'switches', 'plugs & sockets', 'fan regulator', 'switch_board', 'plugs_sockets', 'fan_regulator'],
    imageKey: 'switchBoard',
    fields: [
      commonName('e.g. Living Room Main Switchboard'),
      commonBrand,
      {
        id: 'type',
        label: 'Board Module Size / Component',
        type: 'select',
        required: true,
        options: ['2–4 Module Board', '6–8 Module Board', '12 Module Master Board', '18 Module Large Board', '16A / 25A AC Power Socket Box', 'Step Fan Regulator Unit'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'cctv',
    name: 'CCTV Camera',
    aliases: ['cctv', 'camera', 'security camera'],
    imageKey: 'cctv',
    fields: [
      commonName('e.g. Entrance Gate CCTV Camera'),
      commonBrand,
      {
        id: 'type',
        label: 'Camera Type',
        type: 'select',
        required: true,
        options: ['Indoor Dome Camera', 'Outdoor Weatherproof Bullet', '360° PTZ Rotating Camera', 'WiFi Smart Battery Camera'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'stove',
    name: 'Stove',
    aliases: ['gas stove', 'cooktop', 'hob', 'stove'],
    imageKey: 'stove',
    fields: [
      commonName('e.g. Kitchen Gas Stove'),
      commonBrand,
      {
        id: 'type',
        label: 'Burner Configuration',
        type: 'select',
        required: true,
        options: ['2-Burner Glass Top', '3-Burner Glass Top', '4-Burner Glass Top', 'Built-in Kitchen Hob', 'Induction Cooktop (Electric)'],
      },
      commonYear,
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'coffee_machine',
    name: 'Coffee Machine',
    aliases: ['coffee maker', 'espresso', 'coffee machine'],
    imageKey: 'coffee',
    fields: [
      commonName('e.g. Countertop Coffee Maker'),
      commonBrand,
      {
        id: 'type',
        label: 'Machine Type',
        type: 'select',
        required: true,
        options: ['Espresso Pump Machine', 'Capsule / Pod Machine', 'Drip Filter Coffee Maker', 'Automatic Bean-to-Cup'],
      },
      commonYear,
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'juicer_mixer',
    name: 'Juicer & Mixer',
    aliases: ['mixer', 'juicer', 'juicer & mixer', 'grinder'],
    imageKey: 'juicerMixer',
    fields: [
      commonName('e.g. Kitchen Mixer Grinder'),
      commonBrand,
      {
        id: 'type',
        label: 'Mixer Type',
        type: 'select',
        required: true,
        options: ['3-Jar Mixer Grinder (500W-750W)', 'Heavy Duty 4-Jar (1000W)', 'Juicer Mixer Grinder (JMG)', 'Cold Press Slow Juicer', 'Nutri-Blender Bullet'],
      },
      commonYear,
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'home_theatre',
    name: 'Home Theatre',
    aliases: ['home theatre', 'soundbar', 'speakers', 'audio system', 'projector'],
    imageKey: 'homeTheatre',
    fields: [
      commonName('e.g. Living Room Surround System'),
      commonBrand,
      {
        id: 'type',
        label: 'Setup Configuration',
        type: 'select',
        required: true,
        options: ['Soundbar with Wireless Subwoofer', '5.1 Channel Home Theatre System', '7.1 Dolby Atmos Setup', 'Tower Party Speakers', 'Home Theatre 4K Projector'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'stabiliser',
    name: 'Stabilisers',
    aliases: ['stabiliser', 'stabilisers', 'voltage stabiliser'],
    imageKey: 'stabiliser',
    fields: [
      commonName('e.g. AC Voltage Stabiliser'),
      commonBrand,
      {
        id: 'type',
        label: 'Appliance Rating',
        type: 'select',
        required: true,
        options: ['For 1.5 Ton AC (4 kVA)', 'For 2 Ton AC (5 kVA)', 'For Refrigerator / Deep Freezer', 'For Mainline Whole House (10 kVA)'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'vacuum_cleaner',
    name: 'Vacuum Cleaner',
    aliases: ['vacuum cleaner', 'vacuum', 'iron', 'trimmer', 'desktops'],
    imageKey: 'vacuumCleaner',
    fields: [
      commonName('e.g. Cordless Stick Vacuum'),
      commonBrand,
      {
        id: 'type',
        label: 'Appliance / Device Type',
        type: 'select',
        required: true,
        options: ['Cordless Handheld / Stick Vacuum', 'Robot Vacuum & Mop Cleaner', 'Canister Bagless Vacuum', 'Steam / Dry Iron Box', 'All-in-One PC / Desktop Rig'],
      },
      commonYear,
      commonLocation,
      commonNotes,
    ],
  }),

  // ==========================================
  // 2. PLUMBER & SANITARY FIXTURES
  // ==========================================
  entry({
    id: 'bath_shower',
    name: 'Bath & Shower',
    aliases: ['bath', 'shower', 'bath & shower'],
    imageKey: 'bath',
    fields: [
      commonName('e.g. Master Bathroom Rain Shower'),
      commonBrand,
      {
        id: 'type',
        label: 'Fitting Type',
        type: 'select',
        required: true,
        options: ['Overhead Rain Shower Set', 'Hand Shower with Hose', 'Concealed Diverter Mixer', 'Multi-Jet Shower Panel', 'Bathtub Filler Spout'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'tap_mixer',
    name: 'Tap Mixer',
    aliases: ['tap', 'faucet', 'tap mixer'],
    imageKey: 'tap',
    fields: [
      commonName('e.g. Kitchen Sink Mixer Tap'),
      commonBrand,
      {
        id: 'type',
        label: 'Tap / Faucet Type',
        type: 'select',
        required: true,
        options: ['Single Lever Basin Mixer (Hot & Cold)', 'Wall Mixer with Crutch / L-Bend', 'Quarter Turn Bib Tap', 'Long Body Pillar Tap', 'Automatic Sensor Faucet'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'toilet',
    name: 'Toilet',
    aliases: ['toilet', 'commode', 'wc'],
    imageKey: 'toilet',
    fields: [
      commonName('e.g. Master Toilet Commode'),
      commonBrand,
      {
        id: 'type',
        label: 'Toilet / Commode Model',
        type: 'select',
        required: true,
        options: ['Wall-Hung Western Commode', 'Floor-Mounted One-Piece Commode', 'Two-Piece European Water Closet', 'Concealed In-Wall Flush Cistern Tank', 'Indian Asian Squat Pan'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'basins_sinks',
    name: 'Basins & Sinks',
    aliases: ['basin', 'sink', 'basins & sinks', 'wash basin'],
    imageKey: 'basin',
    fields: [
      commonName('e.g. Dining Area Wash Basin'),
      {
        id: 'type',
        label: 'Basin / Sink Type',
        type: 'select',
        required: true,
        options: ['Tabletop Ceramic Vanity Basin', 'Under-Counter Oval Basin', 'Stainless Steel Kitchen Sink (Single Bowl)', 'Double Bowl Sink with Drainboard', 'Quartz / Granite Kitchen Sink'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'drainage_blockage',
    name: 'Drainage & Blockage',
    aliases: ['drainage', 'drainage & blockage', 'drain', 'blockage'],
    imageKey: 'drainage',
    fields: [
      commonName('e.g. Bathroom Floor Drain Trap'),
      {
        id: 'type',
        label: 'Drainage Area',
        type: 'select',
        required: true,
        options: ['Bathroom Floor Trap / Nahani Trap', 'Kitchen Sink Waste Pipeline', 'Main Sewer Waste Chamber', 'Terrace Rainwater Downpipe'],
      },
      {
        id: 'capacity',
        label: 'Blockage Severity',
        type: 'select',
        required: true,
        options: ['Slow Water Draining', 'Complete Solid Clog / Overflow', 'Persistent Sewer Odour / Gas Leak'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'leakage_connection',
    name: 'Leakages & Connections',
    aliases: ['leakage', 'leakages & connections', 'pipe leak'],
    imageKey: 'leakage',
    fields: [
      commonName('e.g. Wall Concealed Pipe Connection'),
      {
        id: 'type',
        label: 'Pipe & Fitting Material',
        type: 'select',
        required: true,
        options: ['CPVC Hot & Cold Line', 'UPVC Cold Water Pipe', 'Flexible Braided Connection Hose', 'GI Metal Pipe', 'PVC Waste Line'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'water_tank_motor',
    name: 'Water Tanks & Motors',
    aliases: ['water tank', 'water tanks & motors', 'motor', 'pump'],
    imageKey: 'waterTank',
    fields: [
      commonName('e.g. Terrace Water Tank / Booster Pump'),
      commonBrand,
      {
        id: 'type',
        label: 'Equipment Type',
        type: 'select',
        required: true,
        options: ['Overhead Polyethylene Tank (500L-2000L)', '0.5 HP Self-Priming Monoblock Pump', '1 HP Openwell / Borewell Submersible', 'Automatic Hydro-Pneumatic Pressure Booster', 'Automatic Water Level Controller System'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  // ==========================================
  // 3. CARPENTER & FURNITURE
  // ==========================================
  entry({
    id: 'bed',
    name: 'Bed',
    aliases: ['bed', 'king bed', 'queen bed'],
    imageKey: 'bed',
    fields: [
      commonName('e.g. Master Bedroom Bed'),
      {
        id: 'type',
        label: 'Bed Dimension & Type',
        type: 'select',
        required: true,
        options: ['King Size Bed (72" x 78")', 'Queen Size Bed (60" x 78")', 'Single Bed / Diwan', 'Hydraulic Lift Storage Bed', 'Box Storage Bed', 'Bunk Bed'],
      },
      {
        id: 'capacity',
        label: 'Wood & Material',
        type: 'select',
        required: false,
        options: ['Solid Teak / Sheesham Wood', 'Heavy Plywood with Laminate', 'Engineered Wood / MDF', 'Metal / Upholstered Frame'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'sofa',
    name: 'Sofa',
    aliases: ['sofa', 'couch', 'sectional'],
    imageKey: 'sofa',
    fields: [
      commonName('e.g. Living Room 3-Seater Sofa'),
      {
        id: 'type',
        label: 'Seating Configuration',
        type: 'select',
        required: true,
        options: ['3-Seater Sofa', '2-Seater Loveseat', '1-Seater Armchair', '3 + 1 + 1 Complete Set', 'L-Shape 5/6-Seater Sectional', 'Sofa Cum Bed (Pull-out)', 'Motorized Recliner Chair'],
      },
      {
        id: 'capacity',
        label: 'Upholstery Material',
        type: 'select',
        required: false,
        options: ['Fabric / Linen Blend', 'Suede / Velvet', 'Genuine Pure Leather', 'Leatherette / PU Rexine'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'table',
    name: 'Table',
    aliases: ['table', 'dining table', 'coffee table', 'desk'],
    imageKey: 'table',
    fields: [
      commonName('e.g. Dining Table 6-Seater'),
      {
        id: 'type',
        label: 'Table Type',
        type: 'select',
        required: true,
        options: ['6-Seater Dining Table', '4-Seater Dining Table', 'Center Coffee Table', 'Study / Work Desk with Drawers', 'Console / Side Table'],
      },
      {
        id: 'capacity',
        label: 'Top Surface Material',
        type: 'select',
        required: false,
        options: ['Solid Natural Wood', 'Italian Marble / Quartz Top', 'Tempered Toughened Glass', 'Laminated Marine Ply'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'chair',
    name: 'Chair',
    aliases: ['chair', 'large chair', 'dining chair', 'office chair'],
    imageKey: 'chair',
    fields: [
      commonName('e.g. Study Ergonomic Office Chair'),
      {
        id: 'type',
        label: 'Chair Type',
        type: 'select',
        required: true,
        options: ['Ergonomic Mesh Office Chair (Gas-lift)', 'Dining Room Wooden Chair', 'Cushioned Lounge Accent Chair', 'Reclining Rocking Chair', 'Bar Stool High Chair'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'door_repair',
    name: 'Door Repair',
    aliases: ['door', 'door repair', 'door closer', 'door mesh'],
    imageKey: 'doorRepair',
    fields: [
      commonName('e.g. Main Entrance Teak Door'),
      {
        id: 'type',
        label: 'Door / Fitting Type',
        type: 'select',
        required: true,
        options: ['Main Entrance Heavy Wooden Door', 'Internal Bedroom Flush Door', 'Balcony Aluminum / UPVC Sliding Door', 'Mosquito Mesh Net Door', 'Hydraulic Door Closer Mechanism'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'cupboard',
    name: 'Cupboard',
    aliases: ['cupboard', 'wardrobe', 'closet', 'cupboard lock', 'drawer'],
    imageKey: 'cupboard',
    fields: [
      commonName('e.g. Master Bedroom 3-Door Wardrobe'),
      {
        id: 'type',
        label: 'Wardrobe / Closet Type',
        type: 'select',
        required: true,
        options: ['3-Door Hinged Wardrobe', '2-Door Sliding Wardrobe', '4-Door Floor-to-Ceiling Closet', 'Modular Chest of Drawers', 'Walk-in Wardrobe System'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'kitchen_fittings',
    name: 'Kitchen Fittings',
    aliases: ['kitchen fittings', 'cabinet hinges', 'cabinet hydraulic', 'pull-out drawer'],
    imageKey: 'kitchenFittings',
    fields: [
      commonName('e.g. Overhead Hydraulic Kitchen Cabinet'),
      commonBrand,
      {
        id: 'type',
        label: 'Hardware Component',
        type: 'select',
        required: true,
        options: ['Soft-Close Hydraulic Lift-Up Stay', 'Auto Soft-Close Concealed Hinges', 'Telescopic Drawer Channel Runner', 'Corner Carousel / Magic Corner', 'Stainless Steel Wire Pull-Out Baskets'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  // ==========================================
  // 4. DRY CLEANING
  // ==========================================
  entry({
    id: 'fabric_sofa',
    name: 'Fabric Sofa',
    aliases: ['fabric sofa', 'sofa dry cleaning'],
    imageKey: 'fabricSofa',
    fields: [
      commonName('e.g. Living Room Fabric Sofa'),
      {
        id: 'type',
        label: 'Seater Size',
        type: 'select',
        required: true,
        options: ['1-Seater Sofa / Armchair', '2-Seater Loveseat', '3-Seater Sofa', '3 + 1 + 1 Complete Set (5 Seats)', 'L-Shape 5/6-Seater Sectional', '7-Seater Large Sectional'],
      },
      {
        id: 'capacity',
        label: 'Fabric Texture',
        type: 'select',
        required: true,
        options: ['Cotton / Linen Blend', 'Suede / Velvet Texture', 'Microfiber Plush', 'Chenille / Jacquard Weave'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'leather_sofa',
    name: 'Leather Sofa',
    aliases: ['leather sofa', 'leather couch'],
    imageKey: 'leatherSofa',
    fields: [
      commonName('e.g. Study Leather Recliner'),
      {
        id: 'type',
        label: 'Seating Size',
        type: 'select',
        required: true,
        options: ['1-Seater Recliner / Chair', '2-Seater Leather Sofa', '3-Seater Leather Sofa', '3 + 1 + 1 Full Set', 'L-Shape 6-Seater Pure Leather'],
      },
      {
        id: 'capacity',
        label: 'Leather Type',
        type: 'select',
        required: true,
        options: ['Pure Genuine Top-Grain Leather', 'Faux Leather / Leatherette (Rexine)', 'Semi-Aniline Treated Leather'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'carpet',
    name: 'Carpet',
    aliases: ['carpet', 'rug', 'carpet cleaning'],
    imageKey: 'carpet',
    fields: [
      commonName('e.g. Living Room Woollen Carpet'),
      {
        id: 'type',
        label: 'Carpet Size',
        type: 'select',
        required: true,
        options: ['Small Area Rug (3 ft x 5 ft)', 'Medium Rug (5 ft x 7 ft)', 'Large Living Room Carpet (8 ft x 10 ft)', 'Extra Large (9 ft x 12 ft)', 'Wall-to-Wall Fixed Carpet'],
      },
      {
        id: 'capacity',
        label: 'Carpet Material',
        type: 'select',
        required: true,
        options: ['Kashmiri Woollen / Hand-Knotted', 'Pure Silk / Viscose Rug', 'Synthetic / Nylon / Polyester', 'Shaggy High-Pile Rug', 'Jute / Braided Natural Rug'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'curtains',
    name: 'Curtains',
    aliases: ['curtains', 'drapes', 'blinds'],
    imageKey: 'curtains',
    fields: [
      commonName('e.g. Master Bedroom Blackout Curtains'),
      {
        id: 'type',
        label: 'Curtain Drop Length',
        type: 'select',
        required: true,
        options: ['Window Length (5 Feet Drop)', 'Door Length (7 Feet Drop)', 'Long Balcony / French Window (9 Feet Drop)', 'Double Height High Ceiling (12 Feet+)'],
      },
      {
        id: 'capacity',
        label: 'Fabric Type',
        type: 'select',
        required: true,
        options: ['Heavy 100% Blackout Fabric', 'Sheer / Net Translucent Drapes', 'Premium Velvet / Jacquard', 'Cotton / Linen Weave'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'fabric_headboard',
    name: 'Fabric Headboard',
    aliases: ['fabric headboard', 'headboard'],
    imageKey: 'fabricHeadboard',
    fields: [
      commonName('e.g. Master Bed Tufted Headboard'),
      {
        id: 'type',
        label: 'Bed Dimension',
        type: 'select',
        required: true,
        options: ['King Size Bed Headboard', 'Queen Size Bed Headboard', 'Single Bed Headboard', 'Floor-to-Ceiling Wall Panelling'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'leather_headboard',
    name: 'Leather Headboard',
    aliases: ['leather headboard'],
    imageKey: 'leatherHeadboard',
    fields: [
      commonName('e.g. Bed Leatherette Padded Headboard'),
      {
        id: 'type',
        label: 'Bed Dimension',
        type: 'select',
        required: true,
        options: ['King Size Bed Headboard', 'Queen Size Bed Headboard', 'Single Bed Headboard'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  // ==========================================
  // 5. PEST CONTROL
  // ==========================================
  entry({
    id: 'cockroach_control',
    name: 'Cockroach',
    aliases: ['cockroach', 'pest control', 'general pest control'],
    imageKey: 'cockroach',
    fields: [
      commonName('e.g. Complete Apartment Pest Control'),
      {
        id: 'type',
        label: 'Premises Configuration',
        type: 'select',
        required: true,
        options: ['1 BHK Apartment', '2 BHK Apartment', '3 BHK Apartment', '4 BHK / Duplex / Villa', 'Commercial Kitchen / Restaurant'],
      },
      {
        id: 'capacity',
        label: 'Infestation Level',
        type: 'select',
        required: true,
        options: ['Preventive / Low Infestation', 'Moderate (Occasional Sightings in Kitchen)', 'Severe Heavy Infestation (Cabinets & Drains)'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'termite_control',
    name: 'Termite',
    aliases: ['termite', 'de-termite', 'termite control'],
    imageKey: 'termite',
    fields: [
      commonName('e.g. Full Home De-Termite Treatment'),
      {
        id: 'type',
        label: 'Treatment Scope',
        type: 'select',
        required: true,
        options: ['Full Home Drill & Chemical Inject Barrier', 'Targeted Wooden Wardrobe / Kitchen Cabinet', 'Door & Window Wooden Frames Only'],
      },
      {
        id: 'capacity',
        label: 'Premises Size',
        type: 'select',
        required: true,
        options: ['1–2 BHK Apartment', '3–4 BHK Apartment', 'Independent Villa / Bungalow', 'Commercial Office Space'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  entry({
    id: 'bedbugs_control',
    name: 'Bedbugs',
    aliases: ['bedbugs', 'bedbug control', 'bed bugs'],
    imageKey: 'bedbugs',
    fields: [
      commonName('e.g. Master Bedroom Bedbug Treatment'),
      {
        id: 'type',
        label: 'Affected Rooms / Beds',
        type: 'select',
        required: true,
        options: ['1 Bed / Single Room', '2 Beds / 2 Bedrooms', '3+ Beds / Entire Apartment'],
      },
      {
        id: 'capacity',
        label: 'Mattress & Bed Types',
        type: 'select',
        required: true,
        options: ['Memory Foam / Ortho Mattress', 'Spring / Pocket Mattress', 'Cotton / Coir Traditional Mattress', 'Wooden Box Storage Beds'],
      },
      commonLocation,
      commonNotes,
    ],
  }),

  // ==========================================
  // 6. FALLBACK OTHER ITEM
  // ==========================================
  entry({
    id: 'other',
    name: 'Other',
    aliases: ['other', 'misc'],
    imageKey: 'other',
    fields: [
      {
        id: 'displayName',
        label: 'Appliance / Item Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Water Pump, Mixer Grinder, Projector',
      },
      commonBrand,
      {
        id: 'type',
        label: 'Type / Model / Specifications',
        type: 'text',
        required: false,
        placeholder: 'Optional specification or model info',
      },
      commonYear,
      commonLocation,
      commonNotes,
    ],
  }),
];

export function getApplianceById(id) {
  if (!id) return null;
  const match = APPLIANCE_CATALOG.find((a) => a.id === id);
  if (match) return match;
  // Fallback: search by name or alias
  const lower = String(id).toLowerCase().trim();
  return (
    APPLIANCE_CATALOG.find(
      (a) => a.name.toLowerCase() === lower || (a.aliases || []).some((al) => al.toLowerCase() === lower)
    ) || null
  );
}

export function getTopAppliances() {
  return TOP_APPLIANCE_IDS.map((id) => getApplianceById(id)).filter(Boolean);
}

export function getAllInventoryAppliances() {
  return APPLIANCE_CATALOG.filter((a) => a.id !== 'other');
}

export function searchAppliances(query, list = APPLIANCE_CATALOG) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return list;
  return list.filter((a) => {
    if (a.name.toLowerCase().includes(q)) return true;
    if ((a.aliases || []).some((al) => al.toLowerCase().includes(q))) return true;
    if ((a.category || '').toLowerCase().includes(q)) return true;
    return false;
  });
}

export function createEmptyUnitDraft(applianceType, index) {
  const typeName = applianceType?.name || 'Appliance';
  return {
    unitIndex: index,
    applianceTypeId: applianceType?.id || 'other',
    displayName: `${typeName} ${index + 1}`,
    brand: '',
    customBrand: '',
    type: '',
    capacity: '',
    year: '',
    location: '',
    condition: 'Working',
    notes: '',
    model: '',
    media: null,
  };
}

