import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/api/errors';
import { useAuthStore } from '@/lib/auth/authStore';
import { homeFor, safeNext } from '@/lib/auth/redirect';
import { useLogin } from '../api';
import { AuthShell } from '../components/AuthShell';
import { loginSchema, type LoginForm } from '../schemas';

export default function LoginPage() {
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const navigate = useNavigate();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => {
        const role = useAuthStore.getState().user?.role ?? 'USER';
        void navigate(next ?? homeFor(role), { replace: true });
      },
    });
  });

  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : '/register';

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to keep your streak alive."
      footer={
        <>
          New to Etram?{' '}
          <Link to={registerHref} className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {login.isError && (
          <p role="alert" className="text-sm text-danger">
            {getErrorMessage(login.error)}
          </p>
        )}
        <Button type="submit" size="lg" loading={login.isPending}>
          Log in
        </Button>
      </form>
    </AuthShell>
  );
}
