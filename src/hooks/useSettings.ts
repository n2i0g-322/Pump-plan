import { useCallback, useState } from "react";
import { BABY_BIRTHDAY } from "../data/plan";

export type FeedingMode = "breast" | "formula" | "mixed";
export type BabySex = "girl" | "boy";

export type PumpPlanSettings = {
  birthDate: string;
  feedingMode: FeedingMode;
  sex: BabySex;
};

const STORAGE = "pump-plan-settings-v1";

const DEFAULTS: PumpPlanSettings = {
  birthDate: BABY_BIRTHDAY,
  feedingMode: "breast",
  sex: "girl",
};

function load(): PumpPlanSettings {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<PumpPlanSettings>;
    const birthDate =
      typeof parsed.birthDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.birthDate)
        ? parsed.birthDate
        : DEFAULTS.birthDate;
    const feedingMode: FeedingMode =
      parsed.feedingMode === "formula" ||
      parsed.feedingMode === "mixed" ||
      parsed.feedingMode === "breast"
        ? parsed.feedingMode
        : DEFAULTS.feedingMode;
    const sex: BabySex = parsed.sex === "boy" || parsed.sex === "girl" ? parsed.sex : DEFAULTS.sex;
    return { birthDate, feedingMode, sex };
  } catch {
    return { ...DEFAULTS };
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<PumpPlanSettings>(() => load());

  const update = useCallback((patch: Partial<PumpPlanSettings>) => {
    setSettings((prev) => {
      const next: PumpPlanSettings = {
        birthDate:
          typeof patch.birthDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(patch.birthDate)
            ? patch.birthDate
            : prev.birthDate,
        feedingMode:
          patch.feedingMode === "formula" ||
          patch.feedingMode === "mixed" ||
          patch.feedingMode === "breast"
            ? patch.feedingMode
            : prev.feedingMode,
        sex: patch.sex === "boy" || patch.sex === "girl" ? patch.sex : prev.sex,
      };
      localStorage.setItem(STORAGE, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, update };
}
