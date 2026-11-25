import { useState } from 'react';
import { ArrowLeft, ImageOff } from 'lucide-react';
import { LESSONS } from '../../data/lessons';
import type { LessonView } from '../../domain/types';
import { dayAt } from '../../domain/plan';
import { nowUnix } from '../../time/clock';
import { Button } from '../../ui/Button';
import { ChipGroup } from '../../ui/Chip';
import { FullScreen } from '../../ui/FullScreen';
import { exerciseName } from '../../workout/exerciseCues';
import { useApp } from '../AppContext';
import { findPlanItem } from '../items';
import { useNav } from '../nav';
import { newLogId } from '../today';
import { MissingItem } from './MissingItem';

const VIEW_LABEL: Record<LessonView, string> = { side: 'Side', front: 'Front', top: 'Top' };

/** A planned lesson (`learn:<itemId>`): completing it logs the lesson and ticks the item. */
export function LearnScreen({ itemId, step }: { itemId: string; step?: number }) {
  const { data } = useApp();
  const item = findPlanItem(data.plans, itemId, 'learn');
  if (!item) return <MissingItem screen="lesson" title="Lesson" body="This lesson isn't in the plan any more." />;
  return <LessonScreen skillId={item.skillId} log step={step} />;
}

/**
 * A lesson (J11, P14): one step per screen — a picture (with an angle switch
 * when the step has several), one instruction line — ending with a short try.
 * Untimed. With `log`, the last step's "Learned" stores a LessonLog; otherwise
 * it's a review (`lesson:<skillId>`) and logs nothing.
 */
export function LessonScreen({ skillId, log, step: initialStep }: { skillId: string; log?: boolean; step?: number }) {
  const { data, cfg, record, update } = useApp();
  const { open, close } = useNav();
  const lesson = LESSONS[skillId];
  const last = lesson ? lesson.steps.length - 1 : 0;
  const [step, setStep] = useState(() => Math.min(Math.max((initialStep ?? 1) - 1, 0), last));
  const [view, setView] = useState<LessonView | null>(null);
  if (!lesson) return <MissingItem screen="lesson" title="Lesson" body="There's no lesson for this exercise." />;

  const name = exerciseName(skillId);
  const s = lesson.steps[step];
  const shown = view && s.views.includes(view) ? view : s.views[0];
  const image = s.images?.[shown];
  // Already learned today: the last step just closes.
  const learnedToday = data.lessons.some((l) => l.skillId === skillId && dayAt(l.unix, cfg) === record.today);
  const logs = log && !learnedToday;

  const go = (i: number) => {
    setStep(i);
    setView(null);
  };
  const finish = () => {
    if (logs) {
      const unix = nowUnix();
      update((d) => ({ ...d, lessons: [...d.lessons, { id: newLogId('l', unix), skillId, unix }] }));
    }
    close();
  };

  const footer = (
    <div className="flex gap-2">
      {step > 0 && (
        <Button icon={ArrowLeft} className="min-h-14 shrink-0" onClick={() => go(step - 1)}>
          Back
        </Button>
      )}
      <Button variant="primary" full onClick={step < last ? () => go(step + 1) : finish}>
        {step < last ? 'Next' : logs ? 'Learned' : 'Done'}
      </Button>
    </div>
  );

  return (
    <FullScreen
      screen="lesson"
      title={name}
      onClose={close}
      trailing={
        <span className="shrink-0 px-3 text-sm tabular-nums text-ink-muted">
          Step {step + 1} of {last + 1}
        </span>
      }
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        {step === 0 && lesson.parts.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-1 text-sm text-ink-muted">
            <span>Built from</span>
            {lesson.parts.map((p) => (
              <Button key={p} variant="quiet" className="px-2" onClick={() => open(`lesson:${p}`)}>
                {exerciseName(p)}
              </Button>
            ))}
          </div>
        )}
        <figure className="flex flex-col gap-3">
          {image ? (
            <img
              data-step-image
              src={image}
              alt={`${name}, step ${step + 1}, ${VIEW_LABEL[shown].toLowerCase()} view`}
              className="aspect-[4/3] w-full rounded-card border border-line bg-surface object-contain"
            />
          ) : (
            <div
              data-step-image
              role="img"
              aria-label={`${name}, step ${step + 1}, ${VIEW_LABEL[shown].toLowerCase()} view: picture coming`}
              className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line bg-surface text-ink-muted"
            >
              <ImageOff aria-hidden size={28} strokeWidth={1.5} />
              <span className="text-sm">{VIEW_LABEL[shown]} view · picture coming</span>
            </div>
          )}
          {s.views.length > 1 && (
            <ChipGroup
              label="Angle"
              options={s.views.map((v) => ({ value: v, label: VIEW_LABEL[v] }))}
              value={shown}
              onChange={(v) => v && setView(v)}
            />
          )}
          <figcaption className="text-lg leading-snug text-ink">{s.text}</figcaption>
        </figure>
      </div>
    </FullScreen>
  );
}
