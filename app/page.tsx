'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppHeader } from './components/layout/AppHeader';
import { useRouter } from 'next/navigation';
import ClassTaskModal from './components/ClassTaskModal';
import { ClassTaskSidebar } from './components/dashboard/ClassTaskSidebar';
import { FileDropzone } from './components/dashboard/FileDropzone';
import { ZoomModal } from './components/dashboard/ZoomModal';
import { getFileKey } from './helpers/file-helpers';
import { useAuthSession } from './hooks/use-auth-session';
import { useBulkExtraction } from './hooks/use-bulk-extraction';
import { useClassTaskTree } from './hooks/use-class-task-tree';
import { useClickOutside } from './hooks/use-click-outside';
import { useExtractionFlow } from './hooks/use-extraction-flow';
import { useFilePreview } from './hooks/use-file-preview';
import { useFileSelection } from './hooks/use-file-selection';
import { getStoredPlanUsage, type PlanUsage } from './helpers/plan-usage';
import { signOut } from './services/auth-client';
import type { ExtractionUserPayload } from './services/extractions-service';

const documentTypeMap = {
  pdf_native: 'PDF Nativo',
  printed: 'Documento impresso',
  handwritten: 'Texto escrito à mão',
  auto: 'Detectar formato automaticamente',
} as const;

type DocumentTypeKey = keyof typeof documentTypeMap;

