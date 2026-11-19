import { Anchor, ChevronRight, Clock, Database, LayoutTemplate, ListOrdered, RotateCcw, Volume2, type LucideIcon } from 'lucide-react';
import { WORKOUT_ROUTINES } from '../../data/routines';
import { formatDuration, formatStamp, fromUnix } from '../../time/daykeep';
import { Button } from '../../ui/Button';
import { FullScreen } from '../../ui/FullScreen';
import { ListRow } from '../../ui/ListRow';
import { useApp } from '../AppContext';
import { useNav } from '../nav';

interface Section {
  id: string;
  icon: LucideIcon;
  title: string;
  meta: string;
}

/** Settings (shell): the section list; each section's detail screen comes later (J9). */
export function SettingsScreen() {
  const { data, cfg } = useApp();
  const { open, close } = useNav();
  const s = data.settings;
  const filledSlots = data.template.filter((slot) => slot.length > 0).length;
  const onOff = (on: boolean) => (on ? 'on' : 'off');

  const sections: Section[] = [
    { id: 'day', icon: Clock, title: 'Day', meta: `Day length ${formatDuration(cfg.dayLength, cfg)} · ${cfg.dayLength.toLocaleString('en')} s` },
    { id: 'anchor', icon: Anchor, title: 'Anchor', meta: s.anchor ? s.anchor : 'Not set' },
    { id: 'coach', icon: Volume2, title: 'Coach', meta: `Voice ${onOff(s.voice)} · beeps ${onOff(s.sound)}` },
    { id: 'template', icon: LayoutTemplate, title: 'Template', meta: filledSlots ? `${filledSlots} of 10 slots filled` : 'Empty' },
    {
      id: 'routines',
      icon: ListOrdered,
      title: 'Routines',
      meta: `${WORKOUT_ROUTINES.length} built-in · ${data.routines.length} custom`,
    },
    { id: 'data', icon: Database, title: 'Data', meta: s.drive.lastBackupUnix !== undefined ? `Last Drive backup ${formatStamp(fromUnix(s.drive.lastBackupUnix, cfg), cfg)}` : 'Export, import, Drive backup' },
    { id: 'reset', icon: RotateCcw, title: 'Reset', meta: 'Replay setup or erase data' },
  ];

  return (
    <FullScreen
      screen="settings"
      title="Settings"
      onClose={close}
      dismiss="back"
      footer={
        <Button variant="primary" full onClick={close}>
          Done
        </Button>
      }
    >
      <ul className="-mx-3 flex flex-col">
        {sections.map(({ id, icon: Icon, title, meta }) => (
          <li key={id}>
            <ListRow
              leading={<Icon aria-hidden size={20} strokeWidth={1.75} className="text-ink-muted" />}
              title={title}
              meta={meta}
              trailing={<ChevronRight aria-hidden size={18} />}
              onClick={() => open(`settings-${id}`)}
            />
          </li>
        ))}
      </ul>
    </FullScreen>
  );
}
