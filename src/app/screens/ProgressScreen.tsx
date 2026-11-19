import { Diamond, Settings, Sprout } from 'lucide-react';
import { RESERVE_CAP } from '../../domain/record';
import { shortDay } from '../../time/daykeep';
import { Button, IconButton } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { StatsBlock } from '../../ui/StatsBlock';
import { cx } from '../../ui/cx';
import { useApp } from '../AppContext';
import { useNav } from '../nav';
import { lastHundredGrid, type CellKind } from '../view';
import { TabScreen } from './TabScreen';

const CELL_LABEL: Record<CellKind, string> = {
  done: 'done',
  kept: 'missed, streak kept',
  missed: 'missed',
  today: 'today',
  future: 'upcoming',
  outside: 'before the record',
};

/** One grid cell. Kinds differ by fill, outline and mark, not only color. */
function Cell({ kind }: { kind: CellKind }) {
  const base = 'flex aspect-square w-full items-center justify-center rounded-[5px]';
  switch (kind) {
    case 'done':
      return <span className={cx(base, 'bg-accent')} />;
    case 'kept':
      return (
        <span className={cx(base, 'border-[1.5px] border-accent text-accent')}>
          <Diamond aria-hidden size={10} strokeWidth={3} />
        </span>
      );
    case 'missed':
      return <span className={cx(base, 'border-[1.5px] border-ink-muted')} />;
    case 'today':
      return (
        <span className={cx(base, 'border-2 border-accent')}>
          <span className="size-1.5 rounded-full bg-accent" />
        </span>
      );
    case 'future':
      return <span className={cx(base, 'border border-dashed border-line')} />;
    default:
      return (
        <span className={base}>
          <span className="size-1 rounded-full bg-line" />
        </span>
      );
  }
}

/** Progress (shell): stats + the last 100 days as 10 cycles × 10 days. */
export function ProgressScreen() {
  const { record } = useApp();
  const { open, setTab } = useNav();

  const header = (
    <ScreenHeader title="Progress" trailing={<IconButton icon={Settings} label="Settings" onClick={() => open('settings')} />} />
  );
  const action = (
    <Button variant="primary" full onClick={() => setTab('today')}>
      Back to today
    </Button>
  );

  if (record.recordStartDay === null || record.recordStartDay > record.today) {
    return (
      <TabScreen screen="progress" action={action}>
        {header}
        <EmptyState
          icon={Sprout}
          title="Nothing to show yet"
          body={
            record.recordStartDay === null
              ? 'Each planned day lands here as a square.'
              : `Your record starts on day ${shortDay(record.recordStartDay, 3)}. Each day lands here as a square.`
          }
        />
      </TabScreen>
    );
  }

  const grid = lastHundredGrid(record);
  const legend: CellKind[] = ['done', 'kept', 'missed', 'today'];

  return (
    <TabScreen screen="progress" action={action}>
      {header}
      <StatsBlock
        streak={record.streak}
        bestStreak={record.bestStreak}
        reserves={record.reservesHeld}
        reserveCap={RESERVE_CAP}
        average={record.average}
        averageDays={record.averageDays}
      />
      <section aria-labelledby="grid-title" className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <h2 id="grid-title" className="text-base font-semibold text-ink">
            Last 100 days
          </h2>
          <p className="text-sm tabular-nums text-ink-muted">
            {record.averageDone} of {record.averageDays} done
          </p>
        </div>
        <ol className="flex flex-col gap-1">
          {grid.map((row) => (
            <li key={row.cycle} className="flex items-center gap-2">
              <span aria-hidden className="w-7 shrink-0 text-xs tabular-nums text-ink-muted">
                {shortDay(row.cycle * 10, 3)}
              </span>
              <ol
                aria-label={`Days ${shortDay(row.cycle * 10, 3)}–${shortDay(row.cycle * 10 + 9, 3)}`}
                className="grid flex-1 grid-cols-10 gap-1"
              >
                {row.cells.map((c) => (
                  <li key={c.day} aria-label={`${shortDay(c.day, 3)} ${CELL_LABEL[c.kind]}`}>
                    <Cell kind={c.kind} />
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-ink-muted">
          {legend.map((k) => (
            <li key={k} className="flex items-center gap-1.5">
              <span className="w-3">
                <Cell kind={k} />
              </span>
              {k === 'kept' ? 'kept' : CELL_LABEL[k]}
            </li>
          ))}
        </ul>
      </section>
    </TabScreen>
  );
}
