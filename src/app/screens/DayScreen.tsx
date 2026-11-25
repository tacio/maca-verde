import { useId, useState } from 'react';
import { CalendarX, ChevronRight, Lock, Plus, Trash2, X } from 'lucide-react';
import { WORKOUT_ROUTINES } from '../../data/routines';
import { FOCUS_ROUTINE, findRoutine, focusOfDay } from '../../domain/engine';
import { basicsId, curriculumComplete, knownBefore, knownPrefix, nextLesson, unknownExercises } from '../../domain/curriculum';
import { exerciseName } from '../../workout/exerciseCues';
import { approvalFor, canEditDay, dayStartUnix, findPlan, saveDayPlan } from '../../domain/plan';
import type { TargetMetric } from '../../domain/types';
import { nowUnix } from '../../time/clock';
import { formatSeconds } from '../../time/seconds';
import { cycleOf, formatDuration, shortDay } from '../../time/daykeep';
import { Button, IconButton } from '../../ui/Button';
import { ChipGroup } from '../../ui/Chip';
import { EmptyState } from '../../ui/EmptyState';
import { FullScreen } from '../../ui/FullScreen';
import { ListRow } from '../../ui/ListRow';
import { Stepper } from '../../ui/Stepper';
import { inputClass } from '../../ui/TextField';
import { cx } from '../../ui/cx';
import { useApp } from '../AppContext';
import { cycleDrafts, draftForDay, unlearnedIn, withDrafts } from '../cycle';
import {
  METRIC_LABEL,
  PROBLEM_TEXT,
  REST_KINDS,
  draftFromItems,
  draftToItems,
  formatMetric,
  hintText,
  lastRest,
  lastValue,
  metricText,
  metricsFor,
  minutesHint,
  newRest,
  newWorkout,
  parseDurationInput,
  parseTarget,
  suggestedValue,
  type DayDraft,
  type DraftMain,
} from '../dayDraft';
import { ITEM_ICON } from '../ItemIcon';
import { useNav } from '../nav';
import { itemText, routineName } from '../view';

/** "362.0000": a day's start, short. */
const startStamp = (day: number) => `${shortDay(day, 3)}.0000`;

/** One day's plan: the editor before the day starts (J3), read-only from N.0000 on. */
export function DayScreen({ day, blank }: { day: number; blank?: boolean }) {
  const { now, cfg } = useApp();
  if (!canEditDay(day, now, cfg)) return <LockedDay day={day} />;
  return <DayEditor key={day} day={day} blank={blank} />;
}

/* --- read-only ------------------------------------------------------------ */

