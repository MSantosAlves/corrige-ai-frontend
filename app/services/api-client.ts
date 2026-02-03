const API_BASE_URL = 'http://localhost:3001';

type ApiErrorPayload = { error?: string };

const resolveAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('sessionToken');
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

const parseErrorMessage = async (
  response: Response,
  fallbackMessage: string,
): Promise<string> => {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    if (payload?.error) {
      return payload.error;
    }
  } catch {
    // Ignore parsing errors.
  }
  return fallbackMessage;
};

export const apiClient = {
  baseUrl: API_BASE_URL,
  authHeaders: resolveAuthHeaders,
  parseErrorMessage,
};
