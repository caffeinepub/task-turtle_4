export const PLATFORM_FEE_PERCENT = 5;

export function getPlatformFee(amount: number): number {
  return Math.round(amount * 0.05);
}

export function getTaskerEarning(amount: number): number {
  return Math.round(amount * 0.95);
}
