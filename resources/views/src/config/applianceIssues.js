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

const GENERIC_ISSUES = [
  { id: 'not_working', label: 'Not Working' },
  { id: 'making_noise', label: 'Making Noise' },
  { id: 'installation', label: 'Installation Required' },
  { id: 'general_service', label: 'General Service' },
  OTHER,
];

const ISSUES_BY_TYPE = {
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
  other: GENERIC_ISSUES,
};

export function getIssuesForApplianceType(applianceTypeId) {
  if (!applianceTypeId) return GENERIC_ISSUES;
  return ISSUES_BY_TYPE[applianceTypeId] || GENERIC_ISSUES;
}
