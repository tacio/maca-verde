import { useEffect, useRef, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** How long a celebration moment stays (P13: ≤ 2 s). */
export const MOMENT_MS = 1600;

export interface MomentProps {
  icon: LucideIcon;
  /** Filled icon (e.g. the reserve diamond). */
  fillIcon?: boolean;
  title: string;
  body: ReactNode;
  /** Called on tap and after MOMENT_MS. */
  onDismiss: () => void;
}

/**
 * A full-screen celebration (02-workflows §6): calm rise, ≤ 2 s, tap to
 * dismiss. Motion uses the duration tokens, so reduced motion makes it static.
 */
export function Moment({ icon: Icon, fillIcon, title, body, onDismiss }: MomentProps) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    const id = window.setTimeout(() => dismissRef.current(), MOMENT_MS);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      role="status"
      onClick={onDismiss}
      className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-canvas px-8 text-center"
    >
      <div className="moment-in flex flex-col items-center">
        <span className="mb-5 flex size-20 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon aria-hidden size={34} strokeWidth={fillIcon ? 2 : 1.75} className={fillIcon ? 'fill-accent' : undefined} />
        </span>
        <p className="text-3xl font-semibold tracking-tight text-ink">{title}</p>
        <p className="mt-2 text-base tabular-nums text-ink-muted">{body}</p>
      </div>
    </div>
  );
}
