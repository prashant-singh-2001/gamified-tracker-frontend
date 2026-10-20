import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { toApiError } from '@/lib/api/errors';
import { useResetPassword } from '../api';
import { AuthStage } from '../components/AuthStage';
import { FACE_LOOK } from '../components/faceLook';
import { resetSchema, type ResetForm } from '../schemas';

const INVALID = 'This reset link is invalid or has expired.';

/** `/reset-password?token=…`: the page the emailed link opens. */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';
  const navigate = useNavigate();
  const reset = useResetPassword();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });
  const newPassword = useWatch({ control, name: 'newPassword' });

  const onSubmit = handleSubmit(({ newPassword: password }) =>
    reset.mutate(
      { token, newPassword: password },
      {
        onSuccess: () =>
          void navigate('/login', { replace: true, state: { reason: 'password-reset' } }),
      },
    ),
  );

  const apiError = reset.isError ? toApiError(reset.error) : null;
  const linkFailed = !token || apiError?.status === 400;

  return (
    <AuthStage face="front">
      <section
        aria-labelledby="reset-title"
        className={`flex w-full max-w-md flex-col gap-5 ${FACE_LOOK}`}
      >
        <div className="flex flex-col gap-1.5">
          <h1 id="reset-title" className="font-display text-[2.9rem] leading-[0.92] font-extrabold">
            Choose a new password
          </h1>
          <p className="text-soft">Pick one you have not used on Etram before.</p>
        </div>

        {linkFailed ? (
          <div className="flex flex-col items-start gap-4">
            <p role="alert" className="text-danger">
              {INVALID}
            </p>
            <Link
              to="/login?forgot=1"
              className="font-medium text-accent no-underline hover:underline"
            >
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {apiError && (
              <p role="alert" className="text-sm text-danger">
                {apiError.message}
              </p>
            )}
            <PasswordInput
              label="New password"
              autoComplete="new-password"
              strengthOf={newPassword ?? ''}
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            <PasswordInput
              label="Confirm new password"
              autoComplete="new-password"
              error={errors.confirm?.message}
              {...register('confirm')}
            />
            <Button type="submit" size="lg" loading={reset.isPending} className="rounded-full">
              Set new password
            </Button>
          </form>
        )}
      </section>
    </AuthStage>
  );
}
