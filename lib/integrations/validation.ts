import { aiProviderRegistry } from "./ai/registry.ts";
import type { AiProviderId } from "./ai/types.ts";

const MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/;

export function validateApiKey(value: unknown): string {
  if (typeof value !== "string") throw new TypeError("API key must be text.");
  const key = value.trim();
  if (key.length < 8 || key.length > 512 || CONTROL_CHARACTERS.test(key)) {
    throw new TypeError("API key has an invalid format.");
  }
  return key;
}

export function validateModelId(value: unknown): string {
  if (typeof value !== "string" || !MODEL_ID.test(value)) {
    throw new TypeError("Model identifier has an invalid format.");
  }
  return value;
}

/** Exact allowlist check: no userinfo, query, fragment, alternative path, or port. */
export function validateProviderEndpoint(
  providerId: AiProviderId,
  candidate: unknown,
): string {
  if (typeof candidate !== "string") throw new TypeError("Endpoint must be text.");
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new TypeError("Endpoint is not a valid URL.");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new TypeError("Endpoint contains unsupported URL fields.");
  }

  const normalized = parsed.href.replace(/\/$/, "");
  const allowed = aiProviderRegistry[providerId].allowedEndpoints;
  if (!allowed.includes(normalized)) {
    throw new TypeError("Endpoint is not allowed for this provider.");
  }
  return normalized;
}

export function validateVolume(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError("Volume must be a number from 0 to 1.");
  }
  return value;
}
