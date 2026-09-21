/**
 * Approximate macros for prepared infant formula per fluid ounce.
 * Typical ready-to-feed / reconstituted formula ~20 kcal/fl oz.
 * Values are rough averages across common brands — not medical advice / not brand-specific.
 */
import type { MacroSet } from "./nutrition";
import { scaleMacros } from "./nutrition";
import { round1 } from "./units";

/** Per 1 fl oz prepared infant formula (approximate). */
export const FORMULA_PER_OZ: MacroSet = {
  calories: 20,
  protein: 0.45,
  carbs: 2.2,
  sugar: 2.2, // mostly lactose in standard formula
  fat: 1.05,
  calcium: 13, // mg
  fluid: 30, // ml
};

export function formulaMacrosForOz(oz: number): MacroSet {
  const safe = Number.isFinite(oz) && oz > 0 ? oz : 0;
  return scaleMacros(FORMULA_PER_OZ, safe);
}

export function sumFormulaOz(
  logs: Record<string, { oz: number; done?: boolean }> | undefined,
): number {
  if (!logs) return 0;
  let total = 0;
  for (const entry of Object.values(logs)) {
    if (!entry) continue;
    // Count all logged oz (done flag is optional UI state)
    if (typeof entry.oz === "number" && entry.oz > 0) total += entry.oz;
  }
  return round1(total);
}
