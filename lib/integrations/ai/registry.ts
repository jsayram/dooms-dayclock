import type { AiProviderDescriptor, AiProviderId } from "./types.ts";

const placeholderModels = Object.freeze([]);

const descriptors: Record<AiProviderId, AiProviderDescriptor> = {
  openai: Object.freeze({
    id: "openai",
    displayName: "OpenAI",
    location: "cloud",
    auth: "api-key",
    allowedEndpoints: Object.freeze(["https://api.openai.com/v1"]),
    models: placeholderModels,
    supportsModelDiscovery: true,
    privacyNotice: "Prompts are sent to OpenAI when you explicitly create a plan.",
  }),
  anthropic: Object.freeze({
    id: "anthropic",
    displayName: "Anthropic",
    location: "cloud",
    auth: "api-key",
    allowedEndpoints: Object.freeze(["https://api.anthropic.com/v1"]),
    models: placeholderModels,
    supportsModelDiscovery: true,
    privacyNotice: "Prompts are sent to Anthropic when you explicitly create a plan.",
  }),
  ollama: Object.freeze({
    id: "ollama",
    displayName: "Ollama",
    location: "local",
    auth: "none",
    allowedEndpoints: Object.freeze([
      "http://127.0.0.1:11434",
      "http://localhost:11434",
    ]),
    models: placeholderModels,
    supportsModelDiscovery: true,
    privacyNotice: "Prompts stay on the selected local Ollama server.",
  }),
  "lm-studio": Object.freeze({
    id: "lm-studio",
    displayName: "LM Studio",
    location: "local",
    auth: "none",
    allowedEndpoints: Object.freeze([
      "http://127.0.0.1:1234/v1",
      "http://localhost:1234/v1",
    ]),
    models: placeholderModels,
    supportsModelDiscovery: true,
    privacyNotice: "Prompts stay on the selected local LM Studio server.",
  }),
};

export const aiProviderRegistry: Readonly<Record<AiProviderId, AiProviderDescriptor>> =
  Object.freeze(descriptors);

export function getAiProvider(id: AiProviderId): AiProviderDescriptor {
  return aiProviderRegistry[id];
}

/** Returns a known endpoint only; callers cannot introduce a remote URL. */
export function selectAllowedEndpoint(
  providerId: AiProviderId,
  endpointIndex = 0,
): string {
  const endpoint = aiProviderRegistry[providerId].allowedEndpoints[endpointIndex];
  if (!endpoint) throw new RangeError("That endpoint is not available for this provider.");
  return endpoint;
}
