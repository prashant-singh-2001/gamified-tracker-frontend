import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { getErrorMessage } from '@/lib/api/errors';
import type { LoginForm } from '../schemas';

type LoginFaceProps = {
  form: UseFormReturn<LoginForm>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  pending: boolean;
  error: unknown;
  sessionEnded: boolean;
  onFlip: () => void;
};

export function LoginFace({
  form,
  onSubmit,
  pending,
  error,
  sessionEnded,
  onFlip,
}: LoginFaceProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <section aria-labelledby="login-title" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 id="login-title" className="font-display text-3xl font-extrabold tracking-tight">
          Welcome back
        </h1>
        <p className="text-soft">Log in to keep your streak alive.</p>
      </div>

      {sessionEnded && (
        <p
          role="status"
          className="rounded-xl border border-line-strong bg-surface-2 px-3.5 py-3 text-sm"
        >
          Your session ended, please log in again.
        </p>
      )}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {error != null && (
          <p role="alert" className="text-sm text-danger">
            {getErrorMessage(error)}
          </p>
        )}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" size="lg" loading={pending}>
          Log in
        </Button>
      </form>

      <p className="text-center text-soft">
        New here?{' '}
        <button type="button" onClick={onFlip} className="font-medium text-accent hover:underline">
          Create an account
        </button>
      </p>
    </section>
  );
}
