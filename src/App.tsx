import { useMemo, useState } from "react";
import { Clock24 } from "./components/Clock24";
import {
  DAYS,
  MONTHS,
  NON_NEGOTIABLES,
  PUMP_IDS,
  YEARS,
  type DayPlan,
} from "./data/plan";
import { NutrientBubbles } from "./components/NutrientBubbles";
import { useLogs, type DayLog } from "./hooks/useLogs";
import "./App.css";

type Mode = "day" | "best";

export default function App() {
  const now = new Date();
  const defaultYear = YEARS.includes(now.getFullYear()) ? now.getFullYear() : 2026;
  const [year, setYear] = useState(defaultYear);
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const weekday = now.getDay();
  const defaultDay = DAYS[weekday === 0 ? 6 : weekday - 1].id;
  const [dayId, setDayId] = useState(defaultDay);
  const [mode, setMode] = useState<Mode>("day");

  const { getLog, togglePump, toggleMeal, setNote, setNutrient, scoreDay, bestInMonth } = useLogs();
  const day = useMemo(() => DAYS.find((d) => d.id === dayId) ?? DAYS[0], [dayId]);
  const log = getLog(year, monthIndex, day.id);
  const score = scoreDay(log);
  const best = bestInMonth(year, monthIndex);

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="eyebrow">Pumping & eating week · same 24-hour clock</p>
          <h1>Pump Plan</h1>
        </div>
        <p className="disclaimer">Not medical advice. General household guide.</p>
      </header>

      <nav className="tabs" aria-label="Year">
        {YEARS.map((y) => (
          <button key={y} type="button" className={y === year ? "tab active" : "tab"} onClick={() => setYear(y)}>
            {y}
          </button>
        ))}
      </nav>

      <nav className="tabs" aria-label="Month">
        {MONTHS.map((m, i) => (
          <button
            key={m}
            type="button"
            className={i === monthIndex ? "tab active" : "tab"}
            onClick={() => setMonthIndex(i)}
          >
            {m.slice(0, 3)}
          </button>
        ))}
      </nav>

      <nav className="tabs day-tabs" aria-label="Day and Best Day">
        <div className="day-row">
          {DAYS.map((d) => (
            <button
              key={d.id}
              type="button"
              className={mode === "day" && d.id === dayId ? "tab active" : "tab"}
              onClick={() => {
                setDayId(d.id);
                setMode("day");
              }}
            >
              {d.short}
            </button>
          ))}
        </div>
        <button type="button" className={mode === "best" ? "tab best active" : "tab best"} onClick={() => setMode("best")}>
          ★ Best Day
        </button>
      </nav>

      {mode === "day" ? (
        <DayView
          day={day}
          log={log}
          score={score}
          onTogglePump={(id) => togglePump(year, monthIndex, day.id, id)}
          onToggleMeal={(id) => toggleMeal(year, monthIndex, day.id, id)}
          onNote={(id, note) => setNote(year, monthIndex, day.id, id, note)}
          onNutrient={(id, value) => setNutrient(year, monthIndex, day.id, id, value)}
        />
      ) : (
        <BestDayView
          year={year}
          monthName={MONTHS[monthIndex]}
          monthIndex={monthIndex}
          best={best}
          getLog={getLog}
          onOpenDay={(id) => {
            setDayId(id);
            setMode("day");
          }}
        />
      )}

      <footer className="foot">
        <p>Same clock every day. Only the food in the gold slices changes.</p>
        <p className="fine">Milk supply follows emptying; food and fluid keep the parent going.</p>
      </footer>
    </div>
  );
}

