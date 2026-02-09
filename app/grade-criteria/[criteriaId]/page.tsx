'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '../../components/layout/AppHeader';
import { useAuthSession } from '../../hooks/use-auth-session';
import { useClickOutside } from '../../hooks/use-click-outside';
import {
  createCriteria,
  getCriteriaById,
  type GradeCriteria,
} from '../../services/criteria-service';
import { signOut } from '../../services/auth-client';

export default function GradeCriteriaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const criteriaId = params?.criteriaId as string;
  const { authUser, setAuthUser } = useAuthSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [criteria, setCriteria] = useState<GradeCriteria | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copyError, setCopyError] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useClickOutside(userMenuRef, isUserMenuOpen, () => setIsUserMenuOpen(false));

  useEffect(() => {
    if (!criteriaId) {
      return;
    }

    const loadCriteria = async () => {
      try {
        setIsLoading(true);
        setError('');
        const payload = await getCriteriaById(criteriaId);
        setCriteria(payload);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : 'Erro ao carregar critério.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCriteria();
  }, [criteriaId]);

  const handleCopyCriteria = async () => {
    if (!criteria) {
      return;
    }
    if (!authUser) {
      router.push('/auth');
      return;
    }
    try {
      setIsCopying(true);
      setCopyError('');
      await createCriteria({
        name: `${criteria.name} [Cópia]`,
        description: criteria.description,
        classification: criteria.classification,
        isPublic: false,
        maxScore: criteria.max_score,
        items: criteria.items,
        tags: criteria.tags,
      });
      setIsCopied(true);
    } catch (copyErr) {
      const message = copyErr instanceof Error ? copyErr.message : 'Erro ao copiar critério.';
      setCopyError(message);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <main className="teched-main relative min-h-screen bg-[var(--paper)] px-0 pb-12 pt-8 text-[var(--ink)]">
      <AppHeader
        authUser={authUser}
        isUserMenuOpen={isUserMenuOpen}
        setIsUserMenuOpen={setIsUserMenuOpen}
        onOpenAuth={() => {
          router.push('/auth');
        }}
        onSignOut={() => {
          void signOut();
          setAuthUser(null);
        }}
        onNavigateClasses={() => {
          router.push('/classes');
        }}
        onNavigateCriteria={() => {
          router.push('/grade-criteria');
        }}
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

        <section className="grid gap-6 px-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]">
                  Critério de avaliação
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  {criteria?.name || 'Detalhes do critério'}
                </h1>
                {criteria?.classification && (
                  <p className="mt-2 text-sm text-[var(--graphite)]">{criteria.classification}</p>
                )}
              </div>
              {criteria && (
                <div className="flex flex-wrap items-center gap-3">
                  {isCopied ? (
                    <span className="rounded-full border border-[var(--fog)] bg-[var(--paper)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--chalk)]">
                      Copiado
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCopyCriteria}
                      disabled={isCopying}
                      className="rounded-lg bg-[var(--chalk)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--chalk-strong)] disabled:cursor-not-allowed disabled:bg-[var(--fog)]"
                    >
                      {isCopying ? 'Copiando...' : 'Copiar critério'}
                    </button>
                  )}
                  {copyError && <span className="text-xs text-[var(--rubric)]">{copyError}</span>}
                </div>
              )}
            </div>

            <div className="mt-6">
              {isLoading ? (
                <p className="text-sm text-[var(--graphite)]">Carregando critério...</p>
              ) : error ? (
                <p className="text-sm text-[var(--rubric)]">{error}</p>
              ) : criteria ? (
                <div className="flex flex-col gap-4">
                  {criteria.description && (
                    <p className="text-sm text-[var(--graphite)]">{criteria.description}</p>
                  )}
                  <div className="rounded-2xl border border-[var(--fog)] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--graphite)]">
                      Itens e pesos
                    </p>
                    <ul className="mt-3 flex flex-col gap-3">
                      {criteria.items.map((item, index) => (
                        <li
                          key={`${item.label}-${index}`}
                          className="rounded-xl border border-[var(--fog)] bg-[var(--paper)] p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-[var(--ink)]">
                              {item.label}
                            </span>
                            <span className="rounded-full border border-[var(--fog)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--chalk)]">
                              Peso {item.weight}
                            </span>
                          </div>
                          {item.description && (
                            <p className="mt-2 text-xs text-[var(--graphite)]">
                              {item.description}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]">
              Resumo do critério
            </p>
            <div className="mt-4 space-y-3 text-sm text-[var(--ink)]">
              <div className="rounded-xl border border-[var(--fog)] bg-[var(--paper)] p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">
                  Pontuação máxima
                </p>
                <p className="mt-1 font-semibold">
                  {criteria?.max_score !== undefined ? criteria.max_score : '—'}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--fog)] bg-[var(--paper)] p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">
                  Visibilidade
                </p>
                <p className="mt-1 font-semibold">
                  {criteria ? (criteria.is_public ? 'Público' : 'Privado') : '—'}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--fog)] bg-[var(--paper)] p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">
                  Total de itens
                </p>
                <p className="mt-1 font-semibold">{criteria?.items.length ?? 0}</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
