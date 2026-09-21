/**
 * Nutrition helpers — Health Canada Canadian Nutrient File (CNF) 2015 primary.
 * Open Food Facts is a fallback for branded packaged items not in CNF.
 * Not medical advice.
 */

export type MacroSet = {
  calories: number;
  protein: number;
  carbs: number;
  sugar: number;
  fat: number;
  calcium: number;
  fluid: number;
};

export type NutritionHit = {
  id: string;
  name: string;
  brand?: string;
  servingLabel: string;
  servingGrams?: number;
  perServing: MacroSet;
  source: "cnf" | "openfoodfacts";
  imageUrl?: string;
};

export const EMPTY_MACROS: MacroSet = {
  calories: 0,
  protein: 0,
  carbs: 0,
  sugar: 0,
  fat: 0,
  calcium: 0,
  fluid: 0,
};

type CnfFood = {
  id: number;
  name: string;
  group?: string;
  per100: MacroSet;
  measures: Array<{ label: string; grams: number }>;
};

type CnfIndex = {
  source: string;
  url: string;
  foods: CnfFood[];
};

let cnfPromise: Promise<CnfIndex> | null = null;

function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function scaleMacros(m: MacroSet, factor: number): MacroSet {
  return {
    calories: Math.round(m.calories * factor),
    protein: Math.round(m.protein * factor * 10) / 10,
    carbs: Math.round(m.carbs * factor * 10) / 10,
    sugar: Math.round(m.sugar * factor * 10) / 10,
    fat: Math.round(m.fat * factor * 10) / 10,
    calcium: Math.round(m.calcium * factor),
    fluid: Math.round(m.fluid * factor),
  };
}

export function addMacros(a: MacroSet, b: MacroSet): MacroSet {
  return {
    calories: a.calories + b.calories,
    protein: Math.round((a.protein + b.protein) * 10) / 10,
    carbs: Math.round((a.carbs + b.carbs) * 10) / 10,
    sugar: Math.round((a.sugar + b.sugar) * 10) / 10,
    fat: Math.round((a.fat + b.fat) * 10) / 10,
    calcium: a.calcium + b.calcium,
    fluid: a.fluid + b.fluid,
  };
}

export function macrosToNutrientMap(m: MacroSet): Record<string, number> {
  return {
    calories: m.calories,
    protein: m.protein,
    carbs: m.carbs,
    sugar: m.sugar,
    fat: m.fat,
    calcium: m.calcium,
    fluid: m.fluid,
  };
}

function from100g(n100: MacroSet, grams: number): MacroSet {
  return scaleMacros(n100, grams / 100);
}

