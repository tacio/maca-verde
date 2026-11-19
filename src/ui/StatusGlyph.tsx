import { Check, Diamond, Lock, Minus } from 'lucide-react';
import { cx } from './cx';

/**
 * Checklist / day status. Each state differs in shape, not only color:
 * todo ○ · done ● with ✓ · locked 🔒 · current ◎ · missed ⊖ · kept ◈.
 * A kept day (missed, streak protected by a reserve) never uses the done style (P6).
 */
export type GlyphStatus = 'todo' | 'done' | 'locked' | 'current' | 'missed' | 'kept';

export const GLYPH_LABEL: Record<GlyphStatus, string> = {
  todo: 'To do',
  done: 'Done',
  locked: 'Locked',
  current: 'Today',
  missed: 'Missed',
  kept: 'Missed, streak kept',
};

export function StatusGlyph({ status, label }: { status: GlyphStatus; label?: string }) {
  const base = 'inline-flex size-6 shrink-0 items-center justify-center rounded-full';
  const a11y = { role: 'img' as const, 'aria-label': label ?? GLYPH_LABEL[status] };
  switch (status) {
    case 'done':
      return (
        <span {...a11y} className={cx(base, 'bg-accent text-accent-ink')}>
          <Check aria-hidden size={15} strokeWidth={3} />
        </span>
      );
    case 'locked':
      return (
        <span {...a11y} className={cx(base, 'text-ink-muted')}>
          <Lock aria-hidden size={16} strokeWidth={2} />
        </span>
      );
    case 'current':
      return (
        <span {...a11y} className={cx(base, 'border-2 border-accent')}>
          <span className="size-2 rounded-full bg-accent" />
        </span>
      );
    case 'missed':
      return (
        <span {...a11y} className={cx(base, 'border-[1.5px] border-ink-muted text-ink-muted')}>
          <Minus aria-hidden size={14} strokeWidth={2.5} />
        </span>
      );
    case 'kept':
      return (
        <span {...a11y} className={cx(base, 'border-[1.5px] border-ink-muted text-ink-muted')}>
          <Diamond aria-hidden size={12} strokeWidth={2.5} />
        </span>
      );
    default:
      return <span {...a11y} className={cx(base, 'border-[1.5px] border-ink-muted')} />;
  }
}
