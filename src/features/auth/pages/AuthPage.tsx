import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { fieldErrors, toApiError } from '@/lib/api/errors';
import { useAuthStore } from '@/lib/auth/authStore';
import { homeFor, safeNext } from '@/lib/auth/redirect';
import { useLogin, useRegister } from '../api';
import { FlipCard, type Face } from '../components/FlipCard';
import { LoginFace } from '../components/LoginFace';
import { AuthStage } from '../components/AuthStage';
import { ForgotFace } from '../components/ForgotFace';
import { SignupFace } from '../components/SignupFace';
import {
  LOGIN_FIELDS,
  REGISTER_FIELDS,
  loginSchema,
  registerSchema,
  type LoginForm,
  type RegisterForm,
} from '../schemas';

/** Puts the server's per-field messages under the fields they belong to. */
function showFieldErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  err: unknown,
  known: readonly string[],
) {
  const fields = fieldErrors(err, known);
  if (!fields) return;
  for (const [name, message] of Object.entries(fields)) {
    form.setError(name as FieldPath<T>, { type: 'server', message });
  }
}

export const EMAIL_TAKEN = 'An account with this email already exists.';

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
  const reason = (location.state as { reason?: string } | null)?.reason;
  const notice =
    reason === 'session-ended'
      ? 'Your session ended, please log in again.'
      : reason === 'password-reset'
        ? 'Password changed. Log in with your new password.'
        : null;
  const [forgot, setForgot] = useState(() => params.get('forgot') === '1');

  const login = useLogin();
  const registerUser = useRegister();
  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const afterAuth = () => {
    const role = useAuthStore.getState().user?.role ?? 'USER';
    void navigate(next ?? homeFor(role), { replace: true });
  };

  const submitLogin = loginForm.handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: afterAuth,
      onError: (err) => showFieldErrors(loginForm, err, LOGIN_FIELDS),
    }),
  );
  const submitSignup = signupForm.handleSubmit((values) =>
    registerUser.mutate(values, {
      onSuccess: afterAuth,
      onError: (err) => {
        if (toApiError(err).status === 409) {
          signupForm.setError('email', { type: 'server', message: EMAIL_TAKEN });
          return;
        }
        showFieldErrors(signupForm, err, REGISTER_FIELDS);
      },
    }),
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
    setForgot(false);
    void navigate(
      { pathname: goingToSignup ? '/register' : '/login', search: location.search },
      { replace: true },
    );
  };

  const caption = (
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
  );

  return (
    <AuthStage face={face} caption={caption}>
      <FlipCard
        face={face}
        front={
          forgot ? (
            <ForgotFace
              initialEmail={loginForm.getValues('email') ?? ''}
              onBack={() => setForgot(false)}
            />
          ) : (
            <LoginFace
              form={loginForm}
              onSubmit={submitLogin}
              pending={login.isPending}
              error={login.error}
              notice={notice}
              onFlip={flip}
              onForgot={() => setForgot(true)}
            />
          )
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
    </AuthStage>
  );
}
