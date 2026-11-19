import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Actions pinned under the content. */
  footer?: ReactNode;
}

/**
 * A bottom sheet on a native modal <dialog>: the browser traps focus, Esc
 * closes it and focus returns to the opener. A tap on the backdrop closes too.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // The dialog element itself is only hit outside the panel (backdrop).
        if (e.target === e.currentTarget) onClose();
      }}
      className="sheet m-0 mt-auto max-h-[85dvh] w-full max-w-none bg-transparent p-0 text-ink sm:mx-auto sm:max-w-md"
    >
      <div className="flex max-h-[85dvh] flex-col rounded-t-sheet border border-b-0 border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center gap-2 py-2 pl-5 pr-2">
          <h2 id={titleId} className="flex-1 truncate text-lg font-semibold">
            {title}
          </h2>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="flex flex-col gap-2 px-5 pb-5">{footer}</div>}
      </div>
    </dialog>
  );
}
