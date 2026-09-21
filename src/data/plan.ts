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
  sleep: "#0b1324", // near-black navy
  awake: "#d9dde8", // cool grey (not yellow)
  pump: "#c2185b", // raspberry — not protein orange
  eat: "#2e7d32", // green — not carb gold
};

export const DAILY_CLOCK: ClockSegment[] = [
  // Newborn-aligned (~every 2.5 h, 10 sessions) — Parents.com: 8–12 feeds/day, every 2–3 h
  { id: "pump-0", kind: "pump", label: "Pump 12:00a", startMin: 0, endMin: 25 },
  { id: "sleep-1", kind: "sleep", label: "Sleep", startMin: 25, endMin: 150 },
  { id: "pump-230", kind: "pump", label: "Pump 2:30a", startMin: 150, endMin: 175 },
  { id: "sleep-2", kind: "sleep", label: "Sleep", startMin: 175, endMin: 300 },
  { id: "pump-5", kind: "pump", label: "Pump 5:00a", startMin: 300, endMin: 325 },
  { id: "sleep-3", kind: "sleep", label: "Sleep", startMin: 325, endMin: 450 },
  { id: "pump-730", kind: "pump", label: "Pump 7:30a", startMin: 450, endMin: 475 },
  { id: "eat-bf", kind: "eat", label: "Breakfast", startMin: 475, endMin: 535 },
  { id: "awake-1", kind: "awake", label: "Awake / baby care", startMin: 535, endMin: 600 },
  { id: "pump-10", kind: "pump", label: "Pump 10:00a", startMin: 600, endMin: 625 },
  { id: "eat-am", kind: "eat", label: "AM snack", startMin: 625, endMin: 660 },
  { id: "awake-2", kind: "awake", label: "Awake / baby care", startMin: 660, endMin: 750 },
  { id: "pump-1230", kind: "pump", label: "Pump 12:30p", startMin: 750, endMin: 775 },
  { id: "eat-lunch", kind: "eat", label: "Lunch", startMin: 775, endMin: 835 },
  { id: "awake-3", kind: "awake", label: "Awake / baby care", startMin: 835, endMin: 900 },
  { id: "pump-15", kind: "pump", label: "Pump 3:00p", startMin: 900, endMin: 925 },
  { id: "eat-pm", kind: "eat", label: "PM snack", startMin: 925, endMin: 960 },
  { id: "awake-4", kind: "awake", label: "Awake / baby care", startMin: 960, endMin: 1050 },
  { id: "pump-1730", kind: "pump", label: "Pump 5:30p", startMin: 1050, endMin: 1075 },
  { id: "eat-dinner", kind: "eat", label: "Dinner", startMin: 1075, endMin: 1140 },
  { id: "awake-5", kind: "awake", label: "Wind down", startMin: 1140, endMin: 1200 },
  { id: "pump-20", kind: "pump", label: "Pump 8:00p", startMin: 1200, endMin: 1225 },
  { id: "eat-eve", kind: "eat", label: "Evening snack", startMin: 1225, endMin: 1260 },
  { id: "awake-6", kind: "awake", label: "Quiet time", startMin: 1260, endMin: 1350 },
  { id: "pump-2230", kind: "pump", label: "Pump 10:30p", startMin: 1350, endMin: 1375 },
  { id: "sleep-4", kind: "sleep", label: "Sleep", startMin: 1375, endMin: 1440 },
];

