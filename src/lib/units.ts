/** US fluid ounce ↔ milliliter (exact culinary constant used in the app). */
export const ML_PER_OZ = 29.5735;

/** Convert ounces to milliliters (rounded to nearest ml). */
export function ozToMl(oz: number): number {
  if (!Number.isFinite(oz) || oz === 0) return 0;
  return Math.round(oz * ML_PER_OZ);
}

/** Convert milliliters to ounces (1 decimal). */
export function mlToOz(ml: number): number {
  if (!Number.isFinite(ml) || ml === 0) return 0;
  return round1(ml / ML_PER_OZ);
}

/** Convert milliliters to liters (3 decimals for live typing). */
export function mlToL(ml: number): number {
  if (!Number.isFinite(ml) || ml === 0) return 0;
  return Math.round((ml / 1000) * 1000) / 1000;
}

/** Convert liters to milliliters (rounded). */
export function lToMl(l: number): number {
  if (!Number.isFinite(l) || l === 0) return 0;
  return Math.round(l * 1000);
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Format a live total line from a milliliter canonical value. */
export function formatMlTotal(ml: number): string {
  const safe = Number.isFinite(ml) && ml > 0 ? ml : 0;
  return `${mlToOz(safe)} oz · ${Math.round(safe)} ml · ${mlToL(safe)} L`;
}

/** Format a live total line from an ounce canonical value. */
export function formatOzTotal(oz: number): string {
  const safe = Number.isFinite(oz) && oz > 0 ? oz : 0;
  return `${round1(safe)} oz · ${ozToMl(safe)} ml`;
}
