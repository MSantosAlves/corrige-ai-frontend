import { useCallback, useEffect, useState } from 'react';

import { getSession } from '../services/auth-client';
import { persistPlanUsage } from '../helpers/plan-usage';

export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  emailVerified?: boolean;
} | null;

type SessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: boolean | null;
  plan_quota?: number | null;
  plan_usage?: number | null;
};

type SessionPayload = {
  user?: SessionUser | null;
  data?: { user?: SessionUser | null } | null;
};

const mapSessionUser = (user?: SessionUser | null): AuthUser => {
  if (!user?.id) {
    return null;
  }
  const displayName = user.name?.trim() || user.email || 'Usuario';
  return {
    id: user.id,
    name: displayName,
    email: user.email ?? undefined,
    emailVerified: user.emailVerified ?? undefined,
  };
};

export const useAuthSession = () => {
  const [authUser, setAuthUser] = useState<AuthUser>(null);
  const [authSessionLoading, setAuthSessionLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setAuthSessionLoading(true);
    try {
      const payload = (await getSession()) as SessionPayload | null;
      const sessionUser = payload?.user ?? payload?.data?.user ?? null;
      const resolvedUser = mapSessionUser(sessionUser as SessionUser | undefined);
      if (sessionUser) {
        persistPlanUsage({
          planQuota: sessionUser.plan_quota ?? undefined,
          planUsage: sessionUser.plan_usage ?? undefined,
        });
      }
      setAuthUser(resolvedUser);
    } catch {
      setAuthUser(null);
    } finally {
      setAuthSessionLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  return { authUser, setAuthUser, authSessionLoading, refreshSession };
};
