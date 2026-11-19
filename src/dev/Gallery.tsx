/**
 * Dev-only gallery of the UI primitives in their states (?scenario=ui-gallery).
 * It runs through the same UX checks as real screens, so it doubles as the
 * primitives' test. One primary Button only (P9).
 */
import { useState, type ReactNode } from 'react';
import { Check, Play, Plus, Settings, Sprout, X } from 'lucide-react';
import { DEFAULT_CONFIG } from '../time/daykeep';
import { dayStartUnix } from '../domain/plan';
import {
  BottomNav,
  Button,
  Checkbox,
  ChipGroup,
  DayHeader,
  Disclosure,
  EmptyState,
  FullScreen,
  IconButton,
  ListRow,
  ProgressRing,
  ScreenHeader,
  Sheet,
  StatsBlock,
  StatusGlyph,
  Stepper,
  TextField,
  type Tab,
} from '../ui';

const HALT = [
  { value: 'hungry', label: 'Hungry' },
  { value: 'angry', label: 'Angry' },
  { value: 'lonely', label: 'Lonely' },
  { value: 'tired', label: 'Tired' },
] as const;
type Halt = (typeof HALT)[number]['value'];

const REASONS = [
  { value: 'big', label: 'Plan too big' },
  { value: 'time', label: 'Time' },
  { value: 'energy', label: 'Energy' },
] as const;
type Reason = (typeof REASONS)[number]['value'];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-ink-muted">{title}</h2>
      {children}
    </section>
  );
}

export default function Gallery() {
  const [rounds, setRounds] = useState(2);
  const [halt, setHalt] = useState<Halt[]>(['tired']);
  const [reason, setReason] = useState<Reason | null>('time');
  const [tab, setTab] = useState<Tab>('today');
  const [sheet, setSheet] = useState(false);
  const [full, setFull] = useState(false);
  const [epoch, setEpoch] = useState('2000-01-01 03:00 -0300');
  const [tpl, setTpl] = useState(true);
  const cfg = DEFAULT_CONFIG;
  const now = dayStartUnix(14355, cfg) + Math.floor(0.4 * cfg.dayLength);

  if (full) {
    return (
      <FullScreen
        screen="gallery"
        title="Full screen"
        onClose={() => setFull(false)}
        footer={
          <Button variant="primary" full onClick={() => setFull(false)}>
            Close
          </Button>
        }
      >
        <p className="text-base text-ink-muted">A flow without the bottom nav.</p>
      </FullScreen>
    );
  }

  return (
    <div data-screen="gallery" className="min-h-dvh bg-canvas">
      <main className="mx-auto flex max-w-md flex-col gap-10 px-5 pb-10 pt-6">
        <ScreenHeader title="UI gallery" meta="Primitives in their states" trailing={<IconButton icon={Settings} label="Settings" />} />

        <Section title="Day header">
          <DayHeader day={14355} now={now} cfg={cfg} />
        </Section>

        <Section title="Stats">
          <StatsBlock streak={12} reserves={2} average={0.73} averageDays={100} />
          <StatsBlock streak={0} bestStreak={19} reserves={0} average={0.82} averageDays={57} />
          <StatsBlock streak={0} reserves={1} average={null} averageDays={0} />
        </Section>

        <Section title="Buttons">
          <Button variant="primary" full icon={Play}>
            Start Tabata
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button>Secondary</Button>
            <Button icon={Plus}>With icon</Button>
            <Button disabled>Disabled</Button>
            <Button variant="quiet">Quiet</Button>
          </div>
          <div className="flex gap-1">
            <IconButton icon={Settings} label="Settings" />
            <IconButton icon={Check} label="Confirm" />
            <IconButton icon={X} label="Close" disabled />
          </div>
        </Section>

        <Section title="Checklist">
          <ul className="-mx-3 flex flex-col">
            <li>
              <ListRow leading={<StatusGlyph status="done" />} title="Mood check 1/2" muted />
            </li>
            <li>
              <ListRow leading={<StatusGlyph status="todo" />} title="Tabata · 2 rounds" meta="After coffee" />
            </li>
            <li>
              <ListRow leading={<StatusGlyph status="locked" />} title="Pause drill" meta="Locked for today" />
            </li>
            <li>
              <ListRow leading={<StatusGlyph status="current" />} title="Today" highlight />
            </li>
            <li>
              <ListRow leading={<StatusGlyph status="kept" />} title="Missed, streak kept" />
            </li>
            <li>
              <ListRow leading={<StatusGlyph status="missed" />} title="Missed" />
            </li>
            <li>
              <ListRow title="Tappable row" meta="Opens a sheet" trailing={<Plus aria-hidden size={18} />} onClick={() => setSheet(true)} />
            </li>
          </ul>
        </Section>

        <Section title="Progress">
          <div className="flex items-center gap-4">
            <ProgressRing value={0} label="0 of 4 done" />
            <ProgressRing value={0.5} label="2 of 4 done">
              2/4
            </ProgressRing>
            <ProgressRing value={1} label="4 of 4 done">
              <Check aria-hidden size={20} className="text-accent" />
            </ProgressRing>
          </div>
        </Section>

        <Section title="Inputs">
          <Stepper label="Rounds" hint="last 2 · suggested 3" value={rounds} min={1} max={12} onChange={setRounds} />
          <ChipGroup label="H.A.L.T." showLabel multiple options={HALT} value={halt} onChange={setHalt} />
          <ChipGroup label="What got in the way?" showLabel options={REASONS} value={reason} onChange={setReason} />
          <TextField label="Day 0 starts at" hint="e.g. 2000-01-01 03:00 -0300" value={epoch} onChange={(e) => setEpoch(e.target.value)} />
          <TextField label="Day length (seconds)" error="Use a whole number of seconds" defaultValue="86400.5" />
          <Checkbox checked={tpl} onChange={setTpl}>
            Save as template
          </Checkbox>
        </Section>

        <Section title="Disclosure">
          <div>
            <p className="text-base text-ink">Tabata: 20 s on, 10 s off, eight times.</p>
            <Disclosure summary="Why?">
              Short, maximal intervals raise oxygen use after the session (EPOC). Eight rounds take four minutes, which
              makes the habit easy to keep on busy days. Keep the effort high on each interval rather than pacing.
            </Disclosure>
          </div>
        </Section>

        <Section title="Sheet and full screen">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setSheet(true)}>Open sheet</Button>
            <Button onClick={() => setFull(true)}>Open full screen</Button>
          </div>
        </Section>

        <Section title="Empty state">
          <div className="rounded-card border border-line bg-surface">
            <EmptyState icon={Sprout} title="Nothing to show yet" body="Each planned day lands here as a square." />
          </div>
        </Section>

        <Section title="Bottom nav">
          <div className="overflow-hidden rounded-card border border-line">
            <BottomNav active={tab} onSelect={setTab} fixed={false} />
          </div>
        </Section>
      </main>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Tabata · 2 rounds"
        footer={<Button onClick={() => setSheet(false)}>Got it</Button>}
      >
        <p className="text-base text-ink-muted">Eight exercises, 20 s on and 10 s off.</p>
      </Sheet>
    </div>
  );
}
