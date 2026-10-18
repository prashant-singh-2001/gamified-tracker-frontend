import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/api/errors';
import { useAuthStore } from '@/lib/auth/authStore';
import { homeFor, safeNext } from '@/lib/auth/redirect';
import { useRegister } from '../api';
import { AuthShell } from '../components/AuthShell';
import { registerSchema, type RegisterForm } from '../schemas';

export default function RegisterPage() {
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const navigate = useNavigate();
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit((values) => {
    registerUser.mutate(values, {
      onSuccess: () => {
        const role = useAuthStore.getState().user?.role ?? 'USER';
        void navigate(next ?? homeFor(role), { replace: true });
      },
    });
  });

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login';

  return (
    <AuthShell
      title="Start your first quest"
      subtitle="Create an account and begin earning XP."
      footer={
        <>
          Already have an account?{' '}
          <Link to={loginHref} className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {registerUser.isError && (
          <p role="alert" className="text-sm text-danger">
            {getErrorMessage(registerUser.error)}
          </p>
        )}
        <Button type="submit" size="lg" loading={registerUser.isPending}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
