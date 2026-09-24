import { useRef, useState } from "react";
import {
  EMPTY_MACROS,
  compressImage,
  lookupNutrition,
  scaleMacros,
  type MacroSet,
  type NutritionHit,
} from "../lib/nutrition";
import { formatMlTotal } from "../lib/units";
import { VolumeFields } from "./VolumeFields";

export type MealFoodEntry = {
  description: string;
  servingLabel: string;
  servings: number;
  macros: MacroSet;
  source?: string;
  servingPhoto?: string;
  labelPhoto?: string;
  /** Extra shots (second angle, ingredients list, etc.) */
  extraPhotos?: string[];
  applied: boolean;
  /** Last macros pushed to the day scoreboard (for replace-on-update). */
  lastApplied?: MacroSet;
};

type Props = {
  mealId: string;
  mealTitle: string;
  entry: MealFoodEntry | undefined;
  onChange: (mealId: string, entry: MealFoodEntry) => void;
  onApplyToScoreboard: (mealId: string, macros: MacroSet) => void;
};

const emptyEntry = (): MealFoodEntry => ({
  description: "",
  servingLabel: "",
  servings: 1,
  macros: { ...EMPTY_MACROS },
  extraPhotos: [],
  applied: false,
});

function macrosAreEmpty(m: MacroSet): boolean {
  return m.calories <= 0 && m.protein <= 0 && m.carbs <= 0 && m.fat <= 0;
}

