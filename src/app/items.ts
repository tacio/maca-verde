/** Finding the plan item a flow (`workout:<id>`, `rest:<id>`) was opened for. */

import type { DayPlan, PlanItem } from '../domain/types';

/** The item with `id` and `kind` in any plan (ids are unique: `${day}-${index}`), or undefined. */
export function findPlanItem<K extends PlanItem['kind']>(
  plans: DayPlan[],
  id: string,
  kind: K,
): Extract<PlanItem, { kind: K }> | undefined {
  for (const p of plans)
    for (const i of p.items) if (i.id === id && i.kind === kind) return i as Extract<PlanItem, { kind: K }>;
  return undefined;
}
