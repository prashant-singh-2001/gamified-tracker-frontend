import { cn } from '@/lib/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink hover:brightness-110 font-bold',
  secondary: 'border border-line-strong text-text hover:bg-surface-2 font-medium',
  ghost: 'text-soft hover:text-text hover:bg-surface-2 font-medium',
  danger: 'bg-danger text-accent-ink hover:brightness-110 font-bold',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-[15px] rounded-xl',
  lg: 'min-h-[52px] px-6 text-[17px] rounded-[14px]',
};

/** Class string shared by <Button> and by links that should look like a button. */
export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra?: string,
) {
  return cn(
    'inline-flex items-center justify-center gap-2 no-underline transition disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}
