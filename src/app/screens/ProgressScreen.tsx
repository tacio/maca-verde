import { BadgeCheck, CalendarRange, History, Settings, Sprout } from 'lucide-react';
import { personalRecords } from '../../domain/engine';
import { RESERVE_CAP } from '../../domain/record';
import { shortDay } from '../../time/daykeep';
import { formatSeconds } from '../../time/seconds';
import { Button, IconButton } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { StatsBlock } from '../../ui/StatsBlock';
import { cx } from '../../ui/cx';
import { DayCell } from '../DayCell';
import { useApp } from '../AppContext';
import { useNav } from '../nav';
import {
  NECK_MAX,
  VALENCE_MAX,
  moodTrend,
  neckTrend,
  trendAverage,
  trendLabel,
  valenceWord,
  type TrendPoint,
} from '../progress';
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

const card = 'flex flex-col gap-3 rounded-card border border-line bg-surface p-4';

/**
 * Progress (J8): streak, average and streak protection; the last 100 days as
 * 10 cycles × 10 days with clean cycles marked; records; 10-day trends.
 * The primary opens the history (days, newest first → one day's detail).
 */
export function ProgressScreen() {
  const { data, record, cfg } = useApp();
  const { open, setTab } = useNav();

  const header = (
    <ScreenHeader title="Progress" trailing={<IconButton icon={Settings} label="Settings" onClick={() => open('settings')} />} />
  );

  if (record.recordStartDay === null || record.recordStartDay > record.today) {
    return (
      <TabScreen
        screen="progress"
        action={
          <Button variant="primary" full icon={CalendarRange} onClick={() => setTab('plan')}>
            See the plan
          </Button>
        }
      >
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
  const anyClean = grid.some((r) => r.clean);
  const rec = personalRecords(data.sessions);
  const neck = neckTrend(data.sessions, record.today, cfg);
  const mood = moodTrend(data.moods, record.today, cfg);
  const neckAvg = trendAverage(neck);
  const moodAvg = trendAverage(mood);

  return (
    <TabScreen
      screen="progress"
      action={
        <Button variant="primary" full icon={History} onClick={() => open('history')}>
          History
        </Button>
      }
    >
      {header}
      <StatsBlock
        streak={record.streak}
        bestStreak={record.bestStreak}
        reserves={record.reservesHeld}
        reserveCap={RESERVE_CAP}
        average={record.average}
        averageDays={record.averageDays}
      />

      <section aria-labelledby="grid-title" className={card}>
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
            <li key={row.cycle} data-clean-cycle={row.clean ? '' : undefined} className="flex items-center gap-2">
              <span aria-hidden className={cx('w-7 shrink-0 text-xs tabular-nums', row.clean ? 'font-semibold text-ink' : 'text-ink-muted')}>
                {shortDay(row.cycle * 10, 3)}
              </span>
              <ol
                aria-label={`Days ${shortDay(row.cycle * 10, 3)}–${shortDay(row.cycle * 10 + 9, 3)}${row.clean ? ', clean cycle' : ''}`}
                className="grid flex-1 grid-cols-10 gap-1"
              >
                {row.cells.map((c) => (
                  <li key={c.day} aria-label={`${shortDay(c.day, 3)} ${CELL_LABEL[c.kind]}`}>
                    <DayCell kind={c.kind} />
                  </li>
                ))}
              </ol>
              <span aria-hidden className="flex w-4 shrink-0 justify-center text-accent">
                {row.clean && <BadgeCheck size={16} strokeWidth={2.25} />}
              </span>
            </li>
          ))}
        </ol>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-ink-muted">
          {legend.map((k) => (
            <li key={k} className="flex items-center gap-1.5">
              <span className="w-3">
                <DayCell kind={k} />
              </span>
              {k === 'kept' ? 'kept' : CELL_LABEL[k]}
            </li>
          ))}
          {anyClean && (
            <li className="flex items-center gap-1.5">
              <BadgeCheck aria-hidden size={13} strokeWidth={2.25} className="text-accent" />
              clean cycle
            </li>
          )}
        </ul>
      </section>

      <section aria-labelledby="records-title" className={card}>
        <h2 id="records-title" className="text-base font-semibold text-ink">
          Records
        </h2>
        <dl className="grid grid-cols-3 gap-3">
          <RecordCell label="dead hang" value={rec.maxHangSeconds ? formatSeconds(rec.maxHangSeconds) : '—'} />
          <RecordCell label="rope turns" value={rec.maxRopeTurns ? String(rec.maxRopeTurns) : '—'} />
          <RecordCell label="rounds" value={rec.maxRounds ? String(rec.maxRounds) : '—'} />
        </dl>
      </section>

      <section aria-labelledby="trends-title" className={card}>
        <h2 id="trends-title" className="text-base font-semibold text-ink">
          Last 10 days
        </h2>
        <Trend name="Neck tension" points={neck} max={NECK_MAX} summary={neckAvg === null ? '—' : `${neckAvg} / 10`} />
        <Trend name="Mood" points={mood} max={VALENCE_MAX} summary={valenceWord(moodAvg)} />
      </section>
    </TabScreen>
  );
}

function RecordCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col-reverse">
      <dt className="truncate text-sm text-ink-muted">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums text-ink">{value}</dd>
    </div>
  );
}

/** A 10-day bar row: one bar per day (height = value), a dot where nothing was logged. */
function Trend({ name, points, max, summary }: { name: string; points: TrendPoint[]; max: number; summary: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 truncate text-sm text-ink">{name}</span>
      <div role="img" aria-label={trendLabel(name, points)} className="flex h-8 flex-1 items-end gap-1">
        {points.map((p) => (
          <span key={p.day} className="flex h-full flex-1 items-end justify-center">
            {p.value === null ? (
              <span className="mb-0.5 size-1 rounded-full bg-line" />
            ) : (
              <span
                className="w-full rounded-sm bg-accent"
                style={{ height: `${Math.max(12, (p.value / max) * 100)}%` }}
              />
            )}
          </span>
        ))}
      </div>
      <span className="w-16 shrink-0 text-right text-sm tabular-nums text-ink-muted">{summary}</span>
    </div>
  );
}
