import { CalendarCheck, CalendarPlus, CalendarRange, ChevronRight, LayoutTemplate } from 'lucide-react';
import { approvalFor, canEditDay, cycleDays, dayStartUnix, findPlan, isDayPlanned } from '../../domain/plan';
import { cycleOf, formatDuration, shortDay } from '../../time/daykeep';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { ListRow } from '../../ui/ListRow';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { StatusGlyph } from '../../ui/StatusGlyph';
import { cx } from '../../ui/cx';
import { useApp } from '../AppContext';
import { targetCycle } from '../cycle';
import { useNav } from '../nav';
import { dayGlyph, daySummary } from '../view';
import { cycleRange } from './CycleEditor';
import { TabScreen } from './TabScreen';

/** Plan: this cycle and the next; started days open read-only, upcoming ones open the day editor. */
export function PlanScreen() {
  const { data, record, now, cfg } = useApp();
  const { open } = useNav();
  const today = record.today;
  const current = cycleOf(today);
  const next = current + 1;
  const target = targetCycle(data.cycles, today);
  const targetApproved = !!approvalFor(data.cycles, target);

  const action = targetApproved ? (
    <Button variant="primary" full icon={CalendarCheck} onClick={() => open(`cycle:${target}`)}>
      Review next cycle
    </Button>
  ) : (
    <Button variant="primary" full icon={CalendarPlus} onClick={() => open(`cycle:${target}`)}>
      {target === current ? 'Plan this cycle' : target === next ? 'Plan next cycle' : `Plan cycle ${target}`}
    </Button>
  );

  const filledSlots = data.template.filter((slot) => slot.length > 0).length;
  const templateLink = (
    <Button variant="quiet" icon={LayoutTemplate} className="self-start px-2" onClick={() => open('settings-template')}>
      Template · {filledSlots ? `${filledSlots} of 10 days` : 'empty'}
    </Button>
  );

  if (!data.cycles.length) {
    return (
      <TabScreen screen="plan" action={action}>
        <ScreenHeader title="Plan" />
        <EmptyState icon={CalendarRange} title="No cycles yet" body="Plans cover 10 days at a time. Approve one before it starts." />
      </TabScreen>
    );
  }

  return (
    <TabScreen screen="plan" action={action}>
      <ScreenHeader title="Plan" />
      {cycleSection(current, 'This cycle')}
      {cycleSection(next, 'Next cycle')}
      {templateLink}
    </TabScreen>
  );

  function cycleSection(cycle: number, label: string) {
    const approval = approvalFor(data.cycles, cycle);
    const first = dayStartUnix(cycle * 10, cfg);
    const title = `${label} · ${cycleRange(cycle)}`;
    const openDays = cycleDays(cycle).filter((d) => canEditDay(d, now, cfg));
    let meta: string;
    if (approval) meta = 'Approved';
    else if (now < first) meta = `Starts in ${formatDuration(first - now, cfg)} · not approved yet`;
    else meta = 'Not approved';
    return (
      <section aria-label={title} className="flex flex-col gap-1">
        <div className="pb-1">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="text-sm tabular-nums text-ink-muted">{meta}</p>
        </div>
        {approval ? (
          <ul className="-mx-3 flex flex-col">{cycleDays(cycle).map(dayRow)}</ul>
        ) : (
          <p className="rounded-card border border-dashed border-line p-4 text-base text-ink-muted">
            {now < first
              ? `Approve it before day ${shortDay(cycle * 10, 3)} starts to earn a reserve.`
              : openDays.length
                ? `Days ${shortDay(openDays[0], 3)}–${shortDay(cycle * 10 + 9, 3)} can still be planned, without a reserve.`
                : 'No plan for this cycle.'}
          </p>
        )}
      </section>
    );
  }

  function dayRow(day: number) {
    const plan = findPlan(data.plans, day);
    const planned = isDayPlanned(day, data.cycles, data.plans, cfg);
    const editable = canEditDay(day, now, cfg);
    const summary = plan ? daySummary(plan.items, cfg, data.routines) : null;
    const isToday = day === today;
    const title = !summary ? 'Not planned' : planned || editable ? summary.title : `${summary.title} (not counted)`;
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
          muted={!summary || day < today}
          trailing={editable ? <ChevronRight aria-hidden size={18} /> : summary ? <StatusGlyph status={dayGlyph(day, record)} /> : undefined}
          onClick={() => open(`${editable ? 'day-edit' : 'day-locked'}:${day}`)}
        />
      </li>
    );
  }
}
