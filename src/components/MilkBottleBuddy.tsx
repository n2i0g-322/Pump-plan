/** Anime chibi baby + oversized bottle; milk fill = logged pumps / daily target. */

type Props = {
  /** 0–1 fill fraction (already capped) */
  fill: number;
  /** e.g. "4 / 10 pumps" */
  label: string;
  /** Target ounces tip from age chart */
  ozHint?: string;
};

export function MilkBottleBuddy({ fill, label, ozHint }: Props) {
  const pct = Math.max(0, Math.min(1, fill));
  // Bottle milk rect in SVG coords (bottle body roughly y=48..210)
  const milkTop = 210 - (210 - 48) * pct;
  const milkHeight = 210 - milkTop;

  return (
    <figure className="milk-buddy" aria-label={`Milk bottle ${Math.round(pct * 100)} percent full. ${label}`}>
      <svg viewBox="0 0 320 260" className="milk-buddy-svg" role="img">
        <defs>
          <clipPath id="bottle-clip">
            <rect x="168" y="48" width="72" height="162" rx="18" />
          </clipPath>
          <linearGradient id="milk-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffdf6" />
            <stop offset="55%" stopColor="#f5f0d8" />
            <stop offset="100%" stopColor="#ebe3c0" />
          </linearGradient>
        </defs>

        {/* soft ground */}
        <ellipse cx="160" cy="245" rx="110" ry="10" fill="#e8e0d0" opacity="0.7" />

        {/* ——— tiny anime baby (left) ——— */}
        {/* body */}
        <ellipse cx="78" cy="175" rx="28" ry="34" fill="#ffe4c4" />
        {/* onesie */}
        <path d="M55 165 Q78 155 101 165 L105 210 Q78 225 51 210 Z" fill="#9ad0f5" />
        <circle cx="78" cy="188" r="4" fill="#6bb3e0" />
        {/* head */}
        <circle cx="78" cy="118" r="32" fill="#ffe4c4" />
        {/* hair tuft */}
        <path d="M55 100 Q78 78 101 100 Q90 92 78 94 Q66 92 55 100" fill="#5a3a2a" />
        {/* ears */}
        <ellipse cx="48" cy="120" rx="6" ry="8" fill="#ffd2a8" />
        <ellipse cx="108" cy="120" rx="6" ry="8" fill="#ffd2a8" />
        {/* eyes */}
        <ellipse cx="66" cy="118" rx="7" ry="9" fill="#2a1a12" />
        <ellipse cx="90" cy="118" rx="7" ry="9" fill="#2a1a12" />
        <circle cx="68" cy="115" r="2.2" fill="#fff" />
        <circle cx="92" cy="115" r="2.2" fill="#fff" />
        {/* blush */}
        <ellipse cx="56" cy="130" rx="6" ry="3.5" fill="#ffb6c1" opacity="0.7" />
        <ellipse cx="100" cy="130" rx="6" ry="3.5" fill="#ffb6c1" opacity="0.7" />
        {/* smile */}
        <path d="M70 136 Q78 142 86 136" fill="none" stroke="#c45c4a" strokeWidth="2" strokeLinecap="round" />
        {/* arms reaching up to giant bottle */}
        <path d="M55 168 Q40 140 70 95" fill="none" stroke="#ffe4c4" strokeWidth="10" strokeLinecap="round" />
        <path d="M101 168 Q130 145 155 100" fill="none" stroke="#ffe4c4" strokeWidth="10" strokeLinecap="round" />
        {/* hands */}
        <circle cx="70" cy="95" r="8" fill="#ffe4c4" />
        <circle cx="155" cy="100" r="8" fill="#ffe4c4" />
        {/* tiny legs */}
        <path d="M65 208 Q62 235 58 238" fill="none" stroke="#ffe4c4" strokeWidth="9" strokeLinecap="round" />
        <path d="M91 208 Q94 235 98 238" fill="none" stroke="#ffe4c4" strokeWidth="9" strokeLinecap="round" />

        {/* ——— GIANT bottle (~3× baby height) ——— */}
        {/* nipple */}
        <ellipse cx="204" cy="28" rx="14" ry="10" fill="#f2a7b8" />
        <rect x="194" y="28" width="20" height="14" rx="4" fill="#f2a7b8" />
        {/* ring */}
        <rect x="178" y="40" width="52" height="14" rx="5" fill="#4ea1d9" />
        {/* bottle outline */}
        <rect x="168" y="48" width="72" height="162" rx="18" fill="#e8f6ff" stroke="#7eb6d9" strokeWidth="3" opacity="0.55" />
        {/* milk fill (clipped) */}
        <g clipPath="url(#bottle-clip)">
          {pct > 0.001 && (
            <>
              <rect x="168" y={milkTop} width="72" height={milkHeight} fill="url(#milk-grad)" />
              {/* milk surface wobble */}
              <ellipse cx="204" cy={milkTop} rx="34" ry="5" fill="#fffef8" opacity="0.85" />
            </>
          )}
        </g>
        {/* bottle shine */}
        <path d="M178 60 Q182 130 178 190" fill="none" stroke="#fff" strokeWidth="4" opacity="0.45" strokeLinecap="round" />
        {/* ounce marks */}
        {[0.25, 0.5, 0.75].map((m) => {
          const y = 210 - (210 - 48) * m;
          return <line key={m} x1="230" y1={y} x2="238" y2={y} stroke="#7eb6d9" strokeWidth="2" />;
        })}
      </svg>
      <figcaption className="milk-buddy-caption">
        <strong>{Math.round(pct * 100)}% full</strong>
        <span>{label}</span>
        {ozHint ? <span className="milk-buddy-oz">{ozHint}</span> : null}
      </figcaption>
    </figure>
  );
}
