/**
 * In-memory sliding window rate limiter
 */

const rateLimitStore = new Map();

// Periodic cleanup of stale entries
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function checkRateLimit(
  identifier,
  options = { limit: 10, windowMs: 60 * 1000 }
) {
  const now = Date.now();
  const existing = rateLimitStore.get(identifier);

  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      success: true,
      remaining: options.limit - 1,
      reset: now + options.windowMs,
    };
  }

  if (existing.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      reset: existing.resetTime,
    };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: options.limit - existing.count,
    reset: existing.resetTime,
  };
}

export function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

