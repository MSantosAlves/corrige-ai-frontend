'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppHeader } from '../components/layout/AppHeader';
import { useAuthSession } from '../hooks/use-auth-session';
import { useClickOutside } from '../hooks/use-click-outside';
import { signInWithGoogle, signOut } from '../services/auth-client';

const buildSignUpKeyCookie = (signupKey: string) => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const base = `signup_key=${encodeURIComponent(signupKey)}; Path=/`;

  if (isLocalhost) {
    return `${base}; SameSite=Lax`;
  }

  const isHttps = window.location.protocol === 'https:';
  return `${base}; Domain=.revisafacil.com; SameSite=None${isHttps ? '; Secure' : ''}`;
};

export default function AuthPage() {
  const router = useRouter();
  const { authUser, authSessionLoading } = useAuthSession();
  const [signupKey, setSignupKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(userMenuRef, isUserMenuOpen, () => setIsUserMenuOpen(false));

  useEffect(() => {
    if (authSessionLoading) {
      return;
    }
    if (authUser?.emailVerified === false) {
      router.replace('/auth/verify-email');
      return;
    }
    if (authUser) {
      router.replace('/');
    }
  }, [authSessionLoading, authUser, router]);

  const handleGoogleSignIn = async () => {
    if (!signupKey.trim()) {
      setError('Informe sua chave de acesso.');
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      document.cookie = buildSignUpKeyCookie(signupKey.trim());
      await signInWithGoogle(`${window.location.origin}/auth/callback`);
    } catch (signInError) {
      const message =
        signInError instanceof Error ? signInError.message : 'Erro inesperado ao iniciar o login.';
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <main className="teched-main relative min-h-screen bg-[var(--paper)] px-6 pb-12 pt-16 text-[var(--ink)]">
      <AppHeader
        authUser={authUser}
        isUserMenuOpen={isUserMenuOpen}
        setIsUserMenuOpen={setIsUserMenuOpen}
        onOpenAuth={() => {
          router.push('/auth');
        }}
        onSignOut={() => {
          void signOut();
          router.push('/');
        }}
        onNavigateClasses={() => {
          router.push('/classes');
        }}
        onNavigateCriteria={() => {
          router.push('/grade-criteria');
        }}
        userMenuRef={userMenuRef}
      />

      <section className="mx-auto mt-12 flex w-full max-w-2xl flex-col gap-6">
        <div className="rounded-3xl border border-[var(--fog)] bg-[var(--paper-soft)] p-8 shadow-sm">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--chalk)]">
              Acesso
            </span>
            <h1 className="text-2xl font-semibold text-[var(--ink)]">
              Continue com sua conta Google
            </h1>
            <p className="text-sm text-[var(--graphite)]">
              Informe a chave de acesso recebida e confirme o login com o Google.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--graphite)]">
                Chave de acesso
              </label>
              <input
                type="password"
                value={signupKey}
                onChange={(event) => setSignupKey(event.target.value)}
                placeholder="Digite sua chave"
                className="mt-2 w-full rounded-xl border border-[var(--fog)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
              />
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="inline-flex items-center justify-center gap-3 rounded-xl border border-[var(--fog)] bg-white px-4 py-3 text-sm font-semibold text-[var(--ink)] shadow-sm transition hover:border-[var(--chalk)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {isLoading ? 'Redirecionando...' : 'Continuar com Google'}
            </button>
            {error && <p className="text-sm text-[var(--rubric)]">{error}</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
