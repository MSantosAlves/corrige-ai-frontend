'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getExtraction } from '../../../../../../services/extractions-service';
import { AppHeader } from '../../../../../../components/layout/AppHeader';
import { useAuthSession } from '../../../../../../hooks/use-auth-session';
import { useClickOutside } from '../../../../../../hooks/use-click-outside';
import { signOut } from '../../../../../../services/auth-client';

type TaskExtraction = {
  id: string;
  task_id: string;
  ocr_extraction_result?: Record<string, unknown> | null;
  status?: string;
  analysis_result: string;
  filename: string;
  created_at: string;
  updated_at: string;
};

export default function ExtractionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const extractionId = params?.extractionId as string;
  const { authUser, setAuthUser } = useAuthSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const [extraction, setExtraction] = useState<TaskExtraction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Relatorio');

  useClickOutside(userMenuRef, isUserMenuOpen, () => setIsUserMenuOpen(false));

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

  const extractedText = useMemo(() => {
    if (!extraction?.ocr_extraction_result?.text) {
      return '';
    }
    return String(extraction.ocr_extraction_result.text);
  }, [extraction]);

  const wordCount = useMemo(() => {
    if (!extractedText) {
      return 0;
    }
    return extractedText.trim().split(/\s+/).length;
  }, [extractedText]);

  const statusBadge = useMemo(() => {
    const isBlockedByOcr = extraction?.ocr_extraction_result?.blocked_by_ocr === true;
    const isReviewed = extraction?.status === 'reviwed';
    const label = isBlockedByOcr ? 'BLOQUEADO' : isReviewed ? 'REVISADO' : 'AGUARDANDO REVISÃO';
    const tone = isBlockedByOcr
      ? 'bg-[var(--paper-strong)] text-[var(--rubric)]'
      : isReviewed
        ? 'bg-[var(--paper-strong)] text-[var(--chalk)]'
        : 'bg-[var(--paper-strong)] text-[var(--amber)]';
    return { label, tone };
  }, [extraction]);

  return (
    <main className="teched-main relative min-h-screen bg-[var(--paper)] px-0 pb-12 pt-8 text-[var(--ink)]">
      <AppHeader
        authUser={authUser}
        isUserMenuOpen={isUserMenuOpen}
        setIsUserMenuOpen={setIsUserMenuOpen}
        onOpenAuth={() => {
          router.push('/auth');
        }}
        onSignOut={() => {
          void signOut();
          setAuthUser(null);
        }}
        onNavigateClasses={() => {
          router.push('/classes');
        }}
        onNavigateCriteria={() => {
          router.push('/grade-criteria');
        }}
        userMenuRef={userMenuRef}
      />

      <div className="mx-auto flex w-full max-w-none flex-col gap-6 px-0 pt-20">
        <section className="px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm font-semibold text-[var(--graphite)] hover:text-[var(--ink)]"
              >
                ←
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]">
                  Detalhes da análise
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-[var(--ink)]">
                  {extraction?.filename || 'Carregando...'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${statusBadge.tone}`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {statusBadge.label}
              </span>
            </div>
          </div>
        </section>

        {isLoading ? (
          <section className="px-6">
            <div className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-6">
              <p className="text-sm text-[var(--graphite)]">Carregando análise...</p>
            </div>
          </section>
        ) : error ? (
          <section className="px-6">
            <div className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-6">
              <p className="text-sm text-[var(--rubric)]">{error}</p>
            </div>
          </section>
        ) : extraction ? (
          <section className="grid gap-6 px-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-6">
              <h2 className="text-lg font-semibold text-[var(--ink)]">Texto extraído</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--graphite)]">
                {extraction?.created_at && (
                  <span className="rounded-full border border-[var(--fog)] bg-white px-3 py-1 uppercase tracking-[0.2em]">
                    {formatDate(extraction.created_at)}
                  </span>
                )}
                <span className="rounded-full border border-[var(--fog)] bg-white px-3 py-1 uppercase tracking-[0.2em]">
                  {wordCount} palavras
                </span>
              </div>
              <div className="mt-4 max-h-[70vh] overflow-y-auto rounded-xl border border-[var(--fog)] bg-white p-4">
                <p className="text-sm text-[var(--ink)] whitespace-pre-wrap break-words">
                  {extractedText || 'Nenhum texto foi extraído'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--fog)] bg-[var(--paper-soft)] p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--ink)]">Relatório final</h2>
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--graphite)]">
                  5/10 (50%)
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-b border-[var(--fog)] pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
                {['Relatorio', 'Gramatica', 'IA', 'Plagio', 'Comentarios'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-3 py-1 transition ${
                      activeTab === tab
                        ? 'bg-[var(--paper-strong)] text-[var(--chalk)]'
                        : 'text-[var(--graphite)] hover:text-[var(--chalk)]'
                    }`}
                  >
                    {tab === 'Relatorio' ? 'Análise' : tab}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-4 text-sm text-[var(--ink)]">
                {activeTab === 'Relatorio' && (
                  <div className="rounded-xl border border-[var(--fog)] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
                      Resultado da análise
                    </p>
                    <p className="mt-2 whitespace-pre-wrap">
                      {extraction.analysis_result || 'Nenhuma análise disponível'}
                    </p>
                  </div>
                )}
                {activeTab === 'Gramatica' && (
                  <div className="rounded-xl border border-[var(--fog)] bg-white p-4">
                    <p className="font-semibold">Relatório de gramática</p>
                    <p className="mt-2 text-[var(--graphite)]">
                      Sugerimos revisar concordância verbal e pontuação em parágrafos longos.
                    </p>
                  </div>
                )}
                {activeTab === 'IA' && (
                  <div className="rounded-xl border border-[var(--fog)] bg-white p-4">
                    <p className="font-semibold">Detecção de IA</p>
                    <p className="mt-2 text-[var(--graphite)]">
                      Nenhum padrão forte de geração automática foi identificado.
                    </p>
                  </div>
                )}
                {activeTab === 'Plagio' && (
                  <div className="rounded-xl border border-[var(--fog)] bg-white p-4">
                    <p className="font-semibold">Plágio</p>
                    <p className="mt-2 text-[var(--graphite)]">
                      Similaridade baixa com materiais comparados (2%).
                    </p>
                  </div>
                )}
                {activeTab === 'Comentarios' && (
                  <div className="rounded-xl border border-[var(--fog)] bg-white p-4">
                    <p className="font-semibold">Comentários</p>
                    <p className="mt-2 text-[var(--graphite)]">
                      Marque trechos específicos para feedback individualizado ao aluno.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
