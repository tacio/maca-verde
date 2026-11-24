import type { KeyboardEvent, PointerEvent } from 'react';
import { cx, focusRing } from './cx';
import { formatUnit, toUnit, unitAt } from './unit';

export interface TapScaleProps {
  label: string;
  /** null until the first tap: no preselected value to anchor the answer. */
  value: number | null;
  onChange: (value: number) => void;
  /** Words under both ends ("nothing" … "max"). */
  low: string;
  high: string;
}

/**
 * A continuous rating, 0.00–1.00 (a visual analogue scale): tap anywhere on
 * the strip to place the marker, or slide along it; tap or slide again to
 * move it. No preselection. Vertical swipes still scroll the page
 * (`touch-action: pan-y`). One hue, light to strong — high isn't "bad". Arrow keys step
 * .05 (Home/End jump to the ends).
 */
export function TapScale({ label, value, onChange, low, high }: TapScaleProps) {
  const place = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onChange(unitAt(e.clientX, r.left, r.width));
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    place(e);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) place(e);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const v = value ?? 0.5;
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowUp' ? v + 0.05
      : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? v - 0.05
      : e.key === 'Home' ? 0
      : e.key === 'End' ? 1
      : null;
    if (next === null) return;
    e.preventDefault();
    onChange(toUnit(next));
  };

  return (
    <div data-tap-scale className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-base font-medium text-ink">{label}</span>
        <span className={cx('text-base tabular-nums', value === null ? 'text-sm text-ink-muted' : 'font-semibold text-ink')}>
          {value === null ? 'Tap' : formatUnit(value)}
        </span>
      </div>
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value === null ? 'not set' : `${formatUnit(value)}, from ${low} to ${high}`}
        onPointerDown={down}
        onPointerMove={move}
        onKeyDown={key}
        className={cx('relative h-14 cursor-pointer touch-pan-y select-none rounded-control border border-line', focusRing)}
        style={{ backgroundImage: 'linear-gradient(to right, var(--accent-soft), var(--accent))' }}
      >
        {value !== null && (
          <span
            aria-hidden
            data-tap-marker
            className="pointer-events-none absolute -inset-y-1 w-1.5 -translate-x-1/2 rounded-full bg-ink ring-2 ring-canvas"
            style={{ left: `${value * 100}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-sm text-ink-muted">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
