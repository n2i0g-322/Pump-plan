/** Seeded from the household PDF guide. Not medical advice. */

export type SegmentKind = "sleep" | "awake" | "pump" | "eat";

export type ClockSegment = {
  id: string;
  kind: SegmentKind;
  label: string;
  startMin: number;
  endMin: number;
};

export type MealSlot = {
  id: string;
  label: string;
  time: string;
  food: string;
};

export type DayPlan = {
  id: string;
  name: string;
  short: string;
  theme: string;
  blurb: string;
  meals: MealSlot[];
};

export const SEGMENT_COLORS: Record<SegmentKind, string> = {
  sleep: "#1a2744",
  awake: "#d9dde6",
  pump: "#e07a5f",
  eat: "#e6b84d",
};

export const DAILY_CLOCK: ClockSegment[] = [
  { id: "pump-0", kind: "pump", label: "Pump 12am", startMin: 0, endMin: 25 },
  { id: "sleep-1", kind: "sleep", label: "Sleep", startMin: 25, endMin: 180 },
  { id: "pump-3", kind: "pump", label: "Pump 3am", startMin: 180, endMin: 205 },
  { id: "sleep-2", kind: "sleep", label: "Sleep", startMin: 205, endMin: 360 },
  { id: "pump-6", kind: "pump", label: "Pump 6am", startMin: 360, endMin: 385 },
  { id: "eat-bf", kind: "eat", label: "Breakfast", startMin: 385, endMin: 445 },
  { id: "awake-1", kind: "awake", label: "Awake / baby care", startMin: 445, endMin: 540 },
  { id: "pump-9", kind: "pump", label: "Pump 9am", startMin: 540, endMin: 565 },
  { id: "eat-am", kind: "eat", label: "AM snack", startMin: 565, endMin: 600 },
  { id: "awake-2", kind: "awake", label: "Awake / baby care", startMin: 600, endMin: 720 },
  { id: "pump-12", kind: "pump", label: "Pump 12pm", startMin: 720, endMin: 745 },
  { id: "eat-lunch", kind: "eat", label: "Lunch", startMin: 745, endMin: 805 },
  { id: "awake-3", kind: "awake", label: "Awake / baby care", startMin: 805, endMin: 900 },
  { id: "pump-15", kind: "pump", label: "Pump 3pm", startMin: 900, endMin: 925 },
  { id: "eat-pm", kind: "eat", label: "PM snack", startMin: 925, endMin: 960 },
  { id: "awake-4", kind: "awake", label: "Awake / baby care", startMin: 960, endMin: 1080 },
  { id: "pump-18", kind: "pump", label: "Pump 6pm", startMin: 1080, endMin: 1105 },
  { id: "eat-dinner", kind: "eat", label: "Dinner", startMin: 1105, endMin: 1165 },
  { id: "awake-5", kind: "awake", label: "Wind down", startMin: 1165, endMin: 1260 },
  { id: "pump-21", kind: "pump", label: "Pump 9pm", startMin: 1260, endMin: 1290 },
  { id: "eat-eve", kind: "eat", label: "Evening snack", startMin: 1290, endMin: 1320 },
  { id: "sleep-3", kind: "sleep", label: "Sleep", startMin: 1320, endMin: 1440 },
];

