import {
  DAILY_CLOCK,
  type BabyFeedStage,
  type ClockSegment,
  type SegmentKind,
} from "../data/plan";

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
  adaptiveClock: ClockSegment[];
  scheduleNote: string;
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

const NIGHT_START = 22 * 60; // 10:00p
const NIGHT_END = 6 * 60; // 6:00a

function isNightStart(startMin: number): boolean {
  return startMin >= NIGHT_START || startMin < NIGHT_END;
}

function pumpMeta(id: string): { id: string; startMin: number; endMin: number; label: string } | null {
  const seg = DAILY_CLOCK.find((s) => s.id === id && s.kind === "pump");
  if (!seg) return null;
  return { id: seg.id, startMin: seg.startMin, endMin: seg.endMin, label: seg.label };
}

function pumpLabel(id: string): string {
  return pumpMeta(id)?.label ?? id.replace("pump-", "Pump ");
}

/** Circular minutes from a → b (forward). */
function forwardGapMin(fromEnd: number, toStart: number): number {
  let g = toStart - fromEnd;
  if (g < 0) g += 1440;
  return g;
}

/** Max gap (hours) between consecutive active pumps after a candidate set. */
function maxGapHoursAmong(activeIds: string[]): number {
  const pumps = activeIds
    .map(pumpMeta)
    .filter((p): p is NonNullable<typeof p> => p != null)
    .sort((a, b) => a.startMin - b.startMin);
  if (pumps.length < 2) return 24;
  let maxG = 0;
  for (let i = 0; i < pumps.length; i++) {
    const cur = pumps[i];
    const next = pumps[(i + 1) % pumps.length];
    const g = forwardGapMin(cur.endMin, next.startMin) / 60;
    if (g > maxG) maxG = g;
  }
  return maxG;
}

/**
 * Overnight sleep block length (hours) spanning night hours between consecutive pumps.
 * Larger = better sleep protection.
 */
