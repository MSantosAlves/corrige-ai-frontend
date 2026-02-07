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
    <div className="mt-6 rounded-2xl border border-[var(--fog)] bg-[var(--paper-strong)] p-4 text-sm text-[var(--ink)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
          Comparacao lado a lado
        </h3>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--fog)] bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--graphite)]">
              Original
            </p>
            {selectedFiles.length === 1 &&
              previewUrl &&
              selectedFiles[0]?.type !== 'application/pdf' && (
                <button
                  type="button"
                  onClick={onZoom}
                  className="inline-flex items-center justify-center rounded-full border border-[var(--fog)] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--chalk)] transition hover:border-[var(--chalk)]"
                >
                  Ver zoom
                </button>
              )}
          </div>
          <div className="mt-3 flex min-h-[400px] items-center justify-center rounded-md bg-[var(--paper)] p-3">
            {previewUrl ? (
              selectedFiles.length === 1 && selectedFiles[0]?.type === 'application/pdf' ? (
                <iframe
                  title="preview"
                  src={previewUrl}
                  className="h-96 w-full rounded-md border border-[var(--fog)] bg-white"
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

        <div className="rounded-xl border border-[var(--fog)] bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--graphite)]">
            Texto extraido
          </p>
          <div className="mt-3 min-h-[400px] max-h-[400px] overflow-y-auto rounded-md bg-[var(--paper)] p-3 text-sm text-[var(--ink)]">
            {error ? (
              <span className="text-[var(--rubric)]">{error}</span>
            ) : resultText ? (
              <p className="whitespace-pre-line">{resultText}</p>
            ) : (
              <span className="text-xs text-[var(--graphite)]">Aguarde a extracao do texto.</span>
            )}
          </div>
        </div>
      </div>

      {analysisText && (
        <div className="mt-4 rounded-xl border border-[var(--fog)] bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--graphite)]">
            Analise do texto
          </p>
          <p className="mt-3 whitespace-pre-line text-sm text-[var(--ink)]">{analysisText}</p>
        </div>
      )}
    </div>
  );
};