export const DAYS: DayPlan[] = [
  {
    id: "mon", name: "Monday", short: "Mon", theme: "Choline + dairy",
    blurb: "Eggs for choline; yogurt and milk for calcium and extra calories.",
    meals: [
      { id: "bf", label: "Breakfast", time: "7:55", food: "2 eggs (yolks), toast + peanut butter, banana, water" },
      { id: "am", label: "AM snack", time: "10:25", food: "Greek yogurt + granola + berries" },
      { id: "lunch", label: "Lunch", time: "12:55", food: "Chicken wrap or sandwich, carrot sticks, glass of milk" },
      { id: "pm", label: "PM snack", time: "3:25", food: "Cheese + apple" },
      { id: "dinner", label: "Dinner", time: "6:00", food: "Turkey or chicken, potatoes, green vegetables, water" },
      { id: "eve", label: "Evening", time: "8:25", food: "Warm milk or chocolate milk + a few crackers" },
    ],
  },
  {
    id: "tue", name: "Tuesday", short: "Tue", theme: "DHA / fish day",
    blurb: "Fatty fish covers the weekly DHA target better than fish every day.",
    meals: [
      { id: "bf", label: "Breakfast", time: "7:55", food: "Overnight oats with milk, chia, peanut butter, berries" },
      { id: "am", label: "AM snack", time: "10:25", food: "Cottage cheese + pineapple or peaches" },
      { id: "lunch", label: "Lunch", time: "12:55", food: "Tuna sandwich (light tuna) or leftover salmon, salad, water" },
      { id: "pm", label: "PM snack", time: "3:25", food: "Trail mix or crackers with nut butter" },
      { id: "dinner", label: "Dinner", time: "6:00", food: "Salmon or trout (~150 g), rice, broccoli, water" },
      { id: "eve", label: "Evening", time: "8:25", food: "Yogurt smoothie (milk + banana + peanut butter)" },
    ],
  },
  {
    id: "wed", name: "Wednesday", short: "Wed", theme: "Iron + protein",
    blurb: "Beef or lentils help rebuild postpartum iron; pair plant iron with vitamin C.",
    meals: [
      { id: "bf", label: "Breakfast", time: "7:55", food: "Eggs or scrambled tofu, toast, orange or kiwi, water" },
      { id: "am", label: "AM snack", time: "10:25", food: "Greek yogurt + honey + walnuts" },
      { id: "lunch", label: "Lunch", time: "12:55", food: "Beef & veg stir-fry with rice, or lentil soup + bread + orange" },
      { id: "pm", label: "PM snack", time: "3:25", food: "Hummus + pita + cucumber" },
      { id: "dinner", label: "Dinner", time: "6:00", food: "Lean beef or bean chili, salad with peppers, water" },
      { id: "eve", label: "Evening", time: "8:25", food: "Chocolate milk" },
    ],
  },
  {
    id: "thu", name: "Thursday", short: "Thu", theme: "Easy repeat + calcium",
    blurb: "A simpler day so the week stays realistic. Dairy and eggs again.",
    meals: [
      { id: "bf", label: "Breakfast", time: "7:55", food: "Greek yogurt parfait, granola, fruit, water" },
      { id: "am", label: "AM snack", time: "10:25", food: "Hard-boiled egg + cheese string" },
      { id: "lunch", label: "Lunch", time: "12:55", food: "Leftover chili or chicken, fruit, milk" },
      { id: "pm", label: "PM snack", time: "3:25", food: "Toast with peanut butter" },
      { id: "dinner", label: "Dinner", time: "6:00", food: "Baked chicken thighs, pasta or rice, mixed vegetables" },
      { id: "eve", label: "Evening", time: "8:25", food: "Cottage cheese + berries" },
    ],
  },
  {
    id: "fri", name: "Friday", short: "Fri", theme: "Second fish / DHA top-up",
    blurb: "Two fish meals in the week usually meets the ~150 g fatty-fish guidance.",
    meals: [
      { id: "bf", label: "Breakfast", time: "7:55", food: "Eggs, toast, avocado or peanut butter, water" },
      { id: "am", label: "AM snack", time: "10:25", food: "Milk + banana" },
      { id: "lunch", label: "Lunch", time: "12:55", food: "Salmon leftover bowl or sardines on toast, salad" },
      { id: "pm", label: "PM snack", time: "3:25", food: "Yogurt cup" },
      { id: "dinner", label: "Dinner", time: "6:00", food: "White fish or salmon, roasted potatoes, green beans" },
      { id: "eve", label: "Evening", time: "8:25", food: "Warm oats with milk" },
    ],
  },
  {
    id: "sat", name: "Saturday", short: "Sat", theme: "Batch-cook day",
    blurb: "Cook extra protein and grains while someone else can watch the baby.",
    meals: [
      { id: "bf", label: "Breakfast", time: "7:55", food: "Veggie omelette, toast, fruit, water" },
      { id: "am", label: "AM snack", time: "10:25", food: "Smoothie (milk, banana, peanut butter, oats)" },
      { id: "lunch", label: "Lunch", time: "12:55", food: "Big grain bowl: chicken or beans, rice, veg, cheese" },
      { id: "pm", label: "PM snack", time: "3:25", food: "Cheese + crackers + grapes" },
      { id: "dinner", label: "Dinner", time: "6:00", food: "Sheet-pan chicken or tofu + vegetables; freeze extras" },
      { id: "eve", label: "Evening", time: "8:25", food: "Yogurt + granola" },
    ],
  },
  {
    id: "sun", name: "Sunday", short: "Sun", theme: "Lowest-effort day",
    blurb: "Use leftovers. Same pump clock. Do not skip meals just because it is a rest day.",
    meals: [
      { id: "bf", label: "Breakfast", time: "7:55", food: "Leftover eggs or toast with peanut butter + yogurt" },
      { id: "am", label: "AM snack", time: "10:25", food: "Fruit + cheese" },
      { id: "lunch", label: "Lunch", time: "12:55", food: "Leftovers from Saturday, glass of milk" },
      { id: "pm", label: "PM snack", time: "3:25", food: "Crackers + nut butter" },
      { id: "dinner", label: "Dinner", time: "6:00", food: "Soup + grilled cheese or leftover sheet-pan meal" },
      { id: "eve", label: "Evening", time: "8:25", food: "Chocolate milk or smoothie" },
    ],
  },
];

