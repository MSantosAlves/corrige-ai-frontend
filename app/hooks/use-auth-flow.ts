import { useState } from 'react';

import { signInOrUp } from '../services/auth-service';
import { type AuthUser } from './use-auth-session';

export const useAuthFlow = (setAuthUser: (user: AuthUser) => void) => {
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuth = async (mode: 'sign-in' | 'sign-up'): Promise<boolean> => {
    try {
      setAuthLoading(true);
      setAuthError('');

      const payload = await signInOrUp({
        mode,
        name: authName.trim(),
        email: authEmail.trim(),
        password: authPassword,
      });
      const userName = payload.user?.name || 'Usuario';
      const userId = payload.user?.id || 'user_unknown';
      setAuthUser({ id: userId, name: userName });
      if (payload.token) {
        localStorage.setItem('sessionToken', payload.token);
        localStorage.setItem('sessionUserName', userName);
        localStorage.setItem('sessionUserId', userId);
      }
      setAuthError('');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado ao autenticar.';
      setAuthError(message);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    authMode,
    setAuthMode,
    authName,
    setAuthName,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authError,
    authLoading,
    handleAuth,
  };
};
