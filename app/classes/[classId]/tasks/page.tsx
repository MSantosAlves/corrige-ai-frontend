'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { listClasses } from '../../../services/classes-service';
import { AttachCriteriaModal } from '../../../components/criteria/AttachCriteriaModal';
import {
  attachCriteriaToTask,
  listCriteria,
  type GradeCriteria,
} from '../../../services/criteria-service';
import { createTask, listTasks } from '../../../services/tasks-service';
import { AppHeader } from '../../../components/layout/AppHeader';
import { useAuthSession } from '../../../hooks/use-auth-session';
import { useClickOutside } from '../../../hooks/use-click-outside';
import { signOut } from '../../../services/auth-client';

type Task = {
  id: string;
  class_id: string;
  title: string;
  description?: string;
  due_date?: string;
  grade_criteria_id?: string;
  classification?: string;
  created_at: string;
  updated_at: string;
};

type ClassItem = {
  id: string;
  name: string;
  user_id: string;
};

export default function TasksPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.classId as string;
  const { authUser, setAuthUser } = useAuthSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [classInfo, setClassInfo] = useState<ClassItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [criteriaOptions, setCriteriaOptions] = useState<GradeCriteria[]>([]);
  const [criteriaMap, setCriteriaMap] = useState<Record<string, string>>({});
  const [criteriaLoading, setCriteriaLoading] = useState(false);
  const [criteriaError, setCriteriaError] = useState('');
  const [criteriaSelection, setCriteriaSelection] = useState('');
  const [criteriaTask, setCriteriaTask] = useState<Task | null>(null);
  const [isAttachingCriteria, setIsAttachingCriteria] = useState(false);

  useClickOutside(userMenuRef, isUserMenuOpen, () => setIsUserMenuOpen(false));

  useEffect(() => {
    if (!classId) {
      return;
    }

    const fetchClassInfo = async () => {
      try {
        const userId = authUser?.id;
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
  }, [authUser?.id, classId]);

  useEffect(() => {
    if (!classId) {
      return;
    }

    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Fetch tasks for this class
        const tasksPayload = (await listTasks(classId)) as { items?: Task[] };
        setTasks(tasksPayload.items ?? []);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : 'Erro inesperado ao carregar tarefas.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [classId]);

  const handleCreateTask = async () => {
    if (!classId || !newTaskTitle.trim()) {
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      const created = (await createTask({
        classId,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
      })) as Task;
      setTasks((prev) => [created, ...prev]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setIsModalOpen(false);
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : 'Erro inesperado ao criar tarefa.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const handleTaskClick = (task: Task) => {
    router.push(`/classes/${classId}/tasks/${task.id}/extractions`);
  };

  const loadUserCriteria = async () => {
    try {
      setCriteriaLoading(true);
      setCriteriaError('');
      const userId = authUser?.id;
      const payload = await listCriteria({ includePublic: false });
      const items =
        userId && payload.items
          ? payload.items.filter((item) => item.user_id === userId)
          : (payload.items ?? []);
      setCriteriaOptions(items);
      setCriteriaMap(
        items.reduce<Record<string, string>>((acc, item) => {
          acc[item.id] = item.name;
          return acc;
        }, {}),
      );
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Erro ao carregar critérios.';
      setCriteriaError(message);
    } finally {
      setCriteriaLoading(false);
    }
  };

  useEffect(() => {
    loadUserCriteria();
  }, []);

  const openCriteriaModal = (task: Task) => {
    setCriteriaTask(task);
    setCriteriaSelection('');
    setIsCriteriaModalOpen(true);
    loadUserCriteria();
  };

  const handleAttachCriteria = async () => {
    if (!criteriaTask || !criteriaSelection) {
      return;
    }
    const criteria = criteriaOptions.find((item) => item.id === criteriaSelection);
    if (!criteria) {
      setCriteriaError('Critério selecionado inválido.');
      return;
    }
    try {
      setIsAttachingCriteria(true);
      setCriteriaError('');
      await attachCriteriaToTask({
        taskId: criteriaTask.id,
        gradeCriteriaId: criteria.id,
        classification: criteria.classification,
      });
      setIsCriteriaModalOpen(false);
    } catch (attachError) {
      const message =
        attachError instanceof Error ? attachError.message : 'Erro ao atribuir critério.';
      setCriteriaError(message);
    } finally {
      setIsAttachingCriteria(false);
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

        <section className="px-6">
          <div className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]">
                  Tarefas
                </p>
                <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  {classInfo?.name ? `Tarefas de ${classInfo.name}` : 'Minhas tarefas'}
                </h1>
                <p className="mt-1 text-sm text-[var(--graphite)]">
                  Gerencie as tarefas da turma e acompanhe o progresso.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!authUser) {
                    router.push('/auth');
                    return;
                  }
                  setIsModalOpen(true);
                }}
                className="rounded-lg bg-[var(--chalk)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[var(--chalk-strong)]"
              >
                Criar tarefa
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--fog)] bg-white">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-[var(--paper)] text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Tarefa</th>
                    <th className="px-4 py-3 font-semibold">Prazo</th>
                    <th className="px-4 py-3 font-semibold">Critério</th>
                    <th className="px-4 py-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--ink)]">
                  {isLoading && (
                    <tr>
                      <td className="px-4 py-4 text-[var(--graphite)]" colSpan={4}>
                        Carregando tarefas...
                      </td>
                    </tr>
                  )}
                  {!isLoading && error && (
                    <tr>
                      <td className="px-4 py-4 text-[var(--rubric)]" colSpan={4}>
                        {error}
                      </td>
                    </tr>
                  )}
                  {!isLoading && !error && tasks.length === 0 && (
                    <tr>
                      <td className="px-4 py-4 text-[var(--graphite)]" colSpan={4}>
                        Não há tarefas cadastradas.
                      </td>
                    </tr>
                  )}
                  {!isLoading &&
                    !error &&
                    tasks.map((task) => (
                      <tr key={task.id} className="border-t border-[var(--fog)]">
                        <td className="px-4 py-4">
                          <p className="font-semibold">{task.title}</p>
                          {task.description && (
                            <p className="mt-1 text-xs text-[var(--graphite)]">
                              {task.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-[var(--graphite)]">
                          {task.due_date ? formatDate(task.due_date) : '—'}
                        </td>
                        <td className="px-4 py-4">
                          {task.grade_criteria_id ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openCriteriaModal(task);
                              }}
                              className="rounded-full border border-[var(--fog)] bg-[var(--paper)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--chalk)] hover:border-[var(--chalk)]"
                            >
                              {criteriaMap[task.grade_criteria_id] || 'Critério anexado'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openCriteriaModal(task);
                              }}
                              className="rounded-full border border-[var(--fog)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)] hover:border-[var(--chalk)] hover:text-[var(--chalk)]"
                            >
                              Atribuir critério
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleTaskClick(task)}
                            className="rounded-lg border border-[var(--fog)] bg-[var(--paper)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--chalk)] transition hover:border-[var(--chalk)]"
                          >
                            Ver uploads
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Criar nova tarefa</h2>
            <p className="mt-1 text-sm text-[var(--graphite)]">
              Informe os detalhes da tarefa para continuar.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                placeholder="Título da tarefa"
                className="w-full rounded-xl border border-[var(--fog)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
              />
              <textarea
                value={newTaskDescription}
                onChange={(event) => setNewTaskDescription(event.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full rounded-xl border border-[var(--fog)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
                rows={3}
              />
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-[var(--fog)] px-4 py-2 text-sm font-semibold text-[var(--graphite)] hover:bg-[var(--wash)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting || !newTaskTitle.trim()}
                onClick={handleCreateTask}
                className="rounded-lg bg-[var(--chalk)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--chalk-strong)] disabled:cursor-not-allowed disabled:bg-[var(--fog)]"
              >
                {isSubmitting ? 'Criando...' : 'Criar tarefa'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AttachCriteriaModal
        isOpen={isCriteriaModalOpen}
        onClose={() => setIsCriteriaModalOpen(false)}
        criteriaOptions={criteriaOptions}
        selectedCriteriaId={criteriaSelection}
        onSelectCriteria={setCriteriaSelection}
        onAttach={handleAttachCriteria}
        isLoading={criteriaLoading}
        isSubmitting={isAttachingCriteria}
        error={criteriaError}
      />
    </main>
  );
}
