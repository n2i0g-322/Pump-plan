import { DAILY_CLOCK } from "../data/plan";
import type { SupplyPlan } from "../lib/supplyDemand";

type Props = {
  plan: SupplyPlan;
  pumpedOz: number;
  fedOz: number;
  freezerBankOz: number;
  onPumpedOz: (v: number) => void;
  onFedOz: (v: number) => void;
  onFreezerBankOz: (v: number) => void;
};

function modeLabel(mode: SupplyPlan["mode"]): string {
  if (mode === "surplus") return "surplus";
  if (mode === "deficit") return "deficit";
  return "steady";
}

function pumpTimeLabel(id: string): string {
  return (
    DAILY_CLOCK.find((s) => s.id === id)?.label.replace(/^Pump\s+/i, "") ??
    id.replace("pump-", "")
  );
}

export function SupplyDemandCard({
  plan,
  pumpedOz,
  fedOz,
  freezerBankOz,
  onPumpedOz,
  onFedOz,
  onFreezerBankOz,
}: Props) {
  const todayTimes = plan.activePumpIds
    .slice()
    .sort((a, b) => {
      const sa = DAILY_CLOCK.find((s) => s.id === a)?.startMin ?? 0;
      const sb = DAILY_CLOCK.find((s) => s.id === b)?.startMin ?? 0;
      return sa - sb;
    })
    .map(pumpTimeLabel);

  return (
    <aside className="supply-card" aria-label="Supply and demand pump plan">
      <div className="supply-head">
        <h3>Supply &amp; demand pump plan</h3>
        <span className={`supply-badge supply-badge-${plan.mode}`}>{modeLabel(plan.mode)}</span>
      </div>

      <p className="supply-goal">
        Daily goal <strong>{plan.demandOz} oz</strong>
        <span className="supply-goal-sub"> · {plan.goalLabel}</span>
      </p>

      <div className="supply-nums" role="group" aria-label="Today&apos;s pump targets">
        <div className="supply-num">
          <strong>{plan.sessions}</strong>
          <span>sessions</span>
        </div>
        <div className="supply-num">
          <strong>
            {plan.ozPerSession} oz
            <em> ({plan.ozPerSessionMl} ml)</em>
          </strong>
          <span>per session</span>
        </div>
        <div className="supply-num">
          <strong>~{plan.intervalHours} h</strong>
          <span>interval</span>
        </div>
      </div>

      {plan.scheduleNote ? <p className="supply-schedule-note">{plan.scheduleNote}</p> : null}

      {todayTimes.length > 0 ? (
        <div className="supply-schedule">
          <h4>Today&apos;s pump times</h4>
          <ul className="supply-schedule-list">
            {todayTimes.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="supply-break">{plan.breakRule}</p>

      {plan.restWindows.length > 0 ? (
        <div className="supply-rest">
          <h4>Rest windows</h4>
          <ul>
            {plan.restWindows.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="supply-tips">
        {plan.tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <div className="supply-inputs">
        <label>
          Pumped today (oz)
          <input
            type="number"
            min={0}
            step={0.5}
            inputMode="decimal"
            value={pumpedOz || ""}
            placeholder="0"
            onChange={(e) => onPumpedOz(Number(e.target.value))}
          />
        </label>
        <label>
          Baby drank today (oz)
          <input
            type="number"
            min={0}
            step={0.5}
            inputMode="decimal"
            value={fedOz || ""}
            placeholder="0"
            onChange={(e) => onFedOz(Number(e.target.value))}
          />
        </label>
        <label>
          Freezer bank (oz)
          <input
            type="number"
            min={0}
            step={0.5}
            inputMode="decimal"
            value={freezerBankOz || ""}
            placeholder="0"
            onChange={(e) => onFreezerBankOz(Number(e.target.value))}
          />
        </label>
      </div>

      <p className="supply-disclaimer">
        Not medical advice. Hospital / NICU feeding plans win over this chart.
      </p>
    </aside>
  );
}
