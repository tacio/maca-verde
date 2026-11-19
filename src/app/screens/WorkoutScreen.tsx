import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, SkipForward, Square } from 'lucide-react';
import { EXERCISES } from '../../data/exercises';
import { phaseAnnouncement } from '../../audio/announce';
import { coach } from '../../audio/coach';
import type { WorkoutItem, WorkoutRoutine } from '../../domain/types';
import { nowMs, nowUnix } from '../../time/clock';
import { Button } from '../../ui/Button';
import { Disclosure } from '../../ui/Disclosure';
import { Sheet } from '../../ui/Sheet';
import { cx } from '../../ui/cx';
import { exerciseName } from '../../workout/exerciseCues';
import { setPendingResult } from '../../workout/handoff';
import { workoutResult } from '../../workout/log';
import {
  buildPhases,
  displaySeconds,
  end,
  isFinished,
  isPaused,
  isRestKind,
  nextLine,
  pause,
  progress,
  remainingMs,
  resume,
  skip,
  startRun,
  summarize,
  tick,
  type Phase,
  type Run,
  type Step,
} from '../../workout/phases';
import { useApp } from '../AppContext';
import { findPlanItem } from '../items';
import { useBackGuard, useNav } from '../nav';
import { useClockMs, useWakeLock } from '../timers';
import { scaledRoutine } from '../today';
import { MissingItem } from './MissingItem';

/** Dev scenarios open the HUD at a phase: `workout:<id>:work|rest|paused`. */
export type HudStart = 'work' | 'rest' | 'paused';

/** The workout flow (`workout:<itemId>`): the HUD for a plan item's routine. */
export function WorkoutScreen({ itemId, start }: { itemId: string; start?: HudStart }) {
  const { data } = useApp();
  const item = findPlanItem(data.plans, itemId, 'workout');
  // Scaled once, at the start: the session doesn't change under the user's feet.
  const [routine] = useState(() => (item ? scaledRoutine(item.routineId, data.sessions, data.routines) : undefined));
  if (!item || !routine || routine.exercises.length === 0)
    return <MissingItem screen="workout" title="Workout" body="This workout isn't in the plan any more." />;
  return <Hud item={item} routine={routine} start={start} />;
}

const TONE = {
  work: { screen: 'bg-accent text-accent-ink', solid: 'bg-accent-ink text-accent' },
  rest: { screen: 'bg-rest text-rest-ink', solid: 'bg-rest-ink text-rest' },
  prep: { screen: 'bg-canvas text-ink', solid: 'bg-accent text-accent-ink' },
} as const;

function initialRun(phases: Phase[], start: HudStart | undefined): Run {
  const now = nowMs();
  if (!import.meta.env.DEV || !start) return startRun(phases, now);
  const at = phases.findIndex((p) => (start === 'rest' ? isRestKind(p.kind) : p.kind === 'work'));
  const run = startRun(phases, now, Math.max(0, at));
  return start === 'paused' ? pause(run, now) : run;
}

/**
 * Workout HUD (J4, P12): glanceable from 3 m, hands-free. Only the round and
 * position, a progress strip, the exercise, bare seconds and what's next;
 * work and rest differ by full-screen color. Two controls: Pause and Skip.
 * Every phase change is announced by the coach; the time is derived from
 * timestamps, so it never drifts and survives backgrounding.
 */
