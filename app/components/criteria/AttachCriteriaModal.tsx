'use client';

import { useMemo } from 'react';

import type { GradeCriteria } from '../../services/criteria-service';

type AttachCriteriaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  criteriaOptions: GradeCriteria[];
  selectedCriteriaId: string;
  onSelectCriteria: (value: string) => void;
  onAttach: () => void;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string;
};

export const AttachCriteriaModal = ({
  isOpen,
  onClose,
  criteriaOptions,
  selectedCriteriaId,
  onSelectCriteria,
  onAttach,
  isLoading,
  isSubmitting,
  error,
}: AttachCriteriaModalProps) => {
  const isReady = useMemo(() => selectedCriteriaId.length > 0, [selectedCriteriaId]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Atribuir critério</h2>
        <p className="mt-1 text-sm text-gray-600">
          Selecione um critério criado por você.
        </p>

        <div className="mt-4">
          <label className="text-xs font-semibold text-gray-600">Critério</label>
          <select
            value={selectedCriteriaId}
            onChange={(event) => onSelectCriteria(event.target.value)}
            disabled={isLoading}
            className="mt-2 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400 disabled:bg-gray-100"
          >
            <option value="">
              {isLoading
                ? 'Carregando critérios...'
                : criteriaOptions.length === 0
                  ? 'Nenhum critério disponível'
                  : 'Selecione um critério'}
            </option>
            {criteriaOptions.map((criteria) => (
              <option key={criteria.id} value={criteria.id}>
                {criteria.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-blue-100 px-6 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!isReady || isSubmitting}
            onClick={onAttach}
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting ? 'Atribuindo...' : 'Atribuir'}
          </button>
        </div>
      </div>
    </div>
  );
};
