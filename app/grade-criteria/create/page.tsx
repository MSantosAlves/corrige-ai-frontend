'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '../../components/layout/AppHeader';
import { CriteriaForm } from '../../components/criteria/CriteriaForm';
import { useAuthFlow } from '../../hooks/use-auth-flow';
import { useAuthSession } from '../../hooks/use-auth-session';
import { useClickOutside } from '../../hooks/use-click-outside';
import { useCriteriaForm } from '../../hooks/use-criteria-form';
import { createCriteria } from '../../services/criteria-service';

export default function CreateGradeCriteriaPage() {
  const router = useRouter();
  const { authUser, setAuthUser } = useAuthSession();
  const {
    authMode,
    setAuthMode,
    authName,
    setAuthName,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authSignUpKey,
    setAuthSignUpKey,
    authError,
    authLoading,
    handleAuth,
  } = useAuthFlow(setAuthUser);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);
  const loginMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const form = useCriteriaForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useClickOutside(loginMenuRef, isLoginMenuOpen, () => setIsLoginMenuOpen(false));
  useClickOutside(userMenuRef, isUserMenuOpen, () => setIsUserMenuOpen(false));

  const handleSubmit = async () => {
    if (!form.isValid) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await createCriteria(form.getPayload());
      form.reset();
      router.push('/grade-criteria');
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Erro ao criar critério.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="teched-main relative min-h-screen bg-[var(--paper)] px-0 pb-12 pt-8 text-[var(--ink)]">
      <AppHeader
        authUser={authUser}
        isUserMenuOpen={isUserMenuOpen}
        setIsUserMenuOpen={setIsUserMenuOpen}
        isLoginMenuOpen={isLoginMenuOpen}
        setIsLoginMenuOpen={setIsLoginMenuOpen}
        authMode={authMode}
        setAuthMode={setAuthMode}
        authName={authName}
        setAuthName={setAuthName}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authSignUpKey={authSignUpKey}
        setAuthSignUpKey={setAuthSignUpKey}
        authLoading={authLoading}
        authError={authError}
        onSubmitAuth={async (mode) => {
          const ok = await handleAuth(mode);
          if (ok) {
            setIsLoginMenuOpen(false);
          }
        }}
        onSignOut={() => {
          setAuthUser(null);
          localStorage.removeItem('sessionToken');
          localStorage.removeItem('sessionUserName');
          localStorage.removeItem('sessionUserId');
        }}
        onNavigateClasses={() => {
          router.push('/classes');
        }}
        onNavigateCriteria={() => {
          router.push('/grade-criteria');
        }}
        loginMenuRef={loginMenuRef}
        userMenuRef={userMenuRef}
      />

      <div className="mx-auto flex w-full max-w-none flex-col gap-8 px-0 pt-20">
        <section className="px-6">
          <button
            type="button"
            onClick={() => router.push('/grade-criteria')}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]"
          >
            ← Voltar
          </button>
        </section>

        <section className="px-6">
          <div className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]">
                Novo critério
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Criar critério</h1>
              <p className="mt-1 text-sm text-[var(--graphite)]">
                Defina a avaliação e os itens de correção antes de publicar.
              </p>
            </div>

            <CriteriaForm
              form={form}
              isSubmitting={isSubmitting}
              error={error}
              onCancel={() => router.push('/grade-criteria')}
              onSubmit={handleSubmit}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
