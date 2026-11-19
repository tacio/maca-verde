import { useState } from 'react';
import { FullScreen } from '../../ui/FullScreen';
import { useApp } from '../AppContext';
import { targetCycle } from '../cycle';
import { useNav } from '../nav';
import { CycleEditor, cycleRange } from './CycleEditor';

/**
 * Cycle approval (J2) as a full-screen flow. Without an explicit cycle it
 * opens the one to plan next (cycle.ts → targetCycle), fixed at mount so
 * approving doesn't jump to the following cycle.
 */
export function CycleScreen({ cycle }: { cycle?: number }) {
  const { data, record } = useApp();
  const { close } = useNav();
  const [c] = useState(() => cycle ?? targetCycle(data.cycles, record.today));
  return (
    <CycleEditor
      cycle={c}
      onFinish={close}
      layout={({ subtitle, footer, children }) => (
        <FullScreen screen="cycle" title={`Cycle ${c} · days ${cycleRange(c)}`} onClose={close} footer={footer}>
          <p className="pb-5 text-sm tabular-nums text-ink-muted">{subtitle}</p>
          {children}
        </FullScreen>
      )}
    />
  );
}
