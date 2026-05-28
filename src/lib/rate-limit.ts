import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type Bucket = { count: number; resetAt: number };
const memBuckets = new Map<string, Bucket>();
let warnedNoUpstash = false;

function getUpstash(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warnedNoUpstash) {
      console.warn(
        '[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN no seteados — usando in-memory (no-op en serverless multi-instancia)',
      );
      warnedNoUpstash = true;
    }
    return null;
  }
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, '10 m'),
    analytics: false,
    prefix: 'pedidos_ratelimit',
  });
}

const upstash = getUpstash();

/**
 * Rate limit con Upstash Redis (persistente serverless) o fallback in-memory.
 * Devuelve `true` si la request es permitida, `false` si se excedió el límite.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  if (upstash) {
    const { success } = await upstash.limit(key);
    return success;
  }
  // Fallback in-memory
  const now = Date.now();
  const bucket = memBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    memBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}
