import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Apple, ArrowLeft, Check } from 'lucide-react';
import { dayAt } from '../../domain/plan';
import type { AppData, DayConfig } from '../../domain/types';
import { discardLegacyData, importBackup } from '../../storage/store';
import { nowUnix } from '../../time/clock';
import {
  DEFAULT_CONFIG,
  formatDuration,
  formatTimeOfDay,
  fromUnix,
  isValidDayLength,
  parseDate,
  remainingInDay,
  shortDay,
} from '../../time/daykeep';
import { Button, IconButton } from '../../ui/Button';
import { TextField } from '../../ui/TextField';
import { cx } from '../../ui/cx';
import { useApp } from '../AppContext';
import { targetCycle } from '../cycle';
import { ONBOARD_STEPS, intArg, parseFlow, useNav, type OnboardStep } from '../nav';
import { CycleEditor } from './CycleEditor';
import { DayScreen } from './DayScreen';

/** daykeep's default epoch, as typed (never a personal one). */
export const DEFAULT_EPOCH_TEXT = '2000-01-01 00:00 +0000';
/** One-tap preset: a day that starts at 03:00 in UTC−3. */
export const PRESET_EPOCH_TEXT = '2000-01-01 03:00 -0300';

const IMPORT_ERRORS: Record<string, string> = {
  not_json: "That file isn't a backup.",
  not_a_backup: "That file isn't a Maçã Verde backup.",
  unsupported_version: 'That backup is from another version.',
};

/** Read the day settings as typed; an error message per field. */
export function readDayConfig(
  epochText: string,
  lengthText: string,
  now: number,
): { cfg: DayConfig | null; epochError: string | null; lengthError: string | null } {
  const epoch = parseDate(epochText);
  const len = /^\s*\d+\s*$/.test(lengthText) ? Number(lengthText) : NaN;
  const epochError =
    epoch === null ? 'Use a date like 2000-01-01 03:00 -0300' : epoch > now ? 'Day 0 has to be in the past' : null;
  const lengthError = isValidDayLength(len) ? null : 'Use a whole number of seconds';
  return { cfg: epochError || lengthError ? null : { epoch: epoch!, dayLength: len }, epochError, lengthError };
}

/** First use (J1): your day → anchor → first plan → Today. */
export function Onboarding({ initialStep }: { initialStep?: OnboardStep }) {
  const { data, update } = useApp();
  const nav = useNav();
  const [step, setStep] = useState<OnboardStep>(initialStep ?? 'day');
  const [epochText, setEpochText] = useState(DEFAULT_EPOCH_TEXT);
  const [lengthText, setLengthText] = useState(String(DEFAULT_CONFIG.dayLength));
  const [anchorText, setAnchorText] = useState(() => data.settings.anchor.replace(/^After I\s*/i, ''));
  const [restored, setRestored] = useState<AppData | null>(null);

  const finish = (restore?: AppData) => {
    update((d) => {
      const base = restore ?? d;
      return { ...base, settings: { ...base.settings, onboardedUnix: base.settings.onboardedUnix ?? nowUnix() } };
    });
    discardLegacyData();
    nav.setTab('today');
  };

  // The day editor opens over step 3; this component stays mounted so the steps keep their state.
  if (nav.flow) {
    const { name, args } = parseFlow(nav.flow);
    if (name === 'day-edit' || name === 'day-locked') {
      const day = intArg(args[0]);
      if (day !== undefined) return <DayScreen day={day} />;
    }
  }

  if (restored) return <Restored data={restored} onBack={() => setRestored(null)} onDone={() => finish(restored)} />;

  switch (step) {
    case 'day':
      return (
        <DayStep
          epochText={epochText}
          lengthText={lengthText}
          setEpochText={setEpochText}
          setLengthText={setLengthText}
          onRestored={setRestored}
          onNext={(cfg) => {
            update((d) => ({ ...d, settings: { ...d.settings, config: cfg } }));
            setStep('anchor');
          }}
        />
      );
    case 'anchor':
      return (
        <AnchorStep
          text={anchorText}
          setText={setAnchorText}
          onBack={() => setStep('day')}
          onNext={(text) => {
            const anchor = text.trim() ? `After I ${text.trim()}` : '';
            update((d) => ({ ...d, settings: { ...d.settings, anchor } }));
            setStep('plan');
          }}
        />
      );
    case 'plan':
      return <PlanStep onBack={() => setStep('anchor')} onFinish={() => finish()} />;
  }
}

/* --- frame ---------------------------------------------------------------- */

function Frame({
  step,
  onBack,
  title,
  intro,
  footer,
  children,
}: {
  step: OnboardStep | null;
  onBack?: () => void;
  title: string;
  intro?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const n = step ? ONBOARD_STEPS.indexOf(step) + 1 : 0;
  return (
    <div data-screen="onboarding" data-step={step ?? 'restored'} className="mx-auto flex min-h-dvh max-w-md flex-col bg-canvas">
      <header className="flex min-h-14 items-center justify-between gap-2 px-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        {onBack ? (
          <IconButton icon={ArrowLeft} label="Back" onClick={onBack} />
        ) : (
          <span className="flex items-center gap-2 px-3 text-base font-semibold text-ink">
            <Apple aria-hidden size={20} strokeWidth={2} className="text-accent" />
            Maçã Verde
          </span>
        )}
        {n > 0 && (
          <div className="flex items-center gap-1.5 px-3">
            <span className="sr-only">
              Step {n} of {ONBOARD_STEPS.length}
            </span>
            {ONBOARD_STEPS.map((s, i) => (
              <span key={s} aria-hidden className={cx('h-1.5 w-6 rounded-full', i < n ? 'bg-accent' : 'bg-line')} />
            ))}
          </div>
        )}
      </header>
      <main className="flex flex-1 flex-col gap-6 px-5 pb-6 pt-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
          {intro && <p className="mt-2 text-base tabular-nums text-ink-muted">{intro}</p>}
        </div>
        {children}
      </main>
      <div className="sticky bottom-0 flex flex-col gap-2 bg-canvas px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        {footer}
      </div>
    </div>
  );
}

