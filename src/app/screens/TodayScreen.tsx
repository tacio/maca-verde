import { useEffect, useState } from 'react';
import { BarChart3, CalendarPlus, Check, ChevronRight, PenLine, Play, Smile, Sprout, Sunrise, TriangleAlert } from 'lucide-react';
import { formatDuration, shortDay } from '../../time/daykeep';
import { Button } from '../../ui/Button';
import { DayHeader } from '../../ui/DayHeader';
import { EmptyState } from '../../ui/EmptyState';
import { ListRow } from '../../ui/ListRow';
import { ProgressRing } from '../../ui/ProgressRing';
import { StatsBlock } from '../../ui/StatsBlock';
import { StatusGlyph } from '../../ui/StatusGlyph';
import type { ItemProgress } from '../../domain/record';
import { useApp } from '../AppContext';
import { Moment } from '../Moment';
import { useNav } from '../nav';
import { CYCLE_NOTICE_DAYS, haltLine, itemFlow, nextCycleDue, primaryText, recoveryLine, todayPrimary } from '../today';
import { progressText } from '../view';
import { TabScreen } from './TabScreen';
import { WorkoutPreview } from './WorkoutPreview';

/**
 * What Today last showed, kept across unmounts (a flow replaces Today while
 * it's open): on return, items that completed meanwhile get the inline tick
 * and a day that just became done gets the day-done moment (P13).
 */
let seen: { day: number; done: Set<string>; all: boolean } | null = null;

/**
 * Today (J4): day header, stats, the checklist with one primary action.
 * A pending justification blocks it (J7). `preview` opens the workout
 * preview sheet for that item (the `preview:<itemId>` flow).
 */
