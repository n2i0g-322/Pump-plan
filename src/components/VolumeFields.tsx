import type { MouseEvent } from "react";
import {
  formatMlTotal,
  formatOzTotal,
  lToMl,
  mlToL,
  mlToOz,
  ozToMl,
  round1,
  round2,
} from "../lib/units";

type Common = {
  /** Accessible name for the field group */
  label?: string;
  className?: string;
  /** Compact layout for pump check grid */
  compact?: boolean;
  /** Hide the live total line (when parent already shows one) */
  hideTotal?: boolean;
  disabled?: boolean;
  /** e.g. stopPropagation when nested in a button row */
  onClick?: (e: MouseEvent) => void;
};

type MlProps = Common & {
  /** Canonical value stored in milliliters */
  mode: "ml";
  valueMl: number;
  onChangeMl: (ml: number) => void;
  /** Include liters box (default true for fluids) */
  showLiters?: boolean;
};

type OzProps = Common & {
  /** Canonical value stored in ounces */
  mode: "oz";
  valueOz: number;
  onChangeOz: (oz: number) => void;
};

export type VolumeFieldsProps = MlProps | OzProps;

function numOrEmpty(n: number, digits: "int" | "1" | "2" | "3"): string | number {
  if (!Number.isFinite(n) || n === 0) return "";
  if (digits === "int") return Math.round(n);
  if (digits === "1") return round1(n);
  if (digits === "2") return round2(n);
  return Math.round(n * 1000) / 1000;
}

function parseNonNeg(raw: string): number {
  if (raw === "" || raw === "-" || raw === ".") return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Live dual (oz + ml) or triple (oz + ml + L) volume entry.
 * Parent keeps one canonical unit; boxes stay in sync on every keystroke.
 */
export function VolumeFields(props: VolumeFieldsProps) {
  const compact = props.compact;
  const showLiters = props.mode === "ml" && props.showLiters !== false;

  let ozDisplay: string | number;
  let mlDisplay: string | number;
  let lDisplay: string | number = "";
  let total: string;
  let onOz: (raw: string) => void;
  let onMl: (raw: string) => void;
  let onL: (raw: string) => void = () => undefined;

  if (props.mode === "ml") {
    const ml = Number.isFinite(props.valueMl) ? Math.max(0, props.valueMl) : 0;
    ozDisplay = numOrEmpty(mlToOz(ml), "1");
    mlDisplay = numOrEmpty(ml, "int");
    lDisplay = numOrEmpty(mlToL(ml), "3");
    total = formatMlTotal(ml);
    onOz = (raw) => props.onChangeMl(ozToMl(parseNonNeg(raw)));
    onMl = (raw) => props.onChangeMl(Math.round(parseNonNeg(raw)));
    onL = (raw) => props.onChangeMl(lToMl(parseNonNeg(raw)));
  } else {
    const oz = Number.isFinite(props.valueOz) ? Math.max(0, props.valueOz) : 0;
    ozDisplay = numOrEmpty(oz, "1");
    mlDisplay = numOrEmpty(ozToMl(oz), "int");
    total = formatOzTotal(oz);
    onOz = (raw) => props.onChangeOz(round1(parseNonNeg(raw)));
    onMl = (raw) => props.onChangeOz(mlToOz(parseNonNeg(raw)));
  }

  const rootClass = [
    "volume-fields",
    compact ? "volume-fields-compact" : "",
    props.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClass}
      role="group"
      aria-label={props.label ?? "Volume"}
      onClick={props.onClick}
    >
      {props.label ? <span className="volume-fields-label">{props.label}</span> : null}
      <div className="volume-fields-boxes">
        <label className="volume-box">
          <span className="volume-unit">oz</span>
          <input
            type="number"
            min={0}
            step={0.5}
            inputMode="decimal"
            disabled={props.disabled}
            value={ozDisplay}
            placeholder="0"
            aria-label={`${props.label ?? "Volume"} ounces`}
            onChange={(e) => onOz(e.target.value)}
          />
        </label>
        <label className="volume-box">
          <span className="volume-unit">ml</span>
          <input
            type="number"
            min={0}
            step={1}
            inputMode="decimal"
            disabled={props.disabled}
            value={mlDisplay}
            placeholder="0"
            aria-label={`${props.label ?? "Volume"} milliliters`}
            onChange={(e) => onMl(e.target.value)}
          />
        </label>
        {props.mode === "ml" && showLiters ? (
          <label className="volume-box">
            <span className="volume-unit">L</span>
            <input
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              disabled={props.disabled}
              value={lDisplay}
              placeholder="0"
              aria-label={`${props.label ?? "Volume"} liters`}
              onChange={(e) => onL(e.target.value)}
            />
          </label>
        ) : null}
      </div>
      {!props.hideTotal ? (
        <span className="volume-fields-total" aria-live="polite">
          {total}
        </span>
      ) : null}
    </div>
  );
}
