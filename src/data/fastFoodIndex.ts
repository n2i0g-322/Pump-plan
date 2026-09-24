/**
 * Curated Canadian fast-food / common packaged snack mini-index.
 * Approximate macros for typical servings — not lab assays. Label source clearly in UI.
 */

import { brandSiteSearchUrl } from "../lib/displayName";
import type { MacroSet } from "../lib/nutrition";

export type FastFoodItem = {
  id: string;
  name: string;
  brand: string;
  servingLabel: string;
  perServing: MacroSet;
  /** Approximate / branded source note */
  note: string;
  /** Official nutrition page or well-known PDF / site search */
  sourceUrl?: string;
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

function url(brand: string, name: string, known?: string): string {
  return known ?? brandSiteSearchUrl(brand, name);
}

const TH = "Tim Hortons";
const MCD = "McDonald's Canada";
const AW = "A&W Canada";
const SUB = "Subway";
const WEN = "Wendy's";
const SBX = "Starbucks";

/** Searchable Canadian-ish fast food & packaged snacks (approx macros). */
export const FAST_FOOD_INDEX: FastFoodItem[] = [
  // ── Tim Hortons (breakfast / egg) ──
  {
    id: "ff-th-original-blend-med",
    name: "Original Blend coffee (medium)",
    brand: TH,
    servingLabel: "1 medium (~14 oz / 414 ml), black",
    perServing: m(3, 0.3, 0, 0, 0, 10, 414),
    note: "Approx. black coffee",
    sourceUrl: url(TH, "Original Blend coffee", "https://www.timhortons.ca/nutrition-info"),
  },
  {
    id: "ff-th-doubledouble-med",
    name: "Double Double (medium)",
    brand: TH,
    servingLabel: "1 medium with 2 cream + 2 sugar",
    perServing: m(230, 2, 26, 26, 13, 60, 400),
    note: "Approx. classic Double Double",
    sourceUrl: url(TH, "Double Double", "https://www.timhortons.ca/nutrition-info"),
  },
  {
    id: "ff-th-icetrap-med",
    name: "Iced capp (medium)",
    brand: TH,
    servingLabel: "1 medium",
    perServing: m(350, 5, 48, 44, 15, 150, 450),
    note: "Approx. original iced capp",
    sourceUrl: url(TH, "Iced Capp", "https://www.timhortons.ca/nutrition-info"),
  },
  {
    id: "ff-th-timbit",
    name: "Timbits (assorted)",
    brand: TH,
    servingLabel: "1 Timbit",
    perServing: m(50, 0.7, 7, 3, 2.2, 5, 0),
    note: "Approx. average Timbit",
    sourceUrl: url(TH, "Timbits", "https://www.timhortons.ca/nutrition-info"),
  },
  {
    id: "ff-th-bagel-plain",
    name: "Plain bagel",
    brand: TH,
    servingLabel: "1 bagel, no spread",
    perServing: m(290, 10, 57, 5, 2, 80, 0),
    note: "Approx. plain bagel",
    sourceUrl: url(TH, "bagel", "https://www.timhortons.ca/nutrition-info"),
  },
  {
    id: "ff-th-farmers-wrap",
    name: "Farmer's Breakfast Wrap",
    brand: TH,
    servingLabel: "1 wrap",
    perServing: m(580, 27, 48, 4, 30, 200, 0),
    note: "Approx. breakfast wrap (egg + sausage)",
    sourceUrl: url(TH, "Farmer's Breakfast Wrap", "https://www.timhortons.ca/nutrition-info"),
  },
  {
    id: "ff-th-sour-cream-glazed",
    name: "Sour cream glazed donut",
    brand: TH,
    servingLabel: "1 donut",
    perServing: m(340, 4, 42, 18, 17, 20, 0),
    note: "Approx. classic donut",
    sourceUrl: url(TH, "sour cream glazed", "https://www.timhortons.ca/nutrition-info"),
  },
  {
    id: "ff-th-sausage-farmer-sandwich",
    name: "Sausage Farmer's Breakfast Sandwich",
    brand: TH,
    servingLabel: "1 sandwich",
    perServing: m(540, 25, 38, 4, 32, 180, 0),
    note: "Approx. egg + sausage breakfast sandwich",
    sourceUrl: url(TH, "Farmer's Breakfast Sandwich", "https://www.timhortons.ca/nutrition-info"),
  },
  {
    id: "ff-th-bacon-farmer-sandwich",
    name: "Bacon Farmer's Breakfast Sandwich",
    brand: TH,
    servingLabel: "1 sandwich",
    perServing: m(480, 24, 37, 4, 26, 170, 0),
    note: "Approx. egg + bacon breakfast sandwich",
    sourceUrl: url(TH, "Bacon Farmer's Breakfast Sandwich", "https://www.timhortons.ca/nutrition-info"),
  },
  {
    id: "ff-th-egg-cheese-muffin",
    name: "Egg & Cheese Breakfast Sandwich",
    brand: TH,
    servingLabel: "1 sandwich on English muffin",
    perServing: m(320, 16, 30, 3, 15, 200, 0),
    note: "Approx. egg & cheese muffin",
    sourceUrl: url(TH, "Egg Cheese Breakfast Sandwich", "https://www.timhortons.ca/nutrition-info"),
  },
  {
    id: "ff-th-hashbrown",
    name: "Hash Brown",
    brand: TH,
    servingLabel: "1 piece",
    perServing: m(130, 1, 16, 0, 7, 5, 0),
    note: "Approx. Tim Hortons hash brown",
    sourceUrl: url(TH, "Hash Brown", "https://www.timhortons.ca/nutrition-info"),
  },
  {
    id: "ff-th-oatmeal",
    name: "Maple pecan oatmeal",
    brand: TH,
    servingLabel: "1 bowl",
    perServing: m(290, 7, 48, 18, 8, 40, 0),
    note: "Approx. prepared oatmeal",
    sourceUrl: url(TH, "oatmeal", "https://www.timhortons.ca/nutrition-info"),
  },

  // ── McDonald's Canada (breakfast / egg) ──
  {
    id: "ff-mcd-bigmac",
    name: "Big Mac",
    brand: MCD,
    servingLabel: "1 sandwich",
    perServing: m(530, 26, 44, 9, 28, 230, 0),
    note: "Approx. Canadian Big Mac",
    sourceUrl: url(MCD, "Big Mac", "https://www.mcdonalds.com/ca/en-ca/full-menu.html"),
  },
  {
    id: "ff-mcd-hamburger",
    name: "Hamburger",
    brand: MCD,
    servingLabel: "1 sandwich",
    perServing: m(250, 13, 31, 6, 9, 80, 0),
    note: "Approx. hamburger",
    sourceUrl: url(MCD, "Hamburger", "https://www.mcdonalds.com/ca/en-ca/full-menu.html"),
  },
  {
    id: "ff-mcd-mcchicken",
    name: "McChicken",
    brand: MCD,
    servingLabel: "1 sandwich",
    perServing: m(410, 15, 41, 5, 21, 60, 0),
    note: "Approx. McChicken",
    sourceUrl: url(MCD, "McChicken", "https://www.mcdonalds.com/ca/en-ca/full-menu.html"),
  },
  {
    id: "ff-mcd-fries-med",
    name: "French fries (medium)",
    brand: MCD,
    servingLabel: "1 medium",
    perServing: m(340, 4, 44, 0.3, 16, 15, 0),
    note: "Approx. medium fries",
    sourceUrl: url(MCD, "French fries", "https://www.mcdonalds.com/ca/en-ca/full-menu.html"),
  },
  {
    id: "ff-mcd-nuggets-6",
    name: "Chicken McNuggets (6 pc)",
    brand: MCD,
    servingLabel: "6 pieces",
    perServing: m(250, 14, 15, 0, 15, 15, 0),
    note: "Approx. 6-piece, no sauce",
    sourceUrl: url(MCD, "McNuggets", "https://www.mcdonalds.com/ca/en-ca/full-menu.html"),
  },
  {
    id: "ff-mcd-egg-mcmuffin",
    name: "Egg McMuffin",
    brand: MCD,
    servingLabel: "1 sandwich",
    perServing: m(300, 17, 29, 3, 12, 230, 0),
    note: "Approx. Egg McMuffin (Canadian egg)",
    sourceUrl: url(MCD, "Egg McMuffin", "https://www.mcdonalds.com/ca/en-ca/full-menu/breakfast.html"),
  },
  {
    id: "ff-mcd-sausage-mcmuffin-egg",
    name: "Sausage McMuffin with Egg",
    brand: MCD,
    servingLabel: "1 sandwich",
    perServing: m(480, 21, 29, 3, 31, 200, 0),
    note: "Approx. sausage + egg McMuffin",
    sourceUrl: url(MCD, "Sausage McMuffin with Egg", "https://www.mcdonalds.com/ca/en-ca/full-menu/breakfast.html"),
  },
  {
    id: "ff-mcd-bacon-egg-cheese-biscuit",
    name: "Bacon Egg & Cheese Biscuit",
    brand: MCD,
    servingLabel: "1 sandwich",
    perServing: m(460, 18, 38, 4, 26, 180, 0),
    note: "Approx. bacon egg cheese biscuit",
    sourceUrl: url(MCD, "Bacon Egg Cheese Biscuit", "https://www.mcdonalds.com/ca/en-ca/full-menu/breakfast.html"),
  },
  {
    id: "ff-mcd-hotcakes",
    name: "Hotcakes (3) with syrup & butter",
    brand: MCD,
    servingLabel: "3 cakes + syrup + butter",
    perServing: m(580, 9, 98, 42, 16, 80, 0),
    note: "Approx. hotcakes meal component",
    sourceUrl: url(MCD, "Hotcakes", "https://www.mcdonalds.com/ca/en-ca/full-menu/breakfast.html"),
  },
  {
    id: "ff-mcd-hashbrown",
    name: "Hash Brown",
    brand: MCD,
    servingLabel: "1 piece",
    perServing: m(140, 1, 16, 0, 8, 5, 0),
    note: "Approx. hash brown",
    sourceUrl: url(MCD, "Hash Brown", "https://www.mcdonalds.com/ca/en-ca/full-menu/breakfast.html"),
  },
  {
    id: "ff-mcd-apple-pie",
    name: "Baked apple pie",
    brand: MCD,
    servingLabel: "1 pie",
    perServing: m(250, 2, 34, 13, 12, 10, 0),
    note: "Approx. baked apple pie",
    sourceUrl: url(MCD, "apple pie", "https://www.mcdonalds.com/ca/en-ca/full-menu.html"),
  },
  {
    id: "ff-mcd-scrambled-eggs",
    name: "Scrambled eggs (breakfast)",
    brand: MCD,
    servingLabel: "1 serving (~2 eggs)",
    perServing: m(170, 14, 2, 1, 12, 60, 0),
    note: "Approx. McD scrambled eggs side",
    sourceUrl: url(MCD, "scrambled eggs", "https://www.mcdonalds.com/ca/en-ca/full-menu/breakfast.html"),
  },

  // ── A&W Canada ──
  {
    id: "ff-aw-teen",
    name: "Teen Burger",
    brand: AW,
    servingLabel: "1 burger",
    perServing: m(480, 25, 38, 8, 25, 150, 0),
    note: "Approx. Teen Burger",
    sourceUrl: url(AW, "Teen Burger", "https://web.aw.ca/en/nutrition"),
  },
  {
    id: "ff-aw-rootbeer-med",
    name: "Root beer (medium)",
    brand: AW,
    servingLabel: "1 medium (~500 ml)",
    perServing: m(210, 0, 56, 56, 0, 0, 500),
    note: "Approx. sugar-sweetened",
    sourceUrl: url(AW, "root beer", "https://web.aw.ca/en/nutrition"),
  },
  {
    id: "ff-aw-egg-cheese-muffin",
    name: "Egg & Cheese on a Bun",
    brand: AW,
    servingLabel: "1 sandwich",
    perServing: m(340, 16, 32, 4, 16, 180, 0),
    note: "Approx. A&W breakfast egg sandwich",
    sourceUrl: url(AW, "Egg Cheese Bun", "https://web.aw.ca/en/nutrition"),
  },
  {
    id: "ff-aw-bacon-egg-cheese",
    name: "Bacon & Eggs Breakfast Burger",
    brand: AW,
    servingLabel: "1 sandwich",
    perServing: m(520, 26, 34, 5, 30, 160, 0),
    note: "Approx. bacon egg breakfast burger",
    sourceUrl: url(AW, "Bacon Eggs Breakfast", "https://web.aw.ca/en/nutrition"),
  },
  {
    id: "ff-aw-potato-patty",
    name: "Potato Patty",
    brand: AW,
    servingLabel: "1 patty",
    perServing: m(150, 2, 18, 0, 8, 10, 0),
    note: "Approx. A&W potato patty",
    sourceUrl: url(AW, "Potato Patty", "https://web.aw.ca/en/nutrition"),
  },

  // ── Subway ──
  {
    id: "ff-sub-turkey-6",
    name: "Turkey breast sub (6\")",
    brand: SUB,
    servingLabel: '6" on Italian, veggies, no cheese/sauce',
    perServing: m(280, 18, 46, 7, 3.5, 40, 0),
    note: "Approx. turkey 6-inch",
    sourceUrl: url(SUB, "turkey breast nutrition", "https://www.subway.com/en-CA/MenuNutrition/Nutrition"),
  },
  {
    id: "ff-sub-egg-cheese-6",
    name: "Egg & Cheese Breakfast (6\")",
    brand: SUB,
    servingLabel: '6" egg & cheese',
    perServing: m(380, 20, 42, 5, 15, 220, 0),
    note: "Approx. Subway egg breakfast",
    sourceUrl: url(SUB, "Egg Cheese Breakfast", "https://www.subway.com/en-CA/MenuNutrition/Nutrition"),
  },
  {
    id: "ff-sub-bacon-egg-cheese-6",
    name: "Bacon, Egg & Cheese (6\")",
    brand: SUB,
    servingLabel: '6" breakfast sub',
    perServing: m(460, 24, 42, 5, 22, 200, 0),
    note: "Approx. bacon egg cheese breakfast",
    sourceUrl: url(SUB, "Bacon Egg Cheese", "https://www.subway.com/en-CA/MenuNutrition/Nutrition"),
  },

  // ── Wendy's ──
  {
    id: "ff-wen-dave-single",
    name: "Dave's Single",
    brand: WEN,
    servingLabel: "1 burger",
    perServing: m(590, 30, 39, 9, 34, 150, 0),
    note: "Approx. Dave's Single",
    sourceUrl: url(WEN, "Dave's Single", "https://www.wendys.com/nutrition-info"),
  },
  {
    id: "ff-wen-egg-sandwich",
    name: "Bacon, Egg & Cheese Sandwich",
    brand: WEN,
    servingLabel: "1 sandwich",
    perServing: m(420, 22, 35, 4, 21, 180, 0),
    note: "Approx. Wendy's breakfast sandwich",
    sourceUrl: url(WEN, "Bacon Egg Cheese", "https://www.wendys.com/nutrition-info"),
  },
  {
    id: "ff-wen-sausage-egg",
    name: "Sausage, Egg & Cheese Sandwich",
    brand: WEN,
    servingLabel: "1 sandwich",
    perServing: m(500, 23, 35, 4, 30, 170, 0),
    note: "Approx. sausage egg cheese",
    sourceUrl: url(WEN, "Sausage Egg Cheese", "https://www.wendys.com/nutrition-info"),
  },

  // ── Starbucks ──
  {
    id: "ff-sbx-latte-grande",
    name: "Caffè Latte (Grande, 2%)",
    brand: SBX,
    servingLabel: "1 Grande (16 oz)",
    perServing: m(190, 12, 18, 17, 7, 400, 470),
    note: "Approx. grande 2% latte",
    sourceUrl: url(SBX, "Caffe Latte", "https://www.starbucks.ca/menu/nutrition"),
  },
  {
    id: "ff-sbx-bacon-gouda",
    name: "Bacon & Gouda Egg Sandwich",
    brand: SBX,
    servingLabel: "1 sandwich",
    perServing: m(360, 19, 35, 3, 16, 200, 0),
    note: "Approx. bacon gouda egg sandwich",
    sourceUrl: url(SBX, "Bacon Gouda Egg Sandwich", "https://www.starbucks.ca/menu/nutrition"),
  },
  {
    id: "ff-sbx-spinach-feta-wrap",
    name: "Spinach, Feta & Egg White Wrap",
    brand: SBX,
    servingLabel: "1 wrap",
    perServing: m(290, 19, 33, 5, 8, 220, 0),
    note: "Approx. egg white wrap",
    sourceUrl: url(SBX, "Spinach Feta Egg White Wrap", "https://www.starbucks.ca/menu/nutrition"),
  },
  {
    id: "ff-sbx-egg-bites-bacon",
    name: "Bacon & Gruyère Egg Bites",
    brand: SBX,
    servingLabel: "1 package (2 bites)",
    perServing: m(300, 19, 9, 2, 20, 180, 0),
    note: "Approx. sous vide egg bites",
    sourceUrl: url(SBX, "Bacon Gruyere Egg Bites", "https://www.starbucks.ca/menu/nutrition"),
  },
  {
    id: "ff-sbx-egg-bites-eggwhite",
    name: "Egg White & Roasted Red Pepper Bites",
    brand: SBX,
    servingLabel: "1 package (2 bites)",
    perServing: m(170, 12, 11, 3, 8, 100, 0),
    note: "Approx. egg white bites",
    sourceUrl: url(SBX, "Egg White Roasted Red Pepper Bites", "https://www.starbucks.ca/menu/nutrition"),
  },

  // ── Pizza / packaged snacks ──
  {
    id: "ff-pizza-slice-pepperoni",
    name: "Pepperoni pizza slice",
    brand: "Typical CA chain",
    servingLabel: "1 large slice (~1/8 of 14\")",
    perServing: m(300, 13, 33, 3, 13, 180, 0),
    note: "Approx. large pepperoni slice",
    sourceUrl: brandSiteSearchUrl("pizza", "pepperoni slice nutrition"),
  },
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
  // Single short token like "egg" — still match brand menus strongly
  const ranked = FAST_FOOD_INDEX.map((item) => {
    const hay = `${item.name} ${item.brand} ${item.note}`.toLowerCase();
    let score = 0;
    if (hay.includes(q)) score += 50;
    for (const t of tokens.length ? tokens : [q]) {
      if (t.length < 2 && q.length >= 2) continue;
      if (hay.includes(t)) score += 12;
      // Boost menu items when query is a common ingredient (egg, bacon…)
      if (item.name.toLowerCase().includes(t)) score += 8;
      if (item.brand.toLowerCase().includes(t)) score += 6;
    }
    // Extra boost for breakfast/egg items when query is egg-related
    if (/\begg\b/.test(q) && /\begg\b/.test(hay)) score += 25;
    if (/\bbreakfast\b/.test(q) && /breakfast|egg|muffin|wrap|biscuit|hotcake/i.test(hay)) {
      score += 15;
    }
    return { item, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit).map((r) => r.item);
}
