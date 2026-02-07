'use client';

type DocumentTypeKey = 'pdf_native' | 'printed' | 'handwritten' | 'auto';

type FileDropzoneProps = {
  isDragging: boolean;
  fileLabel: string;
  selectedFiles: File[];
  bulkTotal: number;
  bulkProgressPercent: number;
  documentType: DocumentTypeKey;
  documentTypes: Array<[DocumentTypeKey, string]>;
  isTypeMenuOpen: boolean;
  setIsTypeMenuOpen: (value: boolean) => void;
  typeMenuRef: React.RefObject<HTMLDivElement | null>;
  isUploading: boolean;
  isBulkInProgress: boolean;
  onSelectDocumentType: (value: DocumentTypeKey) => void;
  onDragEnter: (event: React.DragEvent<HTMLLabelElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLLabelElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLLabelElement>) => void;
  onDrop: (event: React.DragEvent<HTMLLabelElement>) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (fileKey: string) => void;
  getFileKey: (file: File) => string;
  onStartReview: () => void;
  isAuthenticated: boolean;
  onRequireAuth: () => void;
};

export const FileDropzone = ({
  isDragging,
  fileLabel,
  selectedFiles,
  bulkTotal,
  bulkProgressPercent,
  documentType,
  documentTypes,
  isTypeMenuOpen,
  setIsTypeMenuOpen,
  typeMenuRef,
  isUploading,
  isBulkInProgress,
  onSelectDocumentType,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileChange,
  onRemoveFile,
  getFileKey,
  onStartReview,
  isAuthenticated,
  onRequireAuth,
}: FileDropzoneProps) => (
  <div className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-6 sm:p-8">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-[var(--ink)]">Bandeja de envio</h2>
        <p className="mt-2 text-sm text-[var(--graphite)]">
        Envie os arquivos da turma e o sistema organiza a correção automaticamente.
        </p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--paper-strong)] text-[var(--chalk)]">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5-5 5 5" />
          <path d="M12 5v12" />
        </svg>
      </div>
    </div>

    <div className="relative mt-6">
      <div className="pointer-events-none absolute -top-2 left-3 right-3 h-full rounded-2xl border border-[var(--fog)] bg-[var(--paper-strong)]" />
      <div className="pointer-events-none absolute -top-1 left-2 right-2 h-full rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)]" />
      <label
      htmlFor="file-upload"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={(event) => {
        if (!isAuthenticated) {
          event.preventDefault();
          onRequireAuth();
        }
      }}
      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center text-sm transition ${
        isDragging
          ? 'border-[var(--chalk)] bg-[var(--paper-strong)] text-[var(--chalk-strong)]'
            : 'border-[var(--fog)] bg-[var(--paper)] text-[var(--graphite)] hover:border-[var(--chalk)] hover:bg-[var(--paper-soft)]'
        }`}
      >
        <span className="text-sm font-semibold text-[var(--ink)]">{fileLabel}</span>
        <span className="mt-1 text-xs text-[var(--graphite)]">
          ou clique para selecionar do computador
        </span>
      <input
        id="file-upload"
        name="file-upload"
        type="file"
        accept=".pdf,.png,.jpeg,.jpg"
        multiple
        className="sr-only"
        onChange={onFileChange}
      />
      </label>
    </div>

    {selectedFiles.length > 0 && (
      <div className="mt-4 w-full">
        <div className="flex flex-wrap gap-2">
          {selectedFiles.map((file) => {
            const fileKey = getFileKey(file);
              return (
                <span
                  key={fileKey}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--fog)] bg-white px-3 py-1 text-xs text-[var(--ink)]"
                >
                  <span className="max-w-[220px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveFile(fileKey)}
                    className="text-[var(--graphite)] transition hover:text-[var(--rubric)]"
                    aria-label={`Remover ${file.name}`}
                  >
                    ×
                  </button>
                </span>
            );
          })}
        </div>
      </div>
    )}

    <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-xs text-[var(--graphite)]">
        Até 20 MB por arquivo. Formatos aceitos: PDF, PNG, JPG ou JPEG.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--graphite)]">
          <div className="relative" ref={typeMenuRef}>
            <button
              type="button"
              onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--fog)] bg-white px-4 py-2 text-xs font-semibold text-[var(--ink)] shadow-sm transition hover:border-[var(--chalk)]"
            >
              {documentType
                ? documentTypes.find(([key]) => key === documentType)?.[1]
                : 'Selecionar tipo de documento'}
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-3.5 w-3.5 text-[var(--chalk)]"
                fill="currentColor"
              >
                <path d="M5.5 7.5 10 12l4.5-4.5" />
              </svg>
            </button>
            {isTypeMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-64 max-h-56 overflow-y-auto rounded-xl border border-[var(--fog)] bg-white p-2 shadow-lg">
                {documentTypes.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onSelectDocumentType(key);
                      setIsTypeMenuOpen(false);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--ink)] transition hover:bg-[var(--wash)]"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onStartReview}
          disabled={selectedFiles.length === 0 || !documentType || isUploading || isBulkInProgress}
          className="inline-flex items-center justify-center rounded-full bg-[var(--chalk)] px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--chalk-strong)] disabled:cursor-not-allowed disabled:bg-[var(--fog)]"
        >
          {isUploading || isBulkInProgress ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
              Processando...
            </span>
          ) : (
            'Iniciar correção'
          )}
        </button>
      </div>
    </div>
  </div>
);
