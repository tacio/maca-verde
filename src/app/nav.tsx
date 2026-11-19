import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Tab } from '../ui/BottomNav';

/**
 * Navigation without a router: one of three tabs, plus a stack of
 * full-screen flows on top (settings, workout, mood…). Opening a flow pushes
 * a history entry so the Android back gesture closes it.
 */

export interface Nav {
  tab: Tab;
  setTab: (tab: Tab) => void;
  /** Top of the flow stack, or null when a tab is showing. */
  flow: string | null;
  open: (flow: string) => void;
  close: () => void;
}

const NavContext = createContext<Nav | null>(null);

const TAB_SCREENS: readonly string[] = ['today', 'plan', 'progress'];

/** Initial view from `?screen=` (dev scenarios; harmless in production). */
export function initialView(screen: string | null): { tab: Tab; flows: string[] } {
  if (!screen || screen === 'today') return { tab: 'today', flows: [] };
  if (TAB_SCREENS.includes(screen)) return { tab: screen as Tab, flows: [] };
  // Settings lives behind the gear on Progress (02-workflows §2).
  if (screen === 'settings') return { tab: 'progress', flows: ['settings'] };
  return { tab: 'today', flows: [screen] };
}

const last = <T,>(xs: T[]): T | undefined => xs[xs.length - 1];

interface Entry {
  flow: string;
  /** Opened in this session (has a history entry) vs. restored from the URL. */
  pushed: boolean;
}

export function NavProvider({ initial, children }: { initial: { tab: Tab; flows: string[] }; children: ReactNode }) {
  const [tab, setTabState] = useState<Tab>(initial.tab);
  const [stack, setStack] = useState<Entry[]>(() => initial.flows.map((flow) => ({ flow, pushed: false })));
  const stackRef = useRef(stack);
  stackRef.current = stack;

  useEffect(() => {
    const onPop = () => {
      // Our pushed entries are popped by the browser; drop the top one.
      const top = last(stackRef.current);
      if (top?.pushed) setStack((s) => s.slice(0, -1));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const open = useCallback((flow: string) => {
    window.history.pushState({ flow }, '');
    setStack((s) => [...s, { flow, pushed: true }]);
    window.scrollTo(0, 0);
  }, []);

  const close = useCallback(() => {
    const top = last(stackRef.current);
    if (!top) return;
    if (top.pushed) window.history.back();
    else setStack((s) => s.slice(0, -1));
  }, []);

  const setTab = useCallback((t: Tab) => {
    setTabState(t);
    window.scrollTo(0, 0);
  }, []);

  const value = useMemo<Nav>(
    () => ({ tab, setTab, flow: last(stack)?.flow ?? null, open, close }),
    [tab, setTab, stack, open, close],
  );
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): Nav {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav() outside <NavProvider>');
  return ctx;
}
