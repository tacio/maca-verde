import { CalendarPlus, CalendarRange } from 'lucide-react';
import { approvalFor, cycleDays, dayStartUnix, findPlan, isDayPlanned } from '../../domain/plan';
import { cycleOf, formatDuration, shortDay } from '../../time/daykeep';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { ListRow } from '../../ui/ListRow';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { StatusGlyph } from '../../ui/StatusGlyph';
import { cx } from '../../ui/cx';
import { useApp } from '../AppContext';
import { useNav } from '../nav';
import { dayGlyph, daySummary } from '../view';
import { TabScreen } from './TabScreen';

/** Plan (shell): the current and next cycle as read-only lists of 10 days. */
export function PlanScreen() {
  const { data, record, now, cfg } = useApp();
  const { open } = useNav();
  const current = cycleOf(record.today);
  const next = current + 1;
  const nextApproved = !!approvalFor(data.cycles, next);

  const action = (
    <Button variant="primary" full icon={CalendarPlus} onClick={() => open('cycle')}>
      {nextApproved ? 'Review next cycle' : 'Plan next cycle'}
    </Button>
  );

  if (data.plans.length === 0) {
    return (
      <TabScreen screen="plan" action={action}>
        <ScreenHeader title="Plan" />
        <EmptyState icon={CalendarRange} title="No cycles yet" body="Plans cover 10 days at a time. Approve one before it starts." />
      </TabScreen>
    );
  }

  const startsIn = formatDuration(dayStartUnix(next * 10, cfg) - now, cfg);

  return (
    <TabScreen screen="plan" action={action}>
      <ScreenHeader title="Plan" />
      {cycleSection(
        `This cycle · ${shortDay(current * 10, 3)}–${shortDay(current * 10 + 9, 3)}`,
        approvalFor(data.cycles, current) ? 'Approved' : 'Not approved',
        current,
      )}
      {cycleSection(
        `Next cycle · ${shortDay(next * 10, 3)}–${shortDay(next * 10 + 9, 3)}`,
        nextApproved ? 'Approved' : `Starts in ${startsIn} · not approved yet`,
        next,
      )}
    </TabScreen>
  );

  function cycleSection(title: string, meta: string, cycle: number) {
    const days = cycleDays(cycle);
    const unplanned = days.every((d) => !findPlan(data.plans, d));
    return (
      <section aria-label={title} className="flex flex-col gap-1">
        <div className="pb-1">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="text-sm text-ink-muted">{meta}</p>
        </div>
        {unplanned ? (
          <p className="rounded-card border border-dashed border-line p-4 text-base text-ink-muted">
            Not planned yet. Approve it before day {shortDay(cycle * 10, 3)} starts to earn a reserve.
          </p>
        ) : (
          <ul className="-mx-3 flex flex-col">{days.map(dayRow)}</ul>
        )}
      </section>
    );
  }

  function dayRow(day: number) {
    const plan = findPlan(data.plans, day);
    const planned = isDayPlanned(day, data.cycles, data.plans, cfg);
    const summary = plan ? daySummary(plan.items, cfg, data.routines) : null;
    const isToday = day === record.today;
    const title = !summary ? 'Not planned' : planned ? summary.title : `${summary.title} (draft)`;
    const meta = isToday ? ['Today', summary?.meta].filter(Boolean).join(' · ') : summary?.meta || undefined;
    return (
      <li key={day}>
        <ListRow
          highlight={isToday}
          leading={
            <span className={cx('w-9 text-sm tabular-nums', isToday ? 'font-semibold text-ink' : 'text-ink-muted')}>
              {shortDay(day, 3)}
            </span>
          }
          title={title}
          meta={meta}
          muted={!summary || day < record.today}
          trailing={summary ? <StatusGlyph status={dayGlyph(day, record)} /> : undefined}
        />
      </li>
    );
  }
}
