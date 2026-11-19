import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { coach } from '../../audio/coach';
import {
  ELEVATE_SECONDS,
  FREEZE_SECONDS,
  SIGH_CYCLES,
  SIGH_PHASE_MS,
  SIGH_TOTAL_MS,
  SIGH_WORD,
  STEP_COPY,
  buildDrillLog,
  drillSteps,
  nextStep,
  pickScenario,
  replyOptions,
  sighAt,
  type DrillStep,
  type ReplyOption,
  type SighPhase,
} from '../../drill/drill';
import { EMOTIONAL_SCENARIOS } from '../../data/emotionalScenarios';
import { nowMs, nowUnix } from '../../time/clock';
import { Button } from '../../ui/Button';
import { Disclosure } from '../../ui/Disclosure';
import { FullScreen } from '../../ui/FullScreen';
import { cx, focusRing } from '../../ui/cx';
import { useApp } from '../AppContext';
import { useNav } from '../nav';
import { newLogId } from '../today';
import { useClockMs } from '../timers';

/**
 * Pause drill (J6): Elevate → Freeze → Sigh → Scenario, full-screen and
 * voice-guided; one instruction line per step, the science behind "Why?".
 * `from` starts later: after a workout the flow is `drill:after-workout`
 * (starts at Freeze, pulse already up); dev scenarios use `drill:<step>`.
 */
export function DrillScreen({ from, afterWorkout }: { from: DrillStep; afterWorkout: boolean }) {
  const { data, update } = useApp();
  const { close } = useNav();
  const [steps] = useState(() => drillSteps(from));
  const [step, setStep] = useState<DrillStep>(steps[0]);
  const [stepStart, setStepStart] = useState(nowMs);
  const [freezeSeconds, setFreezeSeconds] = useState(0);
  // Dev scenarios that open at a step get the first scenario in a fixed order, so screenshots are stable.
  const devStep = import.meta.env.DEV && !afterWorkout && from !== 'elevate';
  const [scenario] = useState(() =>
    devStep
      ? EMOTIONAL_SCENARIOS[0]
      : pickScenario(data.drills.reduce<{ unix: number; id?: string } | null>((a, d) => (!a || d.unix > a.unix ? { unix: d.unix, id: d.scenarioId } : a), null)?.id),
  );
  const [options] = useState(() => replyOptions(scenario, devStep ? () => 0 : Math.random));
  const [choice, setChoice] = useState<number | null>(null);
  const timed = step !== 'scenario';
  const now = useClockMs(timed);
  const elapsed = Math.max(0, now - stepStart);
  // Numbered within the whole drill (4 steps; 3 after a workout), even when a dev scenario opens mid-way.
  const allSteps = drillSteps(afterWorkout ? 'freeze' : 'elevate');
  const index = allSteps.indexOf(step);
  const copy = STEP_COPY[step];

  const goNext = () => {
    const t = nowMs();
    if (step === 'freeze') setFreezeSeconds(Math.min(FREEZE_SECONDS, (t - stepStart) / 1000));
    const n = nextStep(steps, step);
    if (n) {
      setStep(n);
      setStepStart(t);
    }
  };

  // Speak each step as it starts (deferred: StrictMode mounts effects twice in dev).
  useEffect(() => {
    const id = window.setTimeout(() => coach.announce({ beep: step === 'elevate' ? 'start' : null, text: STEP_COPY[step].say }), 0);
    return () => window.clearTimeout(id);
  }, [step]);
  useEffect(() => () => coach.stop(), []);

  // Timed steps end on their own; 3-2-1 ticks before they do.
  const limitMs = step === 'elevate' ? ELEVATE_SECONDS * 1000 : step === 'freeze' ? FREEZE_SECONDS * 1000 : step === 'sigh' ? SIGH_TOTAL_MS : null;
  const remaining = limitMs === null ? 0 : Math.max(0, limitMs - elapsed);
  const secs = Math.ceil(remaining / 1000 - 1e-9);
  const lastSecs = useRef<number | null>(null);
  useEffect(() => {
    if (limitMs === null) return;
    if (remaining <= 0) {
      lastSecs.current = null;
      goNext();
      return;
    }
    if (step !== 'sigh' && secs !== lastSecs.current) {
      if (lastSecs.current !== null && secs >= 1 && secs <= 3) coach.tick();
      lastSecs.current = secs;
    }
  }, [now]);

  // Breathing words, one per breath phase.
  const sigh = step === 'sigh' ? sighAt(elapsed) : null;
  const sighKey = sigh ? `${sigh.cycle}:${sigh.phase}` : '';
  useEffect(() => {
    if (!sigh || sigh.phase === 'ready' || sigh.phase === 'done') return;
    coach.announce({ beep: null, text: SIGH_WORD[sigh.phase] });
  }, [sighKey]);

  const finish = () => {
    if (choice === null) return;
    const unix = nowUnix();
    const log = buildDrillLog(
      { afterWorkout, freezeSeconds: steps.includes('freeze') ? freezeSeconds : 0, scenarioId: scenario.id, pausedReply: options[choice].paused },
      newLogId('d', unix),
      unix,
    );
    update((d) => ({ ...d, drills: [...d.drills, log] }));
    close();
  };

  const footer =
    step === 'scenario' ? (
      <Button variant="primary" full icon={Check} disabled={choice === null} onClick={finish}>
        Finish
      </Button>
    ) : (
      <Button variant="primary" full onClick={goNext}>
        Next
      </Button>
    );

  return (
    <FullScreen screen="drill" title="Pause drill" onClose={close} footer={footer}>
      <div data-step={step} className="flex flex-col gap-1 pt-2">
        <p className="text-sm font-medium tabular-nums text-ink-muted">
          Step {index + 1} of {allSteps.length}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">{copy.title}</h2>
        <p className="text-base text-ink">{copy.line}</p>
        <Disclosure summary="Why?">{copy.why}</Disclosure>
      </div>

      {(step === 'elevate' || step === 'freeze') && (
        <div className="flex flex-col items-center py-10">
          <p role="timer" aria-label={`${secs} seconds left`} className="text-8xl font-semibold tabular-nums tracking-tight text-ink">
            {secs}
          </p>
          <p className="text-base text-ink-muted">{step === 'freeze' ? 'seconds of stillness' : 'seconds'}</p>
        </div>
      )}

      {sigh && <Breath phase={sigh.phase} cycle={sigh.cycle} />}

      {step === 'scenario' && <ScenarioStep situation={scenario.situation} tip={scenario.mentalPauseTip} options={options} choice={choice} onChoose={setChoice} />}
    </FullScreen>
  );
}

