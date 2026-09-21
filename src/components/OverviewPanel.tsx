import { useMemo } from "react";
import { DAYS, NUTRIENT_COLORS, dayKey } from "../data/plan";
import type { DayLog } from "../hooks/useLogs";
import type { BabySex } from "../hooks/useSettings";
import { round1 } from "../lib/units";
import { LineChart } from "./LineChart";

type Props = {
  year: number;
  monthIndex: number;
  monthName: string;
  getLog: (year: number, monthIndex: number, dayId: string) => DayLog;
  showFormula: boolean;
  sex: BabySex;
};

const NUTRIENT_SERIES = [
  { id: "calories", label: "Calories", color: NUTRIENT_COLORS.calories },
  { id: "protein", label: "Protein", color: NUTRIENT_COLORS.protein },
  { id: "carbs", label: "Carbs", color: NUTRIENT_COLORS.carbs },
  { id: "sugar", label: "Sugar", color: NUTRIENT_COLORS.sugar },
  { id: "fat", label: "Fat", color: NUTRIENT_COLORS.fat },
  { id: "calcium", label: "Calcium", color: NUTRIENT_COLORS.calcium },
  { id: "fluid", label: "Fluid", color: NUTRIENT_COLORS.fluid },
];

export function OverviewPanel({ year, monthIndex, monthName, getLog, showFormula, sex }: Props) {
  const days = useMemo(() => {
    return DAYS.map((d) => {
      const log = getLog(year, monthIndex, d.id);
      const pumpsDone = Object.values(log.pumps).filter(Boolean).length;
      return {
        id: d.id,
        short: d.short,
        pumped: log.pumpedOz ?? 0,
        fed: log.fedOz ?? 0,
        freezer: log.freezerBankOz ?? 0,
        formula: log.formulaOz ?? 0,
        pumpsDone,
        nutrients: log.nutrients ?? {},
        key: dayKey(year, monthIndex, d.id),
      };
    });
  }, [year, monthIndex, getLog]);

  const labels = days.map((d) => d.short);

  const milkSeries = useMemo(() => {
    const series = [
      { id: "pumped", label: "Pumped", color: "#ff4d8d", values: days.map((d) => d.pumped) },
      { id: "fed", label: "Baby drank", color: "#3b82f6", values: days.map((d) => d.fed) },
      { id: "freezer", label: "Frozen surplus", color: "#f8fafc", values: days.map((d) => d.freezer) },
    ];
    if (showFormula) {
      series.push({
        id: "formula",
        label: "Formula",
        color: "#fbbf24",
        values: days.map((d) => d.formula),
      });
    }
    return series;
  }, [days, showFormula]);

  const nutrientSeries = useMemo(
    () =>
      NUTRIENT_SERIES.map((n) => ({
        id: n.id,
        label: n.label,
        color: n.color,
        values: days.map((d) => {
          const v = d.nutrients[n.id];
          return typeof v === "number" && Number.isFinite(v) ? v : 0;
        }),
      })),
    [days],
  );

  const strip = useMemo(() => {
    const totPumped = round1(days.reduce((s, d) => s + d.pumped, 0));
    const totFed = round1(days.reduce((s, d) => s + d.fed, 0));
    const totFormula = round1(days.reduce((s, d) => s + d.formula, 0));
    const totPumps = days.reduce((s, d) => s + d.pumpsDone, 0);
    const lastFreezer = days[days.length - 1]?.freezer ?? 0;
    const daysWithData = days.filter(
      (d) => d.pumped > 0 || d.fed > 0 || d.formula > 0 || d.pumpsDone > 0,
    ).length;
    return { totPumped, totFed, totFormula, totPumps, lastFreezer, daysWithData };
  }, [days]);

  return (
    <section className={`overview-panel overview-sex-${sex}`} aria-label="Month overview">
      <header className="overview-head">
        <h2>Overview</h2>
        <p className="overview-sub">
          {monthName} {year} · weekday logs for this month view
        </p>
      </header>

      <div className="overview-strip" role="group" aria-label="Range totals">
        <div className="overview-stat">
          <strong>{strip.totPumped}</strong>
          <span>oz pumped</span>
        </div>
        <div className="overview-stat">
          <strong>{strip.totFed}</strong>
          <span>oz breast fed</span>
        </div>
        {showFormula ? (
          <div className="overview-stat">
            <strong>{strip.totFormula}</strong>
            <span>oz formula</span>
          </div>
        ) : null}
        <div className="overview-stat">
          <strong>{round1(strip.lastFreezer)}</strong>
          <span>oz freezer (latest)</span>
        </div>
        <div className="overview-stat">
          <strong>{strip.totPumps}</strong>
          <span>pumps completed</span>
        </div>
        <div className="overview-stat">
          <strong>{strip.daysWithData}/7</strong>
          <span>days with data</span>
        </div>
      </div>

      <div className="overview-charts">
        <div className="overview-chart-block">
          <h3>Milk / bank</h3>
          <LineChart
            labels={labels}
            series={milkSeries}
            ariaLabel="Pumped, baby drank, freezer, and formula over the week"
          />
        </div>
        <div className="overview-chart-block">
          <h3>Nutrition</h3>
          <LineChart
            labels={labels}
            series={nutrientSeries}
            height={200}
            ariaLabel="Daily nutrient totals over the week"
          />
        </div>
      </div>
    </section>
  );
}
