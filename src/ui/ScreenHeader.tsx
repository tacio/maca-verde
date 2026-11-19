import type { ReactNode } from 'react';

export interface ScreenHeaderProps {
  title: string;
  /** One muted line under the title. */
  meta?: ReactNode;
  /** Usually an IconButton (e.g. the settings gear). */
  trailing?: ReactNode;
}

/** Title of a tab screen, with an optional trailing action. */
export function ScreenHeader({ title, meta, trailing }: ScreenHeaderProps) {
  return (
    <header className="flex min-h-12 items-center gap-2">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {meta && <p className="truncate text-sm text-ink-muted">{meta}</p>}
      </div>
      {trailing && <div className="-mr-3">{trailing}</div>}
    </header>
  );
}
