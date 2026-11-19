import type { ReactNode } from 'react';
import { cx, focusRing } from './cx';

export interface ListRowProps {
  title: ReactNode;
  /** One muted line under the title. */
  meta?: ReactNode;
  /** Status glyph, icon or day number. */
  leading?: ReactNode;
  /** Chevron, value or glyph on the right. */
  trailing?: ReactNode;
  /** When set the whole row is one ≥ 48 px button. */
  onClick?: () => void;
  /** Soft highlight (e.g. today's row in a list of days). */
  highlight?: boolean;
  /** Muted title (e.g. a done item, an unplanned day). */
  muted?: boolean;
  className?: string;
}

/** A list row: leading · title + meta · trailing. Single-line title and meta. */
export function ListRow({ title, meta, leading, trailing, onClick, highlight, muted, className }: ListRowProps) {
  const body = (
    <>
      {leading !== undefined && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cx('truncate text-base', muted ? 'text-ink-muted' : 'text-ink')}>{title}</span>
        {meta && <span className="truncate text-sm text-ink-muted">{meta}</span>}
      </span>
      {trailing !== undefined && <span className="flex shrink-0 items-center text-ink-muted">{trailing}</span>}
    </>
  );
  const cls = cx(
    'flex min-h-14 w-full items-center gap-3 rounded-card px-3 py-2 text-left',
    highlight && 'bg-accent-soft',
    className,
  );
  if (!onClick) return <div className={cls}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(cls, 'transition-colors duration-fast ease-calm', !highlight && 'hover:bg-surface-2', focusRing)}
    >
      {body}
    </button>
  );
}
