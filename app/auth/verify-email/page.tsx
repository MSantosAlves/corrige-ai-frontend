'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppHeader } from '../../components/layout/AppHeader';
import { useAuthSession } from '../../hooks/use-auth-session';
import { useClickOutside } from '../../hooks/use-click-outside';
import { getSession, sendVerificationEmail, signOut } from '../../services/auth-client';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { authUser, authSessionLoading } = useAuthSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(userMenuRef, isUserMenuOpen, () => setIsUserMenuOpen(false));

  useEffect(() => {
    if (authSessionLoading) {
      return;
    }
    if (!authUser) {
      router.replace('/auth');
      return;
    }
    if (authUser.emailVerified) {
      router.replace('/');
    }
  }, [authSessionLoading, authUser, router]);

  const handleResend = async () => {
    try {
      if (!authUser?.email) {
        setError('Não foi possível identificar seu email.');
        return;
      }
      setIsSending(true);
      setError('');
      setMessage('');
      await sendVerificationEmail(authUser.email);
      setMessage('Email de verificação enviado. Verifique sua caixa de entrada.');
    } catch (sendError) {
      const text =
        sendError instanceof Error
          ? sendError.message
          : 'Não foi possível enviar o email de verificação.';
      setError(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setError('');
      setMessage('');
      const payload = (await getSession()) as {
        user?: { emailVerified?: boolean | null } | null;
        data?: { user?: { emailVerified?: boolean | null } | null } | null;
      };
      const sessionUser = payload?.user ?? payload?.data?.user;
      if (sessionUser?.emailVerified) {
        router.replace('/');
        return;
      }
      setMessage('Ainda aguardando confirmação. Se necessário, reenvie o email.');
    } catch (sessionError) {
      const text =
        sessionError instanceof Error
          ? sessionError.message
          : 'Não foi possível validar sua confirmação.';
      setError(text);
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

      <section className="mx-auto mt-12 flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-[var(--fog)] bg-[var(--paper-soft)] p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--chalk)]">
          Verificação
        </p>
        <h1 className="text-2xl font-semibold text-[var(--ink)]">
          Confirme seu email para continuar
        </h1>
        <p className="text-sm text-[var(--graphite)]">
          Enviamos um email para confirmação. Clique no link recebido e volte para cá.
        </p>

        <div className="mt-2 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={isSending}
            className="rounded-xl bg-[var(--chalk)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--chalk-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSending ? 'Enviando...' : 'Reenviar email'}
          </button>
          <button
            type="button"
            onClick={handleCheckStatus}
            className="rounded-xl border border-[var(--fog)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink)] transition hover:border-[var(--chalk)]"
          >
            Já confirmei
          </button>
        </div>

        {message && <p className="text-sm text-[var(--graphite)]">{message}</p>}
        {error && <p className="text-sm text-[var(--rubric)]">{error}</p>}
      </section>
    </main>
  );
}
