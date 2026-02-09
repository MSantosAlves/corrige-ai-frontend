import { apiClient } from './api-client';

export const listClasses = async (userId: string) => {
  const response = await fetch(
    `${apiClient.baseUrl}/classes?user_id=${encodeURIComponent(userId)}`,
    { headers: apiClient.authHeaders(), ...apiClient.authOptions() },
  );

  if (!response.ok) {
    const { message, type } = await apiClient.parseErrorMessage(
      response,
      'Falha ao carregar turmas.',
    );
    apiClient.redirectIfEmailNotVerified(type);
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
    ...apiClient.authOptions(),
    body: JSON.stringify({
      name: data.name,
      user_id: data.userId,
    }),
  });

  if (!response.ok) {
    const { message, type } = await apiClient.parseErrorMessage(
      response,
      'Falha ao criar turma',
    );
    apiClient.redirectIfEmailNotVerified(type);
    throw new Error(message);
  }

  return (await response.json()) as Record<string, unknown>;
};
