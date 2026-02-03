'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { listClasses } from '../../../services/classes-service';
import { AttachCriteriaModal } from '../../../components/criteria/AttachCriteriaModal';
import {
  attachCriteriaToTask,
  listCriteria,
  type GradeCriteria,
} from '../../../services/criteria-service';
import { listExtractionsByTask } from '../../../services/extractions-service';
import { createTask, listTasks } from '../../../services/tasks-service';

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

type TaskExtraction = {
  id: string;
  task_id: string;
  ocr_extraction_result: Record<string, unknown>;
  analysis_result: string;
  filename: string;
  created_at: string;
  updated_at: string;
};

export default function TasksPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.classId as string;

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

  // Analysis view states
  const [selectedTaskForAnalysis, setSelectedTaskForAnalysis] = useState<Task | null>(null);
  const [extractions, setExtractions] = useState<TaskExtraction[]>([]);
  const [isLoadingExtractions, setIsLoadingExtractions] = useState(false);
  const [extractionsError, setExtractionsError] = useState('');

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

  const handleTaskClick = async (task: Task) => {
    setSelectedTaskForAnalysis(task);
    setIsLoadingExtractions(true);
    setExtractionsError('');
    setExtractions([]);

    try {
      const payload = (await listExtractionsByTask(task.id)) as { items?: TaskExtraction[] };
      setExtractions(payload.items ?? []);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : 'Erro inesperado ao carregar análises.';
      setExtractionsError(message);
    } finally {
      setIsLoadingExtractions(false);
    }
  };

  const loadUserCriteria = async () => {
    try {
      setCriteriaLoading(true);
      setCriteriaError('');
      const userId = localStorage.getItem('sessionUserId');
      const payload = await listCriteria({ includePublic: false });
      const items =
        userId && payload.items
          ? payload.items.filter((item) => item.user_id === userId)
          : payload.items ?? [];
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
        attachError instanceof Error
          ? attachError.message
          : 'Erro ao atribuir critério.';
      setCriteriaError(message);
    } finally {
      setIsAttachingCriteria(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white px-6 py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Voltar
          </button>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Tarefas</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">
            {classInfo?.name ? `Tarefas de ${classInfo.name}` : 'Minhas tarefas'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Gerencie as tarefas da turma e acompanhe o progresso.
          </p>
        </header>

        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          {isLoading ? (
            <p className="text-sm text-gray-500">Carregando tarefas...</p>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-start gap-4">
              <p className="text-sm text-gray-600">Não há tarefas cadastradas.</p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Criar tarefa
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">{tasks.length} tarefa(s) cadastrada(s)</p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Criar tarefa
                </button>
              </div>
              <ul className="flex flex-col gap-3">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="cursor-pointer rounded-xl border border-blue-100 bg-blue-50/60 p-4 transition hover:border-blue-200 hover:bg-blue-100"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-2">
                          <h3 className="text-sm font-semibold text-gray-800">{task.title}</h3>
                          {task.description && (
                            <p className="text-xs text-gray-600">{task.description}</p>
                          )}
                          {task.due_date && (
                            <p className="text-xs text-gray-500">
                              Prazo: {formatDate(task.due_date)}
                            </p>
                          )}
                        </div>
                        {task.grade_criteria_id ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openCriteriaModal(task);
                            }}
                            className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200"
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
                            className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:border-blue-300"
                          >
                            Atribuir critério
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Criar nova tarefa</h2>
            <p className="mt-1 text-sm text-gray-600">
              Informe os detalhes da tarefa para continuar.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                placeholder="Título da tarefa"
                className="w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400"
              />
              <textarea
                value={newTaskDescription}
                onChange={(event) => setNewTaskDescription(event.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400"
                rows={3}
              />
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting || !newTaskTitle.trim()}
                onClick={handleCreateTask}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSubmitting ? 'Criando...' : 'Criar tarefa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTaskForAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Análises de "{selectedTaskForAnalysis.title}"
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedTaskForAnalysis(null);
                  setExtractions([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {isLoadingExtractions ? (
              <p className="text-sm text-gray-500">Carregando análises...</p>
            ) : extractionsError ? (
              <p className="text-sm text-red-500">{extractionsError}</p>
            ) : extractions.length === 0 ? (
              <p className="text-sm text-gray-600">Nenhuma análise realizada nesta tarefa.</p>
            ) : (
              <div className="space-y-4">
                {extractions.map((extraction) => (
                  <div
                    key={extraction.id}
                    className="rounded-xl border border-blue-100 bg-blue-50/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{extraction.filename}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(extraction.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          router.push(
                            `/classes/${classId}/tasks/${selectedTaskForAnalysis.id}/extraction/${extraction.id}`,
                          );
                          setSelectedTaskForAnalysis(null);
                        }}
                        className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition whitespace-nowrap"
                      >
                        Ir para detalhes
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-lg border border-blue-100 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Análise
                        </p>
                        <p className="mt-2 text-sm text-gray-700 whitespace-pre-line line-clamp-3">
                          {extraction.analysis_result || 'Sem análise disponível'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
