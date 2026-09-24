/**
 * Client-side Nutrition Facts label OCR (tesseract.js, lazy-loaded).
 * Best-effort English label parsing — not medical advice.
 */

import { EMPTY_MACROS, type MacroSet } from "./nutrition";

export type OcrNutritionResult = {
  macros: MacroSet;
  servingLabel: string;
  found: boolean;
  summary: string;
  rawText?: string;
};

function num(v: string | undefined): number {
  if (v == null) return 0;
  const n = parseFloat(v.replace(/,/g, ""));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/** Parse a label amount; "Less than 1" / "< 1" → 0 (trace). */
function parseAmount(fragment: string): number {
  const s = fragment.trim();
  const less = /(?:less\s*than|<)\s*([\d]+(?:\.\d+)?)/i.exec(s);
  if (less) {
    const n = num(less[1]);
    return n <= 1 ? 0 : Math.max(0, n - 0.5);
  }
  const m = /([\d]+(?:\.\d+)?)/.exec(s);
  return m ? num(m[1]) : 0;
}

function cleanOcrText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[|]/g, "l")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

type FieldSpec = {
  key: keyof Pick<MacroSet, "calories" | "protein" | "carbs" | "sugar" | "fat" | "calcium">;
  /** Skip lines matching this */
  skip?: RegExp;
  /** Match line; capture group 1 = amount fragment */
  re: RegExp;
  unit: "kcal" | "g" | "mg";
};

const FIELD_SPECS: FieldSpec[] = [
  {
    key: "calories",
    skip: /from\s+fat|fat\s+cal/i,
    re: /^(?:calories|énergie|energie)\s*[:.]?\s*((?:less\s*than\s*)?<?\s*[\d]+(?:\.\d+)?)/i,
    unit: "kcal",
  },
  {
    key: "fat",
    skip: /saturated|trans|polyunsaturated|monounsaturated|calories?\s+from/i,
    re: /^(?:total\s+)?fat\s*[:.]?\s*((?:less\s*than\s*)?<?\s*[\d]+(?:\.\d+)?\s*(?:g)?)/i,
    unit: "g",
  },
  {
    key: "carbs",
    re: /^(?:total\s+)?(?:carbohydrate|carbohydrates|carbs?)\s*[:.]?\s*((?:less\s*than\s*)?<?\s*[\d]+(?:\.\d+)?\s*(?:g)?)/i,
    unit: "g",
  },
  {
    key: "sugar",
    skip: /added\s+sugars/i,
    re: /^(?:total\s+)?sugars?\s*[:.]?\s*((?:less\s*than\s*)?<?\s*[\d]+(?:\.\d+)?\s*(?:g)?)/i,
    unit: "g",
  },
  {
    key: "protein",
    re: /^protein\s*[:.]?\s*((?:less\s*than\s*)?<?\s*[\d]+(?:\.\d+)?\s*(?:g)?)/i,
    unit: "g",
  },
  {
    key: "calcium",
    re: /^calcium\s*[:.]?\s*((?:less\s*than\s*)?<?\s*[\d]+(?:\.\d+)?\s*(?:mg|g)?)/i,
    unit: "mg",
  },
];

/**
 * Extract common Nutrition Facts fields from OCR plain text.
 * Tolerates noisy OCR; ignores junk lines.
 */
