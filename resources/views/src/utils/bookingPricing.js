/**
 * Single source of truth for booking price lines.
 * ₹499 extra-unit charge and ₹500 registration fee stay separate.
 */
import {
  APPLIANCE_REGISTRATION_FEE,
  DEFAULT_SERVICE_CHARGE,
} from '../config/applianceConstants';

const EXTRA_UNIT_FEE = 499;

export function calculateExtraApplianceServiceCharge(applianceCount = 1) {
  const extraUnits = Math.max(0, Number(applianceCount || 1) - 1);
  return extraUnits * EXTRA_UNIT_FEE;
}

/**
 * @param {object} opts
 * @param {number} [opts.serviceCharge]
 * @param {number} [opts.applianceCount]
 * @param {number} [opts.applianceRegistrationFee] 0 or 500
 * @param {number} [opts.discount]
 */
export function calculateBookingPrice({
  serviceCharge = DEFAULT_SERVICE_CHARGE,
  applianceCount = 1,
  applianceRegistrationFee = 0,
  discount = 0,
} = {}) {
  const service = Number(serviceCharge) || 0;
  const extra = calculateExtraApplianceServiceCharge(applianceCount);
  const registration = Math.max(0, Number(applianceRegistrationFee) || 0);
  const disc = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, service + extra + registration - disc);

  return {
    serviceCharge: service,
    extraApplianceServiceCharge: extra,
    applianceRegistrationFee: registration,
    discount: disc,
    total,
  };
}

export { APPLIANCE_REGISTRATION_FEE, DEFAULT_SERVICE_CHARGE };