/** Scale of the breathing circle per phase; the transition runs over the phase's own length. */
const BREATH: Record<SighPhase, { scale: number; ms: number; label: string }> = {
  ready: { scale: 0.62, ms: 600, label: 'Get ready' },
  inhale: { scale: 0.9, ms: SIGH_PHASE_MS.inhale, label: 'In' },
  topup: { scale: 1, ms: SIGH_PHASE_MS.topup, label: 'Once more' },
  exhale: { scale: 0.62, ms: SIGH_PHASE_MS.exhale, label: 'Out, slowly' },
  done: { scale: 0.62, ms: 600, label: 'Done' },
};

function Breath({ phase, cycle }: { phase: SighPhase; cycle: number }) {
  const b = BREATH[phase];
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative flex size-64 items-center justify-center">
        <span
          aria-hidden
          className={cx(
            'absolute inset-0 rounded-full ease-in-out motion-reduce:transition-none',
            phase === 'exhale' ? 'bg-rest' : 'bg-accent',
          )}
          style={{ transform: `scale(${b.scale})`, transition: `transform ${b.ms}ms ease-in-out, background-color 600ms ease-in-out`, opacity: 0.18 }}
        />
        <span
          aria-hidden
          className={cx('absolute inset-0 rounded-full border-4 motion-reduce:transition-none', phase === 'exhale' ? 'border-rest' : 'border-accent')}
          style={{ transform: `scale(${b.scale})`, transition: `transform ${b.ms}ms ease-in-out` }}
        />
        <p aria-live="polite" className="relative text-2xl font-semibold text-ink">
          {b.label}
        </p>
      </div>
      <p className="text-sm tabular-nums text-ink-muted">{cycle === 0 ? `${SIGH_CYCLES} breaths` : `Breath ${cycle} of ${SIGH_CYCLES}`}</p>
    </div>
  );
}

function ScenarioStep({
  situation,
  tip,
  options,
  choice,
  onChoose,
}: {
  situation: string;
  tip: string;
  options: ReplyOption[];
  choice: number | null;
  onChoose: (i: number) => void;
}) {
  const chosen = choice === null ? null : options[choice];
  return (
    <div className="flex flex-col gap-4 pt-4">
      <p data-allow-long className="rounded-card bg-surface-2 px-4 py-3 text-base leading-relaxed text-ink">
        {situation}
      </p>
      <div role="radiogroup" aria-label="Your reply" className="flex flex-col gap-2">
        {options.map((o, i) => {
          const on = choice === i;
          const reveal = choice !== null;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChoose(i)}
              data-allow-long
              className={cx(
                'flex min-h-14 flex-col items-start gap-1 rounded-card border px-4 py-3 text-left text-base text-ink',
                'transition-colors duration-fast ease-calm',
                on ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:bg-surface-2',
                focusRing,
              )}
            >
              {reveal && (
                <span className="text-sm font-medium text-ink-muted">{o.paused ? 'The paused reply' : 'The impulse'}</span>
              )}
              <span>{o.text}</span>
            </button>
          );
        })}
      </div>
      {chosen && (
        <p data-allow-long className="rounded-card bg-accent-soft px-4 py-3 text-sm leading-relaxed text-ink">
          {chosen.paused ? 'That was the pause. ' : 'That was the impulse — the pause is the other one. '}
          {tip}
        </p>
      )}
    </div>
  );
}
