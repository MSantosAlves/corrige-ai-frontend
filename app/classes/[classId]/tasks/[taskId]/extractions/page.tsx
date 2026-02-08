'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { AppHeader } from '../../../../../components/layout/AppHeader';
import { useAuthFlow } from '../../../../../hooks/use-auth-flow';
import { useAuthSession } from '../../../../../hooks/use-auth-session';
import { useClickOutside } from '../../../../../hooks/use-click-outside';
import { listClasses } from '../../../../../services/classes-service';
import { listExtractionsByTask } from '../../../../../services/extractions-service';
import { listTasks } from '../../../../../services/tasks-service';

type ClassItem = {
  id: string;
  name: string;
  user_id: string;
};

type TaskItem = {
  id: string;
  class_id: string;
  title: string;
  description?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
};

type TaskExtraction = {
  id: string;
  task_id: string;
  ocr_extraction_result: Record<string, unknown>;
  analysis_result: string;
  filename: string;
  created_at: string;
  updated_at: string;
};

export default function TaskExtractionsPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.classId as string;
  const taskId = params?.taskId as string;

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
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const loginMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const [classInfo, setClassInfo] = useState<ClassItem | null>(null);
  const [taskInfo, setTaskInfo] = useState<TaskItem | null>(null);
  const [extractions, setExtractions] = useState<TaskExtraction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!classId) {
      return;
    }

    const fetchClassInfo = async () => {
      try {
        const userId = localStorage.getItem('sessionUserId');
        if (!userId) {
          return;
        }
        const payload = (await listClasses(userId)) as { items?: ClassItem[] };
        const found = payload.items?.find((c) => c.id === classId);
        if (found) {
          setClassInfo(found);
        }
      } catch {
        // Ignore errors
      }
    };

    fetchClassInfo();
  }, [classId]);

  useEffect(() => {
    if (!classId || !taskId) {
      return;
    }

    const fetchTaskInfo = async () => {
      try {
        const payload = (await listTasks(classId)) as { items?: TaskItem[] };
        const found = payload.items?.find((task) => task.id === taskId);
        if (found) {
          setTaskInfo(found);
        }
      } catch {
        // Ignore errors
      }
    };

    fetchTaskInfo();
  }, [classId, taskId]);

  useEffect(() => {
    if (!taskId) {
      return;
    }

    const fetchExtractions = async () => {
      try {
        setIsLoading(true);
        setError('');
        const payload = (await listExtractionsByTask(taskId)) as { items?: TaskExtraction[] };
        setExtractions(payload.items ?? []);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : 'Erro ao carregar análises.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExtractions();
  }, [taskId]);

  useClickOutside(loginMenuRef, isLoginMenuOpen, () => setIsLoginMenuOpen(false));
  useClickOutside(userMenuRef, isUserMenuOpen, () => setIsUserMenuOpen(false));

  const progressPercent = useMemo(() => {
    if (extractions.length === 0) {
      return 0;
    }
    return 100;
  }, [extractions.length]);

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
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
            onClick={() => router.back()}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]"
          >
            ← Voltar
          </button>
        </section>

        <section className="grid gap-6 px-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]">
                  Extracoes e uploads
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  {taskInfo?.title || 'Tarefa selecionada'}
                </h1>
                <p className="mt-1 text-sm text-[var(--graphite)]">
                  {classInfo?.name ? `Turma: ${classInfo.name}` : 'Turma em carregamento'}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--fog)] bg-[var(--paper)] px-4 py-3 text-xs text-[var(--graphite)]">
                <p className="uppercase tracking-[0.2em]">Progresso geral</p>
                <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                  {extractions.length} envios processados
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--wash)]">
                  <div
                    className="h-full rounded-full bg-[var(--chalk)] transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--fog)] bg-white">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-[var(--paper)] text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[var(--fog)] text-[var(--chalk)]"
                        aria-label="Selecionar todos"
                      />
                    </th>
                    <th className="px-4 py-3 font-semibold">Nome</th>
                    <th className="px-4 py-3 font-semibold">Criado em</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Acoes</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--ink)]">
                  {isLoading && (
                    <tr>
                      <td className="px-4 py-4 text-[var(--graphite)]" colSpan={5}>
                        Carregando uploads...
                      </td>
                    </tr>
                  )}
                  {!isLoading && error && (
                    <tr>
                      <td className="px-4 py-4 text-[var(--rubric)]" colSpan={5}>
                        {error}
                      </td>
                    </tr>
                  )}
                  {!isLoading && !error && extractions.length === 0 && (
                    <tr>
                      <td className="px-4 py-4 text-[var(--graphite)]" colSpan={5}>
                        Nenhuma análise registrada para esta tarefa.
                      </td>
                    </tr>
                  )}
                  {!isLoading &&
                    !error &&
                    extractions.map((extraction) => {
                      const statusLabel = extraction.analysis_result ? 'REVISADO' : 'EM PROCESSO';
                      const statusTone =
                        statusLabel === 'REVISADO'
                          ? 'bg-[var(--paper-strong)] text-[var(--chalk)]'
                          : 'bg-[var(--paper-strong)] text-[var(--amber)]';
                      return (
                        <tr
                          key={extraction.id}
                          className="border-t border-[var(--fog)] transition hover:bg-[var(--paper)]"
                        >
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-[var(--fog)] text-[var(--chalk)]"
                              aria-label={`Selecionar ${extraction.filename}`}
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold">{extraction.filename}</span>
                              <span className="text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">
                                Upload
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-[var(--graphite)]">
                            {formatDate(extraction.created_at)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${statusTone}`}
                            >
                              <span className="h-2 w-2 rounded-full bg-current" />
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="relative inline-flex items-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveMenuId((current) =>
                                    current === extraction.id ? null : extraction.id,
                                  )
                                }
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--fog)] text-[var(--graphite)] hover:border-[var(--chalk)] hover:text-[var(--chalk)]"
                              >
                                •••
                              </button>
                              {activeMenuId === extraction.id && (
                                <div className="absolute right-0 top-10 z-10 w-40 rounded-xl border border-[var(--fog)] bg-white p-2 text-xs text-[var(--ink)] shadow-sm">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      router.push(
                                        `/classes/${classId}/tasks/${taskId}/extraction/${extraction.id}`,
                                      )
                                    }
                                    className="w-full rounded-lg px-3 py-2 text-left font-semibold hover:bg-[var(--wash)]"
                                  >
                                    Ver detalhes
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]">
              Contexto da tarefa
            </p>
            <div className="mt-4 space-y-3 text-sm text-[var(--ink)]">
              <div className="rounded-xl border border-[var(--fog)] bg-[var(--paper)] p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">Turma</p>
                <p className="mt-1 font-semibold">{classInfo?.name ?? 'Carregando...'}</p>
              </div>
              <div className="rounded-xl border border-[var(--fog)] bg-[var(--paper)] p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">Tarefa</p>
                <p className="mt-1 font-semibold">{taskInfo?.title ?? 'Carregando...'}</p>
              </div>
              <div className="rounded-xl border border-[var(--fog)] bg-[var(--paper)] p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">
                  Total de uploads
                </p>
                <p className="mt-1 font-semibold">{extractions.length}</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
