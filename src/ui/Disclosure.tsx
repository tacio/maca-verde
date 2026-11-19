import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cx, focusRing } from './cx';

export interface DisclosureProps {
  /** "Why?" or "How?" */
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

/**
 * Explanations on demand (P10): collapsed by default; long text is allowed
 * inside (`data-disclosure` exempts it from the 2-line rule).
 */
export function Disclosure({ summary, children, defaultOpen }: DisclosureProps) {
  return (
    <details data-disclosure className="group" open={defaultOpen}>
      <summary
        className={cx(
          'inline-flex min-h-12 min-w-12 cursor-pointer list-none items-center gap-1 rounded-control px-1 text-sm font-medium text-accent',
          '[&::-webkit-details-marker]:hidden',
          focusRing,
        )}
      >
        {summary}
        <ChevronDown aria-hidden size={16} className="transition-transform duration-fast ease-calm group-open:rotate-180" />
      </summary>
      <div className="pb-2 pt-1 text-sm leading-relaxed text-ink-muted">{children}</div>
    </details>
  );
}
