import type { ReactNode } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { IconButton } from './Button';

export interface FullScreenProps {
  /** Value of `data-screen` (UX checks are scoped to it). */
  screen: string;
  title: string;
  /** Close/back affordance in the top-left corner. */
  onClose: () => void;
  /** 'back' shows an arrow (a step back), 'close' an ✕ (leave the flow). */
  dismiss?: 'back' | 'close';
  /** Trailing header slot (e.g. an IconButton). */
  trailing?: ReactNode;
  /** Pinned to the bottom: usually the screen's primary Button. */
  footer?: ReactNode;
  /** A timed step that runs out on its own: no primary action (`data-autoadvance`, P9/P12). */
  autoAdvance?: boolean;
  children: ReactNode;
}

/** A flow screen without the bottom nav (workout, log, mood, settings…). */
export function FullScreen({ screen, title, onClose, dismiss = 'close', trailing, footer, autoAdvance, children }: FullScreenProps) {
  return (
    <div data-screen={screen} data-autoadvance={autoAdvance ? '' : undefined} className="mx-auto flex min-h-dvh max-w-md flex-col bg-canvas">
      <header className="sticky top-0 z-10 flex items-center gap-1 bg-canvas px-2 pb-1 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <IconButton icon={dismiss === 'back' ? ArrowLeft : X} label={dismiss === 'back' ? 'Back' : 'Close'} onClick={onClose} />
        <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>
        {trailing}
      </header>
      <main className="flex-1 px-5 pb-6">{children}</main>
      {footer && (
        <div className="sticky bottom-0 bg-canvas px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>
      )}
    </div>
  );
}
