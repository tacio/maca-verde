import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { nowUnix } from '../time/clock';
import type { DayConfig } from '../time/daykeep';
import { computeRecord, type RecordSummary } from '../domain/record';
import type { AppData } from '../domain/types';
import { setBackupStampSink } from '../storage/autoBackup';
import { loadData, saveData } from '../storage/store';

/** How often "now" (and the record) is refreshed: ≈ one daykeep tick (8.64 s). */
export const TICK_MS = 10_000;

export interface AppState {
  data: AppData;
  record: RecordSummary;
  /** Unix seconds, refreshed every TICK_MS and when the page becomes visible. */
  now: number;
  cfg: DayConfig;
  /** Apply a pure change to the data and persist it (store.ts). */
  update: (fn: (data: AppData) => AppData) => void;
}

const AppContext = createContext<AppState | null>(null);

/** Re-reads the clock on a timer and on visibilitychange, so a day rollover shows. */
export function useNow(intervalMs = TICK_MS): number {
  const [now, setNow] = useState(nowUnix);
  useEffect(() => {
    const tick = () => setNow(nowUnix());
    const id = window.setInterval(tick, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs]);
  return now;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());
  const dataRef = useRef(data);
  const now = useNow();
  const cfg = data.settings.config;
  const record = useMemo(() => computeRecord(data, now, cfg), [data, now, cfg]);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    const next = fn(dataRef.current);
    if (next === dataRef.current) return;
    dataRef.current = next;
    saveData(next);
    setData(next);
  }, []);

  // Auto-backup (storage/autoBackup.ts) stamps a finished upload into the data.
  useEffect(() => {
    setBackupStampSink((unix) =>
      update((d) => ({ ...d, settings: { ...d.settings, drive: { ...d.settings.drive, lastBackupUnix: unix } } })),
    );
    return () => setBackupStampSink(null);
  }, [update]);

  const value = useMemo<AppState>(() => ({ data, record, now, cfg, update }), [data, record, now, cfg, update]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp() outside <AppProvider>');
  return ctx;
}
