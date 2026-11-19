import { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { disconnect } from '../../../storage/drive';
import { clearData, emptyData } from '../../../storage/store';
import { Button } from '../../../ui/Button';
import { FullScreen } from '../../../ui/FullScreen';
import { TextField } from '../../../ui/TextField';
import { useApp } from '../../AppContext';
import { useNav } from '../../nav';

export const ERASE_WORD = 'ERASE';

/** Reset (J9): replay onboarding (data stays) or erase everything (typed confirmation). */
export function ResetScreen() {
  const { update } = useApp();
  const { close, closeAll, setTab } = useNav();
  const [typed, setTyped] = useState('');

  const leave = () => {
    closeAll();
    setTab('today');
  };

  const replay = () => {
    update((d) => {
      const { onboardedUnix: _, ...settings } = d.settings;
      return { ...d, settings };
    });
    leave();
  };

  const erase = () => {
    if (typed.trim() !== ERASE_WORD) return;
    clearData();
    disconnect();
    update(() => emptyData());
    leave();
  };

  return (
    <FullScreen
      screen="settings-reset"
      title="Reset"
      onClose={close}
      dismiss="back"
      footer={
        <Button variant="primary" full onClick={close}>
          Done
        </Button>
      }
    >
      <section aria-labelledby="replay-title" className="flex flex-col gap-2 pb-6">
        <h2 id="replay-title" className="text-base font-semibold text-ink">
          Replay setup
        </h2>
        <p className="text-sm text-ink-muted">Day, anchor and first plan again. Your data stays.</p>
        <Button icon={RotateCcw} className="self-start" onClick={replay}>
          Replay setup
        </Button>
      </section>
      <section aria-labelledby="erase-title" className="flex flex-col gap-3 border-t border-line pt-5">
        <h2 id="erase-title" className="text-base font-semibold text-ink">
          Erase all data
        </h2>
        <p className="text-sm text-ink-muted">Removes everything on this device. Export a backup first.</p>
        <TextField
          label={`Type ${ERASE_WORD} to confirm`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
        <Button
          icon={Trash2}
          className="self-start border-caution text-caution"
          disabled={typed.trim() !== ERASE_WORD}
          onClick={erase}
        >
          Erase all data
        </Button>
      </section>
    </FullScreen>
  );
}
