import { createClerkClient } from "@clerk/backend";
import { env } from "cloudflare:workers";
import { getRequiredAuthConfig } from "./auth-config";
import { ApiError } from "./errors";

export type AuthenticatedUser = {
  userId: string;
  allowedOrigins: readonly string[];
};

export async function requireClerkUser(request: Request): Promise<AuthenticatedUser> {
  const { secretKey, publishableKey, allowedOrigins } = getRequiredAuthConfig(env);

  try {
    const client = createClerkClient({ secretKey, publishableKey });
    const state = await client.authenticateRequest(request, {
      acceptsToken: "session_token",
      authorizedParties: [...allowedOrigins],
      secretKey,
      publishableKey,
    });
    if (!state.isAuthenticated) {
      throw new ApiError(401, "authentication_required", "Sign in to use cloud plans.");
    }
    const auth = state.toAuth();
    if (!auth.userId || auth.userId.length > 255) {
      throw new ApiError(401, "authentication_required", "Sign in to use cloud plans.");
    }
    return { userId: auth.userId, allowedOrigins };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "authentication_required", "Sign in to use cloud plans.");
  }
}
