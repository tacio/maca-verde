import type { ReactNode } from 'react';
import { BottomNav } from '../../ui/BottomNav';
import { useNav } from '../nav';

export interface TabScreenProps {
  /** Value of `data-screen`. */
  screen: string;
  /** The screen's primary action, pinned above the bottom nav. */
  action?: ReactNode;
  children: ReactNode;
}

/** A tab destination: content, the primary action within thumb reach, and the bottom nav. */
export function TabScreen({ screen, action, children }: TabScreenProps) {
  const { tab, setTab } = useNav();
  return (
    <div data-screen={screen} className="min-h-dvh bg-canvas">
      <main className="mx-auto flex max-w-md flex-col gap-6 px-5 pb-[calc(10rem+env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        {children}
      </main>
      {action && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+1px+env(safe-area-inset-bottom))] z-10 bg-canvas">
          <div className="mx-auto max-w-md px-5 pb-3 pt-2">{action}</div>
        </div>
      )}
      <BottomNav active={tab} onSelect={setTab} />
    </div>
  );
}
