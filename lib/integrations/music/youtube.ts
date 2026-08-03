import type {
  MusicProvider,
  MusicProviderDescriptor,
  MusicSelection,
} from "./types.ts";

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtube-nocookie.com",
]);

const RESOURCE_ID = /^[A-Za-z0-9_-]{6,64}$/;

export const youtubeDescriptor: MusicProviderDescriptor = Object.freeze({
  id: "youtube",
  displayName: "YouTube",
  capabilities: Object.freeze(["public-embed"] as const),
  availability: "available",
  requirements: Object.freeze([
    "User chooses a public YouTube video or playlist",
    "Playback starts only after a user gesture",
  ]),
  privacyNotice:
    "Loading the player connects to YouTube and is subject to Google's privacy terms.",
});

export type YouTubeResource =
  | { readonly kind: "video"; readonly videoId: string; readonly playlistId?: string }
  | { readonly kind: "playlist"; readonly playlistId: string };

/** Contract for an official YouTube iframe adapter; no account credentials needed. */
export interface YouTubeProvider extends MusicProvider {
  readonly descriptor: MusicProviderDescriptor & { readonly id: "youtube" };
  loadResource(resource: YouTubeResource, signal?: AbortSignal): Promise<void>;
}

function cleanId(value: string | null): string | null {
  if (!value || !RESOURCE_ID.test(value)) return null;
  return value;
}

/** Parses known YouTube URL shapes without accepting redirects or arbitrary hosts. */
export function parseYouTubeUrl(input: string): YouTubeResource | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || !YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }

  const playlistId = cleanId(url.searchParams.get("list"));
  const segments = url.pathname.split("/").filter(Boolean);
  let videoId: string | null = null;

  if (url.hostname.toLowerCase() === "youtu.be") {
    videoId = cleanId(segments[0] ?? null);
  } else if (url.pathname === "/watch") {
    videoId = cleanId(url.searchParams.get("v"));
  } else if (["embed", "shorts", "live"].includes(segments[0] ?? "")) {
    videoId = cleanId(segments[1] ?? null);
  }

  if (videoId) {
    return playlistId
      ? Object.freeze({ kind: "video", videoId, playlistId })
      : Object.freeze({ kind: "video", videoId });
  }
  if (playlistId && (url.pathname === "/playlist" || url.pathname === "/watch")) {
    return Object.freeze({ kind: "playlist", playlistId });
  }
  return null;
}

export function youtubeResourceToSelection(resource: YouTubeResource): MusicSelection {
  if (resource.kind === "playlist") {
    return Object.freeze({
      providerId: "youtube",
      kind: "playlist",
      resourceId: resource.playlistId,
      canonicalUrl: `https://www.youtube.com/playlist?list=${encodeURIComponent(resource.playlistId)}`,
    });
  }

  const list = resource.playlistId
    ? `&list=${encodeURIComponent(resource.playlistId)}`
    : "";
  return Object.freeze({
    providerId: "youtube",
    kind: "video",
    resourceId: resource.videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(resource.videoId)}${list}`,
  });
}