function LockedDay({ day }: { day: number }) {
  const { data, cfg } = useApp();
  const { close } = useNav();
  const plan = findPlan(data.plans, day);
  return (
    <FullScreen
      screen="day-locked"
      title={`Day ${shortDay(day, 3)}`}
      onClose={close}
      dismiss="back"
      footer={
        <Button variant="primary" full onClick={close}>
          Done
        </Button>
      }
    >
      <p className="flex items-center gap-2 pb-4 text-sm tabular-nums text-ink-muted">
        <Lock aria-hidden size={15} strokeWidth={2} />
        Locked since {startStamp(day)}
      </p>
      {plan ? (
        <ul className="-mx-3 flex flex-col">
          {plan.items.map((item) => {
            const Icon = ITEM_ICON[item.kind];
            return (
              <li key={item.id}>
                <ListRow
                  leading={<Icon aria-hidden size={20} strokeWidth={1.75} className="text-ink-muted" />}
                  title={itemText(item, cfg, data.routines)}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={CalendarX} title="Nothing was planned" body="This day started without a plan." />
      )}
    </FullScreen>
  );
}

/* --- editor ---------------------------------------------------------------- */

const REST_OPTIONS = REST_KINDS.map((k) => ({ value: k, label: k[0].toUpperCase() + k.slice(1) }));

function DayEditor({ day, blank }: { day: number; blank?: boolean }) {
  const { data, now, cfg, update } = useApp();
  const { close } = useNav();
  const [draft, setDraft] = useState<DayDraft>(() =>
    blank ? { main: [], mood: 0, drill: 0 } : draftFromItems(draftForDay(data, day, now, cfg), cfg),
  );
  const result = draftToItems(draft, day, cfg);
  const approved = !!approvalFor(data.cycles, cycleOf(day));
  const locksIn = formatDuration(dayStartUnix(day, cfg) - now, cfg);

  // P14: what's learned before this day, counting the cycle's pre-filled days before it.
  const context = withDrafts(data.plans, cycleDrafts(data, cycleOf(day), now, cfg));
  const known = knownBefore(day, context, data.lessons, cfg);
  const lessonProblem = (() => {
    if (!result.ok) return null;
    const after = withDrafts(context, [{ day, items: result.items, updatedUnix: now }]);
    const here = unlearnedIn(day, result.items, after, data, cfg);
    if (here.length) return `Learn ${exerciseName(here[0]).toLowerCase()} on an earlier day first`;
    // Removing this day's lesson must not break a later day that uses it.
    for (const p of after) {
      if (p.day <= day || !canEditDay(p.day, now, cfg)) continue;
      const later = unlearnedIn(p.day, p.items, after, data, cfg);
      if (later.length) return `Day ${shortDay(p.day, 3)} uses ${exerciseName(later[0]).toLowerCase()} — keep its lesson`;
    }
    return null;
  })();
  const canSave = result.ok && !lessonProblem;

  const save = () => {
    if (!result.ok || lessonProblem) return;
    update((d) => {
      const r = saveDayPlan(d.plans, day, result.items, nowUnix(), cfg);
      return r.ok ? { ...d, plans: r.plans } : d;
    });
    close();
  };

  const reasonId = useId();
  const footer = (
    <div className="flex flex-col gap-2">
      {!canSave && (
        <p id={reasonId} className="text-center text-sm text-ink-muted">
          {result.ok ? lessonProblem : PROBLEM_TEXT[result.problems[0]]}
        </p>
      )}
      <Button variant="primary" full disabled={!canSave} aria-describedby={canSave ? undefined : reasonId} onClick={save}>
        Save
      </Button>
    </div>
  );

  return (
    <FullScreen screen="day-edit" title={`Day ${shortDay(day, 3)}`} onClose={close} dismiss="back" footer={footer}>
      <p className="pb-5 text-sm tabular-nums text-ink-muted">
        Editable until {startStamp(day)} · locks in {locksIn}
        {approved ? '' : ' · draft'}
      </p>

      <DraftEditor draft={draft} setDraft={setDraft} focusDay={day} known={known} />
    </FullScreen>
  );
}

/**
 * The items of one plan being edited: workout and rest cards, + Workout / + Rest,
 * and the mood/drill counts. Shared by the day editor and the template slot editor.
 */
export function DraftEditor({
  draft,
  setDraft,
  focusDay,
  known,
}: {
  draft: DayDraft;
  setDraft: (fn: (d: DayDraft) => DayDraft) => void;
  /** Day whose rotation picks the routine of a new workout. */
  focusDay: number;
  /** Exercises learned before the day (P14); without it (template slots) lessons aren't offered. */
  known?: ReadonlySet<string>;
}) {
  const { data, cfg } = useApp();
  const custom = data.routines;
  const day = focusDay;
  const setMain = (key: string, fn: (m: DraftMain) => DraftMain | null) =>
    setDraft((d) => ({ ...d, main: d.main.flatMap((m) => (m.key === key ? (fn(m) ?? []) : [m])) }));
  const learning = known !== undefined && !curriculumComplete(known);
  const lesson = known === undefined ? undefined : nextLesson(known);
  // While learning, a new workout is the Basics of what's known; none before the first lesson.
  const n = known === undefined ? 0 : knownPrefix(known);
  const newRoutine = learning ? (n > 0 ? basicsId(n) : undefined) : FOCUS_ROUTINE[focusOfDay(day)];
  return (
    <>
      <div className="flex flex-col gap-4">
        {draft.learn && <LessonCard skillId={draft.learn} onRemove={() => setDraft((d) => ({ ...d, learn: undefined }))} />}
        {draft.main.map((m) =>
          m.kind === 'workout' ? (
            <WorkoutCard key={m.key} item={m} known={known} onChange={(fn) => setMain(m.key, fn)} />
          ) : (
            <RestCard key={m.key} item={m} onChange={(fn) => setMain(m.key, fn)} />
          ),
        )}
        {draft.main.length === 0 && (
          <p className="rounded-card border border-dashed border-line p-4 text-base text-ink-muted">
            No workout or rest yet. Rest is a plan too.
          </p>
        )}
        <div className={cx('grid gap-2', !draft.learn && lesson ? 'grid-cols-3' : 'grid-cols-2')}>
          {!draft.learn && lesson && (
            <Button icon={Plus} onClick={() => setDraft((d) => ({ ...d, learn: lesson }))}>
              Lesson
            </Button>
          )}
          <Button
            icon={Plus}
            disabled={!newRoutine}
            onClick={() => newRoutine && setDraft((d) => ({ ...d, main: [...d.main, newWorkout(newRoutine, data.sessions, cfg, custom)] }))}
          >
            Workout
          </Button>
          <Button icon={Plus} onClick={() => setDraft((d) => ({ ...d, main: [...d.main, newRest(cfg)] }))}>
            Rest
          </Button>
        </div>
      </div>

      <section aria-label="Checks" className="mt-6 flex flex-col border-t border-line pt-3">
        <Stepper
          label="Mood checks"
          value={draft.mood}
          min={0}
          max={10}
          hint={draft.mood === 0 ? 'Not planned' : undefined}
          onChange={(mood) => setDraft((d) => ({ ...d, mood }))}
        />
        <Stepper
          label="Pause drills"
          value={draft.drill}
          min={0}
          max={10}
          hint={draft.drill === 0 ? 'Not planned' : undefined}
          onChange={(drill) => setDraft((d) => ({ ...d, drill }))}
        />
      </section>
    </>
  );
}

type Patch = (fn: (m: DraftMain) => DraftMain | null) => void;

const card = 'flex flex-col gap-3 rounded-card border border-line bg-surface p-4';

/** The day's lesson (P14): what it teaches, a way to preview it, and remove. */
function LessonCard({ skillId, onRemove }: { skillId: string; onRemove: () => void }) {
  const { open } = useNav();
  const Icon = ITEM_ICON.learn;
  return (
    <div className={card}>
      <div className="flex items-center gap-2">
        <Icon aria-hidden size={20} strokeWidth={1.75} className="shrink-0 text-ink-muted" />
        <h2 className="min-w-0 flex-1 truncate text-base font-medium text-ink">Learn · {exerciseName(skillId)}</h2>
        <IconButton icon={Trash2} label="Remove lesson" onClick={onRemove} />
      </div>
      <Button variant="quiet" icon={ChevronRight} className="self-start px-2" onClick={() => open(`lesson:${skillId}`)}>
        Preview lesson
      </Button>
    </div>
  );
}

function WorkoutCard({
  item,
  known,
  onChange,
}: {
  item: Extract<DraftMain, { kind: 'workout' }>;
  known?: ReadonlySet<string>;
  onChange: Patch;
}) {
  const { data, cfg } = useApp();
  const custom = data.routines;
  const [adding, setAdding] = useState(false);
  const selectId = useId();
  const current = findRoutine(item.routineId, custom);
  // While learning, the Basics of what's known is offered too; routines with unlearned exercises are locked (P14).
  const basics = known && !curriculumComplete(known) && knownPrefix(known) > 0 ? findRoutine(basicsId(knownPrefix(known))) : undefined;
  const routines = [
    ...(current && !WORKOUT_ROUTINES.includes(current) && !custom.includes(current) ? [current] : []),
    ...(basics && basics.id !== current?.id ? [basics] : []),
    ...WORKOUT_ROUTINES,
    ...custom,
  ];
  const lockedBy = (r: (typeof routines)[number]) => (known ? unknownExercises(r, known)[0] : undefined);
  const used = new Set(item.targets.map((t) => t.metric));
  const missing = metricsFor(item.routineId, custom).filter((m) => !used.has(m));
  const Icon = ITEM_ICON.workout;

  const setTargets = (fn: (t: typeof item.targets) => typeof item.targets) =>
    onChange((m) => (m.kind === 'workout' ? { ...m, targets: fn(m.targets) } : m));

  const addTarget = (metric: TargetMetric) => {
    const v = suggestedValue(metric, item.routineId, data.sessions, custom) ?? lastValue(metric, item.routineId, data.sessions);
    setTargets((ts) => [...ts, { metric, text: v === null ? '' : metricText(metric, v, cfg), ...(v === null ? {} : { value: v }) }]);
    setAdding(false);
  };

  return (
    <div className={card}>
      <div className="flex items-center gap-2">
        <Icon aria-hidden size={20} strokeWidth={1.75} className="shrink-0 text-ink-muted" />
        <label htmlFor={selectId} className="sr-only">
          Routine
        </label>
        <select
          id={selectId}
          value={item.routineId}
          onChange={(e) => {
            const fresh = newWorkout(e.target.value, data.sessions, cfg, custom);
            onChange(() => ({ ...fresh, key: item.key }));
          }}
          className={cx(inputClass, 'min-w-0 flex-1 font-medium')}
        >
          {routines.map((r) => {
            const lock = r.id === item.routineId ? undefined : lockedBy(r);
            return (
              <option key={r.id} value={r.id} disabled={!!lock}>
                {routineName(r.id, custom)}
                {lock ? ` · after lesson: ${exerciseName(lock).toLowerCase()}` : ''}
              </option>
            );
          })}
        </select>
        <IconButton icon={Trash2} label="Remove workout" onClick={() => onChange(() => null)} />
      </div>

      {item.targets.map((t, i) => (
        <TargetRow
          key={t.metric}
          metric={t.metric}
          text={t.text}
          routineId={item.routineId}
          onText={(text) => setTargets((ts) => ts.map((x, j) => (j === i ? { ...x, text } : x)))}
          onRemove={() => setTargets((ts) => ts.filter((_, j) => j !== i))}
        />
      ))}

      {missing.length > 0 &&
        (adding ? (
          <div role="group" aria-label="Add a target" className="flex flex-wrap gap-2">
            {missing.map((m) => (
              <Button key={m} icon={Plus} onClick={() => addTarget(m)}>
                {METRIC_LABEL[m]}
              </Button>
            ))}
          </div>
        ) : (
          <Button variant="quiet" icon={Plus} className="self-start px-2" onClick={() => setAdding(true)}>
            Target
          </Button>
        ))}
    </div>
  );
}

function TargetRow({
  metric,
  text,
  routineId,
  onText,
  onRemove,
}: {
  metric: TargetMetric;
  text: string;
  routineId: string;
  onText: (text: string) => void;
  onRemove: () => void;
}) {
  const { data, cfg } = useApp();
  const id = useId();
  const label = METRIC_LABEL[metric];
  const last = lastValue(metric, routineId, data.sessions);
  const suggested = suggestedValue(metric, routineId, data.sessions, data.routines);
  const invalid = parseTarget(metric, text, cfg) === null;
  const hint = hintText(
    last === null ? null : formatMetric(metric, last, cfg),
    suggested === null ? null : formatMetric(metric, suggested, cfg),
  );
  return (
    <div data-target className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <label htmlFor={id} className="min-w-0 flex-1 truncate text-base text-ink">
          {label}
          {(metric === 'hangSeconds' || metric === 'totalSeconds') && <span className="text-ink-muted"> (s)</span>}
        </label>
        <input
          id={id}
          data-target-input
          inputMode="numeric"
          autoComplete="off"
          value={text}
          aria-invalid={invalid || undefined}
          aria-describedby={`${id}-hint`}
          onChange={(e) => onText(e.target.value)}
          className={cx(inputClass, 'w-24 text-right')}
        />
        <IconButton icon={X} label={`Remove ${label.toLowerCase()} target`} onClick={onRemove} className="-mr-2" />
      </div>
      <p id={`${id}-hint`} data-last-hint className="truncate text-sm tabular-nums text-ink-muted">
        {hint}
      </p>
    </div>
  );
}

function RestCard({ item, onChange }: { item: Extract<DraftMain, { kind: 'rest' }>; onChange: Patch }) {
  const { data, cfg } = useApp();
  const id = useId();
  const Icon = ITEM_ICON.rest;
  const seconds = parseDurationInput(item.text, cfg);
  const last = lastRest(item.restKind, data.rests);
  const set = (patch: Partial<Extract<DraftMain, { kind: 'rest' }>>) => onChange((m) => (m.kind === 'rest' ? { ...m, ...patch } : m));
  return (
    <div className={card}>
      <div className="flex items-center gap-2">
        <Icon aria-hidden size={20} strokeWidth={1.75} className="shrink-0 text-ink-muted" />
        <h2 className="flex-1 text-base font-medium text-ink">Rest</h2>
        <IconButton icon={Trash2} label="Remove rest" onClick={() => onChange(() => null)} />
      </div>
      <ChipGroup label="Rest kind" options={REST_OPTIONS} value={item.restKind} onChange={(v) => v && set({ restKind: v })} />
      <div data-target className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <label htmlFor={id} className="min-w-0 flex-1 truncate text-base text-ink">
            Duration <span className="text-ink-muted">(s)</span>
          </label>
          <span aria-hidden className="text-sm tabular-nums text-ink-muted">
            {seconds === null ? '' : minutesHint(seconds)}
          </span>
          <input
            id={id}
            data-target-input
            inputMode="numeric"
            autoComplete="off"
            value={item.text}
            aria-invalid={seconds === null || undefined}
            aria-describedby={`${id}-hint`}
            onChange={(e) => set({ text: e.target.value })}
            className={cx(inputClass, 'w-24 text-right')}
          />
        </div>
        <p id={`${id}-hint`} data-last-hint className="truncate text-sm tabular-nums text-ink-muted">
          {last === null ? 'no data yet' : `last ${formatSeconds(last)}`} · in seconds
        </p>
      </div>
    </div>
  );
}
