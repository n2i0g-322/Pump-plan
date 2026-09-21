import { babyAgeDays, babyFeedStageForAge } from "../data/plan";
import type { BabySex, FeedingMode, PumpPlanSettings } from "../hooks/useSettings";

type Props = {
  settings: PumpPlanSettings;
  onChange: (patch: Partial<PumpPlanSettings>) => void;
};

function formatBirthLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function BabyProfileView({ settings, onChange }: Props) {
  const days = babyAgeDays(new Date(), settings.birthDate);
  const stage = babyFeedStageForAge(days);
  const theme = settings.sex === "boy" ? "boy" : "girl";

  return (
    <main className="main baby-main">
      <section className={`baby-profile-page baby-theme-${theme}`} aria-label="Baby profile">
        <p className="eyebrow">Settings · this device</p>
        <h2>Baby profile</h2>
        <p className="baby-profile-age-line">
          Born {formatBirthLabel(settings.birthDate)} · day {days} · <strong>{stage.label}</strong>
        </p>

        <div className="baby-profile-fields">
          <label>
            Birth date
            <input
              type="date"
              value={settings.birthDate}
              onChange={(e) => onChange({ birthDate: e.target.value })}
            />
          </label>

          <fieldset className="baby-sex-fieldset">
            <legend>Sex</legend>
            <div className="baby-sex-row">
              <button
                type="button"
                className={settings.sex === "girl" ? "sex-chip girl active" : "sex-chip girl"}
                onClick={() => onChange({ sex: "girl" as BabySex })}
              >
                Girl
              </button>
              <button
                type="button"
                className={settings.sex === "boy" ? "sex-chip boy active" : "sex-chip boy"}
                onClick={() => onChange({ sex: "boy" as BabySex })}
              >
                Boy
              </button>
            </div>
          </fieldset>

          <label>
            Feeding mode
            <select
              value={settings.feedingMode}
              onChange={(e) => onChange({ feedingMode: e.target.value as FeedingMode })}
            >
              <option value="breast">Breast / pumped milk</option>
              <option value="formula">Formula</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>
        </div>

        <div className="baby-stage-card">
          <h3>Current stage guide</h3>
          <ul>
            <li>
              About <strong>{stage.ozPerFeed}</strong> per feed
            </li>
            <li>
              <strong>{stage.feedsPerDay}</strong> feeds / day · {stage.interval}
            </li>
            <li>{stage.notes}</li>
          </ul>
          <p className="baby-feed-disclaimer">
            General chart — not medical advice. Hospital / NICU plans come first. Changing birth date
            updates age stage and the daily pump plan.
          </p>
        </div>
      </section>
    </main>
  );
}
