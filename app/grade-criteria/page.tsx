'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '../components/layout/AppHeader';
import { CreateCriteriaModal } from '../components/criteria/CreateCriteriaModal';
import { useAuthFlow } from '../hooks/use-auth-flow';
import { useAuthSession } from '../hooks/use-auth-session';
import { useClickOutside } from '../hooks/use-click-outside';
import { createCriteria, listCriteria, type GradeCriteria } from '../services/criteria-service';

type FilterMode = 'mine' | 'all';

export default function GradeCriteriaPage() {
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
  const [items, setItems] = useState<GradeCriteria[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('mine');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  useClickOutside(loginMenuRef, isLoginMenuOpen, () => setIsLoginMenuOpen(false));
  useClickOutside(userMenuRef, isUserMenuOpen, () => setIsUserMenuOpen(false));

  useEffect(() => {
    setUserId(localStorage.getItem('sessionUserId'));
  }, []);

  useEffect(() => {
    const loadCriteria = async () => {
      try {
        setIsLoading(true);
        setError('');
        const includePublic = filterMode === 'all';
        const payload = await listCriteria({ includePublic });
        const filtered =
          filterMode === 'mine' && userId
            ? (payload.items ?? []).filter((item) => item.user_id === userId)
            : (payload.items ?? []);
        setItems(filtered);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : 'Erro ao carregar critérios.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCriteria();
  }, [filterMode, userId]);

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
            onClick={() => router.back()}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]"
          >
            ← Voltar
          </button>
        </section>

        <section className="px-6">
          <div className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]">
                  Critérios de avaliação
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Critérios</h1>
                <p className="mt-1 text-sm text-[var(--graphite)]">
                  Explore e selecione critérios para suas avaliações.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded-lg bg-[var(--chalk)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--chalk-strong)]"
              >
                Criar critério
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--fog)] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--fog)] bg-[var(--paper)] px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
                  <span>Exibir</span>
                  <select
                    value={filterMode}
                    onChange={(event) => setFilterMode(event.target.value as FilterMode)}
                    className="rounded-full border border-[var(--fog)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]"
                  >
                    <option value="mine">Meus critérios</option>
                    <option value="all">Todos</option>
                  </select>
                </div>
                <span className="text-xs text-[var(--graphite)]">
                  {items.length} critério(s)
                </span>
              </div>
              <table className="w-full border-collapse text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Critério</th>
                    <th className="px-4 py-3 font-semibold">Classificação</th>
                    <th className="px-4 py-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--ink)]">
                  {isLoading && (
                    <tr>
                      <td className="px-4 py-4 text-[var(--graphite)]" colSpan={3}>
                        Carregando critérios...
                      </td>
                    </tr>
                  )}
                  {!isLoading && error && (
                    <tr>
                      <td className="px-4 py-4 text-[var(--rubric)]" colSpan={3}>
                        {error}
                      </td>
                    </tr>
                  )}
                  {!isLoading && !error && items.length === 0 && (
                    <tr>
                      <td className="px-4 py-4 text-[var(--graphite)]" colSpan={3}>
                        Nenhum critério encontrado.
                      </td>
                    </tr>
                  )}
                  {!isLoading &&
                    !error &&
                    items.map((criteria) => (
                      <tr key={criteria.id} className="border-t border-[var(--fog)]">
                        <td className="px-4 py-4">
                          <p className="font-semibold">{criteria.name}</p>
                          {criteria.description && (
                            <p className="mt-1 text-xs text-[var(--graphite)]">
                              {criteria.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-[var(--graphite)]">
                          {criteria.classification}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => router.push(`/grade-criteria/${criteria.id}`)}
                            className="rounded-lg border border-[var(--fog)] bg-[var(--paper)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--chalk)] transition hover:border-[var(--chalk)]"
                          >
                            Ver detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <CreateCriteriaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (payload) => {
          const created = await createCriteria(payload);
          setItems((prev) => [created, ...prev]);
        }}
      />
    </main>
  );
}
