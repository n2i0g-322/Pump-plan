import {
  DAILY_CLOCK,
  SEGMENT_COLORS,
  leafNutrientTargets,
  nutrientColor,
  type ClockSegment,
} from "../data/plan";

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number,
): string {
  let span = a1 - a0;
  while (span < 0) span += 360;
  if (span >= 360) span = 359.99;
  const large = span > 180 ? 1 : 0;
  const p0 = polar(cx, cy, r1, a0);
  const p1 = polar(cx, cy, r1, a0 + span);
  const p2 = polar(cx, cy, r0, a0 + span);
  const p3 = polar(cx, cy, r0, a0);
  return `M ${p0.x} ${p0.y} A ${r1} ${r1} 0 ${large} 1 ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${r0} ${r0} 0 ${large} 0 ${p3.x} ${p3.y} Z`;
}

/** Stroke-only arc for thin progress rings. */
function strokeArc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  let span = a1 - a0;
  while (span < 0) span += 360;
  if (span >= 360) span = 359.99;
  const large = span > 180 ? 1 : 0;
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a0 + span);
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`;
}

function minToDeg(min: number) {
  return ((min % 1440) / 1440) * 360;
}

const PUMP_ACTIVE = "#e91e63";
const PUMP_DONE = "#2e7d32";

type Props = {
  nutrients?: Record<string, number>;
  highlightKind?: string | null;
  onSelect?: (seg: ClockSegment) => void;
  /** Adaptive middle-ring schedule (defaults to static DAILY_CLOCK). */
  clock?: ClockSegment[];
  /** When set, only these pump ids get markers (inactive historical pumps omitted). */
  activePumpIds?: string[];
  /** Completed pump session ids (green markers / wedges). */
  completedPumpIds?: string[];
  /** @deprecated Prefer breastOz + formulaOz + demandOz */
  milkFill01?: number;
  /** Breast milk / pumped oz toward daily demand */
  breastOz?: number;
  /** Formula oz toward daily demand */
  formulaOz?: number;
  /** Daily demand oz = 100% of the milk gauge */
  demandOz?: number;
};

/**
 * Ball = today's date
 * Ring 1 (inner) = fixed daily nutrient goals
 * Ring 2 (middle) = 24h pump / eat / sleep / awake / rest
 * Ring 3 (outer) = logged nutrient progress + milk progress arc
 */
export function Clock24({
  nutrients,
  highlightKind,
  onSelect,
  clock = DAILY_CLOCK,
  activePumpIds,
  completedPumpIds,
  milkFill01 = 0,
  breastOz,
  formulaOz,
  demandOz,
}: Props) {
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;

  const rHub = 50;
  const rGoal0 = 54;
  const rGoal1 = 86;
  const rClock0 = 92;
  const rClock1 = 128;
  const rProg0 = 134;
  const rProg1 = 164;
  const rMilk = 170;
  const rHour = 178;

  const activeSet = activePumpIds ? new Set(activePumpIds) : null;
  const doneSet = new Set(completedPumpIds ?? []);
  const pumps = clock.filter((s) => {
    if (s.kind !== "pump") return false;
    if (!activeSet) return true;
    return activeSet.has(s.id);
  });
  const markerPumps =
    activeSet != null
      ? DAILY_CLOCK.filter((s) => s.kind === "pump" && activeSet.has(s.id))
      : pumps;

  const leaves = leafNutrientTargets();
  const sector = 360 / Math.max(leaves.length, 1);

  const now = new Date();
  const monthShort = now.toLocaleString("en-CA", { month: "short" });
  const dayNum = String(now.getDate());
  const weekday = now.toLocaleString("en-CA", { weekday: "short" });

  const breast = Math.max(0, breastOz ?? 0);
  const formula = Math.max(0, formulaOz ?? 0);
  const demand = Math.max(0, demandOz ?? 0);
  const totalOz = breast + formula;
  const progress =
    demand > 0
      ? Math.min(1, totalOz / demand)
      : Math.max(0, Math.min(1, milkFill01));
  const breastShare = totalOz > 0 ? breast / totalOz : 1;
  const formulaShare = totalOz > 0 ? formula / totalOz : 0;
  const breastPct = progress * breastShare;
  const formulaPct = progress * formulaShare;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="clock24"
      role="img"
      aria-label="Date, nutrient goals, 24-hour schedule, milk progress"
    >
      <defs>
        <pattern
          id="rest-hatch"
          patternUnits="userSpaceOnUse"
          width="6"
          height="6"
          patternTransform="rotate(35)"
        >
          <rect width="6" height="6" fill="#c4b5fd" opacity="0.55" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#7c6bb5" strokeWidth="1.2" opacity="0.55" />
        </pattern>
      </defs>

      <circle cx={cx} cy={cy} r={rProg1 + 8} fill="#f4efe4" stroke="#1a2744" strokeWidth="2.5" />

      {/* RING 1 — goals */}
      {leaves.map((leaf, i) => {
        const a0 = i * sector;
        const a1 = a0 + sector - 0.8;
        return (
          <path
            key={`goal-${leaf.id}`}
            d={arcPath(cx, cy, rGoal0, rGoal1, a0, a1)}
            fill={nutrientColor(leaf.id)}
            stroke="#1a2744"
            strokeWidth={0.45}
            opacity={0.95}
          >
            <title>{`Goal · ${leaf.label}: ${leaf.target} ${leaf.unit}`}</title>
          </path>
        );
      })}

      {/* RING 2 — adaptive clock */}
      {clock.map((s) => {
        const a0 = minToDeg(s.startMin);
        const a1 = minToDeg(s.endMin);
        if (s.endMin <= s.startMin) return null;
        const dim = Boolean(highlightKind && s.kind !== highlightKind);
        const isRest = s.kind === "rest" || s.id.includes("rest-");
        const isPump = s.kind === "pump";
        const pumpDone = isPump && doneSet.has(s.id);
        const fill = isRest
          ? "url(#rest-hatch)"
          : pumpDone
            ? PUMP_DONE
            : isPump
              ? PUMP_ACTIVE
              : SEGMENT_COLORS[s.kind];
        const strokeW = isPump ? 1.6 : isRest ? 1.1 : 0.7;
        const strokeDash = isRest ? "3 2" : undefined;
        return (
          <path
            key={s.id}
            d={arcPath(cx, cy, rClock0, rClock1, a0, a1)}
            fill={fill}
            opacity={dim ? 0.35 : 1}
            stroke={isRest ? "#7c6bb5" : "#fffdf8"}
            strokeWidth={strokeW}
            strokeDasharray={strokeDash}
            className="clock-seg"
            onClick={() => onSelect?.(s)}
          >
            <title>{s.label}</title>
          </path>
        );
      })}

      {/* Soft night wash overnight */}
      <path
        d={arcPath(cx, cy, rClock0, rClock1, minToDeg(0), minToDeg(360))}
        fill="#050a14"
        opacity={0.18}
        pointerEvents="none"
      />
      <path
        d={arcPath(cx, cy, rClock0, rClock1, minToDeg(1320), minToDeg(1440))}
        fill="#050a14"
        opacity={0.2}
        pointerEvents="none"
      />

      {markerPumps.map((p) => {
        const mid = (p.startMin + p.endMin) / 2;
        const tip = polar(cx, cy, (rClock0 + rClock1) / 2, minToDeg(mid));
        const done = doneSet.has(p.id);
        return (
          <g key={`pm-${p.id}`}>
            <circle
              cx={tip.x}
              cy={tip.y}
              r={done ? 6.5 : 5}
              fill={done ? PUMP_DONE : "#fff"}
              stroke={done ? "#1b5e20" : PUMP_ACTIVE}
              strokeWidth={2.2}
            />
            {done ? (
              <circle
                cx={tip.x}
                cy={tip.y}
                r={9}
                fill="none"
                stroke={PUMP_DONE}
                strokeWidth={1.5}
                opacity={0.85}
              />
            ) : null}
          </g>
        );
      })}

      {/* RING 3 — progress (outer), empty track always visible */}
      <circle
        cx={cx}
        cy={cy}
        r={(rProg0 + rProg1) / 2}
        fill="none"
        stroke="#bdb5a6"
        strokeWidth={rProg1 - rProg0}
        opacity={0.65}
      />
      {leaves.map((leaf, i) => {
        const a0 = i * sector;
        const a1 = a0 + sector - 0.8;
        return (
          <path
            key={`track-${leaf.id}`}
            d={arcPath(cx, cy, rProg0, rProg1, a0, a1)}
            fill="#d8d2c4"
            stroke="#1a2744"
            strokeWidth={0.35}
            opacity={0.9}
          />
        );
      })}
      {leaves.map((leaf, i) => {
        const a0 = i * sector;
        const have = Math.max(0, nutrients?.[leaf.id] ?? 0);
        const pct = leaf.target > 0 ? Math.min(1, have / leaf.target) : 0;
        if (pct <= 0.002) return null;
        const a1 = a0 + (sector - 0.8) * pct;
        return (
          <path
            key={`prog-${leaf.id}`}
            d={arcPath(cx, cy, rProg0, rProg1, a0, a1)}
            fill={nutrientColor(leaf.id)}
            stroke="#fffdf8"
            strokeWidth={0.5}
          >
            <title>{`${leaf.label}: ${Math.round(have)} / ${leaf.target} ${leaf.unit} (${Math.round(pct * 100)}%)`}</title>
          </path>
        );
      })}

      {/* Milk progress: matte black track · white breast · purple formula · hard-capped 100% */}
      <circle
        cx={cx}
        cy={cy}
        r={rMilk}
        fill="none"
        stroke="#0a0a0a"
        strokeWidth={6}
        opacity={1}
      />
      {breastPct > 0.002 ? (
        <path
          d={strokeArc(cx, cy, rMilk, 0, 360 * breastPct)}
          fill="none"
          stroke="#ffffff"
          strokeWidth={6}
          strokeLinecap="butt"
        >
          <title>{`Breast milk: ${Math.round(breastPct * 100)}% of demand`}</title>
        </path>
      ) : null}
      {formulaPct > 0.002 ? (
        <path
          d={strokeArc(cx, cy, rMilk, 360 * breastPct, 360 * (breastPct + formulaPct))}
          fill="none"
          stroke="#7c3aed"
          strokeWidth={6}
          strokeLinecap="butt"
        >
          <title>{`Formula: ${Math.round(formulaPct * 100)}% of demand`}</title>
        </path>
      ) : null}

      <circle cx={cx} cy={cy} r={rGoal1 + 2} fill="none" stroke="#1a2744" strokeWidth="1.5" opacity={0.35} />
      <circle cx={cx} cy={cy} r={rClock1 + 2} fill="none" stroke="#1a2744" strokeWidth="1.5" opacity={0.35} />

      {/* BALL — date */}
      <circle cx={cx} cy={cy} r={rHub} fill="#fffdf8" stroke="#1a2744" strokeWidth="2" />
      <text x={cx} y={cy - 10} textAnchor="middle" className="clock-center-sub">
        {weekday}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" className="clock-center-title">
        {monthShort} {dayNum}
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" className="clock-center-sub">
        {now.getFullYear()}
      </text>

      {Array.from({ length: 24 }, (_, h) => {
        const ang = (h / 24) * 360;
        const t0 = polar(cx, cy, rProg1 + 2, ang);
        const t1 = polar(cx, cy, rProg1 + (h % 3 === 0 ? 9 : 5), ang);
        return (
          <line key={`tick-${h}`} x1={t0.x} y1={t0.y} x2={t1.x} y2={t1.y} className="clock-tick" />
        );
      })}
      {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => {
        const ang = (h / 24) * 360;
        const lab = polar(cx, cy, rHour, ang);
        const label = h === 0 ? "12a" : h === 12 ? "12p" : String(h > 12 ? h - 12 : h);
        return (
          <text key={`h-${h}`} x={lab.x} y={lab.y + 4} textAnchor="middle" className="clock-hour">
            {label}
          </text>
        );
      })}
    </svg>
  );
}
