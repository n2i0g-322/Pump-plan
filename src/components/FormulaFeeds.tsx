import type { FormulaLogEntry } from "../hooks/useLogs";
import { FORMULA_PER_OZ, formulaMacrosForOz } from "../lib/formula";
import { ozToMl, round1 } from "../lib/units";

type Props = {
  formulaLogs: Record<string, FormulaLogEntry>;
  formulaOz: number;
  onAdd: () => void;
  onChange: (id: string, entry: FormulaLogEntry) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
};

export function FormulaFeeds({
  formulaLogs,
  formulaOz,
  onAdd,
  onChange,
  onRemove,
  onToggle,
}: Props) {
  const entries = Object.entries(formulaLogs);
  const macros = formulaMacrosForOz(formulaOz);

  return (
    <section className="formula-section" aria-label="Formula feeds">
      <div className="formula-head">
        <h3>Formula feeds</h3>
        <button type="button" className="formula-add" onClick={onAdd}>
          + Add feed
        </button>
      </div>
      <p className="formula-hint">
        Approx {FORMULA_PER_OZ.calories} kcal / oz prepared formula (typical averages — not
        brand-specific). Macros fold into today&apos;s nutrient scoreboard.
      </p>
      {entries.length === 0 ? (
        <p className="formula-empty">No formula logged yet. Tap Add feed.</p>
      ) : (
        <ul className="formula-list">
          {entries.map(([id, entry]) => {
            const on = !!entry.done;
            return (
              <li key={id} className={on ? "formula-row on" : "formula-row"}>
                <button
                  type="button"
                  className={on ? "check on" : "check"}
                  onClick={() => onToggle(id)}
                >
                  {(entry.label || "Feed") + (on ? " ✓" : "")}
                </button>
                <label className="formula-time">
                  <span className="sr-only">Time</span>
                  <input
                    type="time"
                    value={entry.time ?? ""}
                    onChange={(e) => onChange(id, { ...entry, time: e.target.value })}
                  />
                </label>
                <label className="pump-oz-field">
                  <span className="sr-only">Ounces</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    inputMode="decimal"
                    value={entry.oz || ""}
                    placeholder="4"
                    onChange={(e) => onChange(id, { ...entry, oz: Number(e.target.value) })}
                  />
                  <span className="pump-oz-ml">{ozToMl(entry.oz || 0)} ml</span>
                </label>
                <button
                  type="button"
                  className="formula-remove"
                  onClick={() => onRemove(id)}
                  aria-label="Remove formula feed"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="formula-total">
        <strong>
          {round1(formulaOz)} oz · {ozToMl(formulaOz)} ml
        </strong>
        <span>
          ≈ {macros.calories} kcal · P {macros.protein}g · C {macros.carbs}g · F {macros.fat}g
        </span>
      </div>
    </section>
  );
}
