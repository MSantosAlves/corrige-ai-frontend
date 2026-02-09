import { createAuthClient } from 'better-auth/client';

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
  fetchOptions: {
    credentials: 'include',
  },
});

export const signInWithGoogle = async (callbackURL: string) =>
  authClient.signIn.social({
    provider: 'google',
    callbackURL,
  });

export const getSession = async () => authClient.getSession();

export const sendVerificationEmail = async (email: string, callbackURL?: string) =>
  authClient.sendVerificationEmail({ email, callbackURL });

export const signOut = async () => authClient.signOut();
