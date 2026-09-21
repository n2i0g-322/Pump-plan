import {
  DAILY_CLOCK,
  SEGMENT_COLORS,
  gapsBetweenPumps,
  nutrientColor,
  type ClockSegment,
} from "../data/plan";

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  let span = a1 - a0;
  if (span < 0) span += 360;
  const large = span > 180 ? 1 : 0;
  const p0 = polar(cx, cy, r1, a0);
  const p1 = polar(cx, cy, r1, a1);
  const p2 = polar(cx, cy, r0, a1);
  const p3 = polar(cx, cy, r0, a0);
  return `M ${p0.x} ${p0.y} A ${r1} ${r1} 0 ${large} 1 ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${r0} ${r0} 0 ${large} 0 ${p3.x} ${p3.y} Z`;
}

function minToDeg(min: number) {
  return ((min % 1440) / 1440) * 360;
}

/** Default daytime mix when nothing logged yet — still uses the global nutrient colors. */
const DEFAULT_MIX: { id: string; weight: number }[] = [
  { id: "protein", weight: 25 },
  { id: "carbs", weight: 35 },
  { id: "sugar", weight: 10 },
  { id: "fat", weight: 20 },
  { id: "calcium", weight: 5 },
  { id: "fluid", weight: 5 },
];

const NIGHT_MIX: { id: string; weight: number }[] = [
  { id: "fluid", weight: 40 },
  { id: "protein", weight: 20 },
  { id: "carbs", weight: 20 },
  { id: "calcium", weight: 10 },
  { id: "fat", weight: 10 },
];

function mixFromLog(nutrients: Record<string, number> | undefined, night: boolean) {
  const ids = ["protein", "carbs", "sugar", "fat", "calcium", "fluid"];
  const logged = ids
    .map((id) => ({ id, weight: Math.max(0, nutrients?.[id] ?? 0) }))
    .filter((x) => x.weight > 0);
  if (logged.length) return logged;
  return night ? NIGHT_MIX : DEFAULT_MIX;
}

type Props = {
  nutrients?: Record<string, number>;
  highlightKind?: string | null;
  onSelect?: (seg: ClockSegment) => void;
};

export function Clock24({ nutrients, highlightKind, onSelect }: Props) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 148;
  const rMid = 118;
  const rNutOuter = 112;
  const rNutInner = 78;
  const rInner = 70;

  const gaps = gapsBetweenPumps();
  const pumps = DAILY_CLOCK.filter((s) => s.kind === "pump");

  // Night band: three overnight hours around 12am / 3am / ~pre-dawn (0–180 min) + late evening sleep
  const nightBands = [
    { start: 0, end: 180 }, // 12am–3am (first night block)
    { start: 180, end: 360 }, // 3am–6am (second)
    { start: 1320, end: 1440 }, // 10pm–12am feel / third night sleep wedge into midnight
  ];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="clock24" role="img" aria-label="24 hour pumping clock with nutrient slivers">
      <defs>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.25" />
        </filter>
      </defs>

      <circle cx={cx} cy={cy} r={rOuter + 3} fill="#f7f1e6" stroke="#1a2744" strokeWidth="2" />

      {/* Base day ring */}
      {DAILY_CLOCK.map((s) => {
        const a0 = minToDeg(s.startMin);
        const a1 = minToDeg(s.endMin);
        if (s.endMin <= s.startMin) return null;
        const dim = highlightKind && s.kind !== highlightKind;
        return (
          <path
            key={s.id}
            d={arcPath(cx, cy, rMid, rOuter, a0, a1)}
            fill={SEGMENT_COLORS[s.kind]}
            opacity={dim ? 0.4 : s.kind === "awake" ? 0.85 : 1}
            stroke="#fff"
            strokeWidth={0.5}
            className="clock-seg"
            onClick={() => onSelect?.(s)}
          >
            <title>{s.label}</title>
          </path>
        );
      })}

      {/* Darker night tint over three night spans */}
      {nightBands.map((b, i) => (
        <path
          key={`night-${i}`}
          d={arcPath(cx, cy, rInner - 4, rOuter + 1, minToDeg(b.start), minToDeg(b.end))}
          fill="#0d1528"
          opacity={0.28}
          pointerEvents="none"
        />
      ))}

      {/* Nutrient pie slivers in the gaps between pumps (inner ring) */}
      {gaps.map((gap) => {
        const start = gap.startMin;
        const end = gap.endMin;
        const spanMin = end - start;
        const mix = mixFromLog(nutrients, gap.night);
        const total = mix.reduce((s, m) => s + m.weight, 0) || 1;
        let cursor = start;
        return mix.map((m) => {
          const slice = (m.weight / total) * spanMin;
          const a0 = minToDeg(cursor);
          const a1 = minToDeg(cursor + slice);
          cursor += slice;
          return (
            <path
              key={`${gap.id}-${m.id}`}
              d={arcPath(cx, cy, rNutInner, rNutOuter, a0, a1)}
              fill={nutrientColor(m.id)}
              stroke="#fffdf8"
              strokeWidth={0.4}
              opacity={gap.night ? 0.75 : 0.95}
              pointerEvents="none"
            >
              <title>{`${m.id} between pumps`}</title>
            </path>
          );
        });
      })}

      {/* Pump markers on outer edge */}
      {pumps.map((p) => {
        const mid = (p.startMin + p.endMin) / 2;
        const ang = minToDeg(mid);
        const tip = polar(cx, cy, rOuter - 4, ang);
        return (
          <circle key={`pm-${p.id}`} cx={tip.x} cy={tip.y} r={4} fill={SEGMENT_COLORS.pump} stroke="#fff" strokeWidth={1.2} />
        );
      })}

      {/* Hub */}
      <circle cx={cx} cy={cy} r={rInner - 2} fill="#fffdf8" stroke="#1a2744" strokeWidth="1.5" />

      {/* Moon for night — sits in the deep overnight sector (~1:30am) */}
      <g transform={`translate(${polar(cx, cy, 42, minToDeg(90)).x}, ${polar(cx, cy, 42, minToDeg(90)).y})`} filter="url(#soft)">
        <circle cx="0" cy="0" r="11" fill="#e8eef8" />
        <circle cx="4" cy="-2" r="9" fill="#fffdf8" />
        <circle cx="-3" cy="2" r="1.2" fill="#c5d0e6" opacity="0.7" />
        <circle cx="2" cy="4" r="0.9" fill="#c5d0e6" opacity="0.55" />
      </g>

      <text x={cx} y={cy + 28} textAnchor="middle" className="clock-center-title">
        24h
      </text>
      <text x={cx} y={cy + 44} textAnchor="middle" className="clock-center-sub">
        nutrients between pumps
      </text>

      {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => {
        const ang = (h / 24) * 360;
        const lab = polar(cx, cy, 136, ang);
        const label = h === 0 ? "12a" : h === 12 ? "12p" : String(h > 12 ? h - 12 : h);
        const nightHour = h === 0 || h === 3 || h === 21;
        return (
          <text
            key={h}
            x={lab.x}
            y={lab.y + 3}
            textAnchor="middle"
            className={nightHour ? "clock-hour night-hour" : "clock-hour"}
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