export function MealFoodLog({
  mealId,
  mealTitle,
  entry,
  onChange,
  onApplyToScoreboard,
}: Props) {
  const e = entry ?? emptyEntry();
  const extras = e.extraPhotos ?? [];
  const [looking, setLooking] = useState(false);
  const [hits, setHits] = useState<NutritionHit[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [ocrOk, setOcrOk] = useState(false);
  const [plateHint, setPlateHint] = useState(false);
  const [open, setOpen] = useState(Boolean(e.description || e.applied));
  /** After a photo lands: ask if another is needed */
  const [morePhotoPrompt, setMorePhotoPrompt] = useState(false);
  /** Soft gate before scoreboard when nothing photographed yet */
  const [photoGate, setPhotoGate] = useState(false);
  const extraInputRef = useRef<HTMLInputElement>(null);

  function patch(partial: Partial<MealFoodEntry>, keepApplied = false) {
    onChange(mealId, {
      ...e,
      ...partial,
      applied: keepApplied ? e.applied : false,
    });
  }

  async function runLookup() {
    setErr(null);
    setOcrStatus(null);
    setOcrOk(false);
    setLooking(true);
    setHits([]);
    try {
      const results = await lookupNutrition(e.description);
      if (!results.length) {
        setErr(
          "No matches. Try a simpler name, or enter values from the label by hand.",
        );
      }
      setHits(results);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Lookup failed");
    } finally {
      setLooking(false);
    }
  }

  function pickHit(h: NutritionHit) {
    patch({
      description: h.brand ? `${h.name} (${h.brand})` : h.name,
      servingLabel: h.servingLabel,
      servings: 1,
      macros: h.perServing,
      source:
        h.source === "cnf"
          ? "Health Canada CNF (typical serving)"
          : "Open Food Facts (packaged fallback)",
    });
    setHits([]);
    setPlateHint(false);
    setOcrStatus(null);
    setOcrOk(false);
  }

  async function runLabelOcr(dataUrl: string, base: MealFoodEntry) {
    setErr(null);
    setOcrOk(false);
    setOcrStatus("Reading label…");
    setPlateHint(false);
    try {
      const { ocrNutritionFromImage } = await import("../lib/nutritionOcr");
      const result = await ocrNutritionFromImage(dataUrl, (s) => setOcrStatus(s));
      if (result.found) {
        onChange(mealId, {
          ...base,
          labelPhoto: dataUrl,
          macros: { ...base.macros, ...result.macros, fluid: base.macros.fluid },
          servingLabel: result.servingLabel || base.servingLabel || "1 serving (from label)",
          source: "OCR from label photo",
          applied: false,
        });
        setOcrStatus(`${result.summary} — tap Add to scoreboard below.`);
        setOcrOk(true);
        setErr(null);
      } else {
        // Keep the photo; leave macros alone
        onChange(mealId, {
          ...base,
          labelPhoto: dataUrl,
          applied: false,
        });
        setOcrStatus(
          `${result.summary} Type a food name and tap Check nutrition facts, or enter values by hand.`,
        );
        setOcrOk(false);
      }
    } catch (ex) {
      onChange(mealId, {
        ...base,
        labelPhoto: dataUrl,
        applied: false,
      });
      setOcrStatus(
        ex instanceof Error
          ? `Could not read label (${ex.message}). Enter values by hand or use text lookup.`
          : "Could not read label. Enter values by hand or use text lookup.",
      );
      setOcrOk(false);
    }
  }

  async function onPhoto(
    kind: "servingPhoto" | "labelPhoto",
    file: File | null,
  ) {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      const base: MealFoodEntry = {
        ...e,
        [kind]: dataUrl,
        applied: false,
      };
      // Show photo immediately
      onChange(mealId, base);
      setMorePhotoPrompt(true);
      setPhotoGate(false);

      if (kind === "labelPhoto") {
        await runLabelOcr(dataUrl, base);
      } else if (kind === "servingPhoto" && macrosAreEmpty(e.macros)) {
        setPlateHint(true);
        setOcrStatus(null);
        setOcrOk(false);
      }
    } catch {
      setErr("Could not save that photo.");
    }
  }

  async function onExtraPhoto(file: File | null) {
    if (!file) return;
    try {
      const dataUrl = await compressImage(file);
      patch({ extraPhotos: [...extras, dataUrl] });
      setMorePhotoPrompt(true);
      setPhotoGate(false);
    } catch {
      setErr("Could not save that photo.");
    }
  }

  function removeExtra(index: number) {
    patch({ extraPhotos: extras.filter((_, i) => i !== index) });
  }

  function commitToScoreboard() {
    const scaled = scaleMacros(e.macros, e.servings || 1);
    // Only apply once — useLogs.applyFoodMacros marks applied + lastApplied.
    // A second onChange here used to overwrite nutrients with a stale day log.
    onApplyToScoreboard(mealId, scaled);
    setPhotoGate(false);
    setMorePhotoPrompt(false);
    setOcrOk(false);
    const hasAnyPhoto = Boolean(e.servingPhoto || e.labelPhoto || extras.length);
    if (!hasAnyPhoto) {
      // Soft nudge after a successful add — never blocks the scoreboard
      setPhotoGate(true);
    }
  }

  function tryAddToScoreboard() {
    const scaled = scaleMacros(e.macros, e.servings || 1);
    if (scaled.calories <= 0 && scaled.protein <= 0 && scaled.carbs <= 0) return;
    commitToScoreboard();
  }

  const scaled = scaleMacros(e.macros, e.servings || 1);
  const canAdd =
    scaled.calories > 0 || scaled.protein > 0 || scaled.carbs > 0;

  return (
    <div className={`meal-food ${open ? "open" : ""}`}>
      <button
        type="button"
        className="meal-food-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        <span>What to eat — log &amp; nutrition</span>
        <span className="chev">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="meal-food-body">
          <p className="meal-food-hint">
            For <strong>{mealTitle}</strong>: look up a typical serving (Health Canada
            Canadian Nutrient File), snap the portion and the box label, then add macros to
            the scoreboard above. Label photos are read with on-device OCR.
          </p>

          <label className="field">
            <span>Food / drink</span>
            <input
              type="text"
              value={e.description}
              placeholder="e.g. Greek yogurt, banana, breastmilk"
              onChange={(ev) => patch({ description: ev.target.value })}
            />
          </label>

          <div className="meal-food-actions">
            <button
              type="button"
              className="btn-primary"
              disabled={looking || e.description.trim().length < 2}
              onClick={() => void runLookup()}
            >
              {looking ? "Checking…" : "Check nutrition facts"}
            </button>
          </div>

          {err && <p className="meal-food-err">{err}</p>}
          {ocrStatus && (
            <p
              className={ocrOk ? "meal-food-ocr ok" : "meal-food-ocr"}
              role="status"
              aria-live="polite"
            >
              {ocrStatus}
            </p>
          )}
          {plateHint && macrosAreEmpty(e.macros) && (
            <p className="meal-food-ocr hint" role="status">
              Plate photos alone don&apos;t set nutrition. Type a food name and tap{" "}
              <strong>Check nutrition facts</strong>, or add a{" "}
              <strong>box / label nutrition facts</strong> photo for OCR.
            </p>
          )}

          {hits.length > 0 && (
            <ul className="nutrition-hits">
              {hits.map((h) => (
                <li key={h.id}>
                  <button type="button" onClick={() => pickHit(h)}>
                    {h.imageUrl && (
                      <img src={h.imageUrl} alt="" width={40} height={40} />
                    )}
                    <span>
                      <strong>{h.name}</strong>
                      {h.brand ? ` · ${h.brand}` : ""}
                      <br />
                      <small>
                        {h.source === "cnf" ? "🇨🇦 CNF · " : "OFF · "}
                        {h.servingLabel} · {h.perServing.calories} kcal · P{" "}
                        {h.perServing.protein}g · C {h.perServing.carbs}g · F{" "}
                        {h.perServing.fat}g
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label className="field">
            <span>Serving size label</span>
            <input
              type="text"
              value={e.servingLabel}
              placeholder="e.g. 1 cup (240 g) or 1 bottle"
              onChange={(ev) => patch({ servingLabel: ev.target.value })}
            />
          </label>

          <label className="field inline">
            <span>How many of that serving?</span>
            <input
              type="number"
              min={0.25}
              step={0.25}
              value={e.servings}
              onChange={(ev) =>
                patch({ servings: Math.max(0, Number(ev.target.value) || 0) })
              }
            />
          </label>

          {e.source && (
            <p className="meal-food-source">Source: {e.source}</p>
          )}

          <div className="macro-grid">
            {(
              [
                ["calories", "kcal"],
                ["protein", "g"],
                ["carbs", "g"],
                ["sugar", "g"],
                ["fat", "g"],
                ["calcium", "mg"],
              ] as const
            ).map(([key, unit]) => (
              <label key={key} className="macro-cell">
                <span>
                  {key} ({unit})
                </span>
                <input
                  type="number"
                  min={0}
                  step={key === "calories" || key === "calcium" ? 1 : 0.1}
                  value={e.macros[key]}
                  onChange={(ev) =>
                    patch({
                      macros: {
                        ...e.macros,
                        [key]: Math.max(0, Number(ev.target.value) || 0),
                      },
                      source: e.source?.includes("manual")
                        ? e.source
                        : e.source
                          ? `${e.source} · edited`
                          : "manual / label",
                    })
                  }
                />
              </label>
            ))}
          </div>

          <div className="meal-fluid-block">
            <span className="meal-fluid-heading">Fluid / liquid (oz · ml · L)</span>
            <VolumeFields
              mode="ml"
              showLiters
              hideTotal
              label="Entry fluid"
              valueMl={e.macros.fluid || 0}
              onChangeMl={(ml) =>
                patch({
                  macros: { ...e.macros, fluid: ml },
                  source: e.source?.includes("manual")
                    ? e.source
                    : e.source
                      ? `${e.source} · edited`
                      : "manual / label",
                })
              }
              className="meal-fluid-volume"
            />
            <p className="meal-fluid-total" aria-live="polite">
              {formatMlTotal(e.macros.fluid || 0)}
            </p>
          </div>

          <div className="photo-row">
            <div className="photo-slot photo-slot-serving">
              <span className="photo-slot-title">Serving portion photo</span>
              <p className="photo-slot-hint">Camera — what&apos;s actually on the plate</p>
              {e.servingPhoto ? (
                <img src={e.servingPhoto} alt="Serving portion" />
              ) : (
                <span className="photo-placeholder">Take a photo</span>
              )}
              <label className="photo-ctrl camera-only">
                <span>Camera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(ev) => {
                    void onPhoto("servingPhoto", ev.target.files?.[0] ?? null);
                    ev.target.value = "";
                  }}
                />
              </label>
            </div>
            <div className="photo-slot photo-slot-label">
              <span className="photo-slot-title">Box / label nutrition facts</span>
              <p className="photo-slot-hint">Camera or gallery — OCR fills macros</p>
              {e.labelPhoto ? (
                <img src={e.labelPhoto} alt="Nutrition label" />
              ) : (
                <span className="photo-placeholder">Camera or upload</span>
              )}
              <div className="photo-ctrl-row">
                <label className="photo-ctrl">
                  <span>Camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(ev) => {
                      void onPhoto("labelPhoto", ev.target.files?.[0] ?? null);
                      ev.target.value = "";
                    }}
                  />
                </label>
                <label className="photo-ctrl gallery">
                  <span>Gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(ev) => {
                      void onPhoto("labelPhoto", ev.target.files?.[0] ?? null);
                      ev.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          {extras.length > 0 && (
            <div className="extra-photo-grid">
              {extras.map((src, i) => (
                <div key={`${i}-${src.slice(-24)}`} className="extra-photo">
                  <img src={src} alt={`Extra photo ${i + 1}`} />
                  <button
                    type="button"
                    className="extra-remove"
                    onClick={() => removeExtra(i)}
                    aria-label={`Remove extra photo ${i + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {morePhotoPrompt && (
            <div className="photo-prompt" role="status">
              <p>
                {!e.labelPhoto && e.servingPhoto
                  ? "Portion photo saved. If this came from a box or package, add a nutrition-facts label photo too?"
                  : !e.servingPhoto && e.labelPhoto
                    ? "Label photo saved. Want a photo of the actual serving portion as well?"
                    : "Photo saved. Need another one (second angle, ingredients list, or clearer label)?"}
              </p>
              <div className="photo-prompt-actions">
                {!e.labelPhoto && e.servingPhoto ? (
                  <div className="photo-prompt-split">
                    <label className="btn-primary as-file-btn">
                      Label camera
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(ev) => {
                          setMorePhotoPrompt(false);
                          void onPhoto("labelPhoto", ev.target.files?.[0] ?? null);
                          ev.target.value = "";
                        }}
                      />
                    </label>
                    <label className="btn-primary as-file-btn">
                      Label gallery
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(ev) => {
                          setMorePhotoPrompt(false);
                          void onPhoto("labelPhoto", ev.target.files?.[0] ?? null);
                          ev.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                ) : !e.servingPhoto && e.labelPhoto ? (
                  <label className="btn-primary as-file-btn">
                    Yes, add portion photo
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(ev) => {
                        setMorePhotoPrompt(false);
                        void onPhoto("servingPhoto", ev.target.files?.[0] ?? null);
                        ev.target.value = "";
                      }}
                    />
                  </label>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      setMorePhotoPrompt(false);
                      extraInputRef.current?.click();
                    }}
                  >
                    Yes, add another
                  </button>
                )}
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setMorePhotoPrompt(false)}
                >
                  No, that&apos;s enough
                </button>
              </div>
            </div>
          )}

          <input
            ref={extraInputRef}
            className="extra-file-input"
            type="file"
            accept="image/*"
            onChange={(ev) => {
              void onExtraPhoto(ev.target.files?.[0] ?? null);
              ev.target.value = "";
            }}
          />

          {!morePhotoPrompt && (e.servingPhoto || e.labelPhoto || extras.length > 0) && (
            <div className="add-more-photos-row">
              <button
                type="button"
                className="btn-ghost add-more-photos"
                onClick={() => extraInputRef.current?.click()}
              >
                + Add another (gallery)
              </button>
            </div>
          )}

          {photoGate && (
            <div className="photo-prompt warn" role="dialog" aria-label="Photos recommended">
              <p>
                Added to the scoreboard. Want a serving or label photo for this
                meal too?
              </p>
              <div className="photo-prompt-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setPhotoGate(false);
                    setMorePhotoPrompt(false);
                    // scroll attention stays on photo row; open camera for serving
                    const el = document.querySelector(
                      `.meal-food.open .photo-slot input`,
                    ) as HTMLInputElement | null;
                    el?.click();
                  }}
                >
                  Yes, add photos
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setPhotoGate(false)}
                >
                  No thanks
                </button>
              </div>
            </div>
          )}

          <div className="meal-food-footer">
            <p className="scaled-preview">
              This entry: <strong>{scaled.calories}</strong> kcal · P{" "}
              {scaled.protein}g · C {scaled.carbs}g (sugar {scaled.sugar}g) · F{" "}
              {scaled.fat}g
              {scaled.calcium ? ` · Ca ${scaled.calcium}mg` : ""}
              {scaled.fluid ? ` · fluid ${formatMlTotal(scaled.fluid)}` : ""}
            </p>
            <button
              type="button"
              className={`btn-primary${ocrOk && canAdd ? " pulse-hint" : ""}`}
              disabled={!canAdd}
              onClick={() => tryAddToScoreboard()}
            >
              {e.applied ? "Update scoreboard" : "Add to scoreboard"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
