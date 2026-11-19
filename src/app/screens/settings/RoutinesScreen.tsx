import { useId, useState } from 'react';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import { EXERCISE_LIST } from '../../../data/exercises';
import { WORKOUT_ROUTINES } from '../../../data/routines';
import { exerciseName } from '../../../workout/exerciseCues';
import { findRoutine } from '../../../domain/engine';
import { nowUnix } from '../../../time/clock';
import { formatSeconds } from '../../../time/seconds';
import { routineSeconds } from '../../../workout/phases';
import { Button, IconButton } from '../../../ui/Button';
import { ChipGroup } from '../../../ui/Chip';
import { FullScreen } from '../../../ui/FullScreen';
import { ListRow } from '../../../ui/ListRow';
import { Sheet } from '../../../ui/Sheet';
import { Stepper } from '../../../ui/Stepper';
import { TextField, inputClass } from '../../../ui/TextField';
import { cx } from '../../../ui/cx';
import { useApp } from '../../AppContext';
import { useNav } from '../../nav';
import {
  LIMITS,
  PROTOCOLS,
  ROUTINE_PROBLEM_TEXT,
  buildRoutine,
  draftFromRoutine,
  emptyRoutineDraft,
  newExercise,
  routineInUse,
  routineMeta,
  type ExerciseDraft,
  type RoutineDraft,
} from '../../routineDraft';
import { newLogId } from '../../today';
import { routineName } from '../../view';
import { ExerciseList } from '../WorkoutPreview';

