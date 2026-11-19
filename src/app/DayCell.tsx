import { Diamond } from 'lucide-react';
import { cx } from '../ui/cx';
import type { CellKind } from './view';

/** One grid cell. Kinds differ by fill, outline and mark, not only color. */
export function DayCell({ kind }: { kind: CellKind }) {
  const base = 'flex aspect-square w-full items-center justify-center rounded-[5px]';
  switch (kind) {
    case 'done':
      return <span className={cx(base, 'bg-accent')} />;
    case 'kept':
      return (
        <span className={cx(base, 'border-[1.5px] border-accent text-accent')}>
          <Diamond aria-hidden size={10} strokeWidth={3} />
        </span>
      );
    case 'missed':
      return <span className={cx(base, 'border-[1.5px] border-ink-muted')} />;
    case 'today':
      return (
        <span className={cx(base, 'border-2 border-accent')}>
          <span className="size-1.5 rounded-full bg-accent" />
        </span>
      );
    case 'future':
      return <span className={cx(base, 'border border-dashed border-line')} />;
    default:
      return (
        <span className={base}>
          <span className="size-1 rounded-full bg-line" />
        </span>
      );
  }
}