export function parseNutritionFactsText(text: string): OcrNutritionResult {
  const cleaned = cleanOcrText(text);
  const lines = cleaned
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const macros: MacroSet = { ...EMPTY_MACROS };
  const seen = new Set<string>();

  // Serving size
  let servingLabel = "";
  const blob = lines.join("\n");
  const servingRe =
    /serving\s*size\s*[:.]?\s*([^\n]{2,48})/i.exec(blob) ||
    /per\s+serving\s*[:.]?\s*([^\n]{2,40})/i.exec(blob);
  if (servingRe) {
    servingLabel = servingRe[1]
      .replace(/\s+/g, " ")
      .replace(/\s*(calories|total\s+fat|protein).*$/i, "")
      .trim()
      .slice(0, 60);
  }

  for (const line of lines) {
    // Skip %DV-only lines without a gram/mg amount
    const pctOnly = /^\s*[a-z\s]+\s*[\d.]+\s*%\s*$/i.test(line);

    for (const spec of FIELD_SPECS) {
      if (seen.has(spec.key)) continue;
      if (spec.skip && spec.skip.test(line)) continue;
      const m = spec.re.exec(line);
      if (!m) continue;
      if (pctOnly && !/\d\s*(?:g|mg)\b/i.test(line)) continue;
      // Calcium often "Calcium 200mg 15%" — OK; "Calcium 15%" alone — skip
      if (spec.key === "calcium" && !/\d\s*mg\b/i.test(line) && /%\s*$/.test(line)) {
        continue;
      }

      let amount = parseAmount(m[1]);
      if (spec.unit === "mg" && /\bg\b/i.test(m[1]) && !/\bmg\b/i.test(m[1])) {
        amount = Math.round(amount * 1000);
      }
      if (spec.unit === "kcal") amount = Math.round(amount);

      macros[spec.key] = amount;
      seen.add(spec.key);
    }
  }

  // Fallback: inline "150 kcal" / "150 calories" if Calories line missed
  if (!seen.has("calories")) {
    const calInline =
      /\b([\d]+(?:\.\d+)?)\s*kcal\b/i.exec(blob) ||
      /calories\s*[:.]?\s*([\d]+(?:\.\d+)?)/i.exec(blob);
    if (calInline) {
      const around = blob.slice(
        Math.max(0, (calInline.index ?? 0) - 24),
        (calInline.index ?? 0) + 40,
      );
      if (!/from\s+fat/i.test(around)) {
        macros.calories = Math.round(num(calInline[1]));
        seen.add("calories");
      }
    }
  }

  macros.calories = Math.round(macros.calories);
  macros.protein = Math.round(macros.protein * 10) / 10;
  macros.carbs = Math.round(macros.carbs * 10) / 10;
  macros.sugar = Math.round(macros.sugar * 10) / 10;
  macros.fat = Math.round(macros.fat * 10) / 10;
  macros.calcium = Math.round(macros.calcium);

  const found =
    macros.calories > 0 ||
    macros.protein > 0 ||
    macros.carbs > 0 ||
    macros.fat > 0;

  const parts: string[] = [];
  if (macros.calories > 0) parts.push(`${macros.calories} kcal`);
  if (macros.protein > 0) parts.push(`P ${macros.protein}g`);
  if (macros.carbs > 0) parts.push(`C ${macros.carbs}g`);
  if (macros.fat > 0) parts.push(`F ${macros.fat}g`);
  if (macros.sugar > 0) parts.push(`sugar ${macros.sugar}g`);
  if (macros.calcium > 0) parts.push(`Ca ${macros.calcium}mg`);

  return {
    macros,
    servingLabel,
    found,
    summary: found
      ? `Found: ${parts.join(" · ")}`
      : "Could not read nutrition numbers from that photo.",
    rawText: cleaned.slice(0, 2000),
  };
}

/**
 * Run tesseract on a data URL / blob URL. Dynamically imports the library
 * so the main bundle stays small until a label photo is processed.
 */
export async function ocrNutritionFromImage(
  imageSource: string,
  onProgress?: (status: string) => void,
): Promise<OcrNutritionResult> {
  onProgress?.("Reading label…");
  try {
    const Tesseract = await import("tesseract.js");
    const result = await Tesseract.recognize(imageSource, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text" && typeof m.progress === "number") {
          const pct = Math.round(m.progress * 100);
          onProgress?.(pct < 100 ? `Reading label… ${pct}%` : "Reading label…");
        }
      },
    });
    return parseNutritionFactsText(result.data.text || "");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "OCR failed";
    return {
      macros: { ...EMPTY_MACROS },
      servingLabel: "",
      found: false,
      summary: `Could not read label (${msg}). Try a clearer photo or enter values by hand.`,
    };
  }
}
