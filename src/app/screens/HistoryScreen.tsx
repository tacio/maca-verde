import type { ReactNode } from 'react';
import { CalendarX, ChevronRight, Circle, CircleCheck, Leaf, MessageSquareText, Smile, Wind, Dumbbell, type LucideIcon } from 'lucide-react';
import { shortDay } from '../../time/daykeep';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { FullScreen } from '../../ui/FullScreen';
import { ListRow } from '../../ui/ListRow';
import { StatusGlyph } from '../../ui/StatusGlyph';
import { cx } from '../../ui/cx';
import { useApp } from '../AppContext';
import { useNav } from '../nav';
import { dayDetail, historyRows, type DetailLine } from '../progress';
import { dayGlyph } from '../view';

/** History (J8): record days, newest first; a day opens its detail. */
export function HistoryScreen() {
  const { record, cfg, data } = useApp();
  const { open, close } = useNav();
  const rows = historyRows(record, cfg, data.routines);
  return (
    <FullScreen
      screen="history"
      title="History"
      onClose={close}
      dismiss="back"
      footer={
        <Button variant="primary" full onClick={close}>
          Done
        </Button>
      }
    >
      {rows.length === 0 ? (
        <EmptyState icon={CalendarX} title="No days yet" body="Each day of the record shows up here." />
      ) : (
        <ul className="-mx-3 flex flex-col">
          {rows.map((r) => (
            <li key={r.day}>
              <ListRow
                highlight={r.kind === 'today'}
                leading={
                  <span className="flex w-14 items-center gap-2">
                    <StatusGlyph status={dayGlyph(r.day, record)} />
                    <span className="text-sm tabular-nums text-ink-muted">{shortDay(r.day, 3)}</span>
                  </span>
                }
                title={r.title}
                meta={r.meta}
                trailing={<ChevronRight aria-hidden size={18} />}
                onClick={() => open(`history:${r.day}`)}
              />
            </li>
          ))}
        </ul>
      )}
    </FullScreen>
  );
}

/** One day: its plan (each item done or not), what was logged, and the reason if it was missed. */
export function HistoryDayScreen({ day }: { day: number }) {
  const { data, record, cfg } = useApp();
  const { close } = useNav();
  const d = dayDetail(day, data, record, cfg);
  const nothing = !d.items.length && !d.sessions.length && !d.rests.length && !d.moods.length && !d.drills.length;
  return (
    <FullScreen
      screen="history-day"
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
        <StatusGlyph status={dayGlyph(day, record)} />
        {d.status}
      </p>

      {d.justification && (
        <section aria-label="Reason" className="mb-5 flex gap-3 rounded-card bg-surface-2 p-4">
          <MessageSquareText aria-hidden size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-ink-muted" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{d.justification.reason}</p>
            <p className="text-base text-ink">“{d.justification.text}”</p>
          </div>
        </section>
      )}

      {nothing && <EmptyState icon={CalendarX} title="Nothing on this day" body="No plan and nothing logged." />}

      <div className="flex flex-col gap-5">
        {d.items.length > 0 && (
          <Section title="Plan">
            {d.items.map((i) => (
              <li key={i.id} className="flex min-h-12 items-center gap-3 px-3">
                {i.done ? (
                  <CircleCheck aria-label="Done" size={20} strokeWidth={2} className="shrink-0 text-accent" />
                ) : (
                  <Circle aria-label="Not done" size={20} strokeWidth={1.75} className="shrink-0 text-ink-muted" />
                )}
                <span className={cx('truncate text-base', i.done ? 'text-ink' : 'text-ink-muted')}>{i.text}</span>
              </li>
            ))}
          </Section>
        )}
        <Lines title="Workouts" icon={Dumbbell} lines={d.sessions} />
        <Lines title="Rest" icon={Leaf} lines={d.rests} />
        <Lines title="Mood checks" icon={Smile} lines={d.moods} />
        <Lines title="Pause drills" icon={Wind} lines={d.drills} />
      </div>
    </FullScreen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="pb-1 text-sm font-medium text-ink-muted">{title}</h2>
      <ul className="-mx-3 flex flex-col">{children}</ul>
    </section>
  );
}

function Lines({ title, icon: Icon, lines }: { title: string; icon: LucideIcon; lines: DetailLine[] }) {
  if (!lines.length) return null;
  return (
    <Section title={title}>
      {lines.map((l) => (
        <li key={l.id}>
          <ListRow leading={<Icon aria-hidden size={20} strokeWidth={1.75} className="text-ink-muted" />} title={l.title} meta={l.meta} />
        </li>
      ))}
    </Section>
  );
}
