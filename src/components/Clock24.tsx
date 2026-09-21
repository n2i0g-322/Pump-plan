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

function minToDeg(min: number) {
  return ((min % 1440) / 1440) * 360;
}

type Props = {
  nutrients?: Record<string, number>;
  highlightKind?: string | null;
  onSelect?: (seg: ClockSegment) => void;
  /** Adaptive middle-ring schedule (defaults to static DAILY_CLOCK). */
  clock?: ClockSegment[];
  /** When set, only these pump ids get markers (inactive historical pumps omitted). */
  activePumpIds?: string[];
};

/**
 * Ball = today's date
 * Ring 1 (inner) = fixed daily nutrient goals
 * Ring 2 (middle) = 24h pump / eat / sleep / awake
 * Ring 3 (outer) = logged progress, hard-capped at 100% of that nutrient's goal sector
 */
export function Clock24({
  nutrients,
  highlightKind,
  onSelect,
  clock = DAILY_CLOCK,
  activePumpIds,
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
  const rHour = 178;

  const activeSet = activePumpIds ? new Set(activePumpIds) : null;
  const pumps = clock.filter((s) => {
    if (s.kind !== "pump") return false;
    if (!activeSet) return true;
    return activeSet.has(s.id);
  });
  // Also mark original pump ids that remain active even if clock merged labels
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

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="clock24"
      role="img"
      aria-label="Date, nutrient goals, 24-hour schedule, and progress"
    >
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
        return (
          <path
            key={s.id}
            d={arcPath(cx, cy, rClock0, rClock1, a0, a1)}
            fill={SEGMENT_COLORS[s.kind]}
            opacity={dim ? 0.35 : 1}
            stroke="#fffdf8"
            strokeWidth={0.7}
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
        return (
          <circle
            key={`pm-${p.id}`}
            cx={tip.x}
            cy={tip.y}
            r={5}
            fill="#fff"
            stroke={SEGMENT_COLORS.pump}
            strokeWidth={2}
          />
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
        // Never exceed this nutrient's sector (no bleed into the next)
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
