import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cx, focusRing } from './cx';

export interface ChipProps {
  selected: boolean;
  onToggle: () => void;
  children: ReactNode;
  disabled?: boolean;
}

/** A toggle chip (aria-pressed). Selection shows a check, not only color. */
export function Chip({ selected, onToggle, children, disabled }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cx(
        'inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-full border px-4 text-base',
        'transition-colors duration-fast ease-calm disabled:opacity-60',
        selected ? 'border-accent bg-accent-soft font-medium text-ink' : 'border-line bg-surface text-ink hover:bg-surface-2',
        focusRing,
      )}
    >
      {selected && <Check aria-hidden size={16} strokeWidth={2.5} className="text-accent" />}
      {children}
    </button>
  );
}

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipGroupBase<T extends string> {
  /** Accessible group name (also shown as a small heading when `showLabel`). */
  label: string;
  showLabel?: boolean;
  options: readonly ChipOption<T>[];
}

export type ChipGroupProps<T extends string> = ChipGroupBase<T> &
  (
    | { multiple?: false; value: T | null; onChange: (value: T | null) => void }
    | { multiple: true; value: readonly T[]; onChange: (value: T[]) => void }
  );

/** Single- or multi-select chips that wrap onto as many rows as needed. */
export function ChipGroup<T extends string>(props: ChipGroupProps<T>) {
  const { label, showLabel, options } = props;
  const isOn = (v: T) => (props.multiple ? props.value.includes(v) : props.value === v);
  const toggle = (v: T) => {
    if (props.multiple) props.onChange(isOn(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    else props.onChange(isOn(v) ? null : v);
  };
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      {showLabel && <span className="text-sm font-medium text-ink-muted">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o.value} selected={isOn(o.value)} onToggle={() => toggle(o.value)}>
            {o.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