export const DAYS: DayPlan[] = [
  {
    id: "mon", name: "Monday", short: "Mon", theme: "Choline + dairy",
    blurb: "Eggs for choline; yogurt and milk for calcium and extra calories.",
    meals: [
      { id: "bf", label: "Breakfast", time: "6:25", food: "2 eggs (yolks), toast + peanut butter, banana, water" },
      { id: "am", label: "AM snack", time: "9:25", food: "Greek yogurt + granola + berries" },
      { id: "lunch", label: "Lunch", time: "12:25", food: "Chicken wrap or sandwich, carrot sticks, glass of milk" },
      { id: "pm", label: "PM snack", time: "3:25", food: "Cheese + apple" },
      { id: "dinner", label: "Dinner", time: "6:25", food: "Turkey or chicken, potatoes, green vegetables, water" },
      { id: "eve", label: "Evening", time: "9:00", food: "Warm milk or chocolate milk + a few crackers" },
    ],
  },
  {
    id: "tue", name: "Tuesday", short: "Tue", theme: "DHA / fish day",
    blurb: "Fatty fish covers the weekly DHA target better than fish every day.",
    meals: [
      { id: "bf", label: "Breakfast", time: "6:25", food: "Overnight oats with milk, chia, peanut butter, berries" },
      { id: "am", label: "AM snack", time: "9:25", food: "Cottage cheese + pineapple or peaches" },
      { id: "lunch", label: "Lunch", time: "12:25", food: "Tuna sandwich (light tuna) or leftover salmon, salad, water" },
      { id: "pm", label: "PM snack", time: "3:25", food: "Trail mix or crackers with nut butter" },
      { id: "dinner", label: "Dinner", time: "6:25", food: "Salmon or trout (~150 g), rice, broccoli, water" },
      { id: "eve", label: "Evening", time: "9:00", food: "Yogurt smoothie (milk + banana + peanut butter)" },
    ],
  },
  {
    id: "wed", name: "Wednesday", short: "Wed", theme: "Iron + protein",
    blurb: "Beef or lentils help rebuild postpartum iron; pair plant iron with vitamin C.",
    meals: [
      { id: "bf", label: "Breakfast", time: "6:25", food: "Eggs or scrambled tofu, toast, orange or kiwi, water" },
      { id: "am", label: "AM snack", time: "9:25", food: "Greek yogurt + honey + walnuts" },
      { id: "lunch", label: "Lunch", time: "12:25", food: "Beef & veg stir-fry with rice, or lentil soup + bread + orange" },
      { id: "pm", label: "PM snack", time: "3:25", food: "Hummus + pita + cucumber" },
      { id: "dinner", label: "Dinner", time: "6:25", food: "Lean beef or bean chili, salad with peppers, water" },
      { id: "eve", label: "Evening", time: "9:00", food: "Chocolate milk" },
    ],
  },
  {
    id: "thu", name: "Thursday", short: "Thu", theme: "Easy repeat + calcium",
    blurb: "A simpler day so the week stays realistic. Dairy and eggs again.",
    meals: [
      { id: "bf", label: "Breakfast", time: "6:25", food: "Greek yogurt parfait, granola, fruit, water" },
      { id: "am", label: "AM snack", time: "9:25", food: "Hard-boiled egg + cheese string" },
      { id: "lunch", label: "Lunch", time: "12:25", food: "Leftover chili or chicken, fruit, milk" },
      { id: "pm", label: "PM snack", time: "3:25", food: "Toast with peanut butter" },
      { id: "dinner", label: "Dinner", time: "6:25", food: "Baked chicken thighs, pasta or rice, mixed vegetables" },
      { id: "eve", label: "Evening", time: "9:00", food: "Cottage cheese + berries" },
    ],
  },
  {
    id: "fri", name: "Friday", short: "Fri", theme: "Second fish / DHA top-up",
    blurb: "Two fish meals in the week usually meets the ~150 g fatty-fish guidance.",
    meals: [
      { id: "bf", label: "Breakfast", time: "6:25", food: "Eggs, toast, avocado or peanut butter, water" },
      { id: "am", label: "AM snack", time: "9:25", food: "Milk + banana" },
      { id: "lunch", label: "Lunch", time: "12:25", food: "Salmon leftover bowl or sardines on toast, salad" },
      { id: "pm", label: "PM snack", time: "3:25", food: "Yogurt cup" },
      { id: "dinner", label: "Dinner", time: "6:25", food: "White fish or salmon, roasted potatoes, green beans" },
      { id: "eve", label: "Evening", time: "9:00", food: "Warm oats with milk" },
    ],
  },
  {
    id: "sat", name: "Saturday", short: "Sat", theme: "Batch-cook day",
    blurb: "Cook extra protein and grains while someone else can watch the baby.",
    meals: [
      { id: "bf", label: "Breakfast", time: "6:25", food: "Veggie omelette, toast, fruit, water" },
      { id: "am", label: "AM snack", time: "9:25", food: "Smoothie (milk, banana, peanut butter, oats)" },
      { id: "lunch", label: "Lunch", time: "12:25", food: "Big grain bowl: chicken or beans, rice, veg, cheese" },
      { id: "pm", label: "PM snack", time: "3:25", food: "Cheese + crackers + grapes" },
      { id: "dinner", label: "Dinner", time: "6:25", food: "Sheet-pan chicken or tofu + vegetables; freeze extras" },
      { id: "eve", label: "Evening", time: "9:00", food: "Yogurt + granola" },
    ],
  },
  {
    id: "sun", name: "Sunday", short: "Sun", theme: "Lowest-effort day",
    blurb: "Use leftovers. Same pump clock. Do not skip meals just because it is a rest day.",
    meals: [
      { id: "bf", label: "Breakfast", time: "6:25", food: "Leftover eggs or toast with peanut butter + yogurt" },
      { id: "am", label: "AM snack", time: "9:25", food: "Fruit + cheese" },
      { id: "lunch", label: "Lunch", time: "12:25", food: "Leftovers from Saturday, glass of milk" },
      { id: "pm", label: "PM snack", time: "3:25", food: "Crackers + nut butter" },
      { id: "dinner", label: "Dinner", time: "6:25", food: "Soup + grilled cheese or leftover sheet-pan meal" },
      { id: "eve", label: "Evening", time: "9:00", food: "Chocolate milk or smoothie" },
    ],
  },
];

