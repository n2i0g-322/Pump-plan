import { useCallback, useState } from "react";
import { DAYS, EAT_IDS, PUMP_IDS, dayKey } from "../data/plan";
import type { MealFoodEntry } from "../components/MealFoodLog";
import {
  EMPTY_MACROS,
  addMacros,
  macrosToNutrientMap,
  type MacroSet,
} from "../lib/nutrition";

export type DayLog = {
  pumps: Record<string, boolean>;
  meals: Record<string, boolean>;
  notes: Record<string, string>;
  /** Logged nutrient amounts keyed by nutrient id (protein, carbs, sugar, …) */
  nutrients: Record<string, number>;
  /** Per-meal food + nutrition + photos */
  foodLogs: Record<string, MealFoodEntry>;
};

const STORAGE = "pump-week-logs-v3";

function emptyLog(): DayLog {
  return { pumps: {}, meals: {}, notes: {}, nutrients: {}, foodLogs: {} };
}

function loadAll(): Record<string, DayLog> {
  try {
    const raw =
      localStorage.getItem(STORAGE) ??
      localStorage.getItem("pump-week-logs-v2") ??
      localStorage.getItem("pump-week-logs-v1");
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<DayLog>>;
    const next: Record<string, DayLog> = {};
    for (const [k, v] of Object.entries(parsed)) {
      next[k] = {
        pumps: v.pumps ?? {},
        meals: v.meals ?? {},
        notes: v.notes ?? {},
        nutrients: v.nutrients ?? {},
        foodLogs: v.foodLogs ?? {},
      };
    }
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

  const togglePump = (year: number, monthIndex: number, dayId: string, pumpId: string) =>
    patch(year, monthIndex, dayId, (cur) => ({
      ...cur,
      pumps: { ...cur.pumps, [pumpId]: !cur.pumps[pumpId] },
    }));

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
      // current - prev + new
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

  const scoreDay = useCallback((log: DayLog) => {
    const pumpHit = PUMP_IDS.filter((id) => log.pumps[id]).length;
    const mealHit = EAT_IDS.filter((id) => log.meals[id]).length;
    return {
      pumpHit,
      mealHit,
      pumpMax: PUMP_IDS.length,
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
    toggleMeal,
    setNote,
    setNutrient,
    setFoodLog,
    applyFoodMacros,
    scoreDay,
    bestInMonth,
  };
}
