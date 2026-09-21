import { TIP_SOURCE, tipsForDay, type PumpTip } from "../data/pumpTips";

function kindClass(kind: PumpTip["kind"]): string {
  return `tips-kind tips-kind-${kind}`;
}

export function MotivationTipsCard() {
  const { motivation, tips } = tipsForDay();

  return (
    <aside className="tips-card" aria-label="Daily pump motivation and tips">
      <div className="tips-head">
        <h3>Today&apos;s pump notes</h3>
        <span className="tips-source">{TIP_SOURCE}</span>
      </div>

      <blockquote className="tips-motivation">
        <span className={kindClass("motivation")}>motivation</span>
        <p>{motivation.text}</p>
      </blockquote>

      <ul className="tips-list">
        {tips.map((t) => (
          <li key={t.id}>
            <span className={kindClass(t.kind)}>{t.kind}</span>
            <span>{t.text}</span>
          </li>
        ))}
      </ul>

      <p className="tips-disclaimer">
        Paraphrased general tips — not medical advice. Your hospital / lactation plan wins.
      </p>
    </aside>
  );
}
