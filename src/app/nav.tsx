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
  /** Swap the top flow for another (e.g. workout preview → workout) without a back step to it. */
  replace: (flow: string) => void;
  close: () => void;
  /**
   * While set, the back gesture on a pushed flow calls `guard` instead of
   * closing it (the workout HUD opens its pause sheet). close() still closes.
   */
  setBackGuard: (guard: (() => void) | null) => void;
}

const NavContext = createContext<Nav | null>(null);

const TAB_SCREENS: readonly string[] = ['today', 'plan', 'progress'];

export const ONBOARD_STEPS = ['day', 'anchor', 'plan'] as const;
export type OnboardStep = (typeof ONBOARD_STEPS)[number];

export interface InitialView {
  tab: Tab;
  flows: string[];
  /** `?screen=onboard-<step>` opens onboarding at that step (dev scenarios). */
  onboardStep?: OnboardStep;
}

/**
 * A flow is a name with optional `:`-separated arguments, e.g. `cycle:1436`,
 * `day-edit:14362`, `day-edit:14362:blank` (start from an empty day).
 */
export function parseFlow(flow: string): { name: string; args: string[] } {
  const [name, ...args] = flow.split(':');
  return { name, args };
}

/** A whole-number flow argument, or undefined. */
export function intArg(arg: string | undefined): number | undefined {
  return arg !== undefined && /^-?\d+$/.test(arg) ? Number(arg) : undefined;
}

/** Initial view from `?screen=` (dev scenarios; harmless in production). */
export function initialView(screen: string | null): InitialView {
  if (!screen || screen === 'today') return { tab: 'today', flows: [] };
  const step = screen.startsWith('onboard-') ? screen.slice('onboard-'.length) : null;
  if (step !== null && (ONBOARD_STEPS as readonly string[]).includes(step))
    return { tab: 'today', flows: [], onboardStep: step as OnboardStep };
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

export function NavProvider({ initial, children }: { initial: InitialView; children: ReactNode }) {
  const [tab, setTabState] = useState<Tab>(initial.tab);
  const [stack, setStack] = useState<Entry[]>(() => initial.flows.map((flow) => ({ flow, pushed: false })));
  const stackRef = useRef(stack);
  stackRef.current = stack;
  const guardRef = useRef<(() => void) | null>(null);
  const closingRef = useRef(false);

  useEffect(() => {
    const onPop = () => {
      // Our pushed entries are popped by the browser; drop the top one.
      const top = last(stackRef.current);
      const closing = closingRef.current;
      closingRef.current = false;
      if (top?.pushed && guardRef.current && !closing) {
        // Intercepted: restore the entry the gesture popped and let the screen decide.
        window.history.pushState({ flow: top.flow }, '');
        guardRef.current();
        return;
      }
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

  const replace = useCallback((flow: string) => {
    const top = last(stackRef.current);
    if (!top) return;
    if (top.pushed) window.history.replaceState({ flow }, '');
    setStack((s) => [...s.slice(0, -1), { flow, pushed: top.pushed }]);
    window.scrollTo(0, 0);
  }, []);

  const close = useCallback(() => {
    const top = last(stackRef.current);
    if (!top) return;
    if (top.pushed) {
      closingRef.current = true;
      window.history.back();
    } else setStack((s) => s.slice(0, -1));
  }, []);

  const setBackGuard = useCallback((guard: (() => void) | null) => {
    guardRef.current = guard;
  }, []);

  const setTab = useCallback((t: Tab) => {
    setTabState(t);
    window.scrollTo(0, 0);
  }, []);

  const value = useMemo<Nav>(
    () => ({ tab, setTab, flow: last(stack)?.flow ?? null, open, replace, close, setBackGuard }),
    [tab, setTab, stack, open, replace, close, setBackGuard],
  );
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav(): Nav {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav() outside <NavProvider>');
  return ctx;
}

/** Intercept the back gesture while this screen is shown (see Nav.setBackGuard). */
export function useBackGuard(handler: () => void): void {
  const { setBackGuard } = useNav();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    setBackGuard(() => ref.current());
    return () => setBackGuard(null);
  }, [setBackGuard]);
}
