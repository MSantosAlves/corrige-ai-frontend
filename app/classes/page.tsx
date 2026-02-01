"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ClassItem = {
  id: string;
  name: string;
  user_id: string;
};

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("sessionUserId");
    if (!storedUserId) {
      setError("Faça login para visualizar suas turmas.");
      return;
    }
    setUserId(storedUserId);
    const storedUserName = localStorage.getItem("sessionUserName");
    setUserName(storedUserName);
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        setError("");
        const token = localStorage.getItem("sessionToken");
        const response = await fetch(
          `http://localhost:3001/classes?user_id=${encodeURIComponent(userId)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
          }
        );
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Falha ao carregar turmas.");
        }
        const payload = (await response.json()) as { items?: ClassItem[] };
        const classes = payload.items ?? [];
        setClasses(classes);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "Erro inesperado ao carregar turmas.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, [userId]);

  const handleCreateClass = async () => {
    if (!userId || !newClassName.trim()) {
      return;
    }
    try {
      setIsSubmitting(true);
      setError("");
      const token = localStorage.getItem("sessionToken");
      const response = await fetch("http://localhost:3001/classes", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "content-type": "application/json"
        },
        body: JSON.stringify({ name: newClassName.trim(), user_id: userId })
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Falha ao criar turma.");
      }
      const created = (await response.json()) as ClassItem;
      setClasses((prev) => {
        const updated = [created, ...prev];
        return updated;
      });
      setNewClassName("");
      setIsModalOpen(false);
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Erro inesperado ao criar turma.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white px-6 py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <Link
            href="/"
            className="mb-3 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Voltar
          </Link>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Turmas
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">
            {userName ? `Turmas de ${userName}` : "Minhas turmas"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Gerencie as turmas cadastradas para seus alunos e atividades.
          </p>
        </header>

        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          {isLoading ? (
            <p className="text-sm text-gray-500">Carregando turmas...</p>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-start gap-4">
              <p className="text-sm text-gray-600">Não há turmas cadastradas.</p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Criar turma
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {classes.length} turma(s) cadastrada(s)
                </p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Criar turma
                </button>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {classes.map((classItem) => (
                  <li
                    key={classItem.id}
                    className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 transition hover:border-blue-200 hover:bg-blue-100"
                  >
                    <Link
                      href={`/classes/${classItem.id}/tasks`}
                      className="block w-full text-left text-sm font-semibold text-gray-800"
                    >
                      {classItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Criar nova turma
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Informe o nome da turma para continuar.
            </p>
            <input
              type="text"
              value={newClassName}
              onChange={(event) => setNewClassName(event.target.value)}
              placeholder="Ex: 3º Ano B"
              className="mt-4 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400"
            />
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting || !newClassName.trim()}
                onClick={handleCreateClass}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {isSubmitting ? "Criando..." : "Criar turma"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