function overnightSleepHours(activeIds: string[]): number {
  const pumps = activeIds
    .map(pumpMeta)
    .filter((p): p is NonNullable<typeof p> => p != null)
    .sort((a, b) => a.startMin - b.startMin);
  if (pumps.length === 0) return 24;
  let best = 0;
  for (let i = 0; i < pumps.length; i++) {
    const cur = pumps[i];
    const next = pumps[(i + 1) % pumps.length];
    const gap = forwardGapMin(cur.endMin, next.startMin);
    const mid = (cur.endMin + gap / 2) % 1440;
    // Score gaps whose midpoint sits in night / late evening
    if (mid >= 20 * 60 || mid < 8 * 60) {
      best = Math.max(best, gap / 60);
    }
  }
  return best;
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

/**
 * Surplus: drop night / pre-dawn pumps first to protect longest overnight sleep,
 * never leaving a gap > maxGapHours. Steady/deficit: even spacing for yield.
 */
/** Prefer dropping mid-night first (largest overnight gain), then midnight, 5a, 10:30p. */
function nightDropPriority(id: string): number {
  const s = pumpMeta(id)?.startMin ?? 0;
  if (s >= 120 && s <= 200) return 0; // ~2:30a
  if (s < 60) return 1; // midnight
  if (s >= 240 && s < NIGHT_END) return 2; // ~5a
  if (s >= NIGHT_START) return 3; // late evening
  return 4;
}

/**
 * Surplus: drop night / pre-dawn pumps first to protect longest overnight sleep,
 * never leaving a gap > maxGapHours. Steady/deficit: even spacing for yield.
 */
export function pickPumpsForYieldAndSleep(
  pumpIds: string[],
  sessions: number,
  mode: SupplyMode,
  maxGapHours = 4.5,
): string[] {
  const ordered = [...pumpIds].sort((a, b) => {
    const ma = pumpMeta(a)?.startMin ?? 0;
    const mb = pumpMeta(b)?.startMin ?? 0;
    return ma - mb;
  });

  if (sessions >= ordered.length) return ordered;
  if (sessions <= 0) return [];

  if (mode !== "surplus") {
    return pickEvenly(ordered, sessions);
  }

  // Start with all pumps; remove until we hit `sessions`, preferring night cuts
  // that maximize overnight sleep without exceeding maxGapHours.
  let active = [...ordered];
  const toCut = ordered.length - sessions;

  for (let cut = 0; cut < toCut; cut++) {
    const nightCandidates = active.filter((id) => {
      const m = pumpMeta(id);
      return m != null && isNightStart(m.startMin);
    });
    const dayCandidates = active.filter((id) => !nightCandidates.includes(id));

    let bestId: string | null = null;
    let bestSleep = -1;
    let bestPri = 99;

    const consider = (id: string) => {
      const trial = active.filter((x) => x !== id);
      if (trial.length < 1) return;
      if (maxGapHoursAmong(trial) > maxGapHours + 0.05) return;
      const sleepH = overnightSleepHours(trial);
      const pri = nightDropPriority(id);
      if (
        sleepH > bestSleep + 0.05 ||
        (Math.abs(sleepH - bestSleep) <= 0.05 && pri < bestPri) ||
        (Math.abs(sleepH - bestSleep) <= 0.05 && pri === bestPri && bestId == null)
      ) {
        bestSleep = sleepH;
        bestPri = pri;
        bestId = id;
      }
    };

    for (const id of nightCandidates) consider(id);
    if (bestId == null) {
      for (const id of dayCandidates) consider(id);
    }

    if (bestId == null) {
      // No safe single drop under maxGap — fall back to even spacing
      return pickEvenly(ordered, sessions);
    }
    active = active.filter((x) => x !== bestId);
  }

  return active;
}

function mergeConsecutive(segs: ClockSegment[]): ClockSegment[] {
  if (segs.length === 0) return [];
  const out: ClockSegment[] = [];
  let cur: ClockSegment = { ...segs[0] };
  for (let i = 1; i < segs.length; i++) {
    const next = segs[i];
    if (next.kind === cur.kind && next.startMin === cur.endMin) {
      cur = {
        ...cur,
        endMin: next.endMin,
        label: cur.kind === "rest" ? (cur.label.startsWith("Rest") ? cur.label : "Rest") : cur.kind === "sleep" ? "Sleep" : cur.label,
        id: `${cur.id}+${next.id}`,
      };
    } else {
      out.push(cur);
      cur = { ...next };
    }
  }
  out.push(cur);
  return out;
}

/** Build a clock where inactive pumps become distinct "rest" wedges (surplus skips). */
export function buildAdaptiveClock(activePumpIds: string[]): ClockSegment[] {
  const active = new Set(activePumpIds);
  const mapped: ClockSegment[] = DAILY_CLOCK.map((s) => {
    if (s.kind !== "pump" || active.has(s.id)) {
      return { ...s };
    }
    const night = isNightStart(s.startMin);
    return {
      ...s,
      kind: "rest" as SegmentKind,
      label: night ? "Rest / sleep" : "Rest",
      id: `rest-${s.id}`,
    };
  });
  return mergeConsecutive(mapped);
}

function buildScheduleNote(
  mode: SupplyMode,
  sessions: number,
  intervalHours: number,
  restWindows: string[],
  overnightH: number,
): string {
  if (mode === "surplus" && restWindows.length > 0) {
    return `Surplus: protecting ~${round1(overnightH)} h overnight sleep · ${sessions} daytime-weighted pumps · ~${intervalHours} h average gap.`;
  }
  if (mode === "deficit") {
    return `Deficit: keeping a dense ${sessions}-pump day (~every ${intervalHours} h) — no long sleep gifts until supply catches up.`;
  }
  return `Steady: ${sessions} evenly spaced pumps (~every ${intervalHours} h) for yield.`;
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
  const baseSessions = clamp(Math.round(feeds.mid), minSessions, maxSessions);

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

  // Allow ~one skipped slot (~5 h) so surplus can drop a night pump;
  // still clamped so we never gift a huge sleep gap in deficit/steady.
  const maxGapHours = clamp(24 / minSessions + 1, 4.5, 5.5);

  const activePumpIds = pickPumpsForYieldAndSleep(pumpIds, sessions, mode, maxGapHours);
  const restWindows: string[] = [];
  if (mode === "surplus" && sessions < pumpIds.length) {
    for (const id of pumpIds) {
      if (!activePumpIds.includes(id)) {
        const night = isNightStart(pumpMeta(id)?.startMin ?? 0);
        restWindows.push(
          night
            ? `Skip ${pumpLabel(id)} — stretch overnight sleep`
            : `Skip ${pumpLabel(id)} — short daytime rest`,
        );
      }
    }
  }

  const adaptiveClock = buildAdaptiveClock(activePumpIds);
  const overnightH = overnightSleepHours(activePumpIds);
  const scheduleNote = buildScheduleNote(
    mode,
    sessions,
    intervalHours,
    restWindows,
    overnightH,
  );

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
        ? `You are ahead — use rest windows (${restWindows.length} skip${restWindows.length === 1 ? "" : "s"}), preferring overnight, but stay at ≥${minSessions} pumps so supply stays protected.`
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
    adaptiveClock,
    scheduleNote,
  };
}
