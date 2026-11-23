/**
 * Fixed-window, in-memory, per-key limiter. Good enough for a single Node instance or a demo;
 * on serverless each instance has its own window, so treat it as a speed bump, not a guarantee.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function check(key: string, now: number = Date.now()): boolean {
    const entry = hits.get(key);
    if (!entry || now >= entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      if (hits.size > 5000) {
        hits.forEach((v, k) => {
          if (now >= v.resetAt) hits.delete(k);
        });
      }
      return true;
    }
    if (entry.count >= limit) return false;
    entry.count += 1;
    return true;
  };
}
