"use client";

import { useEffect, useState } from "react";

type MediaState = {
  title: string | null;
  artist: string | null;
  albumArt: string | null;
  isPlaying: boolean;
} | null;

export default function SpotifyPlayer({ lang }: { lang: "es" | "en" }) {
  const [media, setMedia] = useState<MediaState>(null);
  const [loading, setLoading] = useState(true);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/ha/media");
      const data = await res.json();
      setMedia(data);
    } catch {
      setMedia(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  const call = async (service: string) => {
    await fetch("/api/ha/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service }),
    });
    fetchState();
  };

  const noSong = lang === "es" ? "Nada sonando" : "Nothing playing";
  const noArtist = lang === "es" ? "Conecta Spotify en Home Assistant" : "Connect Spotify in Home Assistant";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-night-700 bg-night-800/60 p-4">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-night-700">
        {media?.albumArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.albumArt} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-moon-soft/50">♪</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm text-moon-glow">{media?.title ?? (loading ? "..." : noSong)}</p>
        <p className="truncate font-body text-xs text-moon-soft">{media?.artist ?? noArtist}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4 text-moon-glow">
        <button
          onClick={() => call("media_previous_track")}
          aria-label="previous"
          className="text-2xl opacity-70 transition-colors hover:text-listen hover:opacity-100"
        >
          {"\u23EE\uFE0E"}
        </button>
        <button
          onClick={() => call(media?.isPlaying ? "media_pause" : "media_play")}
          aria-label="play-pause"
          className="text-3xl opacity-90 transition-colors hover:text-listen hover:opacity-100"
        >
          {media?.isPlaying ? "\u23F8\uFE0E" : "\u25B6\uFE0E"}
        </button>
        <button
          onClick={() => call("media_next_track")}
          aria-label="next"
          className="text-2xl opacity-70 transition-colors hover:text-listen hover:opacity-100"
        >
          {"\u23ED\uFE0E"}
        </button>
      </div>
    </div>
  );
}
