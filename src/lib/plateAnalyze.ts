/**
 * Serving-portion plate analysis (no paid API key).
 *
 * 1) Prefer Food101 image classification via @huggingface/transformers
 *    (dynamically imported + code-split; model downloads on first use).
 * 2) Map top-K labels → CNF / fast-food lookup for estimated macros.
 * 3) On failure / timeout / heavy device: return fallback suggestions so the
 *    UI can still Retest / Confirm / Manual / Label-photo without crashing.
 *
 * Estimates are approximate — not medical advice.
 */

import { searchFastFood } from "../data/fastFoodIndex";
import {
  EMPTY_MACROS,
  searchCnf,
  type MacroSet,
} from "./nutrition";

export type PlateDetectedItem = {
  name: string;
  confidence: number;
  macros: MacroSet;
  servingLabel: string;
  source: "estimate" | "cnf" | "openfoodfacts" | "fastfood";
};

export type PlateAnalyzeResult = {
  items: PlateDetectedItem[];
  mode: "model" | "fallback";
  message: string;
  /** Chip suggestions when model fails or returns little */
  suggestions: string[];
};

/** Readable Food101-ish label → better CNF search phrase */
const LABEL_TO_QUERY: Record<string, string> = {
  apple_pie: "apple pie",
  baby_back_ribs: "pork ribs",
  beef_carpaccio: "beef",
  beef_tartare: "beef",
  beet_salad: "beet salad",
  bibimbap: "rice bowl",
  breakfast_burrito: "breakfast burrito egg",
  bruschetta: "tomato bread",
  caesar_salad: "caesar salad",
  carrot_cake: "carrot cake",
  cheese_plate: "cheese cheddar",
  cheesecake: "cheesecake",
  chicken_curry: "chicken curry",
  chicken_quesadilla: "chicken quesadilla",
  chicken_wings: "chicken wing",
  chocolate_cake: "chocolate cake",
  clam_chowder: "clam chowder",
  club_sandwich: "club sandwich",
  crab_cakes: "crab cake",
  cup_cakes: "cupcake",
  deviled_eggs: "egg yolk boiled",
  donuts: "doughnut",
  dumplings: "dumpling",
  edamame: "edamame soybeans",
  eggs_benedict: "eggs benedict",
  falafel: "falafel",
  filet_mignon: "beef tenderloin",
  fish_and_chips: "fish fried",
  french_fries: "french fries potato",
  french_onion_soup: "onion soup",
  french_toast: "french toast",
  fried_rice: "fried rice",
  frozen_yogurt: "frozen yogurt",
  garlic_bread: "garlic bread",
  greek_salad: "greek salad",
  grilled_cheese_sandwich: "grilled cheese sandwich",
  grilled_salmon: "salmon grilled",
  guacamole: "guacamole avocado",
  hamburger: "hamburger beef",
  hot_dog: "hot dog frankfurter",
  hummus: "hummus",
  ice_cream: "ice cream",
  lasagna: "lasagna",
  macaroni_and_cheese: "macaroni cheese",
  miso_soup: "miso soup",
  nachos: "nachos",
  omelette: "omelet egg",
  onion_rings: "onion rings",
  pancakes: "pancake",
  pizza: "pizza cheese",
  pork_chop: "pork chop",
  poutine: "poutine",
  pulled_pork_sandwich: "pulled pork",
  ramen: "ramen noodle",
  risotto: "risotto rice",
  sashimi: "sashimi tuna",
  spaghetti_bolognese: "spaghetti meat sauce",
  spaghetti_carbonara: "spaghetti carbonara",
  spring_rolls: "spring roll",
  steak: "beef steak",
  sushi: "sushi",
  tacos: "taco",
  waffles: "waffle",
  greek_yogurt: "yogurt greek",
  banana: "banana raw",
  scrambled_eggs: "egg scrambled",
  oatmeal: "oatmeal cooked",
  salad: "mixed salad greens",
  toast: "bread toasted",
  yogurt: "yogurt plain",
  rice: "rice white cooked",
  broccoli: "broccoli boiled",
  chicken_breast: "chicken breast roasted",
};

