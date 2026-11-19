import { useId, useState } from 'react';
import { ChevronRight, Copy } from 'lucide-react';
import { slotOf, templateFromPlans } from '../../../domain/plan';
import { Button } from '../../../ui/Button';
import { FullScreen } from '../../../ui/FullScreen';
import { ListRow } from '../../../ui/ListRow';
import { Sheet } from '../../../ui/Sheet';
import { useApp } from '../../AppContext';
import { targetCycle } from '../../cycle';
import { PROBLEM_TEXT, draftFromItems, draftToItems, type DayDraft } from '../../dayDraft';
import { useNav } from '../../nav';
import { daySummary } from '../../view';
import { cycleRange } from '../CycleEditor';
import { DraftEditor } from '../DayScreen';

/** The last approved cycle, or null. */
function lastApprovedCycle(cycles: { cycle: number }[]): number | null {
  return cycles.length ? Math.max(...cycles.map((c) => c.cycle)) : null;
}

/**
 * The template (J9 → Template): 10 slots, one per last digit of the day
 * number. It only pre-fills new cycles; an empty slot gets the coach's suggestion.
 */
export function TemplateScreen() {
  const { data, cfg, update } = useApp();
  const { open, close } = useNav();
  const [asking, setAsking] = useState(false);
  const source = lastApprovedCycle(data.cycles);

  const copy = () => {
    if (source === null) return;
    update((d) => ({ ...d, template: templateFromPlans(source, d.plans) }));
    setAsking(false);
  };

  return (
    <FullScreen
      screen="settings-template"
      title="Template"
      onClose={close}
      dismiss="back"
      footer={
        !asking && (
          <Button variant="primary" full onClick={close}>
            Done
          </Button>
        )
      }
    >
      <p className="pb-3 text-sm text-ink-muted">Pre-fills new cycles by the day’s last digit. Empty slots get the coach’s plan.</p>
      <ul className="-mx-3 flex flex-col">
        {data.template.map((items, slot) => {
          const sum = items.length ? daySummary(items, cfg, data.routines) : null;
          return (
            <li key={slot}>
              <ListRow
                leading={<span className="w-9 text-sm font-medium tabular-nums text-ink">·{slot}</span>}
                title={sum ? sum.title : 'Empty'}
                meta={sum ? sum.meta || undefined : 'Coach suggests'}
                muted={!sum}
                trailing={<ChevronRight aria-hidden size={18} />}
                onClick={() => open(`settings-template:${slot}`)}
              />
            </li>
          );
        })}
      </ul>
      {source !== null && (
        <Button icon={Copy} full className="mt-4" onClick={() => setAsking(true)}>
          Use cycle {cycleRange(source)}
        </Button>
      )}
      <Sheet
        open={asking}
        onClose={() => setAsking(false)}
        title="Replace the template?"
        footer={
          <>
            <Button variant="primary" full onClick={copy}>
              Replace all 10 slots
            </Button>
            <Button full onClick={() => setAsking(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <p className="text-base text-ink-muted">
          Each slot takes the plan of days {source === null ? '' : cycleRange(source)}. Days without a plan leave their slot empty.
        </p>
      </Sheet>
    </FullScreen>
  );
}

/** One template slot, edited with the day editor's cards. Saving it empty clears the slot. */
export function TemplateSlotScreen({ slot }: { slot: number }) {
  const { data, record, cfg, update } = useApp();
  const { close } = useNav();
  const [draft, setDraft] = useState<DayDraft>(() => draftFromItems(data.template[slot] ?? [], cfg));
  const result = draftToItems(draft, slot, cfg);
  const empty = !result.ok && result.problems.length === 1 && result.problems[0] === 'empty';
  const reason = result.ok || empty ? null : PROBLEM_TEXT[result.problems[0]];
  const reasonId = useId();
  // New workouts follow the rotation of the next cycle's day in this slot.
  const focusDay = targetCycle(data.cycles, record.today) * 10 + slotOf(slot);

  const save = () => {
    if (reason) return;
    const items = result.ok ? result.items : [];
    update((d) => ({ ...d, template: d.template.map((s, i) => (i === slot ? items : s)) }));
    close();
  };

  return (
    <FullScreen
      screen="settings-template-slot"
      title={`Template · slot ${slot}`}
      onClose={close}
      dismiss="back"
      footer={
        <div className="flex flex-col gap-2">
          {reason && (
            <p id={reasonId} className="text-center text-sm text-ink-muted">
              {reason}
            </p>
          )}
          <Button variant="primary" full disabled={!!reason} aria-describedby={reason ? reasonId : undefined} onClick={save}>
            {empty ? 'Save empty slot' : 'Save'}
          </Button>
        </div>
      }
    >
      <p className="pb-5 text-sm text-ink-muted">Days ending in {slot}. Only a starting point for new cycles.</p>
      <DraftEditor draft={draft} setDraft={setDraft} focusDay={focusDay} />
    </FullScreen>
  );
}
