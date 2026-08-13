import { NextResponse } from "next/server";
import { getState, callService, SPOTIFY_ENTITY } from "@/lib/homeassistant";

export async function GET() {
  const state = await getState(SPOTIFY_ENTITY);
  if (!state) return NextResponse.json(null);

  return NextResponse.json({
    title: state.attributes?.media_title ?? null,
    artist: state.attributes?.media_artist ?? null,
    albumArt: state.attributes?.entity_picture
      ? `${process.env.HA_URL || "http://127.0.0.1:8123"}${state.attributes.entity_picture}`
      : null,
    isPlaying: state.state === "playing",
  });
}

export async function POST(req: Request) {
  const { service } = await req.json();
  const allowed = ["media_play", "media_pause", "media_next_track", "media_previous_track"];
  if (!allowed.includes(service)) {
    return NextResponse.json({ error: "invalid service" }, { status: 400 });
  }
  const ok = await callService("media_player", service, { entity_id: SPOTIFY_ENTITY });
  return NextResponse.json({ ok });
}
