"use client";

import { useEffect, useState } from "react";

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
};

type TabType = "select" | "create";

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
  preSelectedTaskId
}: ClassTaskModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("select");
  
  // Select tab states
  const [classes, setClasses] = useState<Class[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(preSelectedClassId || "");
  const [selectedTaskId, setSelectedTaskId] = useState<string>(preSelectedTaskId || "");
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [classesError, setClassesError] = useState("");
  const [tasksError, setTasksError] = useState("");

  // Create tab states
  const [newClassName, setNewClassName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Load classes when modal opens and user is logged in
  useEffect(() => {
    if (!isOpen || !userId) {
      return;
    }

    const loadClasses = async () => {
      try {
        setIsLoadingClasses(true);
        setClassesError("");
        const token = localStorage.getItem("sessionToken");
        const response = await fetch(
          `http://localhost:3001/classes?user_id=${encodeURIComponent(userId)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          }
        );
        if (!response.ok) {
          throw new Error("Falha ao carregar turmas");
        }
        const data = (await response.json()) as { items?: Class[] };
        setClasses(data.items ?? []);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar turmas";
        setClassesError(message);
      } finally {
        setIsLoadingClasses(false);
      }
    };

    loadClasses();
  }, [isOpen, userId]);

  // Initialize selected values when modal opens
  useEffect(() => {
    if (isOpen && preSelectedClassId) {
      setSelectedClassId(preSelectedClassId);
    }
    if (isOpen && preSelectedTaskId) {
      setSelectedTaskId(preSelectedTaskId);
    }
  }, [isOpen, preSelectedClassId, preSelectedTaskId]);

  // Load tasks when class is selected
  useEffect(() => {
    if (!selectedClassId) {
      setTasks([]);
      setSelectedTaskId("");
      return;
    }

    const loadTasks = async () => {
      try {
        setIsLoadingTasks(true);
        setTasksError("");
        const token = localStorage.getItem("sessionToken");
        const response = await fetch(
          `http://localhost:3001/tasks?class_id=${encodeURIComponent(selectedClassId)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          }
        );
        if (!response.ok) {
          throw new Error("Falha ao carregar tarefas");
        }
        const data = (await response.json()) as { items?: Task[] };
        setTasks(data.items ?? []);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar tarefas";
        setTasksError(message);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    loadTasks();
  }, [selectedClassId]);

  const handleCreateClassAndTask = async () => {
    if (!newClassName.trim() || !newTaskTitle.trim() || !userId) {
      return;
    }

    try {
      setIsCreating(true);
      setCreateError("");

      // Create class
      const token = localStorage.getItem("sessionToken");
      const classResponse = await fetch("http://localhost:3001/classes", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "content-type": "application/json"
        },
        body: JSON.stringify({
          name: newClassName.trim(),
          user_id: userId
        })
      });

      if (!classResponse.ok) {
        const payload = (await classResponse.json()) as { error?: string };
        throw new Error(payload.error || "Falha ao criar turma");
      }

      const createdClass = (await classResponse.json()) as Class;

      // Create task
      const taskResponse = await fetch("http://localhost:3001/tasks", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "content-type": "application/json"
        },
        body: JSON.stringify({
          class_id: createdClass.id,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || undefined
        })
      });

      if (!taskResponse.ok) {
        const payload = (await taskResponse.json()) as { error?: string };
        throw new Error(payload.error || "Falha ao criar tarefa");
      }

      const createdTask = (await taskResponse.json()) as Task;

      // Confirm with the new IDs
      onConfirm({
        classId: createdClass.id,
        taskId: createdTask.id,
        className: createdClass.name,
        taskTitle: createdTask.title
      });
      onClose();

      // Reset form
      setNewClassName("");
      setNewTaskTitle("");
      setNewTaskDescription("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar turma e tarefa";
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
        <h2 className="text-lg font-semibold text-gray-900">
          Selecione uma Turma e Tarefa
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Para começar a análise, escolha uma turma e uma tarefa existentes ou crie novas.
        </p>

        {/* Tabs */}
        <div className="mt-6 flex border-b border-blue-100">
          <button
            type="button"
            onClick={() => setActiveTab("select")}
            className={`flex-1 pb-3 text-center text-sm font-semibold transition ${
              activeTab === "select"
                ? "border-b-2 border-blue-600 text-blue-700"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Selecionar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`flex-1 pb-3 text-center text-sm font-semibold transition ${
              activeTab === "create"
                ? "border-b-2 border-blue-600 text-blue-700"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Criar
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "select" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Turma
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  disabled={isLoadingClasses}
                  className="mt-2 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400 disabled:bg-gray-100"
                >
                  <option value="">
                    {isLoadingClasses
                      ? "Carregando turmas..."
                      : classes.length === 0
                      ? "Nenhuma turma disponível"
                      : "Selecione uma turma"}
                  </option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                {classesError && (
                  <p className="mt-2 text-xs text-red-500">{classesError}</p>
                )}
              </div>

              {selectedClassId && (
                <div>
                  <label className="text-xs font-semibold text-gray-600">
                    Tarefa
                  </label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    disabled={isLoadingTasks}
                    className="mt-2 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400 disabled:bg-gray-100"
                  >
                    <option value="">
                      {isLoadingTasks
                        ? "Carregando tarefas..."
                        : tasks.length === 0
                        ? "Nenhuma tarefa disponível"
                        : "Selecione uma tarefa"}
                    </option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                  {tasksError && (
                    <p className="mt-2 text-xs text-red-500">{tasksError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "create" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Nome da Turma
                </label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Ex: 3º Ano B"
                  className="mt-2 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Título da Tarefa
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ex: Revisão de redação"
                  className="mt-2 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Descrição da Tarefa <span className="text-gray-400">(opcional)</span>
                </label>
                <textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Ex: Revisar o texto quanto à gramática e ortografia"
                  className="mt-2 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400"
                  rows={3}
                />
              </div>
              {createError && (
                <p className="text-xs text-red-500">{createError}</p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-blue-100 px-6 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={
              activeTab === "select"
                ? !selectedTaskId || !selectedClassId
                : isCreating || !newClassName.trim() || !newTaskTitle.trim()
            }
            onClick={() => {
              if (activeTab === "select") {
                const selectedClass = classes.find((item) => item.id === selectedClassId);
                const selectedTask = tasks.find((item) => item.id === selectedTaskId);
                onConfirm({
                  classId: selectedClassId,
                  taskId: selectedTaskId,
                  className: selectedClass?.name,
                  taskTitle: selectedTask?.title
                });
                onClose();
              } else {
                handleCreateClassAndTask();
              }
            }}
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {activeTab === "create" && isCreating ? "Criando..." : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
