'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { CreateCriteriaModal } from '../components/criteria/CreateCriteriaModal';
import { createCriteria, listCriteria, type GradeCriteria } from '../services/criteria-service';

type FilterMode = 'mine' | 'all';

export default function GradeCriteriaPage() {
  const router = useRouter();
  const [items, setItems] = useState<GradeCriteria[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('mine');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem('sessionUserId'));
  }, []);

  useEffect(() => {
    const loadCriteria = async () => {
      try {
        setIsLoading(true);
        setError('');
        const includePublic = filterMode === 'all';
        const payload = await listCriteria({ includePublic });
        const filtered =
          filterMode === 'mine' && userId
            ? (payload.items ?? []).filter((item) => item.user_id === userId)
            : payload.items ?? [];
        setItems(filtered);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : 'Erro ao carregar critérios.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCriteria();
  }, [filterMode, userId]);

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
            Critérios de avaliação
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">Critérios</h1>
          <p className="mt-2 text-sm text-gray-600">
            Explore e selecione critérios para suas avaliações.
          </p>
        </header>

        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">Exibir</label>
              <select
                value={filterMode}
                onChange={(event) => setFilterMode(event.target.value as FilterMode)}
                className="ml-3 rounded-full border border-blue-200 px-3 py-1.5 text-xs font-semibold text-gray-700"
              >
                <option value="mine">Meus critérios</option>
                <option value="all">Todos</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Criar critério
            </button>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <p className="text-sm text-gray-500">Carregando critérios...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-600">Nenhum critério encontrado.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {items.map((criteria) => (
                  <li
                    key={criteria.id}
                    className="flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{criteria.name}</p>
                        <p className="text-xs text-gray-500">{criteria.classification}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(`/grade-criteria/${criteria.id}`)}
                        className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        Ver detalhes
                      </button>
                    </div>
                    {criteria.description && (
                      <p className="text-xs text-gray-600">{criteria.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
          </div>
        </section>
      </div>

      <CreateCriteriaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (payload) => {
          const created = await createCriteria(payload);
          setItems((prev) => [created, ...prev]);
        }}
      />
    </main>
  );
}
