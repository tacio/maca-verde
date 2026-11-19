import { useId, useState, type ReactNode } from 'react';
import { CalendarCheck, ChevronRight, Diamond, Lock } from 'lucide-react';
import { approvalFor, canEditDay, cycleDays, dayStartUnix, findPlan, validatePlanItems } from '../../domain/plan';
import { nowUnix } from '../../time/clock';
import { formatDuration, formatStamp, fromUnix, shortDay } from '../../time/daykeep';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { ListRow } from '../../ui/ListRow';
import { cx } from '../../ui/cx';
import { useApp } from '../AppContext';
import { approveWithDrafts, cycleDrafts, cycleRowSummary, lookBack, type LookBack } from '../cycle';
import { DayCell } from '../DayCell';
import { Moment } from '../Moment';
import { CountBadge } from '../ItemIcon';
import { useNav } from '../nav';
import { approvedMomentText, protectionFull, type CellKind } from '../view';

export interface CycleLayoutProps {
  /** "Starts in .6596 · approve for +1 ◆" (or "· protection full" at the cap) */
  subtitle: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

export interface CycleEditorProps {
  cycle: number;
  /** The frame around the editor (a full-screen flow, or an onboarding step). */
  layout: (p: CycleLayoutProps) => ReactNode;
  /** After approval and its moment; also the review screen's "Done". */
  onFinish: () => void;
  approveLabel?: string;
}

/** "358.0200": a moment, with the day shortened. */
function shortStamp(unix: number, cfg: { epoch: number; dayLength: number }): string {
  const s = formatStamp(fromUnix(unix, cfg), cfg);
  return s.slice(Math.max(0, s.indexOf('.') - 3));
}

export const cycleRange = (cycle: number) => `${shortDay(cycle * 10, 3)}–${shortDay(cycle * 10 + 9, 3)}`;

/**
 * The cycle editor (J2): look-back, 10 day rows, approve. Unsaved days show
 * the pre-fill (cycle.ts → drafts); approving saves them and approves at once.
 */
export function CycleEditor({ cycle, layout, onFinish, approveLabel = 'Approve cycle' }: CycleEditorProps) {
  const { data, record, now, cfg, update } = useApp();
  const { open } = useNav();
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [moment, setMoment] = useState<{ onTime: boolean; days: number[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reasonId = useId();

  const approval = approvalFor(data.cycles, cycle);
  const drafts = approval ? [] : cycleDrafts(data, cycle, now, cfg);
  const firstStart = dayStartUnix(cycle * 10, cfg);
  const unstarted = cycleDays(cycle).filter((d) => canEditDay(d, now, cfg));
  // On time before the cycle starts; the very first approval (onboarding) is on time too (plan.ts → isOnTime).
  const onTime = now < firstStart || data.cycles.length === 0;

  const planOf = (day: number) =>
    !approval && canEditDay(day, now, cfg) ? drafts.find((p) => p.day === day) : findPlan(data.plans, day);
  const invalid = approval ? [] : unstarted.filter((d) => validatePlanItems(planOf(d)?.items ?? []).length > 0);

  let subtitle: ReactNode;
  if (approval) subtitle = `Approved at ${shortStamp(approval.approvedUnix, cfg)}`;
  else if (unstarted.length === 0) subtitle = 'Every day has started';
  else if (onTime && protectionFull(record.reservesHeld))
    subtitle = `${now < firstStart ? `Starts in ${formatDuration(firstStart - now, cfg)}` : `From day ${shortDay(unstarted[0], 3)}`} · protection full`;
  else if (onTime)
    subtitle = (
      <>
        {now < firstStart ? `Starts in ${formatDuration(firstStart - now, cfg)}` : `From day ${shortDay(unstarted[0], 3)}`} · approve for{' '}
        <span className="whitespace-nowrap font-medium text-ink">
          +1 <Diamond aria-hidden size={13} strokeWidth={2.5} className="inline align-[-1px] text-accent" />
          <span className="sr-only"> streak protection</span>
        </span>
      </>
    );
  else subtitle = `Started ${formatDuration(now - firstStart, cfg)} ago · late — no protection earned`;

  const approve = () => {
    let result: ReturnType<typeof approveWithDrafts> | undefined;
    update((d) => {
      result = approveWithDrafts(d, cycle, nowUnix(), cfg, saveTemplate);
      return result.ok ? result.data : d;
    });
    if (result?.ok) setMoment({ onTime: result.onTime, days: result.days });
    else setError(result?.error === 'started' ? 'This cycle has fully started.' : 'Some days need a plan first.');
  };

  const reason =
    error ??
    (invalid.length
      ? `Day ${shortDay(invalid[0], 3)} needs a plan`
      : unstarted.length === 0
        ? 'Nothing left to approve'
        : null);

  const footer = approval ? (
    <Button variant="primary" full onClick={onFinish}>
      Done
    </Button>
  ) : (
    <div className="flex flex-col gap-1">
      {reason && (
        <p id={reasonId} className="pb-1 text-center text-sm text-ink-muted">
          {reason}
        </p>
      )}
      <Button
        variant="primary"
        full
        icon={CalendarCheck}
        disabled={!!reason}
        aria-describedby={reason ? reasonId : undefined}
        onClick={approve}
      >
        {approveLabel}
      </Button>
    </div>
  );

  const lb = lookBack(cycle, record);

  return (
    <>
      {layout({
        subtitle,
        footer,
        children: (
          <div className="flex flex-col gap-5">
            {lb && <LookBackCard lb={lb} />}
            <ul aria-label={`Days ${cycleRange(cycle)}`} className="-mx-3 flex flex-col">
              {cycleDays(cycle).map((day) => {
                const started = !canEditDay(day, now, cfg);
                const plan = planOf(day);
                // Started days outside this plan (onboarding, late approval) are left out.
                if (started && !plan) return null;
                const sum = plan ? cycleRowSummary(plan.items, cfg, data.routines) : null;
                const bad = invalid.includes(day);
                return (
                  <li key={day}>
                    <ListRow
                      leading={
                        <span className={cx('w-9 text-sm tabular-nums', started ? 'text-ink-muted' : 'font-medium text-ink')}>
                          {shortDay(day, 3)}
                        </span>
                      }
                      title={started ? (sum?.title ?? 'Started') : bad ? 'Needs a plan' : sum!.title}
                      muted={started || bad}
                      trailing={
                        started ? (
                          <Lock aria-label="Locked" size={16} strokeWidth={2} />
                        ) : (
                          <span className="flex items-center gap-3">
                            <CountBadge kind="mood" count={sum?.mood ?? 0} />
                            <CountBadge kind="drill" count={sum?.drill ?? 0} />
                            <ChevronRight aria-hidden size={18} />
                          </span>
                        )
                      }
                      onClick={() => open(`${started ? 'day-locked' : 'day-edit'}:${day}`)}
                    />
                  </li>
                );
              })}
            </ul>
            {!approval && (
              <Checkbox checked={saveTemplate} onChange={setSaveTemplate} className="-mt-2">
                Save as template
              </Checkbox>
            )}
          </div>
        ),
      })}
      {moment && <ApprovedMoment cycle={cycle} held={record.reservesHeld} {...moment} onDismiss={onFinish} />}
    </>
  );
}

const CELL_WORD: Partial<Record<CellKind, string>> = { done: 'done', kept: 'missed, streak kept', missed: 'missed', today: 'today' };

/** P5: how the previous cycle went, before planning the next one. */
function LookBackCard({ lb }: { lb: LookBack }) {
  return (
    <section aria-label="Look back" className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="truncate text-sm font-medium text-ink-muted">
          {lb.complete ? 'Last cycle' : 'This cycle so far'} · {cycleRange(lb.cycle)}
        </h2>
        <p className="shrink-0 text-sm font-medium tabular-nums text-ink">
          {lb.done} of {lb.closed} done
        </p>
      </div>
      <ol className="flex gap-1.5">
        {lb.cells.map((c) => (
          <li key={c.day} className="w-6" aria-label={`${shortDay(c.day, 3)} ${CELL_WORD[c.kind] ?? 'not in the record'}`}>
            <DayCell kind={c.kind} />
          </li>
        ))}
      </ol>
      {lb.note && (
        <p className="truncate text-sm text-ink-muted">
          “{lb.note.text}” · {shortDay(lb.note.day, 3)}
        </p>
      )}
    </section>
  );
}

/** The approval moment (02-workflows §6): "+1 protection" when earned; at the cap, "protection full". */
function ApprovedMoment({ cycle, onTime, held, days, onDismiss }: { cycle: number; onTime: boolean; held: number; days: number[]; onDismiss: () => void }) {
  // Frozen at approval: the record may change underneath while the moment shows.
  const [text] = useState(() => approvedMomentText(cycle, onTime, held, days));
  return <Moment icon={text.earned ? Diamond : CalendarCheck} title={text.title} body={text.body} onDismiss={onDismiss} />;
}
