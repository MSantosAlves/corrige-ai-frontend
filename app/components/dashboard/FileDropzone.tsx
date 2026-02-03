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
}: FileDropzoneProps) => (
  <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/50 sm:p-8">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Área de revisão</h2>
        <p className="mt-2 text-sm text-gray-600">
          Arraste e solte fotos ou documentos de texto para análise.
        </p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
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

    <label
      htmlFor="file-upload"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center text-sm transition ${
        isDragging
          ? 'border-blue-500 bg-blue-200 text-blue-800'
          : 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100'
      }`}
    >
      <span className="font-semibold">{fileLabel}</span>
      <span className="mt-1 text-xs text-blue-600">
        ou clique para selecionar do seu computador
      </span>
      <input
        id="file-upload"
        name="file-upload"
        type="file"
        accept=".pdf,.png,.jpeg,.jpg,.jpepg"
        multiple
        className="sr-only"
        onChange={onFileChange}
      />
    </label>

    {selectedFiles.length > 0 && (
      <div className="mt-4 w-full">
        <div className="flex flex-wrap gap-2">
          {selectedFiles.map((file) => {
            const fileKey = getFileKey(file);
            return (
              <span
                key={fileKey}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs text-gray-700"
              >
                <span className="max-w-[220px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveFile(fileKey)}
                  className="text-gray-400 transition hover:text-red-500"
                  aria-label={`Remover ${file.name}`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
        {bulkTotal > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Progresso da extração</span>
              <span>{bulkProgressPercent}%</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${bulkProgressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    )}

    <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-xs text-gray-500">
        Até 20MB por arquivo. Suporte para PDF, PNG, JPG e JPEG.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          <div className="relative" ref={typeMenuRef}>
            <button
              type="button"
              onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-blue-300"
            >
              {documentType
                ? documentTypes.find(([key]) => key === documentType)?.[1]
                : 'Selecionar tipo de documento'}
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="h-3.5 w-3.5 text-blue-500"
                fill="currentColor"
              >
                <path d="M5.5 7.5 10 12l4.5-4.5" />
              </svg>
            </button>
            {isTypeMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-64 max-h-56 overflow-y-auto rounded-xl border border-blue-100 bg-white p-2 shadow-lg">
                {documentTypes.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      onSelectDocumentType(key);
                      setIsTypeMenuOpen(false);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:bg-blue-50"
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
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isUploading || isBulkInProgress ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
              Processando...
            </span>
          ) : (
            'Iniciar revisao'
          )}
        </button>
      </div>
    </div>
  </div>
);
