'use client';

import type { CriteriaFormModel } from '../../hooks/use-criteria-form';
import { classificationOptions } from '../../hooks/use-criteria-form';

type CriteriaFormProps = {
  form: CriteriaFormModel;
  isSubmitting: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: () => void;
};

export const CriteriaForm = ({
  form,
  isSubmitting,
  error,
  onCancel,
  onSubmit,
}: CriteriaFormProps) => {
  return (
    <div className="mt-6 grid gap-6">
      <div className="grid gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
            Nome
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(event) => form.setName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--fog)] bg-white px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
            Descrição
          </label>
          <textarea
            value={form.description}
            onChange={(event) => form.setDescription(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-[var(--fog)] bg-white px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
              Classificação
            </label>
            <select
              value={form.classification}
              onChange={(event) => form.setClassification(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--fog)] bg-white px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
            >
              {classificationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
              Pontuação máxima
            </label>
            <input
              type="number"
              min={1}
              value={form.maxScore}
              onChange={(event) => form.setMaxScore(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--fog)] bg-white px-4 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--graphite)]">
          <input
            type="checkbox"
            checked={form.isPublic}
            onChange={(event) => form.setIsPublic(event.target.checked)}
            className="h-4 w-4 rounded border-[var(--fog)] text-[var(--chalk)] focus:ring-[var(--chalk)]"
          />
          Tornar público
        </label>
      </div>

      <div className="rounded-2xl border border-[var(--fog)] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--chalk)]">
            Itens da avaliação
          </p>
          <button
            type="button"
            onClick={form.addItem}
            className="rounded-full border border-[var(--fog)] bg-[var(--paper)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--chalk)] transition hover:border-[var(--chalk)]"
          >
            + Adicionar item
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-3">
          {form.items.map((item, index) => (
            <div key={item.tempId} className="rounded-xl border border-[var(--fog)] bg-[var(--paper)] p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_140px]">
                <input
                  type="text"
                  placeholder="Nome do item"
                  value={item.label}
                  onChange={(event) => form.updateItem(index, { label: event.target.value })}
                  className="rounded-lg border border-[var(--fog)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
                />
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={item.weight}
                  onChange={(event) =>
                    form.updateItem(index, { weight: Number(event.target.value) })
                  }
                  className="rounded-lg border border-[var(--fog)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
                />
              </div>
              <textarea
                placeholder="Descrição (opcional)"
                value={item.description ?? ''}
                onChange={(event) => form.updateItem(index, { description: event.target.value })}
                rows={2}
                className="mt-3 w-full rounded-lg border border-[var(--fog)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--chalk)]"
              />
              {form.items.length > 1 && (
                <button
                  type="button"
                  onClick={() => form.removeItem(index)}
                  className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--rubric)] hover:text-[var(--rubric-strong)]"
                >
                  Remover item
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-[var(--rubric)]">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[var(--fog)] px-4 py-2 text-sm font-semibold text-[var(--graphite)] transition hover:bg-[var(--wash)]"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!form.isValid || isSubmitting}
          onClick={onSubmit}
          className="rounded-lg bg-[var(--chalk)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--chalk-strong)] disabled:cursor-not-allowed disabled:bg-[var(--fog)]"
        >
          {isSubmitting ? 'Salvando...' : 'Criar critério'}
        </button>
      </div>
    </div>
  );
};
