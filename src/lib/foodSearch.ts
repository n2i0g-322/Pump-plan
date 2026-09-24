/**
 * Unified food search: prior confirmed + fast-food index + CNF + Open Food Facts.
 * Deep links for grocery sites (CORS blocks in-page scrape from GitHub Pages).
 */

import { searchFastFood } from "../data/fastFoodIndex";
import { searchConfirmedFoods } from "./confirmedFoods";
import {
  lookupNutrition,
  type MacroSet,
  type NutritionHit,
} from "./nutrition";

export type FoodSearchHit = {
  id: string;
  name: string;
  brand?: string;
  servingLabel: string;
  perServing: MacroSet;
  source: "cnf" | "openfoodfacts" | "fastfood" | "memory";
  note?: string;
  imageUrl?: string;
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

export async function searchAllFoods(query: string): Promise<FoodSearchHit[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const hits: FoodSearchHit[] = [];
  const seen = new Set<string>();

  const push = (h: FoodSearchHit) => {
    const key = h.name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    hits.push(h);
  };

  for (const m of searchConfirmedFoods(q, 6)) {
    push({
      id: m.id,
      name: m.name,
      servingLabel: m.servingLabel || "1 serving",
      perServing: m.macros,
      source: "memory",
      note: `Previously confirmed · ${m.source}`,
    });
  }

  for (const f of searchFastFood(q, 8)) {
    push({
      id: f.id,
      name: f.name,
      brand: f.brand,
      servingLabel: f.servingLabel,
      perServing: f.perServing,
      source: "fastfood",
      note: f.note,
    });
  }

  try {
    const nutrition = await lookupNutrition(q);
    for (const n of nutrition) {
      push(nutritionHitToSearch(n));
    }
  } catch {
    // CNF/OFF failure — memory + fastfood still useful
  }

  return hits.slice(0, 20);
}

function nutritionHitToSearch(n: NutritionHit): FoodSearchHit {
  return {
    id: n.id,
    name: n.name,
    brand: n.brand,
    servingLabel: n.servingLabel,
    perServing: n.perServing,
    source: n.source,
    imageUrl: n.imageUrl,
  };
}
