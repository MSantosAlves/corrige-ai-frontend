import { useEffect, useState } from 'react';

export type AuthUser = { id: string; name: string } | null;

export const useAuthSession = () => {
  const [authUser, setAuthUser] = useState<AuthUser>(null);

  useEffect(() => {
    const token = localStorage.getItem('sessionToken');
    if (!token) {
      return;
    }
    const storedName = localStorage.getItem('sessionUserName');
    const storedUserId = localStorage.getItem('sessionUserId');
    if (!storedUserId) {
      return;
    }
    setAuthUser({ id: storedUserId, name: storedName || 'Usuario' });
  }, []);

  return { authUser, setAuthUser };
};
