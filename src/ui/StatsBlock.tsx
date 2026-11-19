import { Diamond, Flame } from 'lucide-react';
import { cx } from './cx';

export interface StatsBlockProps {
  streak: number;
  /** Shown as "best N" when given. */
  bestStreak?: number;
  /** Streak protection held; omit to hide it (Today never shows it). */
  reserves?: number;
  reserveCap?: number;
  /** done / window, or null when there's no closed record day yet. */
  average: number | null;
  averageDays: number;
  className?: string;
}

/** "last 100 days" until there are 100 days, then the window is fixed. */
export function averageLabel(averageDays: number): string {
  if (averageDays === 0) return 'average';
  return averageDays === 1 ? 'last day' : `last ${averageDays} days`;
}

export function formatAverage(average: number | null): string {
  return average === null ? '—' : `${Math.round(average * 100)}%`;
}

/**
 * Streak and the 100-day average, always together (P6), plus streak
 * protection (reserves) where it's shown — Progress, never Today. After a
 * broken streak (0) with history, the average is the dominant number.
 */
export function StatsBlock({ streak, bestStreak, reserves, reserveCap = 2, average, averageDays, className }: StatsBlockProps) {
  const averageHero = streak === 0 && average !== null;
  const big = 'text-3xl font-semibold leading-none';
  const small = 'text-xl font-semibold leading-none';
  const label = 'mt-1.5 truncate text-sm text-ink-muted';

  const streakCell = (
    <div data-streak className="min-w-0">
      <div className="flex items-center gap-1.5">
        <Flame aria-hidden size={averageHero ? 18 : 24} strokeWidth={2} className={streak > 0 ? 'text-accent' : 'text-ink-muted'} />
        <span className={cx(averageHero ? small : big, 'tabular-nums text-ink')}>{streak}</span>
      </div>
      <div className={label}>{bestStreak !== undefined && bestStreak > streak ? `best ${bestStreak}` : 'day streak'}</div>
    </div>
  );

  const averageCell = (
    <div data-average className="min-w-0">
      <div className={cx(averageHero ? big : small, 'tabular-nums text-ink')}>{formatAverage(average)}</div>
      <div className={label}>{averageLabel(averageDays)}</div>
    </div>
  );

  const reservesCell = reserves !== undefined && (
    <div data-reserves className="min-w-0">
      <div role="img" aria-label={`Streak protection: ${reserves} of ${reserveCap}`} className="flex h-[1.875rem] items-end gap-1 pb-0.5">
        {Array.from({ length: reserveCap }, (_, i) => (
          <Diamond
            key={i}
            aria-hidden
            size={18}
            strokeWidth={2}
            className={i < reserves ? 'fill-accent text-accent' : 'text-ink-muted'}
          />
        ))}
      </div>
      <div className={label}>{reserves >= reserveCap ? 'protection full' : 'protection'}</div>
    </div>
  );

  return (
    <div
      data-stats
      role="group"
      aria-label={reservesCell ? 'Streak, average and streak protection' : 'Streak and average'}
      className={cx(
        'grid items-end',
        reservesCell ? 'grid-cols-[1.2fr_1fr_1fr]' : 'grid-cols-2',
        'gap-3 gap-3 rounded-card border border-line bg-surface p-4',
        className,
      )}
    >
      {averageHero ? averageCell : streakCell}
      {averageHero ? streakCell : averageCell}
      {reservesCell}
    </div>
  );
}
