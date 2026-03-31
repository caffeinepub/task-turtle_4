// ─── Tiered Platform Fee (charged to user, hidden in UI) ───────────────────
// ₹0–₹99   → ₹4
// ₹100–₹299 → ₹7
// ₹300–₹500 → ₹10
export function calculatePlatformFee(productAmount: number): number {
  if (productAmount <= 99) return 4;
  if (productAmount <= 299) return 7;
  return 10;
}

// Total charged to user upfront
// total_payable = amount + tasker_fee + platform_fee + boost
export function calculateTotalPayable(
  productAmount: number,
  taskerFee: number,
  boost: number,
): number {
  if (productAmount <= 0) return 0;
  return (
    productAmount + taskerFee + calculatePlatformFee(productAmount) + boost
  );
}

// Minimum valid tasker fee is ₹10
export function validateTaskerFee(fee: number): boolean {
  return fee >= 10;
}

// Platform takes 15% commission on (tasker_fee + boost)
export function calculateCommission(taskerFee: number, boost: number): number {
  return Math.round(0.15 * (taskerFee + boost));
}

// What tasker actually receives after task completion:
// tasker_payout = amount + (tasker_fee + boost - commission)
export function calculateTaskerPayout(
  productAmount: number,
  taskerFee: number,
  boost: number,
): number {
  const commission = calculateCommission(taskerFee, boost);
  return productAmount + (taskerFee + boost - commission);
}

// ─── Legacy helpers (kept for backward compatibility) ──────────────────────
export const PLATFORM_FEE_PERCENT = 5;

/** @deprecated Use calculatePlatformFee instead */
export function getPlatformFee(amount: number): number {
  return calculatePlatformFee(amount);
}

/**
 * Approximates tasker earning for display in Wallet/Admin.
 * Without separate taskerFee/boost breakdown we use ~85% as estimate
 * (platform fee ~5–7% + 15% commission on ~10–15% fee portion).
 * @deprecated Use calculateTaskerPayout where exact values are available.
 */
export function getTaskerEarning(totalAmount: number): number {
  // Approximate: tasker gets total - platform_fee - commission
  // Platform fee is tiered; commission is ~15% of ~15-20% of total
  // Best-effort: 85% of stored total
  return Math.round(totalAmount * 0.85);
}
