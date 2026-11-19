import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx, focusRing } from './cx';

/** Shared look of text inputs (≥ 48 px tall, tabular numbers). Set the width at the call site. */
export const inputClass = cx(
  'min-h-12 rounded-control border border-line bg-surface px-3 text-base tabular-nums text-ink',
  'placeholder:text-ink-muted aria-[invalid=true]:border-caution',
  focusRing,
);

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {
  label: string;
  /** One muted line under the field (examples, units). */
  hint?: ReactNode;
  /** Replaces the hint and marks the field invalid. */
  error?: string | null;
}

/** A labelled text input with one line of hint or error under it. */
export function TextField({ label, hint, error, id, className, ...rest }: TextFieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  const note = error || hint;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fid} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={fid}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? `${fid}-note` : undefined}
        className={cx(inputClass, 'w-full', className)}
        {...rest}
      />
      {note && (
        <p id={`${fid}-note`} className={cx('text-sm', error ? 'text-caution' : 'text-ink-muted')}>
          {note}
        </p>
      )}
    </div>
  );
}