/** Routines (J9): your own (editable) and the built-in ones (read-only). */
export function RoutinesScreen() {
  const { data } = useApp();
  const { open, close } = useNav();
  return (
    <FullScreen
      screen="settings-routines"
      title="Routines"
      onClose={close}
      dismiss="back"
      footer={
        <Button variant="primary" full icon={Plus} onClick={() => open('settings-routine-edit:new')}>
          New routine
        </Button>
      }
    >
      <section aria-labelledby="own-title" className="pb-5">
        <h2 id="own-title" className="pb-1 text-sm font-medium text-ink-muted">
          Yours
        </h2>
        {data.routines.length ? (
          <ul className="-mx-3 flex flex-col">
            {data.routines.map((r) => (
              <li key={r.id}>
                <ListRow
                  title={r.title}
                  meta={`${routineMeta(r)} · ${formatSeconds(routineSeconds(r))}`}
                  trailing={<ChevronRight aria-hidden size={18} />}
                  onClick={() => open(`settings-routine-edit:${r.id}`)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-card border border-dashed border-line p-4 text-base text-ink-muted">No routines of your own yet.</p>
        )}
      </section>
      <section aria-labelledby="builtin-title">
        <h2 id="builtin-title" className="pb-1 text-sm font-medium text-ink-muted">
          Built-in
        </h2>
        <ul className="-mx-3 flex flex-col">
          {WORKOUT_ROUTINES.map((r) => (
            <li key={r.id}>
              <ListRow
                title={routineName(r.id)}
                meta={`${routineMeta(r)} · ${formatSeconds(routineSeconds(r))}`}
                trailing={<ChevronRight aria-hidden size={18} />}
                onClick={() => open(`settings-routine:${r.id}`)}
              />
            </li>
          ))}
        </ul>
      </section>
    </FullScreen>
  );
}

/** A built-in routine, read-only, with "How?" per exercise. */
export function RoutineViewScreen({ id }: { id: string }) {
  const { data } = useApp();
  const { close } = useNav();
  const r = findRoutine(id, data.routines);
  return (
    <FullScreen
      screen="settings-routine"
      title={r ? routineName(r.id, data.routines) : 'Routine'}
      onClose={close}
      dismiss="back"
      footer={
        <Button variant="primary" full onClick={close}>
          Done
        </Button>
      }
    >
      {r ? (
        <>
          <p className="pb-3 text-sm tabular-nums text-ink-muted">
            {routineMeta(r)} · {formatSeconds(routineSeconds(r))}
            {r.rounds > 1 ? ` · ${r.roundRestSeconds} s between rounds` : ''}
          </p>
          <ExerciseList exercises={r.exercises} />
        </>
      ) : (
        <p className="text-base text-ink-muted">This routine no longer exists.</p>
      )}
    </FullScreen>
  );
}

// Short names, as in the HUD and the workout preview.
const EXERCISE_OPTIONS = EXERCISE_LIST.map((e) => ({ id: e.id, name: exerciseName(e.id) })).sort((a, b) => a.name.localeCompare(b.name));

/** Create or edit a custom routine: name, protocol, rounds, rest between rounds, exercises with work/rest seconds. */
export function RoutineEditScreen({ id }: { id: string }) {
  const { data, record, update } = useApp();
  const { close } = useNav();
  const existing = id === 'new' ? undefined : data.routines.find((r) => r.id === id);
  const [draft, setDraft] = useState<RoutineDraft>(() => (existing ? draftFromRoutine(existing) : emptyRoutineDraft()));
  const [deleting, setDeleting] = useState(false);
  const others = data.routines.filter((r) => r.id !== existing?.id);
  const result = buildRoutine(draft, existing?.id ?? newLogId('custom', nowUnix()), others);
  const reason = result.ok ? null : ROUTINE_PROBLEM_TEXT[result.problems[0]];
  const reasonId = useId();
  const roundRestId = useId();
  const inUse = existing ? routineInUse(existing.id, data, record.today) : null;

  const set = (patch: Partial<RoutineDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const setEx = (key: string, patch: Partial<ExerciseDraft> | null) =>
    setDraft((d) => ({
      ...d,
      exercises: d.exercises.flatMap((e) => (e.key !== key ? [e] : patch === null ? [] : [{ ...e, ...patch }])),
    }));

  const save = () => {
    if (!result.ok) return;
    const r = result.routine;
    update((d) => ({
      ...d,
      routines: d.routines.some((x) => x.id === r.id) ? d.routines.map((x) => (x.id === r.id ? r : x)) : [...d.routines, r],
    }));
    close();
  };

  const remove = () => {
    if (!existing || inUse) return;
    update((d) => ({ ...d, routines: d.routines.filter((r) => r.id !== existing.id) }));
    setDeleting(false);
    close();
  };

  return (
    <FullScreen
      screen="settings-routine-edit"
      title={existing ? 'Edit routine' : 'New routine'}
      onClose={close}
      dismiss="back"
      footer={
        !deleting && (
          <div className="flex flex-col gap-2">
            {reason && (
              <p id={reasonId} className="text-center text-sm text-ink-muted">
                {reason}
              </p>
            )}
            <Button variant="primary" full disabled={!result.ok} aria-describedby={reason ? reasonId : undefined} onClick={save}>
              Save
            </Button>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-5">
        <TextField
          label="Name"
          value={draft.name}
          maxLength={LIMITS.nameMax}
          onChange={(e) => set({ name: e.target.value })}
          autoComplete="off"
          placeholder="Morning rope"
        />
        <ChipGroup
          label="Protocol"
          showLabel
          options={PROTOCOLS}
          value={draft.protocol}
          onChange={(v) => v && set({ protocol: v })}
        />
        <div className="flex flex-col">
          <Stepper label="Rounds" value={draft.rounds} min={1} max={LIMITS.roundsMax} onChange={(rounds) => set({ rounds })} />
          <div className="flex min-h-14 items-center gap-3">
            <label htmlFor={roundRestId} className="min-w-0 flex-1 truncate text-base text-ink">
              Rest between rounds <span className="text-ink-muted">(s)</span>
            </label>
            <input
              id={roundRestId}
              inputMode="numeric"
              autoComplete="off"
              value={draft.roundRest}
              onChange={(e) => set({ roundRest: e.target.value })}
              className={cx(inputClass, 'w-24 text-right')}
            />
          </div>
        </div>

        <section aria-labelledby="ex-title" className="flex flex-col gap-3">
          <h2 id="ex-title" className="text-sm font-medium text-ink-muted">
            Exercises · each round
          </h2>
          {draft.exercises.map((e, i) => (
            <ExerciseCard key={e.key} n={i + 1} ex={e} onChange={(p) => setEx(e.key, p)} />
          ))}
          {draft.exercises.length < LIMITS.exercisesMax && (
            <Button icon={Plus} className="self-start" onClick={() => setDraft((d) => ({ ...d, exercises: [...d.exercises, newExercise()] }))}>
              Exercise
            </Button>
          )}
        </section>

        {result.ok && (
          <p className="text-sm tabular-nums text-ink-muted">Length {formatSeconds(routineSeconds(result.routine))}</p>
        )}

        {existing && (
          <div className="flex flex-col gap-1 border-t border-line pt-4">
            <Button icon={Trash2} className="self-start" disabled={!!inUse} onClick={() => setDeleting(true)}>
              Delete routine
            </Button>
            {inUse && <p className="text-sm text-ink-muted">{inUse} — change that first.</p>}
          </div>
        )}
      </div>
      <Sheet
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Delete this routine?"
        footer={
          <>
            <Button variant="primary" full onClick={remove}>
              Delete
            </Button>
            <Button full onClick={() => setDeleting(false)}>
              Keep it
            </Button>
          </>
        }
      >
        <p className="text-base text-ink-muted">Past workouts keep their numbers; they show as “Workout”.</p>
      </Sheet>
    </FullScreen>
  );
}

function ExerciseCard({ n, ex, onChange }: { n: number; ex: ExerciseDraft; onChange: (p: Partial<ExerciseDraft> | null) => void }) {
  const selectId = useId();
  const workId = useId();
  const restId = useId();
  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <span aria-hidden className="w-5 shrink-0 text-sm tabular-nums text-ink-muted">
          {n}
        </span>
        <label htmlFor={selectId} className="sr-only">
          Exercise {n}
        </label>
        <select
          id={selectId}
          value={ex.exerciseId}
          onChange={(e) => onChange({ exerciseId: e.target.value })}
          className={cx(inputClass, 'min-w-0 flex-1 font-medium')}
        >
          {EXERCISE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <IconButton icon={Trash2} label={`Remove exercise ${n}`} onClick={() => onChange(null)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SecondsField id={workId} label="Work (s)" value={ex.work} onChange={(work) => onChange({ work })} />
        <SecondsField id={restId} label="Rest (s)" value={ex.rest} onChange={(rest) => onChange({ rest })} />
      </div>
    </div>
  );
}

function SecondsField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="min-w-0 flex-1 truncate text-sm text-ink">
        {label}
      </label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(inputClass, 'w-20 text-right')}
      />
    </div>
  );
}
