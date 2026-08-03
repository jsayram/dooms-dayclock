import { ZodError } from "zod";
import { AuthConfigurationError } from "./auth-config";
import { ApiError, ServerConfigurationError } from "./errors";

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
} as const;

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: JSON_HEADERS });
}

export function apiErrorResponse(error: unknown): Response {
  if (error instanceof ZodError) {
    return json(
      {
        error: {
          code: "invalid_request",
          message: "Check the plan details and try again.",
          fields: error.issues.slice(0, 12).map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
      400,
    );
  }

  if (error instanceof AuthConfigurationError) {
    const safeError = new ServerConfigurationError();
    return json({ error: { code: safeError.code, message: safeError.message } }, safeError.status);
  }

  if (error instanceof ApiError) {
    return json({ error: { code: error.code, message: error.message } }, error.status);
  }

  // Database binding failures and provider errors must not expose internals.
  console.error("Cloud plan request failed", {
    name: error instanceof Error ? error.name : "UnknownError",
  });
  const safeError = new ServerConfigurationError();
  return json({ error: { code: safeError.code, message: safeError.message } }, safeError.status);
}

export function requireSameOrigin(request: Request, allowedOrigins: readonly string[]): void {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get("Origin");
  if (!origin || origin !== requestOrigin || !allowedOrigins.includes(origin)) {
    throw new ApiError(403, "origin_not_allowed", "This request origin is not allowed.");
  }
}

export async function readBoundedJson(request: Request, maxBytes = 48_000): Promise<unknown> {
  const contentType = request.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new ApiError(415, "unsupported_media_type", "Send the plan as JSON.");
  }

  const statedLength = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(statedLength) && statedLength > maxBytes) {
    throw new ApiError(413, "request_too_large", "That plan is too large to save.");
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maxBytes) {
    throw new ApiError(413, "request_too_large", "That plan is too large to save.");
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new ApiError(400, "invalid_json", "The request did not contain valid JSON.");
  }
}
