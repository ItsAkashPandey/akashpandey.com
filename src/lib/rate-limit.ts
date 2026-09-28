/**
 * Fixed-window rate limiting shared by the chat, the contact form and the
 * admin login.
 *
 * On Vercel every function instance has its own memory, so an in-memory
 * counter only limits one instance. When Upstash Redis is configured (Vercel's
 * KV integration sets these variables) the count is shared across all of
 * them; without it the in-memory window is a best-effort fallback.
 */

type Store = { count: number; resetAt: number };
const windows = new Map<string, Store>();
let lastPrune = 0;

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

async function redisHit(key: string, windowMs: number): Promise<number | null> {
  const redis = redisConfig();
  if (!redis) return null;
  try {
    const response = await fetch(`${redis.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redis.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["PEXPIRE", key, String(windowMs), "NX"],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) return null;
    const [incr] = (await response.json()) as [{ result?: number }];
    return typeof incr?.result === "number" ? incr.result : null;
  } catch {
    // A limiter outage should not take the chat or the form down with it.
    return null;
  }
}

function memoryHit(key: string, windowMs: number) {
  const now = Date.now();
  if (now - lastPrune > 60_000) {
    for (const [storedKey, store] of windows) {
      if (store.resetAt <= now) windows.delete(storedKey);
    }
    lastPrune = now;
  }

  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return 1;
  }
  current.count += 1;
  return current.count;
}

/** Counts one request and says whether it went over `limit` in the window. */
export async function isRateLimited(
  bucket: string,
  identifier: string,
  limit: number,
  windowMs: number,
) {
  const key = `rl:${bucket}:${identifier}`;
  const count = (await redisHit(key, windowMs)) ?? memoryHit(key, windowMs);
  return count > limit;
}

/**
 * The client's IP. Vercel sets `x-real-ip` itself, and overwrites
 * `x-forwarded-for`, so neither can be spoofed from the browser there.
 */
export function getClientIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
