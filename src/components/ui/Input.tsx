import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type InputProps = ComponentProps<'input'> & {
  label: string;
  error?: string;
  hint?: string;
  /** Sits inside the right edge of the field, e.g. a show/hide button. */
  trailing?: ReactNode;
};

/** Labelled text input. `ref` is a normal prop in React 19, so it works with RHF's register(). */
export function Input({ label, error, hint, trailing, className, id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-soft">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'min-h-11 w-full rounded-xl border bg-surface-2 px-3.5 text-text placeholder:text-faint',
            error ? 'border-danger' : 'border-line-strong',
            trailing ? 'pr-12' : null,
            className,
          )}
          {...rest}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>
        ) : null}
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