/** Everyday chips shown in fallback / “what’s on the plate?” UI */
export const PLATE_SUGGESTION_CHIPS = [
  "Eggs",
  "Toast",
  "Oatmeal",
  "Greek yogurt",
  "Banana",
  "Apple",
  "Chicken breast",
  "Rice",
  "Broccoli",
  "Salad",
  "Salmon",
  "Pasta",
  "Pizza slice",
  "Hamburger",
  "French fries",
  "Sandwich",
  "Soup",
  "Tim Hortons coffee",
  "Granola bar",
];

let classifierPromise: Promise<
  (img: string, opts?: { top_k?: number }) => Promise<Array<{ label: string; score: number }>>
> | null = null;

let modelFailed = false;

function humanizeLabel(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (LABEL_TO_QUERY[key]) {
    return LABEL_TO_QUERY[key]
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return raw
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function queryForLabel(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, "_");
  return LABEL_TO_QUERY[key] ?? raw.replace(/_/g, " ").trim();
}

function nameMatchesExclusion(name: string, exclusions: string[]): boolean {
  const n = name.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  for (const ex of exclusions) {
    const e = ex.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    if (!e) continue;
    if (n === e || n.includes(e) || e.includes(n)) return true;
    // fuzzy token overlap
    const nt = new Set(n.split(" ").filter((t) => t.length > 2));
    const et = e.split(" ").filter((t) => t.length > 2);
    if (et.length && et.every((t) => nt.has(t))) return true;
  }
  return false;
}

async function macrosForFoodName(
  name: string,
): Promise<{ macros: MacroSet; servingLabel: string; source: PlateDetectedItem["source"] }> {
  // Prefer fast-food index for branded-sounding names
  const ff = searchFastFood(name, 3);
  if (ff.length && ff[0].name.toLowerCase().includes(name.toLowerCase().split(" ")[0] ?? "")) {
    const top = ff[0];
    // Only use if query tokens mostly hit
    const tokens = name.toLowerCase().split(/\s+/).filter((t) => t.length >= 3);
    const hay = `${top.name} ${top.brand}`.toLowerCase();
    const hitCount = tokens.filter((t) => hay.includes(t)).length;
    if (tokens.length === 0 || hitCount >= Math.ceil(tokens.length * 0.5)) {
      return {
        macros: top.perServing,
        servingLabel: top.servingLabel,
        source: "fastfood",
      };
    }
  }

  try {
    const cnf = await searchCnf(queryForLabel(name) || name);
    if (cnf[0]) {
      return {
        macros: cnf[0].perServing,
        servingLabel: cnf[0].servingLabel,
        source: "cnf",
      };
    }
  } catch {
    // continue
  }

  // Last resort: fast food fuzzy
  if (ff[0]) {
    return {
      macros: ff[0].perServing,
      servingLabel: ff[0].servingLabel,
      source: "fastfood",
    };
  }

  return {
    macros: { ...EMPTY_MACROS },
    servingLabel: "1 serving (estimate)",
    source: "estimate",
  };
}

async function getClassifier(
  onProgress?: (s: string) => void,
): Promise<
  (img: string, opts?: { top_k?: number }) => Promise<Array<{ label: string; score: number }>>
> {
  if (modelFailed) throw new Error("Food recognizer unavailable");
  if (!classifierPromise) {
    classifierPromise = (async () => {
      onProgress?.("Loading food recognizer (first time may download a model)…");
      const { pipeline, env } = await import("@huggingface/transformers");
      // Browser: fetch models from Hugging Face hub, cache in IndexedDB
      env.allowLocalModels = false;
      // Load ORT WASM from CDN so GitHub Pages dist stays lean (~21MB saved).
      try {
        const ort = env.backends.onnx as {
          wasm?: { proxy?: boolean; wasmPaths?: string };
        };
        if (ort.wasm) {
          ort.wasm.proxy = true;
          ort.wasm.wasmPaths =
            "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/";
        }
      } catch {
        /* ignore */
      }

      const clf = await pipeline(
        "image-classification",
        "Xenova/vit-base-patch16-224-finetuned-food101",
        {
          dtype: "q8",
          progress_callback: (ev: { status?: string; progress?: number }) => {
            if (ev?.status === "progress" && typeof ev.progress === "number") {
              const pct = Math.round(ev.progress);
              if (pct > 0 && pct < 100) {
                onProgress?.(`Downloading food model… ${pct}%`);
              }
            } else if (ev?.status === "ready") {
              onProgress?.("Recognizing foods…");
            }
          },
        },
      );

      return async (img: string, opts?: { top_k?: number }) => {
        const topk = opts?.top_k ?? 5;
        const out = await clf(img, { top_k: topk });
        const arr = Array.isArray(out) ? out : [out];
        return arr.map((x: { label?: string; score?: number }) => ({
          label: String(x.label ?? ""),
          score: typeof x.score === "number" ? x.score : 0,
        }));
      };
    })().catch((err) => {
      modelFailed = true;
      classifierPromise = null;
      throw err;
    });
  }
  return classifierPromise;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/**
 * Analyze a serving-portion photo. Never throws — always returns a usable result.
 */
export async function analyzePlate(
  imageDataUrl: string,
  opts?: {
    excludeNames?: string[];
    onProgress?: (status: string) => void;
    /** Skip model (force chip/search fallback) */
    forceFallback?: boolean;
  },
): Promise<PlateAnalyzeResult> {
  const exclusions = opts?.excludeNames ?? [];
  const onProgress = opts?.onProgress;

  if (!imageDataUrl || opts?.forceFallback) {
    return {
      items: [],
      mode: "fallback",
      message:
        "Tell us what’s on the plate — tap chips or use Manual search. Estimates are approximate, not medical advice.",
      suggestions: filterSuggestions(exclusions),
    };
  }

  try {
    onProgress?.("Starting plate analysis…");
    const classify = await withTimeout(
      getClassifier(onProgress),
      90_000,
      "Model load",
    );
    onProgress?.("Recognizing foods on the plate…");
    const preds = await withTimeout(
      classify(imageDataUrl, { top_k: 6 }),
      45_000,
      "Classification",
    );

    const filtered = preds
      .filter((p) => p.label && p.score >= 0.04)
      .filter((p) => !nameMatchesExclusion(humanizeLabel(p.label), exclusions));

    // Dedupe similar humanized names; keep highest score
    const byName = new Map<string, { label: string; score: number }>();
    for (const p of filtered) {
      const nice = humanizeLabel(p.label);
      const key = nice.toLowerCase();
      const prev = byName.get(key);
      if (!prev || p.score > prev.score) byName.set(key, { label: p.label, score: p.score });
    }

    const ranked = [...byName.entries()]
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 5);

    const items: PlateDetectedItem[] = [];
    for (const [nice, meta] of ranked) {
      onProgress?.(`Looking up nutrition for ${nice}…`);
      const nut = await macrosForFoodName(queryForLabel(meta.label) || nice);
      items.push({
        name: nice,
        confidence: Math.round(meta.score * 1000) / 1000,
        macros: nut.macros,
        servingLabel: nut.servingLabel,
        source: nut.source === "estimate" ? "estimate" : nut.source,
      });
    }

    if (!items.length) {
      return {
        items: [],
        mode: "fallback",
        message:
          "Couldn’t confidently identify foods. Tap chips or Manual search. Estimates are approximate, not medical advice.",
        suggestions: filterSuggestions(exclusions),
      };
    }

    return {
      items,
      mode: "model",
      message:
        "Estimated from plate photo (Food101 → CNF/fast-food). Approximate — not medical advice. Confirm items to add them.",
      suggestions: filterSuggestions(exclusions),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis failed";
    onProgress?.(msg);
    return {
      items: [],
      mode: "fallback",
      message: `Plate auto-detect unavailable (${msg}). Tap what’s on the plate or Manual search. Estimates are approximate, not medical advice.`,
      suggestions: filterSuggestions(exclusions),
    };
  }
}

function filterSuggestions(exclusions: string[]): string[] {
  return PLATE_SUGGESTION_CHIPS.filter(
    (s) => !nameMatchesExclusion(s, exclusions),
  );
}

/** Resolve a chip / typed name into a detected item with macros. */
export async function itemFromFoodName(
  name: string,
): Promise<PlateDetectedItem> {
  const clean = name.trim();
  const nut = await macrosForFoodName(clean);
  return {
    name: clean,
    confidence: 1,
    macros: nut.macros,
    servingLabel: nut.servingLabel,
    source: nut.source,
  };
}
