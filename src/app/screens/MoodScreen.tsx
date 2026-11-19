import { useId, useState } from 'react';
import { Angry, BatteryLow, ChevronDown, Frown, Laugh, Meh, Smile, type LucideIcon } from 'lucide-react';
import type { ValenceType } from '../../domain/types';
import { nowUnix } from '../../time/clock';
import { Button } from '../../ui/Button';
import { ChipGroup } from '../../ui/Chip';
import { FullScreen } from '../../ui/FullScreen';
import { inputClass } from '../../ui/TextField';
import { cx, focusRing } from '../../ui/cx';
import { useApp } from '../AppContext';
import { useNav } from '../nav';
import {
  HALT_OPTIONS,
  TENSION_OPTIONS,
  VALENCE_LABEL,
  VALENCES,
  buildMoodCheck,
  emptyMoodDraft,
  newLogId,
  type MoodDraft,
  type OneToFive,
} from '../today';

const VALENCE_ICON: Record<ValenceType, LucideIcon> = {
  great: Laugh,
  good: Smile,
  neutral: Meh,
  frustrated: Angry,
  exhausted: BatteryLow,
  anxious: Frown,
};

/**
 * Mood check (J5, P11): valence, HALT, save — two taps on the default path.
 * Energy, tension, speaking and notes wait behind "More" and are stored only
 * when touched. `more` opens the disclosure (dev scenario `mood-more`).
 */
export function MoodScreen({ more }: { more?: boolean }) {
  const { update } = useApp();
  const { close } = useNav();
  const [d, setD] = useState<MoodDraft>(emptyMoodDraft);
  const set = (patch: Partial<MoodDraft>) => setD((x) => ({ ...x, ...patch }));
  const notesId = useId();

  const save = () => {
    const unix = nowUnix();
    const m = buildMoodCheck(d, newLogId('m', unix), unix);
    if (!m) return;
    update((data) => ({ ...data, moods: [...data.moods, m] }));
    close();
  };

  return (
    <FullScreen
      screen="mood"
      title="How are you?"
      onClose={close}
      footer={
        <Button variant="primary" full disabled={!d.valence} onClick={save}>
          Save
        </Button>
      }
    >
      <div className="flex flex-col gap-6 pt-2">
        <div role="radiogroup" aria-label="Mood" className="grid grid-cols-3 gap-2">
          {VALENCES.map((v) => {
            const Icon = VALENCE_ICON[v];
            const on = d.valence === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set({ valence: v })}
                className={cx(
                  'flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-card border px-1 text-sm',
                  'transition-colors duration-fast ease-calm',
                  on ? 'border-accent bg-accent-soft font-medium text-ink' : 'border-line bg-surface text-ink hover:bg-surface-2',
                  focusRing,
                )}
              >
                <Icon aria-hidden size={30} strokeWidth={on ? 2 : 1.75} className={on ? 'text-accent' : 'text-ink-muted'} />
                {VALENCE_LABEL[v]}
              </button>
            );
          })}
        </div>

        <ChipGroup
          label="Right now, any of these?"
          showLabel
          multiple
          options={HALT_OPTIONS}
          value={d.halt}
          onChange={(halt) => set({ halt })}
        />

        <details data-disclosure className="group" open={more}>
          <summary
            className={cx(
              'inline-flex min-h-12 min-w-12 cursor-pointer list-none items-center gap-1 rounded-control px-1 text-sm font-medium text-accent',
              '[&::-webkit-details-marker]:hidden',
              focusRing,
            )}
          >
            More
            <span className="font-normal text-ink-muted">· energy, tension, notes</span>
            <ChevronDown aria-hidden size={16} className="transition-transform duration-fast ease-calm group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-5 pt-3">
            <Scale label="Energy" low="drained" high="charged" value={d.energy} onChange={(energy) => set({ energy })} />
            <ChipGroup
              label="Tension"
              showLabel
              multiple
              options={TENSION_OPTIONS}
              value={d.tension ?? []}
              onChange={(tension) => set({ tension })}
            />
            <Scale
              label="Paused before speaking"
              low="rarely"
              high="every time"
              value={d.speakingRating}
              onChange={(speakingRating) => set({ speakingRating })}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor={notesId} className="text-sm font-medium text-ink-muted">
                Notes
              </label>
              <textarea
                id={notesId}
                rows={3}
                value={d.notes ?? ''}
                onChange={(e) => set({ notes: e.target.value })}
                className={cx(inputClass, 'w-full resize-none py-3')}
              />
            </div>
          </div>
        </details>
      </div>
    </FullScreen>
  );
}

/** 1–5 as five 48 px choices, with words at both ends. */
function Scale({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  value: OneToFive | undefined;
  onChange: (v: OneToFive) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink-muted">{label}</span>
      <div className="flex gap-2">
        {([1, 2, 3, 4, 5] as const).map((n) => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${n}${n === 1 ? `, ${low}` : n === 5 ? `, ${high}` : ''}`}
              onClick={() => onChange(n)}
              className={cx(
                'flex min-h-12 flex-1 items-center justify-center rounded-control border text-base tabular-nums',
                'transition-colors duration-fast ease-calm',
                on ? 'border-accent bg-accent-soft font-semibold text-ink' : 'border-line bg-surface text-ink hover:bg-surface-2',
                focusRing,
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-sm text-ink-muted">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
