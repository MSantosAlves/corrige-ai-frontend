import { apiClient } from './api-client';

export const listClasses = async (userId: string) => {
  const response = await fetch(
    `${apiClient.baseUrl}/classes?user_id=${encodeURIComponent(userId)}`,
    { headers: apiClient.authHeaders() },
  );

  if (!response.ok) {
    const message = await apiClient.parseErrorMessage(response, 'Falha ao carregar turmas.');
    throw new Error(message);
  }

  return (await response.json()) as { items?: Record<string, unknown>[] };
};

export const createClass = async (data: { name: string; userId: string }) => {
  const response = await fetch(`${apiClient.baseUrl}/classes`, {
    method: 'POST',
    headers: {
      ...apiClient.authHeaders(),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      user_id: data.userId,
    }),
  });

  if (!response.ok) {
    const message = await apiClient.parseErrorMessage(response, 'Falha ao criar turma');
    throw new Error(message);
  }

  return (await response.json()) as Record<string, unknown>;
};
