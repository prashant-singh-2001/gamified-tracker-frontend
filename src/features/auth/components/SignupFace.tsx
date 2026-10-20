import { useWatch, type UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { fieldErrors, toApiError } from '@/lib/api/errors';
import { REGISTER_FIELDS, type RegisterForm } from '../schemas';

type SignupFaceProps = {
  form: UseFormReturn<RegisterForm>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  pending: boolean;
  error: unknown;
  onFlip: () => void;
};

export function SignupFace({ form, onSubmit, pending, error, onFlip }: SignupFaceProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const password = useWatch({ control, name: 'password' });
  const apiError = error == null ? null : toApiError(error);
  const emailTaken = apiError?.status === 409;
  // A server message that a field shows (or the duplicate-email case) is not repeated above the form.
  const formError =
    apiError && !emailTaken && !fieldErrors(error, REGISTER_FIELDS) ? apiError : null;

  return (
    <section aria-labelledby="signup-title" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 id="signup-title" className="font-display text-[2.9rem] leading-[0.92] font-extrabold">
          Start your climb
        </h1>
        <p className="text-soft">Create an account and begin earning XP.</p>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError && (
          <p role="alert" className="text-sm text-danger">
            {formError.message}
          </p>
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
        {emailTaken && (
          <button
            type="button"
            onClick={onFlip}
            className="-mt-2 self-start font-medium text-accent hover:underline"
          >
            Log in instead
          </button>
        )}
        <PasswordInput
          label="Password"
          autoComplete="new-password"
          strengthOf={password ?? ''}
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" size="lg" loading={pending} className="rounded-full">
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
