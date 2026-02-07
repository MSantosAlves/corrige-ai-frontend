'use client';

import { useMemo, useState } from 'react';

import type { GradeCriteriaItem } from '../../services/criteria-service';

const classificationOptions = [
  { value: 'MULTIPLE_CHOICES_EXAM', label: 'Prova objetiva' },
  { value: 'HANDWRITTEN_ESSAY', label: 'Redação manuscrita' },
  { value: 'MIXED_EXAM', label: 'Prova mista' },
  { value: 'PRINTED_ESSAY', label: 'Redação impressa' },
];

type CreateCriteriaModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    classification: string;
    isPublic: boolean;
    maxScore: number;
    items: GradeCriteriaItem[];
  }) => Promise<void>;
};

export const CreateCriteriaModal = ({ isOpen, onClose, onSubmit }: CreateCriteriaModalProps) => {
  const createTempId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [classification, setClassification] = useState(classificationOptions[0].value);
  const [isPublic, setIsPublic] = useState(false);
  const [maxScore, setMaxScore] = useState('10');
  const [items, setItems] = useState<Array<GradeCriteriaItem & { tempId: string }>>([
    { label: '', weight: 1, tempId: createTempId() },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isValid = useMemo(() => {
    if (!name.trim()) {
      return false;
    }
    const score = Number(maxScore);
    if (Number.isNaN(score) || score <= 0) {
      return false;
    }
    return items.every((item) => item.label.trim().length > 0 && item.weight >= 0);
  }, [name, maxScore, items]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { label: '', weight: 1, tempId: createTempId() }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, patch: Partial<GradeCriteriaItem>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        classification,
        isPublic,
        maxScore: Number(maxScore),
        items: items.map(({ label, weight, description: itemDescription }) => ({
          label: label.trim(),
          weight: Number(weight),
          description: itemDescription?.trim() || undefined,
        })),
      });
      setName('');
      setDescription('');
      setClassification(classificationOptions[0].value);
      setIsPublic(false);
      setMaxScore('10');
      setItems([{ label: '', weight: 1, tempId: createTempId() }]);
      onClose();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Erro ao criar critério.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Criar critério</h2>
        <p className="mt-1 text-sm text-gray-600">Defina a avaliação e os itens de correção.</p>

        <div className="mt-4 grid gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Descrição</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-gray-600">Classificação</label>
              <select
                value={classification}
                onChange={(event) => setClassification(event.target.value)}
                className="mt-2 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400"
              >
                {classificationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Pontuação máxima</label>
              <input
                type="number"
                min={1}
                value={maxScore}
                onChange={(event) => setMaxScore(event.target.value)}
                className="mt-2 w-full rounded-xl border border-blue-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Tornar público
          </label>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Itens da avaliação
            </p>
            <button
              type="button"
              onClick={handleAddItem}
              className="rounded-full border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 hover:border-blue-300"
            >
              + Adicionar item
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {items.map((item, index) => (
              <div key={item.tempId} className="rounded-xl border border-blue-100 p-4">
                <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                  <input
                    type="text"
                    placeholder="Nome do item"
                    value={item.label}
                    onChange={(event) => handleItemChange(index, { label: event.target.value })}
                    className="rounded-lg border border-blue-200 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-400"
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={item.weight}
                    onChange={(event) =>
                      handleItemChange(index, { weight: Number(event.target.value) })
                    }
                    className="rounded-lg border border-blue-200 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-400"
                  />
                </div>
                <textarea
                  placeholder="Descrição (opcional)"
                  value={item.description ?? ''}
                  onChange={(event) => handleItemChange(index, { description: event.target.value })}
                  rows={2}
                  className="mt-3 w-full rounded-lg border border-blue-200 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-400"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="mt-3 text-xs font-semibold text-red-500 hover:text-red-600"
                  >
                    Remover item
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

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
            disabled={!isValid || isSubmitting}
            onClick={handleSubmit}
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isSubmitting ? 'Salvando...' : 'Criar critério'}
          </button>
        </div>
      </div>
    </div>
  );
};
