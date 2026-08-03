export class AuthConfigurationError extends Error {
  constructor() {
    super("Clerk authentication is not configured.");
    this.name = "AuthConfigurationError";
  }
}

function required(value: string | undefined): string {
  const result = value?.trim();
  if (!result) throw new AuthConfigurationError();
  return result;
}

export function parseAuthorizedParties(value: string | undefined): string[] {
  const parties = required(value)
    .split(",")
    .map((party) => party.trim())
    .filter(Boolean);

  if (parties.length === 0 || parties.length > 10) throw new AuthConfigurationError();
  const unique = new Set<string>();
  for (const party of parties) {
    try {
      const url = new URL(party);
      if (
        (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "localhost")) ||
        url.origin !== party ||
        url.username ||
        url.password
      ) {
        throw new AuthConfigurationError();
      }
      unique.add(party);
    } catch (error) {
      if (error instanceof AuthConfigurationError) throw error;
      throw new AuthConfigurationError();
    }
  }
  return [...unique];
}

export function getRequiredAuthConfig(bindings: Record<string, unknown>): {
  secretKey: string;
  publishableKey: string;
  allowedOrigins: string[];
} {
  return {
    secretKey: required(typeof bindings.CLERK_SECRET_KEY === "string" ? bindings.CLERK_SECRET_KEY : undefined),
    publishableKey: required(
      typeof bindings.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string"
        ? bindings.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
        : undefined,
    ),
    allowedOrigins: parseAuthorizedParties(
      typeof bindings.CLERK_AUTHORIZED_PARTIES === "string"
        ? bindings.CLERK_AUTHORIZED_PARTIES
        : undefined,
    ),
  };
}
