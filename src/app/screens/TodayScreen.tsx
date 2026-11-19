import { CalendarPlus, Check, PenLine, Play, Sprout, Sunrise } from 'lucide-react';
import { approvalFor, dayStartUnix } from '../../domain/plan';
import { cycleOf, shortDay } from '../../time/daykeep';
import { Button } from '../../ui/Button';
import { DayHeader } from '../../ui/DayHeader';
import { EmptyState } from '../../ui/EmptyState';
import { ListRow } from '../../ui/ListRow';
import { ProgressRing } from '../../ui/ProgressRing';
import { StatsBlock } from '../../ui/StatsBlock';
import { StatusGlyph } from '../../ui/StatusGlyph';
import { RESERVE_CAP } from '../../domain/record';
import { useApp } from '../AppContext';
import { useNav } from '../nav';
import { actionText, nextItem, progressText } from '../view';
import { TabScreen } from './TabScreen';

/** Days before a cycle starts when approving it becomes Today's primary (once today is done). */
const APPROVAL_WINDOW_DAYS = 3;

/**
 * Today (shell level; M4 completes it): day header, stats, today's checklist
 * read-only, and one primary action.
 */
export function TodayScreen() {
  const { data, record, now, cfg } = useApp();
  const { open, setTab } = useNav();
  const today = record.today;
  const t = record.todayEval;
  const start = record.recordStartDay;
  const custom = data.routines;

  const header = <DayHeader day={today} now={now} cfg={cfg} eyebrow={start !== null && today < start ? 'Warm-up day' : 'Today'} />;

  // Warm-up: setup day, the record starts later.
  if (start !== null && today < start) {
    return (
      <TabScreen
        screen="today"
        action={
          <Button variant="primary" full onClick={() => setTab('plan')}>
            See tomorrow's plan
          </Button>
        }
      >
        {header}
        <EmptyState
          icon={Sunrise}
          title="Your record starts tomorrow"
          body={`Day ${shortDay(start, 3)} is the first planned day. Today, move freely.`}
        />
      </TabScreen>
    );
  }

  // No plan at all yet.
  if (start === null) {
    return (
      <TabScreen
        screen="today"
        action={
          <Button variant="primary" full icon={CalendarPlus} onClick={() => open('cycle')}>
            Plan a cycle
          </Button>
        }
      >
        {header}
        <EmptyState icon={Sprout} title="Nothing planned yet" body="Plan a few days ahead. Your record starts with the first one." />
      </TabScreen>
    );
  }

  const stats = (
    <StatsBlock
      streak={record.streak}
      reserves={record.reservesHeld}
      reserveCap={RESERVE_CAP}
      average={record.average}
      averageDays={record.averageDays}
    />
  );

  // A missed day waits for its note (J7 blocks the day; M4 builds the flow).
  const pending = record.pendingJustifications;
  if (pending.length > 0) {
    return (
      <TabScreen
        screen="today"
        action={
          <Button variant="primary" full icon={PenLine} onClick={() => open('justify')}>
            Write a short note
          </Button>
        }
      >
        {header}
        {stats}
        <EmptyState
          icon={PenLine}
          title={pending.length === 1 ? `Day ${shortDay(pending[0], 3)} wasn't completed` : `${pending.length} days weren't completed`}
          body="One sentence on what got in the way, then on with today."
        />
      </TabScreen>
    );
  }

  // Today has no approved plan: it counts as missed.
  if (!t.planned || t.items.length === 0) {
    return (
      <TabScreen
        screen="today"
        action={
          <Button variant="primary" full icon={CalendarPlus} onClick={() => open('cycle')}>
            Plan next cycle
          </Button>
        }
      >
        {header}
        {stats}
        <EmptyState icon={CalendarPlus} title="No plan for today" body="Plan the next cycle so tomorrow counts." />
      </TabScreen>
    );
  }

  const done = t.satisfiedCount;
  const total = t.totalCount;
  const next = nextItem(t.items);
  const nextCycle = cycleOf(today) + 1;
  const nextCycleDue =
    !approvalFor(data.cycles, nextCycle) && dayStartUnix(nextCycle * 10, cfg) - now <= APPROVAL_WINDOW_DAYS * cfg.dayLength;

  let action;
  if (next) {
    action = (
      <Button variant="primary" full icon={Play} onClick={() => open(next.item.kind === 'workout' ? 'workout' : next.item.kind)}>
        {actionText(next.item, custom)}
      </Button>
    );
  } else if (nextCycleDue) {
    action = (
      <Button variant="primary" full icon={CalendarPlus} onClick={() => open('cycle')}>
        Plan next cycle
      </Button>
    );
  } else {
    action = (
      <Button variant="primary" full onClick={() => setTab('progress')}>
        See progress
      </Button>
    );
  }

  return (
    <TabScreen screen="today" action={action}>
      {header}
      {stats}
      <section aria-labelledby="today-plan" className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <ProgressRing value={total ? done / total : 0} label={`${done} of ${total} done`} size={44} stroke={4}>
            {done === total ? <Check aria-hidden size={18} strokeWidth={2.5} className="text-accent" /> : undefined}
          </ProgressRing>
          <div className="min-w-0">
            <h2 id="today-plan" className="text-base font-semibold text-ink">
              {done === total ? 'Day done' : `${done} of ${total} done`}
            </h2>
            <p className="truncate text-sm text-ink-muted">
              {record.isRecoveryDay
                ? 'Recovery day: finish it to get back on track'
                : done === total
                  ? 'Every item is complete. See you tomorrow.'
                  : 'Locked for today'}
            </p>
          </div>
        </div>
        <ul className="-mx-3 flex flex-col">
          {t.items.map((p) => (
            <li key={p.item.id}>
              <ListRow
                leading={<StatusGlyph status={p.satisfied ? 'done' : 'todo'} />}
                title={progressText(p, cfg, custom)}
                meta={p.item.kind === 'workout' && !p.satisfied && data.settings.anchor ? data.settings.anchor : undefined}
                muted={p.satisfied}
              />
            </li>
          ))}
        </ul>
      </section>
    </TabScreen>
  );
}
