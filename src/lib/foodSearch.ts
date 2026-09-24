/**
 * Unified food search: prior confirmed + fast-food index + CNF + Open Food Facts.
 * Deep links for grocery sites (CORS blocks in-page scrape from GitHub Pages).
 */

import { searchFastFood } from "../data/fastFoodIndex";
import { searchConfirmedFoods } from "./confirmedFoods";
import { friendlyDisplayName, sourceLabel } from "./displayName";
import {
  lookupNutritionMerged,
  type MacroSet,
  type NutritionHit,
} from "./nutrition";

export type FoodSearchHit = {
  id: string;
  name: string;
  displayName: string;
  brand?: string;
  servingLabel: string;
  perServing: MacroSet;
  source: "cnf" | "openfoodfacts" | "fastfood" | "memory";
  sourceUrl?: string;
  /** Short label for the Source button (CNF / OFF / Tim Hortons / …). */
  sourceButtonLabel: string;
  note?: string;
  imageUrl?: string;
  /** Ranking hint (higher = nearer top). */
  _score?: number;
};

export function groceryDeepLinks(foodName: string): {
  label: string;
  url: string;
}[] {
  const q = foodName.trim() || "food";
  const nutritionQ = `${q} nutrition facts`;
  return [
    {
      label: "Walmart.ca",
      url: `https://www.walmart.ca/search?q=${encodeURIComponent(q)}`,
    },
    {
      label: "Real Canadian Superstore",
      url: `https://www.realcanadiansuperstore.ca/en/search?search-bar=${encodeURIComponent(q)}`,
    },
    {
      label: "Google nutrition",
      url: `https://www.google.com/search?q=${encodeURIComponent(nutritionQ)}`,
    },
  ];
}

function relevanceBoost(hit: FoodSearchHit, q: string): number {
  const raw = q.toLowerCase().trim();
  const hay = `${hit.displayName} ${hit.name} ${hit.brand ?? ""}`.toLowerCase();
  let s = 0;
  if (hit.displayName.toLowerCase() === raw) s += 40;
  if (hay.includes(raw)) s += 20;
  if (hit.source === "memory") s += 30;
  if (hit.source === "fastfood") {
    s += 12;
    // Short ingredient queries (egg, bacon) — surface menu items near top
    if (raw.length <= 6 && hay.includes(raw)) s += 18;
  }
  if (hit.source === "cnf") s += 8;
  if (hit.source === "openfoodfacts") s += 4;
  return s;
}

export async function searchAllFoods(query: string): Promise<FoodSearchHit[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const hits: FoodSearchHit[] = [];
  const seen = new Set<string>();

  const push = (h: FoodSearchHit) => {
    const key = `${h.source}:${h.name.toLowerCase()}`;
    const nameKey = h.name.toLowerCase();
    if (seen.has(key) || seen.has(nameKey)) return;
    seen.add(key);
    seen.add(nameKey);
    hits.push({ ...h, _score: relevanceBoost(h, q) });
  };

  for (const m of searchConfirmedFoods(q, 6)) {
    push({
      id: m.id,
      name: m.name,
      displayName: friendlyDisplayName(m.name),
      servingLabel: m.servingLabel || "1 serving",
      perServing: m.macros,
      source: "memory",
      sourceButtonLabel: sourceLabel("memory"),
      note: `Previously confirmed · ${m.source}`,
    });
  }

  // Fast-food early so short queries like "egg" include Tims / McD near top
  for (const f of searchFastFood(q, 10)) {
    push({
      id: f.id,
      name: f.name,
      displayName: f.name,
      brand: f.brand,
      servingLabel: f.servingLabel,
      perServing: f.perServing,
      source: "fastfood",
      sourceUrl: f.sourceUrl,
      sourceButtonLabel: sourceLabel("fastfood", f.brand),
      note: f.note,
    });
  }

  try {
    const nutrition = await lookupNutritionMerged(q);
    for (const n of nutrition) {
      push(nutritionHitToSearch(n));
    }
  } catch {
    // CNF/OFF failure — memory + fastfood still useful
  }

  hits.sort((a, b) => (b._score ?? 0) - (a._score ?? 0));
  return hits.slice(0, 24).map(({ _score: _s, ...rest }) => rest);
}

function nutritionHitToSearch(n: NutritionHit): FoodSearchHit {
  return {
    id: n.id,
    name: n.name,
    displayName: n.displayName || friendlyDisplayName(n.name),
    brand: n.brand,
    servingLabel: n.servingLabel,
    perServing: n.perServing,
    source: n.source,
    sourceUrl: n.sourceUrl,
    sourceButtonLabel: sourceLabel(n.source, n.brand),
    imageUrl: n.imageUrl,
  };
}
