import {
  NUTRIENT_GROUPS,
  groupTarget,
  nutrientColor,
  type NutrientGroup,
} from "../data/plan";

type Props = {
  values: Record<string, number>;
  onChange: (id: string, value: number) => void;
};

function pct(have: number, need: number) {
  if (need <= 0) return 0;
  return Math.min(100, Math.round((have / need) * 100));
}

function leafValue(values: Record<string, number>, id: string) {
  const n = values[id];
  return Number.isFinite(n) ? n : 0;
}

function groupLogged(g: NutrientGroup, values: Record<string, number>) {
  if (g.children?.length) {
    return g.children.reduce((s, c) => s + leafValue(values, c.id), 0);
  }
  return leafValue(values, g.id);
}

export function NutrientBubbles({ values, onChange }: Props) {
  return (
    <section className="nutrient-section" aria-label="Daily nutrition targets">
      <h3>Daily nutrition targets</h3>
      <p className="nutrient-hint">
        Required targets for the day. Tap a number to log what you ate — progress updates against the goal.
      </p>
      <div className="nutrient-grid">
        {NUTRIENT_GROUPS.map((g) => {
          const need = groupTarget(g);
          const have = groupLogged(g, values);
          const p = pct(have, need);
          const done = have >= need && need > 0;

          return (
            <article key={g.id} className={done ? "nutrient-bubble done" : "nutrient-bubble"} style={{ borderColor: nutrientColor(g.children?.[0]?.id ?? g.id) }}>
              <header className="nb-head">
                <h4>{g.label}</h4>
                <span className="nb-total">
                  {have}
                  <small>
                    / {need} {g.unit}
                  </small>
                </span>
              </header>
              <div className="nb-bar" aria-hidden>
                <div className="nb-fill" style={{ width: `${p}%`, background: nutrientColor(g.children?.[0]?.id ?? g.id) }} />
              </div>
              <p className="nb-pct">{p}% of target</p>

              {g.children?.length ? (
                <div className="nb-children">
                  {g.children.map((c) => {
                    const cv = leafValue(values, c.id);
                    const cp = pct(cv, c.target);
                    return (
                      <label key={c.id} className="nb-row">
                        <span className="nb-label">
                          {c.label}
                          <em>
                            goal {c.target} {c.unit}
                          </em>
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          value={Number.isFinite(values[c.id]) ? values[c.id] : ""}
                          placeholder="0"
                          onChange={(e) => {
                            const raw = e.target.value;
                            onChange(c.id, raw === "" ? 0 : Number(raw));
                          }}
                          aria-label={`${c.label} logged ${c.unit}`}
                        />
                        <span className="nb-mini">{cp}%</span>
                      </label>
                    );
                  })}
                  <p className="nb-roll">
                    Box total = carbs + sugar → <strong>{have}</strong> / {need} {g.unit}
                  </p>
                </div>
              ) : (
                <label className="nb-row solo">
                  <span className="nb-label">Logged today</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    value={Number.isFinite(values[g.id]) ? values[g.id] : ""}
                    placeholder="0"
                    onChange={(e) => {
                      const raw = e.target.value;
                      onChange(g.id, raw === "" ? 0 : Number(raw));
                    }}
                    aria-label={`${g.label} logged ${g.unit}`}
                  />
                </label>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
