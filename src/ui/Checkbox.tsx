import type { ReactNode } from 'react';
import { cx } from './cx';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  className?: string;
}

/** A native checkbox; the whole ≥ 48 px label is the target. */
export function Checkbox({ checked, onChange, children, className }: CheckboxProps) {
  return (
    <label className={cx('flex min-h-12 cursor-pointer items-center gap-3 text-base text-ink', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 shrink-0 accent-accent"
      />
      <span className="min-w-0 truncate">{children}</span>
    </label>
  );
}
