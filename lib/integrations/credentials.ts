import type { AiProviderId } from "./ai/types.ts";
import { validateApiKey } from "./validation.ts";

export type CredentialProviderId = Extract<AiProviderId, "openai" | "anthropic">;

/**
 * Ephemeral credential storage. Values exist only in this instance's memory and
 * are never serialized, logged, placed in Web Storage, or persisted on refresh.
 */
export class SessionCredentialStore {
  readonly #credentials = new Map<CredentialProviderId, string>();

  set(providerId: CredentialProviderId, credential: string): void {
    this.#credentials.set(providerId, validateApiKey(credential));
  }

  has(providerId: CredentialProviderId): boolean {
    return this.#credentials.has(providerId);
  }

  /** Use sparingly and pass directly to the authenticated request layer. */
  get(providerId: CredentialProviderId): string | undefined {
    return this.#credentials.get(providerId);
  }

  clear(providerId?: CredentialProviderId): void {
    if (providerId) this.#credentials.delete(providerId);
    else this.#credentials.clear();
  }

  toJSON(): Record<string, never> {
    return {};
  }
}