async function loadCnf(): Promise<CnfIndex> {
  if (!cnfPromise) {
    cnfPromise = fetch("./cnf/foods.json", { cache: "force-cache" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Could not load Canadian Nutrient File (${res.status})`);
        return (await res.json()) as CnfIndex;
      })
      .catch((err) => {
        cnfPromise = null;
        throw err;
      });
  }
  return cnfPromise;
}

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s+\-']/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function scoreFood(food: CnfFood, tokens: string[], raw: string): number {
  const name = food.name.toLowerCase();
  const hay = `${name} ${food.group ?? ""}`.toLowerCase();
  if (!tokens.length) return 0;
  let score = 0;
  let matched = 0;
  for (const t of tokens) {
    if (hay.includes(t)) {
      matched += 1;
      score += t.length * 3;
      if (name.startsWith(t) || name.includes(`, ${t}`) || name.includes(`${t},`)) score += 10;
    }
  }
  if (tokens.length <= 2 && matched < tokens.length) return 0;
  if (matched / tokens.length < 0.6) return 0;
  if (name === raw) score += 50;
  if (name.includes(raw)) score += 16;

  // Prefer everyday kitchen forms; push industrial / obscure forms down
  const prefer = [
    "whole, cooked",
    "whole, raw",
    "hard-cooked",
    "boiled",
    "fried",
    "poached",
    "scrambled",
    "large",
    "fresh",
  ];
  for (const p of prefer) {
    if (name.includes(p)) score += 18;
  }
  const penalize = [
    "dried",
    "powder",
    "stabilized",
    "substitute",
    "frozen mixture",
    "dehydrated",
    "instant",
    "mix,",
    "native,",
    "babyfood",
    "baby food",
    "cereal",
    "dinosaur",
    "quaker",
  ];
  for (const p of penalize) {
    if (name.includes(p)) score -= 40;
  }
  // Household measures beat lab-style tiny scoops when names tie
  const m0 = food.measures[0]?.label.toLowerCase() ?? "";
  if (m0.includes("large") || m0.includes("medium") || m0.includes("egg")) score += 8;
  if (m0.includes("sifted") || m0.includes("15ml") || m0.includes("5 g")) score -= 12;
  return score;
}

function cnfToHits(foods: CnfFood[], limit = 10): NutritionHit[] {
  const hits: NutritionHit[] = [];
  for (const food of foods.slice(0, limit)) {
    const measure = food.measures[0] ?? { label: "100 g", grams: 100 };
    const grams = measure.grams > 0 ? measure.grams : 100;
    hits.push({
      id: `cnf-${food.id}`,
      name: food.name,
      brand: food.group || undefined,
      servingLabel: `${measure.label} (${grams} g)`,
      servingGrams: grams,
      perServing: from100g(food.per100, grams),
      source: "cnf",
    });
  }
  return hits;
}

/** Search Health Canada CNF 2015 (local index). */
export async function searchCnf(query: string): Promise<NutritionHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const index = await loadCnf();
  const tokens = tokenize(q);
  const raw = q.toLowerCase();
  const ranked = index.foods
    .map((food) => ({ food, score: scoreFood(food, tokens, raw) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name));
  return cnfToHits(
    ranked.slice(0, 12).map((r) => r.food),
    12,
  );
}

/** Fallback: Open Food Facts for branded packaged foods not in CNF. */
async function searchOpenFoodFacts(query: string): Promise<NutritionHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url =
    "https://world.openfoodfacts.org/cgi/search.pl?" +
    new URLSearchParams({
      search_terms: q,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "6",
      fields:
        "code,product_name,brands,serving_size,serving_quantity,nutriments,image_front_small_url",
    }).toString();

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    products?: Array<{
      code?: string;
      product_name?: string;
      brands?: string;
      serving_size?: string;
      serving_quantity?: number | string;
      image_front_small_url?: string;
      nutriments?: Record<string, number | string>;
    }>;
  };

  const hits: NutritionHit[] = [];
  for (const p of data.products ?? []) {
    const n = p.nutriments ?? {};
    const per100: MacroSet = {
      calories: num(n["energy-kcal_100g"] ?? n.energy_kcal_100g),
      protein: num(n.proteins_100g),
      carbs: num(n.carbohydrates_100g),
      sugar: num(n.sugars_100g),
      fat: num(n.fat_100g),
      calcium: num(n.calcium_100g),
      fluid: 0,
    };
    if (per100.calcium > 0 && per100.calcium < 5) {
      per100.calcium = Math.round(per100.calcium * 1000);
    }
    let grams = num(p.serving_quantity);
    if (!grams) {
      const m = String(p.serving_size ?? "").match(/(\d+(?:\.\d+)?)\s*g/i);
      grams = m ? num(m[1]) : 100;
    }
    if (grams <= 0) grams = 100;
    const name = (p.product_name || q).trim();
    if (!name) continue;
    if (per100.calories <= 0 && per100.protein <= 0 && per100.carbs <= 0) continue;
    hits.push({
      id: `off-${p.code ?? name}`,
      name,
      brand: p.brands?.split(",")[0]?.trim(),
      servingLabel: p.serving_size?.trim() || `${grams} g (typical)`,
      servingGrams: grams,
      perServing: from100g(per100, grams),
      source: "openfoodfacts",
      imageUrl: p.image_front_small_url,
    });
  }
  return hits;
}

/**
 * Look up nutrition: Canadian Nutrient File first, then Open Food Facts
 * only if CNF has no good matches (e.g. branded packaged foods).
 */
export async function lookupNutrition(query: string): Promise<NutritionHit[]> {
  const cnf = await searchCnf(query);
  if (cnf.length >= 3) return cnf;
  try {
    const off = await searchOpenFoodFacts(query);
    // Prefer CNF hits, then OFF
    const seen = new Set(cnf.map((h) => h.name.toLowerCase()));
    const merged = [...cnf];
    for (const h of off) {
      if (seen.has(h.name.toLowerCase())) continue;
      merged.push(h);
      if (merged.length >= 12) break;
    }
    return merged;
  } catch {
    return cnf;
  }
}

/** Compress an image File for localStorage (max edge ~960px, JPEG ~0.7). */
export function compressImage(
  file: File,
  maxEdge = 960,
  quality = 0.72,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const scale = Math.min(1, maxEdge / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}
