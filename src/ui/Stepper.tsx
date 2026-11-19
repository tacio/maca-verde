import { Minus, Plus } from 'lucide-react';
import { cx, focusRing } from './cx';

export interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Display of the value (e.g. seconds, decimal duration). */
  format?: (value: number) => string;
  /** One muted line under the label (e.g. "last 38 · suggested 40", P3). */
  hint?: string;
}

const stepBtn = cx(
  'inline-flex size-12 items-center justify-center rounded-full border border-line bg-surface text-ink',
  'transition-colors duration-fast ease-calm hover:bg-surface-2 disabled:text-ink-muted disabled:opacity-60',
  focusRing,
);

/** Label on the left, − value + on the right; 48 px targets. */
export function Stepper({ label, value, onChange, min = 0, max = Infinity, step = 1, format, hint }: StepperProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div role="group" aria-label={label} className="flex min-h-14 items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base text-ink">{label}</span>
        {hint && <span className="truncate text-sm text-ink-muted">{hint}</span>}
      </div>
      <button
        type="button"
        className={stepBtn}
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(clamp(value - step))}
      >
        <Minus aria-hidden size={18} />
      </button>
      <output aria-live="polite" className="min-w-10 text-center text-lg font-semibold tabular-nums text-ink">
        {format ? format(value) : value}
      </output>
      <button
        type="button"
        className={stepBtn}
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(clamp(value + step))}
      >
        <Plus aria-hidden size={18} />
      </button>
    </div>
  );
}
