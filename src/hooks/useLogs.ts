import { useCallback, useState } from "react";
import { DAYS, EAT_IDS, PUMP_IDS, dayKey } from "../data/plan";
import type { MealFoodEntry } from "../components/MealFoodLog";
import {
  EMPTY_MACROS,
  addMacros,
  macrosToNutrientMap,
  type MacroSet,
} from "../lib/nutrition";
import { round1 } from "../lib/units";

export type DayLog = {
  pumps: Record<string, boolean>;
  /** Actual ounces logged per pump session id */
  pumpOz: Record<string, number>;
  meals: Record<string, boolean>;
  notes: Record<string, string>;
  /** Logged nutrient amounts keyed by nutrient id (protein, carbs, sugar, …) */
  nutrients: Record<string, number>;
  /** Per-meal food + nutrition + photos */
  foodLogs: Record<string, MealFoodEntry>;
  /** Ounces pumped today (supply tracker) — sum of checked pumpOz */
  pumpedOz: number;
  /** Ounces baby drank today (0 if unknown) */
  fedOz: number;
  /** Freezer bank stash in oz */
  freezerBankOz: number;
  /** True once freezer/fed were seeded from previous calendar day */
  seededFromPrev?: boolean;
};

const STORAGE = "pump-week-logs-v4";
const PREV_KEYS = ["pump-week-logs-v3", "pump-week-logs-v2", "pump-week-logs-v1"];

function emptyLog(): DayLog {
  return {
    pumps: {},
    pumpOz: {},
    meals: {},
    notes: {},
    nutrients: {},
    foodLogs: {},
    pumpedOz: 0,
    fedOz: 0,
    freezerBankOz: 0,
    seededFromPrev: false,
  };
}

function sanitizeOz(value: number): number {
  return Number.isFinite(value) && value >= 0 ? round1(value) : 0;
}

/** Recompute pumpedOz from checked pumps' stored oz values. */
function sumCheckedPumpOz(pumps: Record<string, boolean>, pumpOz: Record<string, number>): number {
  let total = 0;
  for (const [id, on] of Object.entries(pumps)) {
    if (!on) continue;
    const oz = pumpOz[id];
    if (typeof oz === "number" && oz > 0) total += oz;
  }
  return round1(total);
}

function normalizeLog(v: Partial<DayLog> & { pumpOz?: Record<string, number> }): DayLog {
  const pumps = v.pumps ?? {};
  const pumpOz: Record<string, number> = { ...(v.pumpOz ?? {}) };
  // Migrate: if older logs have pumps checked but no pumpOz, leave empty (user can edit)
  const pumpedOz =
    typeof v.pumpedOz === "number" && v.pumpedOz >= 0
      ? round1(v.pumpedOz)
      : sumCheckedPumpOz(pumps, pumpOz);
  return {
    pumps,
    pumpOz,
    meals: v.meals ?? {},
    notes: v.notes ?? {},
    nutrients: v.nutrients ?? {},
    foodLogs: v.foodLogs ?? {},
    pumpedOz,
    fedOz: typeof v.fedOz === "number" && v.fedOz >= 0 ? round1(v.fedOz) : 0,
    freezerBankOz:
      typeof v.freezerBankOz === "number" && v.freezerBankOz >= 0 ? round1(v.freezerBankOz) : 0,
    seededFromPrev: Boolean(v.seededFromPrev),
  };
}

function loadAll(): Record<string, DayLog> {
  try {
    let raw = localStorage.getItem(STORAGE);
    if (!raw) {
      for (const k of PREV_KEYS) {
        raw = localStorage.getItem(k);
        if (raw) break;
      }
    }
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<DayLog>>;
    const next: Record<string, DayLog> = {};
    for (const [k, v] of Object.entries(parsed)) {
      next[k] = normalizeLog(v);
    }
    // Persist migrated data under v4
    localStorage.setItem(STORAGE, JSON.stringify(next));
    return next;
  } catch {
    return {};
  }
}

function fromMap(n: Record<string, number>): MacroSet {
  return {
    calories: n.calories ?? 0,
    protein: n.protein ?? 0,
    carbs: n.carbs ?? 0,
    sugar: n.sugar ?? 0,
    fat: n.fat ?? 0,
    calcium: n.calcium ?? 0,
    fluid: n.fluid ?? 0,
  };
}

