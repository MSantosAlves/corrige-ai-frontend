'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { listClasses } from '../services/classes-service';

type ClassItem = {
  id: string;
  name: string;
  user_id: string;
};

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('sessionUserId');
    if (!userId) {
      return;
    }

    const loadClasses = async () => {
      try {
        setIsLoading(true);
        setError('');
        const payload = (await listClasses(userId)) as { items?: ClassItem[] };
        setClasses(payload.items ?? []);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : 'Erro inesperado ao carregar turmas.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadClasses();
  }, []);

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
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Turmas</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">Minhas turmas</h1>
          <p className="mt-2 text-sm text-gray-600">
            Selecione uma turma para ver ou revisar suas tarefas.
          </p>
        </header>

        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          {isLoading ? (
            <p className="text-sm text-gray-500">Carregando turmas...</p>
          ) : classes.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhuma turma cadastrada.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {classes.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 p-4"
                >
                  <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => router.push(`/classes/${item.id}/tasks`)}
                    className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Ver tarefas
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        </section>
      </div>
    </main>
  );
}
