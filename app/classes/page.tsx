'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { AppHeader } from '../components/layout/AppHeader';
import { useAuthSession } from '../hooks/use-auth-session';
import { useClickOutside } from '../hooks/use-click-outside';
import { createClass, listClasses } from '../services/classes-service';
import { signOut } from '../services/auth-client';

type ClassItem = {
  id: string;
  name: string;
  user_id: string;
};

export default function ClassesPage() {
  const router = useRouter();
  const { authUser, setAuthUser } = useAuthSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useClickOutside(userMenuRef, isUserMenuOpen, () => setIsUserMenuOpen(false));

  const handleCreateClass = async () => {
    const userId = authUser?.id;
    if (!userId || !newClassName.trim()) {
      return;
    }
    try {
      setIsCreating(true);
      setError('');
      const created = (await createClass({
        name: newClassName.trim(),
        userId,
      })) as ClassItem;
      setClasses((prev) => [created, ...prev]);
      setNewClassName('');
      setIsCreateModalOpen(false);
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : 'Erro inesperado ao criar turma.';
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (!authUser?.id) {
      return;
    }

    const loadClasses = async () => {
      try {
        setIsLoading(true);
        setError('');
        const payload = (await listClasses(authUser.id)) as { items?: ClassItem[] };
        setClasses(payload.items ?? []);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : 'Erro inesperado ao carregar turmas.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadClasses();
  }, [authUser?.id]);

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

        <section className="px-6">
          <div className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]">
                  Turmas
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Minhas turmas</h1>
                <p className="mt-1 text-sm text-[var(--graphite)]">
                  Selecione uma turma para ver ou revisar suas tarefas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!authUser) {
                    router.push('/auth');
                    return;
                  }
                  setIsCreateModalOpen(true);
                }}
                className="rounded-lg bg-[var(--chalk)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--chalk-strong)]"
              >
                Criar turma
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--fog)] bg-white">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-[var(--paper)] text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Turma</th>
                    <th className="px-4 py-3 text-right font-semibold">Acoes</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--ink)]">
                  {isLoading && (
                    <tr>
                      <td className="px-4 py-4 text-[var(--graphite)]" colSpan={2}>
                        Carregando turmas...
                      </td>
                    </tr>
                  )}
                  {!isLoading && error && (
                    <tr>
                      <td className="px-4 py-4 text-[var(--rubric)]" colSpan={2}>
                        {error}
                      </td>
                    </tr>
                  )}
                  {!isLoading && !error && classes.length === 0 && (
                    <tr>
                      <td className="px-4 py-4 text-[var(--graphite)]" colSpan={2}>
                        Nenhuma turma cadastrada.
                      </td>
                    </tr>
                  )}
                  {!isLoading &&
                    !error &&
                    classes.map((item) => (
                      <tr key={item.id} className="border-t border-[var(--fog)]">
                        <td className="px-4 py-4 font-semibold">{item.name}</td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => router.push(`/classes/${item.id}/tasks`)}
                            className="rounded-lg border border-[var(--fog)] bg-[var(--paper)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--chalk)] transition hover:border-[var(--chalk)]"
                          >
                            Ver tarefas
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

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Criar nova turma</h2>
            <p className="mt-1 text-sm text-[var(--graphite)]">
              Informe o nome da turma para continuar.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <input
                type="text"
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
                placeholder="Nome da turma"
                className="w-full rounded-xl border border-[var(--fog)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
              />
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg border border-[var(--fog)] px-4 py-2 text-sm font-semibold text-[var(--graphite)] hover:bg-[var(--wash)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isCreating || !newClassName.trim()}
                onClick={handleCreateClass}
                className="rounded-lg bg-[var(--chalk)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--chalk-strong)] disabled:cursor-not-allowed disabled:bg-[var(--fog)]"
              >
                {isCreating ? 'Criando...' : 'Criar turma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
