import { apiClient } from './api-client';

type AuthMode = 'sign-in' | 'sign-up';

export const signInOrUp = async (data: {
  mode: AuthMode;
  name?: string;
  email: string;
  password: string;
}): Promise<{ user?: { id?: string; name?: string }; token?: string }> => {
  const response = await fetch(`${apiClient.baseUrl}/auth/${data.mode}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: data.mode === 'sign-up' ? data.name : undefined,
      email: data.email,
      password: data.password,
    }),
  });

  if (!response.ok) {
    const message = await apiClient.parseErrorMessage(response, 'Falha ao autenticar.');
    throw new Error(message);
  }

  return (await response.json()) as { user?: { id?: string; name?: string }; token?: string };
};
