"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Headphones, LockKeyhole, Music2, Play } from "lucide-react";
import { parseYouTubeUrl } from "../../lib/integrations/music/youtube";

function embedUrl(input: string) {
  const resource = parseYouTubeUrl(input);
  if (!resource) return "";
  if (resource.kind === "playlist") return `https://www.youtube-nocookie.com/embed/videoseries?enablejsapi=1&list=${encodeURIComponent(resource.playlistId)}`;
  const list = resource.playlistId ? `&list=${encodeURIComponent(resource.playlistId)}` : "";
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(resource.videoId)}?enablejsapi=1${list}`;
}

export function MusicPanel({ running }: { running: boolean }) {
  const [provider, setProvider] = useState<"youtube" | "spotify" | "apple">("youtube");
  const [input, setInput] = useState("");
  const [connectedUrl, setConnectedUrl] = useState("");
  const player = useRef<HTMLIFrameElement>(null);
  const parsed = useMemo(() => embedUrl(input), [input]);
  function command(func: "playVideo" | "pauseVideo") {
    player.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "https://www.youtube-nocookie.com");
  }
  useEffect(() => {
    if (!connectedUrl) return;
    command(running ? "playVideo" : "pauseVideo");
  }, [connectedUrl, running]);
  return (
    <section className="side-card music-card" aria-labelledby="music-title">
      <div className="side-card-title"><span><Headphones aria-hidden="true" /></span><div><h2 id="music-title">Focus soundtrack</h2><p>Music follows the timer, not the other way around.</p></div></div>
      <div className="provider-tabs" role="tablist" aria-label="Music service">
        {(["youtube", "spotify", "apple"] as const).map(id => <button key={id} role="tab" aria-selected={provider === id} onClick={() => setProvider(id)}>{id === "youtube" ? "YouTube" : id === "spotify" ? "Spotify" : "Apple Music"}</button>)}
      </div>
      {provider === "youtube" ? <>
        <label className="field"><span>Public video or playlist link</span><input type="url" placeholder="https://www.youtube.com/watch?v=…" value={input} onChange={event => setInput(event.target.value)} /></label>
        <p className="privacy-note"><LockKeyhole aria-hidden="true" /> The player connects to YouTube only after you press Load.</p>
        <button className="soft-button full" disabled={!parsed} onClick={() => setConnectedUrl(parsed)}><Play aria-hidden="true" /> Load YouTube player</button>
        {input && !parsed && <p className="field-error">Use a public HTTPS YouTube video or playlist link.</p>}
        {connectedUrl && <><iframe ref={player} className="youtube-player" src={connectedUrl} title="YouTube focus music" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /><button className="soft-button full" onClick={() => command(running ? "playVideo" : "pauseVideo")}>{running ? "Resume soundtrack" : "Keep soundtrack paused"}</button></>}
      </> : <div className="coming-soon"><Music2 aria-hidden="true" /><strong>{provider === "spotify" ? "Spotify needs Premium and provider approval" : "Apple Music needs a subscription and server token"}</strong><p>The adapter is ready, but this service stays off until its official account and security requirements are configured.</p><a href={provider === "spotify" ? "https://developer.spotify.com/documentation/web-playback-sdk" : "https://developer.apple.com/musickit/"} target="_blank" rel="noopener noreferrer">Read provider requirements <ExternalLink aria-hidden="true" /></a></div>}
    </section>
  );
}
