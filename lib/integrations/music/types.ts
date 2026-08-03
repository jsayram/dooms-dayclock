export type MusicProviderId = "youtube" | "spotify" | "apple-music";

export type MusicCapability =
  | "public-embed"
  | "catalog-search"
  | "account-library"
  | "remote-playback"
  | "in-browser-playback";

export interface MusicProviderDescriptor {
  readonly id: MusicProviderId;
  readonly displayName: string;
  readonly capabilities: readonly MusicCapability[];
  readonly availability: "available" | "planned";
  readonly requirements: readonly string[];
  readonly privacyNotice: string;
}

export interface MusicSelection {
  readonly providerId: MusicProviderId;
  readonly kind: "track" | "playlist" | "video";
  readonly resourceId: string;
  readonly canonicalUrl?: string;
  readonly title?: string;
}

export interface PlaybackSnapshot {
  readonly providerId: MusicProviderId | null;
  readonly selection: MusicSelection | null;
  readonly status: "idle" | "loading" | "ready" | "playing" | "paused" | "error";
  readonly volume: number;
  readonly errorCode?: string;
}

/**
 * A provider implementation must wrap an official SDK or a public embed. It must
 * never collect a password or emulate a connection that has not been authorized.
 */
export interface MusicProvider {
  readonly descriptor: MusicProviderDescriptor;
  load(selection: MusicSelection, signal?: AbortSignal): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  setVolume(volume: number): Promise<void>;
  destroy(): Promise<void>;
}
