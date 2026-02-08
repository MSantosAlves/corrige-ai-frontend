import { useMemo, useState } from 'react';

import type { GradeCriteriaItem } from '../services/criteria-service';

export const classificationOptions = [
  { value: 'MULTIPLE_CHOICES_EXAM', label: 'Prova objetiva' },
  { value: 'HANDWRITTEN_ESSAY', label: 'Redação manuscrita' },
  { value: 'MIXED_EXAM', label: 'Prova mista' },
  { value: 'PRINTED_ESSAY', label: 'Redação impressa' },
];

export type CriteriaFormItem = GradeCriteriaItem & { tempId: string };

export type CriteriaFormPayload = {
  name: string;
  description?: string;
  classification: string;
  isPublic: boolean;
  maxScore: number;
  items: GradeCriteriaItem[];
};

export type CriteriaFormModel = {
  name: string;
  description: string;
  classification: string;
  isPublic: boolean;
  maxScore: string;
  items: CriteriaFormItem[];
  isValid: boolean;
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setClassification: (value: string) => void;
  setIsPublic: (value: boolean) => void;
  setMaxScore: (value: string) => void;
  addItem: () => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, patch: Partial<GradeCriteriaItem>) => void;
  getPayload: () => CriteriaFormPayload;
  reset: () => void;
};

const createTempId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useCriteriaForm = (): CriteriaFormModel => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [classification, setClassification] = useState(classificationOptions[0].value);
  const [isPublic, setIsPublic] = useState(false);
  const [maxScore, setMaxScore] = useState('10');
  const [items, setItems] = useState<CriteriaFormItem[]>([
    { label: '', weight: 1, tempId: createTempId() },
  ]);

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

  const addItem = () => {
    setItems((prev) => [...prev, { label: '', weight: 1, tempId: createTempId() }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateItem = (index: number, patch: Partial<GradeCriteriaItem>) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const getPayload = (): CriteriaFormPayload => ({
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

  const reset = () => {
    setName('');
    setDescription('');
    setClassification(classificationOptions[0].value);
    setIsPublic(false);
    setMaxScore('10');
    setItems([{ label: '', weight: 1, tempId: createTempId() }]);
  };

  return {
    name,
    description,
    classification,
    isPublic,
    maxScore,
    items,
    isValid,
    setName,
    setDescription,
    setClassification,
    setIsPublic,
    setMaxScore,
    addItem,
    removeItem,
    updateItem,
    getPayload,
    reset,
  };
};