export const PUMP_IDS = DAILY_CLOCK.filter((s) => s.kind === "pump").map((s) => s.id);
export const EAT_IDS = ["bf", "am", "lunch", "pm", "dinner", "eve"] as const;

export const NON_NEGOTIABLES = [
  "Water at every pump",
  "Prenatal / postnatal vitamin with breakfast",
  "Baby still gets 400 IU vitamin D drops",
  "Do not crash-diet",
];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const YEARS = [2025, 2026, 2027];

export function dayKey(year: number, monthIndex: number, dayId: string) {
  return `${year}-${monthIndex + 1}-${dayId}`;
}


/** Daily required nutrition targets (general lactation guide — not medical advice). */
export type NutrientLeaf = {
  id: string;
  label: string;
  unit: string;
  /** Required daily target */
  target: number;
};

export type NutrientGroup = {
  id: string;
  label: string;
  unit: string;
  /** Standalone target when there are no children */
  target?: number;
  /** Sub-nutrients that roll up into this bubble's total */
  children?: NutrientLeaf[];
};

export const NUTRIENT_GROUPS: NutrientGroup[] = [
  {
    id: "calories",
    label: "Calories",
    unit: "kcal",
    target: 2400,
  },
  {
    id: "protein",
    label: "Protein",
    unit: "g",
    target: 75,
  },
  {
    id: "carbohydrates",
    label: "Carbohydrates",
    unit: "g",
    children: [
      { id: "carbs", label: "Carbs", unit: "g", target: 220 },
      { id: "sugar", label: "Sugar", unit: "g", target: 50 },
    ],
  },
  {
    id: "fat",
    label: "Fat",
    unit: "g",
    target: 70,
  },
  {
    id: "calcium",
    label: "Calcium",
    unit: "mg",
    target: 1000,
  },
  {
    id: "fluid",
    label: "Fluid",
    unit: "ml",
    target: 3000,
  },
];

export function groupTarget(g: NutrientGroup): number {
  if (g.children?.length) return g.children.reduce((s, c) => s + c.target, 0);
  return g.target ?? 0;
}


/** Same palette on nutrient bubbles and clock slivers. */
export const NUTRIENT_COLORS: Record<string, string> = {
  calories: "#7c6cf0",
  protein: "#e07a5f",
  carbs: "#e6b84d",
  sugar: "#f0a060",
  carbohydrates: "#e6b84d",
  fat: "#5b8def",
  calcium: "#4cb5ae",
  fluid: "#6ec1e4",
};

export function nutrientColor(id: string): string {
  return NUTRIENT_COLORS[id] ?? "#9aa3b5";
}

/** Pump session midpoints (minutes) for ring layout. */
export const PUMP_MARKS_MIN = DAILY_CLOCK.filter((s) => s.kind === "pump").map(
  (s) => (s.startMin + s.endMin) / 2,
);

export type ClockGap = {
  id: string;
  startMin: number;
  endMin: number;
  night: boolean;
};

/** Gaps between consecutive pumps (wraps past midnight). */
export function gapsBetweenPumps(): ClockGap[] {
  const pumps = DAILY_CLOCK.filter((s) => s.kind === "pump").sort((a, b) => a.startMin - b.startMin);
  const gaps: ClockGap[] = [];
  for (let i = 0; i < pumps.length; i++) {
    const cur = pumps[i];
    const next = pumps[(i + 1) % pumps.length];
    const start = cur.endMin;
    let end = next.startMin;
    if (end <= start) end += 1440;
    const mid = ((start + end) / 2) % 1440;
    // Three night hours: ~12am–3am window center, plus deep night tint 0–180 and 1260–1440
    const night = mid >= 1260 || mid < 360;
    gaps.push({ id: `gap-${cur.id}-${next.id}`, startMin: start, endMin: end, night });
  }
  return gaps;
}

export function allNutrientIds(): string[] {
  const ids: string[] = [];
  for (const g of NUTRIENT_GROUPS) {
    if (g.children?.length) ids.push(...g.children.map((c) => c.id));
    else ids.push(g.id);
  }
  return ids;
}
