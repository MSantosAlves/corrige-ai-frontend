'use client';

import { useMemo, useRef, useState } from 'react';
import ClassTaskModal from './components/ClassTaskModal';
import { AuthMenu } from './components/dashboard/AuthMenu';
import { FileDropzone } from './components/dashboard/FileDropzone';
import { ResultsPanel } from './components/dashboard/ResultsPanel';
import { ZoomModal } from './components/dashboard/ZoomModal';
import { getFileKey } from './helpers/file-helpers';
import { useAuthSession } from './hooks/use-auth-session';
import { useAuthFlow } from './hooks/use-auth-flow';
import { useBulkExtraction } from './hooks/use-bulk-extraction';
import { useClickOutside } from './hooks/use-click-outside';
import { useExtractionFlow } from './hooks/use-extraction-flow';
import { useFilePreview } from './hooks/use-file-preview';
import { useFileSelection } from './hooks/use-file-selection';

const documentTypeMap = {
  pdf_native: 'PDF Nativo',
  printed: 'Documento impresso',
  handwritten: 'Texto escrito à mão',
  auto: 'Detectar automaticamente',
} as const;

type DocumentTypeKey = keyof typeof documentTypeMap;

export default function Home() {
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
  const {
    authMode,
    setAuthMode,
    authName,
    setAuthName,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authError,
    authLoading,
    handleAuth,
  } = useAuthFlow(setAuthUser);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const previewUrl = useFilePreview(selectedFiles);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoginMenuOpen, setIsLoginMenuOpen] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement | null>(null);
  const loginMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const {
    bulkTotal,
    setBulkTotal,
    setBulkCompleted,
    bulkProgressPercent,
    isBulkInProgress,
    resetBulkProgress,
    startBulkStream,
  } = useBulkExtraction();
  const documentTypes = useMemo(
    () => Object.entries(documentTypeMap) as [DocumentTypeKey, string][],
    [],
  );
  const [documentType, setDocumentType] = useState<DocumentTypeKey>('auto');

  // Class and Task modal states
  const [isClassTaskModalOpen, setIsClassTaskModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const {
    isUploading,
    resultText,
    analysisText,
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
    setIsLoginMenuOpen,
    setIsClassTaskModalOpen,
    startBulkStream,
    setBulkTotal,
    setBulkCompleted,
    setCachedFileName,
    setSelectedFiles,
    resetBulkProgress,
  });
  const displayError = selectionError || error;

  const handleSignOut = () => {
    setAuthUser(null);
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('sessionUserName');
    localStorage.removeItem('sessionUserId');
  };

  const handleClassTaskModalConfirm = (data: {
    classId: string;
    taskId: string;
    className?: string;
    taskTitle?: string;
  }) => {
    setSelectedClassId(data.classId);
    setSelectedTaskId(data.taskId);
    setIsClassTaskModalOpen(false);
    markManualStart();
    uploadFiles(selectedFiles, {
      classId: data.classId,
      taskId: data.taskId,
    });
  };

  useClickOutside(typeMenuRef, isTypeMenuOpen, () => setIsTypeMenuOpen(false));
  useClickOutside(loginMenuRef, isLoginMenuOpen, () => setIsLoginMenuOpen(false));

  useClickOutside(userMenuRef, isUserMenuOpen, () => setIsUserMenuOpen(false));

  // Wait for explicit user action to start processing after login.

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
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
    <main className="relative min-h-screen bg-gradient-to-b from-blue-50 via-white to-white px-6 py-12">
      <AuthMenu
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
        authLoading={authLoading}
        authError={authError}
        onSubmitAuth={async (mode) => {
          const ok = await handleAuth(mode);
          if (ok) {
            setIsLoginMenuOpen(false);
          }
        }}
        onSignOut={handleSignOut}
        onNavigateClasses={() => {
          window.location.href = '/classes';
        }}
        onNavigateCriteria={() => {
          window.location.href = '/grade-criteria';
        }}
        loginMenuRef={loginMenuRef}
        userMenuRef={userMenuRef}
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center">
        <header className="flex w-full flex-col items-center text-center">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
            Corrige Aí
          </span>
          <h1 className="mt-4 text-3xl font-semibold text-gray-900 sm:text-4xl">
            Revisão inteligente para documentos que precisam de atenção
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
            Arraste seus arquivos para uma área segura e deixe a IA apontar o que precisa de
            correção, padrão ou validação.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {['Correção guiada', 'Resumo instantâneo', 'Uploads seguros'].map((label) => (
              <span
                key={label}
                className="rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-medium text-blue-700 shadow-sm"
              >
                {label}
              </span>
            ))}
          </div>
        </header>

        <section className="mt-10 flex w-full flex-col gap-6">
          <aside className="rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                Como funciona
              </h3>
              <ul className="mt-4 space-y-4 text-sm text-gray-600">
                {[
                  'Envie documentos em lote para analise automatizada.',
                  'Receba sugestoes de correcao e padronizacao.',
                  'Exportacao rapida em relatorios claros.',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
              <strong className="font-semibold">Dica:</strong> combine arquivos de multiplas fontes
              e deixe o Corrige Ai indicar inconsistencias automaticamente.
            </div>
          </aside>

          <div className="w-full">
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
                  resetBulkProgress();
                }
              }}
              getFileKey={getFileKey}
              onSelectDocumentType={setDocumentType}
              onStartReview={() => {
                if (selectedFiles.length === 0) {
                  return;
                }
                if (!selectedClassId || !selectedTaskId) {
                  setIsClassTaskModalOpen(true);
                  return;
                }
                markManualStart();
                uploadFiles(selectedFiles);
              }}
            />

            <ResultsPanel
              show={
                Boolean(authUser) &&
                selectedFiles.length > 0 &&
                Boolean(resultText || analysisText || displayError)
              }
              selectedFiles={selectedFiles}
              previewUrl={previewUrl}
              onZoom={() => setIsZoomed(true)}
              resultText={resultText}
              analysisText={analysisText}
              error={displayError}
            />
          </div>
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
      />
    </main>
  );
}
