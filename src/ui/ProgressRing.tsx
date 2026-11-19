import type { ReactNode } from 'react';

export interface ProgressRingProps {
  /** 0–1 (clamped). */
  value: number;
  /** Accessible description, e.g. "1 of 4 done". */
  label: string;
  /** Diameter in px. */
  size?: number;
  stroke?: number;
  /** Centered content (e.g. a count). */
  children?: ReactNode;
}

/** A calm circular progress indicator; the arc animates with the motion tokens. */
export function ProgressRing({ value, label, size = 56, stroke = 5, children }: ProgressRingProps) {
  const v = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span
      role="img"
      aria-label={label}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-line" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className="stroke-accent transition-[stroke-dashoffset] duration-base ease-calm"
          style={{ opacity: v === 0 ? 0 : 1 }}
        />
      </svg>
      {children !== undefined && (
        <span aria-hidden className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums text-ink">
          {children}
        </span>
      )}
    </span>
  );
}
