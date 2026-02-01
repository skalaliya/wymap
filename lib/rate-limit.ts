import { env } from "./env";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

const now = () => Date.now();

export const rateLimit = (key: string): RateLimitResult => {
  const current = now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= current) {
    const resetAt = current + env.RATE_LIMIT_WINDOW_MS;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: env.RATE_LIMIT_MAX - 1,
      resetAt,
    };
  }

  if (existing.count >= env.RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  store.set(key, existing);
  return {
    allowed: true,
    remaining: env.RATE_LIMIT_MAX - existing.count,
    resetAt: existing.resetAt,
  };
};
