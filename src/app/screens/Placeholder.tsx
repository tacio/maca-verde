import { Hammer } from 'lucide-react';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { FullScreen } from '../../ui/FullScreen';
import { useNav } from '../nav';

/** Screens reachable from the shell that later milestones build. */
export const PLANNED_SCREENS: Record<string, { title: string; milestone: string }> = {
  workout: { title: 'Workout', milestone: 'M5' },
  'workout-log': { title: 'Workout log', milestone: 'M5' },
  drill: { title: 'Pause drill', milestone: 'M5' },
  rest: { title: 'Rest practice', milestone: 'M5' },
  history: { title: 'History', milestone: 'M6' },
  'settings-day': { title: 'Day', milestone: 'M6' },
  'settings-anchor': { title: 'Anchor', milestone: 'M6' },
  'settings-coach': { title: 'Coach', milestone: 'M6' },
  'settings-template': { title: 'Template', milestone: 'M6' },
  'settings-routines': { title: 'Routines', milestone: 'M6' },
  'settings-data': { title: 'Data', milestone: 'M6' },
  'settings-reset': { title: 'Reset', milestone: 'M6' },
};

/** A calm stand-in for a screen that isn't built yet; names the screen and its milestone. */
export function PlaceholderScreen({ name }: { name: string }) {
  const { close } = useNav();
  const known = PLANNED_SCREENS[name];
  const title = known?.title ?? name;
  return (
    <FullScreen
      screen={name}
      title={title}
      onClose={close}
      dismiss="back"
      footer={
        <Button variant="primary" full onClick={close}>
          Go back
        </Button>
      }
    >
      <EmptyState
        icon={Hammer}
        title={`${title} isn't built yet`}
        body={known ? `It arrives in milestone ${known.milestone}.` : 'No milestone builds this screen yet.'}
      />
    </FullScreen>
  );
}
