import { DAILY_CLOCK, SEGMENT_COLORS, type ClockSegment } from "../data/plan";

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const large = a1 - a0 > 180 ? 1 : 0;
  const p0 = polar(cx, cy, r1, a0);
  const p1 = polar(cx, cy, r1, a1);
  const p2 = polar(cx, cy, r0, a1);
  const p3 = polar(cx, cy, r0, a0);
  return `M ${p0.x} ${p0.y} A ${r1} ${r1} 0 ${large} 1 ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${r0} ${r0} 0 ${large} 0 ${p3.x} ${p3.y} Z`;
}

type Props = {
  highlightKind?: string | null;
  onSelect?: (seg: ClockSegment) => void;
};

export function Clock24({ highlightKind, onSelect }: Props) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 148;
  const rInner = 70;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="clock24" role="img" aria-label="24 hour pumping and eating clock">
      <circle cx={cx} cy={cy} r={rOuter + 3} fill="#f7f1e6" stroke="#1a2744" strokeWidth="2" />
      {DAILY_CLOCK.map((s) => {
        const a0 = (s.startMin / 1440) * 360;
        const a1 = (s.endMin / 1440) * 360;
        if (a1 <= a0) return null;
        const dim = highlightKind && s.kind !== highlightKind;
        return (
          <path
            key={s.id}
            d={arcPath(cx, cy, rInner, rOuter, a0, a1)}
            fill={SEGMENT_COLORS[s.kind]}
            opacity={dim ? 0.45 : 1}
            stroke="#fff"
            strokeWidth={0.5}
            className="clock-seg"
            onClick={() => onSelect?.(s)}
          >
            <title>{s.label}</title>
          </path>
        );
      })}
      <circle cx={cx} cy={cy} r={rInner - 2} fill="#fffdf8" stroke="#1a2744" strokeWidth="1.5" />
      <text x={cx} y={cy - 6} textAnchor="middle" className="clock-center-title">
        24h
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="clock-center-sub">
        same clock
      </text>
      {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => {
        const ang = (h / 24) * 360;
        const lab = polar(cx, cy, 136, ang);
        const label = h === 0 ? "12a" : h === 12 ? "12p" : String(h > 12 ? h - 12 : h);
        return (
          <text key={h} x={lab.x} y={lab.y + 3} textAnchor="middle" className="clock-hour">
            {label}
          </text>
        );
      })}
    </svg>
  );
}
