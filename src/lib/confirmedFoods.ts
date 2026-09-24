/**
 * Persist user-confirmed plate foods for faster manual search later.
 */

import type { MacroSet } from "./nutrition";

const STORAGE_KEY = "pump-plan-confirmed-foods-v1";
const MAX_ITEMS = 80;

export type ConfirmedFoodMemory = {
  id: string;
  name: string;
  servingLabel?: string;
  macros: MacroSet;
  source: string;
  updatedAt: number;
};

function loadAll(): ConfirmedFoodMemory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConfirmedFoodMemory[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(items: ConfirmedFoodMemory[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // quota / private mode — ignore
  }
}

export function rememberConfirmedFood(entry: {
  name: string;
  servingLabel?: string;
  macros: MacroSet;
  source: string;
}): void {
  const name = entry.name.trim();
  if (!name) return;
  const all = loadAll().filter(
    (x) => x.name.toLowerCase() !== name.toLowerCase(),
  );
  all.unshift({
    id: `mem-${Date.now().toString(36)}`,
    name,
    servingLabel: entry.servingLabel,
    macros: entry.macros,
    source: entry.source,
    updatedAt: Date.now(),
  });
  saveAll(all);
}

export function searchConfirmedFoods(
  query: string,
  limit = 8,
): ConfirmedFoodMemory[] {
  const q = query.trim().toLowerCase();
  const all = loadAll();
  if (!q) return all.slice(0, limit);
  return all
    .filter((x) => x.name.toLowerCase().includes(q))
    .slice(0, limit);
}
