/**
 * Curated Canadian fast-food / common packaged snack mini-index.
 * Approximate macros for typical servings — not lab assays. Label source clearly in UI.
 */

import type { MacroSet } from "../lib/nutrition";

export type FastFoodItem = {
  id: string;
  name: string;
  brand: string;
  servingLabel: string;
  perServing: MacroSet;
  /** Approximate / branded source note */
  note: string;
};

function m(
  calories: number,
  protein: number,
  carbs: number,
  sugar: number,
  fat: number,
  calcium = 0,
  fluid = 0,
): MacroSet {
  return { calories, protein, carbs, sugar, fat, calcium, fluid };
}

/** Searchable Canadian-ish fast food & packaged snacks (approx macros). */
export const FAST_FOOD_INDEX: FastFoodItem[] = [
  // Tim Hortons
  {
    id: "ff-th-original-blend-med",
    name: "Original Blend coffee (medium)",
    brand: "Tim Hortons",
    servingLabel: "1 medium (~14 oz / 414 ml), black",
    perServing: m(3, 0.3, 0, 0, 0, 10, 414),
    note: "Approx. black coffee",
  },
  {
    id: "ff-th-doubledouble-med",
    name: "Double Double (medium)",
    brand: "Tim Hortons",
    servingLabel: "1 medium with 2 cream + 2 sugar",
    perServing: m(230, 2, 26, 26, 13, 60, 400),
    note: "Approx. classic Double Double",
  },
  {
    id: "ff-th-icetrap-med",
    name: "Iced capp (medium)",
    brand: "Tim Hortons",
    servingLabel: "1 medium",
    perServing: m(350, 5, 48, 44, 15, 150, 450),
    note: "Approx. original iced capp",
  },
  {
    id: "ff-th-timbit",
    name: "Timbits (assorted)",
    brand: "Tim Hortons",
    servingLabel: "1 Timbit",
    perServing: m(50, 0.7, 7, 3, 2.2, 5, 0),
    note: "Approx. average Timbit",
  },
  {
    id: "ff-th-bagel-plain",
    name: "Plain bagel",
    brand: "Tim Hortons",
    servingLabel: "1 bagel, no spread",
    perServing: m(290, 10, 57, 5, 2, 80, 0),
    note: "Approx. plain bagel",
  },
  {
    id: "ff-th-farmers-wrap",
    name: "Farmer's Breakfast Wrap",
    brand: "Tim Hortons",
    servingLabel: "1 wrap",
    perServing: m(580, 27, 48, 4, 30, 200, 0),
    note: "Approx. breakfast wrap",
  },
  {
    id: "ff-th-sour-cream-glazed",
    name: "Sour cream glazed donut",
    brand: "Tim Hortons",
    servingLabel: "1 donut",
    perServing: m(340, 4, 42, 18, 17, 20, 0),
    note: "Approx. classic donut",
  },

  // McDonald's Canada-ish
  {
    id: "ff-mcd-bigmac",
    name: "Big Mac",
    brand: "McDonald's Canada",
    servingLabel: "1 sandwich",
    perServing: m(530, 26, 44, 9, 28, 230, 0),
    note: "Approx. Canadian Big Mac",
  },
  {
    id: "ff-mcd-hamburger",
    name: "Hamburger",
    brand: "McDonald's Canada",
    servingLabel: "1 sandwich",
    perServing: m(250, 13, 31, 6, 9, 80, 0),
    note: "Approx. hamburger",
  },
  {
    id: "ff-mcd-mcchicken",
    name: "McChicken",
    brand: "McDonald's Canada",
    servingLabel: "1 sandwich",
    perServing: m(410, 15, 41, 5, 21, 60, 0),
    note: "Approx. McChicken",
  },
  {
    id: "ff-mcd-fries-med",
    name: "French fries (medium)",
    brand: "McDonald's Canada",
    servingLabel: "1 medium",
    perServing: m(340, 4, 44, 0.3, 16, 15, 0),
    note: "Approx. medium fries",
  },
  {
    id: "ff-mcd-nuggets-6",
    name: "Chicken McNuggets (6 pc)",
    brand: "McDonald's Canada",
    servingLabel: "6 pieces",
    perServing: m(250, 14, 15, 0, 15, 15, 0),
    note: "Approx. 6-piece, no sauce",
  },
  {
    id: "ff-mcd-egg-mcmuffin",
    name: "Egg McMuffin",
    brand: "McDonald's Canada",
    servingLabel: "1 sandwich",
    perServing: m(300, 17, 29, 3, 12, 230, 0),
    note: "Approx. Egg McMuffin",
  },
  {
    id: "ff-mcd-hashbrown",
    name: "Hash Brown",
    brand: "McDonald's Canada",
    servingLabel: "1 piece",
    perServing: m(140, 1, 16, 0, 8, 5, 0),
    note: "Approx. hash brown",
  },
  {
    id: "ff-mcd-apple-pie",
    name: "Baked apple pie",
    brand: "McDonald's Canada",
    servingLabel: "1 pie",
    perServing: m(250, 2, 34, 13, 12, 10, 0),
    note: "Approx. baked apple pie",
  },

  // A&W / Subway / other CA
  {
    id: "ff-aw-teen",
    name: "Teen Burger",
    brand: "A&W Canada",
    servingLabel: "1 burger",
    perServing: m(480, 25, 38, 8, 25, 150, 0),
    note: "Approx. Teen Burger",
  },
  {
    id: "ff-aw-rootbeer-med",
    name: "Root beer (medium)",
    brand: "A&W Canada",
    servingLabel: "1 medium (~500 ml)",
    perServing: m(210, 0, 56, 56, 0, 0, 500),
    note: "Approx. sugar-sweetened",
  },
  {
    id: "ff-sub-turkey-6",
    name: "Turkey breast sub (6\")",
    brand: "Subway",
    servingLabel: '6" on Italian, veggies, no cheese/sauce',
    perServing: m(280, 18, 46, 7, 3.5, 40, 0),
    note: "Approx. turkey 6-inch",
  },
  {
    id: "ff-pizza-slice-pepperoni",
    name: "Pepperoni pizza slice",
    brand: "Typical CA chain",
    servingLabel: "1 large slice (~1/8 of 14\")",
    perServing: m(300, 13, 33, 3, 13, 180, 0),
    note: "Approx. large pepperoni slice",
  },

  // Packaged snacks / grocery staples
  {
    id: "ff-snack-granola-bar",
    name: "Granola / cereal bar",
    brand: "Typical packaged",
    servingLabel: "1 bar (~35 g)",
    perServing: m(140, 2, 25, 10, 4, 20, 0),
    note: "Approx. chewy granola bar",
  },
  {
    id: "ff-snack-chips",
    name: "Potato chips",
    brand: "Typical packaged",
    servingLabel: "1 small bag (~40 g)",
    perServing: m(210, 2.5, 20, 0.5, 14, 10, 0),
    note: "Approx. salted chips",
  },
  {
    id: "ff-snack-chocolate-bar",
    name: "Milk chocolate bar",
    brand: "Typical packaged",
    servingLabel: "1 bar (~45 g)",
    perServing: m(240, 3, 28, 25, 13, 80, 0),
    note: "Approx. milk chocolate",
  },
  {
    id: "ff-snack-yogurt-cup",
    name: "Fruit yogurt cup",
    brand: "Typical packaged",
    servingLabel: "1 cup (~150 g)",
    perServing: m(140, 5, 24, 20, 2.5, 150, 0),
    note: "Approx. sweetened fruit yogurt",
  },
  {
    id: "ff-snack-protein-bar",
    name: "Protein bar",
    brand: "Typical packaged",
    servingLabel: "1 bar (~60 g)",
    perServing: m(220, 20, 22, 8, 8, 100, 0),
    note: "Approx. high-protein bar",
  },
  {
    id: "ff-snack-apple",
    name: "Apple (medium)",
    brand: "Fresh fruit",
    servingLabel: "1 medium apple (~180 g)",
    perServing: m(95, 0.5, 25, 19, 0.3, 10, 0),
    note: "Approx. medium apple",
  },
  {
    id: "ff-snack-banana",
    name: "Banana (medium)",
    brand: "Fresh fruit",
    servingLabel: "1 medium banana (~120 g)",
    perServing: m(105, 1.3, 27, 14, 0.4, 5, 0),
    note: "Approx. medium banana",
  },
  {
    id: "ff-drink-orange-juice",
    name: "Orange juice",
    brand: "Typical",
    servingLabel: "1 cup (250 ml)",
    perServing: m(110, 1.7, 26, 21, 0.3, 25, 250),
    note: "Approx. from concentrate",
  },
  {
    id: "ff-drink-chocolate-milk",
    name: "Chocolate milk",
    brand: "Typical",
    servingLabel: "1 cup (250 ml)",
    perServing: m(190, 8, 30, 28, 5, 280, 250),
    note: "Approx. 2% chocolate milk",
  },
];

export function searchFastFood(query: string, limit = 12): FastFoodItem[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return FAST_FOOD_INDEX.slice(0, limit);
  const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
  const ranked = FAST_FOOD_INDEX.map((item) => {
    const hay = `${item.name} ${item.brand} ${item.note}`.toLowerCase();
    let score = 0;
    if (hay.includes(q)) score += 40;
    for (const t of tokens) {
      if (hay.includes(t)) score += 10;
    }
    return { item, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit).map((r) => r.item);
}
