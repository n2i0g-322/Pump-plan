/**
 * Per-item plate analysis UI: nutrition under name, Retest / Confirm / Manual / Label photo.
 */

import { useEffect, useRef, useState } from "react";
import {
  groceryDeepLinks,
  searchAllFoods,
  type FoodSearchHit,
} from "../lib/foodSearch";
import { compressImage, type MacroSet } from "../lib/nutrition";
import {
  itemFromFoodName,
  type PlateAnalyzeResult,
} from "../lib/plateAnalyze";
import { formatMlTotal } from "../lib/units";

export type PlateItem = {
  id: string;
  name: string;
  confidence?: number;
  macros: MacroSet;
  servingLabel?: string;
  source: "estimate" | "cnf" | "openfoodfacts" | "ocr" | "fastfood" | "manual";
  status: "pending" | "confirmed" | "excluded";
  labelPhoto?: string;
};

type Props = {
  plateItems: PlateItem[];
  analyzing: boolean;
  analyzeStatus: string | null;
  analyzeMeta: Pick<PlateAnalyzeResult, "mode" | "message" | "suggestions"> | null;
  onRetest: (itemId: string) => void;
  onConfirm: (itemId: string) => void;
  onUnconfirm: (itemId: string) => void;
  onUpdateItem: (itemId: string, patch: Partial<PlateItem>) => void;
  onAddFromSuggestion: (name: string) => void;
  onAnalyzeAgain: () => void;
  onSkipModel: () => void;
};

function compactMacros(m: MacroSet): string {
  const parts: string[] = [];
  if (m.calories > 0) parts.push(`${m.calories} kcal`);
  if (m.protein > 0) parts.push(`P ${m.protein}g`);
  if (m.carbs > 0) parts.push(`C ${m.carbs}g`);
  if (m.fat > 0) parts.push(`F ${m.fat}g`);
  if (m.sugar > 0) parts.push(`sugar ${m.sugar}g`);
  if (m.calcium > 0) parts.push(`Ca ${m.calcium}mg`);
  if (m.fluid > 0) parts.push(`fluid ${formatMlTotal(m.fluid)}`);
  return parts.length ? parts.join(" · ") : "No macros yet — Manual or label photo";
}

function sourceLabel(s: PlateItem["source"]): string {
  switch (s) {
    case "cnf":
      return "🇨🇦 CNF estimate";
    case "openfoodfacts":
      return "Open Food Facts";
    case "fastfood":
      return "Fast-food / snack index (approx.)";
    case "ocr":
      return "OCR from label photo";
    case "manual":
      return "Manual";
    default:
      return "Estimate";
  }
}

