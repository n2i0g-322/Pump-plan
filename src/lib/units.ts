/** Convert ounces to milliliters (rounded). */
export function ozToMl(oz: number): number {
  return Math.round(oz * 29.5735);
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
