/**
 * A booking has a bill only after the admin generates it (post provider inspection).
 * Legacy/seed bookings in billed stages with a positive total are also treated as billed.
 */
const BILLED_STATUSES = ['AWAITING_USER_APPROVAL', 'SERVICE_IN_PROGRESS', 'BOOKING_COMPLETED'];

export function hasGeneratedBill(booking) {
  if (!booking) return false;
  if (booking.bill_generated || booking.bill_sent) return true;
  return BILLED_STATUSES.includes(booking.status) && Number(booking.total_bill) > 0;
}

export function isBillPaid(booking) {
  if (!hasGeneratedBill(booking)) return false;
  return booking.bill_status === 'PAID' || Number(booking.wallet_deducted) > 0;
}
