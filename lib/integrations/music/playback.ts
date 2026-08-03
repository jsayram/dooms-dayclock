import type {
  MusicProvider,
  MusicProviderId,
  MusicSelection,
  PlaybackSnapshot,
} from "./types.ts";

export type PlaybackListener = (snapshot: PlaybackSnapshot) => void;

/** Coordinates exactly one authorized provider; implementations own lifecycle cleanup. */
export interface PlaybackCoordinator {
  getSnapshot(): PlaybackSnapshot;
  registerProvider(provider: MusicProvider): void;
  select(selection: MusicSelection, signal?: AbortSignal): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  setVolume(volume: number): Promise<void>;
  disconnect(providerId?: MusicProviderId): Promise<void>;
  subscribe(listener: PlaybackListener): () => void;
}
