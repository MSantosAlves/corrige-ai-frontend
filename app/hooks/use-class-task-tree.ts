import { useCallback, useEffect, useMemo, useState } from 'react';

import { listClasses } from '../services/classes-service';
import { listTasks } from '../services/tasks-service';

type ClassItem = {
  id: string;
  name: string;
  user_id: string;
};

type TaskItem = {
  id: string;
  title: string;
  class_id: string;
  created_at?: string;
  updated_at?: string;
};

type TaskMap = Record<string, TaskItem[]>;
type LoadingMap = Record<string, boolean>;

export const useClassTaskTree = (userId?: string) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [tasksByClassId, setTasksByClassId] = useState<TaskMap>({});
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [loadingTasksByClassId, setLoadingTasksByClassId] = useState<LoadingMap>({});
  const [error, setError] = useState('');

  const loadClasses = useCallback(async () => {
    if (!userId) {
      setClasses([]);
      return;
    }
    try {
      setIsLoadingClasses(true);
      setError('');
      const payload = (await listClasses(userId)) as { items?: ClassItem[] };
      setClasses(payload.items ?? []);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Erro inesperado ao carregar turmas.';
      setError(message);
    } finally {
      setIsLoadingClasses(false);
    }
  }, [userId]);

  const loadTasksForClass = useCallback(async (classId: string) => {
    if (!classId) {
      return;
    }
    setLoadingTasksByClassId((prev) => ({ ...prev, [classId]: true }));
    try {
      const payload = (await listTasks(classId)) as { items?: TaskItem[] };
      setTasksByClassId((prev) => ({ ...prev, [classId]: payload.items ?? [] }));
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Erro inesperado ao carregar tarefas.';
      setError(message);
    } finally {
      setLoadingTasksByClassId((prev) => ({ ...prev, [classId]: false }));
    }
  }, []);

  const toggleClass = useCallback(
    (classId: string) => {
      setExpandedClassId((prev) => (prev === classId ? null : classId));
      setSelectedClassId(classId);
      setSelectedTaskId(null);
      if (!tasksByClassId[classId] && !loadingTasksByClassId[classId]) {
        void loadTasksForClass(classId);
      }
    },
    [loadTasksForClass, loadingTasksByClassId, tasksByClassId],
  );

  const selectTask = useCallback((classId: string, taskId: string) => {
    setSelectedClassId(classId);
    setSelectedTaskId(taskId);
  }, []);

  const refreshClasses = useCallback(async () => {
    await loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  const activeTasks = useMemo(() => {
    if (!expandedClassId) {
      return [];
    }
    return tasksByClassId[expandedClassId] ?? [];
  }, [expandedClassId, tasksByClassId]);

  return {
    classes,
    tasksByClassId,
    expandedClassId,
    selectedClassId,
    selectedTaskId,
    isLoadingClasses,
    loadingTasksByClassId,
    error,
    activeTasks,
    toggleClass,
    selectTask,
    setExpandedClassId,
    setSelectedClassId,
    setSelectedTaskId,
    loadTasksForClass,
    refreshClasses,
  };
};
