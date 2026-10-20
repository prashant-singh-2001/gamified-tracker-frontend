import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/api/errors';
import { useForgotPassword } from '../api';
import { forgotSchema, type ForgotForm } from '../schemas';

type ForgotFaceProps = {
  /** Email typed on the Log in face, so it is not typed twice. */
  initialEmail: string;
  onBack: () => void;
};

/** The "Forgot password?" view of the front face: ask for an email, then say what happens next. */
export function ForgotFace({ initialEmail, onBack }: ForgotFaceProps) {
  const forgot = useForgotPassword();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: initialEmail },
  });

  const onSubmit = handleSubmit(({ email }) => forgot.mutate(email.trim()));

  return (
    <section aria-labelledby="forgot-title" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 id="forgot-title" className="font-display text-[2.9rem] leading-[0.92] font-extrabold">
          Reset your password
        </h1>
        <p className="text-soft">
          Enter your email and we will send you a link to choose a new one.
        </p>
      </div>

      {forgot.isSuccess ? (
        <div className="flex flex-col gap-5">
          <p
            role="status"
            className="rounded-xl border border-line-strong bg-surface-2 px-3.5 py-3"
          >
            If an account exists for {getValues('email').trim()}, a reset link is on its way. It
            works for 30 minutes.
          </p>
          <Button type="button" size="lg" className="rounded-full" onClick={onBack}>
            Back to log in
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {forgot.isError && (
            <p role="alert" className="text-sm text-danger">
              {getErrorMessage(forgot.error)}
            </p>
          )}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" size="lg" loading={forgot.isPending} className="rounded-full">
            Send reset link
          </Button>
        </form>
      )}

      {!forgot.isSuccess && (
        <p className="text-center text-soft">
          Remembered it?{' '}
          <button
            type="button"
            onClick={onBack}
            className="font-medium text-accent hover:underline"
          >
            Log in
          </button>
        </p>
      )}
    </section>
  );
}
