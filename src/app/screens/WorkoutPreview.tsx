import { ChevronDown, Play } from 'lucide-react';
import { EXERCISES } from '../../data/exercises';
import type { WorkoutItem } from '../../domain/types';
import { formatSeconds } from '../../time/seconds';
import { Button } from '../../ui/Button';
import { Sheet } from '../../ui/Sheet';
import { cx, focusRing } from '../../ui/cx';
import { useApp } from '../AppContext';
import { useNav } from '../nav';
import { itemFlow, routineSeconds, scaledRoutine } from '../today';
import { routineName, targetsText } from '../view';

/**
 * Workout preview (J4): what the session holds before starting it — target,
 * length, anchor, each interval at today's overload, and "How?" per exercise
 * (J10, P10). Start swaps the preview flow for the workout flow.
 */
export function WorkoutPreview({ item, onClose }: { item: WorkoutItem; onClose: () => void }) {
  const { data, cfg } = useApp();
  const { replace } = useNav();
  const routine = scaledRoutine(item.routineId, data.sessions, data.routines);
  const name = routineName(item.routineId, data.routines);
  const target = targetsText(item.targets, cfg);

  const facts: [string, string][] = [];
  if (target) facts.push(['Target', target]);
  if (routine) facts.push(['Length', formatSeconds(routineSeconds(routine))]);
  if (data.settings.anchor) facts.push(['When', data.settings.anchor]);

  return (
    <Sheet
      open
      onClose={onClose}
      title={name}
      footer={
        <Button variant="primary" full icon={Play} onClick={() => replace(itemFlow(item))}>
          Start
        </Button>
      }
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 pb-4 text-sm">
        {facts.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-ink-muted">{k}</dt>
            <dd className="truncate font-medium tabular-nums text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      {routine && (
        <section aria-labelledby="preview-round">
          <h3 id="preview-round" className="pb-1 text-sm font-medium text-ink-muted">
            {routine.rounds === 1 ? 'One round' : `${routine.rounds} rounds`} of {routine.exercises.length}
            {routine.rounds > 1 ? ` · ${routine.roundRestSeconds} s between rounds` : ''}
          </h3>
          <ol className="-mx-3 flex flex-col">
            {routine.exercises.map((ex, i) => {
              const info = EXERCISES[ex.exerciseId];
              return (
                <li key={`${ex.exerciseId}-${i}`}>
                  <details data-disclosure className="group">
                    <summary
                      className={cx(
                        'flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-card px-3 py-2',
                        'transition-colors duration-fast ease-calm hover:bg-surface-2 [&::-webkit-details-marker]:hidden',
                        focusRing,
                      )}
                    >
                      <span className="w-5 shrink-0 text-sm tabular-nums text-ink-muted">{i + 1}</span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-base text-ink">{info?.name ?? ex.exerciseId}</span>
                        <span className="truncate text-sm tabular-nums text-ink-muted">
                          {ex.workSeconds} s · rest {ex.restSeconds} s
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-accent">
                        How?
                        <ChevronDown aria-hidden size={16} className="transition-transform duration-fast ease-calm group-open:rotate-180" />
                      </span>
                    </summary>
                    {info && (
                      <div className="px-3 pb-3 pl-11 text-sm leading-relaxed text-ink-muted">
                        <ul className="list-disc pl-4">
                          {info.formPoints.map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                        {info.cadenceTip && <p className="pt-1">{info.cadenceTip}</p>}
                      </div>
                    )}
                  </details>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </Sheet>
  );
}
