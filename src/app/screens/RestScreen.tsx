import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Leaf, Pause, Play } from 'lucide-react';
import { coach } from '../../audio/coach';
import type { RestItem, RestSession } from '../../domain/types';
import { nowMs, nowUnix } from '../../time/clock';
import { formatSeconds } from '../../time/seconds';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { FullScreen } from '../../ui/FullScreen';
import { ProgressRing } from '../../ui/ProgressRing';
import { end, isFinished, isPaused, pause, phaseElapsedMs, progress, remainingMs, resume, startRun, tick, type Phase, type Run } from '../../workout/phases';
import { useApp } from '../AppContext';
import { findPlanItem } from '../items';
import { useBackGuard, useNav } from '../nav';
import { newLogId } from '../today';
import { useClockMs } from '../timers';
import { MissingItem } from './MissingItem';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Dev scenarios: `rest:<itemId>:mid` opens a third of the way in. */
export function RestScreen({ itemId, mid }: { itemId: string; mid?: boolean }) {
  const { data } = useApp();
  const item = findPlanItem(data.plans, itemId, 'rest');
  if (!item) return <MissingItem screen="rest" title="Rest" body="This rest practice isn't in the plan any more." />;
  return <RestTimer item={item} mid={import.meta.env.DEV && !!mid} />;
}

/**
 * Rest practice (J6b): the kind, a slow ring for the time left, one soft
 * chime at the end, optional voice at start and end. Ending early logs the
 * real duration and leaves the item open (same rule as workouts).
 */
function RestTimer({ item, mid }: { item: RestItem; mid: boolean }) {
  const { cfg, update } = useApp();
  const { close } = useNav();
  const phases = useMemo<Phase[]>(() => [{ kind: 'rest', seconds: item.durationSeconds, round: 1, index: 0, exerciseId: '' }], [item.durationSeconds]);
  const [startUnix] = useState(() => nowUnix() - (mid ? Math.round(item.durationSeconds / 3) : 0));
  const [run, setRun] = useState<Run>(() => {
    const r = startRun(phases, nowMs());
    return mid ? { ...r, elapsedMs: (item.durationSeconds * 1000) / 3 } : r;
  });
  const [logged, setLogged] = useState<RestSession | null>(null);
  const runRef = useRef(run);
  runRef.current = run;
  const finished = isFinished(phases, run) || run.ended;
  const now = useClockMs(!finished && !isPaused(run), 1000);
  const kind = cap(item.restKind);

  const log = (final: Run, full: boolean) => {
    const unix = nowUnix();
    const duration = full ? item.durationSeconds : Math.round(phaseElapsedMs(final, nowMs()) / 1000);
    const s: RestSession = {
      id: newLogId('r', unix),
      restKind: item.restKind,
      startUnix: Math.min(startUnix, unix - duration),
      endUnix: unix,
      durationSeconds: duration,
      completedFull: full,
    };
    update((d) => ({ ...d, rests: [...d.rests, s] }));
    setLogged(s);
  };

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!isPaused(runRef.current)) coach.announce({ beep: null, text: `${kind}. Begin.` });
    }, 0);
    return () => {
      window.clearTimeout(id);
    };
  }, [kind]);

  useEffect(() => {
    const step = tick(phases, runRef.current, now);
    if (!step.entered.length) return;
    runRef.current = step.run;
    setRun(step.run);
    coach.announce({ beep: 'chime', text: `${kind} done.` });
    log(step.run, true);
  }, [now]);

  const toggle = () => {
    const t = nowMs();
    const r = isPaused(runRef.current) ? resume(phases, runRef.current, t) : pause(runRef.current, t);
    runRef.current = r;
    setRun(r);
  };
  const endNow = () => {
    const r = end(runRef.current, nowMs());
    runRef.current = r;
    setRun(r);
    coach.stop();
    log(r, false);
  };

  useBackGuard(() => {
    if (logged) close();
    else if (!isPaused(runRef.current)) toggle();
    else endNow();
  });

  if (logged) {
    const full = logged.completedFull;
    return (
      <FullScreen
        screen="rest"
        title={kind}
        onClose={close}
        footer={
          <Button variant="primary" full onClick={close}>
            Done
          </Button>
        }
      >
        <EmptyState
          icon={full ? Check : Leaf}
          title={full ? `${kind} done` : `${kind} ended early`}
          body={
            full
              ? formatSeconds(logged.durationSeconds)
              : `${formatSeconds(logged.durationSeconds)} logged — the item stays open; a full session completes it.`
          }
        />
      </FullScreen>
    );
  }

  const left = remainingMs(phases, run, now) / 1000;
  const paused = isPaused(run);
  return (
    <FullScreen
      screen="rest"
      title={kind}
      onClose={endNow}
      handsFree={!finished}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button variant="primary" full icon={paused ? Play : Pause} onClick={toggle}>
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button full onClick={endNow} className="min-h-14">
            End
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-6 pt-16">
        <div role="timer" className="flex">
          <ProgressRing value={progress(phases, run, now)} label={`${formatSeconds(Math.ceil(left))} left`} size={256} stroke={6}>
            <span className="flex flex-col items-center gap-1">
              <span className="text-2xl font-semibold tabular-nums text-ink">{formatSeconds(Math.ceil(left))}</span>
              <span className="text-sm font-normal text-ink-muted">{paused ? 'paused' : 'left'}</span>
            </span>
          </ProgressRing>
        </div>
        <p className="text-base text-ink-muted">{paused ? 'Paused. Resume when ready.' : 'Breathe slowly. The chime ends it.'}</p>
      </div>
    </FullScreen>
  );
}
