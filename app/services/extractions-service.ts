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
    body: formData,
  });

  if (!response.ok) {
    const message = await apiClient.parseErrorMessage(response, 'Falha ao extrair o texto.');
    throw new Error(message);
  }

  return (await response.json()) as Record<string, unknown>;
};

export const extractTextBulk = async (formData: FormData): Promise<BulkExtractionResponse> => {
  const response = await fetch(`${apiClient.baseUrl}/extractions/bulk`, {
    method: 'POST',
    headers: apiClient.authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const message = await apiClient.parseErrorMessage(response, 'Falha ao enviar os arquivos.');
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
    { headers: apiClient.authHeaders() },
  );

  if (!response.ok) {
    const message = await apiClient.parseErrorMessage(response, 'Falha ao carregar análise.');
    throw new Error(message);
  }

  return (await response.json()) as Record<string, unknown>;
};

export const listExtractionsByTask = async (taskId: string) => {
  const response = await fetch(
    `${apiClient.baseUrl}/extractions?task_id=${encodeURIComponent(taskId)}`,
    { headers: apiClient.authHeaders() },
  );

  if (!response.ok) {
    const message = await apiClient.parseErrorMessage(response, 'Falha ao carregar análises.');
    throw new Error(message);
  }

  return (await response.json()) as { items?: Record<string, unknown>[] };
};

export const startBulkExtractionStream = (batchId: string): EventSource => {
  const streamUrl = new URL(`${apiClient.baseUrl}/extractions/bulk/${batchId}/events`);
  const token = localStorage.getItem('sessionToken');
  if (token) {
    streamUrl.searchParams.set('token', token);
  }
  return new EventSource(streamUrl.toString());
};
