import { NextResponse } from "next/server";
import { askDeepSeek } from "@/lib/deepseek";
import { callService, getState, getControllableEntities, getScenes, SPOTIFY_ENTITY } from "@/lib/homeassistant";
import { FAVORITE_COLORS } from "@/lib/colors";
import { searchSpotify } from "@/lib/spotify";

const MUSIC_SERVICE: Record<string, string> = {
  play: "media_play",
  pause: "media_pause",
  next: "media_next_track",
  previous: "media_previous_track",
};

// Dominios permitidos para que Luna pueda abrir links por seguridad.
const ALLOWED_DOMAINS = ["youtube.com", "google.com", "instagram.com", "spotify.com", "wikipedia.org"];

function isAllowedUrl(url: string) {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some((d) => hostname.endsWith(d));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const { messages, lang } = await req.json();

  try {
    const [entities, scenes] = await Promise.all([getControllableEntities(), getScenes()]);
    const completion = await askDeepSeek(messages, lang, entities, scenes);
    const choice = completion.choices?.[0]?.message;

    let action: { type: string; url?: string } | null = null;
    let reply: string = choice?.content ?? "";

    const toolCalls = choice?.tool_calls ?? [];
    for (const call of toolCalls) {
      const args = JSON.parse(call.function.arguments || "{}");

      if (call.function.name === "open_url" && isAllowedUrl(args.url)) {
        action = { type: "open_url", url: args.url };
        if (!reply) reply = lang === "es" ? "Abriendo eso." : "Opening that.";
      }

      if (call.function.name === "control_device") {
        if (args.action === "turn_on" || args.action === "turn_off") {
          await callService("homeassistant", args.action, { entity_id: args.entity_id });
        }
        if (!reply) reply = lang === "es" ? "Hecho." : "Done.";
      }

      if (call.function.name === "set_light_color") {
        await callService("light", "turn_on", { entity_id: args.entity_id, color_name: args.color_name });
        if (!reply) reply = lang === "es" ? "Color cambiado." : "Color changed.";
      }

      if (call.function.name === "set_light_brightness") {
        const brightnessPct = Math.max(0, Math.min(100, Math.round(args.brightness_pct)));
        await callService("light", "turn_on", { entity_id: args.entity_id, brightness_pct: brightnessPct });
        if (!reply) reply = lang === "es" ? "Brillo ajustado." : "Brightness adjusted.";
      }

      if (call.function.name === "set_favorite_light_color") {
        const favorite = FAVORITE_COLORS.find((c) => c.name === args.favorite_name);
        if (favorite) {
          await callService("light", "turn_on", {
            entity_id: args.entity_id,
            ...(favorite.rgb_color ? { rgb_color: favorite.rgb_color } : { color_name: favorite.color_name }),
            ...(favorite.brightness_pct !== undefined ? { brightness_pct: favorite.brightness_pct } : {}),
          });
        }
        if (!reply) reply = lang === "es" ? "Color aplicado." : "Color applied.";
      }

      if (call.function.name === "run_scene") {
        await callService("scene", "turn_on", { entity_id: args.entity_id });
        if (!reply) reply = lang === "es" ? "Escena activada." : "Scene activated.";
      }

      if (call.function.name === "control_music") {
        if (args.action === "volume_up" || args.action === "volume_down") {
          const state = await getState(SPOTIFY_ENTITY);
          const currentVolume = state?.attributes?.volume_level ?? 0.5;
          const delta = args.action === "volume_up" ? 0.1 : -0.1;
          const newVolume = Math.max(0, Math.min(1, currentVolume + delta));
          await callService("media_player", "volume_set", { entity_id: SPOTIFY_ENTITY, volume_level: newVolume });
        } else {
          const service = MUSIC_SERVICE[args.action];
          if (service) {
            await callService("media_player", service, { entity_id: SPOTIFY_ENTITY });
          }
        }
        if (!reply) reply = lang === "es" ? "Listo." : "Done.";
      }

      if (call.function.name === "play_music") {
        const result = await searchSpotify(args.query, args.type);
        if (!result) {
          if (!reply) {
            const labelEs: Record<string, string> = { track: "esa canción", artist: "ese artista", playlist: "esa playlist", album: "ese álbum" };
            const labelEn: Record<string, string> = { track: "song", artist: "artist", playlist: "playlist", album: "album" };
            reply =
              lang === "es"
                ? `No encontré ${labelEs[args.type] ?? "eso"}.`
                : `I couldn't find that ${labelEn[args.type] ?? "content"}.`;
          }
        } else {
          const played = await callService("media_player", "play_media", {
            entity_id: SPOTIFY_ENTITY,
            media_content_id: result.uri,
            media_content_type: args.type,
          });
          if (!reply) {
            reply = played
              ? lang === "es"
                ? `Poniendo ${result.name}.`
                : `Playing ${result.name}.`
              : lang === "es"
              ? "No pude reproducir eso."
              : "I couldn't play that.";
          }
        }
      }
    }

    return NextResponse.json({ reply, action });
  } catch (e) {
    return NextResponse.json(
      { reply: lang === "es" ? "Tuve un problema conectando con DeepSeek." : "I had trouble reaching DeepSeek." },
      { status: 200 }
    );
  }
}