/** Previous calendar weekday id + month/year when crossing month boundaries via Date math. */
function previousDayRef(
  year: number,
  monthIndex: number,
  dayId: string,
): { year: number; monthIndex: number; dayId: string } | null {
  const idx = DAYS.findIndex((d) => d.id === dayId);
  if (idx < 0) return null;
  // Map Mon=0..Sun=6 to a Date: pick a Monday-aligned week in that month
  // Use mid-month Monday as anchor, then offset by day index.
  const anchor = new Date(year, monthIndex, 15);
  // Find Monday of that week (or previous)
  const dow = anchor.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(year, monthIndex, 15 + mondayOffset);
  const target = new Date(monday);
  target.setDate(monday.getDate() + idx - 1); // previous calendar day
  const prevDow = target.getDay();
  const prevDayId = DAYS[prevDow === 0 ? 6 : prevDow - 1].id;
  return {
    year: target.getFullYear(),
    monthIndex: target.getMonth(),
    dayId: prevDayId,
  };
}

export function useLogs() {
  const [all, setAll] = useState<Record<string, DayLog>>(() => loadAll());

  const getLog = useCallback(
    (year: number, monthIndex: number, dayId: string) =>
      all[dayKey(year, monthIndex, dayId)] ?? emptyLog(),
    [all],
  );

  /** Functional patch so back-to-back updates (apply + save entry) don't wipe each other. */
  const patch = useCallback(
    (year: number, monthIndex: number, dayId: string, fn: (cur: DayLog) => DayLog) => {
      const key = dayKey(year, monthIndex, dayId);
      setAll((prev) => {
        const cur = prev[key] ?? emptyLog();
        const next = { ...prev, [key]: fn(cur) };
        localStorage.setItem(STORAGE, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  /**
   * Toggle a pump check. When turning ON, default pumpOz[id] to sessionOz if empty,
   * then recompute pumpedOz from checked sessions. When OFF, keep stored oz but exclude from total.
   */
  const togglePump = (
    year: number,
    monthIndex: number,
    dayId: string,
    pumpId: string,
    sessionOz = 0,
  ) =>
    patch(year, monthIndex, dayId, (cur) => {
      const turningOn = !cur.pumps[pumpId];
      const pumps = { ...cur.pumps, [pumpId]: turningOn };
      const pumpOz = { ...cur.pumpOz };
      if (turningOn) {
        const existing = pumpOz[pumpId];
        if (!(typeof existing === "number" && existing > 0)) {
          pumpOz[pumpId] = sanitizeOz(sessionOz);
        }
      }
      return {
        ...cur,
        pumps,
        pumpOz,
        pumpedOz: sumCheckedPumpOz(pumps, pumpOz),
      };
    });

  /** Set ounces for one pump session; refreshes pumpedOz from checked sum. */
  const setPumpOz = (
    year: number,
    monthIndex: number,
    dayId: string,
    pumpId: string,
    oz: number,
  ) =>
    patch(year, monthIndex, dayId, (cur) => {
      const pumpOz = { ...cur.pumpOz, [pumpId]: sanitizeOz(oz) };
      // If she edits oz while unchecked, still store it; total only counts checked
      return {
        ...cur,
        pumpOz,
        pumpedOz: sumCheckedPumpOz(cur.pumps, pumpOz),
      };
    });

  const toggleMeal = (year: number, monthIndex: number, dayId: string, mealId: string) =>
    patch(year, monthIndex, dayId, (cur) => ({
      ...cur,
      meals: { ...cur.meals, [mealId]: !cur.meals[mealId] },
    }));

  const setNote = (year: number, monthIndex: number, dayId: string, mealId: string, note: string) =>
    patch(year, monthIndex, dayId, (cur) => ({
      ...cur,
      notes: { ...cur.notes, [mealId]: note },
    }));

  const setNutrient = (
    year: number,
    monthIndex: number,
    dayId: string,
    nutrientId: string,
    value: number,
  ) =>
    patch(year, monthIndex, dayId, (cur) => ({
      ...cur,
      nutrients: {
        ...cur.nutrients,
        [nutrientId]: Number.isFinite(value) && value >= 0 ? value : 0,
      },
    }));

  const setFoodLog = (
    year: number,
    monthIndex: number,
    dayId: string,
    mealId: string,
    entry: MealFoodEntry,
  ) =>
    patch(year, monthIndex, dayId, (cur) => ({
      ...cur,
      foodLogs: { ...cur.foodLogs, [mealId]: entry },
      notes: {
        ...cur.notes,
        [mealId]: entry.description || cur.notes[mealId] || "",
      },
    }));

  /** Replace this meal's prior contribution on the scoreboard with new macros. */
  const applyFoodMacros = (
    year: number,
    monthIndex: number,
    dayId: string,
    mealId: string,
    macros: MacroSet,
  ) =>
    patch(year, monthIndex, dayId, (cur) => {
      const prevEntry = cur.foodLogs[mealId];
      const prevApplied: MacroSet =
        prevEntry?.applied && prevEntry.lastApplied
          ? prevEntry.lastApplied
          : EMPTY_MACROS;
      const current = fromMap(cur.nutrients ?? {});
      const withoutPrev: MacroSet = {
        calories: Math.max(0, current.calories - prevApplied.calories),
        protein: Math.max(0, Math.round((current.protein - prevApplied.protein) * 10) / 10),
        carbs: Math.max(0, Math.round((current.carbs - prevApplied.carbs) * 10) / 10),
        sugar: Math.max(0, Math.round((current.sugar - prevApplied.sugar) * 10) / 10),
        fat: Math.max(0, Math.round((current.fat - prevApplied.fat) * 10) / 10),
        calcium: Math.max(0, current.calcium - prevApplied.calcium),
        fluid: Math.max(0, current.fluid - prevApplied.fluid),
      };
      const nextMacros = addMacros(withoutPrev, macros);
      const nextEntry: MealFoodEntry = {
        ...(prevEntry ?? {
          description: "",
          servingLabel: "",
          servings: 1,
          macros: EMPTY_MACROS,
          applied: false,
        }),
        applied: true,
        lastApplied: macros,
      };
      return {
        ...cur,
        nutrients: macrosToNutrientMap(nextMacros),
        foodLogs: { ...cur.foodLogs, [mealId]: nextEntry },
        meals: { ...cur.meals, [mealId]: true },
      };
    });

  const setPumpedOz = (year: number, monthIndex: number, dayId: string, value: number) =>
    patch(year, monthIndex, dayId, (cur) => ({ ...cur, pumpedOz: sanitizeOz(value) }));

  const setFedOz = (year: number, monthIndex: number, dayId: string, value: number) =>
    patch(year, monthIndex, dayId, (cur) => ({ ...cur, fedOz: sanitizeOz(value) }));

  const setFreezerBankOz = (year: number, monthIndex: number, dayId: string, value: number) =>
    patch(year, monthIndex, dayId, (cur) => ({ ...cur, freezerBankOz: sanitizeOz(value) }));

  /**
   * Seed freezer bank + baby drank from previous calendar day once when first opened.
   */
  const ensureDaySeeded = useCallback(
    (year: number, monthIndex: number, dayId: string) => {
      const key = dayKey(year, monthIndex, dayId);
      setAll((prev) => {
        const cur = prev[key] ?? emptyLog();
        if (cur.seededFromPrev) return prev;
        const ref = previousDayRef(year, monthIndex, dayId);
        if (!ref) {
          const marked = { ...cur, seededFromPrev: true };
          const next = { ...prev, [key]: marked };
          localStorage.setItem(STORAGE, JSON.stringify(next));
          return next;
        }
        const prevLog = prev[dayKey(ref.year, ref.monthIndex, ref.dayId)];
        const seeded: DayLog = {
          ...cur,
          freezerBankOz: prevLog ? sanitizeOz(prevLog.freezerBankOz) : cur.freezerBankOz,
          fedOz: prevLog ? sanitizeOz(prevLog.fedOz) : cur.fedOz,
          seededFromPrev: true,
        };
        // Only seed if today's values look untouched (both still 0) OR always copy freezer
        // Spec: carry freezer as-is; carry fedOz as initial default once.
        const next = { ...prev, [key]: seeded };
        localStorage.setItem(STORAGE, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  /** Score pumps against an optional active session list (defaults to full PUMP_IDS). */
  const scoreDay = useCallback((log: DayLog, pumpIds?: string[]) => {
    const ids = pumpIds ?? PUMP_IDS;
    const pumpHit = ids.filter((id) => log.pumps[id]).length;
    const mealHit = EAT_IDS.filter((id) => log.meals[id]).length;
    return {
      pumpHit,
      mealHit,
      pumpMax: ids.length,
      mealMax: EAT_IDS.length,
      score: pumpHit * 2 + mealHit * 3,
    };
  }, []);

  const bestInMonth = useCallback(
    (year: number, monthIndex: number) => {
      let best: {
        dayId: string;
        name: string;
        score: number;
        pumpHit: number;
        mealHit: number;
        mealMax: number;
        pumpMax: number;
      } | null = null;
      for (const d of DAYS) {
        const s = scoreDay(all[dayKey(year, monthIndex, d.id)] ?? emptyLog());
        if (s.score === 0) continue;
        if (!best || s.score > best.score) {
          best = { dayId: d.id, name: d.name, ...s };
        }
      }
      return best;
    },
    [all, scoreDay],
  );


  return {
    getLog,
    togglePump,
    setPumpOz,
    toggleMeal,
    setNote,
    setNutrient,
    setFoodLog,
    applyFoodMacros,
    setPumpedOz,
    setFedOz,
    setFreezerBankOz,
    ensureDaySeeded,
    scoreDay,
    bestInMonth,
  };
}
