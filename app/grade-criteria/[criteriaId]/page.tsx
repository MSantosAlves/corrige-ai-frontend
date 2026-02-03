'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  createCriteria,
  getCriteriaById,
  type GradeCriteria,
} from '../../services/criteria-service';

export default function GradeCriteriaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const criteriaId = params?.criteriaId as string;
  const [criteria, setCriteria] = useState<GradeCriteria | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copyError, setCopyError] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!criteriaId) {
      return;
    }

    const loadCriteria = async () => {
      try {
        setIsLoading(true);
        setError('');
        const payload = await getCriteriaById(criteriaId);
        setCriteria(payload);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : 'Erro ao carregar critério.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCriteria();
  }, [criteriaId]);

  const handleCopyCriteria = async () => {
    if (!criteria) {
      return;
    }
    try {
      setIsCopying(true);
      setCopyError('');
      await createCriteria({
        name: `${criteria.name} [Cópia]`,
        description: criteria.description,
        classification: criteria.classification,
        isPublic: false,
        maxScore: criteria.max_score,
        items: criteria.items,
        tags: criteria.tags,
      });
      setIsCopied(true);
    } catch (copyErr) {
      const message =
        copyErr instanceof Error ? copyErr.message : 'Erro ao copiar critério.';
      setCopyError(message);
    } finally {
      setIsCopying(false);
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
            Critério de avaliação
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">
            {criteria?.name || 'Detalhes do critério'}
          </h1>
          {criteria?.classification && (
            <p className="mt-2 text-sm text-gray-600">{criteria.classification}</p>
          )}
          {criteria && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {isCopied ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Copiado com sucesso
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleCopyCriteria}
                  disabled={isCopying}
                  className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isCopying ? 'Copiando...' : 'Copiar critério'}
                </button>
              )}
              {copyError && <span className="text-xs text-red-500">{copyError}</span>}
            </div>
          )}
        </header>

        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          {isLoading ? (
            <p className="text-sm text-gray-500">Carregando critério...</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : criteria ? (
            <div className="flex flex-col gap-4">
              {criteria.description && (
                <p className="text-sm text-gray-700">{criteria.description}</p>
              )}
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Itens e pesos
                </p>
                <ul className="mt-3 flex flex-col gap-3">
                  {criteria.items.map((item, index) => (
                    <li key={`${item.label}-${index}`} className="rounded-lg bg-white p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                        <span className="text-xs font-semibold text-blue-600">
                          Peso {item.weight}
                        </span>
                      </div>
                      {item.description && (
                        <p className="mt-2 text-xs text-gray-600">{item.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
                  Pontuação máxima: {criteria.max_score}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                  {criteria.is_public ? 'Público' : 'Privado'}
                </span>
              </div>
            </div>
          ) : null}
        </section>
      </div>

    </main>
  );
}
