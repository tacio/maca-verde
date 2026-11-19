import { Hammer } from 'lucide-react';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { FullScreen } from '../../ui/FullScreen';
import { useNav } from '../nav';

/** Screens reachable from the shell that later milestones build. */
export const PLANNED_SCREENS: Record<string, { title: string; milestone: string }> = {};

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
