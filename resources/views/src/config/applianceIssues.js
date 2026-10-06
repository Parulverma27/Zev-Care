/**
 * Appliance-specific issue options for booking flow.
 */

const OTHER = { id: 'other', label: 'Other', isOther: true };

const AC_ISSUES = [
  { id: 'not_cooling', label: 'Not Cooling' },
  { id: 'water_leakage', label: 'Water Leakage' },
  { id: 'making_noise', label: 'Making Noise' },
  { id: 'not_turning_on', label: 'Not Turning On' },
  { id: 'bad_smell', label: 'Bad Smell' },
  { id: 'ice_formation', label: 'Ice Formation' },
  { id: 'remote_not_working', label: 'Remote Not Working' },
  { id: 'gas_performance', label: 'Gas / Performance Issue' },
  { id: 'installation', label: 'Installation Required' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

const WASHING_ISSUES = [
  { id: 'not_starting', label: 'Not Starting' },
  { id: 'not_draining', label: 'Not Draining' },
  { id: 'not_spinning', label: 'Not Spinning' },
  { id: 'leaking_water', label: 'Water Leakage' },
  { id: 'making_noise', label: 'Making Noise' },
  { id: 'door_issue', label: 'Door / Lock Issue' },
  { id: 'error_code', label: 'Error Code on Display' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

const FRIDGE_ISSUES = [
  { id: 'not_cooling', label: 'Not Cooling' },
  { id: 'freezer_issue', label: 'Freezer Issue' },
  { id: 'water_leakage', label: 'Water Leakage' },
  { id: 'making_noise', label: 'Making Noise' },
  { id: 'not_turning_on', label: 'Not Turning On' },
  { id: 'bad_smell', label: 'Bad Smell' },
  { id: 'ice_buildup', label: 'Ice Build-up' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

const TV_ISSUES = [
  { id: 'no_power', label: 'No Power' },
  { id: 'no_display', label: 'No Display / Black Screen' },
  { id: 'sound_issue', label: 'Sound Issue' },
  { id: 'remote_not_working', label: 'Remote Not Working' },
  { id: 'connectivity', label: 'HDMI / Connectivity' },
  { id: 'mounting', label: 'Mounting / Installation' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

const MICROWAVE_ISSUES = [
  { id: 'not_heating', label: 'Not Heating' },
  { id: 'not_turning_on', label: 'Not Turning On' },
  { id: 'turntable', label: 'Turntable Issue' },
  { id: 'door_issue', label: 'Door / Latch Issue' },
  { id: 'sparking', label: 'Sparking Inside' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

const GEYSER_ISSUES = [
  { id: 'not_heating', label: 'Not Heating' },
  { id: 'water_leakage', label: 'Water Leakage' },
  { id: 'no_power', label: 'No Power' },
  { id: 'thermostat', label: 'Thermostat Issue' },
  { id: 'installation', label: 'Installation Required' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

const FAN_ISSUES = [
  { id: 'not_turning_on', label: 'Not Turning On' },
  { id: 'making_noise', label: 'Making Noise / Vibration' },
  { id: 'speed_issue', label: 'Speed Control Issue' },
  { id: 'regulator', label: 'Regulator Issue' },
  { id: 'installation', label: 'Installation Required' },
  { id: 'cleaning', label: 'Cleaning Required' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

const COOLER_ISSUES = [
  { id: 'not_cooling', label: 'Not Cooling' },
  { id: 'pump_issue', label: 'Pump Issue' },
  { id: 'making_noise', label: 'Making Noise' },
  { id: 'not_turning_on', label: 'Not Turning On' },
  { id: 'pad_issue', label: 'Cooling Pad Issue' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

const PURIFIER_ISSUES = [
  { id: 'low_flow', label: 'Low Water Flow' },
  { id: 'taste_smell', label: 'Taste / Smell Issue' },
  { id: 'leakage', label: 'Water Leakage' },
  { id: 'filter', label: 'Filter Replacement' },
  { id: 'not_turning_on', label: 'Not Turning On' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

const STOVE_ISSUES = [
  { id: 'ignition', label: 'Ignition Not Working' },
  { id: 'burner', label: 'Burner Issue' },
  { id: 'gas_smell', label: 'Gas Smell / Leak Concern' },
  { id: 'uneven_flame', label: 'Uneven Flame' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

const COFFEE_ISSUES = [
  { id: 'not_heating', label: 'Not Heating' },
  { id: 'pump_issue', label: 'Pump / Flow Issue' },
  { id: 'not_turning_on', label: 'Not Turning On' },
  { id: 'leakage', label: 'Leakage' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

const DISHWASHER_ISSUES = [
  { id: 'not_starting', label: 'Not Starting' },
  { id: 'not_cleaning', label: 'Not Cleaning Properly' },
  { id: 'not_draining', label: 'Not Draining' },
  { id: 'leaking_water', label: 'Water Leakage' },
  { id: 'making_noise', label: 'Making Noise' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

const CCTV_ISSUES = [
  { id: 'no_video', label: 'No Video Feed' },
  { id: 'connectivity', label: 'Connectivity Issue' },
  { id: 'installation', label: 'Installation / Wiring' },
  { id: 'night_vision', label: 'Night Vision Issue' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

const DOORBELL_ISSUES = [
  { id: 'not_ringing', label: 'Not Ringing' },
  { id: 'no_power', label: 'No Power' },
  { id: 'wireless', label: 'Wireless Pairing Issue' },
  { id: 'installation', label: 'Installation Required' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

const CHIMNEY_ISSUES = [
  { id: 'not_sucking', label: 'Weak Suction' },
  { id: 'making_noise', label: 'Making Noise' },
  { id: 'light_issue', label: 'Light Not Working' },
  { id: 'filter', label: 'Filter Cleaning / Replacement' },
  { id: 'installation', label: 'Installation Required' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

// ─────────────────────────────────────────────────────────────────────────────
// PLUMBER SERVICES ISSUES
// ─────────────────────────────────────────────────────────────────────────────
const BATH_SHOWER_ISSUES = [
  { id: 'low_pressure', label: 'Low Water Pressure' },
  { id: 'leaking_shower', label: 'Leaking Shower Head / Arm' },
  { id: 'temperature_mixer', label: 'Hot & Cold Mixer Issue' },
  { id: 'diverter_faulty', label: 'Diverter Valve Broken / Stuck' },
  { id: 'drain_clogged', label: 'Shower Area Drain Clogged' },
  { id: 'new_installation', label: 'New Shower Fitting / Replacement' },
  OTHER,
];

const TAP_MIXER_ISSUES = [
  { id: 'dripping_tap', label: 'Continuous Water Dripping' },
  { id: 'spindle_broken', label: 'Broken Spindle / Loose Handle' },
  { id: 'low_flow_aerator', label: 'Low Flow / Clogged Aerator' },
  { id: 'base_leakage', label: 'Leaking from Base / Joint' },
  { id: 'cartridge_replace', label: 'Cartridge Replacement Required' },
  { id: 'new_tap_install', label: 'New Tap Installation' },
  OTHER,
];

const TOILET_ISSUES = [
  { id: 'flush_not_working', label: 'Flush Not Working / Weak Flush' },
  { id: 'cistern_overflow', label: 'Cistern Continuously Running' },
  { id: 'jet_spray_leak', label: 'Jet Spray Leaking / Broken' },
  { id: 'pot_leakage', label: 'Toilet Pot Leakage / Crack' },
  { id: 'seat_cover', label: 'Seat Cover Broken / Loose' },
  { id: 'clogged_toilet', label: 'Toilet Clog / Choke' },
  OTHER,
];

const BASINS_SINKS_ISSUES = [
  { id: 'drain_clogged', label: 'Slow Drain / Clogged Sink' },
  { id: 'bottle_trap_leak', label: 'Bottle Trap / Waste Pipe Leak' },
  { id: 'faucet_loose', label: 'Basin Tap Loose or Leaking' },
  { id: 'basin_fitting', label: 'Loose Wall Mount / Re-fixing' },
  { id: 'crack_chip', label: 'Basin Crack or Chipped' },
  OTHER,
];

const DRAINAGE_BLOCKAGE_ISSUES = [
  { id: 'main_drain_choke', label: 'Main Drain Line Blocked' },
  { id: 'bathroom_floor_choke', label: 'Bathroom Floor Trap Overflowing' },
  { id: 'kitchen_sink_backflow', label: 'Kitchen Sink Backflow / Bad Odor' },
  { id: 'balcony_drain_clog', label: 'Balcony Rain Drain Blocked' },
  { id: 'chamber_cleaning', label: 'Inspection Chamber Choke' },
  OTHER,
];

const LEAKAGE_CONNECTION_ISSUES = [
  { id: 'wall_seepage', label: 'Concealed Pipe Seepage in Wall' },
  { id: 'joint_leak', label: 'Exposed Pipe Joint Leakage' },
  { id: 'angle_valve_leak', label: 'Angle Valve / Stop Cock Leaking' },
  { id: 'hose_burst', label: 'Flexible Hose Pipe Burst' },
  { id: 'new_piping', label: 'Pipe Extension / Rerouting' },
  OTHER,
];

const WATER_TANK_MOTOR_ISSUES = [
  { id: 'motor_not_starting', label: 'Pump Motor Not Starting' },
  { id: 'motor_noise_heat', label: 'Loud Noise / Motor Overheating' },
  { id: 'tank_overflow', label: 'Overhead Tank Overflowing' },
  { id: 'float_switch_fault', label: 'Float Valve / Auto Controller Fault' },
  { id: 'tank_cleaning', label: 'Water Tank Cleaning Required' },
  { id: 'low_suction', label: 'Low Suction / Water Not Lifting' },
  OTHER,
];

// ─────────────────────────────────────────────────────────────────────────────
// ELECTRICIAN NON-APPLIANCE SERVICES ISSUES
// ─────────────────────────────────────────────────────────────────────────────
const SWITCH_BOARD_ISSUES = [
  { id: 'sparking_smell', label: 'Switch Sparking / Burning Smell' },
  { id: 'socket_dead', label: 'Socket Not Powering Devices' },
  { id: 'switch_broken', label: 'Broken Switch / Loose Faceplate' },
  { id: 'short_circuit', label: 'Short Circuit / Spark on Board' },
  { id: 'board_replacement', label: 'New Modular Board Installation' },
  OTHER,
];

const PLUGS_SOCKETS_ISSUES = [
  { id: 'socket_burnt', label: '16A Power Socket Burnt / Melted' },
  { id: 'three_pin_burnt', label: '3-Pin Plug Head Melted' },
  { id: 'no_current', label: 'No Power in Socket' },
  { id: 'loose_contact', label: 'Loose Contact / Sparking' },
  { id: 'new_socket', label: 'New Power Point Installation' },
  OTHER,
];

const MCB_MAIN_SWITCH_ISSUES = [
  { id: 'mcb_tripping', label: 'MCB Tripping Repeatedly' },
  { id: 'main_switch_burnt', label: 'Main Switch Burnt / Loose Contact' },
  { id: 'single_phase_dead', label: 'Single Phase Out / Partial Blackout' },
  { id: 'db_sparking', label: 'Distribution Box Sparking' },
  { id: 'upgrade_mcb', label: 'MCB Upgrade / Replacement' },
  OTHER,
];

const LIGHTING_ISSUES = [
  { id: 'light_flickering', label: 'Light Flickering / Not Turning On' },
  { id: 'chandelier_mounting', label: 'Chandelier Mounting / Alignment' },
  { id: 'holder_wire_broken', label: 'Bulb Holder Broken / Damaged Wire' },
  { id: 'driver_failed', label: 'LED Driver / Choke Replacement' },
  { id: 'new_light_fitting', label: 'New Light Fitting / Installation' },
  OTHER,
];

const FAN_REGULATOR_ISSUES = [
  { id: 'single_speed', label: 'Fan Running at Full Speed Only' },
  { id: 'knob_broken', label: 'Regulator Knob Broken / Burning' },
  { id: 'humming_noise', label: 'Humming Noise When Dimming' },
  { id: 'regulator_replace', label: 'New Step Regulator Replacement' },
  OTHER,
];

const INVERTER_BATTERY_ISSUES = [
  { id: 'not_charging', label: 'Inverter Not Charging Battery' },
  { id: 'no_backup', label: 'No Backup During Power Cut' },
  { id: 'overload_beeping', label: 'Overload Alarm Beeping Constantly' },
  { id: 'battery_acid_leak', label: 'Battery Acid Leakage / Water Top-up' },
  { id: 'inverter_dead', label: 'Inverter Not Turning On' },
  OTHER,
];

const HOME_THEATRE_ISSUES = [
  { id: 'no_audio', label: 'No Audio Output from Speakers' },
  { id: 'subwoofer_buzz', label: 'Subwoofer Buzzing / Distortion' },
  { id: 'hdmi_arc_failed', label: 'HDMI ARC / Optical Connection Failed' },
  { id: 'wiring_setup', label: 'Speaker Wiring & Wall Mounting' },
  OTHER,
];

const JUICER_MIXER_ISSUES = [
  { id: 'motor_not_running', label: 'Motor Not Running / Dead' },
  { id: 'coupler_broken', label: 'Coupler Teeth Broken' },
  { id: 'jar_blade_jammed', label: 'Jar Blade Jammed / Leaking Jar' },
  { id: 'burning_smell', label: 'Smoke / Burning Smell from Base' },
  { id: 'overload_tripped', label: 'Reset Button / Overload Tripping' },
  OTHER,
];

// ─────────────────────────────────────────────────────────────────────────────
// CARPENTER SERVICES ISSUES
// ─────────────────────────────────────────────────────────────────────────────
const BED_ISSUES = [
  { id: 'squeaking_noise', label: 'Creaking / Squeaking Noise' },
  { id: 'hydraulic_lift', label: 'Hydraulic Lift Failing / Weak' },
  { id: 'broken_slat', label: 'Broken Slat / Bed Base Support' },
  { id: 'loose_headboard', label: 'Headboard Loose / Wobbling' },
  { id: 'drawer_jammed', label: 'Storage Bed Drawer Jammed' },
  OTHER,
];

const SOFA_ISSUES = [
  { id: 'sagging_cushions', label: 'Sagging Seat / Cushion Repair' },
  { id: 'broken_frame', label: 'Broken Wooden Frame / Spring Issue' },
  { id: 'loose_armrest', label: 'Loose Armrest / Leg Wobble' },
  { id: 'recliner_stuck', label: 'Recliner Mechanism Stuck' },
  { id: 'upholstery_fix', label: 'Fabric / Leather Stitching Repair' },
  OTHER,
];

const DOOR_REPAIR_ISSUES = [
  { id: 'door_rubbing', label: 'Door Rubbing Against Floor' },
  { id: 'latch_not_catching', label: 'Latch / Lock Not Catching' },
  { id: 'hinges_squeaking', label: 'Hinges Loose / Squeaking Loudly' },
  { id: 'door_mesh_torn', label: 'Mosquito Mesh Torn / Loose' },
  { id: 'closer_slamming', label: 'Hydraulic Door Closer Slamming' },
  { id: 'lock_replacement', label: 'Main Door Lock / Handle Replacement' },
  OTHER,
];

const CUPBOARD_ISSUES = [
  { id: 'sliding_door_track', label: 'Sliding Door Off Track / Jammed' },
  { id: 'hinges_loose', label: 'Cabinet Hinges Broken / Loose' },
  { id: 'drawer_slider', label: 'Drawer Channel Sliders Broken' },
  { id: 'lock_jammed', label: 'Wardrobe Lock Jammed / Lost Key' },
  { id: 'shelf_sagging', label: 'Shelf Sagging / Extra Shelf Fitting' },
  OTHER,
];

const TABLE_CHAIR_ISSUES = [
  { id: 'wobbly_legs', label: 'Wobbly Legs / Loose Screws' },
  { id: 'veneer_peeling', label: 'Veneer / Laminate Peeling' },
  { id: 'chair_hydraulic', label: 'Office Chair Hydraulic Cylinder Falling' },
  { id: 'broken_backrest', label: 'Broken Backrest / Joint Split' },
  { id: 'table_polishing', label: 'Polishing / Scratch Repair' },
  OTHER,
];

const KITCHEN_FITTINGS_ISSUES = [
  { id: 'hydraulic_cabinet', label: 'Cabinet Hydraulic Arm Losing Pressure' },
  { id: 'soft_close_hinge', label: 'Soft-close Hinge Lost Tension' },
  { id: 'pull_out_basket', label: 'Pull-out Basket Off Track / Stuck' },
  { id: 'handle_loose', label: 'Modular Kitchen Handle Broken / Loose' },
  OTHER,
];

// ─────────────────────────────────────────────────────────────────────────────
// DRY CLEANING & PEST CONTROL ISSUES
// ─────────────────────────────────────────────────────────────────────────────
const DRY_CLEANING_ISSUES = [
  { id: 'deep_stains', label: 'Deep Stains & Spills Removal' },
  { id: 'dust_odor', label: 'Deep Dust, Mites & Odor Removal' },
  { id: 'pet_hair', label: 'Pet Hair & Odor Neutralization' },
  { id: 'leather_care', label: 'Leather Conditioning & Shine' },
  { id: 'delicate_fabric', label: 'Delicate Fabric Steam Cleaning' },
  OTHER,
];

const PEST_CONTROL_ISSUES = [
  { id: 'kitchen_cockroach', label: 'Kitchen Cabinets Cockroach Infestation' },
  { id: 'drain_pests', label: 'Drain & Bathroom Cockroaches' },
  { id: 'termite_wood', label: 'Termites in Wooden Frames / Mud Tubes' },
  { id: 'bedbug_bed', label: 'Bedbugs in Mattress / Bed Frame' },
  { id: 'whole_home_pest', label: 'Full Home Preventive Treatment' },
  OTHER,
];

const GENERIC_ISSUES = [
  { id: 'not_working', label: 'Not Working / Damaged' },
  { id: 'making_noise', label: 'Making Unusual Noise' },
  { id: 'installation', label: 'Installation / Fitting Required' },
  { id: 'maintenance_check', label: 'Maintenance & Service Check' },
  OTHER,
];

const ISSUES_BY_TYPE = {
  // Appliances
  air_conditioner: AC_ISSUES,
  washing_machine: WASHING_ISSUES,
  refrigerator: FRIDGE_ISSUES,
  television: TV_ISSUES,
  microwave: MICROWAVE_ISSUES,
  geyser: GEYSER_ISSUES,
  fan: FAN_ISSUES,
  air_cooler: COOLER_ISSUES,
  water_purifier: PURIFIER_ISSUES,
  ro_system: PURIFIER_ISSUES,
  stove: STOVE_ISSUES,
  coffee_machine: COFFEE_ISSUES,
  dishwasher: DISHWASHER_ISSUES,
  cctv: CCTV_ISSUES,
  doorbell: DOORBELL_ISSUES,
  chimney: CHIMNEY_ISSUES,
  inverter_battery: INVERTER_BATTERY_ISSUES,
  juicer_mixer: JUICER_MIXER_ISSUES,
  home_theatre: HOME_THEATRE_ISSUES,
  switch_board: SWITCH_BOARD_ISSUES,

  // Plumber
  bath_shower: BATH_SHOWER_ISSUES,
  tap_mixer: TAP_MIXER_ISSUES,
  toilet: TOILET_ISSUES,
  basins_sinks: BASINS_SINKS_ISSUES,
  drainage_blockage: DRAINAGE_BLOCKAGE_ISSUES,
  leakage_connection: LEAKAGE_CONNECTION_ISSUES,
  water_tank_motor: WATER_TANK_MOTOR_ISSUES,

  // Carpenter
  bed: BED_ISSUES,
  sofa: SOFA_ISSUES,
  table: TABLE_CHAIR_ISSUES,
  chair: TABLE_CHAIR_ISSUES,
  door_repair: DOOR_REPAIR_ISSUES,
  cupboard: CUPBOARD_ISSUES,
  kitchen_fittings: KITCHEN_FITTINGS_ISSUES,

  // Dry Cleaning
  fabric_sofa: DRY_CLEANING_ISSUES,
  leather_sofa: DRY_CLEANING_ISSUES,
  carpet: DRY_CLEANING_ISSUES,
  curtains: DRY_CLEANING_ISSUES,
  fabric_headboard: DRY_CLEANING_ISSUES,
  leather_headboard: DRY_CLEANING_ISSUES,

  // Pest Control
  cockroach_control: PEST_CONTROL_ISSUES,
  termite_control: PEST_CONTROL_ISSUES,
  bedbugs_control: PEST_CONTROL_ISSUES,

  other: GENERIC_ISSUES,
};

export function getIssuesForApplianceType(applianceTypeId) {
  if (!applianceTypeId) return GENERIC_ISSUES;
  return ISSUES_BY_TYPE[applianceTypeId] || GENERIC_ISSUES;
}

/**
 * Universal resolver: Returns curated issues for ANY service, appliance, or category in the platform.
 * @param {string} serviceName - e.g. "Tap Mixer", "Switch Boards", "Bed", "AC"
 * @param {string} [applianceTypeId] - inventory type id if available
 * @param {string} [categoryName] - category name e.g. "Plumber", "Electrician"
 */
export function getIssuesForService(serviceName, applianceTypeId, categoryName) {
  if (applianceTypeId && ISSUES_BY_TYPE[applianceTypeId]) {
    return ISSUES_BY_TYPE[applianceTypeId];
  }

  const name = String(serviceName || '').trim().toLowerCase();

  // Plumber
  if (name.includes('bath') || name.includes('shower')) return BATH_SHOWER_ISSUES;
  if (name.includes('tap') || name.includes('faucet') || name.includes('mixer')) return TAP_MIXER_ISSUES;
  if (name.includes('toilet') || name.includes('flush') || name.includes('cistern') || name.includes('commode')) return TOILET_ISSUES;
  if (name.includes('basin') || name.includes('sink')) return BASINS_SINKS_ISSUES;
  if (name.includes('drain') || name.includes('block') || name.includes('choke')) return DRAINAGE_BLOCKAGE_ISSUES;
  if (name.includes('leak') || name.includes('pipe') || name.includes('seepage')) return LEAKAGE_CONNECTION_ISSUES;
  if (name.includes('tank') || name.includes('motor') || name.includes('pump')) return WATER_TANK_MOTOR_ISSUES;

  // Electrician non-appliance
  if (name.includes('switch board') || name.includes('switchboard')) return SWITCH_BOARD_ISSUES;
  if (name.includes('plug') || name.includes('socket')) return PLUGS_SOCKETS_ISSUES;
  if (name.includes('mcb') || name.includes('main switch') || name.includes('fuse') || name.includes('breaker')) return MCB_MAIN_SWITCH_ISSUES;
  if (name.includes('light') || name.includes('bulb') || name.includes('tubelight') || name.includes('chandelier')) return LIGHTING_ISSUES;
  if (name.includes('regulator')) return FAN_REGULATOR_ISSUES;
  if (name.includes('inverter') || name.includes('battery')) return INVERTER_BATTERY_ISSUES;
  if (name.includes('theatre') || name.includes('theater') || name.includes('speaker') || name.includes('audio')) return HOME_THEATRE_ISSUES;
  if (name.includes('juicer') || name.includes('mixer')) return JUICER_MIXER_ISSUES;

  // Carpenter
  if (name.includes('bed')) return BED_ISSUES;
  if (name.includes('sofa') || name.includes('couch')) return SOFA_ISSUES;
  if (name.includes('door') || name.includes('mesh') || name.includes('closer') || name.includes('lock')) return DOOR_REPAIR_ISSUES;
  if (name.includes('cupboard') || name.includes('wardrobe') || name.includes('drawer')) return CUPBOARD_ISSUES;
  if (name.includes('table') || name.includes('chair') || name.includes('desk')) return TABLE_CHAIR_ISSUES;
  if (name.includes('hinge') || name.includes('hydraulic') || name.includes('cabinet') || name.includes('kitchen fit')) return KITCHEN_FITTINGS_ISSUES;

  // Dry Cleaning
  if (name.includes('clean') || name.includes('carpet') || name.includes('curtain') || name.includes('upholstery')) return DRY_CLEANING_ISSUES;

  // Pest Control
  if (name.includes('pest') || name.includes('cockroach') || name.includes('termite') || name.includes('bedbug')) return PEST_CONTROL_ISSUES;

  // Category fallbacks
  const cat = String(categoryName || '').toLowerCase();
  if (cat.includes('plumb')) return LEAKAGE_CONNECTION_ISSUES;
  if (cat.includes('electr')) return SWITCH_BOARD_ISSUES;
  if (cat.includes('carpent')) return DOOR_REPAIR_ISSUES;
  if (cat.includes('pest')) return PEST_CONTROL_ISSUES;
  if (cat.includes('clean')) return DRY_CLEANING_ISSUES;

  return GENERIC_ISSUES;
}
