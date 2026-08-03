import { ApiError } from "../../../lib/server/errors";
import { requireClerkUser } from "../../../lib/server/auth";
import { apiErrorResponse, json, readBoundedJson, requireSameOrigin } from "../../../lib/server/http";
import { planIdSchema, planInputSchema } from "../../../lib/server/plan-input";
import { deletePlan, findPlan, updatePlan } from "../../../lib/server/plans";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

async function idFrom(context: RouteContext): Promise<string> {
  return planIdSchema.parse((await context.params).id);
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  try {
    const { userId } = await requireClerkUser(request);
    const plan = await findPlan(userId, await idFrom(context));
    if (!plan) throw new ApiError(404, "plan_not_found", "That cloud plan was not found.");
    return json({ plan });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  try {
    const { userId, allowedOrigins } = await requireClerkUser(request);
    requireSameOrigin(request, allowedOrigins);
    const input = planInputSchema.parse(await readBoundedJson(request));
    const plan = await updatePlan(userId, await idFrom(context), input);
    if (!plan) throw new ApiError(404, "plan_not_found", "That cloud plan was not found.");
    return json({ plan });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  try {
    const { userId, allowedOrigins } = await requireClerkUser(request);
    requireSameOrigin(request, allowedOrigins);
    const deleted = await deletePlan(userId, await idFrom(context));
    if (!deleted) throw new ApiError(404, "plan_not_found", "That cloud plan was not found.");
    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
