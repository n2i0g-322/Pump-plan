import { useEffect, useMemo, useState } from "react";
import { Clock24 } from "./components/Clock24";
import { MilkBottleBuddy } from "./components/MilkBottleBuddy";
import { SupplyDemandCard } from "./components/SupplyDemandCard";
import { MotivationTipsCard } from "./components/MotivationTipsCard";
import {
  DAYS,
  DAILY_CLOCK,
  MONTHS,
  NON_NEGOTIABLES,
  PUMP_IDS,
  YEARS,
  babyAgeDays,
  babyFeedStageForAge,
  type DayPlan,
} from "./data/plan";
import { MealFoodLog } from "./components/MealFoodLog";
import { NutrientBubbles } from "./components/NutrientBubbles";
import { useLogs, type DayLog } from "./hooks/useLogs";
import { planSupplyDemand } from "./lib/supplyDemand";
import { ozToMl } from "./lib/units";
import type { MacroSet } from "./lib/nutrition";
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

  const {
    getLog,
    togglePump,
    setPumpOz,
    toggleMeal,
    setNote,
    setNutrient,
    setFoodLog,
    applyFoodMacros,
    setPumpedOz,
    setFedOz,
    setFreezerBankOz,
    ensureDaySeeded,
    scoreDay,
    bestInMonth,
  } = useLogs();

  const day = useMemo(() => DAYS.find((d) => d.id === dayId) ?? DAYS[0], [dayId]);

  useEffect(() => {
    if (mode === "day") ensureDaySeeded(year, monthIndex, day.id);
  }, [mode, year, monthIndex, day.id, ensureDaySeeded]);

  const log = getLog(year, monthIndex, day.id);
  const babyDays = babyAgeDays();
  const babyStage = babyFeedStageForAge(babyDays);
  const supplyPlan = useMemo(
    () =>
      planSupplyDemand({
        stage: babyStage,
        pumpedOzToday: log.pumpedOz ?? 0,
        fedOzToday: log.fedOz ?? 0,
        freezerBankOz: log.freezerBankOz ?? 0,
        pumpIds: PUMP_IDS,
      }),
    [babyStage, log.pumpedOz, log.fedOz, log.freezerBankOz],
  );
  const score = scoreDay(log, supplyPlan.activePumpIds);
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
          supplyPlan={supplyPlan}
          babyDays={babyDays}
          babyStage={babyStage}
          onTogglePump={(id) => togglePump(year, monthIndex, day.id, id, supplyPlan.ozPerSession)}
          onPumpOz={(id, oz) => setPumpOz(year, monthIndex, day.id, id, oz)}
          onToggleMeal={(id) => toggleMeal(year, monthIndex, day.id, id)}
          onNote={(id, note) => setNote(year, monthIndex, day.id, id, note)}
          onNutrient={(id, value) => setNutrient(year, monthIndex, day.id, id, value)}
          onFoodLog={(id, entry) => setFoodLog(year, monthIndex, day.id, id, entry)}
          onApplyFood={(id, macros) => applyFoodMacros(year, monthIndex, day.id, id, macros)}
          onPumpedOz={(v) => setPumpedOz(year, monthIndex, day.id, v)}
          onFedOz={(v) => setFedOz(year, monthIndex, day.id, v)}
          onFreezerBankOz={(v) => setFreezerBankOz(year, monthIndex, day.id, v)}
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
  supplyPlan,
  babyDays,
  babyStage,
  onTogglePump,
  onPumpOz,
  onToggleMeal,
  onNote,
  onNutrient,
  onFoodLog,
  onApplyFood,
  onPumpedOz,
  onFedOz,
  onFreezerBankOz,
}: {
  day: DayPlan;
  log: DayLog;
  score: ReturnType<ReturnType<typeof useLogs>["scoreDay"]>;
  supplyPlan: ReturnType<typeof planSupplyDemand>;
  babyDays: number;
  babyStage: ReturnType<typeof babyFeedStageForAge>;
  onTogglePump: (id: string) => void;
  onPumpOz: (id: string, oz: number) => void;
  onToggleMeal: (id: string) => void;
  onNote: (id: string, note: string) => void;
  onNutrient: (id: string, value: number) => void;
  onFoodLog: (id: string, entry: NonNullable<DayLog["foodLogs"][string]>) => void;
  onApplyFood: (id: string, macros: MacroSet) => void;
  onPumpedOz: (v: number) => void;
  onFedOz: (v: number) => void;
  onFreezerBankOz: (v: number) => void;
}) {
  const bottleFill =
    log.pumpedOz > 0 && supplyPlan.demandOz > 0
      ? Math.min(1, log.pumpedOz / supplyPlan.demandOz)
      : score.pumpMax
        ? score.pumpHit / score.pumpMax
        : 0;
  const bottleLabel =
    log.pumpedOz > 0
      ? `${log.pumpedOz} / ${supplyPlan.demandOz} oz pumped`
      : `${score.pumpHit} / ${score.pumpMax} pumps today`;

  const completedPumpIds = supplyPlan.activePumpIds.filter((id) => log.pumps[id]);
  const milkFill01 =
    supplyPlan.demandOz > 0 ? Math.min(1, Math.max(0, log.pumpedOz / supplyPlan.demandOz)) : 0;

  return (
    <main className="main">
      <section className="clock-panel">
        <h2>Daily pumping & eating clock</h2>
        <Clock24
          nutrients={log.nutrients}
          clock={supplyPlan.adaptiveClock}
          activePumpIds={supplyPlan.activePumpIds}
          completedPumpIds={completedPumpIds}
          milkFill01={milkFill01}
        />
        <ul className="legend">
          <li><span className="swatch pump" /> Pump</li>
          <li><span className="swatch rest" /> Rest</li>
          <li><span className="swatch done" /> Done (green)</li>
          <li><span className="swatch milk" /> Milk progress</li>
          <li><span className="swatch eat" /> Eat / snack</li>
          <li><span className="swatch sleep" /> Sleep / night</li>
          <li><span className="swatch awake" /> Awake</li>
        </ul>
        <ul className="legend nutrient-legend" aria-label="Nutrient colors">
          <li><span className="swatch" style={{ background: "#6d5efc" }} /> Calories</li>
          <li><span className="swatch" style={{ background: "#e85d04" }} /> Protein</li>
          <li><span className="swatch" style={{ background: "#f4c430" }} /> Carbs</li>
          <li><span className="swatch" style={{ background: "#d81173" }} /> Sugar</li>
          <li><span className="swatch" style={{ background: "#1d6fd8" }} /> Fat</li>
          <li><span className="swatch" style={{ background: "#0a9b6e" }} /> Calcium</li>
          <li><span className="swatch" style={{ background: "#00b4d8" }} /> Fluid</li>
        </ul>
        <p className="clock-ring-hint">
          Inner ring = daily goal · middle = 24h clock (pump / rest) · outer = nutrients · gold arc = milk progress
        </p>
        <div className="score-chip">
          Today&apos;s set: {score.pumpHit}/{score.pumpMax} pumps · every ~{supplyPlan.intervalHours} h · {score.mealHit}/{score.mealMax} plates
        </div>
        <MilkBottleBuddy
          fill={bottleFill}
          label={bottleLabel}
          ozHint={`${supplyPlan.ozPerSession} oz × ${supplyPlan.sessions} · every ~${supplyPlan.intervalHours} h`}
        />
        <aside className="baby-feed-card">
          <h3>Baby milk guide</h3>
          <p className="baby-feed-age">
            Born Sep 13, 2026 · day {babyDays} · <strong>{babyStage.label}</strong>
          </p>
          <ul>
            <li>About <strong>{babyStage.ozPerFeed}</strong> per feed</li>
            <li><strong>{babyStage.feedsPerDay}</strong> feeds / day (every ~{supplyPlan.intervalHours} h · stage {babyStage.interval})</li>
            <li>{babyStage.notes}</li>
          </ul>
          <p className="baby-feed-disclaimer">
            General chart from Parents.com age guide — not medical advice. Premature / NICU plans from the hospital come first.
          </p>
        </aside>
        <SupplyDemandCard
          plan={supplyPlan}
          pumpedOz={log.pumpedOz ?? 0}
          fedOz={log.fedOz ?? 0}
          freezerBankOz={log.freezerBankOz ?? 0}
          pumps={log.pumps}
          pumpOz={log.pumpOz}
          onPumpedOz={onPumpedOz}
          onFedOz={onFedOz}
          onFreezerBankOz={onFreezerBankOz}
        />
        <MotivationTipsCard />
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
        <p className="pump-plan-hint">
          Planned today: {supplyPlan.sessions} sessions · ~{supplyPlan.ozPerSession} oz each · every ~{supplyPlan.intervalHours} h
          — edit actual oz per session below.
        </p>
        <div className="check-grid">
          {supplyPlan.activePumpIds.map((id) => {
            const label =
              DAILY_CLOCK.find((s) => s.id === id)?.label.replace(/^Pump\s+/i, "") ??
              id.replace("pump-", "");
            const on = !!log.pumps[id];
            const ozVal =
              typeof log.pumpOz?.[id] === "number"
                ? log.pumpOz[id]
                : on
                  ? supplyPlan.ozPerSession
                  : 0;
            return (
              <div key={id} className={on ? "check-wrap on" : "check-wrap"}>
                <button
                  type="button"
                  className={on ? "check on" : "check"}
                  onClick={() => onTogglePump(id)}
                >
                  <span className="check-main">
                    {label}
                    {on ? " ✓" : ""}
                  </span>
                  <span className="check-sub">plan ~{supplyPlan.ozPerSession} oz</span>
                </button>
                <label className="pump-oz-field">
                  <span className="sr-only">Ounces for {label}</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    inputMode="decimal"
                    value={ozVal || ""}
                    placeholder={String(supplyPlan.ozPerSession)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onPumpOz(id, Number(e.target.value))}
                    aria-label={`Actual ounces for ${label}`}
                  />
                  <span className="pump-oz-ml">{ozToMl(ozVal || 0)} ml</span>
                </label>
              </div>
            );
          })}
        </div>

        <NutrientBubbles values={log.nutrients ?? {}} onChange={onNutrient} />

        <h3>What to eat at each slot</h3>
        <table className="meal-table">
          <thead>
            <tr>
              <th>Done</th>
              <th>Slot</th>
              <th>Eat this · look up serving · photos → scoreboard</th>
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
                    placeholder="Quick note (optional)…"
                    value={log.notes[m.id] ?? ""}
                    onChange={(e) => onNote(m.id, e.target.value)}
                  />
                  <MealFoodLog
                    mealId={m.id}
                    mealTitle={`${m.label} ${m.time}`}
                    entry={log.foodLogs?.[m.id]}
                    onChange={onFoodLog}
                    onApplyToScoreboard={onApplyFood}
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
          {day.meals.map((m) => {
            const food = log.foodLogs?.[m.id];
            const label =
              food?.description?.trim() ||
              log.notes[m.id]?.trim() ||
              m.food;
            return (
              <li key={m.id} className={log.meals[m.id] ? "hit" : "miss"}>
                <strong>
                  {m.label} {m.time}
                </strong>
                <span>{label}</span>
                {food?.applied && food.lastApplied && (
                  <span className="best-macros">
                    {food.lastApplied.calories} kcal · P {food.lastApplied.protein}g · C{" "}
                    {food.lastApplied.carbs}g
                  </span>
                )}
                <em>{log.meals[m.id] ? "logged" : "planned"}</em>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
