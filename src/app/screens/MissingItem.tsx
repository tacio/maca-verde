import { CircleSlash } from 'lucide-react';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { FullScreen } from '../../ui/FullScreen';
import { useNav } from '../nav';

/** A flow opened for a plan item (or a session) that no longer exists. */
export function MissingItem({ screen, title, body }: { screen: string; title: string; body: string }) {
  const { close } = useNav();
  return (
    <FullScreen
      screen={screen}
      title={title}
      onClose={close}
      dismiss="back"
      footer={
        <Button variant="primary" full onClick={close}>
          Back to Today
        </Button>
      }
    >
      <EmptyState icon={CircleSlash} title="Nothing to show" body={body} />
    </FullScreen>
  );
}