export const PUMP_IDS = DAILY_CLOCK.filter((s) => s.kind === "pump").map((s) => s.id);
export const EAT_IDS = ["bf", "am", "lunch", "pm", "dinner", "eve"] as const;

export const NON_NEGOTIABLES = [
  "Water at every pump",
  "Prenatal / postnatal vitamin with breakfast",
  "Hospital / NICU feeding plan wins over any app chart",
  "Pump about every 2–3 hours (aim 8–12× / day) while baby is newborn-aged",
  "Do not crash-diet",
];

/** Chronological birthday — premie adjusted-age is for milestones; hospital volumes still override. */
export const BABY_BIRTHDAY = "2026-09-13";

export type BabyFeedStage = {
  id: string;
  label: string;
  /** inclusive age range in days */
  minDay: number;
  maxDay: number;
  ozPerFeed: string;
  feedsPerDay: string;
  interval: string;
  notes: string;
};

/** Adapted from Parents.com age-by-age feeding chart (general guidance, not medical advice). */
export const BABY_FEED_STAGES: BabyFeedStage[] = [
  {
    id: "newborn",
    label: "Newborn (first days)",
    minDay: 0,
    maxDay: 10,
    ozPerFeed: "1–2 oz (30–60 ml)",
    feedsPerDay: "8–12",
    interval: "every 2–3 hours",
    notes: "Tiny tummy — frequent small feeds. Cue-based feeding when possible.",
  },
  {
    id: "2w",
    label: "About 2 weeks",
    minDay: 11,
    maxDay: 27,
    ozPerFeed: "2–3 oz (60–90 ml)",
    feedsPerDay: "8–12",
    interval: "every 2–3 hours",
    notes: "Volumes usually climb; still expect overnight pumps/feeds.",
  },
  {
    id: "1mo",
    label: "About 1 month",
    minDay: 28,
    maxDay: 45,
    ozPerFeed: "3–4 oz (90–120 ml)",
    feedsPerDay: "8–10",
    interval: "every 2–3 hours",
    notes: "Often a bit more predictable, still frequent.",
  },
  {
    id: "2mo",
    label: "About 2 months",
    minDay: 46,
    maxDay: 105,
    ozPerFeed: "4–5 oz (120–150 ml)",
    feedsPerDay: "6–8",
    interval: "every 3–4 hours",
    notes: "Stretch between feeds may lengthen a little.",
  },
  {
    id: "4mo",
    label: "About 4 months",
    minDay: 106,
    maxDay: 180,
    ozPerFeed: "4–6 oz (120–180 ml)",
    feedsPerDay: "6–8",
    interval: "every 3–4 hours",
    notes: "Milk/formula still primary before solids.",
  },
  {
    id: "6mo",
    label: "6–12 months",
    minDay: 181,
    maxDay: 365,
    ozPerFeed: "7–8 oz (210–240 ml)",
    feedsPerDay: "4–6",
    interval: "every 4–5 hours",
    notes: "Solids start ~6 mo; milk remains the main nutrition source in year one.",
  },
];

export function babyAgeDays(on: Date = new Date(), birthdayIso: string = BABY_BIRTHDAY): number {
  const b = new Date(birthdayIso + "T12:00:00");
  const ms = on.getTime() - b.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function babyFeedStageForAge(days: number): BabyFeedStage {
  return (
    BABY_FEED_STAGES.find((s) => days >= s.minDay && days <= s.maxDay) ??
    BABY_FEED_STAGES[BABY_FEED_STAGES.length - 1]
  );
}


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
/** High-contrast palette — avoid neighbouring reds/oranges. */
export const NUTRIENT_COLORS: Record<string, string> = {
  calories: "#6d5efc", // violet
  protein: "#e85d04", // deep orange
  carbs: "#f4c430", // gold
  sugar: "#d81173", // magenta (not next to protein/carbs)
  carbohydrates: "#f4c430",
  fat: "#1d6fd8", // strong blue
  calcium: "#0a9b6e", // green
  fluid: "#00b4d8", // cyan
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

/** Leaf nutrients shown on the goal / progress rings (id + daily target). */
export function leafNutrientTargets(): { id: string; label: string; target: number; unit: string }[] {
  const out: { id: string; label: string; target: number; unit: string }[] = [];
  for (const g of NUTRIENT_GROUPS) {
    if (g.children?.length) {
      for (const c of g.children) out.push({ id: c.id, label: c.label, target: c.target, unit: c.unit });
    } else if (g.target != null) {
      out.push({ id: g.id, label: g.label, target: g.target, unit: g.unit });
    }
  }
  return out;
}
