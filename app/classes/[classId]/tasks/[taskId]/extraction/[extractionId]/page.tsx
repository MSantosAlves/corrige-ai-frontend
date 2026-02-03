'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getExtraction } from '../../../../../../services/extractions-service';

type TaskExtraction = {
  id: string;
  task_id: string;
  ocr_extraction_result: Record<string, unknown>;
  analysis_result: string;
  filename: string;
  created_at: string;
  updated_at: string;
};

export default function ExtractionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const extractionId = params?.extractionId as string;

  const [extraction, setExtraction] = useState<TaskExtraction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!extractionId) {
      return;
    }

    const fetchExtraction = async () => {
      try {
        setIsLoading(true);
        setError('');
        const data = (await getExtraction(extractionId)) as TaskExtraction;
        setExtraction(data);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : 'Erro inesperado ao carregar análise.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExtraction();
  }, [extractionId]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white px-6 py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Voltar
          </button>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Detalhes da Análise
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">
            {extraction?.filename || 'Carregando...'}
          </h1>
          {extraction && (
            <p className="mt-2 text-sm text-gray-600">
              Realizada em {formatDate(extraction.created_at)}
            </p>
          )}
        </header>

        {isLoading ? (
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Carregando análise...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : extraction ? (
          <div className="space-y-6">
            {/* Texto Extraído */}
            <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Texto Extraído</h2>
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                <div className="max-h-96 overflow-y-auto rounded-md bg-white p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {extraction.ocr_extraction_result.text
                      ? String(extraction.ocr_extraction_result.text)
                      : 'Nenhum texto foi extraído'}
                  </p>
                </div>
              </div>
            </section>

            {/* Resultado da Análise */}
            <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resultado da Análise</h2>
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                <div className="max-h-96 overflow-y-auto rounded-md bg-white p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {extraction.analysis_result || 'Nenhuma análise disponível'}
                  </p>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
