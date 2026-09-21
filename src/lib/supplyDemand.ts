import { DAILY_CLOCK, type BabyFeedStage } from "../data/plan";

export type SupplyMode = "steady" | "surplus" | "deficit";

export type SupplyPlan = {
  demandOz: number;
  sessions: number;
  ozPerSession: number;
  ozPerSessionMl: number;
  intervalHours: number;
  mode: SupplyMode;
  activePumpIds: string[];
  restWindows: string[];
  breakRule: string;
  tips: string[];
  goalLabel: string;
};

export function parseRange(text: string): { min: number; max: number; mid: number } {
  const m = text.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)/);
  if (!m) {
    const single = Number.parseFloat(text);
    const n = Number.isFinite(single) ? single : 0;
    return { min: n, max: n, mid: n };
  }
  const min = Number.parseFloat(m[1]);
  const max = Number.parseFloat(m[2]);
  return { min, max, mid: (min + max) / 2 };
}

/** Mid ounces from strings like "1–2 oz (30–60 ml)". */
export function parseOzMid(ozPerFeed: string): number {
  const beforeParen = ozPerFeed.split("(")[0] ?? ozPerFeed;
  return parseRange(beforeParen).mid;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function minSessionsForStage(stage: BabyFeedStage): number {
  const iv = stage.interval;
  if (iv.includes("4–5") || iv.includes("4-5")) return 5;
  // every 2–3h and every 3–4h: never below 6
  return 6;
}

function sessionOzCap(stage: BabyFeedStage): number {
  return stage.id === "newborn" || stage.id === "2w" || stage.id === "1mo" ? 6 : 8;
}

/** Pick `count` ids evenly across the list; prefer first + last. */
export function pickEvenly(ids: string[], count: number): string[] {
  const n = ids.length;
  if (count >= n) return [...ids];
  if (count <= 0) return [];
  if (count === 1) return [ids[0]];

  const indices: number[] = [];
  for (let i = 0; i < count; i++) {
    indices.push(Math.round((i * (n - 1)) / (count - 1)));
  }
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] <= indices[i - 1]) indices[i] = indices[i - 1] + 1;
  }
  for (let i = indices.length - 2; i >= 0; i--) {
    if (indices[i] >= indices[i + 1]) indices[i] = indices[i + 1] - 1;
  }
  return indices.map((i) => ids[clamp(i, 0, n - 1)]);
}

function pumpLabel(id: string): string {
  return DAILY_CLOCK.find((s) => s.id === id)?.label ?? id.replace("pump-", "Pump ");
}

export type PlanSupplyDemandInput = {
  stage: BabyFeedStage;
  pumpedOzToday: number;
  fedOzToday: number;
  freezerBankOz?: number;
  pumpIds: string[];
};

export function planSupplyDemand(input: PlanSupplyDemandInput): SupplyPlan {
  const {
    stage,
    pumpedOzToday,
    fedOzToday,
    freezerBankOz = 0,
    pumpIds,
  } = input;

  const ozMid = parseOzMid(stage.ozPerFeed);
  const feeds = parseRange(stage.feedsPerDay);
  const demandOz = round1(ozMid * feeds.mid);

  const minSessions = minSessionsForStage(stage);
  const maxSessions = Math.min(12, pumpIds.length);
  let baseSessions = clamp(Math.round(feeds.mid), minSessions, maxSessions);

  let mode: SupplyMode = "steady";
  if (
    pumpedOzToday >= demandOz * 1.12 ||
    (fedOzToday > 0 && pumpedOzToday >= fedOzToday * 1.2) ||
    freezerBankOz >= demandOz * 0.5
  ) {
    mode = "surplus";
  } else if (pumpedOzToday > 0 && pumpedOzToday < demandOz * 0.85) {
    mode = "deficit";
  }

  let sessions = baseSessions;
  if (mode === "surplus") {
    const cut = freezerBankOz >= demandOz ? 2 : 1;
    sessions = Math.max(minSessions, baseSessions - cut);
  }
  // deficit / steady: keep base (do not stretch gaps)

  const cap = sessionOzCap(stage);
  while (sessions < maxSessions && demandOz / sessions > cap) {
    sessions += 1;
  }

  const ozPerSession = round1(demandOz / sessions);
  const ozPerSessionMl = Math.round(ozPerSession * 29.5735);
  const intervalHours = round1(24 / sessions);

  const activePumpIds = pickEvenly(pumpIds, sessions);
  const restWindows: string[] = [];
  if (mode === "surplus" && sessions < pumpIds.length) {
    for (const id of pumpIds) {
      if (!activePumpIds.includes(id)) {
        restWindows.push(`Skip ${pumpLabel(id)} — stretch sleep`);
      }
    }
  }

  const breakRule =
    "Keep pumps frequent and modest — never one huge session then long gaps. " +
    "Do not skip multiple days. Ease session count down only when you are clearly ahead of baby intake or have a solid freezer bank.";

  const tips: string[] = [];
  tips.push(
    `Hit ~${demandOz} oz today with ${sessions} pumps of ~${ozPerSession} oz (~${ozPerSessionMl} ml) about every ${intervalHours} h.`,
  );
  if (mode === "surplus") {
    tips.push(
      restWindows.length
        ? `You are ahead — use rest windows (${restWindows.length} skip${restWindows.length === 1 ? "" : "s"}) but stay at ≥${minSessions} pumps so supply stays protected.`
        : `You are ahead of demand — keep at least ${minSessions} evenly spaced pumps; bank the extra milk.`,
    );
    tips.push("Empty fully at each kept session; shorter rests beat mega-pumps.");
  } else if (mode === "deficit") {
    tips.push(
      `Below the ~${demandOz} oz goal — keep all ${sessions} sessions; add 5–10 min or hand-express after if output is low.`,
    );
    tips.push("Do not stretch intervals to “catch up” later; frequent emptying drives supply.");
  } else {
    tips.push("Steady mode: match baby demand with even spacing; log pumped / fed oz to unlock surplus rest.");
    tips.push("Water at every pump and a snack nearby keep you going through the clock.");
  }
  if (tips.length > 4) tips.length = 4;

  const goalLabel = `Daily goal ~${demandOz} oz · ${sessions}× ${ozPerSession} oz`;

  return {
    demandOz,
    sessions,
    ozPerSession,
    ozPerSessionMl,
    intervalHours,
    mode,
    activePumpIds,
    restWindows,
    breakRule,
    tips,
    goalLabel,
  };
}
