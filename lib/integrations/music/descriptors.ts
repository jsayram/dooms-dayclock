import type { MusicProviderDescriptor } from "./types.ts";
import { youtubeDescriptor } from "./youtube.ts";

export const spotifyDescriptor: MusicProviderDescriptor = Object.freeze({
  id: "spotify",
  displayName: "Spotify",
  capabilities: Object.freeze([
    "catalog-search",
    "account-library",
    "remote-playback",
    "in-browser-playback",
  ] as const),
  availability: "planned",
  requirements: Object.freeze([
    "Spotify OAuth authorization",
    "A Spotify app with approved redirect URIs",
    "A supported Spotify account and playback device",
  ]),
  privacyNotice:
    "A future connection will share playback requests with Spotify only after explicit authorization.",
});

export const appleMusicDescriptor: MusicProviderDescriptor = Object.freeze({
  id: "apple-music",
  displayName: "Apple Music",
  capabilities: Object.freeze([
    "catalog-search",
    "account-library",
    "in-browser-playback",
  ] as const),
  availability: "planned",
  requirements: Object.freeze([
    "MusicKit authorization",
    "An Apple Developer music identifier and server-signed developer token",
    "An active Apple Music subscription for subscriber playback",
  ]),
  privacyNotice:
    "A future connection will contact Apple Music only after explicit authorization.",
});

export const musicProviderDescriptors = Object.freeze([
  youtubeDescriptor,
  spotifyDescriptor,
  appleMusicDescriptor,
] as const);
