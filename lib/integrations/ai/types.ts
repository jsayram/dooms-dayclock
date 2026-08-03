export type AiProviderId = "openai" | "anthropic" | "ollama" | "lm-studio";

export interface AiModelMetadata {
  readonly id: string;
  readonly displayName: string;
  readonly contextWindow?: number;
  readonly discoveredAtRuntime: boolean;
}

export interface AiProviderDescriptor {
  readonly id: AiProviderId;
  readonly displayName: string;
  readonly location: "cloud" | "local";
  readonly auth: "api-key" | "none";
  readonly allowedEndpoints: readonly string[];
  readonly models: readonly AiModelMetadata[];
  readonly supportsModelDiscovery: boolean;
  readonly privacyNotice: string;
}
