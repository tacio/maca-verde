import { useId, useState } from 'react';
import { ArrowRight, Trophy } from 'lucide-react';
import type { WorkoutItem } from '../../domain/types';
import { requestAutoBackup } from '../../storage/autoBackup';
import { nowUnix } from '../../time/clock';
import { Button } from '../../ui/Button';
import { FullScreen } from '../../ui/FullScreen';
import { Scale } from '../../ui/Scale';
import { Sheet } from '../../ui/Sheet';
import { inputClass } from '../../ui/TextField';
import { cx } from '../../ui/cx';
import { pendingResult, setPendingResult } from '../../workout/handoff';
import {
  LOG_FIELD_LABEL,
  buildSession,
  draftValid,
  fieldHint,
  initialDraft,
  logFields,
  logHeader,
  parseCount,
  recordsBeaten,
  shortNote,
  simulatedResult,
  type LogDraft,
  type LogField,
  type WorkoutResult,
} from '../../workout/log';
import { useApp } from '../AppContext';
import { lastValue } from '../dayDraft';
import { findPlanItem } from '../items';
import { useBackGuard, useNav } from '../nav';
import { newLogId, scaledRoutine } from '../today';
import { routineName } from '../view';
import { MissingItem } from './MissingItem';

/**
 * The post-workout log flow (`workout-log:<itemId>`). The HUD hands over its
 * result; dev scenarios simulate one with `workout-log:<itemId>:full|early`.
 */
export function WorkoutLogScreen({ itemId, simulate }: { itemId: string; simulate?: 'full' | 'early' }) {
  const { data } = useApp();
  const item = findPlanItem(data.plans, itemId, 'workout');
  const [result] = useState<WorkoutResult | null>(() => {
    if (!item) return null;
    if (import.meta.env.DEV && simulate) {
      const routine = scaledRoutine(item.routineId, data.sessions, data.routines);
      return routine ? simulatedResult(item, routine, simulate, nowUnix()) : null;
    }
    return pendingResult(itemId);
  });
  if (!item || !result) return <MissingItem screen="workout-log" title="Workout log" body="There's no finished session to log." />;
  return <WorkoutLog item={item} result={result} />;
}

/**
 * Post-workout log (J4, P11): time and rounds come from the timer; RPE and
 * neck have defaults, so Save alone logs it. Rope turns / hang seconds only
 * when the item targets them, pre-filled from the timer. If a pause drill is
 * still due today, a quiet link saves and goes straight to it (from Freeze).
 */
function WorkoutLog({ item, result }: { item: WorkoutItem; result: WorkoutResult }) {
  const { data, record, cfg, update } = useApp();
  const { close, replace } = useNav();
  const [draft, setDraft] = useState<LogDraft>(() => initialDraft(result, item));
  const [confirm, setConfirm] = useState(false);
  const name = routineName(item.routineId, data.routines);
  const note = shortNote(result);
  const drillDue = record.todayEval.items.some((p) => p.item.kind === 'drill' && !p.satisfied);
  const valid = draftValid(draft);
  const beaten = recordsBeaten(result, draft, data.sessions);

  useBackGuard(() => setConfirm(true));

  const save = (then: 'today' | 'drill') => {
    const unix = nowUnix();
    const session = buildSession(result, draft, newLogId('s', unix));
    if (!session) return;
    update((d) => {
      const next = { ...d, sessions: [...d.sessions, session] };
      requestAutoBackup(next, 'workout');
      return next;
    });
    setPendingResult(null);
    if (then === 'drill') replace('drill:after-workout');
    else close();
  };

  const discard = () => {
    setPendingResult(null);
    close();
  };

  return (
    <FullScreen
      screen="workout-log"
      title={logHeader(name, result, cfg)}
      onClose={() => setConfirm(true)}
      footer={
        <div className="flex flex-col gap-1">
          <Button variant="primary" full disabled={!valid} onClick={() => save('today')}>
            Save
          </Button>
          {drillDue && (
            <Button variant="quiet" full disabled={!valid} onClick={() => save('drill')}>
              Pulse is up — pause drill now?
              <ArrowRight aria-hidden size={18} className="ml-1 inline align-[-3px]" />
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-6 pt-2">
        {note && <p className="rounded-card bg-surface-2 px-4 py-3 text-sm text-ink">{note}</p>}
        {beaten.includes('rounds') && (
          <p className="flex items-center gap-2 text-base text-ink">
            <RecordBadge />
            {result.roundsCompleted} rounds — your most yet
          </p>
        )}
        <Scale
          label="Effort (RPE)"
          min={1}
          max={10}
          columns={5}
          low="easy"
          high="all out"
          value={draft.rpe}
          onChange={(rpe) => setDraft((d) => ({ ...d, rpe }))}
        />
        <Scale
          label="Neck tension"
          min={0}
          max={10}
          columns={6}
          low="none"
          high="severe"
          value={draft.neck}
          onChange={(neck) => setDraft((d) => ({ ...d, neck }))}
        />
        {logFields(item).map((f) => (
          <FieldRow
            key={f}
            field={f}
            item={item}
            text={draft.fields[f] ?? ''}
            record={beaten.includes(f)}
            onText={(text) => setDraft((d) => ({ ...d, fields: { ...d.fields, [f]: text } }))}
          />
        ))}
      </div>

      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Discard this session?"
        footer={
          <>
            <Button full onClick={() => setConfirm(false)}>
              Keep logging
            </Button>
            <Button variant="quiet" full onClick={discard}>
              Discard
            </Button>
          </>
        }
      >
        <p className="text-base text-ink-muted">It won't be logged or count toward today.</p>
      </Sheet>
    </FullScreen>
  );
}

/** Inline "Record" badge (P13: competence feedback, no full-screen moment). */
function RecordBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-sm font-semibold text-accent">
      <Trophy aria-hidden size={14} strokeWidth={2.25} />
      Record
    </span>
  );
}

function FieldRow({
  field,
  item,
  text,
  record,
  onText,
}: {
  field: LogField;
  item: WorkoutItem;
  text: string;
  record: boolean;
  onText: (t: string) => void;
}) {
  const { data } = useApp();
  const id = useId();
  const last = lastValue(field, item.routineId, data.sessions);
  const unit = field === 'hangSeconds' ? ' s' : '';
  const invalid = parseCount(text) === null;
  return (
    <div data-target className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <label htmlFor={id} className="min-w-0 flex-1 truncate text-base font-medium text-ink">
          {LOG_FIELD_LABEL[field]}
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
          onFocus={(e) => e.target.select()}
          className={cx(inputClass, 'w-28 text-right')}
        />
      </div>
      <div className="flex items-center gap-2">
        <p id={`${id}-hint`} data-last-hint className="min-w-0 flex-1 truncate text-sm tabular-nums text-ink-muted">
          {fieldHint(last, item.targets[field], unit)}
        </p>
        {record && <RecordBadge />}
      </div>
    </div>
  );
}
