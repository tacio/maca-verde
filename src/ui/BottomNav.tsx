import { CalendarDays, ChartColumn, Sun, type LucideIcon } from 'lucide-react';
import { cx, focusRing } from './cx';

export type Tab = 'today' | 'plan' | 'progress';

export const TABS: readonly { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'today', label: 'Today', icon: Sun },
  { id: 'plan', label: 'Plan', icon: CalendarDays },
  { id: 'progress', label: 'Progress', icon: ChartColumn },
];

export interface BottomNavProps {
  active: Tab;
  onSelect: (tab: Tab) => void;
  /** Fixed to the bottom of the viewport (default) or in flow (gallery). */
  fixed?: boolean;
}

/** Today · Plan · Progress (02-workflows §2). */
export function BottomNav({ active, onSelect, fixed = true }: BottomNavProps) {
  return (
    <nav
      data-nav
      aria-label="Main"
      className={cx(
        'border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]',
        fixed && 'fixed inset-x-0 bottom-0 z-20',
      )}
    >
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {TABS.map(({ id, label, icon: Icon }) => {
          const on = id === active;
          return (
            <li key={id}>
              <button
                type="button"
                aria-current={on ? 'page' : undefined}
                onClick={() => onSelect(id)}
                className={cx('group flex min-h-16 w-full flex-col items-center justify-center gap-1 text-xs', focusRing)}
              >
                <span
                  className={cx(
                    'flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-fast ease-calm',
                    on ? 'bg-accent-soft text-accent' : 'text-ink-muted group-hover:bg-surface-2',
                  )}
                >
                  <Icon aria-hidden size={20} strokeWidth={on ? 2.25 : 1.75} />
                </span>
                <span className={on ? 'font-semibold text-ink' : 'text-ink-muted'}>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
