import { useId, type ComponentProps } from 'react';
import { cn } from '@/lib/utils/cn';

type InputProps = ComponentProps<'input'> & {
  label: string;
  error?: string;
  hint?: string;
};

/** Labelled text input. `ref` is a normal prop in React 19, so it works with RHF's register(). */
export function Input({ label, error, hint, className, id, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-soft">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'min-h-11 rounded-xl border bg-surface-2 px-3.5 text-text placeholder:text-faint',
          error ? 'border-danger' : 'border-line-strong',
          className,
        )}
        {...rest}
      />
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
