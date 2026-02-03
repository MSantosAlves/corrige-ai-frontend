import { apiClient } from './api-client';

export type GradeCriteriaItem = {
  label: string;
  weight: number;
  description?: string;
};

export type GradeCriteria = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  classification: string;
  is_public: boolean;
  max_score: number;
  items: GradeCriteriaItem[];
  tags?: string[];
  created_at: string;
  updated_at: string;
};

export const listCriteria = async (params: {
  includePublic?: boolean;
  classification?: string;
} = {}) => {
  const searchParams = new URLSearchParams();
  if (params.classification) {
    searchParams.set('classification', params.classification);
  }
  if (typeof params.includePublic === 'boolean') {
    searchParams.set('include_public', String(params.includePublic));
  }
  const query = searchParams.toString();
  const response = await fetch(
    `${apiClient.baseUrl}/criteria${query ? `?${query}` : ''}`,
    { headers: apiClient.authHeaders() },
  );

  if (!response.ok) {
    const message = await apiClient.parseErrorMessage(response, 'Falha ao carregar critérios.');
    throw new Error(message);
  }

  return (await response.json()) as { items?: GradeCriteria[] };
};

export const getCriteriaById = async (criteriaId: string) => {
  const response = await fetch(`${apiClient.baseUrl}/criteria`, {
    headers: apiClient.authHeaders(),
  });

  if (!response.ok) {
    const message = await apiClient.parseErrorMessage(response, 'Falha ao carregar critério.');
    throw new Error(message);
  }

  const payload = (await response.json()) as { items?: GradeCriteria[] };
  const found = payload.items?.find((item) => item.id === criteriaId);
  if (!found) {
    throw new Error('Critério não encontrado.');
  }
  return found;
};

export const createCriteria = async (data: {
  name: string;
  description?: string;
  classification: string;
  isPublic: boolean;
  maxScore: number;
  items: GradeCriteriaItem[];
  tags?: string[];
}) => {
  const response = await fetch(`${apiClient.baseUrl}/criteria`, {
    method: 'POST',
    headers: {
      ...apiClient.authHeaders(),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      description: data.description,
      classification: data.classification,
      is_public: data.isPublic,
      max_score: data.maxScore,
      items: data.items,
      tags: data.tags,
    }),
  });

  if (!response.ok) {
    const message = await apiClient.parseErrorMessage(response, 'Falha ao criar critério.');
    throw new Error(message);
  }

  return (await response.json()) as GradeCriteria;
};

export const attachCriteriaToTask = async (data: {
  taskId: string;
  gradeCriteriaId: string;
  classification: string;
}) => {
  const response = await fetch(`${apiClient.baseUrl}/tasks/${data.taskId}/criteria`, {
    method: 'POST',
    headers: {
      ...apiClient.authHeaders(),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      grade_criteria_id: data.gradeCriteriaId,
      classification: data.classification,
    }),
  });

  if (!response.ok) {
    const message = await apiClient.parseErrorMessage(
      response,
      'Falha ao anexar critério à tarefa.',
    );
    throw new Error(message);
  }

  return (await response.json()) as Record<string, unknown>;
};
