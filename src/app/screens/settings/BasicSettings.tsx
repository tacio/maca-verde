import { useState } from 'react';
import { Check, Volume2 } from 'lucide-react';
import { coach } from '../../../audio/coach';
import { dayAt } from '../../../domain/plan';
import { shortDay } from '../../../time/daykeep';
import { Button } from '../../../ui/Button';
import { Checkbox } from '../../../ui/Checkbox';
import { FullScreen } from '../../../ui/FullScreen';
import { Sheet } from '../../../ui/Sheet';
import { TextField } from '../../../ui/TextField';
import { useApp } from '../../AppContext';
import { useNav } from '../../nav';
import { DayPreview, PRESET_EPOCH_TEXT, epochText, readDayConfig } from '../Onboarding';

/* --- Day ------------------------------------------------------------------------ */

/**
 * Day 0 and day length (J9 → Day). Changing them regroups every log into
 * other day numbers, so saving asks for an explicit confirmation.
 * `confirm` (dev scenarios) opens the confirmation with a changed epoch.
 */
export function SettingsDayScreen({ confirm }: { confirm?: boolean }) {
  const { now, cfg, update } = useApp();
  const { close } = useNav();
  const current = epochText(cfg.epoch);
  const [epoch, setEpoch] = useState(() => (confirm && current !== PRESET_EPOCH_TEXT ? PRESET_EPOCH_TEXT : current));
  const [length, setLength] = useState(String(cfg.dayLength));
  const [asking, setAsking] = useState(!!confirm);
  const read = readDayConfig(epoch, length, now);
  const next = read.cfg;
  const changed = !!next && (next.epoch !== cfg.epoch || next.dayLength !== cfg.dayLength);
  const preset = epoch.trim() === PRESET_EPOCH_TEXT;

  const apply = () => {
    if (!next) return;
    update((d) => ({ ...d, settings: { ...d.settings, config: next } }));
    setAsking(false);
    close();
  };

  return (
    <FullScreen
      screen="settings-day"
      title="Day"
      onClose={close}
      dismiss="back"
      footer={
        !(asking && changed) && (
          <Button variant="primary" full disabled={!changed} onClick={() => setAsking(true)}>
            Save
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <TextField
            label="Day 0 starts at"
            value={epoch}
            onChange={(e) => setEpoch(e.target.value)}
            error={read.epochError}
            hint="Date, time and UTC offset"
            autoComplete="off"
            spellCheck={false}
          />
          <Button icon={preset ? Check : undefined} aria-pressed={preset} className="self-start" onClick={() => setEpoch(PRESET_EPOCH_TEXT)}>
            Day starts 03:00 at UTC−3
          </Button>
        </div>
        <TextField
          label="Day length (seconds)"
          value={length}
          onChange={(e) => setLength(e.target.value)}
          error={read.lengthError}
          hint="86400 is 24 hours"
          inputMode="numeric"
          autoComplete="off"
        />
        {next && <DayPreview cfg={next} now={now} />}
      </div>
      <Sheet
        open={asking && changed}
        onClose={() => setAsking(false)}
        title="Change your day?"
        footer={
          <>
            <Button variant="primary" full onClick={apply}>
              Change day
            </Button>
            <Button full onClick={() => setAsking(false)}>
              Keep as it is
            </Button>
          </>
        }
      >
        {next && (
          <div className="flex flex-col gap-2 text-base text-ink">
            <p className="tabular-nums">
              {dayAt(now, next) === dayAt(now, cfg)
                ? `Today stays day ${shortDay(dayAt(now, cfg), 5)}, but day boundaries move.`
                : `Today becomes day ${shortDay(dayAt(now, next), 5)} (now ${shortDay(dayAt(now, cfg), 5)}).`}
            </p>
            <p className="text-ink-muted">Past logs may move to other day numbers. Plans keep theirs.</p>
          </div>
        )}
      </Sheet>
    </FullScreen>
  );
}

/* --- Anchor ----------------------------------------------------------------------- */

/** "After I ___, I train." (P4). Optional: empty clears it. */
export function SettingsAnchorScreen() {
  const { data, update } = useApp();
  const { close } = useNav();
  const [text, setText] = useState(() => data.settings.anchor.replace(/^After I\s*/i, ''));
  const save = () => {
    const anchor = text.trim() ? `After I ${text.trim()}` : '';
    update((d) => ({ ...d, settings: { ...d.settings, anchor } }));
    close();
  };
  return (
    <FullScreen
      screen="settings-anchor"
      title="Anchor"
      onClose={close}
      dismiss="back"
      footer={
        <Button variant="primary" full onClick={save}>
          Save
        </Button>
      }
    >
      <TextField
        label="After I…"
        placeholder="have my coffee"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        hint="…I train. Leave empty for no anchor."
        autoComplete="off"
        enterKeyHint="done"
      />
    </FullScreen>
  );
}

/* --- Coach ------------------------------------------------------------------------ */

/** Beeps and voice for workouts, drills and rest (P12). Changes apply at once. */
export function SettingsCoachScreen() {
  const { data, update } = useApp();
  const { close } = useNav();
  const { sound, voice } = data.settings;
  const set = (patch: { sound?: boolean; voice?: boolean }) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  const test = () => {
    coach.configure({ sound, voice });
    coach.announce({ beep: 'start', text: voice ? 'Coach check. This is how workouts sound.' : '' });
  };
  return (
    <FullScreen
      screen="settings-coach"
      title="Coach"
      onClose={close}
      dismiss="back"
      footer={
        <Button variant="primary" full onClick={close}>
          Done
        </Button>
      }
    >
      <div className="flex flex-col gap-1">
        <Checkbox checked={voice} onChange={(v) => set({ voice: v })}>
          Voice: exercise, cues, 3-2-1
        </Checkbox>
        <Checkbox checked={sound} onChange={(v) => set({ sound: v })}>
          Beeps between phases
        </Checkbox>
      </div>
      <Button icon={Volume2} className="mt-4" disabled={!sound && !voice} onClick={test}>
        Test voice
      </Button>
      {!sound && !voice && <p className="pt-2 text-sm text-ink-muted">Workouts run silently.</p>}
    </FullScreen>
  );
}
