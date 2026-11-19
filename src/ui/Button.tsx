import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cx, focusRing } from './cx';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary renders `data-primary`: exactly one visible per screen (P9). */
  variant?: ButtonVariant;
  /** Stretch to the container width. */
  full?: boolean;
  icon?: LucideIcon;
  children: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink font-semibold',
  secondary: 'bg-surface text-ink border border-line font-medium hover:bg-surface-2',
  quiet: 'text-accent font-medium hover:bg-surface-2',
};

/** A text button, ≥ 48 px tall. */
export function Button({ variant = 'secondary', full, icon: Icon, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      data-primary={variant === 'primary' ? '' : undefined}
      className={cx(
        'inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-card px-5 text-base',
        'transition-colors duration-fast ease-calm disabled:cursor-not-allowed',
        variant === 'primary' && 'disabled:bg-surface-2 disabled:text-ink-muted',
        variant !== 'primary' && 'disabled:text-ink-muted',
        VARIANTS[variant],
        full && 'w-full',
        full && variant === 'primary' && 'min-h-14',
        focusRing,
        className,
      )}
      {...rest}
    >
      {Icon && <Icon aria-hidden size={20} strokeWidth={2} />}
      <span className="truncate">{children}</span>
    </button>
  );
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon;
  /** Required: icon-only buttons need an accessible name. */
  label: string;
}

/** An icon-only button, 48 × 48. */
export function IconButton({ icon: Icon, label, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex size-12 shrink-0 items-center justify-center rounded-full text-ink-muted',
        'transition-colors duration-fast ease-calm hover:bg-surface-2 hover:text-ink disabled:opacity-50',
        focusRing,
        className,
      )}
      {...rest}
    >
      <Icon aria-hidden size={22} strokeWidth={1.75} />
    </button>
  );
}
