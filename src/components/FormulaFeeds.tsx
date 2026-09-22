import type { FormulaLogEntry } from "../hooks/useLogs";
import { FORMULA_PER_OZ, formulaMacrosForOz } from "../lib/formula";
import { formatOzTotal, round1 } from "../lib/units";
import { VolumeFields } from "./VolumeFields";

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
        brand-specific). Macros fold into today&apos;s nutrient scoreboard. Enter oz or ml per
        feed.
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
                <VolumeFields
                  mode="oz"
                  compact
                  hideTotal
                  label={`Formula ${entry.label || "feed"}`}
                  valueOz={entry.oz || 0}
                  onChangeOz={(oz) => onChange(id, { ...entry, oz })}
                  className="formula-volume"
                />
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
        <strong>{formatOzTotal(round1(formulaOz))}</strong>
        <span>
          ≈ {macros.calories} kcal · P {macros.protein}g · C {macros.carbs}g · F {macros.fat}g
        </span>
      </div>
    </section>
  );
}
