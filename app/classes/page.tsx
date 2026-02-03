'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createClass, listClasses } from '../services/classes-service';

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateClass = async () => {
    const userId = localStorage.getItem('sessionUserId');
    if (!userId || !newClassName.trim()) {
      return;
    }
    try {
      setIsCreating(true);
      setError('');
      const created = (await createClass({
        name: newClassName.trim(),
        userId,
      })) as ClassItem;
      setClasses((prev) => [created, ...prev]);
      setNewClassName('');
      setIsCreateModalOpen(false);
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : 'Erro inesperado ao criar turma.';
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

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
          <div className="mb-4 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Criar turma
            </button>
          </div>
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

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">Criar nova turma</h2>
            <p className="mt-1 text-sm text-gray-600">
              Informe o nome da turma para continuar.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <input
                type="text"
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
                placeholder="Nome da turma"
                className="w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400"
              />
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isCreating || !newClassName.trim()}
                onClick={handleCreateClass}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isCreating ? 'Criando...' : 'Criar turma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
