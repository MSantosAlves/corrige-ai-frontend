'use client';

import { useEffect, useState } from 'react';
import { createClass, listClasses } from '../services/classes-service';
import { createTask, listTasks } from '../services/tasks-service';

type ClassTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    classId: string;
    taskId: string;
    className?: string;
    taskTitle?: string;
  }) => void;
  userId?: string;
  preSelectedClassId?: string;
  preSelectedTaskId?: string;
  initialTab?: TabType;
};

type TabType = 'select' | 'create';

type Class = {
  id: string;
  name: string;
  user_id: string;
};

type Task = {
  id: string;
  title: string;
  class_id: string;
  created_at: string;
  updated_at: string;
};

export default function ClassTaskModal({
  isOpen,
  onClose,
  onConfirm,
  userId,
  preSelectedClassId,
  preSelectedTaskId,
  initialTab,
}: ClassTaskModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('select');
  const effectiveUserId = userId ?? null;

  // Select tab states
  const [classes, setClasses] = useState<Class[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(preSelectedClassId || '');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(preSelectedTaskId || '');
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [classesError, setClassesError] = useState('');
  const [tasksError, setTasksError] = useState('');

  // Create tab states
  const [newClassName, setNewClassName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Load classes when modal opens and user is logged in
  useEffect(() => {
    if (!isOpen || !effectiveUserId) {
      return;
    }

    const loadClasses = async () => {
      try {
        setIsLoadingClasses(true);
        setClassesError('');
        const data = (await listClasses(effectiveUserId)) as { items?: Class[] };
        setClasses(data.items ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao carregar turmas';
        setClassesError(message);
      } finally {
        setIsLoadingClasses(false);
      }
    };

    loadClasses();
  }, [effectiveUserId, isOpen]);

  // Initialize selected values when modal opens
  useEffect(() => {
    if (isOpen && preSelectedClassId) {
      setSelectedClassId(preSelectedClassId);
    }
    if (isOpen && preSelectedTaskId) {
      setSelectedTaskId(preSelectedTaskId);
    }
  }, [isOpen, preSelectedClassId, preSelectedTaskId]);

  useEffect(() => {
    if (!isOpen || !initialTab) {
      return;
    }
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Load tasks when class is selected
  useEffect(() => {
    if (!selectedClassId) {
      setTasks([]);
      setSelectedTaskId('');
      return;
    }

    const loadTasks = async () => {
      try {
        setIsLoadingTasks(true);
        setTasksError('');
        const data = (await listTasks(selectedClassId)) as { items?: Task[] };
        setTasks(data.items ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao carregar tarefas';
        setTasksError(message);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    loadTasks();
  }, [selectedClassId]);

  const handleCreateClassAndTask = async () => {
    if (!newClassName.trim() || !newTaskTitle.trim() || !effectiveUserId) {
      return;
    }

    try {
      setIsCreating(true);
      setCreateError('');

      // Create class
      const createdClass = (await createClass({
        name: newClassName.trim(),
        userId: effectiveUserId,
      })) as Class;

      // Create task
      const createdTask = (await createTask({
        classId: createdClass.id,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || undefined,
      })) as Task;

      // Confirm with the new IDs
      onConfirm({
        classId: createdClass.id,
        taskId: createdTask.id,
        className: createdClass.name,
        taskTitle: createdTask.title,
      });
      onClose();

      // Reset form
      setNewClassName('');
      setNewTaskTitle('');
      setNewTaskDescription('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar turma e tarefa';
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Selecione uma Turma e Tarefa</h2>
        <p className="mt-1 text-sm text-[var(--graphite)]">
          Para começar a análise, escolha uma turma e uma tarefa existentes ou crie novas.
        </p>

        {/* Tabs */}
        <div className="mt-6 flex border-b border-[var(--fog)]">
          <button
            type="button"
            onClick={() => setActiveTab('select')}
            className={`flex-1 pb-3 text-center text-sm font-semibold transition ${
              activeTab === 'select'
                ? 'border-b-2 border-[var(--chalk)] text-[var(--chalk)]'
                : 'text-[var(--graphite)] hover:text-[var(--ink)]'
            }`}
          >
            Selecionar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 pb-3 text-center text-sm font-semibold transition ${
              activeTab === 'create'
                ? 'border-b-2 border-[var(--chalk)] text-[var(--chalk)]'
                : 'text-[var(--graphite)] hover:text-[var(--ink)]'
            }`}
          >
            Criar
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'select' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--graphite)]">Turma</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  disabled={isLoadingClasses}
                  className="mt-2 w-full rounded-xl border border-[var(--fog)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)] disabled:bg-[var(--wash)]"
                >
                  <option value="">
                    {isLoadingClasses
                      ? 'Carregando turmas...'
                      : classes.length === 0
                        ? 'Nenhuma turma disponível'
                        : 'Selecione uma turma'}
                  </option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                {classesError && (
                  <p className="mt-2 text-xs text-[var(--rubric)]">{classesError}</p>
                )}
              </div>

              {selectedClassId && (
                <div>
                  <label className="text-xs font-semibold text-[var(--graphite)]">Tarefa</label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    disabled={isLoadingTasks}
                    className="mt-2 w-full rounded-xl border border-[var(--fog)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)] disabled:bg-[var(--wash)]"
                  >
                    <option value="">
                      {isLoadingTasks
                        ? 'Carregando tarefas...'
                        : tasks.length === 0
                          ? 'Nenhuma tarefa disponível'
                          : 'Selecione uma tarefa'}
                    </option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                  {tasksError && <p className="mt-2 text-xs text-[var(--rubric)]">{tasksError}</p>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="space-y-4">
              {!effectiveUserId && (
                <div className="rounded-xl border border-[var(--fog)] bg-[var(--paper)] p-3 text-xs text-[var(--rubric)]">
                  Faça login para criar novas turmas e tarefas.
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-[var(--graphite)]">
                  Nome da Turma
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Ex: 3º Ano B"
                  className="mt-2 w-full rounded-xl border border-[var(--fog)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--graphite)]">
                  Título da Tarefa
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ex: Revisão de redação"
                  className="mt-2 w-full rounded-xl border border-[var(--fog)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--graphite)]">
                  Descrição da Tarefa <span className="text-[var(--graphite)]">(opcional)</span>
                </label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Ex: Revisar o texto quanto à gramática e ortografia"
                  className="mt-2 w-full rounded-xl border border-[var(--fog)] px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
                  rows={3}
                />
              </div>
              {createError && <p className="text-xs text-[var(--rubric)]">{createError}</p>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--fog)] px-6 py-2 text-sm font-semibold text-[var(--graphite)] transition hover:bg-[var(--wash)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={
              activeTab === 'select'
                ? !selectedTaskId || !selectedClassId
                : isCreating || !newClassName.trim() || !newTaskTitle.trim() || !effectiveUserId
            }
            onClick={() => {
              if (activeTab === 'select') {
                const selectedClass = classes.find((item) => item.id === selectedClassId);
                const selectedTask = tasks.find((item) => item.id === selectedTaskId);
                onConfirm({
                  classId: selectedClassId,
                  taskId: selectedTaskId,
                  className: selectedClass?.name,
                  taskTitle: selectedTask?.title,
                });
                onClose();
              } else {
                handleCreateClassAndTask();
              }
            }}
            className="rounded-full bg-[var(--chalk)] px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--chalk-strong)] disabled:cursor-not-allowed disabled:bg-[var(--fog)]"
          >
            {activeTab === 'create' && isCreating ? 'Criando...' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
