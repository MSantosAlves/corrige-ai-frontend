'use client';

type ResultsPanelProps = {
  show: boolean;
  selectedFiles: File[];
  previewUrl: string | null;
  onZoom: () => void;
  resultText: string;
  analysisText: string;
  error: string;
};

export const ResultsPanel = ({
  show,
  selectedFiles,
  previewUrl,
  onZoom,
  resultText,
  analysisText,
  error,
}: ResultsPanelProps) => {
  if (!show) {
    return null;
  }

  return (
    <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-gray-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Comparacao lado a lado
        </h3>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-blue-100 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Original</p>
            {selectedFiles.length === 1 &&
              previewUrl &&
              selectedFiles[0]?.type !== 'application/pdf' && (
                <button
                  type="button"
                  onClick={onZoom}
                  className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700 transition hover:border-blue-300"
                >
                  Ver zoom
                </button>
              )}
          </div>
          <div className="mt-3 flex min-h-[400px] items-center justify-center rounded-md bg-gray-50 p-3">
            {previewUrl ? (
              selectedFiles.length === 1 && selectedFiles[0]?.type === 'application/pdf' ? (
                <iframe
                  title="preview"
                  src={previewUrl}
                  className="h-96 w-full rounded-md border border-gray-200 bg-white"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={selectedFiles[0]?.name || 'Arquivo enviado'}
                  className="max-h-96 w-auto rounded-md object-contain"
                />
              )
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-blue-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Texto extraido
          </p>
          <div className="mt-3 min-h-[400px] max-h-[400px] overflow-y-auto rounded-md bg-gray-50 p-3 text-sm text-gray-700">
            {error ? (
              <span className="text-red-600">{error}</span>
            ) : resultText ? (
              <p className="whitespace-pre-line">{resultText}</p>
            ) : (
              <span className="text-xs text-gray-400">Aguarde a extracao do texto.</span>
            )}
          </div>
        </div>
      </div>

      {analysisText && (
        <div className="mt-4 rounded-lg border border-blue-100 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Analise do texto
          </p>
          <p className="mt-3 whitespace-pre-line text-sm text-gray-700">{analysisText}</p>
        </div>
      )}
    </div>
  );
};
