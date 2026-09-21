import { useCallback, useState } from "react";
import { DAYS, EAT_IDS, PUMP_IDS, dayKey } from "../data/plan";

export type DayLog = {
  pumps: Record<string, boolean>;
  meals: Record<string, boolean>;
  notes: Record<string, string>;
};

const STORAGE = "pump-week-logs-v1";

function emptyLog(): DayLog {
  return { pumps: {}, meals: {}, notes: {} };
}

function loadAll(): Record<string, DayLog> {
  try {
    const raw = localStorage.getItem(STORAGE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useLogs() {
  const [all, setAll] = useState<Record<string, DayLog>>(() => loadAll());

  const persist = useCallback((next: Record<string, DayLog>) => {
    setAll(next);
    localStorage.setItem(STORAGE, JSON.stringify(next));
  }, []);

  const getLog = useCallback(
    (year: number, monthIndex: number, dayId: string) =>
      all[dayKey(year, monthIndex, dayId)] ?? emptyLog(),
    [all],
  );

  const patch = useCallback(
    (year: number, monthIndex: number, dayId: string, fn: (cur: DayLog) => DayLog) => {
      const key = dayKey(year, monthIndex, dayId);
      const cur = all[key] ?? emptyLog();
      persist({ ...all, [key]: fn(cur) });
    },
    [all, persist],
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

  return { getLog, togglePump, toggleMeal, setNote, scoreDay, bestInMonth };
}
