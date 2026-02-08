export type PlanUsage = { quota: number; used: number };

type PlanUsagePayload = {
  planQuota?: number;
  planUsage?: number;
};

const normalizeNumber = (value?: number) =>
  typeof value === 'number' && !Number.isNaN(value) ? value : undefined;

export const getStoredPlanUsage = (): PlanUsage | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const storedQuota = sessionStorage.getItem('userQuota');
  const storedUsage = sessionStorage.getItem('userUsage');
  if (!storedQuota && !storedUsage) {
    return null;
  }
  const quota = storedQuota ? Number(storedQuota) : 0;
  const used = storedUsage ? Number(storedUsage) : 0;
  return { quota, used };
};

const extractPlanUsage = (payload: PlanUsagePayload) => {
  const quota = normalizeNumber(payload.planQuota);
  const used = normalizeNumber(payload.planUsage);
  return { quota, used };
};

export const persistPlanUsage = (payload: PlanUsagePayload): PlanUsage | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = getStoredPlanUsage();
  const extracted = extractPlanUsage(payload);
  const quota = extracted.quota ?? stored?.quota;
  const used = extracted.used ?? stored?.used;
  if (quota === undefined && used === undefined) {
    return null;
  }
  const normalized = { quota: quota ?? 0, used: used ?? 0 };
  sessionStorage.setItem('userQuota', String(normalized.quota));
  sessionStorage.setItem('userUsage', String(normalized.used));
  return normalized;
};