export function PlateItemsPanel({
  plateItems,
  analyzing,
  analyzeStatus,
  analyzeMeta,
  onRetest,
  onConfirm,
  onUnconfirm,
  onUpdateItem,
  onAddFromSuggestion,
  onAnalyzeAgain,
  onSkipModel,
}: Props) {
  const visible = plateItems.filter((i) => i.status !== "excluded");
  const [manualFor, setManualFor] = useState<string | null>(null);
  const [ocrBusy, setOcrBusy] = useState<string | null>(null);
  const labelCamRef = useRef<HTMLInputElement>(null);
  const labelGalRef = useRef<HTMLInputElement>(null);
  const [labelTarget, setLabelTarget] = useState<string | null>(null);

  async function runItemLabelOcr(itemId: string, file: File | null) {
    if (!file) return;
    setOcrBusy(itemId);
    try {
      const dataUrl = await compressImage(file);
      const { ocrNutritionFromImage } = await import("../lib/nutritionOcr");
      const result = await ocrNutritionFromImage(dataUrl);
      if (result.found) {
        onUpdateItem(itemId, {
          macros: result.macros,
          servingLabel: result.servingLabel || undefined,
          source: "ocr",
          labelPhoto: dataUrl,
        });
      } else {
        onUpdateItem(itemId, { labelPhoto: dataUrl });
      }
    } catch {
      // leave item as-is
    } finally {
      setOcrBusy(null);
      setLabelTarget(null);
    }
  }

  return (
    <div className="plate-items-panel">
      <div className="plate-items-head">
        <strong>On the plate</strong>
        <span className="plate-items-sub">
          Estimates under each name · Confirm to add · not medical advice
        </span>
      </div>

      {(analyzing || analyzeStatus) && (
        <p className="meal-food-ocr" role="status" aria-live="polite">
          {analyzeStatus || "Analyzing…"}
        </p>
      )}

      {analyzeMeta && !analyzing && (
        <p className="meal-food-ocr hint">{analyzeMeta.message}</p>
      )}

      {analyzing && (
        <div className="plate-analyze-actions">
          <button type="button" className="btn-ghost" onClick={onSkipModel}>
            Skip — enter manually
          </button>
        </div>
      )}

      {!analyzing && visible.length === 0 && analyzeMeta?.suggestions && (
        <div className="plate-chips">
          <span className="plate-chips-label">What’s on the plate?</span>
          <div className="plate-chip-row">
            {analyzeMeta.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="plate-chip"
                onClick={() => void onAddFromSuggestion(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <button type="button" className="btn-ghost" onClick={onAnalyzeAgain}>
            Try auto-detect again
          </button>
        </div>
      )}

      <ul className="plate-item-list">
        {visible.map((item) => (
          <li
            key={item.id}
            className={`plate-item-card ${item.status === "confirmed" ? "confirmed" : ""}`}
          >
            <div className="plate-item-title-row">
              <span className="plate-item-name">
                {item.status === "confirmed" ? "✓ " : ""}
                {item.name}
              </span>
              {item.confidence != null && item.confidence < 1 && (
                <span className="plate-item-conf">
                  {Math.round(item.confidence * 100)}%
                </span>
              )}
            </div>
            <p className="plate-item-macros">{compactMacros(item.macros)}</p>
            <p className="plate-item-meta">
              {item.servingLabel ? `${item.servingLabel} · ` : ""}
              {sourceLabel(item.source)}
            </p>
            {item.labelPhoto && (
              <img
                className="plate-item-label-thumb"
                src={item.labelPhoto}
                alt={`${item.name} label`}
              />
            )}
            <div className="plate-item-actions">
              {item.status === "confirmed" ? (
                <button
                  type="button"
                  className="btn-ghost plate-btn"
                  onClick={() => onUnconfirm(item.id)}
                >
                  Unconfirm
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn-ghost plate-btn"
                    disabled={analyzing}
                    onClick={() => onRetest(item.id)}
                  >
                    Retest
                  </button>
                  <button
                    type="button"
                    className="btn-primary plate-btn"
                    onClick={() => onConfirm(item.id)}
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    className="btn-ghost plate-btn"
                    onClick={() =>
                      setManualFor((cur) => (cur === item.id ? null : item.id))
                    }
                  >
                    Manual search
                  </button>
                  <button
                    type="button"
                    className="btn-ghost plate-btn"
                    disabled={ocrBusy === item.id}
                    onClick={() => {
                      setLabelTarget(item.id);
                      labelCamRef.current?.click();
                    }}
                  >
                    {ocrBusy === item.id ? "Reading…" : "Label camera"}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost plate-btn"
                    disabled={ocrBusy === item.id}
                    onClick={() => {
                      setLabelTarget(item.id);
                      labelGalRef.current?.click();
                    }}
                  >
                    Add label photo
                  </button>
                </>
              )}
            </div>

            {manualFor === item.id && item.status !== "confirmed" && (
              <ManualSearchPanel
                foodName={item.name}
                onPick={(hit) => {
                  onUpdateItem(item.id, {
                    name: hit.brand ? `${hit.name} (${hit.brand})` : hit.name,
                    macros: hit.perServing,
                    servingLabel: hit.servingLabel,
                    source:
                      hit.source === "memory"
                        ? "manual"
                        : hit.source === "fastfood"
                          ? "fastfood"
                          : hit.source === "cnf"
                            ? "cnf"
                            : hit.source === "openfoodfacts"
                              ? "openfoodfacts"
                              : "manual",
                  });
                  setManualFor(null);
                }}
                onClose={() => setManualFor(null)}
                onLabelPhoto={() => {
                  setLabelTarget(item.id);
                  labelGalRef.current?.click();
                }}
              />
            )}
          </li>
        ))}
      </ul>

      {!analyzing && visible.length > 0 && analyzeMeta?.mode === "fallback" && (
        <div className="plate-chips compact">
          <span className="plate-chips-label">Add another</span>
          <div className="plate-chip-row">
            {(analyzeMeta.suggestions ?? []).slice(0, 10).map((s) => (
              <button
                key={s}
                type="button"
                className="plate-chip"
                onClick={() => void onAddFromSuggestion(s)}
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        ref={labelCamRef}
        className="extra-file-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(ev) => {
          const id = labelTarget;
          const file = ev.target.files?.[0] ?? null;
          ev.target.value = "";
          if (id) void runItemLabelOcr(id, file);
        }}
      />
      <input
        ref={labelGalRef}
        className="extra-file-input"
        type="file"
        accept="image/*"
        onChange={(ev) => {
          const id = labelTarget;
          const file = ev.target.files?.[0] ?? null;
          ev.target.value = "";
          if (id) void runItemLabelOcr(id, file);
        }}
      />
    </div>
  );
}

function ManualSearchPanel({
  foodName,
  onPick,
  onClose,
  onLabelPhoto,
}: {
  foodName: string;
  onPick: (hit: FoodSearchHit) => void;
  onClose: () => void;
  onLabelPhoto: () => void;
}) {
  const [q, setQ] = useState(foodName);
  const [hits, setHits] = useState<FoodSearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const links = groceryDeepLinks(q || foodName);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      void (async () => {
        if (q.trim().length < 1) {
          setHits([]);
          return;
        }
        setBusy(true);
        setErr(null);
        try {
          const results = await searchAllFoods(q);
          if (!cancelled) setHits(results);
        } catch (ex) {
          if (!cancelled) {
            setErr(ex instanceof Error ? ex.message : "Search failed");
            setHits([]);
          }
        } finally {
          if (!cancelled) setBusy(false);
        }
      })();
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div className="plate-manual-panel">
      <div className="plate-manual-head">
        <strong>Manual search</strong>
        <button type="button" className="btn-ghost plate-btn" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="plate-manual-hint">
        CNF + Open Food Facts + Canadian fast-food index. Grocery sites can&apos;t be
        scraped here (CORS) — use the links, then attach a label photo.
      </p>
      <label className="field">
        <span>Search</span>
        <input
          type="text"
          value={q}
          placeholder="e.g. Greek yogurt, Big Mac, Tim Hortons"
          onChange={(ev) => setQ(ev.target.value)}
        />
      </label>
      <div className="plate-deep-links">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="plate-deep-link"
          >
            {l.label} ↗
          </a>
        ))}
        <button type="button" className="plate-deep-link as-btn" onClick={onLabelPhoto}>
          Add picture (label OCR)
        </button>
      </div>
      {busy && <p className="meal-food-ocr">Searching…</p>}
      {err && <p className="meal-food-err">{err}</p>}
      <ul className="nutrition-hits">
        {hits.map((h) => (
          <li key={h.id}>
            <button type="button" onClick={() => onPick(h)}>
              {h.imageUrl && (
                <img src={h.imageUrl} alt="" width={40} height={40} />
              )}
              <span>
                <strong>{h.name}</strong>
                {h.brand ? ` · ${h.brand}` : ""}
                <br />
                <small>
                  {h.source === "cnf"
                    ? "🇨🇦 CNF · "
                    : h.source === "openfoodfacts"
                      ? "OFF · "
                      : h.source === "fastfood"
                        ? "Fast-food index · "
                        : "Saved · "}
                  {h.servingLabel} · {h.perServing.calories} kcal · P{" "}
                  {h.perServing.protein}g · C {h.perServing.carbs}g · F{" "}
                  {h.perServing.fat}g
                  {h.note ? ` · ${h.note}` : ""}
                </small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Helper used by parent when adding a chip suggestion */
export async function buildPlateItemFromName(name: string): Promise<PlateItem> {
  const det = await itemFromFoodName(name);
  return {
    id: `pi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: det.name,
    confidence: det.confidence,
    macros: det.macros,
    servingLabel: det.servingLabel,
    source: det.source === "estimate" ? "estimate" : det.source,
    status: "pending",
  };
}
