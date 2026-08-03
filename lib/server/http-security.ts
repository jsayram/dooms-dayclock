const JSON_CONTENT_TYPE = "application/json";

export const SAFE_RESPONSE_HEADERS = Object.freeze({
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
});

function configuredOrigins(): ReadonlySet<string> {
  const raw = process.env.AI_ALLOWED_ORIGINS ?? "";
  const origins = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => {
      if (!entry) return false;
      try {
        const url = new URL(entry);
        const isLocalHttp =
          url.protocol === "http:" &&
          (url.hostname === "localhost" || url.hostname === "127.0.0.1");
        return (
          (url.protocol === "https:" || isLocalHttp) &&
          url.origin === entry &&
          !url.username &&
          !url.password
        );
      } catch {
        return false;
      }
    });

  return new Set(origins);
}

export function allowedRequestOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin || !configuredOrigins().has(origin)) return null;
  return origin;
}

export function corsHeaders(origin: string): HeadersInit {
  return {
    ...SAFE_RESPONSE_HEADERS,
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export function hasJsonContentType(request: Request): boolean {
  const value = request.headers.get("content-type");
  if (!value) return false;
  return value.split(";", 1)[0]?.trim().toLowerCase() === JSON_CONTENT_TYPE;
}

export function declaredBodyTooLarge(request: Request, maxBytes: number): boolean {
  const value = request.headers.get("content-length");
  if (value === null) return false;
  if (!/^\d+$/.test(value)) return true;
  return Number(value) > maxBytes;
}

export async function readBoundedJson(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  if (declaredBodyTooLarge(request, maxBytes)) {
    throw new RequestGuardError("request_too_large", 413);
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > maxBytes) {
    throw new RequestGuardError("request_too_large", 413);
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new RequestGuardError("invalid_json", 400);
  }
}

export class RequestGuardError extends Error {
  readonly code: "invalid_json" | "request_too_large";
  readonly status: 400 | 413;

  constructor(
    code: "invalid_json" | "request_too_large",
    status: 400 | 413,
  ) {
    super(code);
    this.name = "RequestGuardError";
    this.code = code;
    this.status = status;
  }
}

type RateBucket = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateBucket>();

/**
 * Best-effort per-isolate abuse control. Production must also configure a
 * distributed Cloudflare rate-limit rule for these endpoints.
 */
export function consumeRateLimit(
  request: Request,
  route: string,
  limit = 10,
  windowMs = 60_000,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const client = request.headers.get("cf-connecting-ip") ?? "unidentified";
  let key = `${route}:${client}`;
  if (rateBuckets.size >= 5_000 && !rateBuckets.has(key)) {
    for (const [bucketKey, bucket] of rateBuckets) {
      if (bucket.resetAt <= now) rateBuckets.delete(bucketKey);
    }
    if (rateBuckets.size >= 5_000) key = `${route}:overflow`;
  }
  const current = rateBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimitsForTests(): void {
  rateBuckets.clear();
}
