import { requireClerkUser } from "../../lib/server/auth";
import { apiErrorResponse, json, readBoundedJson, requireSameOrigin } from "../../lib/server/http";
import { planInputSchema } from "../../lib/server/plan-input";
import { createPlan, listPlans } from "../../lib/server/plans";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const { userId } = await requireClerkUser(request);
    return json({ plans: await listPlans(userId) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { userId, allowedOrigins } = await requireClerkUser(request);
    requireSameOrigin(request, allowedOrigins);
    const input = planInputSchema.parse(await readBoundedJson(request));
    return json({ plan: await createPlan(userId, input) }, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
