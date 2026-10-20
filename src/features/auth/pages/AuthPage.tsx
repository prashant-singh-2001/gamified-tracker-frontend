import { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAuthStore } from '@/lib/auth/authStore';
import { homeFor, safeNext } from '@/lib/auth/redirect';
import { useLogin, useRegister } from '../api';
import { FlipCard, type Face } from '../components/FlipCard';
import { LoginFace } from '../components/LoginFace';
import { AuthMap } from '../components/AuthMap';
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
    <div className="relative isolate min-h-[calc(100dvh-12rem)] flex items-center overflow-hidden">
      {/* Behind the card on small screens; beside it from 1280px, where the caption joins it. */}
      <div
        aria-hidden="true"
        className="map-fade pointer-events-none absolute inset-0 -z-10 opacity-40 xl:inset-y-0 xl:right-0 xl:left-auto xl:w-[62%] xl:opacity-100"
      >
        <AuthMap face={face} />
      </div>

      <div className="mx-auto flex w-full max-w-[1240px] justify-center px-4 py-8 xl:justify-start xl:px-6">
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

      <p
        key={face}
        className="auth-caption pointer-events-none absolute top-16 left-[44%] hidden max-w-[26rem] font-display text-[2.75rem] leading-[0.95] font-extrabold xl:block"
      >
        {face === 'back' ? (
          <>
            <span className="block">You start at Basecamp.</span>
            <span className="block">Eight ranks above you.</span>
          </>
        ) : (
          <>
            <span className="block">Your streak is waiting.</span>
            <span className="block">So is your rank.</span>
          </>
        )}
      </p>
    </div>
  );
}
