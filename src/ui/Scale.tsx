import { cx, focusRing } from './cx';

export interface ScaleProps {
  label: string;
  /** Inclusive range, e.g. 1–10 or 0–10. */
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  /** Words under both ends ("easy" … "all out"). */
  low: string;
  high: string;
  /** Choices per row (rows wrap); keep each ≥ 48 px wide. */
  columns: number;
}

/** A compact numeric scale: one 48 px radio per value, wrapping into rows. */
export function Scale({ label, min, max, value, onChange, low, high, columns }: ScaleProps) {
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-base font-medium text-ink">{label}</span>
        <span className="text-sm text-ink-muted">
          {low} – {high}
        </span>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {values.map((n) => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${n}${n === min ? `, ${low}` : n === max ? `, ${high}` : ''}`}
              onClick={() => onChange(n)}
              className={cx(
                'flex min-h-12 items-center justify-center rounded-control border text-base tabular-nums',
                'transition-colors duration-fast ease-calm',
                on ? 'border-accent bg-accent-soft font-semibold text-ink ring-1 ring-inset ring-accent' : 'border-line bg-surface text-ink hover:bg-surface-2',
                focusRing,
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
