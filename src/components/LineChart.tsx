/** Minimal multi-series SVG line chart — no chart library. */

export type ChartSeries = {
  id: string;
  label: string;
  color: string;
  values: number[];
};

type Props = {
  labels: string[];
  series: ChartSeries[];
  height?: number;
  ariaLabel?: string;
};

export function LineChart({ labels, series, height = 180, ariaLabel }: Props) {
  const pad = { top: 16, right: 12, bottom: 28, left: 36 };
  const width = 560;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const n = Math.max(labels.length, 1);
  const allVals = series.flatMap((s) => s.values);
  const maxY = Math.max(1, ...allVals, 0) * 1.15;
  const minY = 0;

  const xAt = (i: number) => pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v: number) => pad.top + innerH - ((v - minY) / (maxY - minY)) * innerH;

  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((t) => minY + t * (maxY - minY));

  return (
    <div className="overview-chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel ?? "Chart"}
        className="overview-svg"
      >
        <rect x={0} y={0} width={width} height={height} fill="#0a0a0a" rx={8} />
        {gridYs.map((g) => {
          const y = yAt(g);
          return (
            <g key={g}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                stroke="#2a2a32"
                strokeWidth={1}
              />
              <text x={pad.left - 6} y={y + 3} textAnchor="end" fill="#9aa3b5" fontSize={10}>
                {Math.round(g)}
              </text>
            </g>
          );
        })}
        {labels.map((lab, i) => (
          <text
            key={`${lab}-${i}`}
            x={xAt(i)}
            y={height - 8}
            textAnchor="middle"
            fill="#9aa3b5"
            fontSize={10}
          >
            {lab}
          </text>
        ))}
        {series.map((s) => {
          const pts = s.values
            .map((v, i) => `${xAt(i)},${yAt(v)}`)
            .join(" ");
          return (
            <g key={s.id}>
              <polyline
                fill="none"
                stroke={s.color}
                strokeWidth={2.25}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={pts}
              />
              {s.values.map((v, i) => (
                <circle key={i} cx={xAt(i)} cy={yAt(v)} r={3} fill={s.color} />
              ))}
            </g>
          );
        })}
      </svg>
      <ul className="overview-legend">
        {series.map((s) => (
          <li key={s.id}>
            <span className="overview-swatch" style={{ background: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
