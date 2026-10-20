import { useWatch, type UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { toApiError } from '@/lib/api/errors';
import type { RegisterForm } from '../schemas';

type SignupFaceProps = {
  form: UseFormReturn<RegisterForm>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  pending: boolean;
  error: unknown;
  onFlip: () => void;
};

/**
 * The gateway answers a duplicate email with a bare 500 (unique-constraint violation, no handler),
 * so a 500 on sign-up is read as "this email may already exist" and offers the way out.
 */
const DUPLICATE_HINT =
  "We couldn't create your account. If this email is already registered, log in instead.";

export function SignupFace({ form, onSubmit, pending, error, onFlip }: SignupFaceProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const password = useWatch({ control, name: 'password' });
  const apiError = error == null ? null : toApiError(error);
  const maybeDuplicate = apiError?.status === 500;

  return (
    <section aria-labelledby="signup-title" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 id="signup-title" className="font-display text-3xl font-extrabold tracking-tight">
          Start your climb
        </h1>
        <p className="text-soft">Create an account and begin earning XP.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {apiError && (
          <div role="alert" className="flex flex-col items-start gap-2 text-sm text-danger">
            <p>{maybeDuplicate ? DUPLICATE_HINT : apiError.message}</p>
            {maybeDuplicate && (
              <button
                type="button"
                onClick={onFlip}
                className="font-medium text-accent hover:underline"
              >
                Log in instead
              </button>
            )}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last name"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          strengthOf={password ?? ''}
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" size="lg" loading={pending}>
          Start at Basecamp
        </Button>
      </form>

      <p className="text-center text-soft">
        Already climbing?{' '}
        <button type="button" onClick={onFlip} className="font-medium text-accent hover:underline">
          Log in
        </button>
      </p>
    </section>
  );
}
