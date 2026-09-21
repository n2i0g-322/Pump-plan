/** User baby art + kawaii bottle; milk fill = logged pumps / daily target. */

type Props = {
  /** 0–1 fill fraction (already capped) */
  fill: number;
  /** e.g. "4 / 10 pumps" */
  label: string;
  /** Target ounces tip from age chart */
  ozHint?: string;
};

const BASE = import.meta.env.BASE_URL;

export function MilkBottleBuddy({ fill, label, ozHint }: Props) {
  const pct = Math.max(0, Math.min(1, fill));
  const fillPct = `${Math.round(pct * 100)}%`;

  return (
    <figure
      className="milk-buddy"
      aria-label={`Milk bottle ${Math.round(pct * 100)} percent full. ${label}`}
    >
      <div className="milk-buddy-scene">
        <img
          className="milk-buddy-baby"
          src={`${BASE}milk-buddy/baby.png`}
          alt=""
          width={180}
          height={315}
          decoding="async"
        />
        <div className="milk-buddy-bottle-wrap" aria-hidden="true">
          <div className="milk-buddy-fill" style={{ height: fillPct }} />
          <img
            className="milk-buddy-bottle"
            src={`${BASE}milk-buddy/bottle.png`}
            alt=""
            width={200}
            height={286}
            decoding="async"
          />
        </div>
      </div>
      <figcaption className="milk-buddy-caption">
        <strong>{Math.round(pct * 100)}% full</strong>
        <span>{label}</span>
        {ozHint ? <span className="milk-buddy-oz">{ozHint}</span> : null}
      </figcaption>
    </figure>
  );
}
