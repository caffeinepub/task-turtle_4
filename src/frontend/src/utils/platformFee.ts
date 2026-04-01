// ─── Tiered Platform Fee (charged to user side) ─────────────────────────────
// ₹0–₹99   → ₹4
// ₹100–₹299 → ₹7
// ₹300–₹500 → ₹10
export function calculatePlatformFee(productAmount: number): number {
  if (productAmount <= 99) return 4;
  if (productAmount <= 299) return 7;
  return 10;
}

// Total charged to user upfront
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

export function validateTaskerFee(fee: number): boolean {
  return fee >= 10;
}

// ─── NEW: Tasker earnings calculation (15% cut on earnings only) ────────────
export function calculateGrossEarning(
  taskerFee: number,
  boostFee: number,
): number {
  return taskerFee + (boostFee || 0);
}

export function calculatePlatformCut(grossEarning: number): number {
  return +(grossEarning * 0.15).toFixed(2);
}

export function calculateNetEarning(
  taskerFee: number,
  boostFee: number,
): number {
  const gross = calculateGrossEarning(taskerFee, boostFee);
  const cut = calculatePlatformCut(gross);
  return +(gross - cut).toFixed(2);
}

export function calculateTotalReturned(
  taskAmount: number,
  netEarning: number,
): number {
  return +(taskAmount + netEarning).toFixed(2);
}

// ─── Legacy (kept for admin/wallet) ─────────────────────────────────────────
export const PLATFORM_FEE_PERCENT = 5;
export function calculateCommission(taskerFee: number, boost: number): number {
  return Math.round(0.15 * (taskerFee + boost));
}
export function calculateTaskerPayout(
  productAmount: number,
  taskerFee: number,
  boost: number,
): number {
  const commission = calculateCommission(taskerFee, boost);
  return productAmount + (taskerFee + boost - commission);
}
export function getPlatformFee(amount: number): number {
  return calculatePlatformFee(amount);
}
export function getTaskerEarning(totalAmount: number): number {
  return Math.round(totalAmount * 0.85);
}
