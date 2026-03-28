// Returns true if current hour is between 23:00 and 04:59 (11 PM – 5 AM)
export function isSurgeActive(): boolean {
  const hour = new Date().getHours();
  return hour >= 23 || hour < 5;
}

// Returns surged price (×1.2) if surge active, else base price. Rounded to 2 decimal places.
export function getSurgePrice(basePrice: number): number {
  return isSurgeActive() ? Math.round(basePrice * 1.2 * 100) / 100 : basePrice;
}

export const SURGE_MULTIPLIER = 1.2;
