import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  /** ≤ 2 lines. */
  body?: ReactNode;
  /** Optional action under the text (the screen's primary lives elsewhere unless it's this). */
  action?: ReactNode;
}

/** A calm, centered "nothing here yet" with what comes next. */
export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon aria-hidden size={26} strokeWidth={1.75} />
      </span>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {body && <p className="mt-1 max-w-xs text-base text-ink-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