export function TodayScreen({ preview }: { preview?: string }) {
  const { data, record, now, cfg } = useApp();
  const { open, close, setTab } = useNav();
  const today = record.today;
  const t = record.todayEval;
  const custom = data.routines;
  const primary = todayPrimary(record, data.cycles, now, cfg);
  const allDone = t.status === 'done';

  // Frozen at mount: what changed since Today was last on screen.
  const [fresh] = useState(() => (seen?.day === today ? t.items.filter((p) => p.satisfied && !seen!.done.has(p.item.id)).map((p) => p.item.id) : []));
  const [moment, setMoment] = useState(() => seen?.day === today && !seen.all && allDone);
  useEffect(() => {
    seen = { day: today, done: new Set(t.items.filter((p) => p.satisfied).map((p) => p.item.id)), all: allDone };
  }, [today, t, allDone]);

  const header = <DayHeader day={today} now={now} cfg={cfg} eyebrow={primary.kind === 'warmup' ? 'Warm-up day' : 'Today'} />;

  if (primary.kind === 'warmup') {
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
          body={`Day ${shortDay(primary.start, 3)} is the first planned day. Today, move freely.`}
        />
      </TabScreen>
    );
  }

  if (primary.kind === 'unplanned') {
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

  // J7 blocks Today: only the way into the note, nothing else competes.
  if (primary.kind === 'justify') {
    const days = primary.days;
    return (
      <TabScreen
        screen="today"
        action={
          <Button variant="primary" full icon={PenLine} onClick={() => open('justify')}>
            {days.length === 1 ? `Close day ${shortDay(days[0], 3)}` : `Close ${days.length} days`}
          </Button>
        }
      >
        {header}
        <EmptyState
          icon={PenLine}
          title={days.length === 1 ? `Day ${shortDay(days[0], 3)} wasn't completed` : `${days.length} days weren't completed`}
          body="A short note on what got in the way, then on with today."
        />
      </TabScreen>
    );
  }

  const stats = (
    <StatsBlock
      streak={record.streak}
      average={record.average}
      averageDays={record.averageDays}
    />
  );

  if (primary.kind === 'no-plan') {
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
  const recovery = recoveryLine(record);
  const halt = haltLine(data.moods, today, cfg);
  const due = nextCycleDue(data.cycles, today, now, cfg);
  const showCycleRow = primary.kind !== 'cycle' && due !== null && due.in <= CYCLE_NOTICE_DAYS * cfg.dayLength;
  const previewItem = preview ? t.items.find((p) => p.item.id === preview && p.item.kind === 'workout') : undefined;

  const openItem = (p: ItemProgress) => open(p.item.kind === 'workout' ? `preview:${p.item.id}` : itemFlow(p.item));

  let action;
  if (previewItem) action = undefined; // the sheet holds the one primary (Start)
  else if (primary.kind === 'item')
    action = (
      <Button variant="primary" full icon={primary.progress.item.kind === 'mood' ? Smile : Play} onClick={() => open(itemFlow(primary.progress.item))}>
        {primaryText(primary.progress.item, cfg, data.sessions, custom)}
      </Button>
    );
  else if (primary.kind === 'cycle')
    action = (
      <Button variant="primary" full icon={CalendarPlus} onClick={() => open(`cycle:${primary.cycle}`)}>
        Plan next cycle
      </Button>
    );
  else
    action = (
      <Button variant="primary" full icon={BarChart3} onClick={() => setTab('progress')}>
        See progress
      </Button>
    );

  const title = allDone ? (record.isRecoveryDay ? 'Back on track' : 'Day done') : `${done} of ${total} done`;
  const sub = allDone ? 'Every item is complete. See you tomorrow.' : 'Locked for today';
  const moodIsPrimary = primary.kind === 'item' && primary.progress.item.kind === 'mood';

  return (
    <TabScreen screen="today" action={action}>
      {header}
      {stats}
      <section aria-labelledby="today-plan" className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <ProgressRing value={total ? done / total : 0} label={`${done} of ${total} done`} size={44} stroke={4}>
            {allDone ? <Check aria-hidden size={18} strokeWidth={2.5} className="text-accent" /> : undefined}
          </ProgressRing>
          <div className="min-w-0">
            <h2 id="today-plan" className="text-base font-semibold text-ink">
              {title}
            </h2>
            <p className="truncate text-sm text-ink-muted">{sub}</p>
          </div>
        </div>
        {recovery && !allDone && (
          <p className="flex items-start gap-2.5 rounded-card bg-accent-soft px-4 py-3 text-sm text-ink">
            <Sunrise aria-hidden size={18} strokeWidth={2} className="mt-px shrink-0 text-accent" />
            {recovery}
          </p>
        )}
        <ul className="-mx-3 flex flex-col">
          {t.items.map((p) => (
            <li key={p.item.id}>
              <ListRow
                leading={
                  <span className={fresh.includes(p.item.id) ? 'tick-in' : undefined}>
                    <StatusGlyph status={p.satisfied ? 'done' : 'todo'} />
                  </span>
                }
                title={progressText(p, cfg, custom)}
                meta={p.item.kind === 'workout' && !p.satisfied && data.settings.anchor ? data.settings.anchor : undefined}
                muted={p.satisfied}
                trailing={<ChevronRight aria-hidden size={18} />}
                onClick={() => openItem(p)}
              />
            </li>
          ))}
        </ul>
      </section>

      {halt && (
        <section aria-label="HALT" className="-mt-2 flex items-center gap-3 rounded-card bg-caution-soft py-1 pl-4 pr-1">
          <TriangleAlert aria-hidden size={18} strokeWidth={2} className="shrink-0 text-caution" />
          <p className="min-w-0 flex-1 text-sm text-ink">{halt}</p>
          <Button variant="quiet" className="shrink-0 px-3 text-caution" onClick={() => open('drill')}>
            Drill
          </Button>
        </section>
      )}

      {(showCycleRow || !moodIsPrimary) && (
        <div className="-mx-3 -mt-2 flex flex-col">
          {showCycleRow && due && (
            <ListRow
              leading={<CalendarPlus aria-hidden size={20} strokeWidth={1.75} className="text-ink-muted" />}
              title={`Cycle ${due.cycle} starts in ${formatDuration(Math.max(0, due.in), cfg)}`}
              meta="Approve it to earn streak protection"
              trailing={<ChevronRight aria-hidden size={18} />}
              onClick={() => open(`cycle:${due.cycle}`)}
            />
          )}
          {!moodIsPrimary && (
            <Button variant="quiet" icon={Smile} className="self-start" onClick={() => open('mood')}>
              {allDone ? 'Extra mood check' : 'Mood check now'}
            </Button>
          )}
        </div>
      )}

      {previewItem && previewItem.item.kind === 'workout' && <WorkoutPreview item={previewItem.item} onClose={close} />}
      {moment && (
        <Moment
          icon={record.isRecoveryDay ? Sunrise : Check}
          title={record.isRecoveryDay ? 'Back on track' : 'Day done'}
          body={`Day ${shortDay(today, 3)} · ${total} of ${total}`}
          onDismiss={() => setMoment(false)}
        />
      )}
    </TabScreen>
  );
}