function Hud({ item, routine, start }: { item: WorkoutItem; routine: WorkoutRoutine; start?: HudStart }) {
  const { replace } = useNav();
  const phases = useMemo(() => buildPhases(routine), [routine]);
  const [startUnix] = useState(nowUnix);
  const [run, setRun] = useState<Run>(() => initialRun(phases, start));
  const [sheet, setSheet] = useState(start === 'paused');
  const runRef = useRef(run);
  runRef.current = run;
  const finished = isFinished(phases, run);
  const now = useClockMs(!finished && !isPaused(run));
  const lastSecs = useRef<number | null>(null);
  const leaving = useRef<'finish' | 'end' | null>(null);
  const exercises = routine.exercises.length;

  useWakeLock(!finished);

  const leave = (final: Run, how: 'finish' | 'end') => {
    if (leaving.current) return;
    leaving.current = how;
    const summary = summarize(phases, final, routine.rounds);
    setPendingResult(workoutResult(item, routine, summary, startUnix, nowUnix()));
    replace(`workout-log:${item.id}`);
  };

  const apply = (step: Step) => {
    runRef.current = step.run;
    setRun(step.run);
    const last = step.entered[step.entered.length - 1];
    if (last === undefined) return;
    lastSecs.current = null;
    // Only the phase we're in now is announced (a late tick may cross several).
    coach.announce(phaseAnnouncement(phases, last, routine.rounds));
    if (last >= phases.length) leave(step.run, 'finish');
  };

  // Announce the opening phase; deferred so StrictMode's double effect doesn't speak twice.
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!isPaused(runRef.current)) coach.announce(phaseAnnouncement(phases, runRef.current.index, routine.rounds));
    }, 0);
    return () => {
      window.clearTimeout(id);
      // The finish words keep playing over the log screen; anything else stops with the HUD.
      if (leaving.current !== 'finish') coach.stop();
    };
  }, [phases, routine.rounds]);

  // The clock moved: complete phases whose time is up; 3-2-1 ticks.
  useEffect(() => {
    const step = tick(phases, runRef.current, now);
    if (step.entered.length) return apply(step);
    if (isPaused(runRef.current)) return;
    const secs = displaySeconds(remainingMs(phases, runRef.current, now));
    if (secs !== lastSecs.current) {
      if (lastSecs.current !== null && secs >= 1 && secs <= 3) coach.tick();
      lastSecs.current = secs;
    }
  }, [now]);

  const pauseNow = () => {
    const r = pause(runRef.current, nowMs());
    runRef.current = r;
    setRun(r);
    setSheet(true);
    coach.stop();
  };
  const resumeNow = () => {
    const r = resume(phases, runRef.current, nowMs());
    runRef.current = r;
    setRun(r);
    setSheet(false);
  };
  const skipNow = () => apply(skip(phases, runRef.current, nowMs()));
  const endNow = () => {
    coach.stop();
    setSheet(false);
    leave(end(runRef.current, nowMs()), 'end');
  };

  // Android back: pause (the sheet offers End), never a silent exit.
  useBackGuard(() => {
    if (!isPaused(runRef.current)) pauseNow();
    else setSheet(true);
  });

  const p = phases[Math.min(run.index, phases.length - 1)];
  const tone = p.kind === 'work' ? 'work' : isRestKind(p.kind) ? 'rest' : 'prep';
  const secs = finished ? 0 : displaySeconds(remainingMs(phases, run, now));
  const pct = Math.round(progress(phases, run, now) * 100);
  const title = p.kind === 'work' ? exerciseName(p.exerciseId) : p.kind === 'prep' ? 'Get ready' : 'Rest';
  const nextText = nextLine(phases, run.index);
  const how = EXERCISES[p.exerciseId];
  const howName = exerciseName(p.exerciseId);

  return (
    <div
      data-screen="workout"
      data-phase={p.kind}
      className={cx('flex min-h-dvh w-full flex-col transition-colors duration-base ease-calm', TONE[tone].screen)}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <p className="text-xl font-semibold tabular-nums">
          Round {p.round}/{routine.rounds} · {p.index + 1} of {exercises}
        </p>
        <div
          role="progressbar"
          aria-label="Workout progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="relative mt-3 h-2.5 overflow-hidden rounded-full"
        >
          <span aria-hidden className="absolute inset-0 bg-current opacity-25" />
          <span aria-hidden className="absolute inset-y-0 left-0 rounded-full bg-current" style={{ width: `${pct}%` }} />
        </div>

        <main className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">{title}</h1>
          <p
            data-hud-digits
            role="timer"
            aria-label={`${secs} seconds left`}
            className="font-semibold leading-none tracking-tighter tabular-nums text-hud"
            style={secs >= 100 ? { fontSize: 'calc(var(--hud-digits) * 0.72)' } : undefined}
          >
            {secs}
          </p>
          <p className="text-2xl font-medium">{nextText}</p>
        </main>

        <div className="grid grid-cols-[3fr_2fr] gap-3">
          <button
            type="button"
            data-hud-control
            data-primary={sheet ? undefined : ''}
            onClick={pauseNow}
            disabled={finished}
            className={cx(
              'flex min-h-24 items-center justify-center gap-2 rounded-card text-2xl font-semibold',
              'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-current',
              TONE[tone].solid,
            )}
          >
            <Pause aria-hidden size={28} strokeWidth={2.25} />
            Pause
          </button>
          <button
            type="button"
            data-hud-control
            onClick={skipNow}
            disabled={finished}
            className={cx(
              'flex min-h-24 items-center justify-center gap-2 rounded-card border-2 border-current text-2xl font-semibold',
              'focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-current',
            )}
          >
            <SkipForward aria-hidden size={26} strokeWidth={2.25} />
            Skip
          </button>
        </div>
      </div>

      <Sheet
        open={sheet}
        onClose={resumeNow}
        title="Paused"
        footer={
          <>
            <Button variant="primary" full icon={Play} onClick={resumeNow}>
              Resume
            </Button>
            <Button full icon={Square} onClick={endNow}>
              End workout
            </Button>
          </>
        }
      >
        <p className="text-base tabular-nums text-ink-muted">
          {p.kind === 'work' ? `${howName} · ${secs} s left` : `${title} · ${secs} s left · next: ${howName}`}
        </p>
        {how && (
          <Disclosure summary={`How? · ${howName}`}>
            <ul className="list-disc pl-4">
              {how.formPoints.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {how.cadenceTip && <p className="pt-1">{how.cadenceTip}</p>}
          </Disclosure>
        )}
      </Sheet>
    </div>
  );
}
