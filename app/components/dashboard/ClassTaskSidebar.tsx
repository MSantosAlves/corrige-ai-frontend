'use client';

type ClassItem = {
  id: string;
  name: string;
  user_id: string;
};

type TaskItem = {
  id: string;
  title: string;
  class_id: string;
};

type ClassTaskSidebarProps = {
  classes: ClassItem[];
  tasksByClassId: Record<string, TaskItem[]>;
  expandedClassId: string | null;
  selectedClassId: string | null;
  selectedTaskId: string | null;
  isLoadingClasses: boolean;
  loadingTasksByClassId: Record<string, boolean>;
  error: string;
  onToggleClass: (classId: string) => void;
  onSelectTask: (classId: string, taskId: string) => void;
  onOpenModal: () => void;
  onNavigateClasses: () => void;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
  showPlan: boolean;
};

export const ClassTaskSidebar = ({
  classes,
  tasksByClassId,
  expandedClassId,
  selectedClassId,
  selectedTaskId,
  isLoadingClasses,
  loadingTasksByClassId,
  error,
  onToggleClass,
  onSelectTask,
  onOpenModal,
  onNavigateClasses,
  isAuthenticated,
  onRequireAuth,
  showPlan,
}: ClassTaskSidebarProps) => (
  <aside className="flex max-h-[calc(100vh-6rem)] self-start flex-col gap-4 overflow-hidden rounded-2xl border border-[var(--fog)] bg-[var(--paper-strong)] p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--chalk)]">
          Turmas & Tarefas
        </p>
      </div>
      <button
        type="button"
        onClick={isAuthenticated ? onOpenModal : onRequireAuth}
        className="rounded-full border border-[var(--fog)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--chalk)] transition hover:border-[var(--chalk)]"
      >
        Criar
      </button>
    </div>

    <div className="flex-1 min-h-0 overflow-y-auto pr-1 pl-0 class-scroll">
      {isLoadingClasses ? (
        <p className="text-xs text-[var(--graphite)]">Carregando turmas...</p>
      ) : classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--fog)] bg-white/70 p-4 text-xs text-[var(--graphite)]">
          Crie sua primeira turma para começar.
        </div>
      ) : (
        <div className="space-y-2">
          {classes.slice(0, 5).reverse().map((classItem) => {
            const isExpanded = expandedClassId === classItem.id;
            const tasks = tasksByClassId[classItem.id] ?? [];
            const isLoadingTasks = loadingTasksByClassId[classItem.id];
            return (
              <div
                key={classItem.id}
                className={`rounded-xl border transition ${
                  selectedClassId === classItem.id
                    ? 'border-[var(--chalk)] bg-[var(--paper)]'
                    : 'border-[var(--fog)] bg-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggleClass(classItem.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{classItem.name}</p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--graphite)]">
                      Turma
                    </p>
                  </div>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                      isExpanded
                        ? 'border-[var(--chalk)] text-[var(--chalk)]'
                        : 'border-[var(--fog)] text-[var(--graphite)]'
                    }`}
                  >
                    {isExpanded ? '−' : '+'}
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t border-[var(--fog)] px-3 py-2">
                    {isLoadingTasks ? (
                      <p className="text-xs text-[var(--graphite)]">Carregando tarefas...</p>
                    ) : tasks.length === 0 ? (
                      <p className="text-xs text-[var(--graphite)]">Sem tarefas cadastradas.</p>
                    ) : (
                      <div className="max-h-12 space-y-1 overflow-y-auto pr-1 class-scroll">
                        {tasks.map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => onSelectTask(classItem.id, task.id)}
                            className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${
                              selectedTaskId === task.id
                                ? 'bg-[var(--chalk)] text-white'
                                : 'bg-[var(--paper-soft)] text-[var(--ink)] hover:bg-[var(--paper)]'
                            }`}
                          >
                            {task.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={onNavigateClasses}
            className="mt-2 w-full rounded-lg border border-[var(--fog)] bg-transparent px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--graphite)] transition hover:text-[var(--chalk)]"
          >
            Ver todas as turmas
          </button>
        </div>
      )}
    </div>

    {error && <p className="text-xs text-[var(--rubric)]">{error}</p>}
    {showPlan && (
      <>
        <div className="border-t border-[var(--fog)]" />
        <div className="rounded-xl border border-[var(--fog)] bg-[var(--paper-soft)] p-3 text-xs text-[var(--graphite)]">
          <div className="flex items-center justify-between">
            <p className="uppercase tracking-[0.2em]">Plano</p>
            <span className="rounded-full border border-[var(--fog)] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--chalk)]">
              Gratuito
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-[var(--graphite)]">
            <span>Uso mensal</span>
            <span className="font-semibold text-[var(--ink)]">1/50</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--wash)]">
            <div className="h-full w-[2%] rounded-full bg-[var(--chalk)]" />
          </div>
        </div>
      </>
    )}
  </aside>
);
