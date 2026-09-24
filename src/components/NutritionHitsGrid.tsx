/**
 * Compact 2-column nutrition search results: tile grid + expand-to-detail.
 */

import { useState } from "react";
import type { FoodSearchHit } from "../lib/foodSearch";

type Props = {
  hits: FoodSearchHit[];
  onPick: (hit: FoodSearchHit) => void;
};

export function NutritionHitsGrid({ hits, onPick }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expanded = expandedId ? hits.find((h) => h.id === expandedId) : null;

  if (!hits.length) return null;

  if (expanded) {
    const m = expanded.perServing;
    return (
      <div className="nutrition-hit-expanded" role="region" aria-label="Food details">
        <button
          type="button"
          className="nutrition-hit-back"
          onClick={() => setExpandedId(null)}
        >
          ← Back to results
        </button>
        <h4 className="nutrition-hit-expanded-title">{expanded.displayName}</h4>
        <p className="nutrition-hit-official">
          <span className="muted-label">Full name</span>
          {expanded.name}
          {expanded.brand ? ` · ${expanded.brand}` : ""}
        </p>
        <p className="nutrition-hit-serving">
          <strong>Serving:</strong> {expanded.servingLabel}
        </p>
        {expanded.note && <p className="nutrition-hit-note">{expanded.note}</p>}
        <div className="nutrition-hit-macros">
          <span>
            <strong>{m.calories}</strong> kcal
          </span>
          <span>
            <strong>P</strong> {m.protein}g
          </span>
          <span>
            <strong>C</strong> {m.carbs}g
          </span>
          <span>
            <strong>F</strong> {m.fat}g
          </span>
          <span>
            <strong>Sugar</strong> {m.sugar}g
          </span>
          <span>
            <strong>Ca</strong> {m.calcium}mg
          </span>
          {m.fluid > 0 && (
            <span>
              <strong>Fluid</strong> {m.fluid} ml
            </span>
          )}
        </div>
        <div className="nutrition-hit-expanded-actions">
          {expanded.sourceUrl ? (
            <a
              className="nutrition-source-btn"
              href={expanded.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Source: {expanded.sourceButtonLabel} ↗
            </a>
          ) : (
            <span className="nutrition-source-btn disabled">
              Source: {expanded.sourceButtonLabel}
            </span>
          )}
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              onPick(expanded);
              setExpandedId(null);
            }}
          >
            Use this
          </button>
        </div>
      </div>
    );
  }

  return (
    <ul className="nutrition-hits nutrition-hits-grid">
      {hits.map((h) => (
        <li key={h.id}>
          <button
            type="button"
            className="nutrition-hit-tile"
            onClick={() => setExpandedId(h.id)}
          >
            <strong className="nutrition-hit-tile-name">{h.displayName}</strong>
            <span className="nutrition-hit-tile-kcal">{h.perServing.calories} kcal</span>
            {h.sourceUrl ? (
              <a
                className="nutrition-source-btn compact"
                href={h.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(ev) => ev.stopPropagation()}
              >
                {h.sourceButtonLabel}
              </a>
            ) : (
              <span
                className="nutrition-source-btn compact disabled"
                onClick={(ev) => ev.stopPropagation()}
              >
                {h.sourceButtonLabel}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
