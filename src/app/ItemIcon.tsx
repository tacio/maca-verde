import { Dumbbell, GraduationCap, Leaf, Smile, Wind, type LucideIcon } from 'lucide-react';
import type { PlanItemKind } from '../domain/types';

/** One icon per plan item kind (◐ mood, ⚡ drill in the wireframes). */
export const ITEM_ICON: Record<PlanItemKind, LucideIcon> = {
  workout: Dumbbell,
  rest: Leaf,
  mood: Smile,
  drill: Wind,
  learn: GraduationCap,
};

const COUNT_LABEL = { mood: ['mood check', 'mood checks'], drill: ['pause drill', 'pause drills'] } as const;

/** "◐ 2" as an icon and a number, with a spoken label. Renders nothing at 0. */
export function CountBadge({ kind, count }: { kind: 'mood' | 'drill'; count: number }) {
  if (count <= 0) return null;
  const Icon = ITEM_ICON[kind];
  const [one, many] = COUNT_LABEL[kind];
  return (
    <span role="img" aria-label={`${count} ${count === 1 ? one : many}`} className="inline-flex items-center gap-1 text-sm tabular-nums text-ink-muted">
      <Icon aria-hidden size={15} strokeWidth={2} />
      {count}
    </span>
  );
}
