'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppHeader } from '../../components/layout/AppHeader';
import { useAuthSession } from '../../hooks/use-auth-session';
import { useClickOutside } from '../../hooks/use-click-outside';
import { getSession, signOut } from '../../services/auth-client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { authUser } = useAuthSession();
  const [error, setError] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(userMenuRef, isUserMenuOpen, () => setIsUserMenuOpen(false));

  useEffect(() => {
    const resolveSession = async () => {
      try {
        const payload = (await getSession()) as {
          user?: { emailVerified?: boolean | null } | null;
          data?: { user?: { emailVerified?: boolean | null } | null } | null;
        };
        const sessionUser = payload?.user ?? payload?.data?.user;
        if (!sessionUser) {
          setError('Não foi possível validar sua sessão. Tente novamente.');
          return;
        }
        if (sessionUser.emailVerified === false) {
          router.replace('/auth/verify-email');
          return;
        }
        router.replace('/');
      } catch (sessionError) {
        const message =
          sessionError instanceof Error
            ? sessionError.message
            : 'Não foi possível validar sua sessão.';
        setError(message);
      }
    };

    void resolveSession();
  }, [router]);

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

      <section className="mx-auto mt-12 flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-[var(--fog)] bg-[var(--paper-soft)] p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--chalk)]">
          Autenticação
        </p>
        <h1 className="text-2xl font-semibold text-[var(--ink)]">Finalizando login</h1>
        <p className="text-sm text-[var(--graphite)]">Validando sua sessão com segurança.</p>
        {!error && (
          <div className="mx-auto mt-2 h-8 w-8 animate-spin rounded-full border-2 border-[var(--chalk)] border-t-transparent" />
        )}
        {error && (
          <>
            <p className="text-sm text-[var(--rubric)]">{error}</p>
            <button
              type="button"
              onClick={() => router.push('/auth')}
              className="mx-auto mt-2 rounded-xl bg-[var(--chalk)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--chalk-strong)]"
            >
              Tentar novamente
            </button>
          </>
        )}
      </section>
    </main>
  );
}