export default function Home() {
  const router = useRouter();
  const [pendingBulkRedirect, setPendingBulkRedirect] = useState<{
    classId: string;
    taskId: string;
  } | null>(null);
  const [redirectTarget, setRedirectTarget] = useState<{
    classId: string;
    taskId: string;
  } | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [uploadStarted, setUploadStarted] = useState(false);
  const [planUsage, setPlanUsage] = useState<PlanUsage | null>(null);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const {
    selectedFiles,
    setSelectedFiles,
    setCachedFileName,
    fileLabel,
    addFiles,
    removeSelectedFile,
    selectionError,
  } = useFileSelection();
  const { authUser, setAuthUser } = useAuthSession();
  const handleUserStateUpdate = useCallback(
    (userPayload: ExtractionUserPayload) => {
      if (typeof userPayload.isBlocked !== 'boolean') {
        return;
      }
      setIsUserBlocked(userPayload.isBlocked);
      setAuthUser((current) =>
        current ? { ...current, isBlocked: userPayload.isBlocked } : current,
      );
    },
    [setAuthUser],
  );

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const previewUrl = useFilePreview(selectedFiles);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const {
    bulkTotal,
    setBulkTotal,
    setBulkCompleted,
    bulkProgressPercent,
    bulkExtractedPercent,
    bulkGradedPercent,
    isBulkInProgress,
    resetBulkProgress,
    startBulkStream,
  } = useBulkExtraction({
    onUserStateUpdate: handleUserStateUpdate,
  });
  const documentTypes = useMemo(
    () => Object.entries(documentTypeMap) as [DocumentTypeKey, string][],
    [],
  );
  const [documentType, setDocumentType] = useState<DocumentTypeKey>('auto');

  // Class and Task modal states
  const [isClassTaskModalOpen, setIsClassTaskModalOpen] = useState(false);
  const [classTaskModalTab, setClassTaskModalTab] = useState<'select' | 'create'>('select');
  const {
    classes,
    tasksByClassId,
    expandedClassId,
    selectedClassId,
    selectedTaskId,
    isLoadingClasses,
    loadingTasksByClassId,
    error: classTreeError,
    toggleClass,
    selectTask,
    setExpandedClassId,
    setSelectedClassId,
    setSelectedTaskId,
    loadTasksForClass,
    refreshClasses,
  } = useClassTaskTree(authUser?.id);
  const {
    isUploading,
    error,
    clearResults,
    markManualStart,
    uploadFiles,
    handleFileChange: handleExtractionFileChange,
  } = useExtractionFlow({
    documentType,
    authUser,
    selectedClassId,
    selectedTaskId,
    onRequireAuth: () => {
      router.push('/auth');
    },
    setIsClassTaskModalOpen,
    startBulkStream,
    setBulkTotal,
    setBulkCompleted,
    setCachedFileName,
    setSelectedFiles,
    resetBulkProgress,
    setUploadCompleted,
    setUploadStarted,
    onExtractionComplete: ({ classId, taskId }) => {
      setPendingBulkRedirect({ classId, taskId });
    },
    onPlanUsageUpdate: (updatedPlanUsage) => {
      setPlanUsage(updatedPlanUsage);
    },
    onUserStateUpdate: handleUserStateUpdate,
  });
  const isUserAccountBlocked = Boolean(authUser?.isBlocked || isUserBlocked);
  const isPlanQuotaReached = Boolean(
    planUsage && planUsage.quota > 0 && planUsage.used >= planUsage.quota,
  );
  const isDropzoneDisabled = isPlanQuotaReached || isUserAccountBlocked || isRedirecting;
  const displayError = isUserAccountBlocked
    ? 'Extracões indisponíveis. Entre em contato com o suporte para entender como proceder.'
    : isPlanQuotaReached
      ? 'Você atingiu o limite mensal de uso do seu plano. Por favor, faça upgrade para continuar.'
      : selectionError || error;
  const envioProgress = uploadCompleted ? 100 : 0;
  const extracaoProgress = bulkExtractedPercent;
  const correcaoProgress = bulkGradedPercent;
  const relatorioProgress = bulkProgressPercent;
  const showStepIcons = uploadStarted;

  const handleSignOut = () => {
    void signOut();
    setAuthUser(null);
    sessionStorage.removeItem('userQuota');
    sessionStorage.removeItem('userUsage');
    setPlanUsage(null);
    setSelectedFiles([]);
    setCachedFileName(null);
    clearResults();
    resetBulkProgress();
    setSelectedClassId(null);
    setSelectedTaskId(null);
    setExpandedClassId(null);
    setIsClassTaskModalOpen(false);
    setIsTypeMenuOpen(false);
    setIsDragging(false);
    setUploadCompleted(false);
    setUploadStarted(false);
    setIsUserBlocked(false);
  };

  useEffect(() => {
    const stored = getStoredPlanUsage();
    if (stored) {
      setPlanUsage(stored);
    }
  }, []);

  useEffect(() => {
    if (!authUser) {
      setIsUserBlocked(false);
      return;
    }
    setIsUserBlocked(Boolean(authUser.isBlocked));
    const stored = getStoredPlanUsage();
    if (stored) {
      setPlanUsage(stored);
    }
  }, [authUser]);

  useEffect(() => {
    if (bulkProgressPercent < 100 || !pendingBulkRedirect) {
      return;
    }
    setRedirectTarget({
      classId: pendingBulkRedirect.classId,
      taskId: pendingBulkRedirect.taskId,
    });
    setIsRedirecting(true);
    setPendingBulkRedirect(null);
  }, [bulkProgressPercent, pendingBulkRedirect]);

  useEffect(() => {
    if (!redirectTarget || !isRedirecting) {
      return;
    }
    const timer = window.setTimeout(() => {
      router.push(`/classes/${redirectTarget.classId}/tasks/${redirectTarget.taskId}/extractions`);
      setRedirectTarget(null);
      setIsRedirecting(false);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [isRedirecting, redirectTarget, router]);

  const handleClassTaskModalConfirm = (data: {
    classId: string;
    taskId: string;
    className?: string;
    taskTitle?: string;
  }) => {
    setSelectedClassId(data.classId);
    setSelectedTaskId(data.taskId);
    setExpandedClassId(data.classId);
    void loadTasksForClass(data.classId);
    void refreshClasses();
    setIsClassTaskModalOpen(false);
    markManualStart();
    uploadFiles(selectedFiles, {
      classId: data.classId,
      taskId: data.taskId,
    });
  };

  useClickOutside(typeMenuRef, isTypeMenuOpen, () => setIsTypeMenuOpen(false));
  useClickOutside(userMenuRef, isUserMenuOpen, () => setIsUserMenuOpen(false));

  // Wait for explicit user action to start processing after login.

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    const nextFiles = addFiles(files);
    setSelectedFiles(nextFiles);
    handleExtractionFileChange();
    // Wait for explicit user action to start processing.
  };

  const handleDragEnter = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = async (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const nextFiles = addFiles(Array.from(files));
      setSelectedFiles(nextFiles);
      handleExtractionFileChange();
    }
  };

  return (
    <main className="teched-main relative min-h-screen bg-[var(--paper)] px-6 pb-12 pt-16 text-[var(--ink)]">
      <AppHeader
        authUser={authUser}
        isUserMenuOpen={isUserMenuOpen}
        setIsUserMenuOpen={setIsUserMenuOpen}
        onOpenAuth={() => {
          router.push('/auth');
        }}
        onSignOut={handleSignOut}
        onNavigateClasses={() => {
          window.location.href = '/classes';
        }}
        onNavigateCriteria={() => {
          window.location.href = '/grade-criteria';
        }}
        userMenuRef={userMenuRef}
      />
      <div className="mx-auto flex w-full max-w-none flex-col gap-8 px-0 pt-8">
        <header className="flex flex-col items-center gap-6 text-center">
          <div className="max-w-3xl">
            <h1 className="mt-4 text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
              Plataforma de correção inteligente de atividades escolares
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[var(--graphite)] sm:text-base">
              Organize suas turmas, envie lotes de atividades e receba relatórios prontos em
              minutos.
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[260px_1fr_280px]">
          <ClassTaskSidebar
            classes={classes}
            tasksByClassId={tasksByClassId}
            expandedClassId={expandedClassId}
            selectedClassId={selectedClassId}
            selectedTaskId={selectedTaskId}
            isLoadingClasses={isLoadingClasses}
            loadingTasksByClassId={loadingTasksByClassId}
            error={classTreeError}
            onToggleClass={toggleClass}
            onSelectTask={selectTask}
            onOpenModal={() => {
              setClassTaskModalTab('create');
              setIsClassTaskModalOpen(true);
            }}
            onNavigateClasses={() => {
              router.push('/classes');
            }}
            isAuthenticated={Boolean(authUser)}
            onRequireAuth={() => {
              router.push('/auth');
            }}
            showPlan={Boolean(authUser)}
            planUsage={planUsage}
            isUserBlocked={isUserAccountBlocked}
          />

          <div className="flex flex-col gap-6">
            {isRedirecting && (
              <div className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-4 text-sm text-[var(--graphite)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>Redirecionando para os resultados...</span>
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--chalk)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white opacity-80"
                  >
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/70 border-t-white" />
                    Redirecionando
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]">
                    Esteira de correção
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">
                    Linha de correção por etapas
                  </h2>
                  <p className="mt-1 text-sm text-[var(--graphite)]">
                    Acompanhe cada lote do envio até o relatório final.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="grid grid-cols-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--chalk)]">
                  {[
                    { label: '1. Envio', value: envioProgress },
                    { label: '2. Extração', value: extracaoProgress },
                    { label: '3. Correção', value: correcaoProgress },
                    { label: '4. Relatório', value: relatorioProgress },
                  ].map((step) => (
                    <span key={step.label} className="flex items-center justify-center gap-2">
                      {step.label}
                      {showStepIcons &&
                        (step.value >= 100 ? (
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 20 20"
                            className="h-3.5 w-3.5 text-[var(--chalk)]"
                            fill="currentColor"
                          >
                            <path d="M7.8 13.6 4.7 10.5l-1.1 1.1 4.2 4.2 8.1-8.1-1.1-1.1z" />
                          </svg>
                        ) : (
                          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--chalk)] border-t-transparent" />
                        ))}
                    </span>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {[
                    { key: 'envio', value: envioProgress },
                    { key: 'extracao', value: extracaoProgress },
                    { key: 'correcao', value: correcaoProgress },
                    { key: 'relatorio', value: relatorioProgress },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--wash)]"
                    >
                      <div
                        className="h-full rounded-full bg-[var(--chalk)] transition-all"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-4 gap-3 text-center">
                  {[
                    {
                      title: 'Recebido',
                      description: 'Arquivos prontos para processamento',
                      isActive: envioProgress > 0,
                    },
                    {
                      title: 'Extraído',
                      description: 'Texto limpo pronto para análise',
                      isActive: extracaoProgress > 0,
                    },
                    {
                      title: 'Corrigido',
                      description: 'Critérios de correção aplicados',
                      isActive: correcaoProgress > 0,
                    },
                    {
                      title: 'Relatório',
                      description: 'Relatório final disponível',
                      isActive: relatorioProgress > 0,
                    },
                  ].map((step) => (
                    <div
                      key={step.title}
                      className={`rounded-xl border px-3 py-3 text-xs ${
                        step.isActive
                          ? 'border-[var(--chalk)] bg-[var(--paper-soft)]'
                          : 'border-[var(--fog)] bg-[var(--paper)]'
                      }`}
                    >
                      <p className="font-semibold text-[var(--ink)]">{step.title}</p>
                      <p className="mt-1 text-[var(--graphite)]">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <FileDropzone
              isDragging={isDragging}
              fileLabel={fileLabel}
              selectedFiles={selectedFiles}
              bulkTotal={bulkTotal}
              bulkProgressPercent={bulkProgressPercent}
              documentType={documentType}
              documentTypes={documentTypes}
              isTypeMenuOpen={isTypeMenuOpen}
              setIsTypeMenuOpen={setIsTypeMenuOpen}
              typeMenuRef={typeMenuRef}
              isUploading={isUploading}
              isBulkInProgress={isBulkInProgress}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onFileChange={handleFileChange}
              onRemoveFile={(fileKey) => {
                const nextFiles = removeSelectedFile(fileKey);
                if (nextFiles.length === 0) {
                  setCachedFileName(null);
                  clearResults();
                  setUploadCompleted(false);
                  setUploadStarted(false);
                }
              }}
              getFileKey={getFileKey}
              onSelectDocumentType={setDocumentType}
              onStartReview={() => {
                if (selectedFiles.length === 0) {
                  return;
                }
                if (!selectedClassId || !selectedTaskId) {
                  setClassTaskModalTab('select');
                  setIsClassTaskModalOpen(true);
                  return;
                }
                markManualStart();
                uploadFiles(selectedFiles);
              }}
              isAuthenticated={Boolean(authUser)}
              onRequireAuth={() => {
                router.push('/auth');
              }}
              error={displayError}
              isDisabled={isDropzoneDisabled}
            />
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]">
                Resumo rapido
              </p>
              <div className="mt-4 space-y-3 text-sm text-[var(--ink)]">
                <div className="rounded-xl border border-[var(--fog)] bg-[var(--paper)] p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">
                    Turma selecionada
                  </p>
                  <p className="mt-1 font-semibold">
                    {selectedClassId
                      ? (classes.find((item) => item.id === selectedClassId)?.name ?? '—')
                      : 'Nenhuma selecionada'}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--fog)] bg-[var(--paper)] p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">
                    Tarefa selecionada
                  </p>
                  <p className="mt-1 font-semibold">
                    {selectedTaskId
                      ? (tasksByClassId[selectedClassId ?? '']?.find(
                          (task) => task.id === selectedTaskId,
                        )?.title ?? '—')
                      : 'Selecione uma tarefa'}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--fog)] bg-[var(--paper)] p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">
                    Tarefas corrigidas
                  </p>
                  <p className="mt-1 font-semibold">{authUser ? '128 tarefas' : '0 tarefas'}</p>
                </div>
                <div className="rounded-xl border border-[var(--chalk)] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]">
                    Tempo economizado
                  </p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-2xl font-semibold text-[var(--chalk)]">
                      {authUser ? '6h 20min' : '0h'}
                    </span>
                    <span className="pb-1 text-xs text-[var(--graphite)]">(estimado)</span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--graphite)]">
                    {authUser
                      ? 'Com a correção automatizada, você recuperou tempo para feedbacks individuais.'
                      : 'Crie sua primeira turma para ver quanto tempo você pode economizar.'}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>

      <ZoomModal
        isOpen={
          isZoomed &&
          selectedFiles.length === 1 &&
          Boolean(previewUrl) &&
          selectedFiles[0]?.type !== 'application/pdf'
        }
        previewUrl={previewUrl}
        fileName={selectedFiles[0]?.name || null}
        onClose={() => setIsZoomed(false)}
      />

      <ClassTaskModal
        isOpen={isClassTaskModalOpen}
        onClose={() => {
          setIsClassTaskModalOpen(false);
        }}
        onConfirm={handleClassTaskModalConfirm}
        userId={authUser?.id}
        preSelectedClassId={selectedClassId ?? undefined}
        preSelectedTaskId={selectedTaskId ?? undefined}
        initialTab={classTaskModalTab}
      />
    </main>
  );
}
