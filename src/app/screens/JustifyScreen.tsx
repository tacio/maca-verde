import { useEffect, useState } from 'react';
import { ArrowRight, Diamond, RotateCcw, Sunrise } from 'lucide-react';
import { JUSTIFICATION_REASONS, type JustificationReason } from '../../domain/types';
import { nowUnix } from '../../time/clock';
import { shortDay } from '../../time/daykeep';
import { Button } from '../../ui/Button';
import { ChipGroup } from '../../ui/Chip';
import { FullScreen } from '../../ui/FullScreen';
import { TextField } from '../../ui/TextField';
import { useApp } from '../AppContext';
import { useNav } from '../nav';
import { NOTE_MAX, REASON_LABEL, buildJustification, justifyOutcome, leftText, stackText } from '../today';

const REASON_OPTIONS = JUSTIFICATION_REASONS.map((r) => ({ value: r, label: REASON_LABEL[r] }));

interface Draft {
  reason: JustificationReason | null;
  text: string;
}

/** Unsaved notes per day, so a detour through "Adjust next days" doesn't lose them. */
const drafts = new Map<number, Draft>();

/**
 * Close a missed day (J7, P8): what was left, what got in the way (a chip +
 * one sentence), and what happened to the streak. Several days go one at a
 * time, oldest first. Asks about the plan, never about the person.
 */
export function JustifyScreen() {
  const { record } = useApp();
  const { close } = useNav();
  const pending = record.pendingJustifications;
  // The stack size is fixed when the flow opens, so progress reads "2 of 3".
  const [total] = useState(() => pending.length);
  const day = pending[0];

  useEffect(() => {
    if (day === undefined) close();
  }, [day, close]);
  if (day === undefined) return null;

  return <JustifyDay key={day} day={day} progress={stackText(total, pending.length)} />;
}

function JustifyDay({ day, progress }: { day: number; progress: string | null }) {
  const { data, record, update } = useApp();
  const { close, setTab } = useNav();
  const [d, setD] = useState<Draft>(() => drafts.get(day) ?? { reason: null, text: '' });
  const change = (patch: Partial<Draft>) =>
    setD((x) => {
      const next = { ...x, ...patch };
      drafts.set(day, next);
      return next;
    });

  const e = record.days.find((x) => x.day === day);
  const outcome = justifyOutcome(day, record);
  const ready = !!d.reason && d.text.trim().length > 0;

  const save = () => {
    const j = buildJustification(day, d.reason, d.text, nowUnix());
    if (!j) return;
    drafts.delete(day);
    update((data) => ({ ...data, justifications: [...data.justifications, j] }));
    // JustifyScreen moves on to the next day, or closes when none is left.
  };

  const adjust = () => {
    close();
    setTab('plan');
  };

  return (
    <FullScreen
      screen="justify"
      title={`Day ${shortDay(day, 3)} wasn't completed`}
      onClose={close}
      dismiss="back"
      trailing={progress ? <span className="pr-3 text-sm tabular-nums text-ink-muted">{progress}</span> : undefined}
      footer={
        <div className="flex flex-col gap-1">
          <Button variant="primary" full disabled={!ready} onClick={save}>
            Save
          </Button>
          <Button variant="quiet" data-adjust-link className="self-center" onClick={adjust}>
            Adjust next days
            <ArrowRight aria-hidden size={16} className="-mr-1 inline" />
          </Button>
        </div>
      }
    >
      <div key={day} className="moment-in flex flex-col gap-6">
        <p className="text-sm tabular-nums text-ink-muted">{e ? leftText(e, data.routines) : 'Nothing was planned for this day'}</p>

        <section aria-labelledby="justify-why" className="flex flex-col gap-3">
          <h2 id="justify-why" className="text-lg font-semibold text-ink">
            What got in the way?
          </h2>
          <ChipGroup label="Reason" options={REASON_OPTIONS} value={d.reason} onChange={(reason) => change({ reason })} />
          <TextField
            label="In one sentence"
            placeholder="e.g. Long day at work"
            maxLength={NOTE_MAX}
            value={d.text}
            onChange={(ev) => change({ text: ev.target.value })}
            enterKeyHint="done"
          />
        </section>

        <section aria-label="Streak" className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4">
          <p className="flex items-center gap-2 text-base text-ink">
            {outcome.kind === 'kept' ? (
              <span role="img" aria-label="one streak protection used" className="flex items-center gap-1 text-accent">
                <Diamond aria-hidden size={16} strokeWidth={2.5} className="fill-accent" />
                <ArrowRight aria-hidden size={14} className="text-ink-muted" />
                <Diamond aria-hidden size={16} strokeWidth={2.5} />
              </span>
            ) : (
              <RotateCcw aria-hidden size={18} strokeWidth={2} className="shrink-0 text-ink-muted" />
            )}
            <span>{outcome.text}</span>
          </p>
          {outcome.recoveryToday && (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Sunrise aria-hidden size={16} strokeWidth={2} className="shrink-0" />
              Today is a recovery day.
            </p>
          )}
        </section>
      </div>
    </FullScreen>
  );
}
