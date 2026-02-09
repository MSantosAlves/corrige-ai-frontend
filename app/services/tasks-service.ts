import { apiClient } from './api-client';

export const listTasks = async (classId: string) => {
  const response = await fetch(
    `${apiClient.baseUrl}/tasks?class_id=${encodeURIComponent(classId)}`,
    { headers: apiClient.authHeaders(), ...apiClient.authOptions() },
  );

  if (!response.ok) {
    const { message, type } = await apiClient.parseErrorMessage(
      response,
      'Falha ao carregar tarefas.',
    );
    apiClient.redirectIfEmailNotVerified(type);
    throw new Error(message);
  }

  return (await response.json()) as { items?: Record<string, unknown>[] };
};

export const createTask = async (data: {
  classId: string;
  title: string;
  description?: string;
}) => {
  const response = await fetch(`${apiClient.baseUrl}/tasks`, {
    method: 'POST',
    headers: {
      ...apiClient.authHeaders(),
      'content-type': 'application/json',
    },
    ...apiClient.authOptions(),
    body: JSON.stringify({
      class_id: data.classId,
      title: data.title,
      description: data.description,
    }),
  });

  if (!response.ok) {
    const { message, type } = await apiClient.parseErrorMessage(
      response,
      'Falha ao criar tarefa.',
    );
    apiClient.redirectIfEmailNotVerified(type);
    throw new Error(message);
  }

  return (await response.json()) as Record<string, unknown>;
};
