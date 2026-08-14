import type { HAEntity } from "./homeassistant";
import { FAVORITE_COLORS } from "./colors";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

export const tools = [
  {
    type: "function",
    function: {
      name: "open_url",
      description:
        "Abre una página web en el navegador del usuario. Úsala cuando el usuario pida buscar algo, ver un video, o abrir un sitio (ej. YouTube, Instagram, una receta).",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL completa y válida a abrir" },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "control_device",
      description:
        "Enciende, apaga, o consulta el estado de un dispositivo domótico conectado en Home Assistant.",
      parameters: {
        type: "object",
        properties: {
          entity_id: { type: "string", description: "ID de la entidad en Home Assistant, ej. light.sala" },
          action: { type: "string", enum: ["turn_on", "turn_off", "get_state"] },
        },
        required: ["entity_id", "action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_scene",
      description:
        "Activa una escena de Home Assistant que agrupa varias acciones a la vez (ej. apagar toda la sala, prender el cuarto). Úsala cuando el usuario pida activar un grupo completo de dispositivos en vez de uno solo.",
      parameters: {
        type: "object",
        properties: {
          entity_id: { type: "string", description: "ID de la escena en Home Assistant, ej. scene.apagar_sala" },
        },
        required: ["entity_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_light_color",
      description:
        "Cambia el color de una luz de Home Assistant que soporte color. Úsala cuando el usuario pida poner una luz en un color específico (ej. 'pon la luz de la sala en azul').",
      parameters: {
        type: "object",
        properties: {
          entity_id: { type: "string", description: "ID de la luz en Home Assistant, ej. light.sala" },
          color_name: {
            type: "string",
            description: "Nombre del color en inglés (ej. red, blue, green, warm white, purple)",
          },
        },
        required: ["entity_id", "color_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_light_brightness",
      description:
        "Regula la intensidad (brillo) de una luz de Home Assistant, como la barra de porcentaje del panel. Úsala cuando el usuario pida bajar, subir, o poner un porcentaje específico de brillo.",
      parameters: {
        type: "object",
        properties: {
          entity_id: { type: "string", description: "ID de la luz en Home Assistant, ej. light.sala" },
          brightness_pct: { type: "number", description: "Porcentaje de brillo deseado, de 0 a 100" },
        },
        required: ["entity_id", "brightness_pct"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_favorite_light_color",
      description:
        "Aplica uno de los colores/ambientes favoritos predefinidos a una luz (ej. 'pon la luz de la sala en modo relax'). Úsala en vez de set_light_color cuando el usuario mencione uno de estos ambientes.",
      parameters: {
        type: "object",
        properties: {
          entity_id: { type: "string", description: "ID de la luz en Home Assistant, ej. light.sala" },
          favorite_name: {
            type: "string",
            enum: FAVORITE_COLORS.map((c) => c.name),
            description: "Nombre del color favorito predefinido",
          },
        },
        required: ["entity_id", "favorite_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "control_music",
      description:
        "Controla la reproducción de música en Spotify (a través de Home Assistant). Úsala cuando el usuario pida poner, pausar, o cambiar de canción.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["play", "pause", "next", "previous", "volume_up", "volume_down"],
          },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "play_music",
      description:
        "Busca y reproduce algo específico en Spotify (a través de Home Assistant), a diferencia de control_music que solo hace play/pause/next/previous/volumen sin especificar qué reproducir. Usa 'track' para una canción específica (ej. 'pon Bohemian Rhapsody'), 'artist' para poner lo más popular de un artista (ej. 'pon Bad Bunny'), 'playlist' para una playlist por nombre (ej. 'pon mi playlist de rock', 'pon Discover Weekly'), o 'album' para un álbum específico (ej. 'pon el álbum Dark Side of the Moon').",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Lo que el usuario quiere escuchar, ej. 'Bad Bunny', 'Bohemian Rhapsody', 'Discover Weekly' o 'Dark Side of the Moon'" },
          type: {
            type: "string",
            enum: ["track", "artist", "playlist", "album"],
            description: "Tipo de contenido: canción, artista, playlist o álbum",
          },
        },
        required: ["query", "type"],
      },
    },
  },
];

type ChatMessage = { role: string; content: string };

function formatEntityList(entities: HAEntity[]) {
  return entities.map((e) => `${e.friendly_name} → ${e.entity_id}`).join("\n");
}

export async function askDeepSeek(
  messages: ChatMessage[],
  lang: "es" | "en",
  entities: HAEntity[] = [],
  scenes: HAEntity[] = []
) {
  let systemPrompt =
    lang === "es"
      ? "Eres Luna, un asistente de voz para el hogar. Responde breve y natural, en español, en texto plano, si emojis, sin negritas, sin markdown ni formato especial porque tu respuesta se va a leer e voz alta. Si el usuario pide algo domótico o web, usa las herramientas disponibles. Puedes subir o bajar el volumen de la música con control_music (volume_up, volume_down), y puedes reproducir una canción, artista, playlist o álbum específico por nombre con play_music; la música sigue automáticamente con contenido similar después de que termina lo que se pidió, en vez de detenerse."
      : "You are Luna, a home voice assistant. Reply briefly and naturally, in English, in plain text with no emojis, no bold, no markdown or special formatting, since your response will be read aloud.. Use the available tools for smart-home or web requests. You can raise or lower the music volume with control_music (volume_up, volume_down), and you can play a specific song, artist, playlist or album by name with play_music; the music automatically continues with similar content afterward instead of stopping.";

  if (entities.length) {
    systemPrompt +=
      lang === "es"
        ? `\n\nDispositivos controlables disponibles (nombre → entity_id):\n${formatEntityList(entities)}\nUsa siempre el entity_id exacto de esta lista con la herramienta control_device. No inventes ni uses nombres antiguos.`
        : `\n\nAvailable controllable devices (name → entity_id):\n${formatEntityList(entities)}\nAlways use the exact entity_id from this list with the control_device tool. Don't guess or use outdated names.`;
  }

  if (scenes.length) {
    systemPrompt +=
      lang === "es"
        ? `\n\nEscenas disponibles (nombre → entity_id):\n${formatEntityList(scenes)}\nUsa siempre el entity_id exacto de esta lista con la herramienta run_scene.`
        : `\n\nAvailable scenes (name → entity_id):\n${formatEntityList(scenes)}\nAlways use the exact entity_id from this list with the run_scene tool.`;
  }

  const favoriteNames = FAVORITE_COLORS.map((c) => c.name).join(", ");
  systemPrompt +=
    lang === "es"
      ? `\n\nColores favoritos disponibles para set_favorite_light_color: ${favoriteNames}.`
      : `\n\nAvailable favorite colors for set_favorite_light_color: ${favoriteNames}.`;

  const now = new Intl.DateTimeFormat(lang === "es" ? "es-EC" : "en-US", {
    timeZone: "America/Guayaquil",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());
  systemPrompt +=
    lang === "es" ? `\n\nFecha y hora actual: ${now}.` : `\n\nCurrent date and time: ${now}.`;

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      tools,
    }),
  });

  if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`);
  return res.json();
}
