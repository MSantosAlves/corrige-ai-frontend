import { apiClient } from './api-client';

export type BulkExtractionResponse = {
  batch_id?: string;
  progress?: { completed?: number; total?: number };
  error?: string;
  planQuota?: number;
  planUsage?: number;
};

export const extractText = async (formData: FormData): Promise<Record<string, unknown>> => {
  const response = await fetch(`${apiClient.baseUrl}/extract-text`, {
    method: 'POST',
    headers: apiClient.authHeaders(),
    ...apiClient.authOptions(),
    body: formData,
  });

  if (!response.ok) {
    const { message, type } = await apiClient.parseErrorMessage(
      response,
      'Falha ao extrair o texto.',
    );
    apiClient.redirectIfEmailNotVerified(type);
    throw new Error(message);
  }

  return (await response.json()) as Record<string, unknown>;
};

export const extractTextBulk = async (formData: FormData): Promise<BulkExtractionResponse> => {
  const response = await fetch(`${apiClient.baseUrl}/extractions/bulk`, {
    method: 'POST',
    headers: apiClient.authHeaders(),
    ...apiClient.authOptions(),
    body: formData,
  });

  if (!response.ok) {
    const { message, type } = await apiClient.parseErrorMessage(
      response,
      'Falha ao enviar os arquivos.',
    );
    apiClient.redirectIfEmailNotVerified(type);
    throw new Error(message);
  }

  const payload = (await response.json()) as BulkExtractionResponse;
  if (payload.error) {
    throw new Error(payload.error);
  }
  return payload;
};

export const getExtraction = async (extractionId: string) => {
  const response = await fetch(
    `${apiClient.baseUrl}/extractions/${encodeURIComponent(extractionId)}`,
    { headers: apiClient.authHeaders(), ...apiClient.authOptions() },
  );

  if (!response.ok) {
    const { message, type } = await apiClient.parseErrorMessage(
      response,
      'Falha ao carregar análise.',
    );
    apiClient.redirectIfEmailNotVerified(type);
    throw new Error(message);
  }

  return (await response.json()) as Record<string, unknown>;
};

export const listExtractionsByTask = async (taskId: string) => {
  const response = await fetch(
    `${apiClient.baseUrl}/extractions?task_id=${encodeURIComponent(taskId)}`,
    { headers: apiClient.authHeaders(), ...apiClient.authOptions() },
  );

  if (!response.ok) {
    const { message, type } = await apiClient.parseErrorMessage(
      response,
      'Falha ao carregar análises.',
    );
    apiClient.redirectIfEmailNotVerified(type);
    throw new Error(message);
  }

  return (await response.json()) as { items?: Record<string, unknown>[] };
};

export const startBulkExtractionStream = (batchId: string): EventSource => {
  const streamUrl = new URL(`${apiClient.baseUrl}/extractions/bulk/${batchId}/events`);
  return new EventSource(streamUrl.toString(), { withCredentials: true });
};
