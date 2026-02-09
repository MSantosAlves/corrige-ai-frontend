const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

type ApiErrorPayload = { error?: string; type?: string };

const resolveAuthHeaders = (): Record<string, string> => ({});

const resolveAuthOptions = (): RequestInit => ({
  credentials: 'include',
});

const parseErrorMessage = async (
  response: Response,
  fallbackMessage: string,
): Promise<{ message: string; type?: string }> => {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    if (payload?.error) {
      return { message: payload.error, type: payload.type };
    }
  } catch {
    // Ignore parsing errors.
  }
  return { message: fallbackMessage };
};

const redirectIfEmailNotVerified = (errorType?: string) => {
  if (errorType === 'EMAIL_NOT_VERIFIED' && typeof window !== 'undefined') {
    window.location.assign('/auth/verify-email');
  }
};

export const apiClient = {
  baseUrl: API_BASE_URL,
  authHeaders: resolveAuthHeaders,
  authOptions: resolveAuthOptions,
  parseErrorMessage,
  redirectIfEmailNotVerified,
};
