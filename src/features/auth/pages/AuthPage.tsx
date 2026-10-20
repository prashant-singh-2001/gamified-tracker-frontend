import { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAuthStore } from '@/lib/auth/authStore';
import { homeFor, safeNext } from '@/lib/auth/redirect';
import { useLogin, useRegister } from '../api';
import { FlipCard, type Face } from '../components/FlipCard';
import { LoginFace } from '../components/LoginFace';
import { RankTrailBackdrop } from '../components/RankTrailBackdrop';
import { SignupFace } from '../components/SignupFace';
import { loginSchema, registerSchema, type LoginForm, type RegisterForm } from '../schemas';

/**
 * /login and /register render this same card; the route decides which face is up and flipping
 * swaps the URL with `replace`, so refresh lands on the same face and Back leaves the page.
 */
export default function AuthPage() {
  const location = useLocation();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const navigate = useNavigate();
  const face: Face = location.pathname === '/register' ? 'back' : 'front';
  const sessionEnded = (location.state as { reason?: string } | null)?.reason === 'session-ended';

  const login = useLogin();
  const registerUser = useRegister();
  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const afterAuth = () => {
    const role = useAuthStore.getState().user?.role ?? 'USER';
    void navigate(next ?? homeFor(role), { replace: true });
  };

  const submitLogin = loginForm.handleSubmit((values) =>
    login.mutate(values, { onSuccess: afterAuth }),
  );
  const submitSignup = signupForm.handleSubmit((values) =>
    registerUser.mutate(values, { onSuccess: afterAuth }),
  );

  const { setFocus: focusLogin } = loginForm;
  const { setFocus: focusSignup } = signupForm;
  const firstRender = useRef(true);
  useEffect(() => {
    // After each flip the first field of the face that came up takes focus.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (face === 'back') focusSignup('firstName');
    else focusLogin('email');
  }, [face, focusLogin, focusSignup]);

  const flip = () => {
    const goingToSignup = face === 'front';
    if (goingToSignup) {
      const email = loginForm.getValues('email');
      if (email) signupForm.setValue('email', email);
    } else {
      const email = signupForm.getValues('email');
      if (email) loginForm.setValue('email', email);
    }
    login.reset();
    registerUser.reset();
    void navigate(
      { pathname: goingToSignup ? '/register' : '/login', search: location.search },
      { replace: true },
    );
  };

  return (
    <div className="relative isolate flex min-h-[calc(100dvh-12rem)] items-center justify-center px-4 py-8">
      <RankTrailBackdrop />
      <FlipCard
        face={face}
        front={
          <LoginFace
            form={loginForm}
            onSubmit={submitLogin}
            pending={login.isPending}
            error={login.error}
            sessionEnded={sessionEnded}
            onFlip={flip}
          />
        }
        back={
          <SignupFace
            form={signupForm}
            onSubmit={submitSignup}
            pending={registerUser.isPending}
            error={registerUser.error}
            onFlip={flip}
          />
        }
      />
    </div>
  );
}
