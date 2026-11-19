import { formatDuration, fromUnix, remainingInDay, shortDay, type DayConfig } from '../time/daykeep';

export interface DayHeaderProps {
  day: number;
  /** Unix seconds (nowUnix()). */
  now: number;
  cfg: DayConfig;
  /** Small line above the day number, e.g. "Today" or "Warm-up day". */
  eyebrow?: string;
}

/** The day number (daykeep, five digits) and the decimal time left in it: "14355 · .6000 left". */
export function DayHeader({ day, now, cfg, eyebrow = 'Today' }: DayHeaderProps) {
  const left = formatDuration(remainingInDay(fromUnix(now, cfg), cfg), cfg);
  return (
    <header className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-muted">{eyebrow}</p>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight tabular-nums text-ink">
          <span className="sr-only">Day </span>
          {shortDay(day, 5)}
        </h1>
      </div>
      <p className="pb-1.5 text-base tabular-nums text-ink-muted">
        <span className="font-medium text-ink">{left}</span> left
      </p>
    </header>
  );
}
