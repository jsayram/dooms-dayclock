import { NextResponse } from "next/server";
import {
  AiRelayError,
  generateCloudPlan,
  planRequestSchema,
} from "../../../../lib/server/ai-relay";
import {
  allowedRequestOrigin,
  consumeRateLimit,
  corsHeaders,
  hasJsonContentType,
  readBoundedJson,
  RequestGuardError,
  SAFE_RESPONSE_HEADERS,
} from "../../../../lib/server/http-security";

const MAX_REQUEST_BYTES = 4_096;

function errorResponse(
  code: string,
  status: number,
  origin?: string,
  extraHeaders?: HeadersInit,
) {
  return NextResponse.json(
    { error: code },
    {
      status,
      headers: {
        ...(origin ? corsHeaders(origin) : SAFE_RESPONSE_HEADERS),
        ...extraHeaders,
      },
    },
  );
}

export async function OPTIONS(request: Request) {
  const origin = allowedRequestOrigin(request);
  if (!origin) return errorResponse("origin_not_allowed", 403);
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = allowedRequestOrigin(request);
  if (!origin) return errorResponse("origin_not_allowed", 403);
  if (!hasJsonContentType(request)) {
    return errorResponse("content_type_required", 415, origin);
  }

  const rate = consumeRateLimit(request, "ai-plan", 8);
  if (!rate.allowed) {
    return errorResponse("rate_limited", 429, origin, {
      "Retry-After": String(rate.retryAfterSeconds),
    });
  }

  try {
    const input = planRequestSchema.safeParse(
      await readBoundedJson(request, MAX_REQUEST_BYTES),
    );
    if (!input.success) return errorResponse("invalid_request", 400, origin);
    const plan = await generateCloudPlan(input.data);
    return NextResponse.json(
      { plan },
      { headers: corsHeaders(origin) },
    );
  } catch (error) {
    if (error instanceof RequestGuardError) {
      return errorResponse(error.code, error.status, origin);
    }
    if (error instanceof AiRelayError) {
      return errorResponse(error.code, error.status, origin);
    }
    return errorResponse("provider_unavailable", 502, origin);
  }
}
