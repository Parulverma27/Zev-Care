// Zevota Care - Standard Spare Parts Catalog & ₹22 Repair Guarantee Price Master

export const ZEVOTA_PARTS_GUARANTEE_PRICE = 22; // Rs 22 me parts repair guarantee

export const SPARE_PARTS_CATALOG = [
  {
    id: 'ac_cap',
    name: 'AC Run Capacitor (45/50 MFD)',
    category: 'AC',
    standardPrice: 450,
    guaranteePrice: 22,
    warranty: 'Lifetime Warranty*',
  },
  {
    id: 'ac_gas',
    name: 'AC Eco Gas Refill (R32 / R410A)',
    category: 'AC',
    standardPrice: 850,
    guaranteePrice: 850, // Gas is consumable
    warranty: '90 Days Cooling Warranty',
  },
  {
    id: 'ac_cont',
    name: 'AC Heavy Duty Contactor',
    category: 'AC',
    standardPrice: 380,
    guaranteePrice: 22,
    warranty: 'Lifetime Warranty*',
  },
  {
    id: 'wm_coupler',
    name: 'Washing Machine Motor Coupler',
    category: 'Washing Machine',
    standardPrice: 350,
    guaranteePrice: 22,
    warranty: 'Lifetime Warranty*',
  },
  {
    id: 'wm_pump',
    name: 'Washer Drain Impeller Pump',
    category: 'Washing Machine',
    standardPrice: 650,
    guaranteePrice: 22,
    warranty: 'Lifetime Warranty*',
  },
  {
    id: 'fridge_relay',
    name: 'Refrigerator PTC Relay & OLP',
    category: 'Refrigerator',
    standardPrice: 420,
    guaranteePrice: 22,
    warranty: 'Lifetime Warranty*',
  },
  {
    id: 'fridge_thermo',
    name: 'Defrost Thermostat Sensor',
    category: 'Refrigerator',
    standardPrice: 380,
    guaranteePrice: 22,
    warranty: 'Lifetime Warranty*',
  },
  {
    id: 'elec_switch',
    name: 'Modular Switch & Socket Set',
    category: 'Electrical',
    standardPrice: 250,
    guaranteePrice: 22,
    warranty: 'Lifetime Warranty*',
  },
  {
    id: 'elec_mcb',
    name: 'MCB Single Pole 16A/25A',
    category: 'Electrical',
    standardPrice: 320,
    guaranteePrice: 22,
    warranty: 'Lifetime Warranty*',
  },
  {
    id: 'plumb_spindle',
    name: 'Ceramic Tap Spindle / Valve Core',
    category: 'Plumbing',
    standardPrice: 280,
    guaranteePrice: 22,
    warranty: 'Lifetime Warranty*',
  },
];

export function getApplicablePartsForService(serviceName = '', categoryName = '') {
  const combined = `${serviceName} ${categoryName}`.toLowerCase();
  if (combined.includes('ac') || combined.includes('air') || combined.includes('compressor')) {
    return SPARE_PARTS_CATALOG.filter((p) => p.category === 'AC');
  }
  if (combined.includes('wash') || combined.includes('laundry')) {
    return SPARE_PARTS_CATALOG.filter((p) => p.category === 'Washing Machine');
  }
  if (combined.includes('fridge') || combined.includes('refrig')) {
    return SPARE_PARTS_CATALOG.filter((p) => p.category === 'Refrigerator');
  }
  if (combined.includes('plumb') || combined.includes('tap') || combined.includes('pipe')) {
    return SPARE_PARTS_CATALOG.filter((p) => p.category === 'Plumbing');
  }
  if (combined.includes('electr') || combined.includes('switch') || combined.includes('wire')) {
    return SPARE_PARTS_CATALOG.filter((p) => p.category === 'Electrical');
  }
  return SPARE_PARTS_CATALOG.slice(0, 5);
}