/* --- step 1: your day --------------------------------------------------------- */

function DayStep({
  epochText,
  lengthText,
  setEpochText,
  setLengthText,
  onRestored,
  onNext,
}: {
  epochText: string;
  lengthText: string;
  setEpochText: (s: string) => void;
  setLengthText: (s: string) => void;
  onRestored: (data: AppData) => void;
  onNext: (cfg: DayConfig) => void;
}) {
  const { now } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const { cfg, epochError, lengthError } = readDayConfig(epochText, lengthText, now);
  const preset = epochText.trim() === PRESET_EPOCH_TEXT;

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const r = importBackup(await file.text());
    if (r.ok) {
      setRestoreError(null);
      onRestored(r.data);
    } else {
      setRestoreError(IMPORT_ERRORS[r.error] ?? `That backup is damaged (${r.error.replace(/^invalid:/, '')}).`);
    }
  };

  return (
    <Frame
      step="day"
      title="Your day"
      intro="Days are numbered from day 0. Pick when yours start."
      footer={
        <>
          <Button variant="primary" full disabled={!cfg} onClick={() => cfg && onNext(cfg)}>
            Continue
          </Button>
          <Button variant="quiet" full onClick={() => fileRef.current?.click()}>
            Restore from a backup
          </Button>
          {restoreError && (
            <p role="alert" className="text-center text-sm text-caution">
              {restoreError}
            </p>
          )}
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <TextField
          label="Day 0 starts at"
          value={epochText}
          onChange={(e) => setEpochText(e.target.value)}
          error={epochError}
          hint="Date, time and UTC offset"
          autoComplete="off"
          spellCheck={false}
        />
        <Button
          icon={preset ? Check : undefined}
          aria-pressed={preset}
          className="self-start"
          onClick={() => setEpochText(preset ? DEFAULT_EPOCH_TEXT : PRESET_EPOCH_TEXT)}
        >
          Day starts 03:00 at UTC−3
        </Button>
      </div>
      <TextField
        label="Day length (seconds)"
        value={lengthText}
        onChange={(e) => setLengthText(e.target.value)}
        error={lengthError}
        hint="86400 is 24 hours"
        inputMode="numeric"
        autoComplete="off"
      />
      {cfg && <DayPreview cfg={cfg} now={now} />}
    </Frame>
  );
}

function DayPreview({ cfg, now }: { cfg: DayConfig; now: number }) {
  const s = fromUnix(now, cfg);
  return (
    <div aria-live="polite" className="rounded-card bg-accent-soft p-4 tabular-nums">
      <p className="text-base text-ink">
        Today is day <span className="font-semibold">{shortDay(dayAt(now, cfg), 5)}</span>
      </p>
      <p className="text-sm text-ink-muted">
        now {formatTimeOfDay(s, cfg)} · ends in {formatDuration(remainingInDay(s, cfg), cfg)}
      </p>
    </div>
  );
}

/* --- step 2: anchor ------------------------------------------------------------ */

function AnchorStep({
  text,
  setText,
  onBack,
  onNext,
}: {
  text: string;
  setText: (s: string) => void;
  onBack: () => void;
  onNext: (text: string) => void;
}) {
  return (
    <Frame
      step="anchor"
      onBack={onBack}
      title="Your anchor"
      intro="Tie training to something you already do each morning."
      footer={
        <>
          <Button variant="primary" full disabled={!text.trim()} onClick={() => onNext(text)}>
            Continue
          </Button>
          <Button variant="quiet" full onClick={() => onNext('')}>
            Skip for now
          </Button>
        </>
      }
    >
      <TextField
        label="After I…"
        placeholder="have my coffee"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && text.trim() && onNext(text)}
        hint="…I train. It shows on your workout."
        autoComplete="off"
        enterKeyHint="next"
      />
    </Frame>
  );
}

/* --- step 3: first plan --------------------------------------------------------- */

function PlanStep({ onBack, onFinish }: { onBack: () => void; onFinish: () => void }) {
  const { data, record } = useApp();
  // Tomorrow to the end of the current cycle, or the whole next cycle (cycle.ts → targetCycle).
  const [cycle] = useState(() => targetCycle(data.cycles, record.today));
  return (
    <CycleEditor
      cycle={cycle}
      onFinish={onFinish}
      approveLabel="Approve plan"
      layout={({ subtitle, footer, children }) => (
        <Frame step="plan" onBack={onBack} title="Your first plan" intro={subtitle} footer={footer}>
          <p className="-mt-3 text-sm text-ink-muted">Suggested by the coach. Tap a day to adjust it.</p>
          {children}
        </Frame>
      )}
    />
  );
}

/* --- restored ------------------------------------------------------------------ */

function Restored({ data, onBack, onDone }: { data: AppData; onBack: () => void; onDone: () => void }) {
  const cfg = data.settings.config;
  return (
    <Frame
      step={null}
      onBack={onBack}
      title="Backup restored"
      intro={`${data.plans.length} planned days and ${data.sessions.length} workouts are ready.`}
      footer={
        <Button variant="primary" full onClick={onDone}>
          Open today
        </Button>
      }
    >
      <DayPreview cfg={cfg} now={nowUnix()} />
    </Frame>
  );
}
