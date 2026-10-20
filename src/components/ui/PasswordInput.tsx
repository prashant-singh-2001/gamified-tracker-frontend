import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { passwordStrength } from '@/lib/utils/passwordStrength';
import { cn } from '@/lib/utils/cn';
import { Input } from './Input';

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'trailing' | 'value'> & {
  /** Shows a Weak / Okay / Strong meter under the field. Pass the current value to enable it. */
  strengthOf?: string;
};

const BAR_COLOURS = ['bg-danger', 'bg-xp', 'bg-accent'] as const;

/** Password field with a show/hide toggle and an optional advisory strength meter. */
export function PasswordInput({ strengthOf, hint, ...rest }: PasswordInputProps) {
  const [shown, setShown] = useState(false);
  const strength = strengthOf === undefined ? null : passwordStrength(strengthOf);

  return (
    <div className="flex flex-col gap-2">
      <Input
        {...rest}
        hint={hint}
        type={shown ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            aria-pressed={shown}
            aria-label={shown ? 'Hide password' : 'Show password'}
            onClick={() => setShown((s) => !s)}
            className="grid size-9 place-items-center rounded-lg text-soft hover:text-text"
          >
            {shown ? (
              <EyeOff className="size-5" aria-hidden="true" />
            ) : (
              <Eye className="size-5" aria-hidden="true" />
            )}
          </button>
        }
      />
      {strength && strength.level > 0 && (
        <div className="flex items-center gap-3" role="status">
          <div className="flex flex-1 gap-1" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={cn(
                  'h-1.5 flex-1 rounded-full',
                  n <= strength.level ? BAR_COLOURS[strength.level - 1] : 'bg-line',
                )}
              />
            ))}
          </div>
          <span className="font-mono text-xs text-muted">Strength: {strength.label}</span>
        </div>
      )}
    </div>
  );
}