function DayView({
  day,
  log,
  score,
  onTogglePump,
  onToggleMeal,
  onNote,
  onNutrient,
}: {
  day: DayPlan;
  log: DayLog;
  score: ReturnType<ReturnType<typeof useLogs>["scoreDay"]>;
  onTogglePump: (id: string) => void;
  onToggleMeal: (id: string) => void;
  onNote: (id: string, note: string) => void;
  onNutrient: (id: string, value: number) => void;
}) {
  return (
    <main className="main">
      <section className="clock-panel">
        <h2>Daily pumping & eating clock</h2>
        <Clock24 nutrients={log.nutrients} />
        <ul className="legend">
          <li><span className="swatch pump" /> Pump</li>
          <li><span className="swatch eat" /> Eat / snack</li>
          <li><span className="swatch sleep" /> Sleep / night</li>
          <li><span className="swatch awake" /> Awake</li>
        </ul>
        <ul className="legend nutrient-legend" aria-label="Nutrient colors">
          <li><span className="swatch" style={{ background: "#e07a5f" }} /> Protein</li>
          <li><span className="swatch" style={{ background: "#e6b84d" }} /> Carbs</li>
          <li><span className="swatch" style={{ background: "#f0a060" }} /> Sugar</li>
          <li><span className="swatch" style={{ background: "#5b8def" }} /> Fat</li>
          <li><span className="swatch" style={{ background: "#4cb5ae" }} /> Calcium</li>
          <li><span className="swatch" style={{ background: "#6ec1e4" }} /> Fluid</li>
        </ul>
        <div className="score-chip">
          Today&apos;s set: {score.pumpHit}/{score.pumpMax} pumps · {score.mealHit}/{score.mealMax} plates
        </div>
      </section>

      <section className="detail-panel">
        <h2>
          {day.name} — {day.theme}
        </h2>
        <p className="blurb">{day.blurb}</p>

        <h3>Non-negotiables</h3>
        <ul className="nonneg">
          {NON_NEGOTIABLES.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>

        <h3>Log pumps (tap to check)</h3>
        <div className="check-grid">
          {PUMP_IDS.map((id) => (
            <button key={id} type="button" className={log.pumps[id] ? "check on" : "check"} onClick={() => onTogglePump(id)}>
              {id.replace("pump-", "")}
              {log.pumps[id] ? " ✓" : ""}
            </button>
          ))}
        </div>

        <NutrientBubbles values={log.nutrients ?? {}} onChange={onNutrient} />

        <h3>What to eat at each slot</h3>
        <table className="meal-table">
          <thead>
            <tr>
              <th>Done</th>
              <th>Slot</th>
              <th>Eat this · log what you actually had</th>
            </tr>
          </thead>
          <tbody>
            {day.meals.map((m) => (
              <tr key={m.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={!!log.meals[m.id]}
                    onChange={() => onToggleMeal(m.id)}
                    aria-label={`Mark ${m.label} done`}
                  />
                </td>
                <td className="slot">
                  {m.label}
                  <br />
                  <span className="time">{m.time}</span>
                </td>
                <td>
                  <div className="plan-food">{m.food}</div>
                  <input
                    className="note"
                    placeholder="What I actually ate…"
                    value={log.notes[m.id] ?? ""}
                    onChange={(e) => onNote(m.id, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function BestDayView({
  year,
  monthName,
  monthIndex,
  best,
  getLog,
  onOpenDay,
}: {
  year: number;
  monthName: string;
  monthIndex: number;
  best: ReturnType<ReturnType<typeof useLogs>["bestInMonth"]>;
  getLog: ReturnType<typeof useLogs>["getLog"];
  onOpenDay: (id: string) => void;
}) {
  if (!best) {
    return (
      <main className="main best-empty">
        <section className="detail-panel wide">
          <h2>
            ★ Best Day — {monthName} {year}
          </h2>
          <p className="blurb">
            No logged sets yet. Open a day tab, check off pumps and plates, and your best day will show up here — same
            energy as a best set on the rack.
          </p>
        </section>
      </main>
    );
  }

  const day = DAYS.find((d) => d.id === best.dayId)!;
  const log = getLog(year, monthIndex, best.dayId);

  return (
    <main className="main">
      <section className="detail-panel wide pr-card">
        <p className="eyebrow">Personal record · this month</p>
        <h2>★ {best.name} — Best Day</h2>
        <p className="pr-score">
          Score {best.score} · pumps {best.pumpHit}/{best.pumpMax} · plates {best.mealHit}/{best.mealMax}
        </p>
        <p className="blurb">
          {day.theme}. {day.blurb}
        </p>
        <button type="button" className="open-day" onClick={() => onOpenDay(best.dayId)}>
          Open {best.name}
        </button>

        <h3>What was consumed & when</h3>
        <ul className="best-list">
          {day.meals.map((m) => (
            <li key={m.id} className={log.meals[m.id] ? "hit" : "miss"}>
              <strong>
                {m.label} {m.time}
              </strong>
              <span>{log.notes[m.id]?.trim() || m.food}</span>
              <em>{log.meals[m.id] ? "logged" : "planned"}</em>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
